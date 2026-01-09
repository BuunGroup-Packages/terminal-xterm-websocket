/**
 * Tab Settings Panel Component
 *
 * Displays session information and running processes for a terminal tab.
 * Uses react-icons for consistent iconography.
 */

import { useState, useEffect } from 'react';
import { FiX, FiRefreshCw, FiClock, FiCpu, FiTerminal, FiHash } from 'react-icons/fi';
import { VscTerminalBash, VscTerminal, VscSymbolMethod } from 'react-icons/vsc';
import type { TerminalTheme } from '../config/themes';
import type { ProcessInfo, ShellType } from '../types';

interface TabSettingsPanelProps {
  tabId: string;
  tabName: string;
  sessionId: string;
  shellType: ShellType;
  expiresAt: Date;
  theme: TerminalTheme;
  processes: ProcessInfo[];
  isLoadingProcesses: boolean;
  onRequestProcessList: () => void;
  onClose: () => void;
}

// Shell icon mapping
const SHELL_ICONS: Record<ShellType, typeof VscTerminalBash> = {
  bash: VscTerminalBash,
  sh: VscTerminal,
  zsh: VscSymbolMethod,
};

const SHELL_NAMES: Record<ShellType, string> = {
  bash: 'Bash',
  sh: 'Shell',
  zsh: 'Zsh',
};

export function TabSettingsPanel({
  tabName,
  sessionId,
  shellType,
  expiresAt,
  theme,
  processes,
  isLoadingProcesses,
  onRequestProcessList,
  onClose,
}: TabSettingsPanelProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const ShellIcon = SHELL_ICONS[shellType];

  // Update time remaining
  useEffect(() => {
    const updateTimer = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    fontFamily: 'monospace',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: theme.colors.foreground,
  };

  return (
    <div
      style={{
        width: '300px',
        backgroundColor: theme.colors.background,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
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
          <FiTerminal size={14} color={theme.colors.cyan} />
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'monospace',
              fontWeight: 600,
              color: theme.colors.foreground,
            }}
          >
            {tabName}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            padding: 0,
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <FiX size={14} />
        </button>
      </div>

      {/* Session Info */}
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <div style={labelStyle}>
              <FiHash size={10} />
              Session ID
            </div>
            <div style={{ ...valueStyle, fontSize: '10px', wordBreak: 'break-all' }}>
              {sessionId.slice(0, 8)}...
            </div>
          </div>
          <div>
            <div style={labelStyle}>
              <ShellIcon size={10} />
              Shell
            </div>
            <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShellIcon size={14} />
              {SHELL_NAMES[shellType]}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={labelStyle}>
            <FiClock size={10} />
            Time Remaining
          </div>
          <div
            style={{
              ...valueStyle,
              color: timeLeft === 'Expired' ? theme.colors.red : theme.colors.green,
              fontWeight: 500,
            }}
          >
            {timeLeft}
          </div>
        </div>

        {/* Separator */}
        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            margin: '14px 0',
          }}
        />

        {/* Process List */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div style={labelStyle}>
              <FiCpu size={10} />
              Running Processes
            </div>
            <button
              onClick={onRequestProcessList}
              disabled={isLoadingProcesses}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '26px',
                padding: '0 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#9ca3af',
                fontSize: '10px',
                fontFamily: 'monospace',
                cursor: isLoadingProcesses ? 'not-allowed' : 'pointer',
                opacity: isLoadingProcesses ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isLoadingProcesses) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#e5e5e5';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              <FiRefreshCw
                size={10}
                style={{
                  animation: isLoadingProcesses ? 'spin 1s linear infinite' : 'none',
                }}
              />
              {isLoadingProcesses ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div
            style={{
              maxHeight: '160px',
              overflowY: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              padding: '10px',
            }}
          >
            {processes.length === 0 ? (
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#6b7280',
                  textAlign: 'center',
                  padding: '10px',
                }}
              >
                {isLoadingProcesses ? 'Loading processes...' : 'Click refresh to load processes'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...labelStyle, textAlign: 'left', paddingBottom: '6px', marginBottom: 0 }}>PID</th>
                    <th style={{ ...labelStyle, textAlign: 'right', paddingBottom: '6px', marginBottom: 0 }}>CPU</th>
                    <th style={{ ...labelStyle, textAlign: 'right', paddingBottom: '6px', marginBottom: 0 }}>MEM</th>
                    <th style={{ ...labelStyle, textAlign: 'left', paddingBottom: '6px', paddingLeft: '10px', marginBottom: 0 }}>CMD</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((proc) => (
                    <tr key={proc.pid}>
                      <td style={{ fontSize: '10px', fontFamily: 'monospace', color: theme.colors.cyan, padding: '3px 0' }}>
                        {proc.pid}
                      </td>
                      <td style={{ fontSize: '10px', fontFamily: 'monospace', color: '#9ca3af', textAlign: 'right' }}>
                        {proc.cpu}
                      </td>
                      <td style={{ fontSize: '10px', fontFamily: 'monospace', color: '#9ca3af', textAlign: 'right' }}>
                        {proc.mem}
                      </td>
                      <td
                        style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: theme.colors.foreground,
                          paddingLeft: '10px',
                          maxWidth: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={proc.command}
                      >
                        {proc.command}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
