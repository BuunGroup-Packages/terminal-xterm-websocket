import { useState, useRef, useEffect } from 'react';
import type { TerminalTheme } from '../config/themes';

interface ThemeSelectorProps {
  themes: TerminalTheme[];
  currentTheme: TerminalTheme;
  onThemeChange: (themeId: string) => void;
}

export function ThemeSelector({
  themes,
  currentTheme,
  onThemeChange,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          color: '#e5e5e5',
          fontSize: '12px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            backgroundColor: currentTheme.colors.background,
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        />
        {currentTheme.name}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: '180px',
            backgroundColor: '#1f1f1f',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                onThemeChange(theme.id);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                backgroundColor:
                  theme.id === currentTheme.id
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'transparent',
                border: 'none',
                color: '#e5e5e5',
                fontSize: '12px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (theme.id !== currentTheme.id) {
                  e.currentTarget.style.backgroundColor =
                    'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (theme.id !== currentTheme.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '2px',
                  backgroundColor: theme.colors.background,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '4px',
                    height: '8px',
                    backgroundColor: theme.colors.green,
                    borderRadius: '1px',
                  }}
                />
              </div>
              <span>{theme.name}</span>
              {theme.id === currentTheme.id && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  style={{ marginLeft: 'auto' }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
