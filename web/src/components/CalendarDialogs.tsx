import { AnimatePresence, motion } from 'framer-motion';
import { MonitorPlay, School, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { DELIVERY, LIVE_RULES, LIVE_TYPE, LIVE_TYPES, REC_RULES, REC_TYPE, REC_TYPES, parseVideos, type LiveField, type RecField } from '../lib/calendar';
import { COURSES, SUBJECTS, useStore, type Course, type Delivery, type EventType, type RecordedType } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn } from '../lib/utils';
import { Button, Dialog, Field, Input, Select, Switch } from './ui';

const today = () => new Date().toISOString().slice(0, 10);

/** Pill choice for the entry type; it decides which fields the form shows. */
function TypePicker<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; dot: string }[] }) {
  return (
    <div role="radiogroup" aria-label="Type" className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn('flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors duration-150', value === o.value ? 'border-fg bg-fg text-bg' : 'border-border-strong text-muted hover:text-fg')}>
          <i className={cn('size-2.5 rounded-full', o.dot)} />{o.label}
        </button>
      ))}
    </div>
  );
}

/** Animates fields in and out as the type changes, so the form never jumps. */
const Reveal = ({ show, children, className }: { show: boolean; children: ReactNode; className?: string }) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className={cn('overflow-hidden', className)}>
        <div className="pb-0.5 pt-px">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ---------- Live calendar entry (offline / online) ----------
type LiveForm = { type: EventType; title: string; subject: string; topic: string; facultyId: string; batchId: string; date: string; time: string; end: string; offline: boolean; online: boolean };
const LIVE_LABEL: Record<LiveField, string> = { title: 'Title', subject: 'Subject', topic: 'Topic', faculty: 'Faculty', batch: 'Batch', date: 'Date', time: 'Start and end time', delivery: 'Offline or Online Live' };

/**
 * Dialog argument: "edit:<id>" edits an entry; otherwise "<date>|<view>" starts a new one on that date,
 * with the switch for the view the academy is looking at already on.
 */
