// Assessments · Question bank. Banks only: each one is an uploaded Word or Excel file of questions (the client's
// normal or case template), filed under a course and a main subject. Sub-questions can sit in other subjects and
// chapters; names the file uses are matched automatically, and the academy maps any that don't match.
import { Check, Download, FileSpreadsheet, FileText, Library, Paperclip, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';
import { celebrate } from '../components/Celebrate';
import { Donut } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Badge, Button, btn, Card, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger, EmptyState, Field, Input, Segmented, Select } from '../components/ui';
import { ACCEPT, CASE_COLUMNS, NORMAL_COLUMNS, SHEETS, SOURCES, attachments, bankFiles, fileKind, fmtSize, hasAttempt, sourceOf, statsOf, subjectOfPart, type Question, type QBank } from '../lib/banks';
import { parseBankFile, type Parsed, type PlacedPart } from '../lib/parseBank';
import { href } from '../lib/router';
import { useStore, type CourseInfo } from '../lib/store';
import { cn, downloadCSV, fmtDate } from '../lib/utils';

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const subjectName = (c: CourseInfo | undefined, id?: string) => c?.subjects.find((s) => s.id === id)?.name ?? '';
/** Every subject a bank's questions touch, main subject first. */
const subjectsOf = (b: QBank) => [...new Set([b.subjectId, ...b.questions.flatMap((q) => q.parts.map((p) => subjectOfPart(p, b)))])];
const sourcesOf = (b: QBank) => [...new Set(b.questions.map((q) => sourceOf(q, b).source))];
const FileIcon = ({ kind, className }: { kind: QBank['file']['kind']; className?: string }) => (
  <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', kind === 'excel' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-sky-500/12 text-sky-600 dark:text-sky-400', className)}>
    {kind === 'excel' ? <FileSpreadsheet className="size-5" /> : <FileText className="size-5" />}
  </span>
);

/** Drop target for question files (and the images / PDFs they mention); also opens the file picker on click. */
function DropZone({ onFiles }: { onFiles: (f: File[]) => void }) {
  const [over, setOver] = useState(false);
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); onFiles([...e.dataTransfer.files]); };
  return (
    <label onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}
      className={cn('flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed px-5 py-4 transition-colors', over ? 'border-pop bg-pop/5' : 'border-border-strong bg-subtle hover:border-fg/40')}>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-panel ring-1 ring-border"><Upload className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{over ? 'Drop to add the files' : 'Drag and drop Word or Excel files here'}</span>
        <span className="block text-xs text-muted">or click to browse · .docx, .xlsx, .csv · each file becomes one bank · add the images or PDFs it mentions alongside</span>
      </span>
      <input type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => { onFiles([...(e.target.files ?? [])]); e.target.value = ''; }} />
    </label>
  );
}

