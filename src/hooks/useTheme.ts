import { useState, useEffect, useMemo } from 'react';
import { createKarnetTheme } from '../theme';
import { db, getSettings } from '../data/db';

export function useKarnetTheme() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [seedColor, setSeedColor] = useState('#FF6B35');
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');

  // Load settings on mount
  useEffect(() => {
    getSettings().then((settings) => {
      setThemePreference(settings.theme);
      setSeedColor(settings.seedColor);
    });
  }, []);

  // Listen to system preference
  useEffect(() => {
    if (themePreference !== 'system') {
      setMode(themePreference);
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setMode(mq.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => setMode(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themePreference]);

  const theme = useMemo(
    () => createKarnetTheme(mode, seedColor),
    [mode, seedColor]
  );

  const updateThemePreference = async (pref: 'light' | 'dark' | 'system') => {
    setThemePreference(pref);
    await db.userSettings.update('default', {
      theme: pref,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateSeedColor = async (color: string) => {
    setSeedColor(color);
    await db.userSettings.update('default', {
      seedColor: color,
      updatedAt: new Date().toISOString(),
    });
  };

  return {
    theme,
    mode,
    seedColor,
    themePreference,
    updateThemePreference,
    updateSeedColor,
  };
}
