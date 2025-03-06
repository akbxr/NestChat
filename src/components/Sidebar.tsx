"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/utils/api";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export function Sidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const data = await fetchWithAuth<Chat[]>("/chat");
        setChats(data);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load chats",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  if (loading) {
    return (
      <div className="w-80 border-r border-gray-200 bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 border-r border-gray-200 bg-gray-50 p-4">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-blue-500 hover:text-blue-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-gray-200 bg-gray-50">
      <div className="p-4">
        <h2 className="text-xl font-semibold">Messages</h2>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-5rem)]">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className={`block p-4 hover:bg-gray-100 ${
                pathname === `/chat/${chat.id}` ? "bg-gray-100" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{chat.name}</h3>
                  <p className="text-sm text-gray-500">{chat.lastMessage}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {chat.timestamp}
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">No messages yet</div>
        )}
      </div>
    </div>
  );
}
