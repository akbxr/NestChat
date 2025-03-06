import { useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";

interface ChatProps {
  userId: string;
  receiverId: string;
}

export const Chat: React.FC<ChatProps> = ({ userId, receiverId }) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { messages, sendMessage, publicKey, onlineUsers, sendTypingIndicator } =
    useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      sendMessage(receiverId, message, publicKey || "");
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  useEffect(() => {
    if (isTyping && receiverId) {
      sendTypingIndicator(receiverId);
    }
  }, [isTyping, receiverId, sendTypingIndicator]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setIsTyping(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 ${msg.senderId ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.senderId ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {msg.message}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {/* {new Date(msg.createdAt).toLocaleTimeString()} */}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-gray-500 text-sm">User is typing...</div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={handleChange}
            className="flex-1 border rounded-l p-2"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 rounded-r"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
