import { useEffect } from 'react';
import { navigate, type Route } from '../../lib/router';
import { useUI } from '../../lib/ui-state';
import { Dialog, Kbd } from '../ui';

const GO: Record<string, [string, Route]> = {
  d: ['Dashboard', { page: 'overview' }],
  a: ['Academics', { page: 'academics' }],
  b: ['Batches', { page: 'batches' }],
  s: ['Students', { page: 'students' }],
  f: ['Faculty', { page: 'faculty' }],
  c: ['Academic calendar', { page: 'calendar' }],
  l: ['Learning', { page: 'learning' }],
  e: ['Exams', { page: 'exams' }],
  r: ['Reports', { page: 'reports' }],
  ',': ['Settings', { page: 'settings', tab: 'general' }],
};

const ACTIONS: [string[], string][] = [
  [['Ctrl', 'K'], 'Search and commands'],
  [['/'], 'Search'],
  [['N'], 'Create a test'],
  [['Shift', 'S'], 'Add students'],
  [['Shift', 'B'], 'New batch'],
  [['?'], 'Show this list'],
];

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
};

/** Single-key shortcuts, plus "G then a letter" to jump between sections. */
export function Shortcuts() {
  const { dialog, open, close } = useUI();

  useEffect(() => {
    let pendingG = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      // Leave keys alone while another dialog is open, except to close the shortcuts list.
      const current = useUI.getState().dialog;
      if (current && current !== 'shortcuts') return;
      const k = e.key;
      if (pendingG && Date.now() - pendingG < 1200) {
        pendingG = 0;
        const hit = GO[k.toLowerCase()];
        if (hit) { e.preventDefault(); close(); navigate(hit[1]); }
        return;
      }
      if (k === 'g' || k === 'G') { pendingG = Date.now(); return; }
      if (k === '?') { e.preventDefault(); current === 'shortcuts' ? close() : open('shortcuts'); return; }
      if (current) return;
      if (k === '/') { e.preventDefault(); open('command'); }
      else if (k === 'n') { e.preventDefault(); navigate({ page: 'exam-new' }); }
      else if (k === 'S') { e.preventDefault(); open('student'); }
      else if (k === 'B') { e.preventDefault(); open('batch'); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <Dialog open={dialog === 'shortcuts'} onOpenChange={(v) => (v ? open('shortcuts') : close())} title="Keyboard shortcuts" desc="Work faster without the mouse." wide>
      <div className="grid gap-6 pb-2 sm:grid-cols-2">
        <section>
          <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-faint">Actions</h3>
          <ul className="space-y-1">
            {ACTIONS.map(([keys, label]) => (
              <li key={label} className="flex h-9 items-center justify-between rounded-lg px-2 text-sm hover:bg-subtle">
                {label}<span className="flex gap-1">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-faint">Go to</h3>
          <ul className="space-y-1">
            {Object.entries(GO).map(([k, [label]]) => (
              <li key={k} className="flex h-9 items-center justify-between rounded-lg px-2 text-sm hover:bg-subtle">
                {label}<span className="flex items-center gap-1"><Kbd>G</Kbd><span className="text-2xs text-faint">then</span><Kbd>{k.toUpperCase()}</Kbd></span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Dialog>
  );
}
