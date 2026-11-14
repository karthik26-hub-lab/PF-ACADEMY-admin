// Reports · Revenue and fees. Everything the academy earns: student fees (offline, online, recorded) and the
// store (e-books, tests, question banks), with Parallax Flow's share and payouts. Fee reports from the brief:
// total collected, student-wise payment history, course-wise revenue, batch-wise collection.
import { Download, IndianRupee, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Donut, HatchedBars } from '../../components/charts';
import { Avatar, Badge, Button, Dialog, Field, Input, Segmented, Select, Table, Td, Th } from '../../components/ui';
import { MODE, PAY_METHODS, feePlan, feeTotals, modeOf, type ClassMode } from '../../lib/insights';
import { useShop } from '../../lib/shop';
import { COURSES, inr, useStore, type Student } from '../../lib/store';
import { cn, downloadCSV, fmtDate, inrShort } from '../../lib/utils';
import { Bars, Box, FilterBar, NO_FILTERS, ReportPage, Stat, lastMonths, monthIndex, useFiltered, type Filters } from './shared';

const STATUS = { paid: ['Fully paid', 'pop'], due: ['On track', 'neutral'], overdue: ['Overdue', 'bad'] } as const;

export function Revenue() {
  const { batches, payments } = useStore();
  const { sales, mine, rules } = useShop();
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const { students, batches: shownBatches } = useFiltered(f);
  const [q, setQ] = useState(''), [status, setStatus] = useState<'all' | 'paid' | 'overdue' | 'due'>('all'), [open, setOpen] = useState<Student | null>(null), [limit, setLimit] = useState(50);
  const months = lastMonths(12);
  const batchOf = (s: Student) => batches.find((b) => b.id === s.batchId);

  // ---- fees ----
  const plans = useMemo(() => students.map((s) => ({ s, plan: feePlan(s, batchOf(s), payments) })), [students, payments, batches]); // eslint-disable-line react-hooks/exhaustive-deps
  const totals = plans.map((x) => ({ ...x, t: feeTotals(x.plan) }));
  const sum = (k: 'total' | 'paid' | 'overdue' | 'due', list = totals) => list.reduce((a, x) => a + x.t[k], 0);
  const byMode = (Object.keys(MODE) as ClassMode[]).map((m) => ({ m, paid: sum('paid', totals.filter((x) => modeOf(x.s) === m)) }));
  const feeMonthly = months.map(() => 0);
  plans.forEach(({ plan }) => plan.forEach((i) => { const k = i.paidAt ? monthIndex(i.paidAt, months) : -1; if (k >= 0) feeMonthly[k] += i.amount; }));

  // ---- store (not split by class mode; filtered by course) ----
  const storeOn = f.mode === 'all' && f.batch === 'all';
  const lines = sales.filter((x) => x.status === 'completed').flatMap((x) => x.lines.map((l) => ({ l, at: x.at, p: mine.find((p) => p.id === l.productId) })))
    .filter((x) => storeOn && (f.course === 'all' || x.p?.course === f.course));
  const kinds = { ebook: 0, tests: 0, qbank: 0, bundle: 0 } as Record<string, number>;
  lines.forEach((x) => { kinds[x.p?.type ?? 'ebook'] += x.l.amount; });
  const storeGross = lines.reduce((a, x) => a + x.l.amount, 0);
  const viaParallax = rules.payout === 'parallax', share = viaParallax ? Math.round((storeGross * rules.commission) / 100) : 0, storeNet = storeGross - share;
  const storeMonthly = months.map(() => 0);
  lines.forEach((x) => { const k = monthIndex(x.at, months); if (k >= 0) storeMonthly[k] += x.l.amount * (1 - (viaParallax ? rules.commission / 100 : 0)); });
  const payouts = months.slice(-6).map((m, i) => ({ m, amount: Math.round(storeMonthly[6 + i]), paid: i < 5 }));

  const collected = sum('paid'), total = collected + storeNet;
  const monthly = months.map((m, i) => ({ label: m.toLocaleString('en-IN', { month: 'short' }), value: Math.round(feeMonthly[i] + storeMonthly[i]) }));
  const courseRows = COURSES.filter((c) => f.course === 'all' || c === f.course).map((c) => ({
    label: c, value: sum('paid', totals.filter((x) => batchOf(x.s)?.course === c)) + lines.filter((x) => x.p?.course === c).reduce((a, x) => a + x.l.amount, 0) * (1 - (viaParallax ? rules.commission / 100 : 0)),
  }));
  const batchRows = shownBatches.filter((b) => f.batch === 'all' || b.id === f.batch).map((b) => { const list = totals.filter((x) => x.s.batchId === b.id); return { b, n: list.length, billed: sum('total', list), paid: sum('paid', list), overdue: sum('overdue', list) }; }).filter((r) => r.n).sort((a, b) => b.overdue - a.overdue);
  const statusOf = (t: { overdue: number; due: number }) => (t.overdue ? 'overdue' : t.due ? 'due' : 'paid');
  const rows = totals.filter((x) => (status === 'all' || statusOf(x.t) === status) && `${x.s.name} ${x.s.studentId}`.toLowerCase().includes(q.toLowerCase()));

  const download = () => void downloadCSV('fee-report.csv', [['Student ID', 'Student', 'Batch', 'Mode', 'Course fee', 'Paid', 'Overdue', 'Upcoming', 'Status'],
    ...totals.map(({ s, t }) => [s.studentId, s.name, batchOf(s)?.name, MODE[modeOf(s)], t.total, t.paid, t.overdue, t.due, STATUS[statusOf(t)][0]])]).then((ok) => ok && toast.success('Fee report downloaded'));
  const streams = [...byMode.map((x, i) => ({ label: `${MODE[x.m]} fees`, value: x.paid, tone: (['ink', 'pop', 'hatch'] as const)[i] })), ...(storeOn ? [{ label: 'Store (net)', value: storeNet, tone: 'grey' as const }] : [])];

  return (
    <ReportPage title="Revenue and fees" desc="What the academy earned: student fees by class mode and store sales, with Parallax Flow's share." actions={<Button onClick={download}><Download /> Download</Button>}>
      <FilterBar f={f} set={setF} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Total revenue" value={inrShort(total)} sub={storeOn ? 'Fees collected + store (net)' : 'Fees collected'} />
        <Stat label="Fees collected" value={inrShort(collected)} sub={`${Math.round((collected / Math.max(1, sum('total'))) * 100)}% of ${inrShort(sum('total'))} billed`} tone="pop" />
        <Stat label="Overdue fees" value={inrShort(sum('overdue'))} sub={`${totals.filter((x) => x.t.overdue).length} students`} tone="bad" />
        <Stat label="Upcoming instalments" value={inrShort(sum('due'))} sub="Not yet due" />
        <Stat label="Store sales" value={storeOn ? inrShort(storeGross) : '—'} sub={storeOn ? (viaParallax ? `${inrShort(share)} to Parallax Flow (${rules.commission}%)` : 'Collected by the academy') : 'Not split by batch or mode'} />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Box title="Where the money comes from" sub="Last 12 months">
          <div className="flex flex-wrap items-center gap-5">
            <Donut size={150} thickness={20} center={<span className="text-base">{inrShort(total)}</span>} sub="total" segments={streams} />
            <ul className="min-w-0 flex-1 space-y-2 text-xs">{streams.map((s, i) => (
              <li key={s.label} className="flex items-center gap-2"><i className={cn('size-2.5 shrink-0 rounded-full', ['bg-fg', 'bg-pop', 'hatch ring-1 ring-border-strong', 'bg-border-strong'][i])} /><span className="flex-1 truncate text-muted">{s.label}</span><b className="tnum">{inrShort(s.value)}</b></li>
            ))}</ul>
          </div>
        </Box>
        <Box title="Revenue by month" sub={storeOn ? 'Fees collected and store sales (net)' : 'Fees collected'}><HatchedBars data={monthly} height={170} format={inrShort} highlight={11} /></Box>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Box title="Fees by class mode" sub="Collected · students"><Bars rows={byMode.map((x) => ({ label: `${MODE[x.m]} · ${totals.filter((t) => modeOf(t.s) === x.m).length}`, value: x.paid, tone: x.m === 'online' ? 'pop' : undefined }))} format={inrShort} /></Box>
        <Box title="Course-wise revenue" sub="Fees and store"><Bars rows={courseRows} format={inrShort} /></Box>
        <Box title="Store and Parallax Flow" sub={viaParallax ? `Parallax Flow collects store payments and keeps ${rules.commission}%` : 'Your store payments come to you directly'}>
          {storeOn ? <>
            <Bars rows={[{ label: 'E-books', value: kinds.ebook }, { label: 'Test series', value: kinds.tests }, { label: 'Question banks', value: kinds.qbank }, { label: 'Bundles', value: kinds.bundle }].filter((r) => r.value)} format={inrShort} />
            {viaParallax && <ul className="mt-4 space-y-1 border-t border-border pt-3 text-2xs">{payouts.map((p) => (
              <li key={+p.m} className="flex justify-between"><span className="text-muted">Payout · {p.m.toLocaleString('en-IN', { month: 'long' })}</span><span><b className="tnum">{inr(p.amount)}</b> <Badge tone={p.paid ? 'pop' : 'neutral'}>{p.paid ? 'Received' : 'Upcoming'}</Badge></span></li>
            ))}</ul>}
          </> : <p className="text-xs text-muted">Store sales aren't tied to a batch or class mode. Clear the batch and mode filters to see them.</p>}
        </Box>
      </div>

      <Box title="Batch-wise fee collection" sub="Most overdue first" className="mb-5">
        <Table>
          <thead><tr><Th>Batch</Th><Th className="text-right">Students</Th><Th className="text-right">Billed</Th><Th className="text-right">Collected</Th><Th className="text-right">Overdue</Th><Th className="w-40">Collected %</Th></tr></thead>
          <tbody>{batchRows.map((r) => { const pct = Math.round((r.paid / Math.max(1, r.billed)) * 100); return (
            <tr key={r.b.id}><Td className="font-medium">{r.b.name}</Td><Td className="tnum text-right">{r.n}</Td><Td className="tnum text-right">{inrShort(r.billed)}</Td><Td className="tnum text-right">{inrShort(r.paid)}</Td><Td className={cn('tnum text-right', r.overdue && 'text-bad')}>{r.overdue ? inrShort(r.overdue) : '—'}</Td>
              <Td><span className="flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full hatch"><span className="block h-full rounded-full bg-fg" style={{ width: `${pct}%` }} /></span><span className="tnum w-9 text-right text-2xs">{pct}%</span></span></Td></tr>
          ); })}</tbody>
        </Table>
      </Box>

      <Box title="Student-wise payments" sub="Open a student for their instalments and to record a payment">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Segmented value={status} onChange={(v) => { setStatus(v); setLimit(50); }} options={[{ value: 'all', label: `All ${totals.length}` }, { value: 'overdue', label: `Overdue ${totals.filter((x) => statusOf(x.t) === 'overdue').length}` }, { value: 'due', label: 'On track' }, { value: 'paid', label: 'Fully paid' }]} />
          <div className="relative w-full sm:w-60"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or student ID" className="pl-10" aria-label="Search students" /></div>
        </div>
        <Table>
          <thead><tr><Th>Student</Th><Th>Batch · mode</Th><Th className="text-right">Course fee</Th><Th className="text-right">Paid</Th><Th className="text-right">Overdue</Th><Th>Status</Th></tr></thead>
          <tbody>{rows.slice(0, limit).map(({ s, t }) => { const st = statusOf(t); return (
            <tr key={s.id} onClick={() => setOpen(s)} className="cursor-pointer transition hover:bg-hover">
              <Td><span className="flex items-center gap-2.5"><Avatar name={s.name} /><span><span className="block font-medium">{s.name}</span><span className="font-mono text-2xs text-muted">{s.studentId}</span></span></span></Td>
              <Td className="max-w-52 text-xs text-muted"><span className="block truncate">{batchOf(s)?.name}</span>{MODE[modeOf(s)]}</Td>
              <Td className="tnum text-right">{inr(t.total)}</Td><Td className="tnum text-right">{inr(t.paid)}</Td><Td className={cn('tnum text-right', t.overdue && 'text-bad')}>{t.overdue ? inr(t.overdue) : '—'}</Td>
              <Td><Badge tone={STATUS[st][1]}>{STATUS[st][0]}</Badge></Td>
            </tr>
          ); })}</tbody>
        </Table>
        {rows.length > limit && <div className="mt-3 text-center"><Button onClick={() => setLimit(limit + 50)}>Show more ({rows.length - limit} left)</Button></div>}
      </Box>
      {open && <PaymentsDialog s={open} onClose={() => setOpen(null)} />}
    </ReportPage>
  );
}

/** One student's instalments; unpaid ones can be recorded as paid (cash, cheque, bank transfer). */
function PaymentsDialog({ s, onClose }: { s: Student; onClose: () => void }) {
  const { batches, payments, recordPayment } = useStore();
  const b = batches.find((x) => x.id === s.batchId), plan = feePlan(s, b, payments), t = feeTotals(plan);
  const [method, setMethod] = useState('Cash');
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} title={s.name} desc={`${b?.name} · ${MODE[modeOf(s)]} · course fee ${inr(t.total)}`}>
      <div className="space-y-4 pb-2">
        <div className="grid grid-cols-3 gap-2 text-center">{([['Paid', t.paid, 'text-pop'], ['Overdue', t.overdue, 'text-bad'], ['Upcoming', t.due, '']] as const).map(([k, v, c]) => <div key={k} className="rounded-xl bg-subtle p-2.5"><b className={cn('tnum block', c)}>{inr(v)}</b><span className="text-2xs text-muted">{k}</span></div>)}</div>
        <ul className="divide-y divide-border rounded-xl ring-1 ring-inset ring-border">{plan.map((i) => (
          <li key={i.key} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
            <span className="grid size-7 place-items-center rounded-full bg-subtle text-2xs font-bold">{i.n}</span>
            <span className="min-w-0 flex-1"><b className="tnum">{inr(i.amount)}</b><span className="block text-2xs text-muted">Due {fmtDate(i.due)}{i.paidAt && ` · paid ${fmtDate(i.paidAt)} by ${i.method}${i.by ? ` · recorded by ${i.by}` : ''}`}</span></span>
            {i.paidAt ? <Badge tone="pop">Paid</Badge> : <Button size="sm" variant={i.status === 'overdue' ? 'primary' : 'secondary'} onClick={() => { recordPayment(i.key, method); toast.success('Payment recorded', { description: `${inr(i.amount)} by ${method}. Recorded with your name.` }); }}><IndianRupee /> Record payment</Button>}
          </li>
        ))}</ul>
        {plan.some((i) => !i.paidAt) && <Field label="Paid by" hint="Online payments arrive automatically once the payment gateway is connected."><Select value={method} onChange={(e) => setMethod(e.target.value)} className="sm:w-48">{PAY_METHODS.map((m) => <option key={m}>{m}</option>)}<option>Cheque</option><option>Bank transfer</option></Select></Field>}
      </div>
    </Dialog>
  );
}
