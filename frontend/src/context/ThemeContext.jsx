import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'mentorsync_theme';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  isLight: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

function readInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore storage access errors
  }
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return 'dark';
}

function applyThemeToDocument(nextTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', nextTheme);
  root.classList.remove('dark', 'light');
  root.classList.add(nextTheme);
  root.style.colorScheme = nextTheme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const setTheme = useCallback((value) => {
    if (value === 'light' || value === 'dark') {
      setThemeState(value);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      isLight: theme === 'light',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
