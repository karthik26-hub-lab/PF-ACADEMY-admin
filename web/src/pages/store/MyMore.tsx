// My Store · Bundles, Offers & discounts, Sales.
import { Mail, Plus, RotateCcw, Tag, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Dialog, Field, Input, Segmented, Select, Switch, Table, Td, Th, Textarea } from '../../components/ui';
import { navigate } from '../../lib/router';
import { MY_TYPE, ORDER_STATUS, myPrice, useShop, type MyProduct, type Offer, type OrderStatus, type Sale } from '../../lib/shop';
import { SUBJECTS, inr, useStore } from '../../lib/store';
import { cn, fmtDate, fmtDateTime, inrShort } from '../../lib/utils';
import { Audience, ProductStatusBadge } from './MyProducts';
import { CourseToggle, Cover, Facts, OrderInsights, PAYMENT, SearchBox, StatusBadge, inRange, useStudentLookup, type CourseFilter } from './shared';

/** Pill buttons to pick several ids. */
const Chips = ({ items, value, set }: { items: [string, string][]; value: string[]; set: (v: string[]) => void }) => (
  <div className="flex flex-wrap gap-1.5">{items.map(([id, label]) => {
    const on = value.includes(id);
    return <button key={id} type="button" onClick={() => set(on ? value.filter((x) => x !== id) : [...value, id])} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset', on ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong')}>{label}</button>;
  })}</div>
);

/** Pick products with All / Foundation / Inter / Final, type, subject and search. Picked products always stay visible. */
function ProductPicker({ products, value, set }: { products: MyProduct[]; value: string[]; set: (v: string[]) => void }) {
  const [c, setC] = useState<CourseFilter>('all'), [t, setT] = useState('all'), [sub, setSub] = useState('all'), [q, setQ] = useState('');
  const types = [...new Set(products.map((p) => p.type))];
  const shown = products.filter((p) => value.includes(p.id) || ((c === 'all' || p.course === c) && (t === 'all' || p.type === t) && (sub === 'all' || p.subject === sub) && p.title.toLowerCase().includes(q.toLowerCase())));
  return <>
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <CourseToggle value={c} onChange={setC} />
      {types.length > 1 && <Select aria-label="Type" value={t} onChange={(e) => setT(e.target.value)} className="w-full sm:w-40"><option value="all">All types</option>{types.map((x) => <option key={x} value={x}>{MY_TYPE[x]}</option>)}</Select>}
      <Select aria-label="Subject" value={sub} onChange={(e) => setSub(e.target.value)} className="w-full sm:w-52"><option value="all">All subjects</option>{SUBJECTS.map((x) => <option key={x}>{x}</option>)}</Select>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-full sm:w-48" />
    </div>
    {shown.length ? <Chips items={shown.map((p) => [p.id, `${p.title} · ${inr(myPrice(p))}`])} value={value} set={set} /> : <p className="text-xs text-muted">No products match these filters.</p>}
  </>;
}

// ---------- Bundles ----------
export function Bundles({ onUpgrade }: { onUpgrade: () => void }) {
  const { mine } = useShop();
  const [edit, setEdit] = useState<MyProduct | 'new' | null>(null);
  const [c, setC] = useState<CourseFilter>('all');
  const bundles = mine.filter((p) => p.type === 'bundle' && (c === 'all' || p.course === c)), worth = (b: MyProduct) => (b.items ?? []).reduce((a, id) => a + (mine.find((p) => p.id === id)?.price ?? 0), 0);
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2"><CourseToggle value={c} onChange={setC} /><p className="text-sm text-muted">Combine products you already sell. Nothing is uploaded again.</p><Button variant="primary" className="sm:ml-auto" onClick={() => setEdit('new')}><Plus /> Create bundle</Button></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{bundles.map((b) => (
        <button key={b.id} onClick={() => setEdit(b)} className="flex gap-3 rounded-2xl bg-subtle p-3 text-left ring-1 ring-inset ring-border transition hover:bg-hover">
          <Cover type="bundle" label="Bundle" className="h-24 w-20 shrink-0" />
          <div className="min-w-0 flex-1 text-sm"><div className="font-semibold">{b.title}</div>
            <div className="mt-0.5 text-2xs text-muted">{(b.items ?? []).map((id) => mine.find((p) => p.id === id)?.title).join(' + ')}</div>
            <div className="mt-2 flex items-baseline gap-2"><b>{inr(myPrice(b))}</b><s className="text-xs text-muted">{inr(worth(b))}</s></div>
            <div className="mt-1"><ProductStatusBadge s={b.status} /></div>
          </div>
        </button>
      ))}{!bundles.length && <p className="text-sm text-muted">No bundles for this course yet.</p>}</div>
      {edit && <BundleDialog b={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onUpgrade={onUpgrade} />}
    </>
  );
}

