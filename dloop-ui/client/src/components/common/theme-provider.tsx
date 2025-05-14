'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  forcedTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Initialize with stored theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  // Apply the theme whenever it changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // First ensure transition classes are applied before changing the theme
    if (!root.classList.contains('theme-transition')) {
      root.classList.add('theme-transition');
    }
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');

    // Handle forced theme
    if (forcedTheme) {
      root.classList.add(forcedTheme);
      root.setAttribute('data-theme', forcedTheme);
      return;
    }

    // Determine the actual theme to apply
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    
    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    
    // Apply theme
    root.classList.add(effectiveTheme);
    root.setAttribute('data-theme', effectiveTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newSystemTheme);
        root.setAttribute('data-theme', newSystemTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, forcedTheme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (forcedTheme) return;
      setTheme(theme);
      localStorage.setItem('theme', theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};