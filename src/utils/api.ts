import { TokenService } from "@/services/token.services";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function fetchWithAuth<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  if (!skipAuth) {
    let accessToken = TokenService.getAccessToken();

    // Check if token exists and is expired
    if (accessToken && TokenService.isTokenExpired(accessToken)) {
      try {
        accessToken = await TokenService.refreshAccessToken();
      } catch (error) {
        TokenService.clearTokens();
        window.location.href = "/signin";
        throw new Error("Session expired");
      }
    }

    // Add token to headers if it exists
    if (accessToken) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }
  }

  // Add default headers
  fetchOptions.headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
      fetchOptions,
    );

    // Handle 401 errors
    if (response.status === 401) {
      try {
        const newToken = await TokenService.refreshAccessToken();
        const newOptions = {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };

        const retryResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
          newOptions,
        );
        if (!retryResponse.ok) {
          throw new Error("Request failed after token refresh");
        }

        return retryResponse.json();
      } catch (error) {
        TokenService.clearTokens();
        window.location.href = "/signin";
        throw new Error("Session expired");
      }
    }

    if (!response.ok) {
      throw new Error("API request failed");
    }

    return response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
