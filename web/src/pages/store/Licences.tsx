// Explore Store · Licences & access: allocate, revoke, and the three views from the Store Map.
import { Check, ChevronDown, UserMinus, UserPlus } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Dialog, EmptyState, Field, Input, Progress, Segmented, Select, Table, Td, Th } from '../../components/ui';
import { navigate } from '../../lib/router';
import { allocState, current, licenceStatus, useShop, type Licence } from '../../lib/shop';
import { useStore, type Course } from '../../lib/store';
import { cn, fmtDate } from '../../lib/utils';
import { CourseToggle, SearchBox, useStudentLookup, type CourseFilter } from './shared';

const daysLeft = (l: Licence) => Math.max(0, Math.ceil((l.expiresAt - Date.now()) / 86400e3));

export function Licences() {
  const { licences, catalog } = useShop();
  const [act, setAct] = useState<{ mode: 'allocate' | 'revoke'; id: string } | null>(null);
  const [view, setView] = useState<'allocated' | 'history' | 'cycles'>('allocated');
  const [course, setCourse] = useState<CourseFilter>('all');
  const product = (l: Licence) => catalog.find((p) => p.id === l.productId)!;
  const name = (l: Licence) => product(l).title;
  const list = licences.filter((l) => course === 'all' || product(l).course === course);
  if (!licences.length) return <EmptyState icon={UserPlus} title="No licences yet" action={<Button variant="primary" onClick={() => navigate({ page: 'store', tab: 'catalogue' })}>Browse the store</Button>}>Buy a product for a number of students, then allocate it here.</EmptyState>;
  return (
    <div className="space-y-6">
      <CourseToggle value={course} onChange={setCourse} />
      {!list.length && <p className="rounded-2xl bg-subtle p-6 text-center text-sm text-muted">No licences for {course} yet.</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((l) => {
          const c = current(l), active = Object.keys(l.active).length;
          return (
            <article key={l.id} className="rounded-2xl bg-subtle p-4 ring-1 ring-inset ring-border">
              <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{name(l)}</h3><Badge tone={licenceStatus(l) === 'Active' ? 'pop' : 'neutral'}>{licenceStatus(l)}</Badge></div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                {[['Purchased capacity', `${l.capacity} students`], ['Allocation cycle', `${c.n} of ${l.maxCycles}`], ['This cycle', `${c.students.length} / ${l.capacity} unique`], ['Active seats', `${active} / ${l.capacity}`], ['Valid till', fmtDate(l.expiresAt)], ['Days left', daysLeft(l)]].map(([k, v]) => (
                  <div key={k as string}><dt className="text-muted">{k}</dt><dd className="tnum font-semibold">{v}</dd></div>
                ))}
              </dl>
              <Progress value={(c.students.length / l.capacity) * 100} className="mt-3" />
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="primary" disabled={!allocState(l).can} onClick={() => setAct({ mode: 'allocate', id: l.id })}><UserPlus /> Allocate students</Button>
                <Button size="sm" disabled={!active} onClick={() => setAct({ mode: 'revoke', id: l.id })}><UserMinus /> Revoke access</Button>
              </div>
              {!allocState(l).can && <p className="mt-2 text-2xs text-warn">{allocState(l).note}</p>}
            </article>
          );
        })}
      </div>
      {list.length > 0 && <section>
        <Segmented value={view} onChange={setView} options={[{ value: 'allocated', label: 'Allocated students' }, { value: 'history', label: 'Allocation history' }, { value: 'cycles', label: 'Cycle-wise usage' }]} />
        <div className="mt-4">{view === 'allocated' ? <Allocated key={course} list={list} course={course} /> : view === 'history' ? <History key={course} list={list} course={course} /> : <Cycles key={course} list={list} course={course} />}</div>
      </section>}
      {act && <AccessDialog mode={act.mode} licenceId={act.id} onClose={() => setAct(null)} />}
    </div>
  );
}

