import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Inbox, Search, Upload, UserPlus, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Donut, Legend, Ring, Sparkline } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, EmptyState, Input, Segmented, Select, Table, Tabs, Td, Th } from '../components/ui';
import { href, navigate } from '../lib/router';
import { useStore, type FeeStatus, type Student, type StudentStatus } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn } from '../lib/utils';

export const FEE: Record<FeeStatus, { label: string; tone: 'pop' | 'warn' | 'bad' }> = { paid: { label: 'Paid', tone: 'pop' }, partial: { label: 'Partly paid', tone: 'warn' }, due: { label: 'Due', tone: 'bad' } };
export const STATUS: Record<StudentStatus, { label: string; tone: 'ink' | 'neutral' | 'bad' }> = { active: { label: 'Active', tone: 'ink' }, inactive: { label: 'Inactive', tone: 'neutral' }, suspended: { label: 'Suspended', tone: 'bad' } };
const PAGE = 25;

export function StudentTable({ students, hideBatch }: { students: Student[]; hideBatch?: boolean }) {
  const batches = useStore((s) => s.batches);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(students.length / PAGE));
  const p = Math.min(page, pages - 1);
  const rows = students.slice(p * PAGE, p * PAGE + PAGE);
  const bname = (id: string) => batches.find((b) => b.id === id)?.name ?? '—';
  return (
    <>
      <Table>
        <thead><tr><Th>Student</Th>{!hideBatch && <Th>Batch</Th>}<Th>Status</Th><Th>Fee</Th><Th>Learning</Th><Th className="text-right">Avg score</Th><Th className="hidden xl:table-cell">Trend</Th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="cursor-pointer transition-colors hover:bg-subtle/70" onClick={() => navigate({ page: 'student', id: s.id })}>
              <Td><span className="flex items-center gap-3"><Avatar name={s.name} /><span className="min-w-0"><a href={href({ page: 'student', id: s.id })} onClick={(e) => e.stopPropagation()} className="block truncate font-semibold hover:underline">{s.name}</a><span className="font-mono text-2xs text-muted">{s.studentId} · {s.roll}</span></span></span></Td>
              {!hideBatch && <Td className="max-w-56 truncate text-xs text-muted">{bname(s.batchId)}</Td>}
              <Td><Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge></Td>
              <Td><Badge tone={FEE[s.fee].tone}>{FEE[s.fee].label}</Badge></Td>
              <Td><span className="flex items-center gap-2"><span className="h-1.5 w-20 overflow-hidden rounded-full hatch"><span className="block h-full rounded-full bg-fg" style={{ width: `${s.progress}%` }} /></span><span className="tnum text-2xs text-muted">{s.progress}%</span></span></Td>
              <Td className="tnum text-right font-semibold">{s.avgScore == null ? '—' : `${s.avgScore}%`}</Td>
              <Td className="hidden w-32 xl:table-cell">{s.trend.length > 1 ? <Sparkline values={s.trend} className="h-7" tone={s.trend[s.trend.length - 1] >= s.trend[0] ? 'ink' : 'ink'} /> : <span className="text-2xs text-faint">—</span>}</Td>
            </tr>
          ))}
          {!rows.length && <tr><Td colSpan={7} className="h-24 text-center text-muted">No students match.</Td></tr>}
        </tbody>
      </Table>
      {students.length > PAGE && (
        <div className="flex items-center justify-between px-5 py-3 text-xs text-muted">
          <span className="tnum">{p * PAGE + 1}–{Math.min(students.length, (p + 1) * PAGE)} of {students.length.toLocaleString('en-IN')}</span>
          <div className="flex items-center gap-1">
            <Button size="icon" className="size-8" disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="Previous page"><ChevronLeft /></Button>
            <span className="tnum px-2">Page {p + 1} of {pages}</span>
            <Button size="icon" className="size-8" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="Next page"><ChevronRight /></Button>
          </div>
        </div>
      )}
    </>
  );
}