function BundleDialog({ b, onClose, onUpgrade }: { b: MyProduct | null; onClose: () => void; onUpgrade: () => void }) {
  const { mine, saveMine, addon } = useShop();
  const [f, setF] = useState<Omit<MyProduct, 'id' | 'updatedAt'>>(b ?? { title: '', type: 'bundle', course: 'CA Inter', subject: 'Multiple', chapters: [], short: '', detail: '', code: '', status: 'draft', content: { validity: '', visibility: 'public' }, free: false, price: 0, limited: false, who: 'all', whoIds: [], items: [] });
  const set = (x: Partial<typeof f>) => setF({ ...f, ...x });
  const items = f.items ?? [], worth = items.reduce((a, id) => a + (mine.find((p) => p.id === id)?.price ?? 0), 0);
  const ok = f.title.trim() && items.length >= 2 && f.price > 0;
  const save = (status: 'draft' | 'published') => {
    if (status === 'published' && !addon) { saveMine({ ...f, status: 'draft' }, b?.id); onClose(); return onUpgrade(); }
    saveMine({ ...f, title: f.title.trim(), code: f.code || `BN-${Date.now().toString(36).slice(-5).toUpperCase()}`, status }, b?.id); toast.success(status === 'draft' ? 'Bundle saved as a draft' : 'Bundle published'); onClose();
  };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={b ? 'Edit bundle' : 'Create bundle'} desc="One purchase gives access to every product inside, with no duplicate access."
      footer={<><Button onClick={onClose}>Cancel</Button><Button disabled={!ok} onClick={() => save('draft')}>Save draft</Button><Button variant="primary" disabled={!ok} onClick={() => save('published')}>Publish</Button></>}>
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <Field label="Bundle name" className="sm:col-span-2"><Input autoFocus value={f.title} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Select products" hint={`At least two · ${items.length} picked`} className="sm:col-span-2">
          <ProductPicker products={mine.filter((p) => p.type !== 'bundle' && p.status !== 'archived')} value={items} set={(v) => set({ items: v })} />
        </Field>
        <Field label="Bundle price (₹)" hint={worth ? `Bought separately: ${inr(worth)}. Students see that struck out.` : undefined}><Input type="number" min={1} value={f.price || ''} onChange={(e) => set({ price: +e.target.value })} /></Field>
        <Field label="Discount price (₹)" optional><Input type="number" value={f.discounted ?? ''} onChange={(e) => set({ discounted: e.target.value ? +e.target.value : undefined })} /></Field>
        <Field label="Description" className="sm:col-span-2"><Textarea value={f.short} onChange={(e) => set({ short: e.target.value })} /></Field>
        <Field label="Bundle image" optional hint="Defaults to the first page of the first product."><Input type="file" accept="image/*" /></Field>
        <Field label="Access validity (days)" optional><Input type="number" value={String(f.content.validity ?? '')} onChange={(e) => set({ content: { ...f.content, validity: e.target.value } })} /></Field>
        <Field label="Available from" optional><Input type="date" value={f.saleFrom ?? ''} onChange={(e) => set({ saleFrom: e.target.value })} /></Field>
        <Field label="Available until" optional><Input type="date" value={f.saleTo ?? ''} onChange={(e) => set({ saleTo: e.target.value })} /></Field>
        <Field label="Purchase limit per student" optional><Input type="number" value={f.perStudent ?? ''} onChange={(e) => set({ perStudent: e.target.value ? +e.target.value : undefined })} /></Field>
        <Audience label="Visibility" allLabel="Public" who={f.who} ids={f.whoIds} onChange={(who, whoIds) => set({ who, whoIds })} />
      </div>
    </Dialog>
  );
}

