import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Copy, FileSpreadsheet, FileText, Loader2, MonitorPlay, School, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';
import { LIVE_TYPE, REC_TYPE, timeRange } from '../lib/calendar';
import { FIELD_LABEL, LIVE_FIELDS, LIVE_TEMPLATE, REC_FIELDS, REC_TEMPLATE, buildLive, buildRecorded, detect, readRows, remap, type Cell, type Detected, type Field, type Target } from '../lib/calendarImport';
import { COURSES, useStore, type Course, type Delivery } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn, downloadCSV, fmtDate } from '../lib/utils';
import { Button, Dialog, Segmented, Select } from './ui';

type Show = 'all' | 'ready' | 'fix';

/**
 * Dialog argument "<live|recorded>|<course>": which part of the calendar the academy was looking at.
 * The file's own columns decide in the end; the reviewer can switch if the guess is wrong.
 */
export function CalendarImportDialog() {
  const { dialog, dialogArg, close } = useUI();
  const open = dialog === 'calimport';
  const { batches, members, events, recorded, addEvents, addRecordedMany } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Cell[][] | null>(null);
  const [det, setDet] = useState<Detected | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [delivery, setDelivery] = useState<'offline' | 'online' | 'both'>('offline');
  const [course, setCourse] = useState<Course>('CA Inter');
  const [show, setShow] = useState<Show>('all');
  const input = useRef<HTMLInputElement>(null);
  const [prefTarget, prefCourse] = (dialogArg || 'live|CA Inter').split('|') as [Target, Course];

  useEffect(() => {
    if (!open) return;
    setFile(null); setRows(null); setDet(null); setError(''); setShow('all');
    setCourse(prefCourse || 'CA Inter');
    setDelivery(prefTarget === 'live' && dialogArg?.includes('online') ? 'online' : 'offline');
  }, [open]); // eslint-disable-line

  const load = async (f: File) => {
    setFile(f); setError(''); setBusy(true);
    try {
      const r = await readRows(f);
      const d = detect(r, prefTarget === 'recorded' ? 'recorded' : 'live');
      setRows(r); setDet(d);
    } catch (e) { setError(e instanceof Error ? e.message : 'This file could not be read.'); setRows(null); setDet(null); }
    finally { setBusy(false); }
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) void load(f); };

  const defaultDelivery: Delivery[] = delivery === 'both' ? ['offline', 'online'] : [delivery];
  const live = useMemo(() => (rows && det?.target === 'live' ? buildLive(rows, det, { batches, members, events, defaultDelivery }) : []), [rows, det, batches, members, events, delivery]); // eslint-disable-line
  const rec = useMemo(() => (rows && det?.target === 'recorded' ? buildRecorded(rows, det, { course, recorded }) : []), [rows, det, course, recorded]);
  const list = det?.target === 'recorded' ? rec : live;
  const ready = list.filter((r) => !r.issues.length && !r.duplicate);
  const shown = list.filter((r) => show === 'all' || (show === 'ready' ? !r.issues.length && !r.duplicate : r.issues.length || r.duplicate));

  const doImport = () => {
    if (!det || !ready.length) return;
    if (det.target === 'live') {
      addEvents(live.filter((r) => !r.issues.length && !r.duplicate).map((r) => r.entry));
      const first = [...ready].map((r) => (r.entry as { date: string }).date).sort()[0];
      useUI.getState().setCalendarJump(first);
    } else addRecordedMany(rec.filter((r) => !r.issues.length && !r.duplicate).map((r) => r.entry));
    const skipped = list.length - ready.length;
    toast.success(`${ready.length} ${det.target === 'live' ? 'calendar entries' : 'recorded days'} added`, { description: skipped ? `${skipped} row${skipped > 1 ? 's' : ''} skipped. Fix them in the file and import again.` : 'Every row was added.' });
    close();
  };
  const template = (t: Target) => void downloadCSV(t === 'live' ? 'calendar-template.csv' : 'recorded-plan-template.csv', t === 'live' ? LIVE_TEMPLATE : REC_TEMPLATE);
  const setField = (i: number, f: Field | '') => det && setDet({ ...det, map: det.map.map((x, j) => (j === i ? (f || null) : x === f && f ? null : x)) });
  const switchTarget = (t: Target) => det && setDet({ ...det, target: t, map: remap(det.headers, t) });

  return (
    <Dialog wide open={open} onOpenChange={(v) => !v && close()} title="Import a schedule" desc="Excel, CSV or Word. Columns are recognised automatically; you review before anything is added."
      footer={det ? <>
        <span className="mr-auto self-center text-2xs text-muted">{ready.length} of {list.length} rows ready{list.length - ready.length ? ` · ${list.length - ready.length} will be skipped` : ''}</span>
        <Button onClick={() => { setRows(null); setDet(null); setFile(null); }}><ArrowLeft /> Another file</Button>
        <Button variant="primary" disabled={!ready.length} onClick={doImport}>Add {ready.length} {det.target === 'live' ? (ready.length === 1 ? 'entry' : 'entries') : ready.length === 1 ? 'day' : 'days'}</Button>
      </> : undefined}>
      <>
        {!det ? (
          <motion.div key="pick" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4 pb-2">
            <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
              className={cn('flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200', drag ? 'border-fg bg-subtle' : 'border-border-strong hover:border-fg/40 hover:bg-subtle/60')}>
              <span className="grid size-12 place-items-center rounded-full bg-subtle ring-1 ring-border">{busy ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}</span>
              <span className="mt-3 text-sm font-semibold">{busy ? `Reading ${file?.name}…` : 'Drop a file here, or click to choose'}</span>
              <span className="mt-1 text-xs text-muted">Excel (.xlsx), CSV or Word (.docx) with a table</span>
              <input ref={input} type="file" accept=".xlsx,.csv,.docx,.txt" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ''; }} />
            </button>
            {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-bad-soft px-3 py-2.5 text-xs text-bad"><AlertCircle className="mt-px size-4 shrink-0" />{error}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {([['live', 'Offline / Online calendar', 'Date, Type, Title, Subject, Topic, Faculty, Batch, Time, Mode', FileSpreadsheet], ['recorded', 'Recorded plan', 'Day, Type, Subject, Chapter, Videos, Topics', FileText]] as const).map(([t, title, cols, Icon]) => (
                <div key={t} className="rounded-2xl bg-subtle p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-muted" />{title}</div>
                  <p className="mt-1 text-2xs leading-relaxed text-muted">Columns it understands: {cols}. Headings can be worded your way.</p>
                  <Button size="sm" className="mt-3" onClick={() => template(t)}><Copy /> Get the template</Button>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="review" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{file?.name}</span>
              <Segmented value={det.target} onChange={switchTarget} options={[{ value: 'live', label: 'Live calendar' }, { value: 'recorded', label: 'Recorded plan' }]} />
            </div>

            <section>
              <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-faint">Columns found</h3>
              <div className="flex flex-wrap gap-1.5">
                {det.headers.map((h, i) => h && (
                  <label key={i} className={cn('flex h-9 items-center gap-1.5 rounded-full pl-3 pr-1 text-xs ring-1 ring-inset', det.map[i] ? 'bg-panel ring-border-strong' : 'bg-subtle text-muted ring-border')}>
                    <span className="max-w-32 truncate font-semibold">{h}</span><span className="text-faint">→</span>
                    <select aria-label={`Use column ${h} as`} value={det.map[i] ?? ''} onChange={(e) => setField(i, e.target.value as Field | '')}
                      className="h-7 cursor-pointer rounded-full bg-subtle px-2 text-xs outline-none [&>option]:bg-panel">
                      <option value="">Ignore</option>
                      {(det.target === 'live' ? LIVE_FIELDS : REC_FIELDS).map((f) => <option key={f} value={f}>{FIELD_LABEL[f]}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </section>

            {det.target === 'live' ? (
              !det.map.includes('mode') && (
                <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-subtle p-3">
                  <span className="text-xs"><b>No Offline / Online column.</b> <span className="text-muted">Classes and exams go to:</span></span>
                  <Segmented value={delivery} onChange={setDelivery} options={[{ value: 'offline', label: <><School className="size-3.5" /> Offline</> }, { value: 'online', label: <><MonitorPlay className="size-3.5" /> Online Live</> }, { value: 'both', label: 'Both' }]} />
                </section>
              )
            ) : (
              <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-subtle p-3">
                <span className="text-xs"><b>Course</b> <span className="text-muted">{det.map.includes('course') ? '(used when a row has none)' : 'for these days'}</span></span>
                <Select aria-label="Course" value={course} onChange={(e) => setCourse(e.target.value as Course)} className="w-48">{COURSES.map((c) => <option key={c}>{c}</option>)}</Select>
              </section>
            )}

            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-2xs font-semibold uppercase tracking-wide text-faint">Rows</h3>
                <Segmented value={show} onChange={setShow} options={[{ value: 'all', label: 'All', count: list.length }, { value: 'ready', label: 'Ready', count: ready.length }, { value: 'fix', label: 'Needs fixing', count: list.length - ready.length }]} />
              </div>
              <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-0.5">
                {shown.map((r) => {
                  const bad = r.issues.length > 0 || r.duplicate;
                  const e = r.entry as Record<string, unknown>;
                  const tone = det.target === 'live' ? LIVE_TYPE[e.type as keyof typeof LIVE_TYPE] : REC_TYPE[e.type as keyof typeof REC_TYPE];
                  return (
                    <div key={r.line} className={cn('flex items-start gap-3 rounded-xl p-2.5 ring-1 ring-inset', bad ? 'bg-bad-soft/40 ring-bad/20' : 'bg-panel ring-border')}>
                      <span className="tnum w-7 shrink-0 pt-0.5 text-right text-2xs text-faint">{r.line}</span>
                      <span className={cn('mt-1.5 h-3 w-1 shrink-0 rounded-full', tone.dot)} />
                      <div className="min-w-0 flex-1">
                        {det.target === 'live' ? (
                          <>
                            <div className="flex flex-wrap items-baseline gap-x-2"><span className="truncate text-sm font-semibold">{String(e.title || '—')}</span><span className={cn('rounded-full px-2 text-[10px] font-semibold', tone.tone, 'tone-soft')}>{tone.label}</span></div>
                            <div className="truncate text-2xs text-muted">{[e.date ? fmtDate(String(e.date)) : 'No date', timeRange(e as { time?: string; end?: string }), e.subject, e.batchId ? batches.find((b) => b.id === e.batchId)?.name : 'All batches', (e.delivery as Delivery[] | undefined)?.map((x) => (x === 'online' ? 'Online' : 'Offline')).join(' + ')].filter(Boolean).join(' · ')}</div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-baseline gap-x-2"><span className="text-sm font-semibold">Day {String(e.day || '?')}</span><span className={cn('rounded-full px-2 text-[10px] font-semibold', tone.tone, 'tone-soft')}>{tone.label}</span><span className="truncate text-xs text-muted">{String(e.chapter ?? '')}</span></div>
                            <div className="truncate text-2xs text-muted">{[e.course, e.subject, (e.videos as string[]).length ? `${(e.videos as string[]).length} videos` : ''].filter(Boolean).join(' · ')}</div>
                          </>
                        )}
                        {(r.issues.length > 0 || r.duplicate || r.notes.length > 0) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {r.duplicate && <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">Already on the calendar</span>}
                            {r.issues.map((x) => <span key={x} className="rounded-full bg-bad-soft px-2 py-0.5 text-[10px] font-semibold text-bad">{x}</span>)}
                            {r.notes.map((x) => <span key={x} className="rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-semibold text-warn">{x}</span>)}
                          </div>
                        )}
                      </div>
                      {bad ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-bad" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" />}
                    </div>
                  );
                })}
                {!shown.length && <p className="py-8 text-center text-sm text-muted">No rows here.</p>}
              </div>
            </section>
          </motion.div>
        )}
      </>
    </Dialog>
  );
}
