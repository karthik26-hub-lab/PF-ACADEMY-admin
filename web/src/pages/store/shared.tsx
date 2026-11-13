// Small pieces shared by the Store screens.
import { BookOpen, Search } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Badge, Input, Segmented } from '../../components/ui';
import { ORDER_STATUS, type MyType, type OrderStatus, type PfType } from '../../lib/shop';
import { COURSES, inr, useStore, type Course } from '../../lib/store';
import { Donut, HatchedBars } from '../../components/charts';
import { cn, inrShort } from '../../lib/utils';

const TONE: Record<PfType | MyType, string> = { study: 'tone-class', ebook: 'tone-class', revision: 'tone-holiday', qbank: 'tone-exam', tests: 'tone-deadline', bundle: 'tone-buffer' };
export const Cover = ({ type, label, className }: { type: PfType | MyType; label: string; className?: string }) => (
  <div className={cn('tone-soft flex flex-col justify-between rounded-xl p-3', TONE[type], className)}>
    <BookOpen className="size-4 opacity-70" /><span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</span>
  </div>
);

export const StatusBadge = ({ s }: { s: OrderStatus }) => <Badge tone={ORDER_STATUS[s].tone}>{ORDER_STATUS[s].label}</Badge>;
/** Payment status shown next to the order status. */
export const PAYMENT: Record<OrderStatus, string> = { pending: 'Unpaid', processing: 'Processing', completed: 'Paid', failed: 'Failed', cancelled: 'Unpaid', 'partial-refund': 'Partly refunded', refunded: 'Refunded' };

/**
 * Visual summary for an order list: a status donut (count in the middle, click a status to filter)
 * and money per month for the last six months. `extra` adds a third panel.
 */
export function OrderInsights({ orders, status, setStatus, money, moneyLabel, extra }: {
  orders: { status: OrderStatus; at: number; total: number }[]; status: 'all' | OrderStatus; setStatus: (s: 'all' | OrderStatus) => void;
  money: number; moneyLabel: string; extra?: ReactNode;
}) {
  const byStatus = (Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => ({ s, n: orders.filter((o) => o.status === s).length })).filter((x) => x.n);
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return d; });
  const perMonth = months.map((m) => orders.filter((o) => { const d = new Date(o.at); return o.status === 'completed' && d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); }).reduce((a, o) => a + o.total, 0));
  const tones = ['pop', 'ink', 'hatch', 'grey'] as const, dots = ['bg-pop', 'bg-fg', 'hatch ring-1 ring-border-strong', 'bg-border-strong'];
  return (
    <div className={cn('mb-5 grid gap-3', extra ? 'lg:grid-cols-3' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]')}>
      <section className="flex items-center gap-4 rounded-2xl bg-subtle p-4">
        <Donut size={124} thickness={17} center={orders.length} sub="orders" segments={byStatus.map((x, i) => ({ label: ORDER_STATUS[x.s].label, value: x.n, tone: tones[i % 4] }))} />
        <ul className="min-w-0 flex-1 space-y-0.5">{byStatus.map((x, i) => (
          <li key={x.s}><button onClick={() => setStatus(status === x.s ? 'all' : x.s)} className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs transition', status === x.s ? 'bg-panel ring-1 ring-border-strong' : 'hover:bg-panel')}>
            <i className={cn('size-2.5 shrink-0 rounded-full', dots[i % 4])} /><span className="flex-1 text-left leading-tight text-muted">{ORDER_STATUS[x.s].label}</span><b className="tnum">{x.n}</b>
          </button></li>
        ))}<li className="px-2 pt-0.5 text-[10px] text-faint">Click a status to filter</li></ul>
      </section>
      <section className="rounded-2xl bg-subtle p-4">
        <div className="flex items-baseline justify-between gap-2"><span className="text-xs text-muted">{moneyLabel}</span><span className="tnum text-xl font-bold" title={inr(money)}>{inrShort(money)}</span></div>
        <div className="mt-3"><HatchedBars height={104} data={perMonth.map((v, i) => ({ label: months[i].toLocaleDateString('en-IN', { month: 'short' }), value: v }))} format={(v) => inrShort(v)} highlight={5} /></div>
      </section>
      {extra}
    </div>
  );
}

export const SearchBox = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-10" /></div>
);

/** Rows of label / value, used on order and product details. */
export const Facts = ({ title, rows }: { title: string; rows: [string, ReactNode][] }) => (
  <section><h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">{title}</h4>
    <dl className="space-y-1 rounded-xl bg-subtle p-3 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>
  </section>
);

export function useStudentLookup() {
  const { students, batches } = useStore();
  return useMemo(() => {
    const byId = new Map(students.map((s) => [s.id, s])), batch = new Map(batches.map((b) => [b.id, b.name]));
    return { student: (id: string) => byId.get(id), batchOf: (id: string) => batch.get(byId.get(id)?.batchId ?? '') ?? '—' };
  }, [students, batches]);
}

/** The All / Foundation / Inter / Final switch used across the Store. */
export type CourseFilter = 'all' | Course;
export const CourseToggle = ({ value, onChange }: { value: CourseFilter; onChange: (v: CourseFilter) => void }) => (
  <Segmented value={value} onChange={onChange} options={[{ value: 'all', label: 'All' }, ...COURSES.map((c) => ({ value: c, label: c.replace('CA ', '') }))]} />
);

/** Inside a date range typed as yyyy-mm-dd (either end optional). */
export const inRange = (at: number, from: string, to: string) => (!from || at >= +new Date(from)) && (!to || at <= +new Date(to) + 86400e3);
