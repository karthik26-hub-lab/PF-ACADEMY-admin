import { motion } from 'framer-motion';
import { KeyRound, Mail, MoreHorizontal, Phone, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { HatchedBars, Ring } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, CardHeader, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger, EmptyState, Select, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { tempPassword, useStore, type FeeStatus, type StudentStatus } from '../lib/store';
import { fmtDate } from '../lib/utils';
import { FEE, STATUS } from './Students';

export function StudentDetail({ id }: { id: string }) {
  const { students, batches, exams, deleteStudent, updateStudent } = useStore();
  const [pw, setPw] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const s = students.find((x) => x.id === id);
  if (!s) {
    return <Page crumbs={[{ label: 'Students', href: href({ page: 'students' }) }, { label: 'Not found' }]}>
      <Card><EmptyState icon={User} title="Student not found" action={<a className={btn()} href={href({ page: 'students' })}>All students</a>}>They may have been removed.</EmptyState></Card>
    </Page>;
  }
  const b = batches.find((x) => x.id === s.batchId);
  const assigned = exams.filter((e) => e.batchIds.includes(s.batchId) && !e.draft);
  const labels = s.trend.map((_, i) => `T${i + 1}`);
  const batchAvg = (() => { const r = students.filter((x) => x.batchId === s.batchId && x.avgScore != null); return r.length ? Math.round(r.reduce((a, x) => a + (x.avgScore ?? 0), 0) / r.length) : 0; })();

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Students', href: href({ page: 'students' }) }, { label: s.name }]}
      actions={
        <DropdownMenu>
          <DropdownTrigger className={btn('secondary', 'icon')} aria-label="More actions"><MoreHorizontal /></DropdownTrigger>
          <DropdownContent>
            <DropdownItem onSelect={() => setPw(tempPassword())}><KeyRound /> Reset password</DropdownItem>
            <DropdownSeparator />
            <DropdownItem danger onSelect={() => setConfirm(true)}><Trash2 /> Remove student</DropdownItem>
          </DropdownContent>
        </DropdownMenu>
      }>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex flex-wrap items-center gap-5 rounded-2xl bg-panel p-6 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        <Avatar name={s.name} size="lg" className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap gap-2"><Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge><Badge tone={FEE[s.fee].tone}>Fee: {FEE[s.fee].label}</Badge></div>
          <h1 className="text-[26px] font-bold tracking-[-0.03em]">{s.name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            <span className="font-mono">{s.studentId}</span><span>{b?.course}</span>
            {s.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{s.phone}</span>}
            {s.email && <span className="flex items-center gap-1"><Mail className="size-3" />{s.email}</span>}
          </div>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1"><Ring value={s.progress} size={68} stroke={7} label="Learning progress" /><span className="text-2xs text-muted">Learning</span></div>
          <div className="flex flex-col items-center gap-1"><Ring value={s.avgScore ?? 0} size={68} stroke={7} tone="pop" label="Average score" /><span className="text-2xs text-muted">Avg score</span></div>
        </div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Enrolment" desc="Changes here apply everywhere this student appears" />
          <dl className="space-y-3 p-5 pt-2 text-sm">
            <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2"><dt className="text-muted">Batch</dt><dd><Select aria-label="Batch" value={s.batchId} onChange={(e) => { updateStudent(s.id, { batchId: e.target.value }); toast.success('Moved to the new batch'); }}>{batches.filter((x) => x.status === 'active' || x.id === s.batchId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></dd></div>
            <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2"><dt className="text-muted">Status</dt><dd><Select aria-label="Status" value={s.status} onChange={(e) => updateStudent(s.id, { status: e.target.value as StudentStatus })}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></Select></dd></div>
            <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2"><dt className="text-muted">Fee</dt><dd><Select aria-label="Fee status" value={s.fee} onChange={(e) => updateStudent(s.id, { fee: e.target.value as FeeStatus })}><option value="paid">Paid</option><option value="partial">Partly paid</option><option value="due">Due</option></Select></dd></div>
            {[['Roll number', s.roll], ['Login ID', <span key="l" className="font-mono">{s.loginId}</span>], ['Admitted', fmtDate(s.admissionDate)], ['Joined via', { manual: 'Added by academy', excel: 'Excel import', qr: 'Classroom QR code', code: 'Academy code' }[s.joinedVia]], ['Tests assigned', assigned.length]].map(([k, v]) => (
              <div key={k as string} className="grid grid-cols-[110px_minmax(0,1fr)] gap-2"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Examination performance" desc={`Last ${s.trend.length} tests · batch average ${batchAvg}%`} />
          <div className="p-5 pt-6">{s.trend.length > 1 ? <HatchedBars data={s.trend.map((v, i) => ({ label: labels[i], value: v, ghost: 100 }))} height={190} format={(v) => `${v}%`} highlight={s.trend.length - 1} /> : <EmptyState compact icon={User} title="No results yet">Scores appear after the first published result.</EmptyState>}</div>
        </Card>
      </div>

      <Dialog open={!!pw} onOpenChange={(v) => !v && setPw(null)} title="New temporary password" desc={`Share it with ${s.name}. They’ll choose their own password on next sign-in.`}
        footer={<Button variant="primary" onClick={() => setPw(null)}>Done</Button>}>
        <div className="rounded-2xl bg-subtle p-5 text-center font-mono text-xl tracking-wider">{pw}</div>
      </Dialog>
      <Dialog open={confirm} onOpenChange={setConfirm} title="Remove this student?" desc={`${s.name} loses access to the app and leaves ${b?.name ?? 'their batch'}.`}
        footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { deleteStudent(s.id); toast('Student removed'); navigate({ page: 'students' }); }}>Remove</Button></>} />
    </Page>
  );
}
