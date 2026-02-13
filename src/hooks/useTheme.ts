import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { createKarnetTheme } from '../theme';
import { db, getSettings } from '../data/db';

export function useKarnetTheme() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // Reactively watch settings from DB — any change triggers re-render
  const settings = useLiveQuery(() => db.userSettings.get('default'));

  // Initialize default settings if not yet created
  useEffect(() => {
    getSettings();
  }, []);

  const seedColor = settings?.seedColor ?? '#FF6B35';
  const themePreference = settings?.theme ?? 'system';

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

  return {
    theme,
    mode,
    seedColor,
    themePreference,
  };
}
