/**
 * Shell Selector Component
 *
 * Allows users to switch between different shell types (bash, sh, zsh).
 * Uses react-icons for consistent iconography.
 */

import { useState, useRef, useEffect } from 'react';
import { VscTerminalBash, VscTerminal, VscSymbolMethod } from 'react-icons/vsc';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import type { TerminalTheme } from '../config/themes';
import type { ShellType } from '../types';
import { SHELLS } from '../config/shells';

interface ShellSelectorProps {
  currentShell: ShellType;
  onShellChange: (shell: ShellType) => void;
  theme: TerminalTheme;
  disabled?: boolean;
}

// Shell icon mapping
const SHELL_ICONS: Record<ShellType, typeof VscTerminalBash> = {
  bash: VscTerminalBash,
  sh: VscTerminal,
  zsh: VscSymbolMethod,
};

export function ShellSelector({
  currentShell,
  onShellChange,
  theme,
  disabled = false,
}: ShellSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentShellConfig = SHELLS.find((s) => s.id === currentShell) || SHELLS[0];
  const CurrentIcon = SHELL_ICONS[currentShell];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '32px',
          padding: '0 10px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          color: disabled ? '#6b7280' : '#e5e5e5',
          fontSize: '12px',
          fontFamily: 'monospace',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
        title={disabled ? 'Shell switching disabled while connected' : 'Select shell'}
      >
        <CurrentIcon size={14} />
        <span>{currentShellConfig.name}</span>
        <FiChevronDown
          size={12}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '140px',
            backgroundColor: theme.colors.background,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {SHELLS.map((shell) => {
            const isActive = shell.id === currentShell;
            const ShellIcon = SHELL_ICONS[shell.id];
            return (
              <button
                key={shell.id}
                onClick={() => {
                  onShellChange(shell.id);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? `2px solid ${theme.colors.green}` : '2px solid transparent',
                  color: isActive ? theme.colors.foreground : '#9ca3af',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  cursor: isActive ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = theme.colors.foreground;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                <ShellIcon size={16} />
                <span>{shell.name}</span>
                {isActive && (
                  <FiCheck
                    size={14}
                    color={theme.colors.green}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
