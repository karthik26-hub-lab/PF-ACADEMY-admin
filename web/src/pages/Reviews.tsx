// Assessments · Evaluation. Every submitted script across tests: MCQs are marked automatically, descriptive
// answers get AI-suggested marks, and faculty review, change marks and leave comments. Filters as elsewhere.
import { ClipboardCheck, PenLine } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Donut } from '../components/charts';
import { Page } from '../components/layout/Page';
import { SCRIPT_STATUS, ScriptDialog } from '../components/ScriptDialog';
import { Avatar, Badge, Button, Card, EmptyState, Select, Table, Td, Th } from '../components/ui';
import { href } from '../lib/router';
import { scriptsOf, type Script } from '../lib/scripts';
import { examStatus, useStore } from '../lib/store';
import { cn, fmtDateTime } from '../lib/utils';
import { NO_TEST_FILTERS, TestFilterBar, useTestFilter, type TestFilters } from './Exams';

const TABS: [Script['status'] | 'all', string][] = [['flagged', 'Needs review'], ['ai', 'AI marked'], ['reviewed', 'Reviewed'], ['published', 'Published'], ['all', 'All']];

export function Reviews() {
  const { students, banks, marking } = useStore();
  const [f, setF] = useState<TestFilters>(NO_TEST_FILTERS);
  const [test, setTest] = useState('all'), [tab, setTab] = useState<Script['status'] | 'all'>('flagged'), [limit, setLimit] = useState(60);
  const [open, setOpen] = useState<Script | null>(null);
  const tests = useTestFilter(f).filter((e) => !e.draft && examStatus(e) !== 'scheduled');
  const all = useMemo(() => tests.filter((e) => test === 'all' || e.id === test).flatMap((e) => scriptsOf(e, students, banks, marking).filter((s) => s.submitted)), [tests, test, students, banks, marking]);
  const count = (s: Script['status']) => all.filter((x) => x.status === s).length;
  const shown = all.filter((s) => tab === 'all' || s.status === tab);
  const title = (id: string) => tests.find((e) => e.id === id)?.title ?? '';
  const card = 'rounded-2xl bg-panel p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]';
  return (
    <Page crumbs={[{ label: 'Assessments', href: href({ page: 'assessments' }) }, { label: 'Evaluation' }]}>
      <div className="mb-5"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Evaluation</h1><p className="text-sm text-muted">MCQs mark themselves. Descriptive answers get AI-suggested marks; faculty review, change marks and add comments.</p></div>
      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className={cn(card, 'flex items-center gap-4')}>
          <Donut size={92} thickness={13} center={<span className="text-base">{all.length}</span>} sub="scripts" segments={[{ label: 'Needs review', value: count('flagged'), tone: 'pop' }, { label: 'AI marked', value: count('ai'), tone: 'ink' }, { label: 'Reviewed', value: count('reviewed'), tone: 'hatch' }, { label: 'Published', value: count('published'), tone: 'grey' }]} />
          <ul className="flex-1 space-y-1 text-xs">{([['Needs review', 'flagged', 'bg-pop'], ['AI marked', 'ai', 'bg-fg'], ['Reviewed', 'reviewed', 'hatch ring-1 ring-border-strong'], ['Published', 'published', 'bg-border-strong']] as const).map(([l, k, c]) => (
            <li key={k}><button type="button" onClick={() => setTab(k)} className="flex w-full items-center gap-2 rounded-md px-1 hover:bg-subtle"><i className={cn('size-2.5 rounded-full', c)} /><span className="flex-1 text-left text-muted">{l}</span><b className="tnum">{count(k)}</b></button></li>
          ))}</ul>
        </div>
        <div className={card}><div className="text-xs text-muted">Marks changed by faculty</div><div className="tnum mt-1 text-2xl font-bold leading-tight">{all.filter((s) => s.history.some((h) => h.marks !== undefined)).length}</div><div className="text-2xs text-muted">Every change is recorded with who made it.</div></div>
        <div className={card}><div className="text-xs text-muted">Average AI vs final</div><div className="tnum mt-1 text-2xl font-bold leading-tight">{all.length ? (all.reduce((a, s) => a + s.marks - s.aiMarks, 0) / all.length).toFixed(1).replace('-0.0', '0.0') : '0'} <span className="text-sm font-normal text-muted">marks</span></div><div className="text-2xs text-muted">How far faculty moved AI marks, on average.</div></div>
      </div>
      <Card>
        <div className="space-y-2 border-b border-border p-3">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">{TABS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => { setTab(k); setLimit(60); }} className={cn('h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold ring-1 ring-inset transition-colors', tab === k ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg')}>{l} <span className="tnum opacity-60">{k === 'all' ? all.length : count(k)}</span></button>
          ))}</div>
          <TestFilterBar f={f} set={(p) => { setF((x) => ({ ...x, ...p })); setTest('all'); }}>
            <Select aria-label="Test" value={test} onChange={(e) => setTest(e.target.value)} className="w-full sm:w-56"><option value="all">All tests</option>{tests.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</Select>
          </TestFilterBar>
        </div>
        {shown.length ? (
          <Table>
            <thead><tr><Th>Student</Th><Th>Test</Th><Th>Submitted</Th><Th className="text-right">AI marks</Th><Th className="text-right">Final</Th><Th>Status</Th></tr></thead>
            <tbody>{shown.slice(0, limit).map((s) => (
              <tr key={s.key} onClick={() => setOpen(s)} className="cursor-pointer transition hover:bg-hover">
                <Td><span className="flex items-center gap-2.5"><Avatar name={s.student.name} /><span><span className="block font-medium">{s.student.name}</span><span className="font-mono text-2xs text-muted">{s.student.studentId}</span></span></span></Td>
                <Td className="max-w-56 truncate text-muted">{title(s.examId)}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{s.at ? fmtDateTime(s.at) : '—'}{s.late && <Badge tone="warn" className="ml-1.5">Late</Badge>}</Td>
                <Td className="tnum text-right text-muted">{s.aiMarks}</Td>
                <Td className="tnum text-right font-semibold">{s.marks}<span className="text-2xs font-normal text-muted">/{s.max}</span>{s.marks !== s.aiMarks && <PenLine className="ml-1 inline size-3 text-muted" />}</Td>
                <Td><Badge tone={SCRIPT_STATUS[s.status].tone}>{SCRIPT_STATUS[s.status].label}</Badge></Td>
              </tr>
            ))}</tbody>
          </Table>
        ) : <EmptyState icon={ClipboardCheck} title={tab === 'flagged' ? 'Nothing needs review' : 'No scripts here'}>Scripts arrive after students upload and the AI marks them.</EmptyState>}
        {shown.length > limit && <div className="p-3 text-center"><Button onClick={() => setLimit(limit + 60)}>Show more ({shown.length - limit} left)</Button></div>}
      </Card>
      {open && <ScriptDialog s={all.find((x) => x.key === open.key) ?? open} onClose={() => setOpen(null)} />}
    </Page>
  );
}
