import * as CM from '@radix-ui/react-context-menu';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Columns3, Copy, Download, ExternalLink, Inbox, Layers, Minus, Search, Trash2, Upload, UserCheck, UserPlus, UserX, Users, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { create } from 'zustand';
import { Donut, Legend, Ring, Sparkline } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger, EmptyState, Input, Segmented, Select, Table, Tabs, Td, Th, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { useStore, type Batch, type FeeStatus, type Student, type StudentStatus } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn, downloadCSV, fmtDate, prefs } from '../lib/utils';

export const FEE: Record<FeeStatus, { label: string; tone: 'pop' | 'warn' | 'bad' }> = { paid: { label: 'Paid', tone: 'pop' }, partial: { label: 'Partly paid', tone: 'warn' }, due: { label: 'Due', tone: 'bad' } };
export const STATUS: Record<StudentStatus, { label: string; tone: 'ink' | 'neutral' | 'bad' }> = { active: { label: 'Active', tone: 'ink' }, inactive: { label: 'Inactive', tone: 'neutral' }, suspended: { label: 'Suspended', tone: 'bad' } };
const PAGE = 25;

// ---------- Column choice, remembered per viewer ----------
const COLS = { batch: 'Batch', status: 'Status', fee: 'Fee', learning: 'Learning', avg: 'Avg score', trend: 'Trend', phone: 'Phone', admitted: 'Admission date' } as const;
type Col = keyof typeof COLS;
type ColState = Record<Col, boolean>;
const COLS_KEY = 'pf-student-cols';
const defaultCols: ColState = { batch: true, status: true, fee: true, learning: true, avg: true, trend: true, phone: false, admitted: false };
const useCols = create<{ cols: ColState; toggle: (c: Col) => void }>((set) => ({
  cols: prefs.get(COLS_KEY, defaultCols),
  toggle: (c) => set((s) => { const cols = { ...s.cols, [c]: !s.cols[c] }; prefs.set(COLS_KEY, cols); return { cols }; }),
}));

