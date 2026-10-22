import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '../db';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      const settings = await getSettings();
      setThemeState(settings.theme);
      setLoading(false);
    };
    
    loadTheme();
  }, []);

  useEffect(() => {
    if (loading) return;
    
    const applyTheme = () => {
      let resolved: 'light' | 'dark';
      
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };
    
    applyTheme();
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, loading]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    await saveSettings({ theme: newTheme });
  }, []);

  return { theme, resolvedTheme, setTheme, loading };
};