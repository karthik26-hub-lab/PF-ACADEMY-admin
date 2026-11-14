// Reports · Attendance (brief C). Offline classes are marked by faculty; online joins are recorded by the app;
// recorded-course students show videos watched instead. Low attendance (under 75%) is listed for follow-up.
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HatchedBars } from '../../components/charts';
import { Avatar, Badge, Button, Input, Segmented, Table, Td, Th } from '../../components/ui';
import { MODE, attendanceOf, modeOf, videosWatched } from '../../lib/insights';
import { href } from '../../lib/router';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { Bars, Box, FilterBar, NO_FILTERS, ReportPage, Stat, useFiltered, type Filters } from './shared';

const LOW = 75, MIN_CLASSES = 3;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function Attendance() {
  const { events, batches, recorded } = useStore();
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const { students } = useFiltered(f);
  const [q, setQ] = useState(''), [only, setOnly] = useState<'low' | 'all'>('low'), [limit, setLimit] = useState(40);
  const videosIn = (batchId: string) => { const c = batches.find((b) => b.id === batchId)?.course; return recorded.filter((d) => d.course === c).reduce((a, d) => a + d.videos.length, 0) || 40; };
  const rows = useMemo(() => students.map((s) => {
    const a = attendanceOf(s, events), total = videosIn(s.batchId);
    const recordedMode = modeOf(s) === 'recorded';
    // Too few classes so far to judge: no rate.
    return { s, a, rate: recordedMode ? pct(videosWatched(s, total), total) : a.held >= MIN_CLASSES ? pct(a.present, a.held) : null, videos: recordedMode ? { watched: videosWatched(s, total), total } : null };
  }), [students, events, batches, recorded]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = rows.filter((r) => !r.videos && r.a.held);
  const sumRate = (list: typeof rows) => pct(list.reduce((x, r) => x + r.a.present, 0), list.reduce((x, r) => x + r.a.held, 0));
  const off = live.filter((r) => modeOf(r.s) === 'offline'), on = live.filter((r) => modeOf(r.s) === 'online'), rec = rows.filter((r) => r.videos);
  // Weekly trend over the last 6 weeks of classes.
  const weekOf = (date: string) => Math.floor((Date.now() - +new Date(date)) / (7 * 86400e3));
  const weeks = [5, 4, 3, 2, 1, 0].map((w) => { const m = live.flatMap((r) => r.a.marks.filter((x) => weekOf(x.e.date) === w)); return { label: w ? `${w}w ago` : 'This week', value: pct(m.filter((x) => x.present).length, m.length) }; });
  const batchRows = [...new Set(live.map((r) => r.s.batchId))].map((id) => ({ label: batches.find((b) => b.id === id)?.name ?? '', value: sumRate(live.filter((r) => r.s.batchId === id)) })).sort((a, b) => a.value - b.value);
  const low = rows.filter((r) => r.rate !== null && r.rate < LOW);
  const shown = (only === 'low' ? low : rows).filter((r) => `${r.s.name} ${r.s.studentId}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101));

  return (
    <ReportPage title="Attendance" desc="Live class attendance by batch and mode. Faculty mark offline classes; the app records online joins.">
      <FilterBar f={f} set={setF} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Overall attendance" value={`${sumRate(live)}%`} sub={`${live.reduce((a, r) => a + r.a.held, 0).toLocaleString('en-IN')} class seats`} />
        <Stat label={`${MODE.offline} classes`} value={`${sumRate(off)}%`} sub={`${off.length} students · marked by faculty`} />
        <Stat label={`${MODE.online} classes`} value={`${sumRate(on)}%`} sub={`${on.length} students · joins recorded by the app`} />
        <Stat label="Recorded videos watched" value={`${pct(rec.reduce((a, r) => a + r.videos!.watched, 0), rec.reduce((a, r) => a + r.videos!.total, 0))}%`} sub={`${rec.length} recorded-course students`} tone="pop" />
        <Stat label={`Below ${LOW}%`} value={low.length} sub="students to follow up" tone="bad" />
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Box title="Attendance by week" sub="Live classes, last 6 weeks"><HatchedBars data={weeks} height={160} format={(v) => `${v}%`} highlight={5} /></Box>
        <Box title="Batch-wise attendance" sub="Lowest first"><Bars rows={batchRows.slice(0, 8).map((r) => ({ ...r, tone: r.value < LOW ? 'bad' as const : undefined }))} format={(v) => `${v}%`} max={100} /></Box>
      </div>
      <Box title="Student-wise attendance" sub="Classes attended, or videos watched for recorded courses">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Segmented value={only} onChange={(v) => { setOnly(v); setLimit(40); }} options={[{ value: 'low', label: `Below ${LOW}% · ${low.length}` }, { value: 'all', label: `All · ${rows.length}` }]} />
          <div className="relative w-full sm:w-60"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or student ID" className="pl-10" aria-label="Search students" /></div>
        </div>
        <Table>
          <thead><tr><Th>Student</Th><Th>Mode</Th><Th className="text-right">Attended</Th><Th className="w-44">Rate</Th></tr></thead>
          <tbody>{shown.slice(0, limit).map((r) => (
            <tr key={r.s.id}>
              <Td><a href={href({ page: 'student', id: r.s.id })} className="flex items-center gap-2.5 hover:underline"><Avatar name={r.s.name} /><span><span className="block font-medium">{r.s.name}</span><span className="text-2xs text-muted">{batches.find((b) => b.id === r.s.batchId)?.name}</span></span></a></Td>
              <Td><Badge>{MODE[modeOf(r.s)]}</Badge></Td>
              <Td className="tnum text-right text-xs">{r.videos ? `${r.videos.watched}/${r.videos.total} videos` : `${r.a.present}/${r.a.held} classes`}</Td>
              <Td>{r.rate === null ? <span className="text-2xs text-muted">Too few classes yet</span> : <span className="flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full hatch"><span className={cn('block h-full rounded-full', r.rate < LOW ? 'bg-bad' : 'bg-fg')} style={{ width: `${r.rate}%` }} /></span><span className={cn('tnum w-9 text-right text-xs font-semibold', r.rate < LOW && 'text-bad')}>{r.rate}%</span></span>}</Td>
            </tr>
          ))}</tbody>
        </Table>
        {shown.length > limit && <div className="mt-3 text-center"><Button onClick={() => setLimit(limit + 40)}>Show more ({shown.length - limit} left)</Button></div>}
      </Box>
    </ReportPage>
  );
}
