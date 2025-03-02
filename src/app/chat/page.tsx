"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/hooks/useChat";
import { fetchWithAuth } from "@/utils/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Menu, Search } from "lucide-react";
import ChatWindow from "@/components/ChatWindow";
import { ClientEncryption } from "@/utils/encryption";
import { KeyDatabase } from "@/utils/db";
import SearchUsers from "@/components/SearchUsers";

interface User {
  id: string;
  username: string;
  publicKey: string;
  picture?: string;
}

interface RecentChatUser {
  user: {
    id: string;
    username: string;
    email?: string;
    picture?: string;
  };
  lastMessage: {
    id: string;
    message: string;
    nonce: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  };
  lastMessageAt: string;
}

interface SelectedRecipient {
  id: string;
  publicKey: string;
  username: string;
  picture?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { onlineUsers } = useChat();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [recentChatUsers, setRecentChatUsers] = useState<RecentChatUser[]>([]);
  const [selectedRecipient, setSelectedRecipient] =
    useState<SelectedRecipient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messagePreview, setMessagePreview] = useState<{
    [userId: string]: string;
  }>({});
  const [showSearch, setShowSearch] = useState(false);

  const [keys, setKeys] = useState<{
    publicKey: string;
    secretKey: string;
  } | null>(null);

  useEffect(() => {
    const loadKeys = async () => {
      if (!user?.id) return;

      try {
        const userKeys = await KeyDatabase.getKeys(user.id.toString());

        if (userKeys) {
          console.log("Keys loaded successfully from IndexedDB");
          setKeys(userKeys);
        } else {
          console.warn("No keys found in IndexedDB for user:", user.id);
          setError("Encryption keys not found. Please login again.");
        }
      } catch (error) {
        console.error("Failed to load keys from IndexedDB:", error);
      }
    };

    if (user) {
      loadKeys();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await fetchWithAuth<User[]>("/users");
        setAllUsers(data.filter((u: User) => u?.id !== user?.id));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Fetch recent chat users
  const fetchRecentChatUsers = useCallback(async () => {
    if (!user) return;

    try {
      const data = await fetchWithAuth<RecentChatUser[]>("/chat/recent-users");
      console.log("Recent chat users data:", data);
      setRecentChatUsers(data);

      const initialPreviews: { [userId: string]: string } = {};
      data.forEach((chatData) => {
        if (!chatData.lastMessage?.message) {
          initialPreviews[chatData.user.id] = "No messages";
        } else if (chatData.lastMessage.senderId === user.id) {
          initialPreviews[chatData.user.id] = `You: [loading...]`;
        } else {
          initialPreviews[chatData.user.id] = "[loading...]";
        }
      });

      setMessagePreview(initialPreviews);
      return data;
    } catch (err) {
      setError("Failed to load recent chat users");
      console.error("Error fetching recent chat users:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch of recent chat users
  useEffect(() => {
    if (user) {
      fetchRecentChatUsers();
    }
  }, [user, fetchRecentChatUsers]);

  const handleCloseChat = useCallback(async () => {
    if (selectedRecipient) {
      await markMessagesAsRead(selectedRecipient.id);
      setSelectedRecipient(null);

      // Refresh chat list to update read status
      fetchRecentChatUsers();
    }
  }, [selectedRecipient, fetchRecentChatUsers]);

  const markMessagesAsRead = async (recipientId: string) => {
    try {
      await fetchWithAuth(`/chat/mark-read/${recipientId}`, {
        method: "PUT",
      });

      setRecentChatUsers((prev) =>
        prev.map((chat): RecentChatUser => {
          if (chat.user.id === recipientId && chat.lastMessage) {
            return {
              ...chat,
              lastMessage: {
                ...chat.lastMessage,
                isRead: true,
              },
            };
          }
          return chat;
        }),
      );
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  // Decrypt message for a specific user
  const decryptMessage = useCallback(
    async (userId: string) => {
      try {
        if (!keys?.secretKey) return;

        const chatData = recentChatUsers.find((c) => c.user.id === userId);
        if (!chatData?.lastMessage?.message) return;

        // If message sent by current user
        if (chatData.lastMessage.senderId === user?.id) {
          setMessagePreview((prev) => ({
            ...prev,
            [userId]: `You: [sent message]`,
          }));
          return;
        }

        // Find sender data
        const sender = allUsers.find(
          (u) => u.id === chatData.lastMessage.senderId,
        );
        if (!sender) return;

        // Decrypt message
        try {
          const decrypted = await ClientEncryption.decryptMessage(
            keys.secretKey,
            sender.publicKey,
            chatData.lastMessage.message,
            chatData.lastMessage.nonce,
          );

          setMessagePreview((prev) => ({
            ...prev,
            [userId]: decrypted,
          }));
        } catch (err) {
          console.error("Decryption failed:", err);
          setMessagePreview((prev) => ({
            ...prev,
            [userId]: "[encrypted message]",
          }));
        }
      } catch (error) {
        console.error("Error in decryptMessage:", error);
      }
    },
    [keys, recentChatUsers, allUsers, user?.id],
  );

  // Auto-decrypt all messages when data is available
  useEffect(() => {
    const autoDecryptMessages = async () => {
      if (!keys?.secretKey || !recentChatUsers.length || !allUsers.length)
        return;

      for (const chatData of recentChatUsers) {
        await decryptMessage(chatData.user.id);
      }
    };

    autoDecryptMessages();
  }, [keys, recentChatUsers, allUsers, decryptMessage]);

  // Also run decryption when selected recipient changes
  useEffect(() => {
    if (selectedRecipient && keys?.secretKey) {
      // Mark messages as read
      markMessagesAsRead(selectedRecipient.id);
    }
  }, [selectedRecipient, keys]);

  // Handle selecting a user from search results
  const handleSearchUserSelect = (username: string) => {
    console.log("User selected from search:", username);

    // Find if we already have user data with this username
    const userData = allUsers.find((u) => u.username === username);

    if (userData) {
      setSelectedRecipient({
        id: userData.id,
        publicKey: userData.publicKey,
        username: userData.username,
        picture: userData.picture,
      });
      setShowSearch(false);
    } else {
      // If user not in our list, we need to fetch their details by username
      fetchWithAuth<User>(`/users/${username}`)
        .then((userDetails) => {
          if (userDetails) {
            setSelectedRecipient({
              id: userDetails.id,
              publicKey: userDetails.publicKey,
              username: userDetails.username,
              picture: userDetails.picture,
            });
            setShowSearch(false);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch user details:", err);
          setError("Failed to load user details");
        });
    }
  };
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen">
      {/* Sidebar with contacts */}
      <aside
        className={`w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-900 border-r dark:border-gray-700
        ${selectedRecipient ? "hidden md:block" : "block"}`}
      >
        <header className="bg-blue-500 dark:bg-blue-600 text-white p-4 flex items-center justify-between md:justify-start md:space-x-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-semibold">Chats</span>
          <Button
            variant="ghost"
            size="icon"
            className="md:ml-auto"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-6 w-6" />
          </Button>
        </header>

        {/* Search Users Panel */}
        {showSearch && (
          <div className="absolute inset-0 z-10 bg-white dark:bg-gray-900 md:inset-y-0 md:left-0 md:w-1/3 lg:w-1/4">
            <SearchUsers
              onUserSelect={handleSearchUserSelect}
              onClose={() => setShowSearch(false)}
            />
          </div>
        )}

        {/* Display error if there is one */}
        {error && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <ul className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto h-[calc(100vh-64px)]">
          {recentChatUsers.length > 0 ? (
            recentChatUsers.map((chatData) => {
              const userData = allUsers.find((u) => u.id === chatData.user.id);
              if (!userData) return null;

              return (
                <li
                  key={chatData.user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <button
                    className="w-full text-left p-4 flex items-center space-x-3"
                    onClick={() => {
                      setSelectedRecipient({
                        id: chatData.user.id,
                        publicKey: userData.publicKey,
                        username: chatData.user.username,
                        picture: chatData.user.picture || userData.picture,
                      });
                    }}
                  >
                    <Avatar>
                      {/* Use AvatarImage if picture exists */}
                      {chatData.user.picture ? (
                        <AvatarImage
                          src={chatData.user.picture}
                          alt={chatData.user.username}
                        />
                      ) : (
                        <AvatarFallback>
                          {chatData.user.username[0].toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {chatData.user.username}
                        </p>
                        {onlineUsers.includes(chatData.user.id) ? (
                          <span className="text-green-500 text-xs">●</span>
                        ) : (
                          <span className="text-gray-400 text-xs">●</span>
                        )}
                      </div>

                      {/* Show preview message */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {messagePreview[chatData.user.id] || "No message"}
                      </p>

                      {/* Badge "New message" */}
                      {chatData.lastMessage &&
                        !chatData.lastMessage.isRead &&
                        chatData.lastMessage.senderId !== user.id && (
                          <p className="text-[10px] font-semibold text-green-500 mt-1">
                            New message
                          </p>
                        )}
                    </div>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="p-4 text-gray-500">No messages yet</li>
          )}
        </ul>
      </aside>

      {/* Main chat area */}
      {selectedRecipient ? (
        <ChatWindow
          recipientId={selectedRecipient.id}
          recipientPublicKey={selectedRecipient.publicKey}
          recipientUsername={selectedRecipient.username}
          onClose={handleCloseChat}
          recipientPicture={selectedRecipient.picture}
        />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
          Select a user to start chatting
        </div>
      )}
    </div>
  );
}
