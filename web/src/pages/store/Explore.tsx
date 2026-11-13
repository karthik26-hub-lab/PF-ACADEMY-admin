// Explore Store · catalogue, product details and checkout.
import { Eye, FileText, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Dialog, Field, Input, Segmented, Select, Table, Td, Th } from '../../components/ui';
import { navigate } from '../../lib/router';
import { PF_TYPE, useShop, validCapacity, withGst, type PfProduct, type PfType } from '../../lib/shop';
import { COURSES, inr, useStore, type Course } from '../../lib/store';
import { cn, fmtDate } from '../../lib/utils';
import { Cover, SearchBox } from './shared';

/** Capacity box with its live price; used on cards and in details. */
function CapacityBuy({ p, compact }: { p: PfProduct; compact?: boolean }) {
  const { cart, setCart } = useShop();
  const inCart = cart.find((l) => l.productId === p.id);
  const [raw, setRaw] = useState(inCart ? String(inCart.qty) : '');
  const ok = validCapacity(raw);
  const add = () => { setCart(p.id, +raw); toast.success(`${p.title} · ${raw} students added to cart`); };
  return (
    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <Input inputMode="numeric" aria-label="Required student capacity" placeholder="Students" value={raw} onChange={(e) => setRaw(e.target.value)} className={cn('h-9', compact ? 'w-24' : 'w-32')} />
        <span className="tnum text-sm font-bold">{ok ? inr(+raw * p.price) : '—'}</span>
      </div>
      {raw && !ok && <p className="text-2xs text-bad">Enter a positive whole number.</p>}
      <Button size="sm" variant={inCart ? 'secondary' : 'primary'} disabled={!ok} onClick={add} className="w-full"><ShoppingCart />{inCart ? `Update cart (${inCart.qty})` : 'Add to cart'}</Button>
    </div>
  );
}

export function Catalogue() {
  const { catalog, cart } = useShop();
  const [course, setCourse] = useState<'all' | Course>('all');
  const [type, setType] = useState<'all' | PfType>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<{ p: PfProduct; view: 'details' | 'preview' } | null>(null);
  const [checkout, setCheckout] = useState(false);
  const shown = catalog.filter((p) => (course === 'all' || p.course === course) && (type === 'all' || p.type === type) && `${p.title} ${p.subject}`.toLowerCase().includes(q.toLowerCase()));
  const total = cart.reduce((a, l) => a + l.amount, 0);
  return (
    <>
      {cart.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-fg p-3 pl-4 text-bg">
          <ShoppingCart className="size-4" /><span className="flex-1 text-sm"><b>{cart.length}</b> {cart.length === 1 ? 'product' : 'products'} in cart · <b>{inr(total)}</b> before GST</span>
          <Button className="border-transparent bg-pop text-pop-fg hover:bg-pop/90" onClick={() => setCheckout(true)}>Checkout</Button>
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented value={course} onChange={setCourse} options={[{ value: 'all', label: 'All' }, ...COURSES.map((c) => ({ value: c, label: c.replace('CA ', '') }))]} />
        <Select aria-label="Type" value={type} onChange={(e) => setType(e.target.value as 'all' | PfType)} className="w-full sm:w-48"><option value="all">All types</option>{Object.entries(PF_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <div className="sm:ml-auto"><SearchBox value={q} onChange={setQ} placeholder="Search products" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((p) => (
          <article key={p.id} className="flex flex-col rounded-2xl bg-subtle p-3 ring-1 ring-inset ring-border">
            <Cover type={p.type} label={PF_TYPE[p.type]} className="h-24" />
            <h3 className="mt-3 text-sm font-semibold leading-snug">{p.title}</h3>
            <p className="mt-0.5 line-clamp-2 text-2xs text-muted">{p.about}</p>
            <dl className="mt-2 space-y-0.5 text-2xs text-muted">
              <div>{p.course} · {p.subject}</div>
              <div className="truncate">Chapters: {p.chapters.join(', ')}</div>
              <div>Updated {fmtDate(p.updatedAt)} · <b className="text-fg">{inr(p.price)}</b> per student</div>
            </dl>
            <div className="mt-2 flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setOpen({ p, view: 'preview' })}><Eye /> Preview</Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen({ p, view: 'details' })}><FileText /> Details</Button>
            </div>
            <div className="mt-auto border-t border-border pt-3"><CapacityBuy p={p} compact /></div>
          </article>
        ))}
      </div>
      {open && <ProductDialog p={open.p} view={open.view} onClose={() => setOpen(null)} />}
      {checkout && <Checkout onClose={() => setCheckout(false)} />}
    </>
  );
}

function ProductDialog({ p, view: start, onClose }: { p: PfProduct; view: 'details' | 'preview'; onClose: () => void }) {
  const { rules } = useShop();
  const [view, setView] = useState(start);
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={p.title} desc={`${PF_TYPE[p.type]} · ${p.course} · ${p.subject}`}>
      <div className="space-y-4 pb-2">
        <Segmented value={view} onChange={setView} options={[{ value: 'details', label: 'Details' }, { value: 'preview', label: 'Preview' }]} />
        {view === 'details' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 text-sm">
              <p className="text-muted">{p.about}</p>
              <div><div className="mb-1 text-2xs font-semibold uppercase text-faint">Chapters</div><ul className="list-disc space-y-0.5 pl-4">{p.chapters.map((c) => <li key={c}>{c}</li>)}</ul></div>
              <div><div className="mb-1 text-2xs font-semibold uppercase text-faint">Licensing</div>
                <ul className="list-disc space-y-0.5 pl-4 text-muted">
                  <li>Priced per student; you choose the capacity.</li>
                  <li>Valid for {rules.validityMonths} months from purchase.</li>
                  <li>Up to {p.cycles} allocation cycles; each cycle allows as many unique students as the capacity.</li>
                  <li>Only allocated students can open it, in the protected viewer.</li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl bg-subtle p-4"><div className="mb-2 text-sm"><b>{inr(p.price)}</b> per student</div><CapacityBuy p={p} /></div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">{p.preview.map((s, i) => (
            <div key={i} className="flex aspect-[3/4] flex-col justify-between rounded-xl bg-subtle p-3 ring-1 ring-inset ring-border">
              <span className="text-2xs font-semibold uppercase text-faint">Sample {i + 1}</span><span className="text-sm">{s}</span><span className="text-2xs text-faint">{p.title}</span>
            </div>
          ))}</div>
        )}
      </div>
    </Dialog>
  );
}

