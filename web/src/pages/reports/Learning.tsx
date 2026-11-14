// Reports · Learning analytics (brief B): materials accessed, chapters completed, time spent, MCQs attempted,
// accuracy, revision activity and consistency. Sample from each student's progress until the app sends activity.
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HatchedBars } from '../../components/charts';
import { Avatar, Badge, Button, Input, Segmented, Table, Td, Th } from '../../components/ui';
import { learningOf } from '../../lib/insights';
import { href } from '../../lib/router';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { Bars, Box, FilterBar, NO_FILTERS, ReportPage, Stat, useFiltered, type Filters } from './shared';

const hours = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

export function Learning() {
  const { courses, batches } = useStore();
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const { students } = useFiltered(f);
  const [q, setQ] = useState(''), [sort, setSort] = useState<'low' | 'high'>('low'), [limit, setLimit] = useState(40);
  const chaptersIn = (batchId: string) => { const c = courses.find((x) => x.name === batches.find((b) => b.id === batchId)?.course); return c?.subjects.reduce((a, s) => a + s.chapters.length, 0) ?? 30; };
  const rows = useMemo(() => students.map((s) => ({ s, l: learningOf(s, chaptersIn(s.batchId)) })), [students, courses, batches]); // eslint-disable-line react-hooks/exhaustive-deps
  const L = rows.map((r) => r.l);
  // Share of students active on each of the last 28 days.
  const daily = Array.from({ length: 28 }, (_, i) => Math.round((L.filter((l) => l.days[i]).length / Math.max(1, L.length)) * 100));
  const weeks = [0, 1, 2, 3].map((w) => ({ label: w === 3 ? 'This week' : `${3 - w}w ago`, value: avg(daily.slice(w * 7, w * 7 + 7)) }));
  const bands = [['Under 25%', 0, 25], ['25–50%', 25, 50], ['50–75%', 50, 75], ['75% and up', 75, 101]] as const;
  const shown = rows.filter((r) => `${r.s.name} ${r.s.studentId}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (sort === 'low' ? a.l.consistency - b.l.consistency : b.l.consistency - a.l.consistency));

  return (
    <ReportPage title="Learning analytics" desc="What students do in the app: materials, chapters, MCQs, revision and how regularly they study.">
      <FilterBar f={f} set={setF} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Materials accessed" value={avg(L.map((l) => l.materials))} sub="per student" />
        <Stat label="Chapters completed" value={`${avg(L.map((l) => (l.chapters / l.chaptersTotal) * 100))}%`} sub="of the course" />
        <Stat label="Time spent" value={hours(avg(L.map((l) => l.minutes)))} sub="per student, in the app" />
        <Stat label="MCQs attempted" value={L.reduce((a, l) => a + l.mcqs, 0).toLocaleString('en-IN')} sub={`${avg(L.map((l) => l.mcqs))} per student`} />
        <Stat label="Accuracy" value={`${avg(L.map((l) => l.accuracy))}%`} sub="on MCQs attempted" tone="pop" />
        <Stat label="Revision sessions" value={avg(L.map((l) => l.revisions))} sub="per student" />
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Box title="Learning consistency" sub="Share of students who studied each day, last 4 weeks">
          <div className="grid grid-cols-7 gap-1.5">{daily.map((v, i) => (
            <span key={i} title={`${v}% active`} className="flex aspect-square items-center justify-center rounded-lg text-[10px] font-semibold tabular-nums" style={{ background: `hsl(var(--fg) / ${0.08 + (v / 100) * 0.85})`, color: v > 55 ? 'hsl(var(--bg))' : undefined }}>{v}</span>
          ))}</div>
          <div className="mt-2 flex justify-between text-2xs text-muted"><span>4 weeks ago</span><span>Today</span></div>
        </Box>
        <Box title="Active days by week" sub="Average share of students active"><HatchedBars data={weeks} height={150} format={(v) => `${v}%`} highlight={3} /></Box>
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Box title="Chapters completed" sub="Students by how much of the course they've finished"><Bars rows={bands.map(([label, lo, hi]) => ({ label, value: L.filter((l) => { const p = (l.chapters / l.chaptersTotal) * 100; return p >= lo && p < hi; }).length }))} /></Box>
        <Box title="Consistency" sub="Students by days active in the last 4 weeks"><Bars rows={bands.map(([label, lo, hi], i) => ({ label, value: L.filter((l) => l.consistency >= lo && l.consistency < hi).length, tone: i === 0 ? 'bad' as const : i === 3 ? 'pop' as const : undefined }))} /></Box>
      </div>
      <Box title="Student-wise activity" sub="Least consistent first: they may need a nudge">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Segmented value={sort} onChange={setSort} options={[{ value: 'low', label: 'Least active first' }, { value: 'high', label: 'Most active first' }]} />
          <div className="relative w-full sm:w-60"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or student ID" className="pl-10" aria-label="Search students" /></div>
        </div>
        <Table>
          <thead><tr><Th>Student</Th><Th className="text-right">Materials</Th><Th className="text-right">Chapters</Th><Th className="text-right">Time</Th><Th className="text-right">MCQs</Th><Th className="text-right">Accuracy</Th><Th className="text-right">Revision</Th><Th>Consistency</Th></tr></thead>
          <tbody>{shown.slice(0, limit).map(({ s, l }) => (
            <tr key={s.id}>
              <Td><a href={href({ page: 'student-report', id: s.id, section: 'learning' })} className="flex items-center gap-2.5 hover:underline"><Avatar name={s.name} /><span><span className="block font-medium">{s.name}</span><span className="text-2xs text-muted">{batches.find((b) => b.id === s.batchId)?.name}</span></span></a></Td>
              <Td className="tnum text-right">{l.materials}</Td><Td className="tnum text-right">{l.chapters}/{l.chaptersTotal}</Td><Td className="tnum text-right">{hours(l.minutes)}</Td><Td className="tnum text-right">{l.mcqs}</Td><Td className="tnum text-right">{l.accuracy}%</Td><Td className="tnum text-right">{l.revisions}</Td>
              <Td><span className="flex items-center gap-2"><span className="flex gap-px">{l.days.slice(-14).map((d, i) => <i key={i} className={cn('h-3 w-1 rounded-full', d ? 'bg-fg' : 'bg-border')} />)}</span><Badge tone={l.consistency < 25 ? 'bad' : l.consistency >= 75 ? 'pop' : 'neutral'}>{l.consistency}%</Badge></span></Td>
            </tr>
          ))}</tbody>
        </Table>
        {shown.length > limit && <div className="mt-3 text-center"><Button onClick={() => setLimit(limit + 40)}>Show more ({shown.length - limit} left)</Button></div>}
      </Box>
    </ReportPage>
  );
}
