/**
 * Command History Panel Component
 *
 * Displays and exports command history for the current session.
 * Supports JSON and CSV export formats.
 */

import { FiClock, FiTerminal, FiDownload, FiTrash2, FiGitBranch } from 'react-icons/fi';
import { VscTerminalBash } from 'react-icons/vsc';
import type { TerminalTheme } from '../config/themes';

export interface CommandHistoryEntry {
  command: string;
  timestamp: Date;
}

interface CommandHistoryPanelProps {
  history: CommandHistoryEntry[];
  theme: TerminalTheme;
  onClearHistory?: () => void;
  onClose: () => void;
}

// Get icon based on command prefix
function getCommandIcon(command: string) {
  const lowerCommand = command.toLowerCase().trim();
  if (lowerCommand.startsWith('git ')) return FiGitBranch;
  if (lowerCommand.startsWith('bash') || lowerCommand.startsWith('sh ')) return VscTerminalBash;
  return FiTerminal;
}

export function CommandHistoryPanel({
  history,
  theme,
  onClearHistory,
}: CommandHistoryPanelProps) {
  // Download file helper
  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Export as JSON
  const handleExportJSON = () => {
    const exportData = history.map((entry) => ({
      command: entry.command,
      timestamp: entry.timestamp.toISOString(),
    }));
    downloadFile('command_history.json', JSON.stringify(exportData, null, 2), 'application/json');
  };

  // Export as CSV
  const handleExportCSV = () => {
    let csvContent = 'Timestamp,Command\n';
    history.forEach((entry) => {
      const timestamp = entry.timestamp.toISOString();
      const command = `"${entry.command.replace(/"/g, '""')}"`;
      csvContent += `${timestamp},${command}\n`;
    });
    downloadFile('command_history.csv', csvContent, 'text/csv');
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '28px',
    padding: '0 10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    color: '#9ca3af',
    fontSize: '11px',
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div
      style={{
        width: '360px',
        maxHeight: '400px',
        backgroundColor: theme.colors.background,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiClock size={14} color={theme.colors.cyan} />
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'monospace',
              fontWeight: 600,
              color: theme.colors.foreground,
            }}
          >
            Command History
          </span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#6b7280',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {history.length}
          </span>
        </div>
      </div>

      {/* History List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {history.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              color: '#6b7280',
            }}
          >
            <FiTerminal size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              No commands recorded yet
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {history.map((entry, index) => {
              const Icon = getCommandIcon(entry.command);
              return (
                <div
                  key={`${entry.timestamp.toISOString()}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon
                    size={14}
                    color={theme.colors.cyan}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: theme.colors.green,
                        wordBreak: 'break-all',
                        lineHeight: 1.4,
                      }}
                    >
                      {entry.command.trim()}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: '#6b7280',
                      }}
                    >
                      <FiClock size={10} />
                      {entry.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with export buttons */}
      {history.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleExportJSON}
              style={buttonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#e5e5e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              <FiDownload size={12} />
              JSON
            </button>
            <button
              onClick={handleExportCSV}
              style={buttonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#e5e5e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              <FiDownload size={12} />
              CSV
            </button>
          </div>

          {onClearHistory && (
            <button
              onClick={onClearHistory}
              style={{
                ...buttonStyle,
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              <FiTrash2 size={12} />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
