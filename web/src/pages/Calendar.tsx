import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, Clapperboard, FileUp, Layers, MonitorPlay, Pencil, PlayCircle, Plus, School, Trash2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { Button, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger, EmptyState, Select, Tip, spring } from '../components/ui';
import { DELIVERY, LIVE_TYPE, LIVE_TYPES, REC_TYPE, REC_TYPES, deadlineCourse, inLiveView, matchesBatch, timeRange } from '../lib/calendar';
import { href } from '../lib/router';
import { COURSES, useStore, type CalendarEvent, type Course, type Delivery, type EventType, type RecordedDay, type RecordedType } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn, prefs } from '../lib/utils';

type View = Delivery | 'recorded';
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const panel = 'rounded-[22px] bg-panel ring-1 ring-black/[0.04] dark:ring-white/[0.06]';
const VIEW_KEY = 'pf-calendar-view';
const ease = [0.22, 1, 0.36, 1] as const;

export function Calendar() {
  const open = useUI((u) => u.open);
  const { events, recorded, batches } = useStore();
  const [view, setView] = useState<View>(() => prefs.get<{ v: View }>(VIEW_KEY, { v: 'offline' }).v);
  useEffect(() => { prefs.set(VIEW_KEY, { v: view }); }, [view]);
  const [course, setCourse] = useState<Course>('CA Inter');
  const [selected, setSelected] = useState(key(new Date()));
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  // After an import, jump to the first imported date.
  const jump = useUI((u) => u.calendarJump);
  useEffect(() => {
    if (!jump) return;
    const d = fromKey(jump); setSelected(jump); setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    if (view === 'recorded') setView('offline');
    useUI.getState().setCalendarJump(null);
  }, [jump]); // eslint-disable-line

  const monthKey = key(month).slice(0, 7);
  const countIn = (v: Delivery) => events.filter((e) => e.date.startsWith(monthKey) && inLiveView(e, v)).length;
  const recDays = new Set(recorded.filter((r) => r.course === course).map((r) => r.day)).size;
  void batches;

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Academic calendar' }]}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-[28px] font-bold tracking-[-0.03em]">Academic calendar</h1><p className="text-sm text-muted">Live sessions by date, recorded plans by day.</p></div>
      </div>

      <ModeSwitch value={view} onChange={setView} items={[
        { value: 'offline', label: 'Offline', sub: `${countIn('offline')} this month`, icon: School },
        { value: 'online', label: 'Online Live', sub: `${countIn('online')} this month`, icon: MonitorPlay },
        { value: 'recorded', label: 'Recorded', sub: `${recDays} days · ${course}`, icon: Clapperboard },
      ]} />

      {/* Switching views swaps instantly and fades the new one in; nothing waits on the old one leaving. */}
      <>
        <motion.div key={view === 'recorded' ? 'rec' : 'live'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }}>
          {view === 'recorded'
            ? <RecordedPlan course={course} setCourse={setCourse} onAdd={() => open('recorded', `new:${course}`)} onImport={() => open('calimport', `recorded|${course}`)} />
            : <LiveCalendar view={view} month={month} setMonth={setMonth} selected={selected} setSelected={setSelected}
                onAdd={(d) => open('event', `${d}|${view}`)} onImport={() => open('calimport', `live|${course}|${view}`)} />}
        </motion.div>
      </>
    </Page>
  );
}

// ---------- Shared pieces ----------
function ModeSwitch<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; sub: string; icon: ElementType }[] }) {
  return (
    <div role="tablist" aria-label="Calendar" className="mb-5 grid grid-cols-3 gap-1 rounded-[22px] bg-subtle p-1 ring-1 ring-inset ring-border sm:inline-grid sm:min-w-[560px]">
      {items.map((it) => {
        const on = value === it.value;
        return (
          <button key={it.value} role="tab" aria-selected={on} onClick={() => onChange(it.value)}
            className={cn('relative flex flex-col items-center gap-1.5 rounded-[18px] px-2 py-2.5 text-center transition-colors duration-200 sm:flex-row sm:gap-2.5 sm:px-3 sm:text-left', on ? 'text-fg' : 'text-muted hover:text-fg')}>
            {on && <motion.span layoutId="cal-mode" transition={spring} className="absolute inset-0 rounded-[18px] bg-panel shadow-[0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_-8px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]" />}
            <span className={cn('relative grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-200', on ? 'bg-pop text-pop-fg' : 'bg-panel ring-1 ring-border')}><it.icon className="size-4" /></span>
            <span className="relative min-w-0"><span className="block truncate text-xs font-semibold sm:text-sm">{it.label}</span><span className="hidden truncate text-2xs text-muted sm:block">{it.sub}</span></span>
          </button>
        );
      })}
    </div>
  );
}

