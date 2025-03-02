"use client";

import { useState } from "react";
import { fetchWithAuth } from "@/utils/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X, Search } from "lucide-react";

interface SearchUser {
  username: string;
}

interface SearchUsersProps {
  onUserSelect: (username: string) => void;
  onClose: () => void;
}

export default function SearchUsers({
  onUserSelect,
  onClose,
}: SearchUsersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const results = await fetchWithAuth<SearchUser[]>(
        `/users/search?username=${encodeURIComponent(searchQuery)}`,
      );
      console.log("Search results:", results);
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Failed to search for users");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 h-full flex flex-col">
      <header className="bg-blue-500 dark:bg-blue-600 text-white p-4 flex items-center justify-between">
        <h2 className="font-semibold">Find Users</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>

      <div className="p-4 flex items-center space-x-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username"
          className="flex-1"
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && <div className="p-4 text-red-500">{error}</div>}

        {searchResults.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {searchResults.map((user, index) => (
              <li
                key={index}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <button
                  onClick={() => onUserSelect(user.username)}
                  className="w-full text-left p-4 flex items-center space-x-3"
                >
                  <Avatar>
                    <AvatarFallback>
                      {user.username && user.username[0]
                        ? user.username[0].toUpperCase()
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.username}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : searchQuery && !isSearching ? (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
            No users found
          </div>
        ) : null}
      </div>
    </div>
  );
}
