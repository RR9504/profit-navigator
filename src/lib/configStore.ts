import type { AdminConfig } from './types';
import { defaultConfig } from './defaultConfig';

const STORAGE_KEY = 'sparbank-admin-config';

export function loadConfig(): AdminConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* fall through */ }
  return { ...defaultConfig };
}

export function saveConfig(config: AdminConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetConfig(): AdminConfig {
  localStorage.removeItem(STORAGE_KEY);
  return { ...defaultConfig };
}
