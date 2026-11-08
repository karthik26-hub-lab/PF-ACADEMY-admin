import { Inbox, KeyRound, Layers, Search, Upload, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { Page } from '../components/layout/Page';
import { Avatar, Button, Card, EmptyState, Input, PageHeader, Select, Table, Tabs, Td, Th, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { useStore } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { fmtDate } from '../lib/utils';

export function Students({ tab }: { tab: 'all' | 'requests' }) {
  const { students, batches, joinRequests, academy } = useStore();
  const open = useUI((u) => u.open);
  const [q, setQ] = useState('');
  const [batch, setBatch] = useState('all');
  const shown = students.filter((s) => (batch === 'all' || s.batchId === batch) && (!q || `${s.name} ${s.roll}`.toLowerCase().includes(q.toLowerCase())));
  const bname = (id: string) => batches.find((b) => b.id === id)?.name ?? '—';

  const actions = (
    <>
      <Button size="sm" onClick={() => open('import')} disabled={!batches.length}><Upload /> Import</Button>
      <Button size="sm" variant="primary" onClick={() => open('student')}><UserPlus /> Add student</Button>
    </>
  );

  return (
    <Page crumbs={[{ label: 'Students' }]} actions={actions}>
      <PageHeader title="Students" desc="Create logins for students, or approve the ones who join with your academy code." />
      <Card>
        <Tabs value={tab} onChange={(v) => navigate(v === 'all' ? { page: 'students' } : { page: 'join-requests' })}
          tabs={[{ value: 'all', label: 'All students', count: students.length }, { value: 'requests', label: 'Join requests', count: joinRequests.length }]} />
        {tab === 'all' ? (
          students.length ? (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or roll number" className="pl-8" aria-label="Search students" />
                </div>
                <Select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-52" aria-label="Batch"><option value="all">All batches</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
                <span className="ml-auto text-xs text-muted">{shown.length} of {students.length}</span>
              </div>
              <Table>
                <thead><tr><Th>Name</Th><Th>Roll no.</Th><Th>Batch</Th><Th>Login ID</Th><Th>Added</Th></tr></thead>
                <tbody>
                  {shown.map((s) => (
                    <tr key={s.id} className="cursor-pointer transition hover:bg-hover" onClick={() => navigate({ page: 'student', id: s.id })}>
                      <Td><span className="flex items-center gap-2.5"><Avatar name={s.name} /><a href={href({ page: 'student', id: s.id })} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">{s.name}</a></span></Td>
                      <Td className="font-mono text-xs">{s.roll}</Td>
                      <Td className="text-muted">{bname(s.batchId)}</Td>
                      <Td className="font-mono text-xs text-muted">{s.loginId}</Td>
                      <Td className="text-xs text-muted">{fmtDate(s.createdAt)}</Td>
                    </tr>
                  ))}
                  {!shown.length && <tr><Td colSpan={5} className="h-24 text-center text-muted">No students match.</Td></tr>}
                </tbody>
              </Table>
            </>
          ) : batches.length ? (
            <EmptyState icon={Users} title="No students yet" action={<><Button size="sm" onClick={() => open('import')}><Upload /> Import from Excel</Button><Button size="sm" variant="primary" onClick={() => open('student')}><UserPlus /> Add student</Button></>}>
              Each student gets a login ID and a temporary password for the Parallax Flow app.
            </EmptyState>
          ) : (
            <EmptyState icon={Layers} title="Create a batch first" action={<Button size="sm" variant="primary" onClick={() => open('batch')}>New batch</Button>}>Every student belongs to a batch, and exams are given to batches.</EmptyState>
          )
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border bg-subtle/60 px-4 py-3 text-sm">
              <KeyRound className="size-4 shrink-0 text-muted" />
              {academy.code
                ? <span>Students join in the app with code <b className="font-mono font-medium">{academy.code}</b>. They see nothing until you approve them.</span>
                : <span className="text-muted">Create an academy code so students can join from the app.</span>}
              <a href={href({ page: 'settings', tab: 'access' })} className={btn('ghost', 'sm', 'ml-auto')}>{academy.code ? 'Manage' : 'Create code'}</a>
            </div>
            <EmptyState icon={Inbox} title="No join requests">Students who join with the academy code wait here for approval.</EmptyState>
          </>
        )}
      </Card>
    </Page>
  );
}
