// Assessments · Scheduled tests and Submissions. One list of tests with an infographic header and the same
// filters as everywhere else (course, subject, chapter, type, status, search). The Submissions view swaps the
// columns and the header to who has / hasn't submitted and late uploads.
import { Download, FileText, Inbox, Plus, Radio, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Donut, Ring } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Badge, Button, Card, EmptyState, Input, Segmented, Select, StatusPill, Table, Td, Th, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { scriptsOf } from '../lib/scripts';
import { examStatus, POLICY, useStore, type Exam, type ExamStatus } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn, downloadCSV, fmtDateTime } from '../lib/utils';

const TABS: [('all' | ExamStatus), string][] = [['all', 'All'], ['live', 'Live'], ['scheduled', 'Scheduled'], ['draft', 'Drafts'], ['closed', 'Completed'], ['cancelled', 'Cancelled']];

/** The course a test belongs to: its own, else its first batch's. */
export function useTestCourse() {
  const { courses, batches } = useStore();
  return (e: Exam) => courses.find((c) => c.id === e.courseId) ?? courses.find((c) => c.name === batches.find((b) => b.id === e.batchIds[0])?.course);
}

/** Course toggle, subject, chapter, type and search — shared by tests, submissions, evaluation and results. */
export type TestFilters = { course: string; subject: string; chapter: string; kind: string; q: string };
export const NO_TEST_FILTERS: TestFilters = { course: 'all', subject: 'all', chapter: 'all', kind: 'all', q: '' };
export function TestFilterBar({ f, set, children }: { f: TestFilters; set: (p: Partial<TestFilters>) => void; children?: React.ReactNode }) {
  const courses = useStore((s) => s.courses);
  const course = courses.find((c) => c.id === f.course), subject = course?.subjects.find((s) => s.name === f.subject);
  const on = f.course !== 'all' || f.subject !== 'all' || f.chapter !== 'all' || f.kind !== 'all' || !!f.q;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented value={f.course} onChange={(v) => set({ course: v, subject: 'all', chapter: 'all' })} options={[{ value: 'all', label: 'All courses' }, ...courses.map((c) => ({ value: c.id, label: c.name.replace('CA ', '') }))]} />
      <Select aria-label="Subject" value={f.subject} disabled={!course} onChange={(e) => set({ subject: e.target.value, chapter: 'all' })} className="w-full sm:w-52"><option value="all">{course ? 'All subjects' : 'Pick a course for subjects'}</option>{course?.subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</Select>
      <Select aria-label="Chapter" value={f.chapter} disabled={!subject} onChange={(e) => set({ chapter: e.target.value })} className="w-full sm:w-52"><option value="all">{subject ? 'All chapters' : 'Pick a subject for chapters'}</option>{subject?.chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
      <Segmented value={f.kind} onChange={(v) => set({ kind: v })} options={[{ value: 'all', label: 'All types' }, { value: 'mcq', label: 'MCQ' }, { value: 'descriptive', label: 'Descriptive' }, { value: 'mixed', label: 'Mixed' }]} />
      <div className="relative w-full sm:w-56"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search tests" className="pl-10" aria-label="Search tests" /></div>
      {children}
      {on && <Button size="sm" variant="ghost" onClick={() => set(NO_TEST_FILTERS)}><X /> Clear</Button>}
    </div>
  );
}
export function useTestFilter(f: TestFilters) {
  const { exams } = useStore();
  const courseOf = useTestCourse();
  return exams.filter((e) => (f.course === 'all' || courseOf(e)?.id === f.course) && (f.subject === 'all' || e.subject === f.subject)
    && (f.chapter === 'all' || (e.chapterIds ?? []).includes(f.chapter)) && (f.kind === 'all' || e.kind === f.kind) && e.title.toLowerCase().includes(f.q.toLowerCase()));
}

export function Exams({ view = 'tests' }: { view?: 'tests' | 'submissions' }) {
  const { batches, students, banks, marking } = useStore();
  const preset = useUI.getState().examPreset;
  const [status, setStatus] = useState<'all' | ExamStatus>(preset.status as 'all' | ExamStatus);
  const [f, setF] = useState<TestFilters>({ ...NO_TEST_FILTERS, kind: preset.kind });
  useEffect(() => { useUI.getState().setExamPreset({ status: 'all', kind: 'all' }); }, []);
  const set = (p: Partial<TestFilters>) => setF((x) => ({ ...x, ...p }));
  const filtered = useTestFilter(f);
  // Per-test submission numbers (submitted, not submitted, late) from the scripts.
  const rows = useMemo(() => filtered.map((e) => {
    const sc = scriptsOf(e, students, banks, marking), sub = sc.filter((s) => s.submitted);
    return { e, st: examStatus(e), total: sc.length, sub: sub.length, late: sub.filter((s) => s.late).length, last: Math.max(0, ...sub.map((s) => s.at ?? 0)) };
  }), [filtered, students, banks, marking]);
  const shown = rows.filter((r) => status === 'all' || r.st === status);
  const count = (s: ExamStatus) => rows.filter((r) => r.st === s).length;
  const bname = (id: string) => batches.find((b) => b.id === id)?.name ?? '—';
  const create = <a href={href({ page: 'exam-new' })} className={btn('primary')}><Plus /> Create test</a>;
  const expected = rows.filter((r) => r.st === 'live' || r.st === 'closed').reduce((a, r) => a + r.total, 0), submitted = rows.reduce((a, r) => a + r.sub, 0), late = rows.reduce((a, r) => a + r.late, 0);
  const card = 'rounded-2xl bg-panel p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]';
  const isSub = view === 'submissions';

  return (
    <Page crumbs={[{ label: 'Assessments', href: href({ page: 'assessments' }) }, { label: isSub ? 'Submissions' : 'Scheduled tests' }]} actions={create}>
      <div className="mb-5"><h1 className="text-[28px] font-bold tracking-[-0.03em]">{isSub ? 'Submissions' : 'Scheduled tests'}</h1><p className="text-sm text-muted">{isSub ? 'Who has submitted, who hasn’t, and late uploads, test by test.' : 'Every test with its status: draft, scheduled, live, completed or cancelled.'}</p></div>

      {/* Infographic header */}
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className={cn(card, 'flex items-center gap-4')}>
          <Donut size={96} thickness={13} center={<span className="text-base">{rows.length}</span>} sub="tests" segments={[{ label: 'Live', value: count('live'), tone: 'pop' }, { label: 'Scheduled', value: count('scheduled'), tone: 'ink' }, { label: 'Completed', value: count('closed'), tone: 'hatch' }, { label: 'Drafts', value: count('draft') + count('cancelled'), tone: 'grey' }]} />
          <ul className="flex-1 space-y-1 text-xs">{([['Live', count('live'), 'bg-pop'], ['Scheduled', count('scheduled'), 'bg-fg'], ['Completed', count('closed'), 'hatch ring-1 ring-border-strong'], ['Drafts', count('draft'), 'bg-border-strong'], ['Cancelled', count('cancelled'), 'bg-bad']] as const).map(([l, n, c]) => (
            <li key={l} className="flex items-center gap-2"><i className={cn('size-2.5 rounded-full', c)} /><span className="flex-1 text-muted">{l}</span><b className="tnum">{n}</b></li>
          ))}</ul>
        </div>
        <div className={cn(card, 'flex items-center gap-4')}>
          <Ring value={expected ? (submitted / expected) * 100 : 0} size={88} stroke={10} tone="pop" label="Submitted share" />
          <div className="text-xs"><div className="text-muted">Answer sheets submitted</div><div className="tnum text-2xl font-bold leading-tight">{submitted.toLocaleString('en-IN')}</div><div className="text-muted">of {expected.toLocaleString('en-IN')} expected in live and completed tests</div></div>
        </div>
        <div className={cn(card, 'grid grid-cols-3 gap-2 text-center')}>
          {([[Radio, count('live'), 'Active now'], [Inbox, Math.max(0, expected - submitted), 'Not submitted'], [FileText, late, 'Late']] as const).map(([I, n, l]) => (
            <div key={l} className="flex flex-col items-center justify-center rounded-xl bg-subtle p-2"><I className="size-4 text-muted" /><div className="tnum mt-1 text-xl font-bold leading-tight">{n.toLocaleString('en-IN')}</div><div className="text-2xs text-muted">{l}</div></div>
          ))}
        </div>
      </div>

      <Card>
        <div className="space-y-2 border-b border-border p-3">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">{TABS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setStatus(k)} className={cn('h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold ring-1 ring-inset transition-colors', status === k ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg')}>{l} <span className="tnum opacity-60">{k === 'all' ? rows.length : count(k)}</span></button>
          ))}</div>
          <TestFilterBar f={f} set={set}>
            <Button className="sm:ml-auto" disabled={!shown.length} onClick={() => void downloadCSV(`${isSub ? 'submissions' : 'tests'}-${new Date().toISOString().slice(0, 10)}.csv`, [['Test', 'Subject', 'Type', 'Status', 'Batches', 'Opens', 'Closes', 'Max marks', 'Students', 'Submitted', 'Not submitted', 'Late', 'Results rule'],
              ...shown.map(({ e, st, total, sub, late: l }) => [e.title, e.subject, e.kind ?? '', st === 'closed' ? 'completed' : st, e.batchIds.map(bname).join('; '), e.mode === 'timed' ? fmtDateTime(e.opensAt) : 'Open practice', e.mode === 'timed' ? fmtDateTime(e.closesAt) : '', e.maxMarks ?? '', total, sub, total - sub, l, POLICY[e.policy].short])]).then((ok) => ok && toast.success(`Exported ${shown.length} tests`))}><Download /> Export</Button>
          </TestFilterBar>
        </div>
        {shown.length ? (
          <Table>
            <thead><tr><Th>Test</Th><Th>Status</Th>{isSub ? <><Th>Submitted</Th><Th className="text-right">Not submitted</Th><Th className="text-right">Late</Th><Th>Last upload</Th></> : <><Th>Batches</Th><Th>Window</Th><Th className="text-right">Marks · time</Th><Th className="text-right">Uploads</Th></>}</tr></thead>
            <tbody>{shown.map(({ e, st, total, sub, late: l, last }) => (
              <tr key={e.id} onClick={() => navigate({ page: 'exam', id: e.id })} className="cursor-pointer transition hover:bg-hover">
                <Td><a href={href({ page: 'exam', id: e.id })} onClick={(ev) => ev.stopPropagation()} className="font-medium hover:underline">{e.title}</a><div className="text-xs text-muted">{e.subject}{e.chapterIds?.length ? ` · ${e.chapterIds.length} chapter${e.chapterIds.length > 1 ? 's' : ''}` : ''} · {e.source === 'bank' ? 'Question bank' : 'Paper'}</div></Td>
                <Td><StatusPill status={st} /></Td>
                {isSub ? <>
                  <Td><span className="flex items-center gap-2"><span className="h-1.5 w-24 overflow-hidden rounded-full hatch"><span className="block h-full rounded-full bg-fg" style={{ width: `${total ? (sub / total) * 100 : 0}%` }} /></span><span className="tnum text-xs">{sub}/{total}</span></span></Td>
                  <Td className="tnum text-right">{st === 'scheduled' || st === 'draft' ? '—' : total - sub}</Td>
                  <Td className="tnum text-right">{l ? <Badge tone="warn">{l}</Badge> : '0'}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{last ? fmtDateTime(last) : '—'}</Td>
                </> : <>
                  <Td className="max-w-56 truncate text-muted">{e.studentIds?.length ? `${e.studentIds.length} students` : e.batchIds.map(bname).join(', ') || '—'}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{e.draft ? '—' : e.mode === 'timed' ? `${fmtDateTime(e.opensAt)} – ${fmtDateTime(e.closesAt)}` : <Badge>Open practice</Badge>}</Td>
                  <Td className="tnum whitespace-nowrap text-right text-xs">{e.maxMarks ?? '—'} m{e.duration ? ` · ${e.duration} min` : ''}</Td>
                  <Td className="tnum text-right">{sub}<span className="text-faint">/{total}</span></Td>
                </>}
              </tr>
            ))}</tbody>
          </Table>
        ) : <EmptyState icon={FileText} title="No tests match" action={create} />}
      </Card>
    </Page>
  );
}
