import type { ThemePreference } from '../types/api';

const THEME_STORAGE_KEY = 'dayform_theme_pref';

export function getCachedTheme(): ThemePreference {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'Light' || raw === 'Dark' || raw === 'Auto') return raw;
  return 'Auto';
}

export function applyThemePreference(theme: ThemePreference): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  if (theme === 'Auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme.toLowerCase());
  }
}

