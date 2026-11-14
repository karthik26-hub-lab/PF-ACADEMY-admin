// Shared by the Phase 4 reports: the page frame, filters (course, batch, class mode) and stat tiles.
import type { ReactNode } from 'react';
import { Page } from '../../components/layout/Page';
import { Badge, Card, Segmented, Select } from '../../components/ui';
import { MODE, modeOf, type ClassMode } from '../../lib/insights';
import { href } from '../../lib/router';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { CourseToggle, type CourseFilter } from '../store/shared';

export type Filters = { course: CourseFilter; batch: string; mode: 'all' | ClassMode };
export const NO_FILTERS: Filters = { course: 'all', batch: 'all', mode: 'all' };

/** Students (and batches) matching the filters. */
export function useFiltered(f: Filters) {
  const { students, batches } = useStore();
  const shownBatches = batches.filter((b) => b.status === 'active' && (f.course === 'all' || b.course === f.course));
  const ids = new Set(shownBatches.filter((b) => f.batch === 'all' || b.id === f.batch).map((b) => b.id));
  return { batches: shownBatches, students: students.filter((s) => ids.has(s.batchId) && (f.mode === 'all' || modeOf(s) === f.mode)) };
}

export function FilterBar({ f, set, noMode, children }: { f: Filters; set: (f: Filters) => void; noMode?: boolean; children?: ReactNode }) {
  const { batches } = useFiltered({ ...f, batch: 'all' });
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <CourseToggle value={f.course} onChange={(course) => set({ ...f, course, batch: 'all' })} />
      <Select aria-label="Batch" value={f.batch} onChange={(e) => set({ ...f, batch: e.target.value })} className="w-full sm:w-64"><option value="all">All batches</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
      {!noMode && <Segmented value={f.mode} onChange={(mode) => set({ ...f, mode })} options={[{ value: 'all', label: 'All modes' }, ...(Object.keys(MODE) as ClassMode[]).map((m) => ({ value: m, label: MODE[m] }))]} />}
      {children}
    </div>
  );
}

export function ReportPage({ title, desc, actions, children }: { title: string; desc: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <Page crumbs={[{ label: 'Reports', href: href({ page: 'reports' }) }, { label: title }]} actions={actions}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h1 className="text-[28px] font-bold tracking-[-0.03em]">{title}</h1><p className="text-sm text-muted">{desc}</p></div><Badge tone="pop">Sample data</Badge></div>
      {children}
    </Page>
  );
}

export const tile = 'flex flex-col rounded-2xl bg-panel p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]';
export const Stat = ({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'pop' | 'bad' }) => (
  <div className={tile}><span className="text-xs text-muted">{label}</span><span className={cn('tnum mt-1 text-2xl font-bold leading-tight sm:text-[26px]', tone === 'pop' && 'text-pop', tone === 'bad' && 'text-bad')}>{value}</span>{sub && <span className="mt-auto pt-1 text-2xs text-muted">{sub}</span>}</div>
);
export const Box = ({ title, sub, right, children, className }: { title: string; sub?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) => (
  <Card className={cn('p-4 sm:p-5', className)}><div className="mb-4 flex items-start justify-between gap-3"><div><div className="text-sm font-semibold">{title}</div>{sub && <div className="text-2xs text-muted">{sub}</div>}</div>{right}</div>{children}</Card>
);
/** Horizontal bars: label, bar, value. */
export function Bars({ rows, format = String, max }: { rows: { label: ReactNode; value: number; tone?: 'pop' | 'bad' }[]; format?: (v: number) => string; max?: number }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">{rows.map((r, i) => (
      <li key={i} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto] items-center gap-3 text-xs"><span className="truncate text-muted">{r.label}</span>
        <span className="h-2 overflow-hidden rounded-full hatch"><span className={cn('block h-full rounded-full', r.tone === 'pop' ? 'bg-pop' : r.tone === 'bad' ? 'bg-bad' : 'bg-fg')} style={{ width: `${Math.min(100, (r.value / top) * 100)}%` }} /></span><b className="tnum text-right">{format(r.value)}</b></li>
    ))}</ul>
  );
}
/** The last `n` month labels, oldest first ("Jun"). */
export const lastMonths = (n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (n - 1 - i)); return d; });
export const monthIndex = (at: number, months: Date[]) => { const d = new Date(at); return months.findIndex((m) => m.getMonth() === d.getMonth() && m.getFullYear() === d.getFullYear()); };
