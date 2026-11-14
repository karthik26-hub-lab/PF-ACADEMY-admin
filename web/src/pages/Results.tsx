// Assessments · Results. Pick a completed test (filters as elsewhere): highest, average, pass % (40%),
// marks spread, academy and batch ranks, question-wise and subject-wise performance, publish and download.
import { Download, Send, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { celebrate } from '../components/Celebrate';
import { HatchedBars } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, EmptyState, Input, Select, Table, Td, Th } from '../components/ui';
import { QTYPE, groupsOf, partLabel } from '../lib/banks';
import { href } from '../lib/router';
import { PASS_PCT, ranked, scriptsOf } from '../lib/scripts';
import { examStatus, useStore } from '../lib/store';
import { cn, downloadCSV, fmtDate } from '../lib/utils';
import { NO_TEST_FILTERS, TestFilterBar, useTestCourse, useTestFilter, type TestFilters } from './Exams';

export function Results({ id }: { id?: string }) {
  const { exams, students, banks, marking, batches, courses, defaults, updateExam } = useStore();
  const pass = defaults.passPct ?? PASS_PCT;
  const courseOf = useTestCourse();
  const [f, setF] = useState<TestFilters>(NO_TEST_FILTERS);
  const done = useTestFilter(f).filter((e) => examStatus(e) === 'closed' && e.received > 0).sort((a, b) => +new Date(b.closesAt) - +new Date(a.closesAt));
  const [pick, setPick] = useState(id ?? '');
  const e = exams.find((x) => x.id === pick) ?? done[0];
  const [batch, setBatch] = useState('all'), [q, setQ] = useState('');
  const scripts = useMemo(() => (e ? scriptsOf(e, students, banks, marking).filter((s) => s.submitted) : []), [e, students, banks, marking]);
  const academy = useMemo(() => ranked(scripts), [scripts]);
  // Batch rank: rank within the student's own batch.
  const batchRank = useMemo(() => { const m = new Map<string, number>(); [...new Set(scripts.map((s) => s.student.batchId))].forEach((b) => ranked(scripts.filter((s) => s.student.batchId === b)).forEach((r) => m.set(r.key, r.rank))); return m; }, [scripts]);
  const course = e ? courseOf(e) : undefined;
  // Subject-wise: average % across completed tests of this course.
  const subjects = useMemo(() => (course?.subjects ?? []).map((sub) => {
    const tests = exams.filter((x) => x.subject === sub.name && examStatus(x) === 'closed' && courseOf(x)?.id === course?.id);
    const all = tests.flatMap((x) => scriptsOf(x, students, banks, marking).filter((s) => s.submitted));
    return { label: sub.name, value: all.length ? Math.round(all.reduce((a, s) => a + (s.marks / s.max) * 100, 0) / all.length) : 0, tests: tests.length };
  }).filter((x) => x.tests), [course, exams, students, banks, marking, courseOf]);

  if (!e) return <Page crumbs={[{ label: 'Assessments', href: href({ page: 'assessments' }) }, { label: 'Results' }]}><Card><EmptyState icon={Trophy} title="No completed tests yet">Results appear once a test closes and scripts are marked.</EmptyState></Card></Page>;
  const max = scripts[0]?.max ?? e.maxMarks ?? 100, marks = scripts.map((s) => s.marks);
  const avg = marks.length ? marks.reduce((a, b) => a + b, 0) / marks.length : 0, passed = scripts.filter((s) => (s.marks / s.max) * 100 >= pass).length;
  const spread = Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}–${i * 10 + 9}`, value: scripts.filter((s) => Math.min(9, Math.floor((s.marks / s.max) * 10)) === i).length }));
  const qWise = groupsOf(banks, e.partIds ?? []).flatMap((g) => g.parts.map((p) => { const got = scripts.map((s) => s.perQuestion.find((x) => x.id === p.id)); return { label: partLabel(g, p), value: got.length ? Math.round(got.reduce((a, x) => a + (x ? x.marks / x.max : 0), 0) / got.length * 100) : 0, text: p.text, type: g.q.type }; }));
  const rows = academy.filter((s) => (batch === 'all' || s.student.batchId === batch) && `${s.student.name} ${s.student.studentId}`.toLowerCase().includes(q.toLowerCase()));
  const bname = (b: string) => batches.find((x) => x.id === b)?.name ?? '—';
  const unpublished = e.received - e.published;
  const tile = 'rounded-2xl bg-panel p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]';
  const download = () => void downloadCSV(`results-${e.title.replace(/\W+/g, '-')}.csv`, [['Academy rank', 'Batch rank', 'Student ID', 'Student', 'Batch', 'Marks', 'Out of', '%', 'Result'],
    ...academy.map((s) => [s.rank, batchRank.get(s.key) ?? '', s.student.studentId, s.student.name, bname(s.student.batchId), s.marks, s.max, Math.round((s.marks / s.max) * 100), (s.marks / s.max) * 100 >= pass ? 'Pass' : 'Fail'])]).then((ok) => ok && toast.success('Results downloaded'));

  return (
    <Page crumbs={[{ label: 'Assessments', href: href({ page: 'assessments' }) }, { label: 'Results' }]}
      actions={<>{unpublished > 0 && <Button variant="primary" onClick={() => { updateExam(e.id, { published: e.received }); celebrate('Results published', { description: `${e.received} students can now see their marks for ${e.title}.` }); }}><Send /> Publish {unpublished} results</Button>}<Button onClick={download}><Download /> Download</Button></>}>
      <div className="mb-4"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Results</h1><p className="text-sm text-muted">Marks, rankings and performance for each completed test. Pass mark {pass}%.</p></div>
      <div className="mb-4 space-y-2">
        <TestFilterBar f={f} set={(p) => { setF((x) => ({ ...x, ...p })); setPick(''); }} />
        <Select aria-label="Test" value={e.id} onChange={(ev) => setPick(ev.target.value)} className="w-full sm:w-96">{(done.some((x) => x.id === e.id) ? done : [e, ...done]).map((x) => <option key={x.id} value={x.id}>{x.title} · {x.subject} · {fmtDate(x.closesAt)}</option>)}</Select>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {([['Submitted', `${scripts.length}`, `of ${scriptsOf(e, students, banks, marking).length} students`], ['Highest', `${Math.max(0, ...marks)}`, `out of ${max}`], ['Average', avg.toFixed(1), `${Math.round((avg / max) * 100)}%`], ['Lowest', `${marks.length ? Math.min(...marks) : 0}`, `out of ${max}`], ['Pass percentage', `${scripts.length ? Math.round((passed / scripts.length) * 100) : 0}%`, `${passed} passed at ${pass}%`]] as const).map(([k, v, s]) => (
          <div key={k} className={tile}><div className="text-xs text-muted">{k}</div><div className="tnum mt-1 text-2xl font-bold leading-tight">{v}</div><div className="text-2xs text-muted">{s}</div></div>
        ))}
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-4"><div className="mb-3 text-xs font-semibold">Marks spread (%)</div><HatchedBars data={spread} height={150} highlight={spread.reduce((m, x, i, a) => (x.value > a[m].value ? i : m), 0)} /></Card>
        {qWise.length > 0 ? (
          <Card className="p-4"><div className="mb-3 text-xs font-semibold">Question-wise performance (average %)</div>
            <ul className="space-y-1.5">{qWise.map((x) => (
              <li key={x.label} className="grid grid-cols-[48px_minmax(0,1fr)_40px] items-center gap-2 text-2xs" title={x.text}>
                <b>{x.label}</b><span className="relative h-2 overflow-hidden rounded-full hatch"><span className={cn('block h-full rounded-full', x.value < pass ? 'bg-bad' : 'bg-fg')} style={{ width: `${x.value}%` }} /></span><span className="tnum text-right">{x.value}%</span>
              </li>
            ))}</ul>
            <p className="mt-2 text-2xs text-muted">Red bars are below the pass mark: worth revising in class. {qWise[0] && `Q1 is ${QTYPE[qWise[0].type]}.`}</p>
          </Card>
        ) : <Card className="p-4"><div className="text-xs font-semibold">Question-wise performance</div><p className="mt-2 text-xs text-muted">Available for tests built from the question bank. This one used an uploaded paper.</p></Card>}
      </div>

      {subjects.length > 0 && (
        <Card className="mb-5 p-4"><div className="mb-3 text-xs font-semibold">Subject-wise performance · {course?.name} (average % across completed tests)</div>
          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">{subjects.map((x) => (
            <div key={x.label} className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)_40px] items-center gap-2 text-2xs"><span className="truncate text-muted">{x.label}</span><span className="h-2 overflow-hidden rounded-full hatch"><span className={cn('block h-full rounded-full', x.value === Math.max(...subjects.map((y) => y.value)) ? 'bg-pop' : 'bg-fg')} style={{ width: `${x.value}%` }} /></span><b className="tnum text-right">{x.value}%</b></div>
          ))}</div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <span className="mr-auto text-sm font-semibold">Ranking</span>
          <Select aria-label="Batch" value={batch} onChange={(ev) => setBatch(ev.target.value)} className="w-full sm:w-60"><option value="all">Whole academy</option>{[...new Set(scripts.map((s) => s.student.batchId))].map((b) => <option key={b} value={b}>{bname(b)}</option>)}</Select>
          <Input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Search name or student ID" className="w-full sm:w-56" aria-label="Search students" />
        </div>
        <Table>
          <thead><tr><Th className="w-16">Rank</Th><Th className="w-20">In batch</Th><Th>Student</Th><Th>Batch</Th><Th className="text-right">Marks</Th><Th className="text-right">%</Th><Th>Result</Th></tr></thead>
          <tbody>{rows.slice(0, 100).map((s) => { const pct = Math.round((s.marks / s.max) * 100); return (
            <tr key={s.key}>
              <Td className="tnum font-bold">{s.rank <= 3 ? ['🥇', '🥈', '🥉'][s.rank - 1] : s.rank}</Td><Td className="tnum text-muted">{batchRank.get(s.key)}</Td>
              <Td><span className="flex items-center gap-2.5"><Avatar name={s.student.name} /><span><span className="block font-medium">{s.student.name}</span><span className="font-mono text-2xs text-muted">{s.student.studentId}</span></span></span></Td>
              <Td className="max-w-48 truncate text-muted">{bname(s.student.batchId)}</Td>
              <Td className="tnum text-right font-semibold">{s.marks}<span className="text-2xs font-normal text-muted">/{s.max}</span></Td>
              <Td className="tnum text-right">{pct}%</Td>
              <Td><Badge tone={pct >= pass ? 'pop' : 'bad'}>{pct >= pass ? 'Pass' : 'Fail'}</Badge></Td>
            </tr>
          ); })}</tbody>
        </Table>
        {rows.length > 100 && <p className="p-3 text-center text-2xs text-muted">Showing the top 100 of {rows.length}. Download for the full list.</p>}
      </Card>
      <p className="mt-3 text-2xs text-faint">{course?.name} · {courses.length} courses · sample marks until the server sends real scripts.</p>
    </Page>
  );
}
