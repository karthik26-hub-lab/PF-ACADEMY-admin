import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Page } from '../components/layout/Page';
import { Badge, Button, Segmented, Select } from '../components/ui';
import { href } from '../lib/router';
import { useStore, type EventType } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn } from '../lib/utils';

const TYPE: Record<EventType, { label: string; dot: string; chip: string }> = {
  class: { label: 'Classes', dot: 'bg-border-strong', chip: 'bg-subtle text-fg' },
  exam: { label: 'Exams', dot: 'bg-fg', chip: 'bg-fg text-bg' },
  deadline: { label: 'Deadlines', dot: 'bg-coral', chip: 'bg-coral text-coral-fg' },
  holiday: { label: 'Holidays', dot: 'bg-pop', chip: 'bg-pop text-pop-fg' },
  event: { label: 'Events', dot: 'hatch ring-1 ring-border-strong', chip: 'hatch text-fg' },
};
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function Calendar() {
  const { events, batches, removeEvent } = useStore();
  const open = useUI((u) => u.open);
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [types, setTypes] = useState<'all' | EventType>('all');
  const [batch, setBatch] = useState('all');
  const [selected, setSelected] = useState(key(new Date()));
  const [dir, setDir] = useState(0);
  const filtered = useMemo(() => events.filter((e) => (types === 'all' || e.type === types) && (batch === 'all' || !e.batchId || e.batchId === batch)), [events, types, batch]);
  const byDay = useMemo(() => { const m = new Map<string, typeof events>(); filtered.forEach((e) => m.set(e.date, [...(m.get(e.date) || []), e])); return m; }, [filtered]);

  const first = new Date(month); const startDow = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(first); d.setDate(1 - startDow + i); return d; });
  const today = key(new Date());
  const shift = (n: number) => { setDir(n); const d = new Date(month); d.setMonth(d.getMonth() + n); setMonth(d); };
  const dayEvents = (byDay.get(selected) || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const upcoming = filtered.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')).slice(0, 8);

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Academic calendar' }]} actions={<Button variant="primary" onClick={() => open('event', selected)}><Plus /> Add to calendar</Button>}>
      <div className="mb-6"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Academic calendar</h1><p className="text-sm text-muted">Classes, examinations, deadlines, holidays and events.</p></div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented value={types} onChange={setTypes} options={[{ value: 'all', label: 'All' }, ...(Object.keys(TYPE) as EventType[]).map((t) => ({ value: t, label: TYPE[t].label }))]} />
        <Select aria-label="Batch" value={batch} onChange={(e) => setBatch(e.target.value)} className="w-56"><option value="all">All batches</option>{batches.filter((b) => b.status === 'active').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
            <div className="flex gap-1">
              <Button size="icon" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft /></Button>
              <Button size="sm" className="h-10" onClick={() => { const d = new Date(); d.setDate(1); setDir(0); setMonth(d); setSelected(today); }}>Today</Button>
              <Button size="icon" onClick={() => shift(1)} aria-label="Next month"><ChevronRight /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 pb-1 text-center text-2xs font-semibold text-faint">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}</div>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div key={key(month)} custom={dir} initial={{ opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -30 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                const k = key(d), list = byDay.get(k) || [], inMonth = d.getMonth() === month.getMonth();
                return (
                  <button key={k} onClick={() => setSelected(k)} className={cn('flex min-h-[78px] flex-col rounded-xl p-1.5 text-left transition-colors sm:min-h-[92px]', selected === k ? 'bg-fg text-bg' : 'hover:bg-subtle', !inMonth && 'opacity-40')}>
                    <span className={cn('tnum grid size-6 place-items-center rounded-full text-xs font-bold', k === today && selected !== k && 'bg-pop text-pop-fg')}>{d.getDate()}</span>
                    <span className="mt-1 hidden w-full space-y-0.5 sm:block">
                      {list.slice(0, 2).map((e) => <span key={e.id} className={cn('block truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold', selected === k ? 'bg-bg/15 text-bg' : TYPE[e.type].chip)}>{e.title}</span>)}
                      {list.length > 2 && <span className={cn('block px-1.5 text-[10px]', selected === k ? 'text-bg/70' : 'text-muted')}>+{list.length - 2} more</span>}
                    </span>
                    <span className="mt-auto flex gap-0.5 sm:hidden">{list.slice(0, 3).map((e) => <i key={e.id} className={cn('size-1.5 rounded-full', TYPE[e.type].dot)} />)}</span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex flex-wrap gap-4 text-2xs text-muted">{(Object.keys(TYPE) as EventType[]).map((t) => <span key={t} className="flex items-center gap-1.5"><i className={cn('size-2.5 rounded-full', TYPE[t].dot)} />{TYPE[t].label}</span>)}</div>
        </section>
        <div className="space-y-5">
          <section className="rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{new Date(selected).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h3><Button size="sm" onClick={() => open('event', selected)}><Plus /> Add</Button></div>
            {dayEvents.length ? <ul className="space-y-2">{dayEvents.map((e) => (
              <li key={e.id} className="group flex items-center gap-3 rounded-xl bg-subtle p-3"><span className={cn('size-2.5 shrink-0 rounded-full', TYPE[e.type].dot)} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{e.title}</span><span className="text-2xs text-muted">{e.time || 'All day'} · {e.batchId ? batches.find((b) => b.id === e.batchId)?.name : 'Whole academy'}</span></span>
                <button onClick={() => removeEvent(e.id)} className="opacity-0 transition group-hover:opacity-100" aria-label={`Remove ${e.title}`}><Trash2 className="size-4 text-muted" /></button></li>
            ))}</ul> : <p className="text-sm text-muted">Nothing on this day.</p>}
          </section>
          <section className="rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <h3 className="mb-3 font-bold">Coming up</h3>
            <ul className="space-y-2">{upcoming.map((e) => (
              <li key={e.id}><button onClick={() => { setSelected(e.date); const d = new Date(e.date); d.setDate(1); setMonth(d); }} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-subtle">
                <span className="grid w-11 shrink-0 place-items-center rounded-xl bg-subtle py-1 leading-none"><span className="text-[9px] font-semibold uppercase text-muted">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</span><span className="tnum text-base font-bold">{new Date(e.date).getDate()}</span></span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{e.title}</span><Badge tone={e.type === 'exam' ? 'ink' : e.type === 'holiday' ? 'pop' : 'neutral'}>{TYPE[e.type].label.replace(/s$/, '')}</Badge>
              </button></li>
            ))}</ul>
          </section>
        </div>
      </div>
    </Page>
  );
}
