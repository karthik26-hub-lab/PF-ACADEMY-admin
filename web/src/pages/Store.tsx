import { BookOpen, Check, Clock, Lock, Plus, Search, ShieldCheck, Sparkles, Tag, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, Dialog, EmptyState, Field, Input, Progress, Segmented, Select, Table, Tabs, Td, Th, Textarea } from '../components/ui';
import { href, navigate } from '../lib/router';
import { PF_COUPONS, TYPE_LABEL, movableAt, seatQuote, useShop, type Licence, type Product, type ProductType } from '../lib/shop';
import { COURSES, SUBJECTS, inr, useStore, type Course } from '../lib/store';
import { cn, fmtDate } from '../lib/utils';

type Tab = 'pf' | 'licences' | 'mine';
const TONE: Record<ProductType, string> = {
  'question-bank': 'tone-exam', 'visual-notes': 'tone-class', 'mind-maps': 'tone-event', 'formula-sheet': 'tone-task',
  'mock-test': 'tone-deadline', 'revision-notes': 'tone-holiday', bundle: 'tone-buffer',
};
const Cover = ({ p, className }: { p: Product; className?: string }) => (
  <div className={cn('tone-soft flex flex-col justify-between rounded-xl p-3', TONE[p.type], className)}>
    <BookOpen className="size-4 opacity-70" /><span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{TYPE_LABEL[p.type]}</span>
  </div>
);

export function Store({ tab }: { tab: Tab }) {
  const { licences, addon } = useShop();
  return (
    <Page crumbs={[{ label: 'Store' }]}>
      <div className="mb-5"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Store</h1><p className="text-sm text-muted">Buy Parallax Flow material for your students, or sell your own.</p></div>
      <Card>
        <Tabs value={tab} onChange={(t) => navigate({ page: 'store', tab: t })} tabs={[
          { value: 'pf', label: 'Parallax Flow store' }, { value: 'licences', label: 'My licences', count: licences.length },
          { value: 'mine', label: addon ? 'My store' : 'My store · add-on' },
        ]} />
        <div className="p-4 sm:p-5">{tab === 'pf' ? <Catalog /> : tab === 'licences' ? <Licences /> : <MyStore />}</div>
      </Card>
      <p className="mt-3 text-2xs text-faint">Sample store: purchases here take no payment. Prices, seat rules and commission are set in <a className="underline" href={href({ page: 'settings', tab: 'store' })}>Settings → Store rules</a>.</p>
    </Page>
  );
}

