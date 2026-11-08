import { create } from 'zustand';

export type DialogName = 'batch' | 'student' | 'invite' | 'import' | 'command' | null;
export type Theme = 'light' | 'dark' | 'system';

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

interface UI {
  dialog: DialogName; dialogArg: string | null;
  open: (d: DialogName, arg?: string | null) => void; close: () => void;
  collapsed: boolean; toggleCollapsed: () => void;
  mobileNav: boolean; setMobileNav: (v: boolean) => void;
  theme: Theme; setTheme: (t: Theme) => void;
}

export const useUI = create<UI>((set) => ({
  dialog: null, dialogArg: null,
  open: (dialog, dialogArg = null) => set({ dialog, dialogArg, mobileNav: false }),
  close: () => set({ dialog: null, dialogArg: null }),
  collapsed: read('pf-collapsed') === '1',
  toggleCollapsed: () => set((s) => { write('pf-collapsed', s.collapsed ? '0' : '1'); return { collapsed: !s.collapsed }; }),
  mobileNav: false, setMobileNav: (mobileNav) => set({ mobileNav }),
  theme: (read('pf-theme') as Theme) || 'system',
  setTheme: (theme) => { write('pf-theme', theme); set({ theme }); },
}));

// "System" follows a host-set data-theme (e.g. when embedded) or else the OS setting.
export function systemIsDark() {
  const host = document.documentElement.dataset.theme;
  return host ? host === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark' || (t === 'system' && systemIsDark()));
}