/** Product + batch filters shared by the views. */
type ViewProps = { list: Licence[]; course: CourseFilter };
function useFilters({ list: licences, course }: ViewProps) {
  const { catalog } = useShop();
  const batches = useStore((s) => s.batches).filter((b) => course === 'all' || b.course === course);
  const [lic, setLic] = useState(licences[0]?.id ?? '');
  const [batch, setBatch] = useState('all');
  const l = licences.find((x) => x.id === lic) ?? licences[0];
  const bar = (extra?: React.ReactNode) => (
    <div className="mb-3 flex flex-wrap gap-2">
      <Select aria-label="Product" value={l.id} onChange={(e) => setLic(e.target.value)} className="w-full sm:w-64">{licences.map((x) => <option key={x.id} value={x.id}>{catalog.find((p) => p.id === x.productId)?.title}</option>)}</Select>
      <Select aria-label="Batch" value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full sm:w-64"><option value="all">All batches</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
      {extra}
    </div>
  );
  return { l, batch, bar };
}

function Allocated(props: ViewProps) {
  const { l, batch, bar } = useFilters(props);
  const { student, batchOf } = useStudentLookup();
  const firstAt = useMemo(() => { const m = new Map<string, number>(); [...l.log].reverse().forEach((e) => e.action === 'allocated' && e.studentIds.forEach((id) => m.has(id) || m.set(id, e.at))); return m; }, [l]);
  const rows = current(l).students.filter((id) => batch === 'all' || student(id)?.batchId === batch);
  return (
    <>
      {bar()}
      <div className="mb-3 flex gap-6 text-sm"><span>Total allocated <b className="tnum">{current(l).students.length}</b></span><span>Currently active <b className="tnum">{Object.keys(l.active).length}</b></span></div>
      <Table>
        <thead><tr><Th>Student ID</Th><Th>Student name</Th><Th>Batch</Th><Th>Allocation date</Th><Th>Status</Th></tr></thead>
        <tbody>{rows.slice(0, 100).map((id) => (
          <tr key={id}><Td className="font-mono text-xs">{student(id)?.studentId ?? id}</Td><Td>{student(id)?.name ?? 'Removed student'}</Td><Td className="text-xs text-muted">{batchOf(id)}</Td>
            <Td className="text-xs">{fmtDate(l.active[id] ?? firstAt.get(id) ?? current(l).startedAt)}</Td><Td>{l.active[id] ? <Badge tone="pop">Active</Badge> : <Badge>Revoked</Badge>}</Td></tr>
        ))}</tbody>
      </Table>
      {rows.length > 100 && <p className="mt-2 text-2xs text-muted">Showing 100 of {rows.length}. Filter by batch to narrow it down.</p>}
    </>
  );
}

function History(props: ViewProps) {
  const { l, batch, bar } = useFilters(props);
  const { student, batchOf } = useStudentLookup();
  const [activity, setActivity] = useState<'all' | 'allocated' | 'revoked'>('all');
  const [open, setOpen] = useState<number | null>(null);
  const rows = l.log.map((e, i) => ({ e, i, ids: e.studentIds.filter((id) => batch === 'all' || student(id)?.batchId === batch) })).filter((r) => r.ids.length && (activity === 'all' || r.e.action === activity));
  return (
    <>
      {bar(<Segmented value={activity} onChange={setActivity} options={[{ value: 'all', label: 'All' }, { value: 'allocated', label: 'Allocated' }, { value: 'revoked', label: 'Revoked' }]} />)}
      <Table>
        <thead><tr><Th>Date</Th><Th>Batch</Th><Th className="text-right">Students</Th><Th>Activity</Th><Th /></tr></thead>
        <tbody>{rows.map(({ e, i, ids }) => {
          const batches = [...new Set(ids.map(batchOf))];
          return (
            <Fragment key={i}>
              <tr className="cursor-pointer hover:bg-subtle/70" onClick={() => setOpen(open === i ? null : i)}>
                <Td>{fmtDate(e.at)}</Td><Td className="text-xs text-muted">{batches.length > 1 ? `${batches.length} batches` : batches[0]}</Td><Td className="tnum text-right">{ids.length}</Td>
                <Td><Badge tone={e.action === 'allocated' ? 'pop' : 'neutral'}>{e.action === 'allocated' ? 'Allocated' : 'Revoked'}</Badge></Td><Td className="w-8"><ChevronDown className={cn('size-4 text-muted transition', open === i && 'rotate-180')} /></Td>
              </tr>
              {open === i && <tr><Td colSpan={5} className="h-auto bg-subtle/50 py-3 text-xs text-muted">{ids.map((id) => student(id)?.name ?? id).join(', ')}</Td></tr>}
            </Fragment>
          );
        })}</tbody>
      </Table>
    </>
  );
}

