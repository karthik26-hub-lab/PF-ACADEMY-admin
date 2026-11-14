// Reports · Performance (brief A): student-wise performance, subject-wise marks, chapter-wise strengths and
// weaknesses, test history, improvement over time and batch comparisons. Built from the same scripts as Results.
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HatchedBars, Sparkline } from '../../components/charts';
import { Avatar, Badge, Button, Input, Table, Td, Th } from '../../components/ui';
import { partIndex } from '../../lib/banks';
import { href } from '../../lib/router';
import { PASS_PCT, scriptsOf } from '../../lib/scripts';
import { examStatus, useStore } from '../../lib/store';
import { cn, fmtDate } from '../../lib/utils';
import { Bars, Box, FilterBar, NO_FILTERS, ReportPage, Stat, lastMonths, monthIndex, useFiltered, type Filters } from './shared';

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

export function Performance() {
  const { exams, banks, marking, courses, batches, defaults } = useStore();
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const { students } = useFiltered(f);
  const [q, setQ] = useState(''), [limit, setLimit] = useState(40);
  const pass = defaults.passPct ?? PASS_PCT;

  // Every submitted script of completed tests, for the students in view.
  const data = useMemo(() => {
    const ids = new Set(students.map((s) => s.id)), idx = partIndex(banks);
    const tests = exams.filter((e) => examStatus(e) === 'closed').sort((a, b) => +new Date(b.closesAt) - +new Date(a.closesAt));
    return tests.map((e) => ({ e, scripts: scriptsOf(e, students, banks, marking).filter((s) => s.submitted && ids.has(s.student.id)) })).filter((t) => t.scripts.length)
      .map((t) => ({ ...t, avg: avg(t.scripts.map((s) => (s.marks / s.max) * 100)), passed: t.scripts.filter((s) => (s.marks / s.max) * 100 >= pass).length, idx }));
  }, [exams, students, banks, marking, pass]);
  const all = data.flatMap((t) => t.scripts.map((s) => ({ s, e: t.e, pct: (s.marks / s.max) * 100 })));

  const months = lastMonths(6), monthly = months.map((m, i) => ({ label: m.toLocaleString('en-IN', { month: 'short' }), value: avg(all.filter((x) => monthIndex(+new Date(x.e.closesAt), months) === i).map((x) => x.pct)) })).filter((x) => x.value);
  const subjects = [...new Set(data.map((t) => t.e.subject))].map((sub) => ({ label: sub, value: avg(all.filter((x) => x.e.subject === sub).map((x) => x.pct)) })).sort((a, b) => b.value - a.value);
  const batchRows = [...new Set(students.map((s) => s.batchId))].map((id) => ({ label: batches.find((b) => b.id === id)?.name ?? '', value: avg(all.filter((x) => x.s.student.batchId === id).map((x) => x.pct)) })).filter((r) => r.value).sort((a, b) => b.value - a.value);
  // Chapter-wise: average % on the questions from each chapter.
  const chapterName = new Map(courses.flatMap((c) => c.subjects.flatMap((s) => s.chapters.map((ch) => [ch.id, `${ch.name} · ${s.name}`] as const))));
  const byChapter = new Map<string, number[]>();
  data.forEach((t) => t.scripts.forEach((sc) => sc.perQuestion.forEach((p) => { const ch = t.idx.get(p.id)?.part.chapterId; if (ch && p.max) byChapter.set(ch, [...(byChapter.get(ch) ?? []), (p.marks / p.max) * 100]); })));
  const chapters = [...byChapter].filter(([, v]) => v.length >= 10).map(([id, v]) => ({ label: chapterName.get(id) ?? '', value: avg(v) })).sort((a, b) => b.value - a.value);
  const perStudent = students.map((s) => { const mine = all.filter((x) => x.s.student.id === s.id); return { s, tests: mine.length, avg: avg(mine.map((x) => x.pct)) }; }).filter((x) => x.tests).sort((a, b) => b.avg - a.avg);
  const improving = students.filter((s) => s.trend.length > 1 && s.trend[s.trend.length - 1] > s.trend[0]).length;
  const rows = perStudent.filter((x) => `${x.s.name} ${x.s.studentId}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <ReportPage title="Performance" desc="Marks and progress: by student, subject, chapter, test and batch.">
      <FilterBar f={f} set={setF} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Average score" value={`${avg(all.map((x) => x.pct))}%`} sub={`${all.length.toLocaleString('en-IN')} scripts marked`} />
        <Stat label="Pass rate" value={`${all.length ? Math.round((all.filter((x) => x.pct >= pass).length / all.length) * 100) : 0}%`} sub={`Pass mark ${pass}%`} tone="pop" />
        <Stat label="Tests completed" value={data.length} sub="With submissions from these students" />
        <Stat label="Improving" value={`${students.length ? Math.round((improving / students.length) * 100) : 0}%`} sub={`${improving} students scoring higher than they started`} />
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Box title="Improvement over time" sub="Average % in tests closed each month"><HatchedBars data={monthly} height={160} format={(v) => `${v}%`} highlight={monthly.length - 1} /></Box>
        <Box title="Batch-wise comparison" sub="Average %"><Bars rows={batchRows.slice(0, 8)} format={(v) => `${v}%`} max={100} /></Box>
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Box title="Subject-wise marks" sub="Average %"><Bars rows={subjects.slice(0, 8).map((x) => ({ ...x, tone: x.value < pass ? 'bad' : undefined }))} format={(v) => `${v}%`} max={100} /></Box>
        <Box title="Strongest chapters" sub="Highest average %"><Bars rows={chapters.slice(0, 6).map((x) => ({ ...x, tone: 'pop' }))} format={(v) => `${v}%`} max={100} /></Box>
        <Box title="Chapters to revise" sub="Lowest average %"><Bars rows={chapters.slice(-6).reverse().map((x) => ({ ...x, tone: x.value < pass ? 'bad' : undefined }))} format={(v) => `${v}%`} max={100} /></Box>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Box title="Student-wise performance" sub="Highest average first · open a student for their full report">
          <div className="relative mb-3 sm:w-60"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or student ID" className="pl-10" aria-label="Search students" /></div>
          <Table>
            <thead><tr><Th>Student</Th><Th className="text-right">Tests</Th><Th className="text-right">Average</Th><Th className="w-24">Trend</Th></tr></thead>
            <tbody>{rows.slice(0, limit).map(({ s, tests, avg: a }) => (
              <tr key={s.id}><Td><a href={href({ page: 'student-report', id: s.id, section: 'scores' })} className="flex items-center gap-2.5 hover:underline"><Avatar name={s.name} /><span><span className="block font-medium">{s.name}</span><span className="text-2xs text-muted">{batches.find((b) => b.id === s.batchId)?.name}</span></span></a></Td>
                <Td className="tnum text-right">{tests}</Td><Td className={cn('tnum text-right font-semibold', a < pass && 'text-bad')}>{a}%</Td><Td><Sparkline values={s.trend} className="h-6" /></Td></tr>
            ))}</tbody>
          </Table>
          {rows.length > limit && <div className="mt-3 text-center"><Button onClick={() => setLimit(limit + 40)}>Show more ({rows.length - limit} left)</Button></div>}
        </Box>
        <Box title="Test history" sub="Newest first">
          <ul className="divide-y divide-border">{data.slice(0, 15).map((t) => (
            <li key={t.e.id} className="flex items-center gap-3 py-2 text-sm"><span className="min-w-0 flex-1"><a href={href({ page: 'results', id: t.e.id })} className="block truncate font-medium hover:underline">{t.e.title}</a><span className="text-2xs text-muted">{t.e.subject} · {fmtDate(t.e.closesAt)} · {t.scripts.length} wrote</span></span>
              <Badge tone={t.avg < pass ? 'bad' : 'neutral'}>{t.avg}% avg</Badge><span className="tnum w-14 text-right text-2xs text-muted">{Math.round((t.passed / t.scripts.length) * 100)}% pass</span></li>
          ))}</ul>
        </Box>
      </div>
    </ReportPage>
  );
}
