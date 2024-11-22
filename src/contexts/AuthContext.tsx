"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TokenService, TokenData } from "@/services/token.services";
import { fetchWithAuth } from "@/utils/api";

interface User {
  id: string;
  username: string;
  email: string;
  picture?: string;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (tokens: TokenData, userData?: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    } catch {
      setUser(null);
      TokenService.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (tokens: TokenData) => {
    TokenService.setTokens(tokens);
    await checkAuth();
  };

  const logout = async () => {
    TokenService.clearTokens();
    setUser(null);
    router.push("/sigin");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
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
