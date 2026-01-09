/**
 * Server Offline Display Component
 *
 * Displayed when the terminal server is unreachable or offline.
 * Shows a user-friendly error message with retry option.
 */

import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import type { TerminalTheme } from '../config/themes';

interface ServerOfflineDisplayProps {
  theme: TerminalTheme;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ServerOfflineDisplay({
  theme,
  onRetry,
  isRetrying = false,
}: ServerOfflineDisplayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: theme.colors.background,
        color: theme.colors.foreground,
        fontFamily: 'monospace',
        textAlign: 'center',
      }}
    >
      {/* Animated warning icon */}
      <div
        style={{
          marginBottom: '20px',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        <FiAlertTriangle
          size={64}
          color={theme.colors.red}
          style={{ opacity: 0.9 }}
        />
      </div>

      {/* Main message */}
      <p
        style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '12px',
          color: theme.colors.foreground,
        }}
      >
        &gt; Terminal Server Offline
      </p>

      {/* Sub messages */}
      <p
        style={{
          fontSize: '13px',
          marginBottom: '8px',
          color: '#9ca3af',
        }}
      >
        &gt; Unable to establish connection with the terminal server.
      </p>
      <p
        style={{
          fontSize: '13px',
          marginBottom: '8px',
          color: '#9ca3af',
        }}
      >
        &gt; This may be due to server maintenance or network issues.
      </p>
      <p
        style={{
          fontSize: '13px',
          marginBottom: '24px',
          color: '#9ca3af',
        }}
      >
        &gt; Please try again in a few moments.
      </p>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: theme.colors.cyan,
            color: theme.colors.background,
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 500,
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            opacity: isRetrying ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          <FiRefreshCw
            size={16}
            style={{
              animation: isRetrying ? 'spin 1s linear infinite' : 'none',
            }}
          />
          {isRetrying ? 'Connecting...' : 'Retry Connection'}
        </button>
      )}

      {/* Blinking cursor */}
      <p style={{ marginTop: '24px', color: '#9ca3af' }}>
        &gt;{' '}
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '16px',
            backgroundColor: '#9ca3af',
            animation: 'blink 1.2s linear infinite',
          }}
        />
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
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
