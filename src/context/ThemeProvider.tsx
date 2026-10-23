import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSettings } from './SettingsContext';

interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { settings, updateSettings, loading } = useSettings();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (loading) return;
    
    const applyTheme = () => {
      let resolved: 'light' | 'dark';
      
      if (settings.theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = settings.theme;
      }
      
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };
    
    applyTheme();
    
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme, loading]);

  // Seasonal Halloween accent (easter egg) — just flips a CSS attribute.
  useEffect(() => {
    if (loading) return;
    document.documentElement.toggleAttribute('data-halloween', !!settings.halloween);
  }, [settings.halloween, loading]);

  const setTheme = async (theme: 'light' | 'dark' | 'system') => {
    await updateSettings({ theme });
  };

  return (
    <ThemeContext.Provider value={{ theme: settings.theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};