export function QuestionBank() {
  const { courses } = useStore(), banks = useStore((s) => s.banks).filter((b) => !b.deleted);
  const [course, setCourse] = useState('all'), [subject, setSubject] = useState('all'), [source, setSource] = useState('all'), [q, setQ] = useState('');
  const [files, setFiles] = useState<File[] | null>(null), [open, setOpen] = useState<string | null>(null);
  const co = courses.find((c) => c.id === course);
  const shown = banks.filter((b) => (course === 'all' || b.courseId === course) && (subject === 'all' || subjectsOf(b).includes(subject)) && (source === 'all' || sourcesOf(b).includes(source)) && `${b.name} ${b.file.name}`.toLowerCase().includes(q.toLowerCase()));
  const all = statsOf(shown.flatMap((b) => b.questions));
  const bySource = SOURCES.map((s) => [s, shown.reduce((a, b) => a + b.questions.filter((x) => sourceOf(x, b).source === s).reduce((n, x) => n + x.parts.length, 0), 0)] as const).filter(([, n]) => n);
  const take = (list: File[]) => {
    const sheets = list.filter((f) => SHEETS.test(f.name)), extras = list.filter((f) => !SHEETS.test(f.name));
    extras.forEach((f) => attachments.set(f.name, f));
    if (sheets.length) setFiles(sheets);
    else if (extras.length) toast.success(`${plural(extras.length, 'attachment')} added`, { description: 'Questions that name these files will show them.' });
  };
  const template = (kind: 'normal' | 'case') => void (kind === 'normal'
    ? downloadCSV('questions-normal-template.csv', [NORMAL_COLUMNS, ['Sample question', 'A', 'B', '', '', 'A', 'Why A is correct', 'Why B is wrong', 'Example.pdf', 'Mar 2026', 'MTP/RTP/PYQ/ISM', 'Accounting', 'Journal entries', '2']])
    : downloadCSV('questions-case-template.csv', [CASE_COLUMNS, ['Sample case passage', 'First sub-question', 'A', 'B', 'C', '', 'A', 'Why A is correct', 'Why the other options are wrong', 'Example.pdf', 'Mar 2026', 'MTP/RTP/PYQ/ISM', 'Accounting', 'Journal entries', '2'],
      ['', 'Second sub-question in the same case', 'A', 'B', '', '', 'B', 'Why B is correct', 'Why A is wrong', 'Example.pdf', 'Mar 2026', 'MTP/RTP/PYQ/ISM', 'Accounting', 'Journal entries', '1']])).then((ok) => ok && toast.success('Template downloaded'));
  const tile = 'flex flex-col rounded-2xl bg-panel p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]';
  return (
    <Page crumbs={[{ label: 'Assessments', href: href({ page: 'assessments' }) }, { label: 'Question bank' }]}
      actions={<>
        <DropdownMenu><DropdownTrigger asChild><Button><Download /> Templates</Button></DropdownTrigger>
          <DropdownContent><DropdownItem onSelect={() => template('normal')}>Normal MCQ template</DropdownItem><DropdownItem onSelect={() => template('case')}>Case MCQ template</DropdownItem></DropdownContent></DropdownMenu>
        <label className={cn(btn('primary'), 'cursor-pointer')}><Upload /> Upload bank<input type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => { take([...(e.target.files ?? [])]); e.target.value = ''; }} /></label>
      </>}>
      <div className="mb-5"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Question bank</h1><p className="text-sm text-muted">Each bank is one Word or Excel file, filed by course and subject. Tests pick their questions from these banks.</p></div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={tile}><span className="text-xs text-muted">Question banks</span><span className="tnum mt-1 text-3xl font-bold">{shown.length}</span><span className="mt-auto pt-2 text-2xs text-muted">{shown.filter((b) => b.file.kind === 'word').length} Word · {shown.filter((b) => b.file.kind === 'excel').length} Excel</span></div>
        <div className={tile}><span className="text-xs text-muted">Questions inside</span><span className="tnum mt-1 text-3xl font-bold">{all.questions.toLocaleString('en-IN')}</span>
          <span className="mt-auto pt-2"><span className="flex h-1.5 overflow-hidden rounded-full bg-border"><span className="bg-fg" style={{ flex: all.mcq }} /><span className="bg-pop" style={{ flex: all.descriptive }} /></span><span className="mt-1 flex justify-between text-2xs text-muted"><span>{all.mcq} MCQ</span><span>{all.descriptive} descriptive</span></span></span></div>
        <div className={cn(tile, 'flex-row items-center gap-3')}><Donut size={74} thickness={11} center={<span className="text-sm">{all.groups}</span>} sub="grouped" segments={[{ label: 'Case studies', value: all.cases, tone: 'pop' }, { label: 'Question groups', value: all.groups - all.cases, tone: 'ink' }]} />
          <span className="space-y-1 text-2xs"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-pop" />{plural(all.cases, 'case study', 'case studies')}</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-fg" />{plural(all.groups - all.cases, 'group')} (a, b, c)</span></span></div>
        <div className={tile}><span className="mb-2 text-xs text-muted">Questions by source</span>
          <ul className="space-y-1">{bySource.map(([s, n]) => <li key={s} className="grid grid-cols-[minmax(0,1fr)_60px_28px] items-center gap-2 text-2xs"><span className="truncate">{s}</span><span className="h-1.5 overflow-hidden rounded-full hatch"><span className="block h-full rounded-full bg-fg" style={{ width: `${(n / Math.max(...bySource.map((x) => x[1]))) * 100}%` }} /></span><b className="tnum text-right">{n}</b></li>)}</ul></div>
      </div>

      <div className="mb-5"><DropZone onFiles={take} /></div>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented value={course} onChange={(v) => { setCourse(v); setSubject('all'); }} options={[{ value: 'all', label: 'All courses' }, ...courses.map((c) => ({ value: c.id, label: c.name.replace('CA ', '') }))]} />
          <Select aria-label="Subject" value={subject} disabled={!co} onChange={(e) => setSubject(e.target.value)} className="w-full sm:w-56"><option value="all">{co ? 'All subjects' : 'Pick a course for subjects'}</option>{co?.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          <Select aria-label="Source" value={source} onChange={(e) => setSource(e.target.value)} className="w-full sm:w-48"><option value="all">All sources</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</Select>
          <div className="relative w-full sm:w-56"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search banks" className="pl-10" aria-label="Search banks" /></div>
          {(course !== 'all' || source !== 'all' || q) && <Button size="sm" variant="ghost" onClick={() => { setCourse('all'); setSubject('all'); setSource('all'); setQ(''); }}><X /> Clear</Button>}
          <span className="ml-auto text-xs text-muted">{plural(shown.length, 'bank')}</span>
        </div>
        {shown.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shown.map((b) => { const st = statsOf(b.questions), c = courses.find((x) => x.id === b.courseId), subs = subjectsOf(b); return (
            <button key={b.id} type="button" onClick={() => setOpen(b.id)} className="flex flex-col rounded-2xl bg-subtle p-4 text-left ring-1 ring-inset ring-transparent transition hover:bg-panel hover:ring-border-strong">
              <span className="flex items-start gap-3"><FileIcon kind={b.file.kind} /><span className="min-w-0 flex-1"><span className="line-clamp-2 text-sm font-semibold leading-snug">{b.name}</span>
                <span className="mt-0.5 block truncate text-2xs text-muted">{c?.name} › {subjectName(c, b.subjectId)}{subs.length > 1 && ` + ${subs.slice(1).map((id) => subjectName(c, id)).join(', ')}`}</span></span></span>
              <span className="mt-3 flex flex-wrap gap-1">{sourcesOf(b).map((s) => <Badge key={s} tone="ink">{s}</Badge>)}{st.cases > 0 && <Badge>{plural(st.cases, 'case study', 'case studies')}</Badge>}</span>
              <span className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3 text-center"><span><b className="tnum block text-base">{st.questions}</b><span className="text-2xs text-muted">{st.questions === 1 ? 'question' : 'questions'}</span></span><span><b className="tnum block text-base">{st.marks}</b><span className="text-2xs text-muted">marks</span></span><span><b className="tnum block text-base">{st.chapters.length}</b><span className="text-2xs text-muted">{st.chapters.length === 1 ? 'chapter' : 'chapters'}</span></span></span>
            </button>
          ); })}</div>
        ) : <EmptyState compact icon={Library} title={banks.length ? 'No banks match' : 'No question banks yet'}>Drop a Word or Excel file above to add one.</EmptyState>}
      </Card>
      {files && <UploadDialog files={files} onClose={() => setFiles(null)} preset={course} />}
      {open && banks.some((b) => b.id === open) && <BankDialog bank={banks.find((b) => b.id === open)!} onClose={() => setOpen(null)} />}
    </Page>
  );
}

