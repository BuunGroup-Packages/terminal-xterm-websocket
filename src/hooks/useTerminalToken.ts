import { useState, useEffect, useCallback, useRef } from 'react';

interface TokenResponse {
  token: string;
  expiresAt: number;
  sessionId: string;
}

interface UseTerminalTokenReturn {
  token: string | null;
  sessionId: string | null;
  expiresAt: Date | null;
  isLoading: boolean;
  error: string | null;
  isExpired: boolean;
  refreshToken: () => Promise<void>;
}

export function useTerminalToken(apiUrl: string): UseTerminalTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const expiryCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsExpired(false);

      const response = await fetch(`${apiUrl}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.status}`);
      }

      const data: TokenResponse = await response.json();

      setToken(data.token);
      setSessionId(data.sessionId);
      setExpiresAt(new Date(data.expiresAt));

      console.log(`[Token] Session ${data.sessionId} expires at ${new Date(data.expiresAt).toLocaleTimeString()}`);

      // Set up expiry check
      if (expiryCheckRef.current) {
        clearInterval(expiryCheckRef.current);
      }

      expiryCheckRef.current = setInterval(() => {
        if (data.expiresAt < Date.now()) {
          setIsExpired(true);
          if (expiryCheckRef.current) {
            clearInterval(expiryCheckRef.current);
          }
        }
      }, 1000);
    } catch (err) {
      console.error('[Token] Error fetching token:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch token');
      setToken(null);
      setSessionId(null);
      setExpiresAt(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  // Initial token fetch
  useEffect(() => {
    fetchToken();

    return () => {
      if (expiryCheckRef.current) {
        clearInterval(expiryCheckRef.current);
      }
    };
  }, [fetchToken]);

  return {
    token,
    sessionId,
    expiresAt,
    isLoading,
    error,
    isExpired,
    refreshToken: fetchToken,
  };
}
