import { useState } from 'react';
import { Terminal } from './components/Terminal';
import './styles/terminal.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectInfo, setReconnectInfo] = useState<{ attempt: number; max: number } | null>(null);

  // Use environment variable or fallback to localhost for development
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

  const handleReconnecting = (attempt: number, max: number) => {
    setReconnectInfo({ attempt, max });
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    if (connected) {
      setReconnectInfo(null);
    }
  };

  return (
    <div className="terminal-container">
      {/* Connection status indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        paddingLeft: '16px'
      }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#22c55e' : reconnectInfo ? '#eab308' : '#ef4444',
            animation: reconnectInfo ? 'pulse 1s infinite' : 'none',
          }}
        />
        <span style={{
          color: '#9ca3af',
          fontSize: '14px',
          fontFamily: 'monospace'
        }}>
          {isConnected
            ? 'Connected'
            : reconnectInfo
              ? `Reconnecting (${reconnectInfo.attempt}/${reconnectInfo.max})...`
              : 'Disconnected'}
        </span>
      </div>

      {/* Terminal */}
      <div className="terminal-wrapper">
        <Terminal
          wsUrl={wsUrl}
          onConnectionChange={handleConnectionChange}
          onReconnecting={handleReconnecting}
        />
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default App;
