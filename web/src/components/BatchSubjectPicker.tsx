// Assigning a faculty member, in two steps: first the batches, then the subjects they teach in each of those batches.
// Used by Add faculty (after the details) and by Assign batches & subjects.
import { Check } from 'lucide-react';
import { useState } from 'react';
import { COURSES, COURSE_TONE, SUBJECTS, useStore, type Course } from '../lib/store';
import { cn } from '../lib/utils';
import { CourseToggle, type CourseFilter } from '../pages/store/shared';
import { Input } from './ui';

export type BatchSubjects = Record<string, string[]>;

/** Subjects offered for a course: the course's own structure from Learning, else the general list. */
export function useCourseSubjects() {
  const courses = useStore((s) => s.courses);
  return (c: Course) => { const list = courses.find((x) => x.name === c)?.subjects.map((s) => s.name) ?? []; return list.length ? list : SUBJECTS; };
}

/** Coloured dot + label per course; the same colours mark batches everywhere. */
export const CourseLegend = ({ className }: { className?: string }) => (
  <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted', className)}>{COURSES.map((c) => <span key={c} className="flex items-center gap-1.5"><i className={cn('tone-bar size-2.5 rounded-full', COURSE_TONE[c])} />{c.replace('CA ', '')}</span>)}</div>
);

const chip = (on: boolean) => cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors', on ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg');

export function BatchSubjectPicker({ step, value, onChange }: { step: 'batches' | 'subjects'; value: BatchSubjects; onChange: (v: BatchSubjects) => void }) {
  const batches = useStore((s) => s.batches).filter((b) => b.status === 'active');
  const subjectsOf = useCourseSubjects();
  const [course, setCourse] = useState<CourseFilter>('all'), [q, setQ] = useState('');
  const picked = Object.keys(value);

  if (step === 'batches') {
    const shown = batches.filter((b) => (course === 'all' || b.course === course) && b.name.toLowerCase().includes(q.toLowerCase()));
    const flip = (id: string) => { const n = { ...value }; if (n[id]) delete n[id]; else n[id] = []; onChange(n); };
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2"><CourseToggle value={course} onChange={setCourse} /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search batches" className="w-full sm:w-48" aria-label="Search batches" /><span className="ml-auto text-2xs text-muted">{picked.length} picked</span></div>
        <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto">{shown.map((b) => { const on = !!value[b.id]; return (
          <button key={b.id} type="button" onClick={() => flip(b.id)} className={chip(on)}><i className={cn('tone-bar size-2 rounded-full', COURSE_TONE[b.course])} />{b.name}{on && <Check className="size-3" />}</button>
        ); })}</div>
        <CourseLegend />
      </div>
    );
  }

  // Step 2: for each picked batch, its subjects (from that batch's course).
  const flipSubject = (id: string, s: string) => onChange({ ...value, [id]: value[id].includes(s) ? value[id].filter((x) => x !== s) : [...value[id], s] });
  return (
    <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">{picked.map((id) => { const b = batches.find((x) => x.id === id); if (!b) return null; return (
      <section key={id} className="rounded-2xl bg-subtle p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><i className={cn('tone-bar size-2.5 rounded-full', COURSE_TONE[b.course])} />{b.name}<span className={cn('ml-auto text-2xs font-normal', value[id].length ? 'text-muted' : 'text-bad')}>{value[id].length ? `${value[id].length} subject${value[id].length === 1 ? '' : 's'}` : 'Pick at least one'}</span></div>
        <div className="flex flex-wrap gap-1.5">{subjectsOf(b.course).map((s) => <button key={s} type="button" onClick={() => flipSubject(id, s)} className={chip(value[id].includes(s))}>{s}</button>)}</div>
      </section>
    ); })}</div>
  );
}

/** Every picked batch has at least one subject. */
export const subjectsDone = (v: BatchSubjects) => Object.values(v).every((x) => x.length > 0);