// ---------- Parallax Flow store ----------
function Catalog() {
  const { catalog, licences } = useShop();
  const [course, setCourse] = useState<'all' | Course>('all');
  const [q, setQ] = useState('');
  const [buying, setBuying] = useState<Product | null>(null);
  const shown = catalog.filter((p) => (course === 'all' || p.course === course) && `${p.title} ${p.subject}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented value={course} onChange={setCourse} options={[{ value: 'all', label: 'All' }, ...COURSES.map((c) => ({ value: c, label: c.replace('CA ', '') }))]} />
        <div className="relative w-full sm:ml-auto sm:w-64"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books and banks" className="pl-10" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((p) => {
          const held = licences.find((l) => l.productId === p.id);
          return (
            <button key={p.id} onClick={() => setBuying(p)} className="group flex flex-col rounded-2xl bg-subtle p-3 text-left ring-1 ring-inset ring-border transition hover:bg-hover">
              <Cover p={p} className="h-28" />
              <div className="mt-3 text-sm font-semibold leading-snug">{p.title}</div>
              <div className="text-2xs text-muted">{p.course} · {p.subject}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold">{inr(p.price)}<span className="text-2xs font-normal text-muted"> / student</span></span>
                {held && <Badge tone="pop">{Object.keys(held.assigned).length}/{held.seats} seats</Badge>}
              </div>
            </button>
          );
        })}
      </div>
      {buying && <BuyDialog p={buying} onClose={() => setBuying(null)} />}
    </>
  );
}

function BuyDialog({ p, onClose }: { p: Product; onClose: () => void }) {
  const { rules, buy, licences } = useShop();
  const [seats, setSeats] = useState(100);
  const [code, setCode] = useState('');
  const couponOff = PF_COUPONS[code.trim().toUpperCase()] ?? 0;
  const q = seatQuote(p.price, seats, rules, couponOff);
  const held = licences.find((l) => l.productId === p.id);
  const confirm = () => { buy(p.id, seats); toast.success(`${seats} seats of ${p.title}`, { description: 'Sample purchase: no payment taken. Assign students in My licences.' }); onClose(); navigate({ page: 'store', tab: 'licences' }); };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={p.title} desc={`${p.course} · ${p.subject} · ${TYPE_LABEL[p.type]}`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={seats < 1} onClick={confirm}>{held ? 'Add' : 'Buy'} {seats} seats · {inr(q.total)}</Button></>}>
      <div className="grid gap-5 pb-2 sm:grid-cols-[160px_minmax(0,1fr)]">
        <Cover p={p} className="h-40" />
        <div className="space-y-4">
          <p className="text-sm text-muted">{p.about}</p>
          <Field label="How many students?" hint={held ? `You already hold ${held.seats} seats; these are added to the same licence.` : undefined}>
            <div className="flex flex-wrap items-center gap-2">
              <Input type="number" min={1} value={seats} onChange={(e) => setSeats(Math.max(0, Math.floor(+e.target.value)))} className="w-28" />
              {[50, 100, 250, 500].map((n) => <Button key={n} size="sm" variant={seats === n ? 'primary' : 'secondary'} onClick={() => setSeats(n)}>{n}</Button>)}
            </div>
          </Field>
          <Field label="Coupon" optional hint={code && !couponOff ? 'Not a valid code.' : couponOff ? `${couponOff}% off applied.` : 'Try LAUNCH10 in this sample.'}>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" className="w-40 uppercase" />
          </Field>
          <dl className="space-y-1 rounded-xl bg-subtle p-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{seats} × {inr(p.price)}</dt><dd>{inr(q.gross)}</dd></div>
            {q.off > 0 && <div className="flex justify-between text-good"><dt>Volume discount</dt><dd>−{q.off}%</dd></div>}
            {couponOff > 0 && <div className="flex justify-between text-good"><dt>Coupon {code.toUpperCase()}</dt><dd>−{couponOff}%</dd></div>}
            <div className="flex justify-between border-t border-border pt-1 font-bold"><dt>Total</dt><dd>{inr(q.total)}</dd></div>
          </dl>
          <ul className="space-y-1 text-2xs text-muted">
            <li className="flex gap-1.5"><ShieldCheck className="size-3.5" />Only the students you assign can open it, in the protected viewer.</li>
            <li className="flex gap-1.5"><Clock className="size-3.5" />Seats last {rules.seatMonths} months. A seat can move to another student after {rules.cooldownDays} days.</li>
          </ul>
        </div>
      </div>
    </Dialog>
  );
}

// ---------- Licences: assign and revoke seats ----------
function Licences() {
  const { licences, catalog } = useShop();
  const [open, setOpen] = useState<string | null>(null);
  if (!licences.length) return <EmptyState icon={Users} title="No licences yet" action={<Button variant="primary" onClick={() => navigate({ page: 'store', tab: 'pf' })}>Browse the store</Button>}>Buy a product for a number of students, then choose who gets it.</EmptyState>;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {licences.map((l) => {
        const p = catalog.find((x) => x.id === l.productId)!, used = Object.keys(l.assigned).length;
        return (
          <div key={l.id} className="flex gap-4 rounded-2xl bg-subtle p-4 ring-1 ring-inset ring-border">
            <Cover p={p} className="h-24 w-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{p.title}</div>
              <div className="text-2xs text-muted">Valid till {fmtDate(l.expiresAt)}</div>
              <div className="mt-3 flex items-center justify-between text-xs"><span><b className="tnum">{used}</b> of {l.seats} seats used</span><span className="text-muted">{l.seats - used} free</span></div>
              <Progress value={(used / l.seats) * 100} className="mt-1.5" />
              <Button size="sm" className="mt-3" onClick={() => setOpen(l.id)}><Users /> Manage students</Button>
            </div>
          </div>
        );
      })}
      {open && <SeatsDialog l={licences.find((x) => x.id === open)!} onClose={() => setOpen(null)} />}
    </div>
  );
}

function SeatsDialog({ l, onClose }: { l: Licence; onClose: () => void }) {
  const { catalog, rules, assign, revoke } = useShop();
  const { students, batches } = useStore();
  const [view, setView] = useState<'assigned' | 'add' | 'history'>('assigned');
  const [batch, setBatch] = useState('all');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const name = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const used = Object.keys(l.assigned).length, free = l.seats - used, now = Date.now();
  const list = view === 'assigned'
    ? Object.keys(l.assigned).map((id) => name.get(id)).filter(Boolean)
    : students.filter((s) => !l.assigned[s.id] && (batch === 'all' || s.batchId === batch));
  const shown = list.filter((s) => s && `${s.name} ${s.roll}`.toLowerCase().includes(q.toLowerCase())).slice(0, 200);
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : view === 'add' && n.size >= free ? null : n.add(id); return n; });
  const act = () => {
    const ids = [...picked];
    view === 'add' ? assign(l.id, ids) : revoke(l.id, ids);
    toast.success(view === 'add' ? `${ids.length} students given access` : `${ids.length} seats freed`);
    setPicked(new Set());
  };
  const tabSwitch = (v: typeof view) => { setView(v); setPicked(new Set()); };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={catalog.find((p) => p.id === l.productId)!.title} desc={`${used} of ${l.seats} seats used · ${free} free`}
      footer={view !== 'history' ? <><span className="mr-auto self-center text-2xs text-muted">{view === 'add' ? `Up to ${free} more students` : `Seats move after ${rules.cooldownDays} days with a student`}</span><Button onClick={onClose}>Done</Button><Button variant="primary" disabled={!picked.size} onClick={act}>{view === 'add' ? `Give access to ${picked.size}` : `Revoke ${picked.size}`}</Button></> : undefined}>
      <div className="space-y-3 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={view} onChange={tabSwitch} options={[{ value: 'assigned', label: 'Assigned', count: used }, { value: 'add', label: 'Add students' }, { value: 'history', label: 'History' }]} />
          {view === 'add' && <Select aria-label="Batch" value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full sm:w-56"><option value="all">All batches</option>{batches.filter((b) => b.status === 'active').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>}
        </div>
        {view === 'history' ? (
          <ul className="max-h-80 space-y-1 overflow-y-auto">{l.log.slice(0, 60).map((e, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs"><Badge tone={e.action === 'assign' ? 'pop' : 'neutral'}>{e.action === 'assign' ? 'Given' : 'Revoked'}</Badge><span className="flex-1 truncate">{name.get(e.studentId)?.name ?? 'Removed student'}</span><span className="text-faint">{fmtDate(e.at)}</span></li>
          ))}</ul>
        ) : (
          <>
            <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or roll" className="pl-10" /></div>
            {view === 'add' && free === 0 && <p className="rounded-xl bg-warn-soft px-3 py-2 text-xs text-warn">All seats are in use. Revoke some, or buy more seats.</p>}
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {shown.map((s) => {
                const locked = view === 'assigned' && movableAt(l.assigned[s!.id], rules) > now;
                const on = picked.has(s!.id);
                return (
                  <li key={s!.id}><button disabled={locked} onClick={() => toggle(s!.id)} className={cn('flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition', on ? 'bg-subtle ring-1 ring-inset ring-fg/20' : 'hover:bg-subtle', locked && 'opacity-50')}>
                    <span className={cn('grid size-4 place-items-center rounded-[5px] border', on ? 'border-fg bg-fg text-bg' : 'border-border-strong')}>{on && <Check className="size-3" strokeWidth={3} />}</span>
                    <Avatar name={s!.name} size="sm" /><span className="min-w-0 flex-1 truncate">{s!.name}<span className="ml-2 font-mono text-2xs text-faint">{s!.roll}</span></span>
                    {view === 'assigned' && <span className="text-2xs text-faint">{locked ? `movable ${fmtDate(movableAt(l.assigned[s!.id], rules))}` : `since ${fmtDate(l.assigned[s!.id])}`}</span>}
                  </button></li>
                );
              })}
              {!shown.length && <li className="py-8 text-center text-sm text-muted">No students here.</li>}
            </ul>
          </>
        )}
      </div>
    </Dialog>
  );
}

// ---------- My store (paid add-on) ----------
function MyStore() {
  const { mine, orders, coupons, addon, rules, addCoupon } = useShop();
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [upgrade, setUpgrade] = useState<string | null>(null);
  const [coupon, setCoupon] = useState({ code: '', percent: 10, limit: 50 });
  const revenue = orders.reduce((a, o) => a + o.amount, 0);
  return (
    <div className="space-y-5">
      {!addon && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-fg p-4 text-bg">
          <span className="grid size-10 place-items-center rounded-full bg-pop text-pop-fg"><Lock className="size-4" /></span>
          <div className="min-w-0 flex-1"><div className="font-semibold">Preview · Academy Store is an add-on</div><div className="text-xs opacity-70">Prepare products as drafts now. Unlock to publish them and start selling. {inr(rules.addonPrice)}/month.</div></div>
          <Button variant="secondary" className="border-transparent bg-pop text-pop-fg hover:bg-pop/90" onClick={() => setUpgrade('')}><Sparkles /> Unlock</Button>
        </div>
      )}
      <section>
        <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Products</h3><Button size="sm" variant="primary" onClick={() => setEditing('new')}><Plus /> New product</Button></div>
        <Table>
          <thead><tr><Th>Product</Th><Th>Course</Th><Th className="text-right">Price</Th><Th>Status</Th></tr></thead>
          <tbody>{mine.map((p) => (
            <tr key={p.id} onClick={() => setEditing(p)} className="cursor-pointer hover:bg-subtle/70">
              <Td><span className="flex items-center gap-3"><Cover p={p} className="h-10 w-8 p-1.5 [&>span]:hidden [&_svg]:size-3" /><span className="min-w-0"><span className="block truncate font-semibold">{p.title}</span><span className="text-2xs text-muted">{TYPE_LABEL[p.type]} · {p.subject}</span></span></span></Td>
              <Td className="text-xs text-muted">{p.course}</Td><Td className="text-right font-semibold">{inr(p.price)}</Td>
              <Td><Badge tone={p.status === 'live' && addon ? 'pop' : 'neutral'}>{p.status === 'live' && addon ? 'Live' : 'Draft'}</Badge></Td>
            </tr>
          ))}</tbody>
        </Table>
      </section>
      <div className={cn('grid gap-5 lg:grid-cols-2', !addon && 'pointer-events-none select-none opacity-50')} aria-hidden={!addon}>
        <section>
          <h3 className="mb-2 font-semibold">Orders <span className="text-xs font-normal text-muted">· {inr(revenue)} in sales{rules.payout === 'parallax' ? `, ${rules.commission}% commission` : ''}</span></h3>
          <ul className="space-y-1">{orders.slice(0, 8).map((o) => <li key={o.id} className="flex items-center gap-3 rounded-xl bg-subtle px-3 py-2 text-sm"><Avatar name={o.student} size="sm" /><span className="flex-1 truncate">{o.student}</span><span className="text-2xs text-faint">{fmtDate(o.at)}</span><b>{inr(o.amount)}</b></li>)}</ul>
        </section>
        <section>
          <h3 className="mb-2 font-semibold">Coupons</h3>
          <form className="mb-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!coupon.code.trim()) return; addCoupon({ ...coupon, code: coupon.code.trim().toUpperCase() }); setCoupon({ code: '', percent: 10, limit: 50 }); }}>
            <Input value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value })} placeholder="CODE" className="uppercase" />
            <Input type="number" aria-label="Percent off" value={coupon.percent} onChange={(e) => setCoupon({ ...coupon, percent: +e.target.value })} className="w-20" />
            <Button type="submit"><Tag /> Add</Button>
          </form>
          <ul className="space-y-1">{coupons.map((c) => <li key={c.id} className="flex items-center gap-3 rounded-xl bg-subtle px-3 py-2 text-sm"><b className="font-mono">{c.code}</b><span className="text-muted">{c.percent}% off</span><span className="ml-auto text-2xs text-faint">{c.used}/{c.limit} used</span></li>)}</ul>
        </section>
      </div>
      {editing && <ProductDialog p={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onLocked={(id) => { setEditing(null); setUpgrade(id); }} />}
      {upgrade !== null && <UpgradeDialog pendingId={upgrade} onClose={() => setUpgrade(null)} />}
    </div>
  );
}

function ProductDialog({ p, onClose, onLocked }: { p: Product | null; onClose: () => void; onLocked: (id: string) => void }) {
  const { saveMine, addon } = useShop();
  const [f, setF] = useState<Omit<Product, 'id'>>(p ?? { title: '', type: 'revision-notes', course: 'CA Inter', subject: '', price: 199, about: '', status: 'draft' });
  const ok = f.title.trim() && f.subject && f.price > 0;
  const save = (status: 'draft' | 'live') => {
    const id = saveMine({ ...f, title: f.title.trim(), status: status === 'live' && addon ? 'live' : 'draft' }, p?.id);
    if (status === 'live' && !addon) return onLocked(id);
    toast.success(status === 'live' ? 'Published to your store' : 'Saved as a draft'); onClose();
  };
  const set = (x: Partial<typeof f>) => setF({ ...f, ...x });
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={p ? 'Edit product' : 'New product'} desc="Ebooks, PDFs, question banks, test series or anything students can study from."
      footer={<><Button onClick={onClose}>Cancel</Button><Button disabled={!ok} onClick={() => save('draft')}>Save draft</Button><Button variant="primary" disabled={!ok} onClick={() => save('live')}>{addon ? 'Publish' : <><Lock className="size-3.5" /> Publish</>}</Button></>}>
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2"><Input autoFocus value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Taxation crash notes" /></Field>
        <Field label="Type"><Select value={f.type} onChange={(e) => set({ type: e.target.value as ProductType })}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Field label="Course"><Select value={f.course} onChange={(e) => set({ course: e.target.value as Course })}>{COURSES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Subject"><Select value={f.subject} onChange={(e) => set({ subject: e.target.value })}><option value="">Choose</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Price (₹)"><Input type="number" min={1} value={f.price} onChange={(e) => set({ price: +e.target.value })} /></Field>
        <Field label="About" className="sm:col-span-2"><Textarea value={f.about} onChange={(e) => set({ about: e.target.value })} placeholder="What students get, pages, chapters covered" /></Field>
        <Field label="File" className="sm:col-span-2" hint="PDFs open in the protected viewer, watermarked with the buyer's name."><Input type="file" accept=".pdf" /></Field>
      </div>
    </Dialog>
  );
}

function UpgradeDialog({ pendingId, onClose }: { pendingId: string; onClose: () => void }) {
  const { rules, unlock, mine, saveMine } = useShop();
  const go = () => {
    unlock();
    const p = mine.find((x) => x.id === pendingId);
    if (p) saveMine({ ...p, status: 'live' }, p.id);
    toast.success('Academy Store unlocked', { description: p ? `“${p.title}” is now live. Sample: no payment taken.` : 'Sample: no payment taken.' });
    onClose();
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} title="Unlock Academy Store to sell" desc="Your draft is saved. Publishing needs the Academy Store add-on."
      footer={<><Button onClick={onClose}>Not now</Button><Button variant="primary" onClick={go}><Sparkles /> Unlock for {inr(rules.addonPrice)}/month</Button></>}>
      <ul className="space-y-2 pb-2 text-sm">
        {['Sell ebooks, PDFs, question banks and test series to your students', 'Your own coupons and storefront page', rules.payout === 'parallax' ? `Payments collected for you; ${rules.commission}% commission per sale` : 'Payments go straight to your own payment account', 'A buy link you can put on your own website'].map((t) => (
          <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-good" />{t}</li>
        ))}
      </ul>
    </Dialog>
  );
}