function Checkout({ onClose }: { onClose: () => void }) {
  const { cart, catalog, rules, setCart, checkout } = useShop();
  const { academy, me } = useStore();
  const [b, setB] = useState({ academy: academy.name, gstin: '', address: academy.city, contact: me.name, email: academy.email, phone: academy.phone, method: 'UPI' });
  const sum = withGst(cart.reduce((a, l) => a + l.amount, 0), 0, rules);
  const ready = b.academy && b.address && b.contact && b.email && b.phone && cart.length;
  const pay = () => { const id = checkout(b); toast.success(`Order ${id} paid`, { description: 'Sample payment, nothing charged. Allocate students in Licences & access.' }); onClose(); navigate({ page: 'store', tab: 'licences' }); };
  const field = (k: keyof typeof b, label: string, optional = false) => <Field label={label} optional={optional}><Input value={b[k]} onChange={(e) => setB({ ...b, [k]: e.target.value })} /></Field>;
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title="Checkout" desc="Billing details, order summary and payment."
      footer={<><Button onClick={onClose}>Back</Button><Button variant="primary" disabled={!ready} onClick={pay}>Pay {inr(sum.total)}</Button></>}>
      <div className="space-y-5 pb-2">
        <Table>
          <thead><tr><Th>Product</Th><Th className="text-right">Capacity</Th><Th className="text-right">Amount</Th><Th /></tr></thead>
          <tbody>{cart.map((l) => (
            <tr key={l.productId}><Td>{catalog.find((p) => p.id === l.productId)?.title}</Td><Td className="tnum text-right">{l.qty}</Td><Td className="tnum text-right">{inr(l.amount)}</Td>
              <Td className="w-10"><button onClick={() => setCart(l.productId, 0)} aria-label="Remove" className="text-muted hover:text-fg"><Trash2 className="size-4" /></button></Td></tr>
          ))}</tbody>
        </Table>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('academy', 'Academy name')}{field('gstin', 'GSTIN', true)}{field('address', 'Billing address')}{field('contact', 'Contact person')}{field('email', 'Email address')}{field('phone', 'Phone number')}
          <Field label="Payment method"><Select value={b.method} onChange={(e) => setB({ ...b, method: e.target.value })}>{['UPI', 'Card', 'Net banking'].map((m) => <option key={m}>{m}</option>)}</Select></Field>
        </div>
        <dl className="ml-auto max-w-xs space-y-1 rounded-xl bg-subtle p-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{inr(sum.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">GST {rules.gst}%</dt><dd>{inr(sum.gst)}</dd></div>
          <div className="flex justify-between border-t border-border pt-1 font-bold"><dt>Total payable</dt><dd>{inr(sum.total)}</dd></div>
        </dl>
      </div>
    </Dialog>
  );
}