// ---------- Offers & discounts ----------
export function Offers() {
  const { offers, saveOffer, mine } = useShop();
  const { batches } = useStore();
  const [edit, setEdit] = useState<Offer | 'new' | null>(null);
  const [c, setC] = useState<CourseFilter>('all'), [state, setState] = useState<'all' | 'on' | 'off'>('all'), [q, setQ] = useState('');
  // An offer counts for a course when its students or its products belong to that course (or it is open to all).
  const forCourse = (o: Offer) => c === 'all' || (o.who === 'all' && !o.products.length)
    || (o.who === 'courses' && o.whoIds.includes(c)) || (o.who === 'batches' && o.whoIds.some((id) => batches.find((b) => b.id === id)?.course === c))
    || o.products.some((id) => mine.find((p) => p.id === id)?.course === c);
  const shown = offers.filter((o) => forCourse(o) && (state === 'all' || o.active === (state === 'on')) && `${o.name} ${o.code}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CourseToggle value={c} onChange={setC} />
        <Segmented value={state} onChange={setState} options={[{ value: 'all', label: 'All' }, { value: 'on', label: 'Active' }, { value: 'off', label: 'Inactive' }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Offer name or code" />
        <Button variant="primary" className="sm:ml-auto" onClick={() => setEdit('new')}><Plus /> Create offer</Button>
      </div>
      <Table>
        <thead><tr><Th>Offer</Th><Th>Code</Th><Th>Discount</Th><Th>Used</Th><Th>Dates</Th><Th>Active</Th></tr></thead>
        <tbody>{shown.map((o) => (
          <tr key={o.id} className="cursor-pointer hover:bg-subtle/70" onClick={() => setEdit(o)}>
            <Td className="font-semibold">{o.name}</Td><Td>{o.auto ? <Badge>Automatic</Badge> : <span className="font-mono text-xs font-bold">{o.code}</span>}</Td>
            <Td>{o.kind === 'percent' ? `${o.value}%` : inr(o.value)} off</Td><Td className="tnum text-xs">{o.used} / {o.limit}</Td><Td className="text-xs text-muted">{o.from} → {o.to}</Td>
            <Td onClick={(e) => e.stopPropagation()}><Switch checked={o.active} onCheckedChange={(v) => saveOffer({ ...o, active: v }, o.id)} label={`${o.name} active`} /></Td>
          </tr>
        ))}{!shown.length && <tr><Td colSpan={6} className="h-20 text-center text-muted">No offers match these filters.</Td></tr>}</tbody>
      </Table>
      {edit && <OfferDialog o={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function OfferDialog({ o, onClose }: { o: Offer | null; onClose: () => void }) {
  const { mine, saveOffer } = useShop();
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState<Omit<Offer, 'id' | 'used'>>(o ?? { name: '', code: '', auto: false, kind: 'percent', value: 10, products: [], limit: 100, perStudent: 1, from: today, to: today, who: 'all', whoIds: [], active: true });
  const set = (x: Partial<typeof f>) => setF({ ...f, ...x });
  const ok = f.name.trim() && (f.auto || f.code) && f.value > 0 && f.from <= f.to;
  const num = (k: 'value' | 'limit' | 'perStudent' | 'minOrder' | 'maxDiscount', label: string, optional = false) => <Field label={label} optional={optional}><Input type="number" min={0} value={f[k] ?? ''} onChange={(e) => set({ [k]: e.target.value === '' ? undefined : +e.target.value })} /></Field>;
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={o ? 'Edit offer' : 'Create offer'}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!ok} onClick={() => { saveOffer({ ...f, name: f.name.trim() }, o?.id); toast.success('Offer saved'); onClose(); }}><Tag /> Save offer</Button></>}>
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <Field label="Offer name"><Input autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Diwali Offer" /></Field>
        <Field label="Coupon code" hint={f.auto ? 'Applied automatically at checkout, no code needed.' : 'Always saved in capitals.'}>
          <div className="flex items-center gap-3"><Input disabled={f.auto} value={f.code} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="DIWALI20" className="font-mono" /><label className="flex shrink-0 items-center gap-2 text-xs"><Switch checked={f.auto} onCheckedChange={(v) => set({ auto: v, code: v ? '' : f.code })} label="Automatic" />Automatic</label></div>
        </Field>
        <Field label="Discount type"><Segmented value={f.kind} onChange={(v) => set({ kind: v })} options={[{ value: 'percent', label: 'Percentage' }, { value: 'fixed', label: 'Fixed amount' }]} /></Field>
        {num('value', f.kind === 'percent' ? 'Discount (%)' : 'Discount (₹)')}
        <Field label="Applicable products" className="sm:col-span-2" hint={f.products.length ? `${f.products.length} picked` : 'None picked means all products.'}><ProductPicker products={mine.filter((p) => p.status !== 'archived')} value={f.products} set={(v) => set({ products: v })} /></Field>
        {num('minOrder', 'Minimum order value (₹)', true)}{num('maxDiscount', 'Maximum discount (₹)', true)}
        {num('limit', 'Usage limit (total uses)')}{num('perStudent', 'Uses per student')}
        <Field label="Start date"><Input type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} /></Field>
        <Field label="End date"><Input type="date" value={f.to} onChange={(e) => set({ to: e.target.value })} /></Field>
        <Audience label="Eligible students" allLabel="All students" who={f.who} ids={f.whoIds} onChange={(who, whoIds) => set({ who, whoIds })} />
        <label className="flex items-center gap-3 text-sm"><Switch checked={f.active} onCheckedChange={(v) => set({ active: v })} label="Active" />{f.active ? 'Active' : 'Inactive'}</label>
      </div>
    </Dialog>
  );
}

// ---------- Sales ----------
export function Sales() {
  const { mine, ...shop } = useShop();
  const { student } = useStudentLookup();
  const [c, setC] = useState<CourseFilter>('all');
  const sales = shop.sales.filter((s) => c === 'all' || s.lines.some((l) => mine.find((p) => p.id === l.productId)?.course === c));
  const [q, setQ] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState(''), [product, setProduct] = useState('all');
  const [status, setStatus] = useState<'all' | OrderStatus>('all'), [pay, setPay] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  const title = (id: string) => mine.find((p) => p.id === id)?.title ?? id;
  const shown = sales.filter((s) => `${s.id} ${student(s.studentId)?.name ?? ''} ${s.lines.map((l) => title(l.productId)).join(' ')}`.toLowerCase().includes(q.toLowerCase())
    && inRange(s.at, from, to) && (product === 'all' || s.lines.some((l) => l.productId === product)) && (status === 'all' || s.status === status) && (pay === 'all' || PAYMENT[s.status] === pay));
  const done = sales.filter((s) => s.status === 'completed' || s.status === 'refunded' || s.status === 'partial-refund');
  const gross = done.reduce((a, s) => a + s.total, 0), refunds = sales.reduce((a, s) => a + s.refund, 0);
  const kindOf = (id: string) => MY_TYPE[mine.find((p) => p.id === id)?.type ?? 'ebook'];
  const byType = Object.entries(done.flatMap((s) => s.lines).reduce<Record<string, number>>((a, l) => ({ ...a, [kindOf(l.productId)]: (a[kindOf(l.productId)] ?? 0) + l.amount }), {})).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <div className="mb-4"><CourseToggle value={c} onChange={setC} /></div>
      <OrderInsights orders={sales} status={status} setStatus={setStatus} money={gross - refunds} moneyLabel="Net sales" extra={
        <section className="rounded-2xl bg-subtle p-4">
          <div className="mb-3 text-xs text-muted">Sales by product type</div>
          <ul className="space-y-2">{byType.map(([label, v]) => (
            <li key={label} className="grid grid-cols-[92px_minmax(0,1fr)_56px] items-center gap-2 text-2xs">
              <span className="text-muted">{label}</span>
              <span className="hatch h-2 overflow-hidden rounded-full"><span className="block h-full rounded-full bg-fg" style={{ width: `${(v / Math.max(1, byType[0][1])) * 100}%` }} /></span>
              <b className="tnum text-right">{inrShort(v)}</b>
            </li>
          ))}</ul>
          <div className="mt-4 text-xs text-muted">Gross, refunds and net</div>
          <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-border"><span className="bg-fg" style={{ width: `${((gross - refunds) / Math.max(1, gross)) * 100}%` }} /><span className="tone-deadline tone-bar" style={{ width: `${(refunds / Math.max(1, gross)) * 100}%` }} /></div>
          <div className="mt-1.5 flex justify-between text-2xs text-muted"><span>Gross <b className="text-fg">{inrShort(gross)}</b></span><span>Refunds <b className="text-fg">{inrShort(refunds)}</b></span><span>Net <b className="text-fg">{inrShort(gross - refunds)}</b></span></div>
        </section>
      } />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Order, student or product" />
        <Input type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /><Input type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        <Select aria-label="Product" value={product} onChange={(e) => setProduct(e.target.value)} className="w-48"><option value="all">All products</option>{mine.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select>
        <Select aria-label="Order status" value={status} onChange={(e) => setStatus(e.target.value as 'all' | OrderStatus)} className="w-44"><option value="all">Any order status</option>{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
        <Select aria-label="Payment status" value={pay} onChange={(e) => setPay(e.target.value)} className="w-44"><option value="all">Any payment status</option>{[...new Set(Object.values(PAYMENT))].map((p) => <option key={p}>{p}</option>)}</Select>
      </div>
      <Table>
        <thead><tr><Th>Order ID</Th><Th>Date</Th><Th>Student</Th><Th>Product</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead>
        <tbody>{shown.slice(0, 50).map((s) => (
          <tr key={s.id} onClick={() => setOpen(s.id)} className="cursor-pointer hover:bg-subtle/70"><Td className="font-mono text-xs">{s.id}</Td><Td className="text-xs">{fmtDate(s.at)}</Td><Td>{student(s.studentId)?.name ?? 'Student'}</Td>
            <Td className="max-w-56 truncate text-xs">{s.lines.map((l) => title(l.productId)).join(', ')}</Td><Td className="tnum text-right font-semibold">{inr(s.total)}</Td><Td><StatusBadge s={s.status} /></Td></tr>
        ))}{!shown.length && <tr><Td colSpan={6} className="h-20 text-center text-muted">No orders match.</Td></tr>}</tbody>
      </Table>
      {open && <SaleDialog s={sales.find((x) => x.id === open)!} title={title} onClose={() => setOpen(null)} />}
    </>
  );
}

function SaleDialog({ s, title, onClose }: { s: Sale; title: (id: string) => string; onClose: () => void }) {
  const { mine, rules, refund } = useShop();
  const { student, batchOf } = useStudentLookup();
  const st = student(s.studentId), p = mine.find((x) => x.id === s.lines[0]?.productId);
  const days = Number(p?.content.access || p?.content.validity || 365), granted = s.status === 'completed';
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={`Order ${s.id}`}
      footer={<>
        <Button onClick={() => { toast.success(`Confirmation re-sent to ${st?.email ?? 'the student'}`); }}><Mail /> Resend confirmation</Button>
        {st && <Button onClick={() => { onClose(); navigate({ page: 'student', id: st.id }); }}><User /> View student</Button>}
        <Button variant="danger" disabled={s.status !== 'completed'} onClick={() => { refund(s.id); toast(`Refunded ${inr(s.total)} (sample)`); onClose(); }}><RotateCcw /> Issue refund</Button>
      </>}>
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <Facts title="Order" rows={[['Order ID', s.id], ['Date and time', fmtDateTime(s.at)], ['Order status', <StatusBadge key="s" s={s.status} />], ['Payment status', PAYMENT[s.status]]]} />
        <Facts title="Student" rows={[['Name', st?.name ?? '—'], ['Student ID', st?.studentId ?? '—'], ['Email', st?.email ?? '—'], ['Mobile', st?.phone ?? '—'], ['Batch', batchOf(s.studentId)]]} />
        <section className="sm:col-span-2"><h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">Products purchased</h4>
          <Table><thead><tr><Th>Product</Th><Th>Type</Th><Th className="text-right">Qty</Th><Th className="text-right">Amount</Th></tr></thead>
            <tbody>{s.lines.map((l) => <tr key={l.productId}><Td>{title(l.productId)}</Td><Td className="text-xs">{MY_TYPE[mine.find((x) => x.id === l.productId)?.type ?? 'ebook']}</Td><Td className="tnum text-right">{l.qty}</Td><Td className="tnum text-right">{inr(l.amount)}</Td></tr>)}</tbody></Table>
        </section>
        <Facts title="Payment" rows={[['Subtotal', inr(s.subtotal)], ['Discount', inr(s.discount)], ['Total amount', inr(s.total)], ['Method', s.method], ['Gateway', rules.payout === 'parallax' ? 'Parallax Flow' : "Academy's own"], ['Transaction ID', s.txn], ['Refund', s.refund ? inr(s.refund) : '—']]} />
        <Facts title="Access" rows={[['Entitlement', granted ? 'Active' : s.status === 'refunded' ? 'Revoked after refund' : 'Not granted'], ['Activated', granted ? fmtDate(s.at) : '—'], ['Expires', granted ? fmtDate(s.at + days * 86400e3) : '—'], ['Access method', 'Web and mobile app'], ['Download', p?.content.download ? 'Allowed' : 'View only']]} />
      </div>
    </Dialog>
  );
}

