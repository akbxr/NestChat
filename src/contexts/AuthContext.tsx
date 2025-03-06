"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TokenService, TokenData } from "@/services/token.services";
import { fetchWithAuth } from "@/utils/api";
import { ClientEncryption } from "@/utils/encryption";
import { KeyDatabase } from "@/utils/db";

interface User {
  id: string;
  username: string;
  email: string;
  picture?: string;
  provider?: string;
  publicKey: string;
  secretKey: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  publicKey: string | null;
  login: (tokens: TokenData, userData?: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const generateKeys = async (userId: string) => {
    try {
      // Check for existing keys in IndexedDB
      const existingKeys = await KeyDatabase.getKeys(userId);
      if (existingKeys) {
        setPublicKey(existingKeys.publicKey);
        return existingKeys.publicKey;
      }

      // Generate new keys if none exist
      const keyPair = await ClientEncryption.generateKeyPair();
      await KeyDatabase.saveKeys(userId, keyPair);
      setPublicKey(keyPair.publicKey);
      return keyPair.publicKey;
    } catch (error) {
      console.error("Error generating keys:", error);
      throw error;
    }
  };

  const checkAuth = async () => {
    try {
      const accessToken = TokenService.getAccessToken();

      if (!accessToken) {
        setUser(null);
        return;
      }

      if (TokenService.isTokenExpired(accessToken)) {
        try {
          await TokenService.refreshAccessToken();
        } catch {
          setUser(null);
          return;
        }
      }

      const userData = await fetchWithAuth<User>("/users/me");
      setUser(userData);

      // Generate keys if needed
      if (!publicKey && userData.id) {
        await generateKeys(userData.id);
      }
    } catch {
      setUser(null);
      TokenService.clearTokens();
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (tokens: TokenData, userData?: User) => {
    try {
      TokenService.setTokens(tokens);

      let currentUser = userData;
      if (!currentUser) {
        currentUser = await fetchWithAuth<User>("/users/me");
      }

      if (!currentUser?.id) {
        throw new Error("User ID not found");
      }

      // Generate and store keys
      const generatedPublicKey = await generateKeys(currentUser.id);

      // Send public key to server
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/public-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access_token}`,
        },
        body: JSON.stringify({ publicKey: generatedPublicKey }),
      });

      setUser(currentUser);
    } catch (error) {
      console.error("Login error:", error);
      await logout();
    }
  };

  const logout = async () => {
    try {
      if (user?.id) {
        await KeyDatabase.deleteKeys(user.id);
      }
      TokenService.clearTokens();
      setUser(null);
      setPublicKey(null);
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
      TokenService.clearTokens();
      setUser(null);
      setPublicKey(null);
      router.push("/signin");
    }
  };

  useEffect(() => {
    checkAuth();

    // Cleanup function
    return () => {
      // if (user?.id) {
      //   KeyDatabase.deleteKeys(user.id).catch(console.error);
      // }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, publicKey, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export type { User, TokenData };
