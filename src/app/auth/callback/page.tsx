"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TokenData, User } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const userData = searchParams.get("user");
    const error = searchParams.get("error");

    const handleCallback = async () => {
      try {
        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        if (!accessToken || !refreshToken) {
          throw new Error("Invalid token data received");
        }

        const tokens: TokenData = {
          access_token: accessToken,
          refresh_token: refreshToken,
        };

        let user: User | undefined;
        if (userData) {
          user = JSON.parse(decodeURIComponent(userData));
        }

        await login(tokens, user);
        router.push("/chat");
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push(
          `/login?error=${encodeURIComponent(
            error instanceof Error ? error.message : "Authentication failed",
          )}`,
        );
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Logging you in...</h2>
        <p className="text-gray-500">
          Please wait while we complete the authentication
        </p>
      </div>
    </div>
  );
}
