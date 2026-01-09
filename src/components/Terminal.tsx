import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useWebSocket } from '../hooks/useWebSocket';
import type { TerminalTheme } from '../config/themes';
import type { TerminalSettings } from '../hooks/useTerminalSettings';
import 'xterm/css/xterm.css';

interface TerminalProps {
  wsUrl: string;
  theme: TerminalTheme;
  settings: TerminalSettings;
  onConnectionChange?: (connected: boolean) => void;
  onReconnecting?: (attempt: number, maxAttempts: number) => void;
  onServerMessage?: (msg: { type: string; [key: string]: unknown }) => void;
  onWebSocketRef?: (ws: WebSocket | null) => void;
}

export function Terminal({
  wsUrl,
  theme,
  settings,
  onConnectionChange,
  onReconnecting,
  onServerMessage,
  onWebSocketRef,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const isDisposedRef = useRef(false);

  // Safe terminal write - checks if terminal exists and is not disposed
  const safeWrite = useCallback((text: string) => {
    const term = xtermRef.current;
    if (term && !isDisposedRef.current) {
      try {
        term.write(text);
      } catch (e) {
        console.warn('[Terminal] Write failed:', e);
      }
    }
  }, []);

  const safeWriteln = useCallback((text: string) => {
    const term = xtermRef.current;
    if (term && !isDisposedRef.current) {
      try {
        term.writeln(text);
      } catch (e) {
        console.warn('[Terminal] Writeln failed:', e);
      }
    }
  }, []);

  const safeClear = useCallback(() => {
    const term = xtermRef.current;
    if (term && !isDisposedRef.current) {
      try {
        term.clear();
      } catch (e) {
        console.warn('[Terminal] Clear failed:', e);
      }
    }
  }, []);

  // WebSocket with automatic reconnection
  const { ws, isConnected, isReconnecting, send, reconnect } =
    useWebSocket(wsUrl, {
      maxRetries: 10,
      baseDelay: 1000,
      maxDelay: 30000,
      onOpen: () => {
        safeClear();
        safeWriteln('\x1b[32mConnected to terminal server\x1b[0m');
        safeWriteln('');

        // Send initial terminal size
        const term = xtermRef.current;
        if (term && !isDisposedRef.current) {
          try {
            const { cols, rows } = term;
            send(JSON.stringify({ type: 'resize', cols, rows }));
          } catch (e) {
            console.warn('[Terminal] Failed to send resize:', e);
          }
        }
        onConnectionChange?.(true);
      },
      onMessage: (event) => {
        if (isDisposedRef.current) return;

        if (event.data instanceof ArrayBuffer) {
          const text = new TextDecoder().decode(event.data);
          safeWrite(text);
        } else {
          try {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
              case 'output':
                safeWrite(msg.data);
                break;
              case 'session_started':
                safeWriteln(`\x1b[36mSession started: ${msg.sessionId}\x1b[0m`);
                safeWriteln(`\x1b[36mExpires: ${new Date(msg.expiresAt).toLocaleTimeString()}\x1b[0m`);
                safeWriteln('');
                break;
              case 'session_expired':
                safeWriteln('');
                safeWriteln(`\x1b[31mSession expired: ${msg.reason}\x1b[0m`);
                onServerMessage?.(msg);
                break;
              default:
                onServerMessage?.(msg);
            }
          } catch {
            safeWrite(event.data);
          }
        }
      },
      onClose: () => {
        safeWriteln('');
        safeWriteln('\x1b[31mConnection closed\x1b[0m');
        onConnectionChange?.(false);
      },
      onReconnecting: (attempt, maxAttempts) => {
        safeWriteln(`\x1b[33mReconnecting... (attempt ${attempt}/${maxAttempts})\x1b[0m`);
        onReconnecting?.(attempt, maxAttempts);
      },
      onMaxRetriesReached: () => {
        safeWriteln('\x1b[31mMax reconnection attempts reached. Click to retry.\x1b[0m');
      },
      onError: () => {
        safeWriteln('\x1b[31mConnection error\x1b[0m');
      },
    });

  // Pass WebSocket ref to parent
  useEffect(() => {
    onWebSocketRef?.(ws);
  }, [ws, onWebSocketRef]);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Prevent re-initialization
    if (xtermRef.current) return;

    isDisposedRef.current = false;

    const term = new XTerm({
      cursorBlink: settings.cursorBlink,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      theme: theme.colors,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Delay fit and ready state to ensure terminal is fully rendered
    const readyTimeout = setTimeout(() => {
      if (!isDisposedRef.current && fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          console.warn('[Terminal] Initial fit failed:', e);
        }
        setIsTerminalReady(true);

        // Write initial message
        try {
          term.writeln('Connecting to terminal...');
        } catch (e) {
          console.warn('[Terminal] Initial write failed:', e);
        }
      }
    }, 100);

    return () => {
      clearTimeout(readyTimeout);
      isDisposedRef.current = true;
      setIsTerminalReady(false);

      try {
        term.dispose();
      } catch (e) {
        console.warn('[Terminal] Dispose failed:', e);
      }

      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []); // Only initialize once

  // Update theme when it changes
  useEffect(() => {
    const term = xtermRef.current;
    if (term && !isDisposedRef.current) {
      try {
        term.options.theme = theme.colors;
      } catch (e) {
        console.warn('[Terminal] Theme update failed:', e);
      }
    }
  }, [theme]);

  // Update settings when they change
  useEffect(() => {
    const term = xtermRef.current;
    const fitAddon = fitAddonRef.current;
    if (term && !isDisposedRef.current) {
      try {
        term.options.fontSize = settings.fontSize;
        term.options.fontFamily = settings.fontFamily;
        term.options.cursorBlink = settings.cursorBlink;

        // Refit after font size change
        if (fitAddon) {
          requestAnimationFrame(() => {
            if (!isDisposedRef.current && fitAddon) {
              try {
                fitAddon.fit();
                const { cols, rows } = term;
                send(JSON.stringify({ type: 'resize', cols, rows }));
              } catch (e) {
                console.warn('[Terminal] Resize after settings change failed:', e);
              }
            }
          });
        }
      } catch (e) {
        console.warn('[Terminal] Settings update failed:', e);
      }
    }
  }, [settings.fontSize, settings.fontFamily, settings.cursorBlink, send]);

  // Send user input to server
  useEffect(() => {
    if (!isTerminalReady || isDisposedRef.current) return;

    const term = xtermRef.current;
    if (!term) return;

    const inputDisposable = term.onData((data) => {
      send(JSON.stringify({ type: 'input', data }));
    });

    return () => {
      try {
        inputDisposable.dispose();
      } catch (e) {
        console.warn('[Terminal] Input disposable cleanup failed:', e);
      }
    };
  }, [isTerminalReady, send]);

  // Handle terminal resize
  const handleResize = useCallback(() => {
    if (isDisposedRef.current) return;

    const fitAddon = fitAddonRef.current;
    const term = xtermRef.current;

    if (!fitAddon || !term) return;

    try {
      fitAddon.fit();
      const { cols, rows } = term;
      send(JSON.stringify({ type: 'resize', cols, rows }));
    } catch (e) {
      console.warn('[Terminal] Resize failed:', e);
    }
  }, [send]);

  // Resize observer
  useEffect(() => {
    if (!isTerminalReady || isDisposedRef.current) return;

    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [handleResize, isTerminalReady]);

  // Handle click to reconnect when max retries reached
  const handleClick = () => {
    if (!isConnected && !isReconnecting) {
      reconnect();
    }
  };

  return (
    <div
      ref={terminalRef}
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        backgroundColor: theme.colors.background,
        cursor: !isConnected && !isReconnecting ? 'pointer' : 'text',
      }}
    />
  );
}