function Cycles(props: ViewProps) {
  const { l, bar } = useFilters(props);
  return (
    <>
      {bar()}
      <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: l.maxCycles }, (_, i) => {
        const c = l.cycles[i], status = !c ? 'Not started' : c.completedAt ? 'Completed' : 'In progress', used = c?.students.length ?? 0;
        return (
          <div key={i} className="rounded-2xl bg-subtle p-4 ring-1 ring-inset ring-border">
            <div className="flex items-center justify-between"><b>Cycle {i + 1}</b><Badge tone={status === 'Completed' ? 'ink' : status === 'In progress' ? 'pop' : 'neutral'}>{status}</Badge></div>
            <div className="tnum mt-3 text-2xl font-bold">{used} / {l.capacity}</div>
            <div className="text-2xs text-muted">{c ? `${used} unique students allocated` : 'Available for future use'}</div>
            <Progress value={(used / l.capacity) * 100} className="mt-3" />
            <dl className="mt-3 space-y-0.5 text-2xs text-muted"><div>Maximum permitted: {l.capacity}</div>{c && <div>Started {fmtDate(c.startedAt)}</div>}{c?.completedAt && <div>Completed {fmtDate(c.completedAt)}</div>}</dl>
          </div>
        );
      })}</div>
    </>
  );
}

