import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'terminal-settings';

export interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
  cursorBlink: boolean;
}

const DEFAULT_SETTINGS: TerminalSettings = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
  cursorBlink: true,
};

interface UseTerminalSettingsReturn extends TerminalSettings {
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setCursorBlink: (blink: boolean) => void;
  resetToDefaults: () => void;
}

export function useTerminalSettings(): UseTerminalSettingsReturn {
  const [settings, setSettings] = useState<TerminalSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      } catch {
        // Invalid JSON, use defaults
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setFontSize = useCallback((size: number) => {
    // Clamp between 10 and 24
    const clamped = Math.max(10, Math.min(24, size));
    setSettings((s) => ({ ...s, fontSize: clamped }));
  }, []);

  const setFontFamily = useCallback((family: string) => {
    setSettings((s) => ({ ...s, fontFamily: family }));
  }, []);

  const setCursorBlink = useCallback((blink: boolean) => {
    setSettings((s) => ({ ...s, cursorBlink: blink }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    ...settings,
    setFontSize,
    setFontFamily,
    setCursorBlink,
    resetToDefaults,
  };
}
