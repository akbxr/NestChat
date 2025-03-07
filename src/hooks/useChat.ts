import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { ClientEncryption } from "@/utils/encryption";
import { KeyDatabase } from "@/utils/db";
import { Message, ChatKeys } from "@/types/chat";

export const useChat = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [keys, setKeys] = useState<{
    publicKey: string;
    secretKey: string;
  } | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initChat = async () => {
      try {
        if (!user?.id) return;

        // Try to get existing keys from IndexedDB
        let keyPair = await KeyDatabase.getKeys(user.id);

        // If no keys exist, generate new ones
        if (!keyPair) {
          keyPair = await ClientEncryption.generateKeyPair();
          await KeyDatabase.saveKeys(user.id, keyPair);
        }

        setKeys({
          publicKey: keyPair.publicKey,
          secretKey: keyPair.secretKey,
        });

        if (user?.id) {
          const token = localStorage.getItem("access_token");
          const newSocket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}`, {
            query: { userId: user.id, publicKey: keyPair.publicKey },
            auth: { token },
          });

          setSocket(newSocket);
          fetchMessages();

          return () => {
            newSocket.close();
          };
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
    };

    initChat();
    console.log("Current user:", user?.id);
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("keyExchange", ({ publicKey }: { publicKey: string }) => {
      setKeys((prevKeys) =>
        prevKeys ? { ...prevKeys, publicKey } : { publicKey, secretKey: "" },
      );
    });

    socket.on("newMessage", async (message: Message) => {
      if (!user?.id) return;

      try {
        // Get keys from IndexedDB
        const keys = await KeyDatabase.getKeys(user.id);
        if (!keys) {
          console.error("Encryption keys not found");
          return;
        }

        if (
          !message.encryptedMessage ||
          !message.nonce ||
          !message.senderPublicKey
        ) {
          throw new Error("Missing encryption data");
        }

        const decryptedContent = await ClientEncryption.decryptMessage(
          keys.secretKey,
          message.senderPublicKey,
          message.encryptedMessage,
          message.nonce,
        );

        setMessages((prev) => [
          ...prev,
          {
            ...message,
            message: decryptedContent,
          },
        ]);
      } catch (error) {
        console.error("Decryption failed:", {
          error,
          messageId: message.id,
          senderId: message.senderId,
        });
      }
    });

    socket.on("messageEdited", async (editedMessage: any) => {
      if (!user?.id) return;
      try {
        const keys = await KeyDatabase.getKeys(user.id);
        if (!keys) {
          console.error("Encryption keys not found");
          return;
        }

        console.log("Received edited message:", editedMessage);

        // Logic dekripsi berdasarkan peran (pengirim/penerima)
        let decryptedContent: string;

        if (editedMessage.senderId === user.id) {
          // Jika kita pengirim, gunakan recipient public key
          console.log("Decrypting as sender using recipient public key");
          decryptedContent = await ClientEncryption.decryptMessage(
            keys.secretKey,
            editedMessage.recipientPublicKey,
            editedMessage.encryptedMessage,
            editedMessage.nonce,
          );
        } else {
          // Jika kita penerima, gunakan sender public key
          console.log("Decrypting as receiver using sender public key");
          decryptedContent = await ClientEncryption.decryptMessage(
            keys.secretKey,
            editedMessage.senderPublicKey,
            editedMessage.encryptedMessage,
            editedMessage.nonce,
          );
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editedMessage.id
              ? {
                  ...editedMessage,
                  message: decryptedContent,
                  isEdited: true,
                  // editedAt: new Date(editedMessage.editedAt),
                }
              : msg,
          ),
        );
      } catch (error) {
        console.error("Failed to decrypt edited message:", error);
      }
    });

    socket.on("userConnected", ({ userId }) => {
      setOnlineUsers((prev) => [...prev, userId]);
    });

    socket.on("userDisconnected", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    socket.on("userTyping", ({ userId }) => {
      setTypingUsers((prev) => [...prev, userId]);
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      }, 8000);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", {
        message: error.message,
        details: error.details,
      });
    });

    return () => {
      socket.off("keyExchange");
      socket.off("newMessage");
      socket.off("messageEdited");
      socket.off("userConnected");
      socket.off("userDisconnected");
      socket.off("userTyping");
      socket.off("error");
    };
  }, [socket, user]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/recent`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      );
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }
  };

  const fetchChatHistory = useCallback(
    async (otherUserId: string) => {
      if (!user?.id) return;

      try {
        console.log("Getting keys for user:", user.id);
        const keys = await KeyDatabase.getKeys(user.id);
        if (!keys) {
          throw new Error("No encryption keys found");
        }

        console.log("Found keys:", {
          publicKey: keys.publicKey.substring(0, 10) + "...",
          hasSecretKey: !!keys.secretKey,
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversation/${otherUserId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch chat history");
        }

        const chatHistory = await response.json();
        console.log("Received chat history:", chatHistory);

        // Decrypt messages
        const decryptedMessages = await Promise.all(
          chatHistory.map(async (msg: any) => {
            try {
              const isOurMessage = msg.senderId === user.id;
              console.log("Decrypting message:", {
                id: msg.id,
                isOurMessage,
                senderId: msg.senderId,
                ourId: user.id,
              });

              const decryptedContent = await ClientEncryption.decryptMessage(
                keys.secretKey,
                isOurMessage ? msg.receiver.publicKey : msg.senderPublicKey,
                msg.encryptedMessage,
                msg.nonce,
              );

              return {
                ...msg,
                message: decryptedContent,
              };
            } catch (error) {
              console.error("Failed to decrypt message:", {
                id: msg.id,
              });
              return {
                ...msg,
                message: "[Encrypted Message]",
              };
            }
          }),
        );

        console.log("Decrypted messages:", decryptedMessages);
        setMessages(decryptedMessages);
      } catch (error) {
        console.error("Error in fetchChatHistory:", error);
      }
    },
    [user],
  );
  const sendMessage = useCallback(
    async (receiverId: string, message: string, recipientPublicKey: string) => {
      if (!user?.id || !socket) {
        throw new Error("Missing required data for sending message");
      }

      try {
        // Get keys from IndexedDB
        const keys = await KeyDatabase.getKeys(user.id);
        if (!keys) {
          throw new Error("Encryption keys not found");
        }

        const result = await ClientEncryption.encryptMessage(
          keys.secretKey,
          recipientPublicKey,
          message,
        );

        const messageData = {
          senderId: user.id,
          receiverId,
          encryptedMessage: result.encryptedMessage,
          nonce: result.nonce,
          senderPublicKey: keys.publicKey,
          recipientPublicKey,
        };

        // Emit dan tunggu response dari server yang berisi ID pesan
        return new Promise((resolve, reject) => {
          socket.emit("sendMessage", messageData, (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              // Response dari server berisi ID pesan yang valid
              resolve(response);
            }
          });
        });
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    [socket, keys, user],
  );

  const editMessage = useCallback(
    async (
      messageId: string,
      newContent: string,
      recipientPublicKey: string,
      receiverId: string,
    ) => {
      if (!socket || !user?.id) {
        throw new Error("Not connected");
      }

      try {
        const keys = await KeyDatabase.getKeys(user.id);
        if (!keys) {
          throw new Error("Encryption keys not found");
        }

        // Tetap gunakan public key penerima untuk enkripsi
        console.log(
          "Using recipient public key for encryption:",
          recipientPublicKey,
        );

        const result = await ClientEncryption.encryptMessage(
          keys.secretKey,
          recipientPublicKey, // Public key penerima untuk enkripsi
          newContent,
        );

        socket.emit("editMessage", {
          messageId,
          senderId: user.id,
          encryptedMessage: result.encryptedMessage,
          nonce: result.nonce,
          senderPublicKey: keys.publicKey, // Public key pengirim untuk identifikasi
          recipientPublicKey,
        });

        // Optimistic update untuk UI
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  message: newContent,
                  isEdited: true,
                  // editedAt: new Date(),
                }
              : msg,
          ),
        );
      } catch (error) {
        console.error("Failed to edit message:", error);
        throw error;
      }
    },
    [socket, user],
  );

  const sendTypingIndicator = useCallback(
    (receiverId: string) => {
      if (!socket || !receiverId) return;

      socket.emit("typing", {
        senderId: user?.id,
        receiverId,
      });
    },
    [socket, user],
  );

  const getConversation = useCallback(
    async (otherUserId: number) => {
      if (!socket) return;

      socket.emit("getConversation", {
        userId: user?.id,
        otherUserId,
      });
    },
    [socket, user],
  );

  return {
    messages,
    onlineUsers,
    typingUsers,
    setMessages,
    sendMessage,
    editMessage,
    getConversation,
    sendTypingIndicator,
    isConnected: !!socket,
    publicKey: keys?.publicKey,
    fetchChatHistory,
  };
};