export function ColumnPicker() {
  const { cols, toggle } = useCols();
  return (
    <DropdownMenu>
      <DropdownTrigger className={btn('secondary', 'md')}><Columns3 /> Columns</DropdownTrigger>
      <DropdownContent className="w-52">
        <DropdownLabel>Show columns</DropdownLabel>
        {(Object.keys(COLS) as Col[]).map((c) => (
          <DropdownItem key={c} onSelect={(e?: Event) => { e?.preventDefault(); toggle(c); }}>
            <span className={cn('grid size-4 place-items-center rounded-[5px] border', cols[c] ? 'border-fg bg-fg text-bg' : 'border-border-strong')}>{cols[c] && <Check className="!size-3 !text-bg" strokeWidth={3} />}</span>{COLS[c]}
          </DropdownItem>
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}

// ---------- Export ----------
export function exportStudents(list: Student[], batches: Batch[], name = 'students') {
  const b = new Map(batches.map((x) => [x.id, x]));
  void downloadCSV(`${name}-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Student ID', 'Name', 'Roll no.', 'Batch', 'Course', 'Phone', 'Email', 'Login ID', 'Status', 'Fee', 'Learning %', 'Avg score %', 'Admission date'],
    ...list.map((s) => [s.studentId, s.name, s.roll, b.get(s.batchId)?.name ?? '', b.get(s.batchId)?.course ?? '', s.phone, s.email, s.loginId, STATUS[s.status].label, FEE[s.fee].label, s.progress, s.avgScore ?? '', s.admissionDate]),
  ]).then((ok) => ok && toast.success(`Exported ${list.length.toLocaleString('en-IN')} students`, { description: 'Opens in Excel or Google Sheets.' }));
}

// ---------- Remove with undo ----------
function removeWithUndo(ids: string[]) {
  const st = useStore.getState();
  const pick = new Set(ids);
  const removed = st.students.filter((x) => pick.has(x.id));
  st.removeStudents(ids);
  toast(removed.length === 1 ? `${removed[0].name} removed` : `${removed.length} students removed`, {
    action: { label: 'Undo', onClick: () => useStore.setState((s) => ({ students: [...removed, ...s.students].sort((a, b) => b.createdAt - a.createdAt) })) },
  });
}

const Tick = ({ state, onClick, label }: { state: boolean | 'some'; onClick: () => void; label: string }) => (
  <button type="button" role="checkbox" aria-checked={state === 'some' ? 'mixed' : state} aria-label={label} onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={cn('grid size-[18px] place-items-center rounded-[6px] border transition-colors duration-150', state ? 'border-fg bg-fg text-bg' : 'border-border-strong bg-panel hover:border-fg/50')}>
    {state === 'some' ? <Minus className="size-3" strokeWidth={3} /> : state ? <Check className="size-3" strokeWidth={3} /> : null}
  </button>
);

const menuItem = 'flex h-9 cursor-default select-none items-center gap-2 rounded-lg px-2.5 text-sm outline-none data-[highlighted]:bg-hover [&_svg]:size-4 [&_svg]:text-muted';
function RowMenu({ s, children }: { s: Student; children: ReactNode }) {
  const update = useStore((x) => x.updateStudent);
  const copy = (v: string, what: string) => { navigator.clipboard?.writeText(v).then(() => toast.success(`${what} copied`), () => toast.error('Copy is blocked here')); };
  return (
    <CM.Root>
      <CM.Trigger asChild>{children}</CM.Trigger>
      <CM.Portal>
        <CM.Content className="z-50 min-w-52 rounded-xl bg-panel p-1.5 shadow-float data-[state=open]:animate-menu-in">
          <CM.Label className="truncate px-2.5 pb-1 pt-1.5 text-2xs font-medium text-faint">{s.name} · {s.studentId}</CM.Label>
          <CM.Item className={menuItem} onSelect={() => navigate({ page: 'student', id: s.id })}><ExternalLink /> Open profile</CM.Item>
          <CM.Item className={menuItem} onSelect={() => copy(s.loginId, 'Login ID')}><Copy /> Copy login ID</CM.Item>
          <CM.Item className={menuItem} onSelect={() => copy(s.phone, 'Phone number')}><Copy /> Copy phone</CM.Item>
          <CM.Separator className="-mx-1 my-1 h-px bg-border" />
          {s.fee !== 'paid' && <CM.Item className={menuItem} onSelect={() => { update(s.id, { fee: 'paid' }); toast.success('Fee marked as paid'); }}><Wallet /> Mark fee paid</CM.Item>}
          {s.status === 'active'
            ? <CM.Item className={menuItem} onSelect={() => { update(s.id, { status: 'suspended' }); toast('Student suspended'); }}><UserX /> Suspend</CM.Item>
            : <CM.Item className={menuItem} onSelect={() => { update(s.id, { status: 'active' }); toast.success('Student is active again'); }}><UserCheck /> Make active</CM.Item>}
          <CM.Separator className="-mx-1 my-1 h-px bg-border" />
          <CM.Item className={cn(menuItem, 'text-bad [&_svg]:text-bad')} onSelect={() => removeWithUndo([s.id])}><Trash2 /> Remove student</CM.Item>
        </CM.Content>
      </CM.Portal>
    </CM.Root>
  );
}

function BulkBar({ ids, total, onSelectAll, onClear }: { ids: string[]; total: number; onSelectAll: () => void; onClear: () => void }) {
  const { batches, students, updateStudents } = useStore();
  const n = ids.length;
  const apply = (patch: Partial<Student>, msg: string) => { updateStudents(ids, patch); toast.success(msg); onClear(); };
  const chip = 'flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition hover:bg-bg/15 [&_svg]:size-4';
  return (
    <motion.div initial={{ opacity: 0, y: 24, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 24, x: '-50%' }} transition={{ type: 'spring', stiffness: 500, damping: 36 }}
      className="fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100vw-24px)] flex-wrap items-center gap-1 rounded-[22px] bg-fg p-1.5 pl-4 text-bg shadow-float">
      <span className="tnum pr-2 text-xs font-bold">{n.toLocaleString('en-IN')} selected</span>
      {n < total && <button onClick={onSelectAll} className="pr-2 text-xs underline underline-offset-2 opacity-80 hover:opacity-100">Select all {total.toLocaleString('en-IN')}</button>}
      <DropdownMenu>
        <DropdownTrigger className={chip}><Layers /> Move to batch</DropdownTrigger>
        <DropdownContent className="max-h-72 w-72 overflow-y-auto" align="start">
          {batches.filter((b) => b.status === 'active').map((b) => <DropdownItem key={b.id} onSelect={() => apply({ batchId: b.id }, `${n} moved to ${b.name}`)}>{b.name}</DropdownItem>)}
        </DropdownContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownTrigger className={chip}><Wallet /> Fee</DropdownTrigger>
        <DropdownContent align="start">{(Object.keys(FEE) as FeeStatus[]).map((f) => <DropdownItem key={f} onSelect={() => apply({ fee: f }, `Fee set to “${FEE[f].label}” for ${n}`)}>{FEE[f].label}</DropdownItem>)}</DropdownContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownTrigger className={chip}><UserCheck /> Status</DropdownTrigger>
        <DropdownContent align="start">{(Object.keys(STATUS) as StudentStatus[]).map((k) => <DropdownItem key={k} onSelect={() => apply({ status: k }, `${n} marked ${STATUS[k].label.toLowerCase()}`)}>{STATUS[k].label}</DropdownItem>)}</DropdownContent>
      </DropdownMenu>
      <button className={chip} onClick={() => { const pick = new Set(ids); exportStudents(students.filter((s) => pick.has(s.id)), batches, 'selected-students'); }}><Download /> Export</button>
      <DropdownMenu>
        <DropdownTrigger className={cn(chip, 'text-coral')}><Trash2 /> Remove</DropdownTrigger>
        <DropdownContent align="start">
          <DropdownLabel>Remove {n.toLocaleString('en-IN')} students?</DropdownLabel>
          <DropdownSeparator />
          <DropdownItem danger onSelect={() => { removeWithUndo(ids); onClear(); }}><Trash2 /> Yes, remove</DropdownItem>
        </DropdownContent>
      </DropdownMenu>
      <button onClick={onClear} aria-label="Clear selection" className="grid size-9 place-items-center rounded-full transition hover:bg-bg/15"><X className="size-4" /></button>
    </motion.div>
  );
}

export function StudentTable({ students, hideBatch }: { students: Student[]; hideBatch?: boolean }) {
  const batches = useStore((s) => s.batches);
  const { cols } = useCols();
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const pages = Math.max(1, Math.ceil(students.length / PAGE));
  const p = Math.min(page, pages - 1);
  const rows = students.slice(p * PAGE, p * PAGE + PAGE);
  const bmap = useMemo(() => new Map(batches.map((b) => [b.id, b.name])), [batches]);
  const show = (c: Col) => cols[c] && !(c === 'batch' && hideBatch);
  const ncols = 2 + (Object.keys(COLS) as Col[]).filter(show).length;
  // Drop selections for students that no longer exist (e.g. after removal).
  const ids = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const selected = [...sel].filter((id) => ids.has(id));
  const onPage = rows.filter((r) => sel.has(r.id)).length;
  const pageState: boolean | 'some' = onPage === 0 ? false : onPage === rows.length ? true : 'some';
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePage = () => setSel((s) => { const n = new Set(s); pageState === true ? rows.forEach((r) => n.delete(r.id)) : rows.forEach((r) => n.add(r.id)); return n; });

  return (
    <>
      <Table>
        <thead><tr>
          <Th className="w-10 pr-0"><Tick state={pageState} onClick={togglePage} label="Select all on this page" /></Th>
          <Th>Student</Th>
          {show('batch') && <Th>Batch</Th>}{show('phone') && <Th>Phone</Th>}{show('status') && <Th>Status</Th>}{show('fee') && <Th>Fee</Th>}
          {show('learning') && <Th>Learning</Th>}{show('avg') && <Th className="text-right">Avg score</Th>}{show('admitted') && <Th>Admitted</Th>}{show('trend') && <Th className="hidden xl:table-cell">Trend</Th>}
        </tr></thead>
        <tbody>
          {rows.map((s) => {
            const on = sel.has(s.id);
            return (
              <RowMenu key={s.id} s={s}>
                <tr className={cn('cursor-pointer transition-colors', on ? 'bg-subtle' : 'hover:bg-subtle/70')} onClick={() => navigate({ page: 'student', id: s.id })}>
                  <Td className="w-10 pr-0"><Tick state={on} onClick={() => toggle(s.id)} label={`Select ${s.name}`} /></Td>
                  <Td><span className="flex items-center gap-3"><Avatar name={s.name} /><span className="min-w-0"><a href={href({ page: 'student', id: s.id })} onClick={(e) => e.stopPropagation()} className="block truncate font-semibold hover:underline">{s.name}</a><span className="font-mono text-2xs text-muted">{s.studentId} · {s.roll}</span></span></span></Td>
                  {show('batch') && <Td className="max-w-56 truncate text-xs text-muted">{bmap.get(s.batchId) ?? '—'}</Td>}
                  {show('phone') && <Td className="tnum whitespace-nowrap text-xs text-muted">{s.phone}</Td>}
                  {show('status') && <Td><Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge></Td>}
                  {show('fee') && <Td><Badge tone={FEE[s.fee].tone}>{FEE[s.fee].label}</Badge></Td>}
                  {show('learning') && <Td><span className="flex items-center gap-2"><span className="h-1.5 w-20 overflow-hidden rounded-full hatch"><span className="block h-full rounded-full bg-fg" style={{ width: `${s.progress}%` }} /></span><span className="tnum text-2xs text-muted">{s.progress}%</span></span></Td>}
                  {show('avg') && <Td className="tnum text-right font-semibold">{s.avgScore == null ? '—' : `${s.avgScore}%`}</Td>}
                  {show('admitted') && <Td className="whitespace-nowrap text-xs text-muted">{fmtDate(s.admissionDate)}</Td>}
                  {show('trend') && <Td className="hidden w-32 xl:table-cell">{s.trend.length > 1 ? <Sparkline values={s.trend} className="h-7" /> : <span className="text-2xs text-faint">—</span>}</Td>}
                </tr>
              </RowMenu>
            );
          })}
          {!rows.length && <tr><Td colSpan={ncols} className="h-24 text-center text-muted">No students match.</Td></tr>}
        </tbody>
      </Table>
      {students.length > PAGE && (
        <div className="flex items-center justify-between px-5 py-3 text-xs text-muted">
          <span className="tnum">{(p * PAGE + 1).toLocaleString('en-IN')}–{Math.min(students.length, (p + 1) * PAGE).toLocaleString('en-IN')} of {students.length.toLocaleString('en-IN')}</span>
          <div className="flex items-center gap-1">
            <Button size="icon" className="size-8" disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="Previous page"><ChevronLeft /></Button>
            <span className="tnum px-2">Page {p + 1} of {pages}</span>
            <Button size="icon" className="size-8" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="Next page"><ChevronRight /></Button>
          </div>
        </div>
      )}
      <p className="hidden px-5 pb-3 text-2xs text-faint md:block">Tip: right-click a student for quick actions.</p>
      <AnimatePresence>
        {selected.length > 0 && <BulkBar ids={selected} total={students.length} onSelectAll={() => setSel(new Set(students.map((s) => s.id)))} onClear={() => setSel(new Set())} />}
      </AnimatePresence>
    </>
  );
}

// ---------- Directory page ----------
const FILTERS_KEY = 'pf-student-filters';
type Filters = { batch: string; status: 'all' | StudentStatus; fee: string };

export function Students({ tab }: { tab: 'all' | 'requests' }) {
  const s = useStore();
  const open = useUI((u) => u.open);
  // Filters are remembered; a link from the dashboard (e.g. "fees due") overrides them once.
  const [f, setF] = useState<Filters>(() => {
    const saved = prefs.get<Filters>(FILTERS_KEY, { batch: 'all', status: 'all', fee: 'all' });
    const preset = useUI.getState().studentPreset;
    return preset.batch !== 'all' || preset.fee !== 'all' ? { batch: preset.batch, status: 'all', fee: preset.fee } : saved;
  });
  useEffect(() => { useUI.getState().setStudentPreset({ batch: 'all', fee: 'all' }); }, []);
  useEffect(() => { prefs.set(FILTERS_KEY, f); }, [f]);
  const set = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }));
  const { batch, status, fee } = f;
  const [q, setQ] = useState('');
  const filtered = batch !== 'all' || status !== 'all' || fee !== 'all';
  const shown = useMemo(() => s.students.filter((x) =>
    (batch === 'all' || x.batchId === batch) && (status === 'all' || x.status === status) && (fee === 'all' || x.fee === fee) &&
    (!q || `${x.name} ${x.roll} ${x.studentId} ${x.phone}`.toLowerCase().includes(q.toLowerCase()))), [s.students, batch, status, fee, q]);
  const feeCounts = (['paid', 'partial', 'due'] as const).map((k) => s.students.filter((x) => x.fee === k).length);
  const via = (['manual', 'excel', 'qr', 'code'] as const).map((k) => [k, s.students.filter((x) => x.joinedVia === k).length] as const);
  const active = s.students.filter((x) => x.status === 'active').length;
  const avgProgress = s.students.length ? Math.round(s.students.reduce((a, x) => a + x.progress, 0) / s.students.length) : 0;
  const card = 'rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]';

  return (
    <Page screen="students" crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Students' }]}
      actions={<><Button onClick={() => open('import')}><Upload /> Import</Button><Button variant="primary" onClick={() => open('student')}><UserPlus /> Add students</Button></>}>
      <div className="mb-6"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Students</h1><p className="text-sm text-muted">One directory for the whole academy. Each student has a single record, shared with their batch.</p></div>

      {s.students.length > 0 && tab === 'all' && (
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn(card, 'flex items-center justify-between')}>
            <div><div className="text-xs text-muted">Active students</div><div className="tnum mt-1 text-[30px] font-bold leading-[1.1] tracking-tight">{active.toLocaleString('en-IN')}</div><div className="text-2xs text-muted">of {s.students.length.toLocaleString('en-IN')} enrolled · {avgProgress}% average learning progress</div></div>
            <Ring value={(active / s.students.length) * 100} size={72} stroke={8} tone="pop" label="Active share" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cn(card, 'flex items-center gap-5')}>
            <Donut size={96} thickness={13} center={<span className="text-base">{Math.round((feeCounts[0] / s.students.length) * 100)}%</span>} sub="paid" segments={[{ label: 'Paid', value: feeCounts[0], tone: 'pop' }, { label: 'Partly paid', value: feeCounts[1], tone: 'ink' }, { label: 'Due', value: feeCounts[2], tone: 'hatch' }]} />
            <div className="flex-1"><div className="mb-2 text-xs font-semibold">Fee status</div><Legend items={[{ label: 'Paid', tone: 'pop', value: feeCounts[0].toLocaleString('en-IN') }, { label: 'Partly paid', tone: 'ink', value: feeCounts[1].toLocaleString('en-IN') }, { label: 'Due', tone: 'hatch', value: feeCounts[2].toLocaleString('en-IN') }]} /></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
            <div className="mb-3 text-xs font-semibold">How students joined</div>
            <div className="space-y-2">{via.map(([k, n]) => (
              <div key={k} className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-2 text-2xs" title={`${n.toLocaleString('en-IN')} students`}>
                <span className="text-muted">{{ manual: 'Manual', excel: 'Excel', qr: 'QR code', code: 'Code' }[k]}</span>
                <span className="h-2 overflow-hidden rounded-full hatch"><motion.span className="block h-full rounded-full bg-fg" initial={{ width: 0 }} animate={{ width: `${(n / s.students.length) * 100}%` }} transition={{ duration: 0.8 }} /></span>
                <span className="tnum text-right font-semibold">{n.toLocaleString('en-IN')}</span>
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
              <Select value={batch} onChange={(e) => set({ batch: e.target.value })} className="w-56" aria-label="Batch"><option value="all">All batches</option>{s.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
              <Segmented value={status} onChange={(v) => set({ status: v })} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }]} />
              <Select value={fee} onChange={(e) => set({ fee: e.target.value })} className="w-40" aria-label="Fee status"><option value="all">Any fee status</option><option value="paid">Paid</option><option value="partial">Partly paid</option><option value="due">Due</option></Select>
              {filtered && <Button variant="ghost" size="sm" onClick={() => setF({ batch: 'all', status: 'all', fee: 'all' })}><X /> Clear filters</Button>}
              <span className="tnum ml-auto text-xs text-muted">{shown.length.toLocaleString('en-IN')} shown</span>
              <ColumnPicker />
              <Button onClick={() => exportStudents(shown, s.batches)} disabled={!shown.length}><Download /> Export</Button>
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
