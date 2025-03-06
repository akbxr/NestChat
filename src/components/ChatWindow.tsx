"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { Message } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, MoreVertical, Trash, Edit, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatWindowProps {
  recipientId: string;
  recipientPublicKey: string;
  recipientUsername: string;
  recipientPicture?: string;
  onClose: () => void;
}

export default function ChatWindow({
  recipientId,
  recipientPublicKey,
  recipientUsername,
  recipientPicture,
  onClose,
}: ChatWindowProps) {
  const { user } = useAuth();
  const {
    messages: chatMessages,
    sendMessage,
    setMessages,
    editMessage,
    sendTypingIndicator,
    isConnected,
    fetchChatHistory,
  } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        await fetchChatHistory(recipientId);
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    loadChatHistory();
  }, [recipientId, fetchChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const filteredMessages =
    chatMessages?.filter(
      (msg) =>
        (msg?.senderId === user?.id && msg?.receiverId === recipientId) ||
        (msg?.senderId === recipientId && msg?.receiverId === user?.id),
    ) || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    try {
      const tempId = `temp-${uuidv4()}`;
      const tempMessage: Message = {
        id: tempId,
        senderId: user!.id,
        receiverId: recipientId,
        message: newMessage,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, tempMessage]);

      const serverResponse = await sendMessage(
        recipientId,
        newMessage,
        recipientPublicKey,
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...msg, serverResponse, message: newMessage }
            : msg,
        ),
      );

      setNewMessage("");
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
      setError("Failed to send message");
    }
  };

  const handleEdit = (message: Message) => {
    if (!message.id) return;
    setEditingMessageId(message.id);
    setEditContent(message.message || "");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!messageId) return;

    try {
      await editMessage(
        messageId,
        editContent,
        recipientPublicKey,
        recipientId,
      );
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to save edit:", error);
      setError("Failed to edit message");
    }
  };

  // Modified delete handler to properly handle empty response
  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId || messageId.startsWith("temp-")) {
      setError("Cannot delete this message");
      return;
    }

    try {
      setIsDeletingMessage(true);

      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.ok) {
        // Remove the message from the local state
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } else {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete message: ${errorText || response.status}`,
        );
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      setError("Failed to delete message");
    } finally {
      setIsDeletingMessage(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col">
      {/* Chat Header with Profile Picture */}
      <header className="bg-blue-500 dark:bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Avatar>
            {recipientPicture ? (
              <AvatarImage src={recipientPicture} alt={recipientUsername} />
            ) : (
              <AvatarFallback>{recipientUsername[0]}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{recipientUsername}</span>
            <span className="text-xs text-blue-100 opacity-75">
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-6 w-6" />
        </Button>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMessages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex items-start ${
              message.senderId === user?.id ? "justify-end" : "justify-start"
            }`}
          >
            {/* Show Avatar for incoming messages */}
            {message.senderId !== user?.id && (
              <Avatar className="mr-2 h-8 w-8">
                {recipientPicture ? (
                  <AvatarImage src={recipientPicture} alt={recipientUsername} />
                ) : (
                  <AvatarFallback>{recipientUsername[0]}</AvatarFallback>
                )}
              </Avatar>
            )}

            {/* Message actions menu (now on left side of outgoing messages) */}
            {message.senderId === user?.id &&
              !message.id.startsWith("temp-") && (
                <div className="mr-2 flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-gray-500 dark:text-gray-400">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleEdit(message)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-red-500 focus:text-red-500"
                        disabled={isDeletingMessage}
                      >
                        <Trash className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

            <div className="max-w-[75%]">
              {editingMessageId === message.id ? (
                <div className="flex flex-col space-y-2">
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleSaveEdit(message.id)}
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingMessageId(null)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.senderId === user?.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 dark:text-white"
                  }`}
                >
                  <p className="break-words">{message.message}</p>
                  {message.isEdited && (
                    <span className="text-xs opacity-75">(edited)</span>
                  )}
                  <span className="text-xs opacity-75 block">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={() => sendTypingIndicator(recipientId)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        {error && (
          <div className="text-red-500 text-sm mt-2 flex items-center justify-between">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-red-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