export function Students({ tab }: { tab: 'all' | 'requests' }) {
  const s = useStore();
  const open = useUI((u) => u.open);
  const preset = useUI((u) => u.studentPreset);
  const [q, setQ] = useState('');
  const [batch, setBatch] = useState(preset.batch);
  const [status, setStatus] = useState<'all' | StudentStatus>('all');
  const [fee, setFee] = useState(preset.fee);
  const shown = useMemo(() => s.students.filter((x) =>
    (batch === 'all' || x.batchId === batch) && (status === 'all' || x.status === status) && (fee === 'all' || x.fee === fee) &&
    (!q || `${x.name} ${x.roll} ${x.studentId} ${x.phone}`.toLowerCase().includes(q.toLowerCase()))), [s.students, batch, status, fee, q]);
  const feeCounts = (['paid', 'partial', 'due'] as const).map((k) => s.students.filter((x) => x.fee === k).length);
  const via = (['manual', 'excel', 'qr', 'code'] as const).map((k) => [k, s.students.filter((x) => x.joinedVia === k).length] as const);
  const active = s.students.filter((x) => x.status === 'active').length;
  const avgProgress = s.students.length ? Math.round(s.students.reduce((a, x) => a + x.progress, 0) / s.students.length) : 0;

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Students' }]}
      actions={<><Button onClick={() => open('import')}><Upload /> Import</Button><Button variant="primary" onClick={() => open('student')}><UserPlus /> Add students</Button></>}>
      <div className="mb-6"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Students</h1><p className="text-sm text-muted">One directory for the whole academy. Each student has a single record, shared with their batch.</p></div>

      {s.students.length > 0 && tab === 'all' && (
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <div><div className="text-xs text-muted">Active students</div><div className="tnum mt-1 text-[30px] font-bold tracking-tight">{active.toLocaleString('en-IN')}</div><div className="text-2xs text-muted">of {s.students.length.toLocaleString('en-IN')} enrolled · {avgProgress}% average learning progress</div></div>
            <Ring value={(active / s.students.length) * 100} size={72} stroke={8} tone="pop" label="Active share" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex items-center gap-5 rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <Donut size={96} thickness={13} center={<span className="text-base">{Math.round((feeCounts[0] / s.students.length) * 100)}%</span>} sub="paid" segments={[{ label: 'Paid', value: feeCounts[0], tone: 'pop' }, { label: 'Partly paid', value: feeCounts[1], tone: 'ink' }, { label: 'Due', value: feeCounts[2], tone: 'hatch' }]} />
            <div className="flex-1"><div className="mb-2 text-xs font-semibold">Fee status</div><Legend items={[{ label: 'Paid', tone: 'pop', value: feeCounts[0] }, { label: 'Partly paid', tone: 'ink', value: feeCounts[1] }, { label: 'Due', tone: 'hatch', value: feeCounts[2] }]} /></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <div className="mb-3 text-xs font-semibold">How students joined</div>
            <div className="space-y-2">{via.map(([k, n]) => (
              <div key={k} className="grid grid-cols-[72px_minmax(0,1fr)_40px] items-center gap-2 text-2xs">
                <span className="text-muted">{{ manual: 'Manual', excel: 'Excel', qr: 'QR code', code: 'Code' }[k]}</span>
                <span className="h-2 overflow-hidden rounded-full hatch"><motion.span className="block h-full rounded-full bg-fg" initial={{ width: 0 }} animate={{ width: `${(n / s.students.length) * 100}%` }} transition={{ duration: 0.8 }} /></span>
                <span className="tnum text-right font-semibold">{n}</span>
              </div>
            ))}</div>
          </motion.div>
        </div>
      )}

      <Card>
        <Tabs value={tab} onChange={(v) => navigate(v === 'all' ? { page: 'students' } : { page: 'join-requests' })}
          tabs={[{ value: 'all', label: 'All students', count: s.students.length }, { value: 'requests', label: 'Join requests', count: s.joinRequests.length }]} />
        {tab === 'all' ? (s.students.length ? (
          <>
            <div className="flex flex-wrap items-center gap-2 px-5 py-4">
              <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, ID, roll or phone" className="pl-10" aria-label="Search students" /></div>
              <Select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-56" aria-label="Batch"><option value="all">All batches</option>{s.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
              <Segmented value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }]} />
              <Select value={fee} onChange={(e) => setFee(e.target.value)} className="w-40" aria-label="Fee status"><option value="all">Any fee status</option><option value="paid">Paid</option><option value="partial">Partly paid</option><option value="due">Due</option></Select>
              <span className="tnum ml-auto text-xs text-muted">{shown.length.toLocaleString('en-IN')} shown</span>
            </div>
            <StudentTable key={`${batch}${status}${fee}${q}`} students={shown} />
          </>
        ) : (
          <EmptyState icon={Users} title="No students yet" action={<><Button onClick={() => open('import')}><Upload /> Import from Excel</Button><Button variant="primary" onClick={() => open('student')}><UserPlus /> Add students</Button></>}>Add them by hand, from Excel, with a classroom QR code, or with an academy code.</EmptyState>
        )) : <JoinRequests />}
      </Card>
    </Page>
  );
}

function JoinRequests() {
  const { joinRequests, batches, addStudent } = useStore();
  const [batchFor, setBatchFor] = useState<Record<string, string>>({});
  const [rollFor, setRollFor] = useState<Record<string, string>>({});
  const remove = (id: string) => useStore.setState((st) => ({ joinRequests: st.joinRequests.filter((j) => j.id !== id) }));
  if (!joinRequests.length) return <EmptyState icon={Inbox} title="No join requests">Students who join with the QR code or the academy code wait here for approval.</EmptyState>;
  const active = batches.filter((b) => b.status === 'active');
  return (
    <ul className="divide-y divide-border">
      {joinRequests.map((j) => {
        const b = batchFor[j.id] || active[0]?.id || '';
        const roll = rollFor[j.id] ?? '';
        return (
          <li key={j.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <Avatar name={j.name} />
            <div className="min-w-40 flex-1"><div className="font-semibold">{j.name}</div><div className="text-2xs text-muted">{j.phone}</div></div>
            <Select aria-label={`Batch for ${j.name}`} value={b} onChange={(e) => setBatchFor({ ...batchFor, [j.id]: e.target.value })} className="w-56">{active.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
            <Input aria-label={`Roll number for ${j.name}`} placeholder="Roll no." value={roll} onChange={(e) => setRollFor({ ...rollFor, [j.id]: e.target.value })} className={cn('w-32')} />
            <Button size="sm" onClick={() => { remove(j.id); toast('Request declined'); }}><X /> Decline</Button>
            <Button size="sm" variant="primary" disabled={!roll.trim()} onClick={() => {
              const r = addStudent({ name: j.name, roll: roll.trim(), batchId: b, phone: j.phone, email: '', joinedVia: 'code' });
              if ('error' in r) { toast.error(r.error); return; }
              remove(j.id); toast.success(`${j.name} approved`);
            }}><Check /> Approve</Button>
          </li>
        );
      })}
    </ul>
  );
}
