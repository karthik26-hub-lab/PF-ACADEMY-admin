import { create } from 'zustand';

export type DialogName = 'batch' | 'student' | 'invite' | 'import' | 'command' | 'event' | 'recorded' | 'calimport' | 'shortcuts' | null;
export type Theme = 'light' | 'dark' | 'system';

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

interface UI {
  dialog: DialogName; dialogArg: string | null;
  open: (d: DialogName, arg?: string | null) => void; close: () => void;
  collapsed: boolean; toggleCollapsed: () => void;
  mobileNav: boolean; setMobileNav: (v: boolean) => void;
  theme: Theme; setTheme: (t: Theme) => void;
  examPreset: { status: string; kind: string }; setExamPreset: (p: Partial<{ status: string; kind: string }>) => void;
  studentPreset: { batch: string; phone: boolean }; setStudentPreset: (p: Partial<{ batch: string; phone: boolean }>) => void;
  /** A date the calendar should jump to next (set after an import). */
  calendarJump: string | null; setCalendarJump: (d: string | null) => void;
}

export const useUI = create<UI>((set) => ({
  dialog: null, dialogArg: null,
  open: (dialog, dialogArg = null) => set({ dialog, dialogArg, mobileNav: false }),
  close: () => set({ dialog: null, dialogArg: null }),
  collapsed: read('pf-collapsed') === '1',
  toggleCollapsed: () => set((s) => { write('pf-collapsed', s.collapsed ? '0' : '1'); return { collapsed: !s.collapsed }; }),
  mobileNav: false, setMobileNav: (mobileNav) => set({ mobileNav }),
  examPreset: { status: 'all', kind: 'all' }, setExamPreset: (p) => set((s) => ({ examPreset: { ...s.examPreset, ...p } })),
  calendarJump: null, setCalendarJump: (calendarJump) => set({ calendarJump }),
  studentPreset: { batch: 'all', phone: false }, setStudentPreset: (p) => set((s) => ({ studentPreset: { ...s.studentPreset, ...p } })),
  theme: (read('pf-theme') as Theme) || 'system',
  setTheme: (theme) => {
    const run = () => { write('pf-theme', theme); applyTheme(theme); set({ theme }); };
    // Cross-fade the whole screen when the theme changes, where the browser supports it.
    const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    let done = false;
    const once = () => { if (!done) { done = true; run(); } };
    try {
      if (d.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        d.startViewTransition(once);
        setTimeout(once, 250); // safety net if the browser skips the transition callback
        return;
      }
    } catch { /* view transitions not allowed here */ }
    once();
  },
}));

// "System" follows a host-set data-theme (e.g. when embedded) or else the OS setting.
export function systemIsDark() {
  const host = document.documentElement.dataset.theme;
  return host ? host === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark' || (t === 'system' && systemIsDark()));
}
