// Explore Store · Purchases: every order the academy placed with Parallax Flow.
import { Download, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Dialog, Input, Select, Table, Td, Th } from '../../components/ui';
import { navigate } from '../../lib/router';
import { ORDER_STATUS, current, licenceStatus, useShop, type OrderStatus, type Purchase } from '../../lib/shop';
import { inr, useStore } from '../../lib/store';
import { downloadBlob, fmtDate, fmtDateTime } from '../../lib/utils';
import { CourseToggle, Facts, OrderInsights, PAYMENT, SearchBox, StatusBadge, inRange, type CourseFilter } from './shared';

/** A plain HTML invoice that prints cleanly. */
export function invoice(o: Purchase, title: (id: string) => string, academy: string) {
  const rows = o.lines.map((l) => `<tr><td>${title(l.productId)}</td><td>${l.qty}</td><td>${inr(l.amount)}</td></tr>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>Invoice ${o.id}</title><body style="font-family:system-ui;max-width:640px;margin:40px auto">
<h2>Parallax Flow · Invoice</h2><p>Invoice for order <b>${o.id}</b> · ${fmtDate(o.at)}<br>Billed to: ${o.billing?.academy ?? academy}${o.billing?.gstin ? ` · GSTIN ${o.billing.gstin}` : ''}${o.billing?.address ? `<br>${o.billing.address}` : ''}</p>
<table width="100%" border="1" cellpadding="6" style="border-collapse:collapse"><tr><th align="left">Product</th><th>Capacity</th><th>Amount</th></tr>${rows}</table>
<p>Subtotal ${inr(o.subtotal)} · Discount ${inr(o.discount)}<br><b>Total ${inr(o.total)}</b> · ${o.method} · ${o.txn || 'not paid'}</p><p style="color:#888">Sample invoice from the preview.</p></body>`;
  return downloadBlob(`invoice-${o.id}.html`, new Blob([html], { type: 'text/html' }));
}

export function Purchases() {
  const { purchases, catalog } = useShop();
  const academy = useStore((s) => s.academy.name);
  const [course, setCourse] = useState<CourseFilter>('all');
  const [q, setQ] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all'), [pay, setPay] = useState('all');
  const [open, setOpen] = useState<Purchase | null>(null);
  const product = (id: string) => catalog.find((p) => p.id === id);
  const title = (id: string) => product(id)?.title ?? id;
  const inCourse = purchases.filter((o) => course === 'all' || o.lines.some((l) => product(l.productId)?.course === course));
  const shown = inCourse.filter((o) => `${o.id} ${o.lines.map((l) => title(l.productId)).join(' ')}`.toLowerCase().includes(q.toLowerCase())
    && inRange(o.at, from, to) && (status === 'all' || o.status === status) && (pay === 'all' || PAYMENT[o.status] === pay));
  const done = inCourse.filter((o) => o.status === 'completed');
  const download = (o: Purchase) => invoice(o, title, academy).then((ok) => ok && toast.success('Invoice downloaded'));
  return (
    <>
      <div className="mb-4"><CourseToggle value={course} onChange={setCourse} /></div>
      <OrderInsights orders={inCourse} status={status} setStatus={setStatus} money={done.reduce((a, o) => a + o.total, 0)} moneyLabel={`Total purchases · ${done.length} successful`} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Order ID or product" />
        <Input type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /><Input type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        <Select aria-label="Order status" value={status} onChange={(e) => setStatus(e.target.value as 'all' | OrderStatus)} className="w-48"><option value="all">Any order status</option>{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
        <Select aria-label="Payment status" value={pay} onChange={(e) => setPay(e.target.value)} className="w-44"><option value="all">Any payment status</option>{[...new Set(Object.values(PAYMENT))].map((p) => <option key={p}>{p}</option>)}</Select>
      </div>
      <Table>
        <thead><tr><Th>Order ID</Th><Th>Date</Th><Th>Products</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th /></tr></thead>
        <tbody>{shown.map((o) => (
          <tr key={o.id}><Td className="font-mono text-xs">{o.id}</Td><Td className="text-xs">{fmtDate(o.at)}</Td><Td className="max-w-64 truncate">{o.lines.map((l) => title(l.productId)).join(', ')}</Td>
            <Td className="tnum text-right font-semibold">{inr(o.total)}</Td><Td><StatusBadge s={o.status} /></Td>
            <Td className="whitespace-nowrap text-right"><Button size="sm" variant="ghost" onClick={() => setOpen(o)}><Eye /> View</Button><Button size="sm" variant="ghost" disabled={o.status !== 'completed'} onClick={() => download(o)}><Download /> Invoice</Button></Td></tr>
        ))}{!shown.length && <tr><Td colSpan={6} className="h-20 text-center text-muted">No orders match.</Td></tr>}</tbody>
      </Table>
      {open && <OrderDialog o={open} title={title} onClose={() => setOpen(null)} onInvoice={() => download(open)} />}
    </>
  );
}

function OrderDialog({ o, title, onClose, onInvoice }: { o: Purchase; title: (id: string) => string; onClose: () => void; onInvoice: () => void }) {
  const { licences } = useShop();
  const lic = licences.filter((l) => l.orderId === o.id);
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={`Order ${o.id}`}
      footer={<><Button disabled={o.status !== 'completed'} onClick={onInvoice}><Download /> Download invoice</Button>{lic.length > 0 && <Button variant="primary" onClick={() => { onClose(); navigate({ page: 'store', tab: 'licences' }); }}>View licence & access</Button>}</>}>
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <Facts title="Order" rows={[['Order ID', o.id], ['Order date', fmtDateTime(o.at)], ['Order status', <StatusBadge key="s" s={o.status} />], ['Payment status', PAYMENT[o.status]]]} />
        <Facts title="Payment" rows={[['Subtotal', inr(o.subtotal)], ['Discount', inr(o.discount)], ['Total paid', inr(o.status === 'completed' ? o.total : 0)], ['Method', o.method], ['Transaction ID', o.txn || '—'], ['Payment date', o.txn ? fmtDate(o.at) : '—']]} />
        <section className="sm:col-span-2"><h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">Products purchased</h4>
          <Table><thead><tr><Th>Product</Th><Th className="text-right">Capacity</Th><Th className="text-right">Amount</Th></tr></thead>
            <tbody>{o.lines.map((l) => <tr key={l.productId}><Td>{title(l.productId)}</Td><Td className="tnum text-right">{l.qty}</Td><Td className="tnum text-right">{inr(l.amount)}</Td></tr>)}</tbody></Table>
        </section>
        {lic.map((l) => <Facts key={l.id} title={`Licence · ${title(l.productId)}`} rows={[['Purchased capacity', `${l.capacity} students`], ['Allocation cycles', `${current(l).n} of ${l.maxCycles} in use`], ['Activated', fmtDate(l.activatedAt)], ['Expires', fmtDate(l.expiresAt)], ['Status', licenceStatus(l)]]} />)}
      </div>
    </Dialog>
  );
}
