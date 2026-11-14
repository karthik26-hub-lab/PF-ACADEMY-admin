// Assessments · Create test, in six steps (from the client's Create Test brief):
// 1 Details (name, course → group → subject → chapters, type) · 2 Questions (manual or random, from the banks)
// 3 Configuration (marks, rounding, negative marking, duration, shuffle, instructions) · 4 Audience
// 5 Schedule (date, start, end, multiple attempts) · 6 Review, then publish or save as draft.
import { ArrowLeft, ArrowRight, Bookmark, Check, CheckCheck, Dices, ListChecks, MousePointerClick, PenLine, Shapes, Sparkles } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { celebrate } from '../components/Celebrate';
import { Page } from '../components/layout/Page';
import { QuestionList } from '../components/QuestionList';
import { Badge, Button, Card, Dialog, Field, Input, Segmented, Select, Switch, Textarea } from '../components/ui';
import { QTYPE, groupsOf, hasAttempt, sourceLabel, sourceOf, subjectOfPart, type Part, type QBank, type QFormat, type QType, type Question } from '../lib/banks';
import { href, navigate } from '../lib/router';
import { useStore, type Exam, type ExamKind } from '../lib/store';
import { cn, fmtDateTime, toLocalInput } from '../lib/utils';
import { Audience } from './store/MyProducts';