export function EventDialog() {
  const { dialog, dialogArg, close } = useUI();
  const open = dialog === 'event';
  const { addEvent, updateEvent, batches, members, events } = useStore();
  const active = batches.filter((b) => b.status === 'active');
  const blank = (date: string, view?: string): LiveForm => ({ type: 'class', title: '', subject: '', topic: '', facultyId: '', batchId: '', date, time: '', end: '', offline: view !== 'online', online: view === 'online' });
  const [f, setF] = useState<LiveForm>(blank(today()));
  const editing = dialogArg?.startsWith('edit:') ? dialogArg.slice(5) : null;

  useEffect(() => {
    if (!open) return;
    const ev = editing ? events.find((e) => e.id === editing) : null;
    if (ev) {
      setF({ type: ev.type, title: ev.title, subject: ev.subject ?? '', topic: ev.topic ?? '', facultyId: ev.facultyId ?? '', batchId: ev.batchId ?? (LIVE_RULES[ev.type].allBatches ? 'all' : ''), date: ev.date, time: ev.time ?? '', end: ev.end ?? '',
        offline: (ev.delivery ?? ['offline']).includes('offline'), online: (ev.delivery ?? []).includes('online') });
    } else {
      const [date, view] = (dialogArg || '').split('|');
      setF(blank(date || today(), view));
    }
  }, [open, dialogArg]); // eslint-disable-line

  const rule = LIVE_RULES[f.type];
  const shows = (k: LiveField) => rule.req.includes(k) || rule.opt.includes(k);
  const opt = (k: LiveField) => rule.opt.includes(k);
  const filled: Record<LiveField, boolean> = {
    title: !!f.title.trim(), subject: !!f.subject, topic: !!f.topic.trim(), faculty: !!f.facultyId, batch: !!f.batchId, date: !!f.date,
    time: !!f.time && !!f.end && f.end > f.time, delivery: f.offline || f.online,
  };
  // An optional time is fine left empty, but if one half is filled the pair must make sense.
  const timeHalf = opt('time') && (!!f.time || !!f.end) && !filled.time;
  const missing = rule.req.filter((k) => !filled[k]);
  const ok = !missing.length && !timeHalf;
  const set = (p: Partial<LiveForm>) => setF((x) => ({ ...x, ...p }));
  const facultyOrdered = [...members].sort((a, b) => Number(!!b.subjects?.includes(f.subject)) - Number(!!a.subjects?.includes(f.subject)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    const delivery: Delivery[] | undefined = shows('delivery') ? [...(f.offline ? ['offline' as const] : []), ...(f.online ? ['online' as const] : [])] : undefined;
    const entry = {
      type: f.type, date: f.date,
      title: f.title.trim() || (f.type === 'holiday' ? 'Holiday' : ''),
      subject: shows('subject') ? f.subject : undefined, topic: shows('topic') ? f.topic.trim() : undefined, facultyId: shows('faculty') ? f.facultyId : undefined,
      batchId: shows('batch') && f.batchId && f.batchId !== 'all' ? f.batchId : undefined,
      time: shows('time') && f.time ? f.time : undefined, end: shows('time') && f.end ? f.end : undefined, delivery,
    };
    if (editing) { updateEvent(editing, entry); toast.success('Calendar entry updated'); }
    else { addEvent(entry); toast.success(delivery?.length === 2 ? 'Added to the offline and online calendars' : 'Added to the calendar'); }
    close();
  };

  return (
    <Dialog wide open={open} onOpenChange={(v) => !v && close()} title={editing ? 'Edit calendar entry' : 'Add on calendar'} desc="Pick the type first; the form asks only for what that type needs."
      footer={<>
        {!ok && <span className="mr-auto self-center text-2xs text-muted">Still needed: {timeHalf ? 'both start and end time' : missing.map((k) => LIVE_LABEL[k].toLowerCase()).join(', ')}</span>}
        <Button onClick={close}>Cancel</Button><Button variant="primary" type="submit" form="event-form" disabled={!ok}>{editing ? 'Save' : 'Add'}</Button>
      </>}>
      <form id="event-form" onSubmit={submit} className="space-y-4 pb-1">
        <Field label="Type"><TypePicker value={f.type} onChange={(type) => set({ type, batchId: LIVE_RULES[type].allBatches && !f.batchId ? 'all' : f.batchId === 'all' && !LIVE_RULES[type].allBatches ? '' : f.batchId })} options={LIVE_TYPES.map((t) => ({ value: t, label: LIVE_TYPE[t].label, dot: LIVE_TYPE[t].dot }))} /></Field>

        <Reveal show={shows('title')}>
          <Field label="Title" htmlFor="ev-title" optional={opt('title')}><Input id="ev-title" autoFocus value={f.title} onChange={(e) => set({ title: e.target.value })}
            placeholder={{ class: 'Taxation class', exam: 'GST mock test', deadline: 'Fee payment last date', holiday: 'Holiday', event: 'Toppers’ talk', task: 'Practice set – Capital Gains' }[f.type]} /></Field>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal show={shows('subject')}>
            <Field label="Subject" htmlFor="ev-sub"><Select id="ev-sub" value={f.subject} onChange={(e) => set({ subject: e.target.value })}><option value="">Choose a subject</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          </Reveal>
          <Reveal show={shows('topic')}>
            <Field label="Topic" htmlFor="ev-topic"><Input id="ev-topic" value={f.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="Capital Gains – Exemptions" /></Field>
          </Reveal>
          <Reveal show={shows('faculty')}>
            <Field label="Faculty" htmlFor="ev-fac"><Select id="ev-fac" value={f.facultyId} onChange={(e) => set({ facultyId: e.target.value })}><option value="">Choose faculty</option>{facultyOrdered.map((m) => <option key={m.id} value={m.id}>{m.name}{m.subjects?.length ? ` · ${m.subjects.join(', ')}` : ''}</option>)}</Select></Field>
          </Reveal>
          <Reveal show={shows('batch')}>
            <Field label="Batch" htmlFor="ev-batch" optional={opt('batch')}
              hint={f.type === 'deadline' ? (f.batchId ? `Every ${batches.find((b) => b.id === f.batchId)?.course} student sees this, in offline, online and recorded.` : 'Every student in the academy sees this, in offline, online and recorded.') : undefined}>
              <Select id="ev-batch" value={f.batchId} onChange={(e) => set({ batchId: e.target.value })}>
                {f.type === 'deadline' ? <option value="">Whole academy</option> : rule.allBatches ? <option value="all">All batches</option> : <option value="">Choose a batch</option>}
                {active.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
          </Reveal>
          <Field label="Date" htmlFor="ev-date"><Input id="ev-date" type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></Field>
          <Reveal show={shows('time')}>
            <Field label={opt('time') ? 'Time' : 'Start and end time'} optional={opt('time')} hint={f.time && f.end && f.end <= f.time ? 'The end time must be after the start.' : undefined}>
              <div className="flex items-center gap-2">
                <Input aria-label="Start time" type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} />
                <span className="text-xs text-faint">to</span>
                <Input aria-label="End time" type="time" value={f.end} onChange={(e) => set({ end: e.target.value })} />
              </div>
            </Field>
          </Reveal>
        </div>

        <Reveal show={shows('delivery')}>
          <Field label="Where it runs" hint="Switch on both to put it on the offline and the online calendar at once.">
            <div className="grid gap-2 sm:grid-cols-2">
              {([['offline', School, 'In the classroom'], ['online', MonitorPlay, 'Streamed live in the app']] as const).map(([k, Icon, sub]) => (
                <label key={k} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors duration-150', f[k] ? 'border-fg bg-subtle' : 'border-border hover:border-border-strong')}>
                  <span className={cn('grid size-9 place-items-center rounded-full', f[k] ? 'bg-fg text-bg' : 'bg-subtle text-muted')}><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{DELIVERY[k]}</span><span className="block text-2xs text-muted">{sub}</span></span>
                  <Switch checked={f[k]} onCheckedChange={(v) => set({ [k]: v })} label={DELIVERY[k]} />
                </label>
              ))}
            </div>
          </Field>
        </Reveal>
      </form>
    </Dialog>
  );
}

// ---------- Recorded plan day ----------
type RecForm = { course: Course; day: string; type: RecordedType; subject: string; chapter: string; videos: string; topics: string };
const REC_LABEL: Record<RecField, string> = { day: 'Day', type: 'Type', subject: 'Subject', chapter: 'Chapter', videos: 'Videos to be watched', topics: 'Topics' };

/** Dialog argument: "edit:<id>" edits a day; "new:<course>" adds the next day to that course's plan. */
export function RecordedDialog() {
  const { dialog, dialogArg, close } = useUI();
  const open = dialog === 'recorded';
  const { recorded, saveRecorded } = useStore();
  const [f, setF] = useState<RecForm>({ course: 'CA Inter', day: '1', type: 'class', subject: '', chapter: '', videos: '', topics: '' });
  const editing = dialogArg?.startsWith('edit:') ? dialogArg.slice(5) : null;
  const nextDay = (c: Course) => String(Math.max(0, ...recorded.filter((r) => r.course === c).map((r) => r.day)) + 1);

  useEffect(() => {
    if (!open) return;
    const r = editing ? recorded.find((x) => x.id === editing) : null;
    if (r) setF({ course: r.course, day: String(r.day), type: r.type, subject: r.subject ?? '', chapter: r.chapter ?? '', videos: r.videos.join(', '), topics: r.topics ?? '' });
    else { const c = (dialogArg?.slice(4) as Course) || 'CA Inter'; setF({ course: c, day: nextDay(c), type: 'class', subject: '', chapter: '', videos: '', topics: '' }); }
  }, [open, dialogArg]); // eslint-disable-line

  const need = REC_RULES[f.type];
  const shows = (k: RecField) => need.includes(k);
  const videos = parseVideos(f.videos);
  const dayNo = Number(f.day);
  const filled: Record<RecField, boolean> = { day: Number.isInteger(dayNo) && dayNo >= 1, type: true, subject: !!f.subject, chapter: !!f.chapter.trim(), videos: videos.length > 0, topics: !!f.topics.trim() };
  const missing = need.filter((k) => !filled[k]);
  const set = (p: Partial<RecForm>) => setF((x) => ({ ...x, ...p }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (missing.length) return;
    saveRecorded({ course: f.course, day: dayNo, type: f.type, subject: shows('subject') ? f.subject : undefined, chapter: shows('chapter') ? f.chapter.trim() : undefined, videos: shows('videos') ? videos : [], topics: shows('topics') ? f.topics.trim() : undefined }, editing ?? undefined);
    toast.success(editing ? `Day ${dayNo} updated` : `Day ${dayNo} added to the ${f.course} recorded plan`);
    close();
  };

  return (
    <Dialog wide open={open} onOpenChange={(v) => !v && close()} title={editing ? `Edit day ${f.day}` : 'Add to recorded plan'} desc="Recorded plans run by day number, at each student’s own pace."
      footer={<>
        {missing.length > 0 && <span className="mr-auto self-center text-2xs text-muted">Still needed: {missing.map((k) => REC_LABEL[k].toLowerCase()).join(', ')}</span>}
        <Button onClick={close}>Cancel</Button><Button variant="primary" type="submit" form="rec-form" disabled={missing.length > 0}>{editing ? 'Save' : 'Add day'}</Button>
      </>}>
      <form id="rec-form" onSubmit={submit} className="space-y-4 pb-1">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Field label="Course" htmlFor="rc-course"><Select id="rc-course" value={f.course} onChange={(e) => { const c = e.target.value as Course; set({ course: c, day: editing ? f.day : nextDay(c) }); }}>{COURSES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Day" htmlFor="rc-day"><Input id="rc-day" type="number" min={1} step={1} value={f.day} onChange={(e) => set({ day: e.target.value })} /></Field>
        </div>
        <Field label="Type"><TypePicker value={f.type} onChange={(type) => set({ type })} options={REC_TYPES.map((t) => ({ value: t, label: REC_TYPE[t].label, dot: REC_TYPE[t].dot }))} /></Field>
        {f.type === 'buffer' && <p className="tone-buffer tone-soft rounded-xl px-3 py-2 text-xs">A buffer day has no lessons. Students use it to catch up, and it shows in rose with stripes on the plan.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal show={shows('subject')}>
            <Field label="Subject" htmlFor="rc-sub"><Select id="rc-sub" value={f.subject} onChange={(e) => set({ subject: e.target.value })}><option value="">Choose a subject</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          </Reveal>
          <Reveal show={shows('chapter')}>
            <Field label="Chapter" htmlFor="rc-ch"><Input id="rc-ch" value={f.chapter} onChange={(e) => set({ chapter: e.target.value })} placeholder="Capital Gains" /></Field>
          </Reveal>
        </div>
        <Reveal show={shows('videos')}>
          <Field label="Videos to be watched" htmlFor="rc-vid" hint="Separate with commas, for example: Video 1, Video 2, Video 3">
            <Input id="rc-vid" value={f.videos} onChange={(e) => set({ videos: e.target.value })} placeholder="Video 1, Video 2, Video 3" />
            {videos.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{videos.map((v, i) => (
              <span key={`${v}-${i}`} className="inline-flex h-7 items-center gap-1 rounded-full bg-subtle pl-3 pr-1 text-2xs font-semibold ring-1 ring-inset ring-border">{v}
                <button type="button" aria-label={`Remove ${v}`} onClick={() => set({ videos: videos.filter((_, j) => j !== i).join(', ') })} className="grid size-5 place-items-center rounded-full text-muted hover:bg-hover hover:text-fg"><X className="size-3" /></button></span>
            ))}</div>}
          </Field>
        </Reveal>
        <Reveal show={shows('topics')}>
          <Field label="Topics" htmlFor="rc-top"><Input id="rc-top" value={f.topics} onChange={(e) => set({ topics: e.target.value })} placeholder={f.type === 'revision' ? 'Revise the chapter and attempt the MCQs' : 'Exemptions under sections 54, 54EC and 54F'} /></Field>
        </Reveal>
      </form>
    </Dialog>
  );
}
