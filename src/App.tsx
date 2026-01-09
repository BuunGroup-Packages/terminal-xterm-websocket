/**
 * Terminal Application
 *
 * Features:
 * - Multi-terminal tabs with session management
 * - Theme switching with persistence
 * - Shell type selection per tab
 * - Tab renaming and settings panel
 * - Auto-refresh tokens before expiry
 * - Process list per container
 * - Quick actions panel
 * - Command history with export
 * - Server offline display
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Terminal } from './components/Terminal';
import { TerminalToolbar } from './components/TerminalToolbar';
import { TabBar } from './components/TabBar';
import { JwtExpiredDisplay } from './components/JwtExpiredDisplay';
import { ServerOfflineDisplay } from './components/ServerOfflineDisplay';
import { ShellSelector } from './components/ShellSelector';
import { useTerminalTheme } from './hooks/useTerminalTheme';
import { useTerminalSettings } from './hooks/useTerminalSettings';
import { useTerminalSessions } from './hooks/useTerminalSessions';
import type { ProcessInfo, ShellType, WsMessage } from './types';
import type { CommandHistoryEntry } from './components/CommandHistoryPanel';
import './styles/terminal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [serverOffline, setServerOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Theme and settings hooks
  const { theme, themes, setThemeById } = useTerminalTheme();
  const terminalSettings = useTerminalSettings();

  // Multi-session management
  const {
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
  } = useTerminalSessions(API_URL);

  // Process list state per session
  const [processLists, setProcessLists] = useState<Map<string, ProcessInfo[]>>(new Map());
  const [loadingProcesses, setLoadingProcesses] = useState<Map<string, boolean>>(new Map());

  // Command history per session
  const [commandHistories, setCommandHistories] = useState<Map<string, CommandHistoryEntry[]>>(new Map());

  // WebSocket refs for sending messages
  const wsRefs = useRef<Map<string, WebSocket>>(new Map());

  // Guard against StrictMode double-initialization
  const hasInitializedRef = useRef(false);

  // Get active session
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Get command history for active session
  const activeCommandHistory = activeSession
    ? commandHistories.get(activeSession.id) || []
    : [];

  // Check server health
  const checkServerHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Create initial session on mount (with StrictMode guard)
  useEffect(() => {
    // Prevent double-initialization in React StrictMode
    if (hasInitializedRef.current) {
      console.log('[App] Skipping duplicate initialization (StrictMode)');
      return;
    }
    hasInitializedRef.current = true;

    const init = async () => {
      console.log('[App] Initializing...');
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        setServerOffline(true);
        setIsInitializing(false);
        return;
      }

      const session = await addSession();
      if (!session) {
        setServerOffline(true);
      }
      setIsInitializing(false);
      console.log('[App] Initialization complete');
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retry connection
  const handleRetryConnection = useCallback(async () => {
    setIsRetrying(true);
    const isHealthy = await checkServerHealth();
    if (isHealthy) {
      setServerOffline(false);
      const session = await addSession();
      if (!session) {
        setServerOffline(true);
      }
    }
    setIsRetrying(false);
  }, [checkServerHealth, addSession]);

  // Handle connection change
  const handleConnectionChange = useCallback(
    (sessionId: string, connected: boolean) => {
      updateSession(sessionId, { isConnected: connected });
    },
    [updateSession]
  );

  // Handle server messages
  const handleServerMessage = useCallback(
    (sessionId: string, msg: WsMessage) => {
      if (msg.type === 'session_expired') {
        console.log(`[${sessionId}] Session expired:`, msg.reason);
        markSessionExpired(sessionId);
      } else if (msg.type === 'processes') {
        setProcessLists((prev) => {
          const next = new Map(prev);
          next.set(sessionId, msg.processes || []);
          return next;
        });
        setLoadingProcesses((prev) => {
          const next = new Map(prev);
          next.set(sessionId, false);
          return next;
        });
      }
    },
    [markSessionExpired]
  );

  // Handle session expired
  const handleSessionExpired = useCallback(
    (sessionId: string) => {
      markSessionExpired(sessionId);
    },
    [markSessionExpired]
  );

  // Handle request new session
  const handleRequestNewSession = useCallback(
    async (sessionId: string) => {
      await refreshSession(sessionId);
    },
    [refreshSession]
  );

  // Handle add tab
  const handleAddTab = useCallback(async () => {
    await addSession();
  }, [addSession]);

  // Handle close tab
  const handleCloseTab = useCallback(
    (sessionId: string) => {
      removeSession(sessionId);
      wsRefs.current.delete(sessionId);
      setProcessLists((prev) => {
        const next = new Map(prev);
        next.delete(sessionId);
        return next;
      });
      setCommandHistories((prev) => {
        const next = new Map(prev);
        next.delete(sessionId);
        return next;
      });
    },
    [removeSession]
  );

  // Handle rename tab
  const handleRenameTab = useCallback(
    (sessionId: string, name: string) => {
      renameSession(sessionId, name);
    },
    [renameSession]
  );

  // Handle shell change
  const handleShellChange = useCallback(
    (shell: ShellType) => {
      if (activeSession) {
        changeSessionShell(activeSession.id, shell);
      }
    },
    [activeSession, changeSessionShell]
  );

  // Request process list for a tab
  const handleRequestProcessList = useCallback((sessionId: string) => {
    setLoadingProcesses((prev) => {
      const next = new Map(prev);
      next.set(sessionId, true);
      return next;
    });

    const ws = wsRefs.current.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'get_processes' }));
    }
  }, []);

  // Get processes for a session
  const getProcesses = useCallback(
    (sessionId: string): ProcessInfo[] => {
      return processLists.get(sessionId) || [];
    },
    [processLists]
  );

  // Check if loading processes for a session
  const isLoadingProcesses = useCallback(
    (sessionId: string): boolean => {
      return loadingProcesses.get(sessionId) || false;
    },
    [loadingProcesses]
  );

  // Store WebSocket reference when terminal connects
  const handleWebSocketRef = useCallback((sessionId: string, ws: WebSocket | null) => {
    if (ws) {
      wsRefs.current.set(sessionId, ws);
    } else {
      wsRefs.current.delete(sessionId);
    }
  }, []);

  // Execute command (for quick actions)
  const handleExecuteCommand = useCallback((command: string) => {
    if (!activeSession) return;

    const ws = wsRefs.current.get(activeSession.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data: command }));

      // Add to history
      setCommandHistories((prev) => {
        const next = new Map(prev);
        const history = next.get(activeSession.id) || [];
        next.set(activeSession.id, [
          ...history,
          { command: command.trim(), timestamp: new Date() },
        ]);
        return next;
      });
    }
  }, [activeSession]);

  // Clear command history for active session
  const handleClearHistory = useCallback(() => {
    if (!activeSession) return;
    setCommandHistories((prev) => {
      const next = new Map(prev);
      next.set(activeSession.id, []);
      return next;
    });
  }, [activeSession]);

  // Loading state
  if (isInitializing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: theme.colors.background,
          color: theme.colors.foreground,
          fontFamily: 'monospace',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.cyan}
            strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p>Starting terminal...</p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Server offline state
  if (serverOffline) {
    return (
      <div style={{ height: '100vh', position: 'relative' }}>
        <ServerOfflineDisplay
          theme={theme}
          onRetry={handleRetryConnection}
          isRetrying={isRetrying}
        />
      </div>
    );
  }

  // No sessions state
  if (sessions.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: theme.colors.background,
          color: theme.colors.foreground,
          fontFamily: 'monospace',
          textAlign: 'center',
        }}
      >
        <div>
          <p style={{ marginBottom: '16px' }}>No active sessions</p>
          <button
            onClick={handleAddTab}
            style={{
              padding: '12px 24px',
              backgroundColor: theme.colors.green,
              color: theme.colors.background,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            New Terminal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Tab Bar */}
      <TabBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectTab={setActiveSession}
        onCloseTab={handleCloseTab}
        onAddTab={handleAddTab}
        onRenameTab={handleRenameTab}
        onRequestProcessList={handleRequestProcessList}
        getProcesses={getProcesses}
        isLoadingProcesses={isLoadingProcesses}
        theme={theme}
        maxTabs={5}
      />

      {/* Toolbar */}
      <TerminalToolbar
        isConnected={activeSession?.isConnected || false}
        isReconnecting={false}
        reconnectAttempt={0}
        sessionExpiresAt={activeSession?.expiresAt}
        onSessionExpired={() => activeSession && handleSessionExpired(activeSession.id)}
        themes={themes}
        currentTheme={theme}
        onThemeChange={setThemeById}
        settings={terminalSettings}
        onFontSizeChange={terminalSettings.setFontSize}
        onCursorBlinkChange={terminalSettings.setCursorBlink}
        onSettingsReset={terminalSettings.resetToDefaults}
        onExecuteCommand={handleExecuteCommand}
        commandHistory={activeCommandHistory}
        onClearHistory={handleClearHistory}
      >
        {/* Shell Selector */}
        {activeSession && (
          <ShellSelector
            currentShell={activeSession.shellType}
            onShellChange={handleShellChange}
            theme={theme}
            disabled={activeSession.isConnected}
          />
        )}
      </TerminalToolbar>

      {/* Terminal Container */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {sessions.map((session) => (
          <div
            key={session.id}
            style={{
              position: 'absolute',
              inset: 0,
              display: session.id === activeSessionId ? 'block' : 'none',
            }}
          >
            {!session.isExpired ? (
              <Terminal
                wsUrl={`${WS_BASE_URL}?token=${encodeURIComponent(session.token)}&shell=${session.shellType}`}
                theme={theme}
                settings={terminalSettings}
                onConnectionChange={(connected) =>
                  handleConnectionChange(session.id, connected)
                }
                onReconnecting={() => {}}
                onServerMessage={(msg) => handleServerMessage(session.id, msg)}
                onWebSocketRef={(ws) => handleWebSocketRef(session.id, ws)}
              />
            ) : (
              <JwtExpiredDisplay
                theme={theme}
                onRequestNewSession={() => handleRequestNewSession(session.id)}
                isLoading={false}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