/** Coloured chips that switch a type on or off; "All" brings every type back. */
function TypeChips<T extends string>({ types, meta, counts, hidden, setHidden }: { types: T[]; meta: Record<T, { plural: string; tone: string }>; counts: Record<string, number>; hidden: Set<T>; setHidden: (s: Set<T>) => void }) {
  const toggle = (t: T) => { const n = new Set(hidden); n.has(t) ? n.delete(t) : n.add(t); if (n.size === types.length) n.clear(); setHidden(n); };
  const allOn = hidden.size === 0;
  return (
    <LayoutGroup>
      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={() => setHidden(new Set())} className={cn('h-8 rounded-full px-3 text-xs font-semibold transition-colors duration-200', allOn ? 'bg-fg/[0.07] text-fg ring-1 ring-inset ring-fg/15' : 'text-muted hover:bg-subtle hover:text-fg')}>All</button>
        {types.map((t) => {
          const on = !hidden.has(t);
          return (
            <motion.button layout key={t} onClick={() => toggle(t)} aria-pressed={on} transition={{ duration: 0.2 }}
              className={cn('flex h-8 items-center gap-1.5 rounded-full pl-2 pr-2.5 text-xs font-semibold transition-[background-color,color,opacity] duration-200', meta[t].tone, on ? 'tone-soft' : 'text-faint opacity-70 hover:opacity-100')}>
              <motion.i layout className={cn('size-2.5 rounded-full', on ? 'tone-bar' : 'bg-border-strong')} />
              {meta[t].plural}<span className="tnum opacity-60">{counts[t] ?? 0}</span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function AddMenu({ onAdd, onImport, addLabel, addHint }: { onAdd: () => void; onImport: () => void; addLabel: string; addHint: string }) {
  const item = (Icon: ElementType, title: string, hint: string, run: () => void) => (
    <DropdownItem onSelect={run} className="h-auto gap-3 rounded-xl p-2 [&_svg]:text-fg">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-subtle ring-1 ring-inset ring-border"><Icon /></span>
      <span className="min-w-0 flex-1 leading-tight"><span className="block text-sm font-semibold">{title}</span><span className="mt-0.5 block text-2xs text-muted">{hint}</span></span>
    </DropdownItem>
  );
  return (
    <DropdownMenu>
      <Tip label="Add or import" side="bottom"><DropdownTrigger className="grid size-10 place-items-center rounded-full bg-fg text-bg transition hover:bg-fg/85 active:scale-[0.96]" aria-label="Add or import"><Plus className="size-[18px]" /></DropdownTrigger></Tip>
      <DropdownContent className="w-[280px] p-1.5">
        {item(CalendarPlus, addLabel, addHint, onAdd)}
        {item(FileUp, 'Import a file', 'Excel, CSV or Word, detected automatically', onImport)}
      </DropdownContent>
    </DropdownMenu>
  );
}

/** A small tear-off calendar leaf: label strip on top, the number centred below. */
const DateLeaf = ({ top, big }: { top: string; big: ReactNode }) => (
  <div className="w-14 shrink-0 overflow-hidden rounded-2xl bg-panel text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-border">
    <div className="bg-pop py-[3px] text-[10px] font-bold uppercase tracking-[0.12em] text-pop-fg">{top}</div>
    <div className="tnum grid h-10 place-items-center text-[22px] font-bold leading-none">{big}</div>
  </div>
);

// ---------- Offline / Online Live ----------
function LiveCalendar({ view, month, setMonth, selected, setSelected, onAdd, onImport }: {
  view: Delivery; month: Date; setMonth: (d: Date) => void; selected: string; setSelected: (k: string) => void; onAdd: (date: string) => void; onImport: () => void;
}) {
  const { events, batches } = useStore();
  const [mode, setMode] = useState<'month' | 'week'>(() => prefs.get<{ m: 'month' | 'week' }>('pf-calendar-mode', { m: 'month' }).m);
  useEffect(() => { prefs.set('pf-calendar-mode', { m: mode }); }, [mode]);
  const [hidden, setHidden] = useState<Set<EventType>>(new Set());
  const [batch, setBatch] = useState('all');
  const [dir, setDir] = useState(0);
  const inView = useMemo(() => events.filter((e) => inLiveView(e, view) && matchesBatch(e, batch, batches)), [events, view, batch, batches]);
  const shown = useMemo(() => inView.filter((e) => !hidden.has(e.type)), [inView, hidden]);
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    shown.forEach((e) => m.set(e.date, [...(m.get(e.date) || []), e]));
    m.forEach((l) => l.sort((a, b) => order(a) - order(b) || (a.time || '').localeCompare(b.time || '')));
    return m;
  }, [shown]);
  const monthKey = key(month).slice(0, 7);
  const counts = Object.fromEntries(LIVE_TYPES.map((t) => [t, inView.filter((e) => e.type === t && e.date.startsWith(monthKey)).length]));

  const weekStart = useMemo(() => { const d = fromKey(selected); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }, [selected]);
  const shift = (n: number) => {
    setDir(n);
    if (mode === 'month') { const d = new Date(month); d.setMonth(d.getMonth() + n); setMonth(d); }
    else { const d = fromKey(selected); d.setDate(d.getDate() + 7 * n); setSelected(key(d)); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }
  };
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  // Week view opens on the selected day's week; if that day is in another month, on this month's first week.
  const switchMode = (m: 'month' | 'week') => { if (m === 'week' && !selected.startsWith(monthKey)) setSelected(key(month)); setDir(0); setMode(m); };
  const heading = mode === 'month'
    ? <>{month.toLocaleDateString('en-IN', { month: 'long' })} <span className="text-faint">{month.getFullYear()}</span></>
    : <>{weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} <span className="text-faint">{weekEnd.getFullYear()}</span></>;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className={cn(panel, 'min-w-0 p-4 sm:p-5')}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-xl font-bold tracking-tight">{heading}</h2>
          <div className="flex items-center rounded-full bg-subtle p-1 ring-1 ring-inset ring-border">
            {(['month', 'week'] as const).map((m) => (
              <button key={m} onClick={() => switchMode(m)} className={cn('relative h-8 rounded-full px-3.5 text-xs font-semibold capitalize transition-colors', mode === m ? 'text-fg' : 'text-muted hover:text-fg')}>
                {mode === m && <motion.span layoutId="cal-span" transition={spring} className="absolute inset-0 rounded-full bg-panel shadow-xs ring-1 ring-black/[0.05] dark:ring-white/[0.08]" />}<span className="relative">{m}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => shift(-1)} aria-label={`Previous ${mode}`}><ChevronLeft /></Button>
            <Button size="icon" variant="ghost" onClick={() => shift(1)} aria-label={`Next ${mode}`}><ChevronRight /></Button>
          </div>
          <AddMenu onAdd={() => onAdd(selected)} onImport={onImport} addLabel="Add on calendar" addHint="A class, exam, deadline, holiday, event or task" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <TypeChips types={LIVE_TYPES} meta={LIVE_TYPE} counts={counts} hidden={hidden} setHidden={setHidden} />
          <Select aria-label="Batch" value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full sm:ml-auto sm:w-56"><option value="all">All batches</option>{batches.filter((b) => b.status === 'active').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
        </div>

        <div className="mt-4">
          {/* A new month slides in; within a month, Month <-> Week and week-to-week moves fold in place. */}
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div key={monthKey} custom={dir} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }} transition={{ duration: 0.28, ease }}>
              <CalendarGrid month={month} mode={mode} byDay={byDay} selected={selected} setSelected={setSelected} onAdd={onAdd}
                onOpenWeek={(k) => { setSelected(k); setMode('week'); }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <DayAgenda date={selected} list={byDay.get(selected) || []} view={view} onAdd={() => onAdd(selected)} upcoming={shown} onPick={(d) => { setSelected(d); const x = fromKey(d); setMonth(new Date(x.getFullYear(), x.getMonth(), 1)); }} />
    </div>
  );
}
/** Cell label: the colour already says "class", so the word is dropped to save room. */
const short = (e: CalendarEvent) => (e.type === 'class' ? e.title.replace(/\s+class$/i, '') : e.title);
// All-day items first (holiday, deadline), then by time.
const order = (e: CalendarEvent) => (e.type === 'holiday' ? 0 : e.type === 'deadline' ? 1 : e.time ? 3 : 2);

/** ISO week number, shown in the gutter of the month view. */
function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  return Math.ceil(((+t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400e3 + 1) / 7);
}
const H0 = 7, H1 = 21, ROW = 44;
const mins = (t?: string) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const COLS = 'grid-cols-[30px_repeat(7,minmax(0,1fr))] sm:grid-cols-[44px_repeat(7,minmax(0,1fr))]';

/**
 * One grid for both views. In Week view the other weeks fold away, the chosen week stays where it was
 * (now holding only all-day items), and the hour-by-hour timeline opens beneath it. Back to Month reverses it.
 */
function CalendarGrid({ month, mode, byDay, selected, setSelected, onAdd, onOpenWeek }: {
  month: Date; mode: 'month' | 'week'; byDay: Map<string, CalendarEvent[]>; selected: string; setSelected: (k: string) => void; onAdd: (k: string) => void; onOpenWeek: (k: string) => void;
}) {
  const startDow = (month.getDay() + 6) % 7;
  const count = Math.ceil((startDow + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7);
  const weeks = Array.from({ length: count }, (_, w) => Array.from({ length: 7 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - startDow + w * 7 + i)));
  const selRow = Math.max(0, weeks.findIndex((w) => w.some((d) => key(d) === selected)));
  const week = mode === 'week';
  const today = key(new Date());
  const fold = { duration: 0.42, ease };

  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-border">
      <motion.div initial={false} animate={{ minWidth: week ? 640 : 0 }} transition={fold}>
        <div className={cn('grid bg-subtle text-2xs font-semibold uppercase tracking-wide text-faint', COLS)}>
          <div className="py-2 text-center normal-case tracking-normal">{week ? '' : 'Wk'}</div>
          {weeks[selRow].map((d, i) => (
            <div key={i} className="truncate px-1.5 py-2 sm:px-2.5">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
          ))}
        </div>

        {weeks.map((days, w) => {
          const visible = !week || w === selRow;
          return (
            <motion.div key={w} initial={false} animate={visible ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }} transition={fold} className="overflow-hidden" aria-hidden={!visible}>
              <div className={cn('grid gap-px border-t border-border bg-border', COLS)}>
                {week
                  ? <div className="flex items-start justify-end bg-subtle px-1 pt-2 text-[10px] text-faint sm:px-1.5">All day</div>
                  : <Tip label="Open this week" side="right">
                      <button onClick={() => onOpenWeek(key(days.find((d) => d.getMonth() === month.getMonth()) ?? days[0]))} className="bg-subtle pt-2 text-center text-[10px] font-semibold text-faint transition-colors hover:text-fg" aria-label={`Open week ${isoWeek(days[0])}`}>{isoWeek(days[0])}</button>
                    </Tip>}
                {days.map((d) => {
                  const k = key(d), all = byDay.get(k) || [], inMonth = d.getMonth() === month.getMonth(), on = selected === k, isToday = k === today;
                  const list = week ? all.filter((e) => !e.time) : all;
                  const holiday = all.find((e) => e.type === 'holiday');
                  return (
                    <div key={k} role="button" tabIndex={visible ? 0 : -1} onClick={() => setSelected(k)} onDoubleClick={() => onAdd(k)} onKeyDown={(e) => e.key === 'Enter' && setSelected(k)} aria-label={`${d.toDateString()}, ${all.length} entries`}
                      className={cn('group relative flex cursor-pointer flex-col gap-1 p-1.5 outline-none transition-[background-color,min-height] duration-300 sm:p-2',
                        week ? 'min-h-[76px]' : 'min-h-[64px] sm:min-h-[112px]',
                        holiday ? 'tone-holiday tone-tint' : inMonth || week ? 'bg-panel' : 'bg-subtle/70', !on && 'hover:bg-hover/60', on && 'z-[1] shadow-[inset_0_0_0_2px_hsl(var(--fg)/0.28)]')}>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('tnum grid size-6 place-items-center rounded-full text-xs font-semibold transition-colors', isToday ? 'bg-pop font-bold text-pop-fg' : on ? 'text-fg' : inMonth || week ? 'text-fg/80' : 'text-faint')}>{d.getDate()}</span>
                        {week && <span className="hidden text-[10px] font-medium text-faint sm:inline">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>}
                      </div>
                      <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                        <AnimatePresence initial={false} mode="popLayout">
                          {list.slice(0, 2).map((e) => (
                            <motion.span layout key={e.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
                              className={cn('flex min-w-0 items-center gap-1.5 rounded-md py-[3px] pl-1 pr-1.5 text-[11px] font-medium leading-tight', LIVE_TYPE[e.type].tone, 'tone-soft')}>
                              <i className={cn('h-3 w-[3px] shrink-0 rounded-full', LIVE_TYPE[e.type].tone, 'tone-bar')} /><span className="truncate">{short(e)}</span>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                        {list.length > 2 && <span className="px-1 text-[10px] font-medium text-muted">+{list.length - 2} more</span>}
                      </div>
                      <div className="mt-auto flex flex-wrap gap-0.5 sm:hidden">{list.slice(0, 4).map((e) => <i key={e.id} className={cn('size-1.5 rounded-full', LIVE_TYPE[e.type].dot)} />)}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence initial={false}>
          {week && (
            <motion.div key="timeline" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={fold} className="overflow-hidden">
              <Timeline days={weeks[selRow]} byDay={byDay} selected={selected} setSelected={setSelected} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Timeline({ days, byDay, selected, setSelected }: { days: Date[]; byDay: Map<string, CalendarEvent[]>; selected: string; setSelected: (k: string) => void }) {
  const hours = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);
  return (
    <div className={cn('grid border-t border-border bg-panel', COLS)}>
      <div>{hours.map((h) => <div key={h} style={{ height: ROW }} className="relative pr-1 text-right text-[10px] text-faint sm:pr-1.5"><span className="absolute -top-1.5 right-1 sm:right-1.5">{h === H0 ? '' : `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`}</span></div>)}</div>
      {days.map((d) => {
        const k = key(d);
        const timed = (byDay.get(k) || []).filter((e) => e.time);
        // Overlapping sessions sit side by side in lanes.
        const lanes: number[] = [];
        const placed = timed.map((e) => {
          const s = mins(e.time)!, en = mins(e.end) ?? s + 60;
          let lane = lanes.findIndex((end) => end <= s);
          if (lane < 0) { lane = lanes.length; lanes.push(en); } else lanes[lane] = en;
          return { e, s, en, lane };
        });
        return (
          <div key={k} onClick={() => setSelected(k)} className={cn('relative border-l border-border', k === selected && 'bg-fg/[0.025]')}
            style={{ height: hours.length * ROW, backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${ROW - 1}px, hsl(var(--border)) ${ROW - 1}px, hsl(var(--border)) ${ROW}px)` }}>
            {placed.map(({ e, s, en, lane }) => {
              const top = ((Math.max(s, H0 * 60) - H0 * 60) / 60) * ROW, height = Math.max(22, ((Math.min(en, H1 * 60) - Math.max(s, H0 * 60)) / 60) * ROW - 2);
              const w = 100 / lanes.length;
              return (
                <motion.div layout key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.12 }} title={`${e.title} · ${timeRange(e)}`}
                  className={cn('absolute overflow-hidden rounded-lg py-1 pl-2 pr-1 text-[10px] leading-tight', LIVE_TYPE[e.type].tone, 'tone-soft')}
                  style={{ top, height, left: `calc(${lane * w}% + 2px)`, width: `calc(${w}% - 4px)` }}>
                  <i className={cn('absolute inset-y-1 left-0.5 w-[3px] rounded-full', LIVE_TYPE[e.type].tone, 'tone-bar')} />
                  <div className="truncate font-semibold">{short(e)}</div>
                  {height > 30 && <div className="truncate opacity-75">{timeRange(e)}</div>}
                </motion.div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DayAgenda({ date, list, view, onAdd, upcoming, onPick }: { date: string; list: CalendarEvent[]; view: Delivery; onAdd: () => void; upcoming: CalendarEvent[]; onPick: (d: string) => void }) {
  const { batches, members, removeEvent } = useStore();
  const open = useUI((u) => u.open);
  const d = fromKey(date);
  const today = key(new Date());
  const next = upcoming.filter((e) => e.date > date && e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')).slice(0, 4);
  const who = (e: CalendarEvent) => e.type === 'deadline' ? (deadlineCourse(e, batches) ? `All ${deadlineCourse(e, batches)} students` : 'Whole academy') : e.batchId ? batches.find((b) => b.id === e.batchId)?.name : 'All batches';
  const remove = (e: CalendarEvent) => { removeEvent(e.id); toast('Removed from the calendar', { action: { label: 'Undo', onClick: () => useStore.setState((s) => ({ events: [...s.events, e] })) } }); };

  return (
    <aside className="space-y-5">
      <section className={cn(panel, 'p-5')}>
        <div className="flex items-center gap-3">
          <DateLeaf top={d.toLocaleDateString('en-IN', { month: 'short' })} big={d.getDate()} />
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold">{d.toLocaleDateString('en-IN', { weekday: 'long' })}</div>
            <div className="text-xs text-muted">{list.length ? `${list.length} ${list.length === 1 ? 'entry' : 'entries'} · ${DELIVERY[view]}` : `Free · ${DELIVERY[view]}`}</div>
          </div>
          <Tip label="Add on this day" side="bottom"><Button size="icon" variant="secondary" onClick={onAdd} aria-label="Add on this day"><Plus /></Button></Tip>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          {list.length ? (
            <motion.ol key={date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-2">
              {list.map((e) => {
                const fac = e.facultyId ? members.find((m) => m.id === e.facultyId)?.name : undefined;
                return (
                  <motion.li layout key={e.id} className="group grid grid-cols-[46px_minmax(0,1fr)] gap-2.5">
                    <div className="tnum pt-2.5 text-right text-[11px] leading-tight text-muted">{e.time ? <><div className="font-semibold text-fg">{e.time}</div>{e.end && <div>{e.end}</div>}</> : <div>All day</div>}</div>
                    <div className={cn('relative rounded-xl py-2.5 pl-3.5 pr-2.5', LIVE_TYPE[e.type].tone, 'tone-tint tone-line')}>
                      <i className={cn('absolute inset-y-2 left-1.5 w-[3px] rounded-full', LIVE_TYPE[e.type].tone, 'tone-bar')} />
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{e.title}</div>
                          {(e.subject || e.topic) && <div className="truncate text-2xs text-muted">{e.topic || e.subject}</div>}
                        </div>
                        <div className="-mr-1 -mt-1 flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <button onClick={() => open('event', `edit:${e.id}`)} className="grid size-7 place-items-center rounded-full text-muted hover:bg-panel hover:text-fg" aria-label={`Edit ${e.title}`}><Pencil className="size-3.5" /></button>
                          <button onClick={() => remove(e)} className="grid size-7 place-items-center rounded-full text-muted hover:bg-panel hover:text-fg" aria-label={`Remove ${e.title}`}><Trash2 className="size-3.5" /></button>
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                        <span className={cn('font-semibold', LIVE_TYPE[e.type].tone, 'tone-ink')}>{LIVE_TYPE[e.type].label}</span>
                        <Meta icon={Layers}>{who(e)}</Meta>
                        {fac && <Meta icon={UserRound}>{fac}</Meta>}
                        {e.delivery?.length === 2 && <Meta icon={view === 'online' ? School : MonitorPlay}>Also {view === 'online' ? 'offline' : 'online'}</Meta>}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ol>
          ) : (
            <motion.button key={`${date}-empty`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onAdd}
              className="mt-4 flex w-full flex-col items-center rounded-2xl border border-dashed border-border-strong py-8 text-center text-muted transition hover:border-fg/30 hover:text-fg">
              <CalendarPlus className="size-5" /><span className="mt-2 text-xs font-semibold">Nothing scheduled</span><span className="text-2xs">Click to add, or double-click any day</span>
            </motion.button>
          )}
        </AnimatePresence>
      </section>

      {next.length > 0 && (
        <section className={cn(panel, 'p-5')}>
          <h3 className="mb-2 text-sm font-bold">Up next</h3>
          <ul className="space-y-0.5">{next.map((e) => (
            <li key={e.id}><button onClick={() => onPick(e.date)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-subtle">
              <i className={cn('h-8 w-[3px] shrink-0 rounded-full', LIVE_TYPE[e.type].dot)} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{e.title}</span><span className="block text-2xs text-muted">{fromKey(e.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {timeRange(e)}</span></span>
            </button></li>
          ))}</ul>
        </section>
      )}
    </aside>
  );
}
const Meta = ({ icon: Icon, children }: { icon: ElementType; children: ReactNode }) => <span className="inline-flex min-w-0 items-center gap-1"><Icon className="size-3 shrink-0" /><span className="truncate">{children}</span></span>;

// ---------- Recorded plan: one row per week of the course ----------
function RecordedPlan({ course, setCourse, onAdd, onImport }: { course: Course; setCourse: (c: Course) => void; onAdd: () => void; onImport: () => void }) {
  const { recorded, events, batches } = useStore();
  const [hidden, setHidden] = useState<Set<RecordedType>>(new Set());
  const plan = useMemo(() => recorded.filter((r) => r.course === course), [recorded, course]);
  const byDay = useMemo(() => {
    const m = new Map<number, RecordedDay[]>();
    plan.forEach((r) => m.set(r.day, [...(m.get(r.day) || []), r]));
    m.forEach((l) => l.sort((a, b) => REC_TYPES.indexOf(a.type) - REC_TYPES.indexOf(b.type)));
    return m;
  }, [plan]);
  const lastDay = plan.reduce((a, r) => Math.max(a, r.day), 0);
  const weeks = Math.max(1, Math.ceil(lastDay / 7));
  const [sel, setSel] = useState(1);
  useEffect(() => { setSel(1); }, [course]);
  const counts = Object.fromEntries(REC_TYPES.map((t) => [t, plan.filter((r) => r.type === t).length]));
  const videos = plan.reduce((a, r) => a + r.videos.length, 0);
  const today = key(new Date());
  const deadlines = events.filter((e) => e.type === 'deadline' && e.date >= today && (deadlineCourse(e, batches) ?? course) === course).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className={cn(panel, 'min-w-0 p-4 sm:p-5')}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto min-w-0">
            <h2 className="text-xl font-bold tracking-tight">{course} <span className="text-faint">recorded plan</span></h2>
            <p className="text-xs text-muted">{lastDay} days · {weeks} weeks · {videos} videos</p>
          </div>
          <div className="flex items-center rounded-full bg-subtle p-1 ring-1 ring-inset ring-border">
            {COURSES.map((c) => (
              <button key={c} onClick={() => setCourse(c)} className={cn('relative h-8 rounded-full px-3 text-xs font-semibold transition-colors', course === c ? 'text-fg' : 'text-muted hover:text-fg')}>
                {course === c && <motion.span layoutId="rec-course" transition={spring} className="absolute inset-0 rounded-full bg-panel shadow-xs ring-1 ring-black/[0.05] dark:ring-white/[0.08]" />}<span className="relative">{c.replace('CA ', '')}</span>
              </button>
            ))}
          </div>
          <AddMenu onAdd={onAdd} onImport={onImport} addLabel="Add a day" addHint="Class, revision, buffer or task" />
        </div>
        <div className="mt-4 border-t border-border pt-4"><TypeChips types={REC_TYPES} meta={REC_TYPE} counts={counts} hidden={hidden} setHidden={setHidden} /></div>

        {plan.length ? (
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: weeks }, (_, w) => {
              const days = Array.from({ length: 7 }, (_, i) => w * 7 + i + 1);
              return (
                <div key={w} className="grid gap-2 sm:grid-cols-[76px_minmax(0,1fr)]">
                  <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:justify-center sm:gap-0.5 sm:pl-1">
                    <span className="text-xs font-bold">Week {w + 1}</span>
                    <span className="text-[10px] text-faint">Day {days[0]}–{days[6]}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-7">
                    {days.map((n) => {
                      const items = byDay.get(n) || [];
                      const main = items[0];
                      const dim = items.length > 0 && items.every((r) => hidden.has(r.type));
                      const on = sel === n;
                      return (
                        <button key={n} onClick={() => setSel(n)} aria-pressed={on} aria-label={`Day ${n}${main ? `, ${REC_TYPE[main.type].label}` : ', empty'}`}
                          className={cn('relative flex min-h-[86px] flex-col rounded-xl p-2 text-left transition-[opacity,box-shadow,background-color] duration-200',
                            main ? cn(REC_TYPE[main.type].tone, 'tone-soft') : 'bg-subtle/70 text-faint ring-1 ring-inset ring-dashed ring-border',
                            dim && 'opacity-30', on && 'shadow-[0_0_0_2px_hsl(var(--fg)/0.6)]')}>
                          <span className="flex w-full items-center justify-between"><span className="tnum text-sm font-bold">{n}</span>{items.length > 1 && <span className="text-[10px] font-semibold opacity-70">+{items.length - 1}</span>}</span>
                          {main ? (
                            main.type === 'buffer'
                              ? <span className="mt-auto text-[11px] font-semibold">Buffer</span>
                              : <>
                                  <span className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug">{main.chapter}</span>
                                  <span className="mt-auto flex items-center gap-1 pt-1 text-[10px] font-semibold opacity-75">{main.type === 'class' ? <><PlayCircle className="size-3" />{main.videos.length}</> : REC_TYPE[main.type].label}</span>
                                </>
                          ) : <span className="mt-auto text-[10px]">Empty</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <EmptyState icon={Clapperboard} title="No recorded plan yet" action={<><Button onClick={onImport}><FileUp /> Import a file</Button><Button variant="primary" onClick={onAdd}><Plus /> Add a day</Button></>}>Plan the course day by day: classes with the videos to watch, revision, tasks and buffer days.</EmptyState>}
      </section>

      <aside className="space-y-5">
        <DayDetail course={course} day={sel} items={byDay.get(sel) || []} lastDay={lastDay} setDay={setSel} />
        <section className={cn(panel, 'p-5')}>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-bold"><CalendarClock className="size-4" /> Deadlines</h3>
          <p className="mb-2 text-2xs text-muted">Recorded students see these too.</p>
          {deadlines.length ? <ul className="space-y-0.5">{deadlines.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-xl p-2">
              <i className="tone-deadline tone-bar h-8 w-[3px] shrink-0 rounded-full" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{e.title}</span><span className="block text-2xs text-muted">{fromKey(e.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {deadlineCourse(e, batches) ? `All ${course} students` : 'Whole academy'}</span></span>
            </li>
          ))}</ul> : <p className="text-sm text-muted">No upcoming deadlines.</p>}
        </section>
      </aside>
    </div>
  );
}

function DayDetail({ course, day, items, lastDay, setDay }: { course: Course; day: number; items: RecordedDay[]; lastDay: number; setDay: (n: number) => void }) {
  const { removeRecorded } = useStore();
  const open = useUI((u) => u.open);
  const remove = (r: RecordedDay) => { removeRecorded(r.id); toast(`Day ${r.day} ${REC_TYPE[r.type].label.toLowerCase()} removed`, { action: { label: 'Undo', onClick: () => useStore.setState((s) => ({ recorded: [...s.recorded, r] })) } }); };
  return (
    <section className={cn(panel, 'p-5')}>
      <div className="flex items-center gap-3">
        <DateLeaf top="Day" big={day} />
        <div className="min-w-0 flex-1"><div className="text-base font-bold">Week {Math.ceil(day / 7)}</div><div className="text-xs text-muted">{course}</div></div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" disabled={day <= 1} onClick={() => setDay(day - 1)} aria-label="Previous day"><ChevronLeft /></Button>
          <Button size="icon" variant="ghost" disabled={day >= Math.max(lastDay, 1)} onClick={() => setDay(day + 1)} aria-label="Next day"><ChevronRight /></Button>
        </div>
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={`${course}-${day}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-4 space-y-2.5">
          {items.length ? items.map((r) => (
            <div key={r.id} className={cn('group relative rounded-2xl p-4', REC_TYPE[r.type].tone, 'tone-tint tone-line')}>
              <div className="flex items-start gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', REC_TYPE[r.type].tone, 'tone-soft')}>{REC_TYPE[r.type].label}</span>
                <div className="ml-auto -mr-1.5 -mt-1 flex opacity-60 transition-opacity group-hover:opacity-100">
                  <button onClick={() => open('recorded', `edit:${r.id}`)} className="grid size-7 place-items-center rounded-full hover:bg-panel" aria-label={`Edit day ${r.day}`}><Pencil className="size-3.5" /></button>
                  <button onClick={() => remove(r)} className="grid size-7 place-items-center rounded-full hover:bg-panel" aria-label={`Remove day ${r.day}`}><Trash2 className="size-3.5" /></button>
                </div>
              </div>
              {r.type === 'buffer' ? <p className="mt-2 text-sm text-muted">Catch-up day. No new lessons.</p> : <>
                <div className="mt-2 text-sm font-semibold leading-snug">{r.chapter}</div>
                <div className="text-2xs text-muted">{r.subject}</div>
                {r.videos.length > 0 && <ol className="mt-3 space-y-1">{r.videos.map((v, i) => <li key={`${v}-${i}`} className="flex items-center gap-2 rounded-lg bg-panel/80 px-2.5 py-1.5 text-xs ring-1 ring-inset ring-border"><PlayCircle className="size-3.5 text-muted" />{v}</li>)}</ol>}
                {r.topics && <p className="mt-3 text-xs leading-relaxed text-muted">{r.topics}</p>}
              </>}
            </div>
          )) : (
            <button onClick={() => open('recorded', `new:${course}`)} className="flex w-full flex-col items-center rounded-2xl border border-dashed border-border-strong py-8 text-center text-muted transition hover:border-fg/30 hover:text-fg">
              <Plus className="size-5" /><span className="mt-2 text-xs font-semibold">Nothing planned for day {day}</span>
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
