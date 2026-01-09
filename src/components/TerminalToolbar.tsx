/**
 * Terminal Toolbar Component
 *
 * Contains status indicators, quick actions, command history,
 * theme selector, and settings panel.
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { FiZap, FiClock } from 'react-icons/fi';
import { StatusIndicator } from './StatusIndicator';
import { SessionTimer } from './SessionTimer';
import { ThemeSelector } from './ThemeSelector';
import { SettingsPanel } from './SettingsPanel';
import { QuickActionsPanel } from './QuickActionsPanel';
import { CommandHistoryPanel, type CommandHistoryEntry } from './CommandHistoryPanel';
import type { TerminalTheme } from '../config/themes';
import type { TerminalSettings } from '../hooks/useTerminalSettings';

interface TerminalToolbarProps {
  // Connection state
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt?: number;

  // Session
  sessionExpiresAt?: Date;
  onSessionExpired?: () => void;

  // Theme
  themes: TerminalTheme[];
  currentTheme: TerminalTheme;
  onThemeChange: (themeId: string) => void;

  // Settings
  settings: TerminalSettings;
  onFontSizeChange: (size: number) => void;
  onCursorBlinkChange: (blink: boolean) => void;
  onSettingsReset: () => void;

  // Quick actions
  onExecuteCommand?: (command: string) => void;

  // Command history
  commandHistory?: CommandHistoryEntry[];
  onClearHistory?: () => void;

  // Additional controls (e.g., shell selector)
  children?: ReactNode;
}

// Consistent toolbar button style
const TOOLBAR_BUTTON_HEIGHT = 32;

export function TerminalToolbar({
  isConnected,
  isReconnecting,
  reconnectAttempt,
  sessionExpiresAt,
  onSessionExpired,
  themes,
  currentTheme,
  onThemeChange,
  settings,
  onFontSizeChange,
  onCursorBlinkChange,
  onSettingsReset,
  onExecuteCommand,
  commandHistory = [],
  onClearHistory,
  children,
}: TerminalToolbarProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const quickActionsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toolbarButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: `${TOOLBAR_BUTTON_HEIGHT}px`,
    padding: '0 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    color: '#e5e5e5',
    fontSize: '12px',
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: '#0f0f0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Left side - Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <StatusIndicator
          isConnected={isConnected}
          isReconnecting={isReconnecting}
          reconnectAttempt={reconnectAttempt}
        />
        <SessionTimer
          expiresAt={sessionExpiresAt}
          onExpired={onSessionExpired}
        />
      </div>

      {/* Right side - Actions, Theme & Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Quick Actions Button */}
        {onExecuteCommand && (
          <div ref={quickActionsRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowQuickActions(!showQuickActions);
                setShowHistory(false);
              }}
              style={{
                ...toolbarButtonStyle,
                backgroundColor: showQuickActions ? 'rgba(255, 255, 255, 0.15)' : toolbarButtonStyle.backgroundColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                if (!showQuickActions) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              title="Quick Actions"
            >
              <FiZap size={14} />
              <span>Actions</span>
            </button>

            {showQuickActions && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 100,
                }}
              >
                <QuickActionsPanel
                  theme={currentTheme}
                  onExecuteCommand={(cmd) => {
                    onExecuteCommand(cmd);
                    setShowQuickActions(false);
                  }}
                  onClose={() => setShowQuickActions(false)}
                />
              </div>
            )}
          </div>
        )}

        {/* Command History Button */}
        <div ref={historyRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              setShowQuickActions(false);
            }}
            style={{
              ...toolbarButtonStyle,
              backgroundColor: showHistory ? 'rgba(255, 255, 255, 0.15)' : toolbarButtonStyle.backgroundColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              if (!showHistory) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            title="Command History"
          >
            <FiClock size={14} />
            <span>History</span>
            {commandHistory.length > 0 && (
              <span
                style={{
                  backgroundColor: currentTheme.colors.cyan,
                  color: currentTheme.colors.background,
                  fontSize: '10px',
                  padding: '1px 5px',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                {commandHistory.length}
              </span>
            )}
          </button>

          {showHistory && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                zIndex: 100,
              }}
            >
              <CommandHistoryPanel
                history={commandHistory}
                theme={currentTheme}
                onClearHistory={onClearHistory}
                onClose={() => setShowHistory(false)}
              />
            </div>
          )}
        </div>

        {/* Shell selector and other children */}
        {children}

        {/* Theme Selector */}
        <ThemeSelector
          themes={themes}
          currentTheme={currentTheme}
          onThemeChange={onThemeChange}
        />

        {/* Settings Panel */}
        <SettingsPanel
          settings={settings}
          onFontSizeChange={onFontSizeChange}
          onCursorBlinkChange={onCursorBlinkChange}
          onReset={onSettingsReset}
        />
      </div>
    </div>
  );
}
