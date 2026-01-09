interface StatusIndicatorProps {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt?: number;
}

export function StatusIndicator({
  isConnected,
  isReconnecting,
  reconnectAttempt,
}: StatusIndicatorProps) {
  const getStatus = () => {
    if (isConnected) {
      return { color: '#22c55e', label: 'Connected', pulse: false };
    }
    if (isReconnecting) {
      return {
        color: '#eab308',
        label: `Reconnecting${reconnectAttempt ? ` (${reconnectAttempt})` : ''}`,
        pulse: true,
      };
    }
    return { color: '#ef4444', label: 'Disconnected', pulse: false };
  };

  const { color, label, pulse } = getStatus();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: pulse ? `0 0 8px ${color}` : 'none',
          animation: pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      <span
        style={{
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#9ca3af',
        }}
      >
        {label}
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
