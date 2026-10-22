import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getSettings, saveSettings } from '../db';
import type { Settings } from '../types';

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  updateSettings: (settings: Partial<Settings>) => Promise<Settings>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const defaultSettings: Settings = {
  theme: 'system',
  notificationsEnabled: false,
  autoGenerateRecurring: true,
  recurringLookaheadDays: 30,
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const loaded = await getSettings();
      setSettings(loaded);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>): Promise<Settings> => {
    const updated = await saveSettings(newSettings);
    setSettings(updated);
    return updated;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};