const STEPS = ['Details', 'Questions', 'Configuration', 'Audience', 'Schedule', 'Review'];
const KIND: Record<ExamKind, [string, string, typeof ListChecks]> = { mcq: ['MCQ', 'Objective questions', ListChecks], descriptive: ['Descriptive', 'Written answers', PenLine], mixed: ['Mixed', 'Both formats', Shapes] };
type Who = 'courses' | 'batches' | 'students' | 'all';
const hms = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`;
const dur = (m: number) => [Math.floor(m / 60) && `${Math.floor(m / 60)} hour${m >= 120 ? 's' : ''}`, m % 60 && `${m % 60} minutes`].filter(Boolean).join(' ');

const Box = ({ on, half, disabled, onClick, label }: { on: boolean; half?: boolean; disabled?: boolean; onClick?: () => void; label: string }) => (
  <button type="button" role="checkbox" aria-checked={half ? 'mixed' : on} aria-label={label} disabled={disabled} onClick={onClick}
    className={cn('grid size-[18px] shrink-0 place-items-center rounded-[6px] border transition-colors', on || half ? 'border-fg bg-fg text-bg' : 'border-border-strong', disabled && 'opacity-30')}>
    {on ? <Check className="size-3" strokeWidth={3} /> : half ? <span className="h-0.5 w-2 rounded bg-bg" /> : null}
  </button>
);

/** One question (or group / case) in the picker: the scenario once, its parts; parts outside the chosen chapters can't be picked. */
/** `place` names a part's chapter (with its subject when it's another one); `covers` lists a case's subjects. */
function PickGroup({ q, bank, match, picked, toggle, place, covers }: { q: Question; bank: QBank; match: Part[]; picked: string[]; toggle: (ids: string[], on: boolean) => void; place: (p: Part, b: QBank) => string; covers: string[] }) {
  const n = match.filter((p) => picked.includes(p.id)).length, single = q.parts.length === 1;
  const head = (
    <span className="flex flex-wrap items-center gap-1.5 text-2xs"><Badge>{QTYPE[q.type]}</Badge><Badge tone={q.format === 'case' ? 'pop' : 'neutral'}>{q.format === 'case' ? 'Case-based' : single ? 'Direct' : `Group · ${q.parts.length} parts`}</Badge><span className="truncate text-muted">{sourceLabel(sourceOf(q, bank))}</span>{covers.length > 1 && <span className="text-muted">· covers {covers.join(', ')}</span>}</span>
  );
  if (single) { const p = q.parts[0], on = picked.includes(p.id); return (
    <li className={cn('flex items-start gap-3 rounded-2xl px-3 py-2.5 ring-1 ring-inset transition', on ? 'bg-subtle ring-fg' : 'ring-border hover:bg-subtle')}>
      <span className="pt-0.5"><Box on={on} label="Pick question" onClick={() => toggle([p.id], !on)} /></span>
      <button type="button" className="min-w-0 flex-1 space-y-1 text-left" onClick={() => toggle([p.id], !on)}><span className="block text-sm">{p.text}</span>{head}<span className="block text-2xs text-muted">{place(p, bank)}</span></button>
      <b className="tnum shrink-0 text-sm">{p.marks}<span className="text-2xs font-normal text-muted"> m</span></b>
    </li>
  ); }
  return (
    <li className={cn('overflow-hidden rounded-2xl ring-1 ring-inset', n ? 'ring-fg' : 'ring-border')}>
      <div className="flex items-start gap-3 bg-subtle px-3 py-2.5">
        <span className="pt-0.5"><Box on={n === match.length} half={n > 0 && n < match.length} label="Pick the whole group" onClick={() => toggle(match.map((p) => p.id), n < match.length)} /></span>
        <span className="min-w-0 flex-1 space-y-1">{q.stem && <span className="block text-xs leading-relaxed">{q.stem}</span>}{head}</span>
        <b className="tnum shrink-0 text-xs">{match.reduce((a, p) => a + p.marks, 0)} m</b>
      </div>
      <ul className="divide-y divide-border">{q.parts.map((p) => { const ok = match.includes(p), on = picked.includes(p.id); return (
        <li key={p.id} className={cn('flex items-start gap-3 py-2 pl-9 pr-3 text-sm', !ok && 'opacity-45')}>
          <span className="pt-0.5"><Box on={on} disabled={!ok} label={`Pick part ${p.label}`} onClick={() => toggle([p.id], !on)} /></span>
          <span className="w-5 shrink-0 font-semibold">({p.label})</span>
          <span className="min-w-0 flex-1"><span className="block">{p.text}</span><span className="text-2xs text-muted">{place(p, bank)}{!ok && ' · outside this test’s syllabus'}</span></span>
          <span className="tnum shrink-0 text-xs">{p.marks} m</span>
        </li>
      ); })}</ul>
    </li>
  );
}

export function ExamNew() {
  const { courses, banks: allBanks, batches, students, templates, defaults, addExam, saveTemplate } = useStore();
  const banks = useMemo(() => allBanks.filter((b) => !b.deleted), [allBanks]);
  const [step, setStep] = useState(1), [reached, setReached] = useState(1);
  const go = (n: number) => { setStep(n); setReached((r) => Math.max(r, n)); window.scrollTo({ top: 0 }); };
  // 1 · details
  const [title, setTitle] = useState(''), [desc, setDesc] = useState('');
  const [courseId, setCourseId] = useState(''), [group, setGroup] = useState(''), [subjectId, setSubjectId] = useState('');
  const [chapterIds, setChapterIds] = useState<string[]>([]), [kind, setKind] = useState<ExamKind>('mcq');
  const course = courses.find((c) => c.id === courseId), groups = [...new Set((course?.subjects ?? []).map((s) => s.group).filter(Boolean))] as string[];
  const subject = course?.subjects.find((s) => s.id === subjectId);
  const chapterName = (id?: string) => subject?.chapters.find((c) => c.id === id)?.name ?? 'No chapter';
  const subjectName = (id: string) => course?.subjects.find((x) => x.id === id)?.name ?? '';
  const place = (p: Part, b: QBank) => { const sid = subjectOfPart(p, b), s = course?.subjects.find((x) => x.id === sid); const ch = s?.chapters.find((c) => c.id === p.chapterId)?.name ?? 'No chapter'; return sid === subjectId ? ch : `${s?.name} › ${ch}`; };
  // 2 · questions
  const [picked, setPicked] = useState<string[]>([]), [rounding, setRounding] = useState<string[]>([]);
  const [how, setHow] = useState<'manual' | 'random'>('manual');
  const [qType, setQType] = useState<QType>('mcq'), [format, setFormat] = useState<QFormat>('direct'), [chFilter, setChFilter] = useState('all');
  const [cross, setCross] = useState(false), [source, setSource] = useState('all'), [attempt, setAttempt] = useState('all'), [series, setSeries] = useState('all'), [limit, setLimit] = useState(25);
  const [rType, setRType] = useState<QType | 'any'>('any'), [rFormat, setRFormat] = useState<QFormat | 'any'>('any'), [rSource, setRSource] = useState('all');
  const [counts, setCounts] = useState<Record<string, number>>({}), [preview, setPreview] = useState<string[] | null>(null);
  // 3 · configuration
  const [negOn, setNegOn] = useState(false), [negative, setNegative] = useState(0.25), [duration, setDuration] = useState(120);
  const [onExpiry, setOnExpiry] = useState<'submit' | 'retain'>('submit'), [shuffle, setShuffle] = useState(false), [shuffleOptions, setShuffleOptions] = useState(false), [instructions, setInstructions] = useState('');
  // 4 · audience, 5 · schedule
  const [who, setWho] = useState<Who>('batches'), [ids, setIds] = useState<string[]>([]);
  const tomorrow = new Date(Date.now() + 86400e3);
  const [date, setDate] = useState(toLocalInput(tomorrow).slice(0, 10)), [start, setStart] = useState('10:00'), [end, setEnd] = useState('12:00'), [multi, setMulti] = useState(false);
  const [view, setView] = useState<'questions' | 'audience' | null>(null), [tplName, setTplName] = useState<string | null>(null);

  // ---- question pool: this subject's banks, narrowed by type, format, chapters and source ----
  // Banks of the course with any question (or case sub-question) in this subject — cases can combine subjects.
  const inSubject = (p: Part, b: QBank) => subjectOfPart(p, b) === subjectId;
  const subjectBanks = banks.filter((b) => b.courseId === courseId && b.questions.some((q) => q.parts.some((p) => inSubject(p, b))));
  const entries = subjectBanks.flatMap((bank) => bank.questions.filter((q) => q.parts.some((p) => inSubject(p, bank))).map((q) => ({ q, bank, src: sourceOf(q, bank) })));
  const sourcesHere = [...new Set(entries.map((x) => x.src.source))];
  const attemptsHere = [...new Set(entries.filter((x) => x.src.source === source).map((x) => x.src.attempt).filter(Boolean))] as string[];
  const seriesHere = [...new Set(entries.filter((x) => x.src.series).map((x) => x.src.series!))].sort();
  const typeNow: QType = kind === 'mixed' ? qType : kind;
  const inScope = (p: Part, b: QBank) => inSubject(p, b) && (!chapterIds.length || chapterIds.includes(p.chapterId ?? ''));
  const srcOk = (x: (typeof entries)[number]) => (source === 'all' || x.src.source === source) && (attempt === 'all' || x.src.attempt === attempt) && (series === 'all' || String(x.src.series) === series);
  const covers = (q: Question, b: QBank) => [...new Set(q.parts.map((p) => subjectOfPart(p, b)))].map(subjectName);
  // A case shows if any sub-question is in the syllabus; with `cross` on, its other sub-questions (other subjects/chapters) can be picked too.
  const visible = entries.filter((x) => srcOk(x) && x.q.type === typeNow && x.q.format === format).map(({ q, bank }) => {
    const match = q.parts.filter((p) => inScope(p, bank) && (chFilter === 'all' || p.chapterId === chFilter));
    return { q, bank, match: cross && format === 'case' && match.length ? q.parts : match };
  }).filter((x) => x.match.length);
  const toggle = (list: string[], on: boolean) => setPicked((p) => (on ? [...p, ...list.filter((x) => !p.includes(x))] : p.filter((x) => !list.includes(x))));
  const chosen = groupsOf(banks, picked), parts = chosen.flatMap((g) => g.parts.map((p) => ({ p, q: g.q, sub: subjectOfPart(p, g.bank) })));
  const total = parts.reduce((a, x) => a + x.p.marks, 0), hasMcq = parts.some((x) => x.q.type === 'mcq');
  const roundTo = Math.ceil(total / 10) * 10;
  const roundIds = rounding.filter((id) => picked.includes(id));
  const chapterChoices = chapterIds.length ? subject?.chapters.filter((c) => chapterIds.includes(c.id)) ?? [] : subject?.chapters ?? [];

  /** Adds questions from the test's syllabus until the total reaches the next multiple of 10. */
  const roundOff = () => {
    let gap = roundTo - total; const add: string[] = [];
    const cands = entries.filter(({ q }) => kind === 'mixed' || q.type === kind)
      .flatMap(({ q, bank }) => q.parts.filter((p) => inScope(p, bank) && !picked.includes(p.id)).map((p) => ({ p, single: q.parts.length === 1 })))
      .sort((a, b) => Number(b.single) - Number(a.single) || b.p.marks - a.p.marks);
    for (const { p } of cands) if (p.marks <= gap) { add.push(p.id); gap -= p.marks; if (!gap) break; }
    if (!add.length) return toast('No questions in this syllabus fit the gap', { description: `The total stays at ${total}.` });
    setPicked([...picked, ...add]); setRounding([...rounding, ...add]);
    toast.success(`Added ${add.length} question${add.length > 1 ? 's' : ''}`, { description: gap ? `Total is now ${roundTo - gap}; nothing fits the last ${gap} marks.` : `Total is now ${roundTo}. They're marked in the review.` });
  };
  /** Random selection: the asked number of parts from each chapter, of the chosen type, format and source. */
  const generate = () => {
    const out: string[] = [];
    chapterChoices.forEach((c) => {
      const pool = entries.filter(({ q, src }) => (rSource === 'all' || src.source === rSource) && (kind === 'mixed' ? rType === 'any' || q.type === rType : q.type === kind) && (rFormat === 'any' || q.format === rFormat))
        .flatMap(({ q, bank }) => q.parts.filter((p) => inSubject(p, bank) && p.chapterId === c.id && !picked.includes(p.id)));
      out.push(...pool.map((p) => ({ p, r: Math.random() })).sort((a, b) => a.r - b.r).slice(0, counts[c.id] ?? 0).map((x) => x.p.id));
    });
    // Keep the parts of one case together, in bank order.
    setPreview(groupsOf(banks, out).flatMap((g) => g.parts.map((p) => p.id)));
  };

  // ---- audience ----
  const active = batches.filter((b) => b.status === 'active');
  const reachList = who === 'all' ? students : who === 'courses' ? students.filter((s) => ids.includes(batches.find((b) => b.id === s.batchId)?.course ?? '')) : who === 'batches' ? students.filter((s) => ids.includes(s.batchId)) : students.filter((s) => ids.includes(s.id));
  const pickCourse = (id: string) => { const c = courses.find((x) => x.id === id); setCourseId(id); setGroup(''); setSubjectId(''); setChapterIds([]); setPicked([]); setRounding([]); setWho('batches'); setIds(active.filter((b) => b.course === c?.name).map((b) => b.id)); };

  const neg = negOn && kind !== 'descriptive' && hasMcq;
  const portions = `${subject?.name ?? ''} – ${chapterIds.length ? chapterIds.map(chapterName).join(', ') : 'full syllabus'}`;
  const autoInstructions = `Maximum marks: ${total}. Duration: ${dur(duration)}. Question type: ${KIND[kind][0]}. Portions: ${portions}.${neg ? ` Each wrong MCQ answer deducts ${negative} marks.` : ''}`;
  const timingOk = !!date && !!start && !!end && end > start;
  const valid = [!!title.trim() && !!subjectId, picked.length > 0, duration > 0, reachList.length > 0, timingOk, true];
  const firstGap = valid.findIndex((v) => !v);

  const config = (): Partial<Exam> => ({ kind, duration, negative: neg ? negative : 0, onExpiry, shuffle, shuffleOptions, attempts: multi ? 'unlimited' : '1' });
  const applyTemplate = (id: string) => {
    const c = templates.find((t) => t.id === id)?.config; if (!c) return;
    if (c.kind) setKind(c.kind); if (c.duration) setDuration(c.duration); setNegOn(!!c.negative); if (c.negative) setNegative(c.negative);
    if (c.onExpiry) setOnExpiry(c.onExpiry); setShuffle(!!c.shuffle); setShuffleOptions(!!c.shuffleOptions); setMulti(c.attempts === 'unlimited');
    toast.success('Template applied', { description: 'Type, duration and rules are set. Now pick the subject and questions.' });
  };
  const save = (draft: boolean) => {
    const batchIds = who === 'students' ? [...new Set(reachList.map((s) => s.batchId))] : who === 'batches' ? ids : who === 'courses' ? active.filter((b) => ids.includes(b.course)).map((b) => b.id) : active.map((b) => b.id);
    const e = addExam({ ...config(), title: title.trim(), description: desc.trim() || undefined, subject: subject?.name ?? '', courseId, group: group || undefined, chapterIds, source: 'bank', fileName: 'Question bank',
      partIds: picked, roundingIds: roundIds, maxMarks: total, questionCount: picked.length, instructions: instructions.trim() || autoInstructions,
      batchIds, studentIds: who === 'students' ? ids : undefined, mode: 'timed', opensAt: `${date}T${start}`, closesAt: `${date}T${end}`, perQuestion: false, late: 'none',
      practiceFrom: date, practiceTo: '', policy: defaults.policy, reviewerId: '', see: { steps: true, needed: true, model: true, rank: false }, draft } as Parameters<typeof addExam>[0]);
    if (draft) toast.success('Draft saved'); else celebrate(`“${e.title}” published`, { description: `${reachList.length} students can see it now · opens ${fmtDateTime(`${date}T${start}`)}` });
    navigate({ page: 'exam', id: e.id });
  };

  const chip = (on: boolean) => cn('rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors', on ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg');
  const H = ({ children, tag }: { children: ReactNode; tag?: ReactNode }) => <div className="flex items-center gap-2 border-t border-border pt-5 first:border-0 first:pt-0"><h3 className="text-sm font-semibold">{children}</h3>{tag}</div>;
  const stats: [string, number | string][] = [['Total questions', parts.length], ['MCQs', parts.filter((x) => x.q.type === 'mcq').length], ['Descriptive', parts.filter((x) => x.q.type === 'descriptive').length], ['Case-based', parts.filter((x) => x.q.format === 'case').length], ['Total marks', total], ['Question groups', chosen.filter((g) => g.q.parts.length > 1).length]];
  const Review = ({ n, title: t, children }: { n: number; title: string; children: ReactNode }) => (
    <Card className="p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">{t}</h3><Button size="sm" variant="ghost" onClick={() => go(n)}><PenLine /> Edit</Button></div>{children}</Card>
  );
  const dl = (rows: [string, ReactNode][]) => <dl className="grid gap-x-6 sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-border py-1.5 text-xs last:border-0"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>;

  return (
    <Page crumbs={[{ label: 'Assessments', href: href({ page: 'assessments' }) }, { label: 'Tests', href: href({ page: 'exams' }) }, { label: 'Create test' }]}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-[28px] font-bold tracking-[-0.03em]">Create test</h1><p className="text-sm text-muted">Students see it once published; it opens at the start time.</p></div>
        {templates.length > 0 && <Select aria-label="Start from a template" value="" onChange={(e) => applyTemplate(e.target.value)} className="w-full sm:w-64"><option value="">Start from a template…</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>}
      </div>

      <ol className="-mx-1 mb-5 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">{STEPS.map((s, i) => { const n = i + 1, can = n <= reached; return (
        <li key={s} className="flex-1"><button type="button" disabled={!can} onClick={() => go(n)} className={cn('flex w-full min-w-[110px] items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition', step === n ? 'bg-fg text-bg' : can ? 'bg-subtle hover:bg-hover' : 'text-faint')}>
          <span className={cn('grid size-5 shrink-0 place-items-center rounded-full text-2xs ring-1 ring-inset', step === n ? 'ring-bg/40' : 'ring-border-strong')}>{n < step && valid[i] ? <Check className="size-3" strokeWidth={3} /> : n}</span>{s}
        </button></li>
      ); })}</ol>

      <Card className="p-5 sm:p-6">
        {step === 1 && <div className="space-y-5">
          <H>Basic information</H>
          <Field label="Test name" htmlFor="t-name"><Input id="t-name" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. CA Inter – Advanced Accounting – Chapter Test 01" autoComplete="off" /></Field>
          <Field label="Description" optional><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add a brief description or purpose of this test…" className="min-h-16" /></Field>
          <H>Syllabus</H>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Course"><Select value={courseId} onChange={(e) => pickCourse(e.target.value)}><option value="" disabled>Select course</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            {groups.length > 0 && <Field label="Group"><Segmented value={group || groups[0]} onChange={(g) => { setGroup(g); setSubjectId(''); setChapterIds([]); setPicked([]); }} options={groups.map((g) => ({ value: g, label: g }))} /></Field>}
            <Field label="Subject" className={groups.length ? 'sm:col-span-2' : ''}><Select value={subjectId} disabled={!course} onChange={(e) => { setSubjectId(e.target.value); setChapterIds([]); setPicked([]); setRounding([]); setCounts({}); setSource('all'); }}>
              <option value="" disabled>{course ? 'Select subject' : 'Select a course first'}</option>{course?.subjects.filter((s) => !groups.length || s.group === (group || groups[0])).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          </div>
          <Field label="Chapters" hint={subject ? (chapterIds.length ? `${chapterIds.length} chosen` : 'None chosen = full syllabus (all chapters)') : 'Chapters appear once a subject is chosen.'}>
            <div className="flex flex-wrap gap-1.5">{subject?.chapters.map((ch) => <button key={ch.id} type="button" onClick={() => { setChapterIds((c) => (c.includes(ch.id) ? c.filter((x) => x !== ch.id) : [...c, ch.id])); setChFilter('all'); }} className={chip(chapterIds.includes(ch.id))}>{ch.name}</button>)}</div>
          </Field>
          <H>Examination type</H>
          <div className="grid gap-2 sm:grid-cols-3">{(Object.keys(KIND) as ExamKind[]).map((k) => { const [l, d, Icon] = KIND[k]; return (
            <button key={k} type="button" onClick={() => { setKind(k); if (k !== 'mixed') setQType(k); }} className={cn('flex flex-col items-center gap-1 rounded-2xl px-3 py-4 ring-1 ring-inset transition', kind === k ? 'bg-subtle ring-fg' : 'ring-border hover:bg-subtle')}>
              <Icon className="size-5" /><b className="text-sm">{l}</b><span className="text-2xs text-muted">{d}</span></button>
          ); })}</div>
        </div>}

        {step === 2 && <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented value={how} onChange={(v) => { setHow(v); setPreview(null); }} options={[{ value: 'manual', label: 'Pick questions' }, { value: 'random', label: 'Random selection' }]} />
            <span className="ml-auto text-xs text-muted">{subject?.name} · {chapterIds.length ? `${chapterIds.length} chapter${chapterIds.length > 1 ? 's' : ''}` : 'full syllabus'} · {subjectBanks.length} banks</span>
          </div>
          {!subjectBanks.length && <p className="rounded-xl bg-subtle p-4 text-center text-xs text-muted">No question banks for {subject?.name} yet. <a className="font-semibold underline" href={href({ page: 'question-bank' })}>Upload one in the question bank</a>.</p>}

          {how === 'manual' && subjectBanks.length > 0 && <>
            <div className="grid gap-3 rounded-2xl bg-subtle p-3 sm:grid-cols-2">
              <Field label="Question type">{kind === 'mixed' ? <Segmented value={qType} onChange={setQType} options={[{ value: 'mcq', label: 'MCQ' }, { value: 'descriptive', label: 'Descriptive' }]} /> : <span className="flex h-10 items-center text-sm font-medium">{QTYPE[kind]} <span className="ml-1.5 text-2xs font-normal text-muted">from step 1</span></span>}</Field>
              <Field label="Question format"><Segmented value={format} onChange={setFormat} options={[{ value: 'direct', label: 'Direct question' }, { value: 'case', label: 'Case-based' }]} /></Field>
              {chapterIds.length !== 1 && <Field label="Chapter"><Select value={chFilter} onChange={(e) => setChFilter(e.target.value)}><option value="all">{chapterIds.length ? 'All chosen chapters' : 'All chapters'}</option>{chapterChoices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>}
              <Field label="Source"><div className="flex flex-wrap gap-2">
                <Select aria-label="Source" value={source} onChange={(e) => { setSource(e.target.value); setAttempt('all'); setSeries('all'); }} className="min-w-0 flex-1"><option value="all">All sources</option>{sourcesHere.map((s) => <option key={s}>{s}</option>)}</Select>
                {hasAttempt(source) && <Select aria-label="Examination attempt" value={attempt} onChange={(e) => setAttempt(e.target.value)} className="w-36"><option value="all">Any attempt</option>{attemptsHere.map((m) => <option key={m}>{m}</option>)}</Select>}
                {source === 'MTP' && seriesHere.length > 0 && <Select aria-label="Series" value={series} onChange={(e) => setSeries(e.target.value)} className="w-32"><option value="all">Any series</option>{seriesHere.map((n) => <option key={n} value={n}>Series {n}</option>)}</Select>}
              </div></Field>
              {format === 'case' && <label className="flex items-center gap-3 sm:col-span-2"><Switch checked={cross} onCheckedChange={setCross} label="Include sub-questions from other subjects and chapters" /><span className="text-xs"><b className="font-medium">Combined cases:</b> also allow a case’s sub-questions from other subjects and chapters</span></label>}
            </div>
            <div className="sticky top-14 z-10 flex flex-wrap items-center gap-2 rounded-xl bg-fg px-3 py-2 text-xs text-bg">
              <CheckCheck className="size-4" /><b>{parts.length} questions · {total} marks · {chosen.length} picked groups</b>
              <span className="opacity-60">· {visible.length} {format === 'case' ? 'case studies' : 'questions'} shown</span>
              {picked.length > 0 && <button type="button" className="ml-auto font-semibold underline" onClick={() => { setPicked([]); setRounding([]); }}>Clear all</button>}
            </div>
            {visible.length ? <ul className="space-y-2">{visible.slice(0, limit).map((x) => <PickGroup key={x.q.id} {...x} picked={picked} toggle={toggle} place={place} covers={covers(x.q, x.bank)} />)}</ul>
              : <p className="rounded-xl bg-subtle p-4 text-center text-xs text-muted">No {QTYPE[typeNow]} {format === 'case' ? 'case studies' : 'direct questions'} match. Try another format, chapter or source.</p>}
            {visible.length > limit && <div className="text-center"><Button onClick={() => setLimit(limit + 25)}>Show more ({visible.length - limit} left)</Button></div>}
          </>}

          {how === 'random' && subjectBanks.length > 0 && <>
            <div className="grid gap-3 rounded-2xl bg-subtle p-3 sm:grid-cols-3">
              <Field label="Question type">{kind === 'mixed' ? <Select value={rType} onChange={(e) => setRType(e.target.value as QType | 'any')}><option value="any">MCQ and descriptive</option><option value="mcq">MCQ</option><option value="descriptive">Descriptive</option></Select> : <span className="flex h-10 items-center text-sm font-medium">{QTYPE[kind]}</span>}</Field>
              <Field label="Question format"><Select value={rFormat} onChange={(e) => setRFormat(e.target.value as QFormat | 'any')}><option value="any">Direct and case-based</option><option value="direct">Direct question</option><option value="case">Case-based</option></Select></Field>
              <Field label="Source"><Select value={rSource} onChange={(e) => setRSource(e.target.value)}><option value="all">All sources</option>{sourcesHere.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            </div>
            <Field label="Questions from each chapter" hint="Sub-questions of a case count one by one; the case scenario shows once.">
              <ul className="divide-y divide-border rounded-xl ring-1 ring-inset ring-border">{chapterChoices.map((c) => { const have = entries.filter(({ q }) => kind === 'mixed' || q.type === kind).flatMap(({ q, bank }) => q.parts.filter((p) => inSubject(p, bank) && p.chapterId === c.id)).length; return (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm"><span className="min-w-0 flex-1 truncate">{c.name}</span><span className="text-2xs text-muted">{have} available</span>
                  <Input type="number" min={0} max={have} value={counts[c.id] ?? 0} onChange={(e) => setCounts({ ...counts, [c.id]: Math.max(0, Math.min(have, +e.target.value || 0)) })} className="h-8 w-20 text-right" aria-label={`Questions from ${c.name}`} /></li>
              ); })}</ul>
            </Field>
            <div className="flex flex-wrap items-center gap-2"><Button variant="primary" disabled={!Object.values(counts).some(Boolean)} onClick={generate}><Dices /> Generate selection</Button>{picked.length > 0 && <span className="text-xs text-muted">{parts.length} questions · {total} marks already in the test</span>}</div>
            {preview && <div className="space-y-3 rounded-2xl bg-subtle p-3">
              <div className="flex flex-wrap items-center gap-2"><Sparkles className="size-4" /><b className="text-sm">Review: {preview.length} questions · {groupsOf(banks, preview).flatMap((g) => g.parts).reduce((a, p) => a + p.marks, 0)} marks</b>
                <Button size="sm" className="ml-auto" onClick={generate}>Generate again</Button><Button size="sm" variant="primary" disabled={!preview.length} onClick={() => { toggle(preview, true); toast.success(`${preview.length} questions added to the test`); setPreview(null); }}><Check /> Add to test</Button></div>
              {preview.length ? <QuestionList partIds={preview} /> : <p className="text-xs text-muted">Nothing matched. Loosen the type, format or source.</p>}
            </div>}
          </>}
        </div>}

        {step === 3 && <div className="space-y-5">
          <H>A. Marks and scoring</H>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-subtle p-4"><div className="text-xs text-muted">Total questions</div><div className="tnum text-3xl font-bold">{parts.length}</div></div><div className="rounded-2xl bg-subtle p-4"><div className="text-xs text-muted">Maximum marks</div><div className="tnum text-3xl font-bold">{total}</div></div></div>
          <p className="text-xs text-muted">Worked out from each question's marks in the bank.</p>
          {total % 10 !== 0 && total > 0 && <div className="flex flex-wrap items-center gap-3 rounded-xl bg-warn/10 px-3 py-2.5 text-xs"><span className="flex-1">{total} isn't a round figure. Add questions from this syllabus to make it {roundTo}?</span><Button size="sm" variant="primary" onClick={roundOff}>Make it {roundTo}</Button></div>}
          {roundIds.length > 0 && <p className="text-xs text-muted">{roundIds.length > 1 ? `${roundIds.length} questions were added to round off the marks; they're` : '1 question was added to round off the marks; it’s'} marked in the review.</p>}
          {kind !== 'descriptive' && <>
            <H tag={<Badge tone="pop">MCQ only</Badge>}>Negative marking</H>
            <Segmented value={negOn ? 'yes' : 'no'} onChange={(v) => setNegOn(v === 'yes')} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
            {negOn && <Field label="Marks deducted for each incorrect answer" hint="Applies to objective questions only."><Input type="number" min={0.25} step={0.25} value={negative} onChange={(e) => setNegative(Math.max(0, +e.target.value))} className="sm:w-40" /></Field>}
          </>}
          <H>B. Duration and timing</H>
          <div className="grid items-end gap-4 sm:grid-cols-2">
            <Field label="Examination duration (minutes)"><Input type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(Math.max(5, +e.target.value || 5))} /></Field>
            <div className="rounded-2xl bg-subtle px-4 py-2.5"><div className="text-2xs text-muted">Duration preview</div><div className="tnum text-xl font-bold">{hms(duration)}</div><div className="text-2xs text-muted">{dur(duration)} examination time</div></div>
          </div>
          <Field label="When time expires"><Segmented value={onExpiry} onChange={setOnExpiry} options={[{ value: 'submit', label: 'Submit automatically' }, { value: 'retain', label: 'End and keep answers so far' }]} /></Field>
          <H>C. Question presentation</H>
          <div className="divide-y divide-border rounded-xl ring-1 ring-inset ring-border">
            <label className="flex items-center gap-4 px-3 py-2.5"><span className="flex-1"><b className="block text-sm font-medium">Shuffle questions</b><span className="text-2xs text-muted">Each student gets a different order, including the sub-questions inside a group.</span></span><Switch checked={shuffle} onCheckedChange={setShuffle} label="Shuffle questions" /></label>
            {kind !== 'descriptive' && <label className="flex items-center gap-4 px-3 py-2.5"><span className="flex-1"><b className="block text-sm font-medium">Shuffle MCQ options</b><span className="text-2xs text-muted">Randomise the order of answer options.</span></span><Switch checked={shuffleOptions} onCheckedChange={setShuffleOptions} label="Shuffle MCQ options" /></label>}
          </div>
          <H>D. Examination instructions</H>
          <Field label="Instructions for students" optional hint="Shown before they begin. Left empty, the instructions are filled in from the marks, duration, type and portions."><Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder={autoInstructions} className="min-h-24" /></Field>
        </div>}

        {step === 4 && <div className="grid gap-4 sm:grid-cols-2">
          <Audience label="Who takes this test" allLabel="All students" students who={who} ids={ids} onChange={(w, x) => { setWho(w); setIds(x); }} />
          <p className="text-xs text-muted sm:col-span-2"><b className="text-fg">{reachList.length}</b> eligible students</p>
        </div>}

        {step === 5 && <div className="space-y-5">
          <H>Test schedule</H>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Test date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Start time"><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
            <Field label="End time" hint={!timingOk ? <span className="text-bad">Must be after the start time</span> : undefined}><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          </div>
          <div className="rounded-2xl bg-subtle p-4 text-xs leading-relaxed text-muted">
            <b className="mb-1 block text-sm text-fg">How the timing works</b>
            Students see the test as soon as it's published but can start only at {start}. They can start any time until {end}; at {end} it closes for everyone and answers so far are kept. Starting late gives no extra time: someone starting 30 minutes before the end gets 30 minutes.
            {timingOk && duration > (+end.slice(0, 2) * 60 + +end.slice(3)) - (+start.slice(0, 2) * 60 + +start.slice(3)) && <span className="mt-1 block text-warn">The duration ({dur(duration)}) is longer than this window, so nobody gets the full duration.</span>}
          </div>
          <H>Additional setting</H>
          <label className="flex items-center gap-4"><span className="flex-1 text-sm">Allow multiple attempts</span><Switch checked={multi} onCheckedChange={setMulti} label="Allow multiple attempts" /></label>
        </div>}

        {step === 6 && <div className="space-y-3">
          <Review n={1} title="Test overview">{dl([['Test name', title], ['Course / group', `${course?.name ?? ''}${group || groups[0] ? ` · ${group || groups[0]}` : ''}`], ['Subject', [subject?.name, ...new Set(parts.map((x) => x.sub).filter((id) => id !== subjectId).map(subjectName))].filter(Boolean).join(' + ')], ['Chapters', chapterIds.length ? chapterIds.map(chapterName).join(', ') : 'Full syllabus'], ['Question type', KIND[kind][0]], ['Number of questions', parts.length], ['Maximum marks', total], ['Duration', dur(duration)], ...(neg ? [['Negative marking', `−${negative} per wrong MCQ`] as [string, ReactNode]] : [])])}</Review>
          <Review n={2} title="Question summary">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{stats.map(([k, v]) => <div key={k} className="rounded-xl bg-subtle p-2.5 text-center"><b className="tnum block text-lg">{v}</b><span className="text-2xs text-muted">{k}</span></div>)}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">{roundIds.length > 0 && <Badge tone="warn">{roundIds.length} added to round off marks</Badge>}<Button size="sm" className="ml-auto" onClick={() => setView('questions')}><MousePointerClick /> View selected questions</Button></div>
          </Review>
          <Review n={3} title="Test configuration">{dl([['Negative marking', neg ? `Yes · −${negative}` : 'No'], ['Shuffle', [shuffle && 'Questions', shuffleOptions && kind !== 'descriptive' && 'MCQ options'].filter(Boolean).join(' and ') || 'Off'], ['When time expires', onExpiry === 'submit' ? 'Submit automatically' : 'End and keep answers'], ['Instructions', instructions.trim() ? 'Custom' : 'Filled in automatically']])}</Review>
          <Review n={4} title="Audience">
            {dl([['Selected', who === 'all' ? 'All students' : `${ids.length} ${who === 'students' ? 'students' : who}`], ['Total eligible students', reachList.length]])}
            <div className="mt-3 text-right"><Button size="sm" onClick={() => setView('audience')}>View audience</Button></div>
          </Review>
          <Review n={5} title="Schedule">{dl([['Test date', new Date(`${date}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })], ['Start time', start], ['End time', end], ['Multiple attempts', multi ? 'Enabled' : 'Disabled']])}</Review>
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3"><span className="flex-1"><b className="block text-sm">Ready to publish?</b><span className="text-xs text-muted">{firstGap < 0 ? 'Students see it right away; it opens at the start time and closes at the end time.' : `Finish step ${firstGap + 1} (${STEPS[firstGap]}) first.`}</span></span>
              <Badge tone={firstGap < 0 ? 'pop' : 'warn'}>{firstGap < 0 ? 'Ready to publish' : 'Incomplete'}</Badge></div>
            <div className="mt-3 flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => setTplName(title.trim() ? `${title.trim()} setup` : '')}><Bookmark /> Save as template</Button><Button disabled={!title.trim()} onClick={() => save(true)}>Save as draft</Button><Button variant="primary" disabled={firstGap >= 0} onClick={() => save(false)}>Publish test</Button></div>
          </Card>
        </div>}

        {step < 6 && <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <Button disabled={step === 1} onClick={() => go(step - 1)}><ArrowLeft /> Back</Button>
          <span className="text-2xs text-muted">{!valid[step - 1] && ['Add a name, course and subject.', 'Pick at least one question.', 'Set a duration.', 'Choose who takes the test.', 'End time must be after the start time.'][step - 1]}</span>
          <Button variant="primary" disabled={!valid[step - 1]} onClick={() => go(step + 1)}>Continue <ArrowRight /></Button>
        </div>}
      </Card>

      {view === 'questions' && <Dialog wide open onOpenChange={(v) => !v && setView(null)} title="Selected questions" desc={`${parts.length} questions · ${total} marks, in the order students see them${shuffle ? ' (shuffled for each student)' : ''}.`} className="max-w-3xl"><div className="pb-2"><QuestionList partIds={picked} rounding={roundIds} /></div></Dialog>}
      {view === 'audience' && <Dialog open onOpenChange={(v) => !v && setView(null)} title="Audience" desc={`${reachList.length} eligible students`}>
        <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto pb-2">{reachList.slice(0, 300).map((s) => <li key={s.id} className="flex justify-between gap-2 py-1.5 text-sm"><span className="truncate">{s.name}</span><span className="shrink-0 text-2xs text-muted">{s.studentId} · {batches.find((b) => b.id === s.batchId)?.name}</span></li>)}</ul>
      </Dialog>}
      {tplName !== null && (
        <Dialog open onOpenChange={(v) => !v && setTplName(null)} title="Save as template" desc="Keeps the type, duration, negative marking, shuffle and attempt settings, to reuse for new tests."
          footer={<><Button onClick={() => setTplName(null)}>Cancel</Button><Button variant="primary" disabled={!tplName.trim()} onClick={() => { saveTemplate(tplName.trim(), config()); setTplName(null); celebrate('Template saved', { description: 'Pick it from “Start from a template” next time.' }); }}>Save</Button></>}>
          <Field label="Template name" className="pb-2"><Input autoFocus value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Weekly MCQ test · 30 min" autoComplete="off" /></Field>
        </Dialog>
      )}
    </Page>
  );
}
