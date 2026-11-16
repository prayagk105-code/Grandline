import type { ThemePreference } from '../types/api';

const THEME_STORAGE_KEY = 'dayform_theme_pref';

export function getCachedTheme(): ThemePreference {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'Dark') return 'Dark';
  return 'Light';
}

export function applyThemePreference(theme: ThemePreference): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  if (theme === 'Dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

