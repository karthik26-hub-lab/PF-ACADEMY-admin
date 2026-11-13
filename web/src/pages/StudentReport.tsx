// Reports → one student's report. The Learning and Avg score rings on the profile open the matching section here.
import { ExternalLink, User } from 'lucide-react';
import { useEffect } from 'react';
import { HatchedBars, Ring } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Avatar, Card, CardHeader, EmptyState, btn } from '../components/ui';
import { href } from '../lib/router';
import { useStore, type Course } from '../lib/store';
import { cn } from '../lib/utils';

// Papers per course, used for the sample subject breakdown.
const PAPERS: Record<Course, string[]> = {
  'CA Foundation': ['Accounting', 'Business Laws', 'Quantitative Aptitude', 'Business Economics'],
  'CA Inter': ['Advanced Accounting', 'Corporate & Other Laws', 'Taxation', 'Cost & Management Accounting', 'Auditing & Ethics', 'FM & Strategic Management'],
  'CA Final': ['Financial Reporting', 'Advanced Financial Management', 'Advanced Auditing', 'Direct Tax Laws', 'Indirect Tax Laws', 'Integrated Business Solutions'],
};
// Same student, same numbers: a small hash keeps the sample breakdown stable.
const spread = (seed: string, base: number, i: number) => { let h = 7; for (const ch of `${seed}:${i}`) h = Math.imul(h ^ ch.charCodeAt(0), 2654435761); return Math.max(5, Math.min(100, base + ((h >>> 0) % 31) - 15)); };

export function StudentReport({ id, section }: { id: string; section: 'learning' | 'scores' }) {
  const { students, batches } = useStore();
  const s = students.find((x) => x.id === id);
  useEffect(() => { document.getElementById(`report-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [section]);
  const crumbs = [{ label: 'Reports', href: href({ page: 'reports' }) }, { label: 'Students', href: href({ page: 'students' }) }];
  if (!s) return <Page crumbs={[...crumbs, { label: 'Not found' }]}><Card><EmptyState icon={User} title="Student not found">They may have been removed.</EmptyState></Card></Page>;

  const b = batches.find((x) => x.id === s.batchId);
  const papers = PAPERS[b?.course ?? 'CA Inter'];
  const mates = students.filter((x) => x.batchId === s.batchId && x.avgScore != null);
  const batchAvg = mates.length ? Math.round(mates.reduce((a, x) => a + (x.avgScore ?? 0), 0) / mates.length) : 0;
  const mcqs = s.activity.filter((a) => a.kind === 'mcq').length, tests = s.activity.filter((a) => a.kind === 'test').length;
  const on = (k: string) => cn('scroll-mt-24 transition-shadow', section === k && 'ring-2 ring-fg');

  return (
    <Page crumbs={[...crumbs, { label: s.name }]}>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <Avatar name={s.name} size="lg" className="size-12" />
        <div className="min-w-0 flex-1"><p className="text-xs text-muted">Student report</p><h1 className="text-[26px] font-bold tracking-[-0.03em]">{s.name}</h1><p className="text-xs text-muted"><span className="font-mono">{s.studentId}</span> · {b?.name ?? '—'}</p></div>
        <a href={href({ page: 'student', id: s.id })} className={btn('secondary')}><ExternalLink /> Open profile</a>
      </div>

      <div className="space-y-5">
        <Card id="report-learning" className={on('learning')}>
          <CardHeader title="Learning progress" desc={`Across ${papers.length} papers · ${mcqs} MCQ ${mcqs === 1 ? 'set' : 'sets'} and ${tests} ${tests === 1 ? 'test' : 'tests'} in recent activity`} />
          <div className="grid gap-6 p-5 pt-3 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
            <div className="flex flex-col items-center gap-1"><Ring value={s.progress} size={120} stroke={11} label="Learning progress" /><span className="text-xs text-muted">Overall</span></div>
            <ul className="space-y-2.5">{papers.map((p, i) => { const v = spread(s.id, s.progress, i); return (
              <li key={p} className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)_44px] items-center gap-3 text-xs">
                <span className="truncate text-muted">{p}</span>
                <span className="h-2 overflow-hidden rounded-full hatch"><span className="block h-full rounded-full bg-fg" style={{ width: `${v}%` }} /></span>
                <b className="tnum text-right">{v}%</b>
              </li>
            ); })}</ul>
          </div>
          <p className="px-5 pb-4 text-2xs text-faint">Sample breakdown. Real figures come from chapters and materials completed in the app.</p>
        </Card>

        <Card id="report-scores" className={on('scores')}>
          <CardHeader title="Examination performance" desc={`Last ${s.trend.length} tests · average ${s.avgScore ?? 0}% · batch average ${batchAvg}%`} />
          <div className="grid gap-6 p-5 pt-3 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
            <div className="flex flex-col items-center gap-1"><Ring value={s.avgScore ?? 0} size={120} stroke={11} tone="pop" label="Average score" /><span className="text-xs text-muted">Average score</span></div>
            {s.trend.length > 1
              ? <HatchedBars data={s.trend.map((v, i) => ({ label: `T${i + 1}`, value: v, ghost: 100 }))} height={190} format={(v) => `${v}%`} highlight={s.trend.length - 1} />
              : <EmptyState compact icon={User} title="No results yet">Scores appear after the first published result.</EmptyState>}
          </div>
        </Card>
      </div>
    </Page>
  );
}
