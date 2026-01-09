import type { TerminalTheme } from '../config/themes';

interface JwtExpiredDisplayProps {
  theme: TerminalTheme;
  onRequestNewSession: () => void;
  isLoading?: boolean;
}

export function JwtExpiredDisplay({
  theme,
  onRequestNewSession,
  isLoading,
}: JwtExpiredDisplayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        color: theme.colors.foreground,
        fontFamily: 'monospace',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      {/* Warning Icon */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors.yellow}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: '20px', opacity: 0.9 }}
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>

      <p
        style={{
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '8px',
          color: theme.colors.red,
        }}
      >
        &gt; Session Expired
      </p>

      <p
        style={{
          fontSize: '14px',
          color: theme.colors.brightBlack,
          marginBottom: '8px',
        }}
      >
        &gt; Your terminal session has ended.
      </p>

      <p
        style={{
          fontSize: '14px',
          color: theme.colors.brightBlack,
          marginBottom: '24px',
        }}
      >
        &gt; The server has terminated your connection.
      </p>

      <button
        onClick={onRequestNewSession}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: isLoading ? theme.colors.brightBlack : theme.colors.green,
          color: theme.colors.background,
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'monospace',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {isLoading ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                animation: 'spin 1s linear infinite',
              }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Requesting...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Request New Session
          </>
        )}
      </button>

      <p
        style={{
          fontSize: '12px',
          color: theme.colors.brightBlack,
          marginTop: '24px',
        }}
      >
        &gt; <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '14px',
            backgroundColor: theme.colors.brightBlack,
            animation: 'blink 1.2s linear infinite',
          }}
        />
      </p>

      <style>{`
        @keyframes blink {
          50% { opacity: 0.2; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
