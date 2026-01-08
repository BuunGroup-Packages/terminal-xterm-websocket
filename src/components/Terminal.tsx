import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useWebSocket } from '../hooks/useWebSocket';
import 'xterm/css/xterm.css';

interface TerminalProps {
  wsUrl: string;
  onConnectionChange?: (connected: boolean) => void;
  onReconnecting?: (attempt: number, maxAttempts: number) => void;
}

export function Terminal({ wsUrl, onConnectionChange, onReconnecting }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  // WebSocket with automatic reconnection
  const {
    isConnected,
    isReconnecting,
    send,
    reconnect,
  } = useWebSocket(wsUrl, {
    maxRetries: 10,
    baseDelay: 1000,
    maxDelay: 30000,
    onOpen: () => {
      const term = xtermRef.current;
      if (term) {
        term.clear();
        term.writeln('\x1b[32mConnected to terminal server\x1b[0m');
        term.writeln('');

        // Send initial terminal size
        const { cols, rows } = term;
        send(JSON.stringify({ type: 'resize', cols, rows }));
      }
      onConnectionChange?.(true);
    },
    onMessage: (event) => {
      const term = xtermRef.current;
      if (!term) return;

      if (event.data instanceof ArrayBuffer) {
        const text = new TextDecoder().decode(event.data);
        term.write(text);
      } else {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'output') {
            term.write(msg.data);
          }
        } catch {
          term.write(event.data);
        }
      }
    },
    onClose: () => {
      const term = xtermRef.current;
      if (term) {
        term.writeln('');
        term.writeln('\x1b[31mConnection closed\x1b[0m');
      }
      onConnectionChange?.(false);
    },
    onReconnecting: (attempt, maxAttempts) => {
      const term = xtermRef.current;
      if (term) {
        term.writeln(`\x1b[33mReconnecting... (attempt ${attempt}/${maxAttempts})\x1b[0m`);
      }
      onReconnecting?.(attempt, maxAttempts);
    },
    onMaxRetriesReached: () => {
      const term = xtermRef.current;
      if (term) {
        term.writeln('\x1b[31mMax reconnection attempts reached. Click to retry.\x1b[0m');
      }
    },
    onError: () => {
      const term = xtermRef.current;
      if (term) {
        term.writeln('\x1b[31mConnection error\x1b[0m');
      }
    },
  });

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        cursorAccent: '#1a1b26',
        selectionBackground: '#33467c',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);

    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('Connecting to terminal...');
    setIsTerminalReady(true);

    return () => {
      setIsTerminalReady(false);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Send user input to server
  useEffect(() => {
    if (!isTerminalReady) return;

    const term = xtermRef.current;
    if (!term) return;

    const inputDisposable = term.onData((data) => {
      send(JSON.stringify({ type: 'input', data }));
    });

    return () => {
      inputDisposable.dispose();
    };
  }, [isTerminalReady, send]);

  // Handle terminal resize
  const handleResize = useCallback(() => {
    const fitAddon = fitAddonRef.current;
    const term = xtermRef.current;

    if (!fitAddon || !term) return;

    fitAddon.fit();
    const { cols, rows } = term;
    send(JSON.stringify({ type: 'resize', cols, rows }));
  }, [send]);

  // Resize observer
  useEffect(() => {
    if (!isTerminalReady) return;

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
        backgroundColor: '#1a1b26',
        cursor: !isConnected && !isReconnecting ? 'pointer' : 'text',
      }}
    />
  );
}