// ---------- Upload ----------
type Read = { file: File; name: string; parsed?: Parsed; error?: string };
/** Where a chapter / subject name from the file goes: "subjectId|chapterId" ("subjectId|" = whole subject). */
type Mapping = Record<string, string>;
const placeOptions = (course: CourseInfo) => course.subjects.map((s) => (
  <optgroup key={s.id} label={s.name}><option value={`${s.id}|`}>{s.name} (whole subject)</option>{s.chapters.map((c) => <option key={c.id} value={`${s.id}|${c.id}`}>{c.name}</option>)}</optgroup>
));

/** Course, main subject (detected), defaults for source and attempt, and a map for names the file uses that aren't in the course. */
function UploadDialog({ files, preset, onClose }: { files: File[]; preset: string; onClose: () => void }) {
  const { courses, saveBank } = useStore();
  const [courseId, setCourseId] = useState(courses.find((c) => c.id === preset)?.id ?? courses[0].id);
  const course = courses.find((c) => c.id === courseId)!;
  const [subjectId, setSubjectId] = useState(''), [map, setMap] = useState<Mapping>({});
  const [source, setSource] = useState<string>('PYQ'), [attempt, setAttempt] = useState(''), [series, setSeries] = useState(1);
  const [reads, setReads] = useState<Read[]>(() => files.map((f) => ({ file: f, name: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') })));
  const done = useRef(false);
  // Read every file against the course (re-read when the course changes); the main subject is the one most parts are in.
  useEffect(() => {
    let live = true;
    void Promise.all(files.map((f) => parseBankFile(f, course).then((parsed): Partial<Read> => ({ parsed }), (e: Error): Partial<Read> => ({ error: e.message || 'This file couldn’t be read' })))).then((res) => {
      if (!live) return;
      setReads((r) => r.map((x, i) => ({ ...x, parsed: undefined, error: undefined, ...res[i] })));
      const count = new Map<string, number>();
      res.flatMap((x) => x.parsed?.questions ?? []).flatMap((q) => q.parts).forEach((p) => p.subjectId && count.set(p.subjectId, (count.get(p.subjectId) ?? 0) + 1));
      setSubjectId([...count].sort((a, b) => b[1] - a[1])[0]?.[0] ?? course.subjects[0]?.id ?? ''); setMap({});
    });
    return () => { live = false; };
  }, [files, course]);
  const ready = reads.filter((r) => r.parsed?.questions.length);
  const unknown = [...new Set(ready.flatMap((r) => r.parsed!.unknown))];
  const referenced = [...new Set(ready.flatMap((r) => r.parsed!.files))];
  const ownSources = ready.every((r) => r.parsed!.questions.every((q) => q.source));
  const subjects = [...new Set(ready.flatMap((r) => r.parsed!.questions.flatMap((q) => q.parts.map((p) => p.subjectId))).filter(Boolean))] as string[];
  const save = () => {
    if (!ready.length || done.current) return; done.current = true;
    ready.forEach((r) => {
      const questions: Question[] = r.parsed!.questions.map((q) => ({ ...q, parts: q.parts.map(({ place, ...p }: PlacedPart) => {
        const [sid, cid] = (place && map[place] ? map[place] : '|').split('|');
        const s = p.subjectId ?? (sid || undefined);
        return { ...p, subjectId: s && s !== subjectId ? s : undefined, chapterId: p.chapterId ?? (cid || undefined) };
      }) }));
      const id = saveBank({ name: r.name.trim() || r.file.name, courseId, subjectId, source, attempt: hasAttempt(source) && attempt.trim() ? attempt.trim() : undefined, series: source === 'MTP' ? series : undefined, file: { name: r.file.name, size: r.file.size, kind: fileKind(r.file.name) }, questions });
      bankFiles.set(id, r.file);
    });
    const n = ready.reduce((a, r) => a + statsOf(r.parsed!.questions).questions, 0);
    onClose(); celebrate(ready.length === 1 ? 'Question bank added' : `${ready.length} question banks added`, { description: `${plural(n, 'question')} in ${course.name}.` });
  };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={files.length === 1 ? 'Add question bank' : `Add ${files.length} question banks`} desc="We read the subject, chapter, source and attempt from each row; check them here." className="max-w-3xl"
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!ready.length || !subjectId} onClick={save}>Add {ready.length > 1 ? `${ready.length} banks` : 'bank'}</Button></>}>
      <div className="space-y-5 pb-2">
        <ul className="space-y-2">{reads.map((r, i) => { const st = r.parsed && statsOf(r.parsed.questions); return (
          <li key={i} className="flex items-center gap-3 rounded-xl bg-subtle p-3">
            <FileIcon kind={fileKind(r.file.name)} />
            <span className="min-w-0 flex-1 space-y-1">
              <Input value={r.name} onChange={(e) => setReads(reads.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} aria-label="Bank name" className="h-8" />
              <span className="block truncate text-2xs text-muted">{r.file.name} · {fmtSize(r.file.size)} · {r.error ? <span className="text-bad">{r.error}</span> : !st ? 'Reading…' : st.questions
                ? [plural(st.questions, 'question'), plural(st.marks, 'mark'), st.cases && plural(st.cases, 'case study', 'case studies'), st.groups - st.cases && plural(st.groups - st.cases, 'group')].filter(Boolean).join(' · ')
                : <span className="text-bad">No questions found. Use the template layout.</span>}</span>
              {r.parsed && r.parsed.problems.length > 0 && <span className="block text-2xs text-warn">{r.parsed.problems.slice(0, 3).join(' · ')}{r.parsed.problems.length > 3 && ` · +${r.parsed.problems.length - 3} more`}</span>}
            </span>
          </li>
        ); })}</ul>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Course"><Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Main subject" hint={subjects.length > 1 ? `Questions cover ${subjects.map((s) => subjectName(course, s)).join(', ')}.` : 'Found from the chapter names in the file.'}>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>{course.subjects.map((s) => <option key={s.id} value={s.id}>{s.group ? `${s.group} · ` : ''}{s.name}</option>)}</Select></Field>
          <Field label={ownSources ? 'Source (every row gives its own)' : 'Source, for rows without one'}><Select value={source} onChange={(e) => setSource(e.target.value)}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          {hasAttempt(source) && <Field label="Examination attempt, for rows without one" optional><Input value={attempt} onChange={(e) => setAttempt(e.target.value)} placeholder="e.g. May 2026" /></Field>}
          {source === 'MTP' && <Field label="MTP series"><Segmented value={String(series)} onChange={(v) => setSeries(+v)} options={[1, 2, 3].map((n) => ({ value: String(n), label: `Series ${n}` }))} /></Field>}
        </div>

        {unknown.length > 0 && (
          <section>
            <h4 className="mb-1 text-xs font-semibold">Map these to the syllabus</h4>
            <p className="mb-2 text-2xs text-muted">These chapter names in the file aren't in {course.name}. Pick where each belongs, or leave them under the main subject.</p>
            <ul className="divide-y divide-border rounded-xl ring-1 ring-inset ring-border">{unknown.map((n) => (
              <li key={n} className="grid items-center gap-2 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_260px]"><span className="truncate">“{n}”</span>
                <Select aria-label={`Where ${n} belongs`} value={map[n] ?? ''} onChange={(e) => setMap({ ...map, [n]: e.target.value })}><option value="">Main subject, no chapter</option>{placeOptions(course)}</Select></li>
            ))}</ul>
          </section>
        )}

        {referenced.length > 0 && (
          <section>
            <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold"><Paperclip className="size-3.5" /> Files the questions mention</h4>
            <ul className="flex flex-wrap gap-1.5">{referenced.map((f) => { const ok = attachments.has(f); return <li key={f}><Badge tone={ok ? 'pop' : 'warn'}>{ok ? <Check className="size-3" /> : null}{f}{!ok && ' · not added'}</Badge></li>; })}</ul>
            {referenced.some((f) => !attachments.has(f)) && <p className="mt-1 text-2xs text-muted">Drop the missing files on the question bank page any time; questions pick them up by name.</p>}
          </section>
        )}

        <details className="rounded-xl ring-1 ring-inset ring-border">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold">How to lay out the file</summary>
          <div className="grid gap-4 border-t border-border p-3 text-2xs text-muted sm:grid-cols-2">
            <div><b className="text-fg">Excel (.xlsx, .csv)</b><p className="mt-1">Use the Normal or Case MCQ template (Templates, top right). In the case template, write the passage on the first row only; the rows below with the passage blank are its sub-questions. Options can be 1 to 4; leave the rest empty. Chapter Name can be a chapter or a subject.</p></div>
            <div><b className="text-fg">Word (.docx)</b><pre className="mt-1 whitespace-pre-wrap rounded-lg bg-subtle p-2 font-mono text-[11px] leading-relaxed text-fg">{'Q1. Which is correct about AS 10? [2 marks] {AS 10}\nA) Option one\nB) Option two\nAnswer: B\nQ2. Case: A company bought machinery…\n(a) Find the initial cost. [2 marks] {AS 10}\n(b) Tax treatment? [3 marks] {Taxation › PGBP}'}</pre></div>
          </div>
        </details>
      </div>
    </Dialog>
  );
}

// ---------- One bank ----------
function BankDialog({ bank, onClose }: { bank: QBank; onClose: () => void }) {
  const { courses, exams, saveBank, removeBank } = useStore();
  const course = courses.find((c) => c.id === bank.courseId), st = statsOf(bank.questions);
  const ids = new Set(bank.questions.flatMap((q) => q.parts.map((p) => p.id)));
  const used = exams.filter((e) => e.partIds?.some((id) => ids.has(id)));
  const [name, setName] = useState(bank.name), [confirm, setConfirm] = useState(false);
  // Chapters covered, by subject.
  const bySubject = subjectsOf(bank).map((sid) => ({ sid, chapters: [...new Set(bank.questions.flatMap((q) => q.parts.filter((p) => subjectOfPart(p, bank) === sid).map((p) => p.chapterId)).filter(Boolean))] as string[] }));
  const download = () => { const f = bankFiles.get(bank.id); if (!f) return toast('Sample banks have no file', { description: 'Files you upload can be downloaded here; stored files arrive with the server.' }); const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const replace = async (f?: File) => {
    if (!f || !course) return;
    try {
      const p = await parseBankFile(f, course);
      if (!p.questions.length) return toast.error('No questions found in that file');
      const questions = p.questions.map((q) => ({ ...q, parts: q.parts.map(({ place: _, ...x }: PlacedPart) => ({ ...x, subjectId: x.subjectId !== bank.subjectId ? x.subjectId : undefined })) }));
      saveBank({ ...bank, file: { name: f.name, size: f.size, kind: fileKind(f.name) }, questions, retired: [...(bank.retired ?? []), ...bank.questions] }, bank.id); bankFiles.set(bank.id, f);
      toast.success('File replaced', { description: `${plural(statsOf(questions).questions, 'question')}${p.unknown.length ? `; ${p.unknown.length} chapter names weren't found` : ''}. Tests already created keep their questions.` });
    } catch (e) { toast.error((e as Error).message); }
  };
  const rows: [string, string][] = [['Course', course?.name ?? ''], ['Main subject', subjectName(course, bank.subjectId)], ['Sources', sourcesOf(bank).join(', ')], ['Questions', `${st.questions} (${st.mcq} MCQ · ${st.descriptive} descriptive)`], ['Case studies', `${st.cases}`], ['Question groups', `${st.groups}`], ['Total marks', `${st.marks}`], ['Uploaded', `${bank.by} · ${fmtDate(bank.createdAt)}`]];
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title="Question bank" desc={`${course?.name} › ${subjectName(course, bank.subjectId)}`}
      footer={<><Button variant="ghost" className="mr-auto text-bad" onClick={() => setConfirm(true)}><Trash2 /> Delete</Button><Button onClick={onClose}>Close</Button><Button variant="primary" disabled={!name.trim() || name === bank.name} onClick={() => { saveBank({ ...bank, name: name.trim() }, bank.id); toast.success('Bank renamed'); }}>Save name</Button></>}>
      <div className="space-y-5 pb-2">
        <Field label="Bank name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="flex items-center gap-3 rounded-xl bg-subtle p-3">
          <FileIcon kind={bank.file.kind} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{bank.file.name}</span><span className="text-2xs text-muted">{fmtSize(bank.file.size)}</span></span>
          <Button size="sm" onClick={download}><Download /> Download</Button>
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 ring-inset ring-border-strong hover:bg-panel"><RefreshCw className="size-3.5" /> Replace<input type="file" accept=".docx,.xlsx,.csv" className="sr-only" onChange={(e) => { void replace(e.target.files?.[0]); e.target.value = ''; }} /></label>
        </div>
        <dl className="grid gap-x-6 sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-border py-2 text-xs"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>
        <section><h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">Syllabus covered</h4>
          <ul className="space-y-2">{bySubject.map(({ sid, chapters }) => { const s = course?.subjects.find((x) => x.id === sid); return (
            <li key={sid}><span className="text-xs font-semibold">{s?.name}</span>{sid === bank.subjectId && <span className="text-2xs text-muted"> · main subject</span>}
              <div className="mt-1 flex flex-wrap gap-1.5">{chapters.length ? chapters.map((id) => <Badge key={id}>{s?.chapters.find((c) => c.id === id)?.name ?? 'Unknown'}</Badge>) : <span className="text-2xs text-muted">No chapters given</span>}</div></li>
          ); })}</ul></section>
        <section><h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">Used in tests</h4>
          {used.length ? <ul className="space-y-1">{used.map((e) => <li key={e.id}><a href={href({ page: 'exam', id: e.id })} className="text-sm font-medium hover:underline">{e.title}</a> <span className="text-2xs text-muted">· {fmtDate(e.opensAt)}</span></li>)}</ul> : <p className="text-xs text-muted">Not used in any test yet.</p>}</section>
      </div>
      {confirm && <Dialog open onOpenChange={setConfirm} title="Delete this question bank?" desc={used.length ? `${used.length} tests use its questions; they keep them, but it can't be picked for new tests.` : 'It can’t be picked for new tests after this.'}
        footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { removeBank(bank.id); bankFiles.delete(bank.id); toast('Question bank deleted'); onClose(); }}>Delete bank</Button></>}><span /></Dialog>}
    </Dialog>
  );
}
