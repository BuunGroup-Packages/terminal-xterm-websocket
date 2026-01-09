/**
 * Multi-session terminal management hook
 *
 * Features:
 * - Multiple concurrent terminal sessions
 * - Auto-refresh tokens 30s before expiry
 * - Shell type per session
 * - Tab renaming support
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TerminalSession, TokenResponse, ShellType } from '../types';
import { DEFAULT_SHELL } from '../config/shells';

interface UseTerminalSessionsReturn {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  addSession: (shellType?: ShellType) => Promise<TerminalSession | null>;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<TerminalSession>) => void;
  markSessionExpired: (id: string) => void;
  refreshSession: (id: string) => Promise<TerminalSession | null>;
  renameSession: (id: string, name: string) => void;
  changeSessionShell: (id: string, shellType: ShellType) => void;
}

// Session counter for unique tab names
let sessionCounter = 0;

// Auto-refresh buffer (refresh 30s before expiry)
const REFRESH_BUFFER_MS = 30000;

export function useTerminalSessions(apiUrl: string): UseTerminalSessionsReturn {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Track refresh timeouts per session
  const refreshTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      refreshTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      refreshTimeouts.current.clear();
    };
  }, []);

  // Fetch token from API
  const fetchToken = useCallback(async (): Promise<TokenResponse | null> => {
    try {
      const response = await fetch(`${apiUrl}/api/token`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to fetch token');
      return await response.json();
    } catch (err) {
      console.error('Failed to fetch token:', err);
      return null;
    }
  }, [apiUrl]);

  // Schedule auto-refresh for a session
  const scheduleAutoRefresh = useCallback((sessionId: string, expiresAt: Date) => {
    // Clear existing timeout
    const existingTimeout = refreshTimeouts.current.get(sessionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeUntilRefresh = expiresAt.getTime() - Date.now() - REFRESH_BUFFER_MS;

    if (timeUntilRefresh > 0) {
      const timeout = setTimeout(async () => {
        console.log(`[${sessionId}] Auto-refreshing token (30s before expiry)`);

        const tokenData = await fetchToken();
        if (tokenData) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    token: tokenData.token,
                    sessionId: tokenData.sessionId,
                    expiresAt: new Date(tokenData.expiresAt),
                  }
                : s
            )
          );

          // Schedule next refresh
          scheduleAutoRefresh(sessionId, new Date(tokenData.expiresAt));
        }
      }, timeUntilRefresh);

      refreshTimeouts.current.set(sessionId, timeout);
    }
  }, [fetchToken]);

  // Add new session
  const addSession = useCallback(async (shellType: ShellType = DEFAULT_SHELL): Promise<TerminalSession | null> => {
    const tokenData = await fetchToken();
    if (!tokenData) return null;

    sessionCounter++;
    const newSession: TerminalSession = {
      id: `tab-${sessionCounter}`,
      token: tokenData.token,
      sessionId: tokenData.sessionId,
      expiresAt: new Date(tokenData.expiresAt),
      name: `Terminal ${sessionCounter}`,
      isActive: true,
      isExpired: false,
      isConnected: false,
      shellType,
    };

    setSessions((prev) => {
      const updated = prev.map((s) => ({ ...s, isActive: false }));
      return [...updated, newSession];
    });

    setActiveSessionId(newSession.id);

    // Schedule auto-refresh
    scheduleAutoRefresh(newSession.id, newSession.expiresAt);

    return newSession;
  }, [fetchToken, scheduleAutoRefresh]);

  // Remove session
  const removeSession = useCallback((id: string) => {
    // Clear refresh timeout
    const timeout = refreshTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      refreshTimeouts.current.delete(id);
    }

    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);

      if (activeSessionId === id && filtered.length > 0) {
        const newActive = filtered[filtered.length - 1];
        newActive.isActive = true;
        setActiveSessionId(newActive.id);
      } else if (filtered.length === 0) {
        setActiveSessionId(null);
      }

      return filtered;
    });
  }, [activeSessionId]);

  // Set active session
  const setActiveSession = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        isActive: s.id === id,
      }))
    );
    setActiveSessionId(id);
  }, []);

  // Update session
  const updateSession = useCallback((id: string, updates: Partial<TerminalSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  // Mark session expired
  const markSessionExpired = useCallback((id: string) => {
    // Clear refresh timeout
    const timeout = refreshTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      refreshTimeouts.current.delete(id);
    }

    updateSession(id, { isExpired: true, isConnected: false });
  }, [updateSession]);

  // Refresh session token
  const refreshSession = useCallback(async (id: string): Promise<TerminalSession | null> => {
    const tokenData = await fetchToken();
    if (!tokenData) return null;

    const updatedSession: Partial<TerminalSession> = {
      token: tokenData.token,
      sessionId: tokenData.sessionId,
      expiresAt: new Date(tokenData.expiresAt),
      isExpired: false,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedSession } : s))
    );

    // Schedule auto-refresh
    scheduleAutoRefresh(id, new Date(tokenData.expiresAt));

    return sessions.find((s) => s.id === id) || null;
  }, [fetchToken, sessions, scheduleAutoRefresh]);

  // Rename session
  const renameSession = useCallback((id: string, name: string) => {
    if (name.trim()) {
      updateSession(id, { name: name.trim() });
    }
  }, [updateSession]);

  // Change session shell type
  const changeSessionShell = useCallback((id: string, shellType: ShellType) => {
    updateSession(id, { shellType });
  }, [updateSession]);

  return {
    sessions,
    activeSessionId,
    addSession,
    removeSession,
    setActiveSession,
    updateSession,
    markSessionExpired,
    refreshSession,
    renameSession,
    changeSessionShell,
  };
}
