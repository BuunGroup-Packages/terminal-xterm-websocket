import { useState, useEffect, useCallback } from 'react';
import { THEMES, DEFAULT_THEME_ID, getThemeById, type TerminalTheme } from '../config/themes';

const STORAGE_KEY = 'terminal-theme';

interface UseTerminalThemeReturn {
  theme: TerminalTheme;
  themes: TerminalTheme[];
  setThemeById: (id: string) => void;
}

export function useTerminalTheme(): UseTerminalThemeReturn {
  const [theme, setTheme] = useState<TerminalTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return getThemeById(saved);
      }
    }
    return getThemeById(DEFAULT_THEME_ID);
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme.id);
  }, [theme]);

  const setThemeById = useCallback((id: string) => {
    setTheme(getThemeById(id));
  }, []);

  return {
    theme,
    themes: THEMES,
    setThemeById,
  };
}
