import { FileText, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUI } from '../lib/ui-state';
import { Page } from '../components/layout/Page';
import { Badge, Card, EmptyState, Input, PageHeader, Segmented, StatusPill, Table, Td, Th, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { examStatus, POLICY, useStore, type ExamStatus } from '../lib/store';
import { fmtDateTime } from '../lib/utils';

export function Exams() {
  const { exams, batches, students } = useStore();
  const preset = useUI.getState().examPreset;
  const [filter, setFilter] = useState<'all' | ExamStatus>(preset.status as 'all' | ExamStatus);
  const [kind, setKind] = useState(preset.kind);
  useEffect(() => { useUI.getState().setExamPreset({ status: 'all', kind: 'all' }); }, []);
  const [q, setQ] = useState('');
  const rows = exams.map((e) => ({ e, st: examStatus(e) }));
  const shown = rows.filter((r) => (filter === 'all' || r.st === filter) && (kind === 'all' || r.e.kind === kind) && (!q || r.e.title.toLowerCase().includes(q.toLowerCase())));
  const count = (s: ExamStatus) => rows.filter((r) => r.st === s).length;
  const bname = (id: string) => batches.find((b) => b.id === id)?.name ?? '—';
  const create = <a href={href({ page: 'exam-new' })} className={btn('primary', 'sm')}><Plus /> Create exam</a>;

  return (
    <Page crumbs={[{ label: 'Assessments', href: href({ page: 'assessments' }) }, { label: 'Tests' }]} actions={create}>
      <PageHeader title="Exams" desc="Question papers, who writes them, when, and how results reach students." />
      {exams.length === 0 ? (
        <Card><EmptyState icon={FileText} title="No exams yet" action={create}>Upload the question paper as a Word file, choose the batches and timing, and decide how results are published.</EmptyState></Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <Segmented value={filter} onChange={setFilter} options={[
              { value: 'all', label: 'All', count: rows.length }, { value: 'live', label: 'Live', count: count('live') },
              { value: 'scheduled', label: 'Scheduled', count: count('scheduled') }, { value: 'draft', label: 'Drafts', count: count('draft') },
              { value: 'closed', label: 'Closed', count: count('closed') },
            ]} />
            <Segmented value={kind} onChange={setKind} options={[{ value: 'all', label: 'All types' }, { value: 'mcq', label: 'MCQ' }, { value: 'descriptive', label: 'Descriptive' }, { value: 'mixed', label: 'Mixed' }]} />
            <div className="relative ml-auto w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title" className="pl-10" aria-label="Filter exams" />
            </div>
          </div>
          <Table>
            <thead><tr><Th>Exam</Th><Th>Status</Th><Th>Batches</Th><Th>Window</Th><Th className="text-right">Uploads</Th><Th>Results</Th></tr></thead>
            <tbody>
              {shown.map(({ e, st }) => {
                const n = students.filter((s) => e.batchIds.includes(s.batchId)).length;
                return (
                  <tr key={e.id} onClick={() => navigate({ page: 'exam', id: e.id })} className="cursor-pointer transition hover:bg-hover">
                    <Td><a href={href({ page: 'exam', id: e.id })} onClick={(ev) => ev.stopPropagation()} className="font-medium hover:underline">{e.title}</a><div className="text-xs text-muted">{e.subject}</div></Td>
                    <Td><StatusPill status={st} /></Td>
                    <Td className="max-w-56 truncate text-muted">{e.batchIds.map(bname).join(', ') || '—'}</Td>
                    <Td className="whitespace-nowrap text-xs text-muted">{e.draft ? '—' : e.mode === 'timed' ? `${fmtDateTime(e.opensAt)} – ${fmtDateTime(e.closesAt)}` : <Badge>Open practice</Badge>}</Td>
                    <Td className="tnum text-right">{e.received}<span className="text-faint">/{n}</span></Td>
                    <Td className="whitespace-nowrap text-xs text-muted">{POLICY[e.policy].short}</Td>
                  </tr>
                );
              })}
              {!shown.length && <tr><Td colSpan={6} className="h-24 text-center text-muted">No exams match.</Td></tr>}
            </tbody>
          </Table>
        </Card>
      )}
    </Page>
  );
}
