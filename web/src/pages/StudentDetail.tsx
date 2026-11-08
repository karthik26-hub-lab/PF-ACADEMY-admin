import { BarChart3, FileText, KeyRound, MoreHorizontal, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { Avatar, Button, Card, CardHeader, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger, EmptyState, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { tempPassword, useStore } from '../lib/store';
import { fmtDate } from '../lib/utils';

export function StudentDetail({ id }: { id: string }) {
  const { students, batches, exams, deleteStudent } = useStore();
  const [pw, setPw] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const s = students.find((x) => x.id === id);
  if (!s) {
    return <Page crumbs={[{ label: 'Students', href: href({ page: 'students' }) }, { label: 'Not found' }]}>
      <Card><EmptyState icon={User} title="Student not found" action={<a className={btn()} href={href({ page: 'students' })}>All students</a>}>They may have been removed.</EmptyState></Card>
    </Page>;
  }
  const b = batches.find((x) => x.id === s.batchId);
  const assigned = exams.filter((e) => e.batchIds.includes(s.batchId) && !e.draft).length;

  return (
    <Page crumbs={[{ label: 'Students', href: href({ page: 'students' }) }, { label: s.name }]}
      actions={
        <DropdownMenu>
          <DropdownTrigger className={btn('secondary', 'icon', 'size-7')} aria-label="More actions"><MoreHorizontal /></DropdownTrigger>
          <DropdownContent>
            <DropdownItem onSelect={() => setPw(tempPassword())}><KeyRound /> Reset password</DropdownItem>
            <DropdownSeparator />
            <DropdownItem danger onSelect={() => setConfirm(true)}><Trash2 /> Remove student</DropdownItem>
          </DropdownContent>
        </DropdownMenu>
      }>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={s.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-[-0.015em]">{s.name}</h1>
          <p className="text-sm text-muted">{s.roll} · {b?.name ?? 'No batch'}</p>
        </div>
        <Button size="sm" onClick={() => setPw(tempPassword())}><KeyRound /> Reset password</Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Details" />
          <dl className="space-y-3 p-4 text-sm">
            {[['Login ID', <span className="font-mono">{s.loginId}</span>], ['Batch', b?.name ?? '—'], ['Course', b?.course ?? '—'], ['Mobile', s.phone || '—'], ['Email', s.email || '—'], ['Added', fmtDate(s.createdAt)], ['Exams assigned', assigned]].map(([k, v]) => (
              <div key={k as string} className="grid grid-cols-[110px_minmax(0,1fr)] gap-2"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <div className="space-y-5 lg:col-span-2">
          <Card><CardHeader title="Performance" /><EmptyState compact icon={BarChart3} title="No results yet">Score trend, strong and weak topics, and the steps this student loses most appear after the first published result.</EmptyState></Card>
          <Card><CardHeader title="Exam history" /><EmptyState compact icon={FileText} title="No exams written">Each exam is listed with marks and where they were lost.</EmptyState></Card>
        </div>
      </div>

      <Dialog open={!!pw} onOpenChange={(v) => !v && setPw(null)} title="New temporary password" desc={`Share it with ${s.name}. They’ll choose their own password on next sign-in.`}
        footer={<Button variant="primary" onClick={() => setPw(null)}>Done</Button>}>
        <div className="rounded-md border border-border bg-subtle p-4 text-center font-mono text-lg tracking-wider">{pw}</div>
      </Dialog>
      <Dialog open={confirm} onOpenChange={setConfirm} title="Remove this student?" desc={`${s.name} loses access to the app. Their results are kept for your reports.`}
        footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { deleteStudent(s.id); toast('Student removed'); navigate({ page: 'students' }); }}>Remove</Button></>} />
    </Page>
  );
}
