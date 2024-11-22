import { jwtDecode } from "jwt-decode";

export interface TokenData {
  access_token: string;
  refresh_token: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  exp: number;
}

export class TokenService {
  private static ACCESS_TOKEN_KEY = "access_token";
  private static REFRESH_TOKEN_KEY = "refresh_token";

  static setTokens(tokens: TokenData) {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      // Check if token will expire in the next 30 seconds
      return decoded.exp * 1000 <= Date.now() + 30000;
    } catch {
      return true;
    }
  }

  static async refreshAccessToken(): Promise<string> {
    const refresh_token = this.getRefreshToken();

    if (!refresh_token) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data: TokenData = await response.json();
      this.setTokens(data);
      return data.access_token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }
}
