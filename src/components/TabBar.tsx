/**
 * Tab Bar Component
 *
 * Features:
 * - Tab switching with status indicators
 * - Double-click to rename tabs
 * - Settings popover per tab
 * - Add/close tab functionality
 * - Uses react-icons for consistency
 */

import { useState, useRef, useEffect } from 'react';
import { FiX, FiPlus, FiSettings } from 'react-icons/fi';
import type { TerminalSession, ProcessInfo } from '../types';
import type { TerminalTheme } from '../config/themes';
import { TabSettingsPanel } from './TabSettingsPanel';

interface TabBarProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onAddTab: () => void;
  onRenameTab: (id: string, name: string) => void;
  onRequestProcessList: (id: string) => void;
  getProcesses: (id: string) => ProcessInfo[];
  isLoadingProcesses: (id: string) => boolean;
  theme: TerminalTheme;
  maxTabs?: number;
}

export function TabBar({
  sessions,
  activeSessionId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onRenameTab,
  onRequestProcessList,
  getProcesses,
  isLoadingProcesses,
  theme,
  maxTabs = 5,
}: TabBarProps) {
  const canAddMore = sessions.length < maxTabs;

  // Editing state for tab rename
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Settings panel state
  const [openSettingsTabId, setOpenSettingsTabId] = useState<string | null>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  // Focus input when editing
  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  // Close settings panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(event.target as Node)
      ) {
        setOpenSettingsTabId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle double-click to edit
  const handleDoubleClick = (tabId: string, currentName: string) => {
    setEditingTabId(tabId);
    setEditText(currentName);
  };

  // Commit rename
  const handleRenameCommit = () => {
    if (editingTabId && editText.trim()) {
      onRenameTab(editingTabId, editText.trim());
    }
    setEditingTabId(null);
    setEditText('');
  };

  // Handle key events in rename input
  const handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleRenameCommit();
    } else if (event.key === 'Escape') {
      setEditingTabId(null);
      setEditText('');
    }
  };

  // Toggle settings panel
  const toggleSettings = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenSettingsTabId(openSettingsTabId === tabId ? null : tabId);
  };

  // Consistent icon button style
  const iconButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '0 8px',
        gap: '2px',
        minHeight: '40px',
      }}
    >
      {sessions.map((session) => (
        <div
          key={session.id}
          style={{ position: 'relative' }}
        >
          <div
            onClick={() => onSelectTab(session.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor:
                session.id === activeSessionId
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'transparent',
              borderBottom:
                session.id === activeSessionId
                  ? `2px solid ${theme.colors.green}`
                  : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              if (session.id !== activeSessionId) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (session.id !== activeSessionId) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {/* Status dot */}
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: session.isExpired
                  ? theme.colors.red
                  : session.isConnected
                  ? theme.colors.green
                  : theme.colors.yellow,
                flexShrink: 0,
              }}
            />

            {/* Tab name (editable) */}
            {editingTabId === session.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleRenameCommit}
                onKeyDown={handleEditKeyDown}
                style={{
                  width: '80px',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${theme.colors.cyan}`,
                  borderRadius: '2px',
                  color: theme.colors.foreground,
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            ) : (
              <span
                onDoubleClick={() => handleDoubleClick(session.id, session.name)}
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: session.isExpired
                    ? '#6b7280'
                    : session.id === activeSessionId
                    ? theme.colors.foreground
                    : '#9ca3af',
                  whiteSpace: 'nowrap',
                  textDecoration: session.isExpired ? 'line-through' : 'none',
                }}
                title="Double-click to rename"
              >
                {session.name}
              </span>
            )}

            {/* Settings button */}
            <button
              onClick={(e) => toggleSettings(session.id, e)}
              style={{
                ...iconButtonStyle,
                backgroundColor: openSettingsTabId === session.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: openSettingsTabId === session.id ? theme.colors.foreground : '#6b7280',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = theme.colors.foreground;
              }}
              onMouseLeave={(e) => {
                if (openSettingsTabId !== session.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
              title="Tab settings"
            >
              <FiSettings size={12} />
            </button>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(session.id);
              }}
              style={iconButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
              title="Close tab"
            >
              <FiX size={14} />
            </button>
          </div>

          {/* Settings panel popover */}
          {openSettingsTabId === session.id && (
            <div
              ref={settingsPanelRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                zIndex: 100,
              }}
            >
              <TabSettingsPanel
                tabId={session.id}
                tabName={session.name}
                sessionId={session.sessionId}
                shellType={session.shellType}
                expiresAt={session.expiresAt}
                theme={theme}
                processes={getProcesses(session.id)}
                isLoadingProcesses={isLoadingProcesses(session.id)}
                onRequestProcessList={() => onRequestProcessList(session.id)}
                onClose={() => setOpenSettingsTabId(null)}
              />
            </div>
          )}
        </div>
      ))}

      {/* Add tab button */}
      {canAddMore && (
        <button
          onClick={onAddTab}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            padding: 0,
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.15s',
            marginLeft: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = theme.colors.foreground;
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          title="New terminal"
        >
          <FiPlus size={16} />
        </button>
      )}

      {/* Tab limit indicator */}
      {!canAddMore && (
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#6b7280',
            marginLeft: '8px',
          }}
        >
          Max {maxTabs} tabs
        </span>
      )}
    </div>
  );
}