/** Pick whole batches, individual students, or both. */
function AccessDialog({ mode, licenceId, onClose }: { mode: 'allocate' | 'revoke'; licenceId: string; onClose: () => void }) {
  const shop = useShop();
  const { students, batches } = useStore();
  const [id, setId] = useState(licenceId);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirm, setConfirm] = useState(false);
  const l = shop.licences.find((x) => x.id === id)!, c = current(l);
  const [bc, setBc] = useState<CourseFilter>(shop.catalog.find((p) => p.id === l.productId)?.course as Course ?? 'all');
  const pool = students.filter((s) => (mode === 'allocate' ? !l.active[s.id] : l.active[s.id]) && (!q || `${s.name} ${s.roll}`.toLowerCase().includes(q.toLowerCase())));
  const groups = batches.filter((b) => bc === 'all' || b.course === bc).map((b) => ({ b, list: pool.filter((s) => s.batchId === b.id) })).filter((g) => g.list.length);
  const st = allocState(l), limit = mode === 'allocate' ? st.limit : Infinity;
  const flip = (ids: string[], on: boolean) => {
    const n = new Set(picked);
    for (const x of ids) { if (!on) n.delete(x); else if (n.size < limit) n.add(x); }
    if (on && ids.some((x) => !n.has(x))) toast(`Only ${limit} can be added now`, { id: 'limit', description: st.note });
    setPicked(n);
  };
  const run = () => {
    const ids = [...picked];
    if (mode === 'allocate') {
      const blocked = shop.allocate(l.id, ids);
      toast.success(`${ids.length - blocked.length} students given access`, { description: blocked.length ? `${blocked.length} not added: no places left.` : undefined });
    } else { shop.revoke(l.id, ids); toast(`Access revoked for ${ids.length} students`); }
    onClose();
  };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={mode === 'allocate' ? 'Allocate students' : 'Revoke student access'}
      footer={<><span className="mr-auto self-center text-2xs text-muted">{mode === 'allocate' ? `${picked.size} of ${limit} picked` : `${picked.size} selected`}</span><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!picked.size} onClick={() => (mode === 'revoke' ? setConfirm(true) : run())}>{mode === 'allocate' ? 'Confirm allocation' : 'Revoke access'}</Button></>}>
      <div className="space-y-4 pb-2">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Product"><Select value={id} onChange={(e) => { const x = shop.licences.find((y) => y.id === e.target.value)!; setId(x.id); setPicked(new Set()); setBc(shop.catalog.find((p) => p.id === x.productId)?.course ?? 'all'); }}>{shop.licences.map((x) => <option key={x.id} value={x.id}>{shop.catalog.find((p) => p.id === x.productId)?.title}</option>)}</Select></Field>
          {mode === 'allocate' ? <>
            <Field label="Allocation cycle" hint={st.note}><Input readOnly value={`Cycle ${c.students.length >= l.capacity && st.can ? c.n + 1 : c.n} of ${l.maxCycles}`} /></Field>
            <Field label="Allocation date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          </> : <div className="sm:col-span-2 self-end text-2xs text-muted">Revoking frees seats but does not give back used places in the cycle.</div>}
        </div>
        {mode === 'allocate' && !st.can ? <p className="rounded-xl bg-warn-soft px-3 py-2.5 text-sm text-warn">{st.note}</p> : <div className="flex flex-wrap items-center gap-2"><CourseToggle value={bc} onChange={setBc} /><SearchBox value={q} onChange={setQ} placeholder="Search students" /></div>}
        <ul className="max-h-80 space-y-1 overflow-y-auto">{(mode === 'revoke' || st.can ? groups : []).map(({ b, list }) => {
          const all = list.every((s) => picked.has(s.id)), some = list.some((s) => picked.has(s.id));
          return (
            <li key={b.id} className="rounded-xl bg-subtle">
              <div className="flex items-center gap-3 px-3 py-2">
                <Tick on={all} some={some && !all} onClick={() => flip(list.map((s) => s.id), !all)} label={`Select all of ${b.name}`} />
                <button onClick={() => setOpen(open === b.id ? null : b.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"><span className="truncate font-medium">{b.name}</span><span className="text-2xs text-muted">{list.length} students</span><ChevronDown className={cn('ml-auto size-4 text-muted transition', open === b.id && 'rotate-180')} /></button>
              </div>
              {open === b.id && <ul className="space-y-0.5 px-3 pb-2 pl-10">{list.map((s) => (
                <li key={s.id} className="flex items-center gap-3 text-sm"><Tick on={picked.has(s.id)} onClick={() => flip([s.id], !picked.has(s.id))} label={`Select ${s.name}`} />{s.name}<span className="font-mono text-2xs text-faint">{s.roll}</span></li>
              ))}</ul>}
            </li>
          );
        })}</ul>
      </div>
      {confirm && (
        <Dialog open onOpenChange={setConfirm} title="Revoke access?" desc="Are you sure you want to revoke access to the selected students for this product? Their access will be removed, but their consumed allocation allowance will not be restored."
          footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={run}>Confirm revocation</Button></>} />
      )}
    </Dialog>
  );
}

const Tick = ({ on, some, onClick, label }: { on: boolean; some?: boolean; onClick: () => void; label: string }) => (
  <button type="button" role="checkbox" aria-checked={some ? 'mixed' : on} aria-label={label} onClick={onClick} className={cn('grid size-4 shrink-0 place-items-center rounded-[5px] border', on || some ? 'border-fg bg-fg text-bg' : 'border-border-strong bg-panel')}>
    {on && <Check className="size-3" strokeWidth={3} />}{some && <span className="h-0.5 w-2 bg-bg" />}
  </button>
);
