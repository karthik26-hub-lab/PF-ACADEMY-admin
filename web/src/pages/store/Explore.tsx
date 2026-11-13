// Explore Store · storefront (rotating hero, shelves, all products), product page and checkout.
import { ArrowRight, BookOpen, CalendarClock, Check, ChevronLeft, ChevronRight, ClipboardCheck, CreditCard, Landmark, ListChecks, Lock, Maximize2, Minimize2, Package, Plus, QrCode, RotateCcw, ShieldCheck, ShoppingCart, Smartphone, Trash2, Users, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button, Dialog, Input, Segmented, Select } from '../../components/ui';
import { navigate } from '../../lib/router';
import { PAY_KIND, PF_TYPE, useShop, validCapacity, type PayKind, type PfProduct, type PfType } from '../../lib/shop';
import { COURSES, inr, useStore, type Course } from '../../lib/store';
import { cn, fmtDate } from '../../lib/utils';
import { SearchBox, TONE } from './shared';

const ICON: Record<PfType, LucideIcon> = { study: BookOpen, revision: RotateCcw, qbank: ListChecks, tests: ClipboardCheck, bundle: Package };
const DAY = 86400e3;
const isNew = (p: PfProduct) => Date.now() - p.updatedAt < 7 * DAY;
// Cover (page 0) and sample pages (1-3) rendered from Parallax Flow's PDFs. Missing images fall back to the drawn cover.
const ART = import.meta.glob<string>('../../assets/store/*.webp', { eager: true, query: '?url', import: 'default' });
const page = (p: PfProduct, i: number): string | undefined => (p.art ? ART[`../../assets/store/${p.art}-${i}.webp`] : undefined);

/** The front cover: the real first page when we have it, otherwise a clean drawn cover in the type's colour. */
function BookCover({ p, className }: { p: PfProduct; className?: string }) {
  const Icon = ICON[p.type], img = page(p, 0);
  return (
    <div className={cn('relative aspect-[3/4] overflow-hidden rounded-r-md rounded-l-sm', img ? 'bg-white' : cn('tone-soft flex flex-col p-4 pl-6', TONE[p.type]), className)}>
      {img ? <img src={img} alt={`Cover of ${p.title}`} loading="lazy" decoding="async" className="size-full object-cover object-top" /> : <>
        <span className="tone-bar absolute inset-y-0 left-0 w-2 opacity-80" />
        <Icon className="size-4 opacity-70" />
        <div className="mt-auto line-clamp-3 text-lg font-bold leading-[1.1] tracking-tight">{p.title}</div>
        <div className="mt-1.5 truncate text-2xs opacity-70">{p.subject} · {p.course}</div>
      </>}
      <span className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/5 to-transparent" />
    </div>
  );
}

/** A book that opens on hover: the cover swings back on its spine and shows the first inside page. */
function Book({ p }: { p: PfProduct }) {
  const inside = page(p, 1);
  return (
    <div className="relative aspect-[3/4] [perspective:1100px]">
      <div className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-r-md rounded-l-sm bg-border-strong" />
      <div className="absolute inset-0 overflow-hidden rounded-r-md rounded-l-sm bg-white ring-1 ring-inset ring-black/5">
        {inside ? <img src={inside} alt="" loading="lazy" decoding="async" className="size-full object-cover object-top" />
          : <div className="space-y-2 p-5 pl-8">{[90, 70, 85, 60, 80, 50, 75].map((w, i) => <span key={i} className="block h-1.5 rounded-full bg-black/10" style={{ width: `${w}%` }} />)}</div>}
        <span className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/20 to-transparent" />
      </div>
      <div className="absolute inset-0 origin-left shadow-[0_1px_2px_rgba(0,0,0,0.1),0_14px_28px_-16px_rgba(0,0,0,0.45)] transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] [transform-style:preserve-3d] group-hover:[transform:rotateY(-48deg)] motion-reduce:transition-none">
        <BookCover p={p} className="size-full" />
      </div>
    </div>
  );
}

/** Capacity (students) with quick picks and the live price. */
function CapacityBuy({ p, onDone }: { p: PfProduct; onDone?: () => void }) {
  const { cart, setCart } = useShop();
  const inCart = cart.find((l) => l.productId === p.id);
  const [raw, setRaw] = useState(inCart ? String(inCart.qty) : '');
  const ok = validCapacity(raw);
  const add = () => { setCart(p.id, +raw); toast.success(`${p.title} · ${raw} students in cart`); onDone?.(); };
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 text-xs font-medium">How many students?</div>
        <div className="flex flex-wrap gap-1.5">{[50, 100, 200, 500].map((n) => (
          <button key={n} type="button" onClick={() => setRaw(String(n))} className={cn('h-9 rounded-full px-3.5 text-xs font-semibold ring-1 ring-inset transition-colors', raw === String(n) ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg')}>{n}</button>
        ))}<Input inputMode="numeric" aria-label="Required student capacity" placeholder="Other" value={raw} onChange={(e) => setRaw(e.target.value)} className="h-9 w-24" /></div>
        {raw && !ok && <p className="mt-1 text-2xs text-bad">Enter a positive whole number.</p>}
      </div>
      <div className="flex items-end justify-between gap-3 rounded-xl bg-panel p-3 ring-1 ring-inset ring-border">
        <div><div className="text-2xs text-muted">{ok ? `${raw} × ${inr(p.price)}` : 'Total'}</div><div className="tnum text-2xl font-bold leading-[1.1]">{ok ? inr(+raw * p.price) : '—'}</div></div>
        <Button variant="primary" disabled={!ok} onClick={add}><ShoppingCart />{inCart ? 'Update cart' : 'Add to cart'}</Button>
      </div>
    </div>
  );
}

const SORTS = { recommended: 'Recommended', newest: 'Recently updated', low: 'Price: low to high', high: 'Price: high to low' } as const;
const pagesOrChapters = (p: PfProduct) => (p.pages ? `${p.pages} pages` : `${p.chapters.length} ${p.chapters.length === 1 ? 'chapter' : 'chapters'}`);

/** One product: the opening book, title, subject, price and a round add button. */
function ProductCard({ p, onOpen, className }: { p: PfProduct; onOpen: (p: PfProduct) => void; className?: string }) {
  const qty = useShop((s) => s.cart.find((l) => l.productId === p.id)?.qty);
  return (
    <article className={cn('group flex flex-col', className)}>
      <button type="button" onClick={() => onOpen(p)} className="relative block text-left" aria-label={`Open ${p.title}`}>
        <Book p={p} />
        {isNew(p) && <span className="absolute right-2 top-2 rounded-full bg-pop px-2 py-0.5 text-[10px] font-bold text-pop-fg shadow-xs transition-opacity duration-300 group-hover:opacity-0">New</span>}
      </button>
      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{p.title}</h3>
      <div className="mt-0.5 truncate text-2xs text-muted">{PF_TYPE[p.type]} · {pagesOrChapters(p)}</div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span><b className="tnum text-[15px]">{inr(p.price)}</b><span className="text-2xs text-muted"> / student</span></span>
        <button type="button" onClick={() => onOpen(p)} aria-label={qty ? `${qty} students in cart, edit` : `Add ${p.title} to cart`}
          className={cn('flex h-8 items-center justify-center gap-1 rounded-full text-xs font-semibold transition-colors', qty ? 'bg-pop px-2.5 text-pop-fg' : 'w-8 bg-subtle text-fg ring-1 ring-inset ring-border-strong hover:bg-fg hover:text-bg')}>
          {qty ? <><Check className="size-3.5" />{qty}</> : <Plus className="size-4" />}
        </button>
      </div>
    </article>
  );
}

/** A titled row of products that scrolls sideways, with arrows on wide screens. */
function Shelf({ title, items, onOpen, onAll }: { title: string; items: PfProduct[]; onOpen: (p: PfProduct) => void; onAll: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  if (items.length < 3) return null;
  const by = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="mb-6">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="flex-1 text-lg font-bold tracking-tight">{title}</h3>
        <button type="button" onClick={onAll} className="text-xs font-semibold text-muted hover:text-fg">See all</button>
        <div className="hidden gap-1 sm:flex">
          <Button size="icon" variant="ghost" className="size-8" aria-label={`Scroll ${title} left`} onClick={() => by(-1)}><ChevronLeft /></Button>
          <Button size="icon" variant="ghost" className="size-8" aria-label={`Scroll ${title} right`} onClick={() => by(1)}><ChevronRight /></Button>
        </div>
      </div>
      <div ref={ref} className="-mx-2 flex snap-x snap-mandatory gap-5 overflow-x-auto px-2 py-4 [scrollbar-width:none]">
        {items.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} className="w-[42%] shrink-0 snap-start sm:w-44" />)}
      </div>
    </section>
  );
}

/** Rotating banner of the main Parallax Flow titles. */
function Hero({ items, onOpen }: { items: PfProduct[]; onOpen: (p: PfProduct) => void }) {
  const [i, setI] = useState(0), p = items[i % items.length];
  useEffect(() => { const t = setTimeout(() => setI((i + 1) % items.length), 6000); return () => clearTimeout(t); }, [i, items.length]);
  return (
    <section className="relative mb-5 overflow-hidden rounded-3xl bg-[hsl(240_6%_9%)] text-white ring-1 ring-inset ring-white/10">
      <span aria-hidden className="absolute -left-24 -top-28 size-80 rounded-full bg-pop opacity-[0.16] blur-3xl" />
      <div key={p.id} className="relative grid animate-fade-in gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
        <div className="max-w-lg">
          <span className="rounded-full bg-pop px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pop-fg">Parallax Flow Ignite</span>
          <h2 className="mt-3 text-[28px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[40px]">{p.title}</h2>
          <p className="mt-2 text-sm opacity-70">{PF_TYPE[p.type]} · {p.course} · {p.subject} · {pagesOrChapters(p)}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button className="border-transparent bg-pop text-pop-fg hover:bg-pop/90" onClick={() => onOpen(p)}>See inside <ArrowRight /></Button>
            <span className="text-sm"><b className="tnum text-xl">{inr(p.price)}</b><span className="opacity-60"> per student</span></span>
          </div>
        </div>
        <button type="button" onClick={() => onOpen(p)} className="group relative mx-auto hidden w-44 -rotate-[3deg] md:block" aria-label={`Open ${p.title}`}><Book p={p} /></button>
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-4 right-5 flex gap-1.5">{items.map((x, k) => (
          <button key={x.id} type="button" onClick={() => setI(k)} aria-label={`Show ${x.title}`} className={cn('h-1.5 rounded-full transition-all duration-300', k === i % items.length ? 'w-6 bg-pop' : 'w-1.5 bg-white/30 hover:bg-white/60')} />
        ))}</div>
      )}
    </section>
  );
}

export function Catalogue() {
  const { catalog, cart, rules } = useShop();
  const [course, setCourse] = useState<'all' | Course>('all');
  const [type, setType] = useState<'all' | PfType>('all');
  const [sort, setSort] = useState<keyof typeof SORTS>('recommended');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<PfProduct | null>(null);
  const [checkout, setCheckout] = useState(false);
  const inCourse = catalog.filter((p) => course === 'all' || p.course === course);
  const shown = inCourse.filter((p) => (type === 'all' || p.type === type) && `${p.title} ${p.subject} ${p.chapters.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'newest' ? b.updatedAt - a.updatedAt : sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : Number(!!page(b, 0)) - Number(!!page(a, 0)));
  const real = catalog.filter((p) => page(p, 0)).sort((a, b) => (b.pages ?? 0) - (a.pages ?? 0));
  const browsing = type === 'all' && !q && sort === 'recommended';
  const total = cart.reduce((a, l) => a + l.amount, 0);
  const cats: ['all' | PfType, string][] = [['all', 'Everything'], ...(Object.keys(PF_TYPE) as PfType[]).map((t): [PfType, string] => [t, PF_TYPE[t]])];
  return (
    <>
      <Hero items={real.length ? real.slice(0, 4) : catalog.slice(0, 3)} onOpen={setOpen} />
      <ul className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs text-muted">
        {([[ShieldCheck, 'Protected viewer'], [CalendarClock, `${rules.validityMonths}-month licence`], [Users, `Up to ${rules.cycles} allocation cycles`]] as const).map(([Icon, t]) => (
          <li key={t} className="flex items-center gap-1.5"><Icon className="size-3.5" />{t}</li>
        ))}
      </ul>

      {/* One clean toolbar: categories on the left; course, sort and search on the right */}
      <div className="mb-2 flex flex-col gap-3 border-b border-border pb-3 lg:flex-row lg:items-center">
        <div className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
          {cats.map(([t, label]) => (
            <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={cn('h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold transition-colors', type === t ? 'bg-fg text-bg' : 'text-muted hover:bg-hover hover:text-fg')}>{label}</button>
          ))}
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <Select aria-label="Course" value={course} onChange={(e) => setCourse(e.target.value as 'all' | Course)} className="sm:w-40"><option value="all">All courses</option>{COURSES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
          <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className="sm:w-48">{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
          <SearchBox value={q} onChange={setQ} placeholder="Search titles or chapters" className="col-span-2 sm:w-60" />
        </div>
      </div>

      {browsing && <div className="mt-5">
        <Shelf title="New this week" items={inCourse.filter(isNew)} onOpen={setOpen} onAll={() => setSort('newest')} />
        {[...new Set(inCourse.map((p) => p.subject))].map((s) => <Shelf key={s} title={s} items={inCourse.filter((p) => p.subject === s)} onOpen={setOpen} onAll={() => setQ(s)} />)}
      </div>}

      <div className="mb-1 mt-5 flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold tracking-tight">{browsing ? 'All products' : type !== 'all' ? PF_TYPE[type] : 'Results'}</h3>
        <span className="text-xs text-muted">{shown.length} {shown.length === 1 ? 'product' : 'products'}{course !== 'all' && ` · ${course}`}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-6 py-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((p) => <ProductCard key={p.id} p={p} onOpen={setOpen} />)}
      </div>
      {!shown.length && <p className="py-12 text-center text-sm text-muted">Nothing matches. Try another course or category.</p>}

      {/* Cart */}
      {cart.length > 0 && (
        <div className="sticky bottom-4 z-20 mt-6 flex justify-center">
          <div className="flex animate-pop-in items-center gap-3 rounded-full bg-fg p-1.5 pl-4 text-bg shadow-float">
            <ShoppingCart className="size-4" /><span className="text-sm"><b>{cart.length}</b> in cart · <b className="tnum">{inr(total)}</b></span>
            <Button className="border-transparent bg-pop text-pop-fg hover:bg-pop/90" onClick={() => setCheckout(true)}>Checkout <ArrowRight /></Button>
          </div>
        </div>
      )}
      {open && <ProductDialog key={open.id} p={open} onClose={() => setOpen(null)} />}
      {checkout && <Checkout onClose={() => setCheckout(false)} />}
    </>
  );
}

/** Quick look: a large page viewer on the left (arrows, thumbnails, ← → keys) and a short buy panel on the right. */
function ProductDialog({ p, onClose }: { p: PfProduct; onClose: () => void }) {
  const { rules } = useShop();
  const imgs = [0, 1, 2, 3].map((i) => page(p, i)).filter((x): x is string => !!x);
  const pages: { label: string; view: ReactNode; thumb: ReactNode }[] = imgs.length
    ? imgs.map((src, i) => ({ label: `Page ${i + 1}`, view: <img src={src} alt={`${p.title}, ${i ? `page ${i + 1}` : 'cover'}`} className="max-h-full max-w-full rounded-md object-contain shadow-float" />, thumb: <img src={src} alt="" className="size-full object-cover object-top" /> }))
    : [{ label: 'Cover', view: <BookCover p={p} className="h-full max-w-full shadow-float" />, thumb: <BookCover p={p} className="size-full" /> },
      ...p.preview.map((t, i) => ({ label: `Sample ${i + 1}`, view: <div className="flex aspect-[3/4] h-full max-w-full flex-col justify-center rounded-md bg-white p-8 text-center text-sm text-black shadow-float">{t}</div>, thumb: <div className="size-full bg-white" /> }))];
  const [i, setI] = useState(0);
  const go = (d: number) => setI((x) => Math.min(pages.length - 1, Math.max(0, x + d)));
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });
  // Full screen: the browser's own full screen when allowed, otherwise a full-window view.
  const stageRef = useRef<HTMLDivElement>(null);
  const [native, setNative] = useState(false), [full, setFull] = useState(false);
  useEffect(() => { const on = () => setNative(!!document.fullscreenElement); document.addEventListener('fullscreenchange', on); return () => document.removeEventListener('fullscreenchange', on); }, []);
  const toggleFull = () => {
    if (document.fullscreenElement) return void document.exitFullscreen();
    if (full) return setFull(false);
    const el = stageRef.current;
    // Some embeds block or ignore real full screen; if it hasn't started shortly, use the full-window view.
    el?.requestFullscreen?.().catch(() => {});
    setTimeout(() => !document.fullscreenElement && setFull(true), 300);
  };
  const arrow = 'absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-panel/90 text-fg shadow-float ring-1 ring-border backdrop-blur transition disabled:opacity-0';
  const big = native || full;
  /** The page with its arrows and the "Page X of Y" pill (which holds the full-screen button). */
  const stage = (className: string, ref?: React.Ref<HTMLDivElement>) => (
    <div ref={ref} className={cn('relative overflow-hidden bg-subtle [&:fullscreen]:bg-[hsl(240_6%_9%)]', className)}>
      <div key={i} className={cn('absolute inset-x-14 top-5 flex animate-fade-in items-center justify-center', big ? 'bottom-16' : 'bottom-12')}>{pages[i].view}</div>
      <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous page" className={cn(arrow, 'left-3')}><ChevronLeft className="size-5" /></button>
      <button type="button" onClick={() => go(1)} disabled={i === pages.length - 1} aria-label="Next page" className={cn(arrow, 'right-3')}><ChevronRight className="size-5" /></button>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center rounded-full bg-black/75 text-white backdrop-blur">
        <span className="py-1 pl-3 pr-2 text-[11px] font-semibold">{pages[i].label}{p.pages ? ` of ${p.pages}` : ''}</span>
        <button type="button" onClick={toggleFull} aria-label={big ? 'Exit full screen' : 'View full screen'} title={big ? 'Exit full screen' : 'Full screen'} className="grid size-7 place-items-center rounded-full border-l border-white/20 hover:bg-white/15">
          {big ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
        </button>
      </div>
    </div>
  );
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} title={p.title} desc={`${PF_TYPE[p.type]} · ${p.course} · ${p.subject}`} className="top-[4vh] max-h-[92vh] max-w-5xl">
      <div className="grid gap-6 pb-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {/* Stage: the page always fits inside the rounded box, clear of the arrows and the page label */}
          {stage('h-[52vh] min-h-[320px] rounded-2xl', stageRef)}
          {/* Thumbnails: centred under the stage, with room for the selected ring */}
          <div className="mx-auto mt-3 flex w-fit max-w-full gap-2 overflow-x-auto p-1 [scrollbar-width:none] sm:gap-2.5">
            {pages.map((x, k) => (
              <button key={x.label} type="button" onClick={() => setI(k)} aria-label={`Show ${x.label}`} className={cn('h-[60px] w-[45px] shrink-0 overflow-hidden rounded-md bg-white sm:h-[72px] sm:w-[54px] ring-1 ring-border transition', k === i ? 'ring-2 ring-fg ring-offset-2 ring-offset-panel' : 'opacity-60 hover:opacity-100')}>{x.thumb}</button>
            ))}
            {p.pages && p.pages > pages.length && <span className="grid h-[60px] w-[45px] shrink-0 sm:h-[72px] sm:w-[54px] place-items-center rounded-md bg-subtle text-center text-[10px] font-semibold leading-tight text-muted ring-1 ring-inset ring-border">+{p.pages - pages.length}<br />pages</span>}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <p className="text-sm text-muted">{p.about}</p>
          <div><b className="tnum text-[28px] leading-none">{inr(p.price)}</b> <span className="text-sm text-muted">per student</span></div>
          <CapacityBuy p={p} onDone={onClose} />
          <section>
            <h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">What's inside</h4>
            <ol className="divide-y divide-border text-sm">{p.chapters.map((c, k) => <li key={c} className="flex gap-3 py-1.5"><span className="tnum w-4 text-faint">{k + 1}</span>{c}</li>)}</ol>
          </section>
          <p className="mt-auto text-2xs text-muted">{rules.validityMonths}-month licence · up to {p.cycles} allocation cycles · protected viewer, no downloads</p>
        </div>
      </div>
      {full && (
        <Dialog open onOpenChange={(v) => !v && setFull(false)} title={`${p.title} · ${pages[i].label}`} className="top-0 h-[100dvh] max-h-none w-screen max-w-none rounded-none">
          {stage('h-[calc(100dvh-92px)] rounded-xl')}
        </Dialog>
      )}
    </Dialog>
  );
}

/** Checkout: the order grouped by course, billing details locked from the academy profile, and payment. */
function Checkout({ onClose }: { onClose: () => void }) {
  const { cart, catalog, setCart, checkout } = useShop();
  const { academy, me } = useStore();
  const [pay, setPay] = useState<Pay>(null);
  // Billing comes from the academy's account; it is shown, not edited, so the invoice always matches it.
  const billing = { academy: academy.name, gstin: academy.gstin, address: academy.address, contact: me.name, email: academy.email, phone: academy.phone, method: '' };
  const lines = cart.map((l) => ({ ...l, p: catalog.find((p) => p.id === l.productId)! })).filter((l) => l.p);
  const total = lines.reduce((a, l) => a + l.amount, 0);
  const pay_ = () => { if (!pay) return; const id = checkout(billing, pay, pay.save); toast.success(`Order ${id} paid`, { description: 'Sample payment, nothing charged. Allocate students in Licences & access.' }); onClose(); navigate({ page: 'store', tab: 'licences' }); };
  const h4 = 'mb-2 text-2xs font-semibold uppercase tracking-wide text-faint';
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title="Checkout" desc="Review your order, confirm billing and pay."
      footer={<><Button onClick={onClose}>Back</Button><Button variant="primary" disabled={!lines.length || !pay} onClick={pay_}>Pay {inr(total)}</Button></>}>
      <div className="space-y-6 pb-2">
        <section>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <h4 className="mr-auto text-2xs font-semibold uppercase tracking-wide text-faint">Your order</h4>
            {COURSES.map((c) => { const n = lines.filter((l) => l.p.course === c).length; return n ? <span key={c} className="rounded-full bg-subtle px-2.5 py-1 text-2xs font-semibold ring-1 ring-inset ring-border">{c.replace('CA ', '')} · {n}</span> : null; })}
          </div>
          {COURSES.filter((c) => lines.some((l) => l.p.course === c)).map((c) => (
            <div key={c} className="mb-3 overflow-hidden rounded-xl ring-1 ring-inset ring-border">
              <div className="bg-subtle px-3 py-1.5 text-xs font-semibold">{c}</div>
              <ul className="divide-y divide-border">{lines.filter((l) => l.p.course === c).map((l) => (
                <li key={l.productId} className="flex items-center gap-3 px-3 py-2.5">
                  {(() => { const img = page(l.p, 0), Icon = ICON[l.p.type]; return img ? <img src={img} alt="" className="h-12 w-9 shrink-0 rounded-sm object-cover object-top ring-1 ring-border" /> : <span className={cn('tone-soft grid h-12 w-9 shrink-0 place-items-center rounded-sm', TONE[l.p.type])}><Icon className="size-3.5" /></span>; })()}
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{l.p.title}</div><div className="text-2xs text-muted">{PF_TYPE[l.p.type]} · {l.qty} students × {inr(l.p.price)}</div></div>
                  <b className="tnum text-sm">{inr(l.amount)}</b>
                  <button type="button" onClick={() => setCart(l.productId, 0)} aria-label={`Remove ${l.p.title}`} className="text-muted hover:text-fg"><Trash2 className="size-4" /></button>
                </li>
              ))}</ul>
            </div>
          ))}
          {!lines.length && <p className="rounded-xl bg-subtle p-4 text-center text-sm text-muted">Your cart is empty.</p>}
        </section>

        <section>
          <h4 className={h4}>Billing details</h4>
          <div className="rounded-xl bg-subtle p-4">
            <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
              {([['Academy name', billing.academy], ['GSTIN', billing.gstin], ['Billing address', billing.address], ['Contact person', billing.contact], ['Email address', billing.email], ['Phone number', billing.phone]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-2xs text-muted">{k}</dt><dd className="font-medium">{v || '—'}</dd></div>
              ))}
            </dl>
            <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-3 text-2xs text-muted"><Lock className="mt-0.5 size-3 shrink-0" />Filled in from your academy account. Your invoice shows these details exactly. To change them, contact Parallax Flow.</p>
          </div>
        </section>

        <section>
          <h4 className={h4}>Pay with</h4>
          <PayWith onChange={setPay} />
        </section>

        <section className="flex items-end justify-between gap-4 border-t border-border pt-4">
          <span className="min-w-0 truncate text-xs text-muted">{pay ? `${PAY_KIND[pay.kind]} · ${pay.label}` : 'Choose how to pay'}</span>
          <div className="shrink-0 text-right"><div className="text-2xs text-muted">Total payable</div><div className="tnum text-[28px] font-bold leading-none">{inr(total)}</div></div>
        </section>
      </div>
    </Dialog>
  );
}

// ---------- Pay with ----------
const PAY_ICON: Record<PayKind, LucideIcon> = { upi: Smartphone, card: CreditCard, netbanking: Landmark };
const TOP_BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank'];
const ALL_BANKS = [...TOP_BANKS, 'Bank of Baroda', 'Canara Bank', 'Federal Bank', 'IDFC FIRST Bank', 'Indian Bank', 'IndusInd Bank', 'Punjab National Bank', 'Union Bank of India', 'Yes Bank'];
const validUpi = (v: string) => /^[\w.-]{2,}@[a-z]{2,}$/i.test(v.trim());
export type Pay = { kind: PayKind; label: string; save: boolean } | null;

/**
 * Saved methods first (last used is picked), or a new UPI / card / net banking payment.
 * Card numbers are never typed here: the gateway's secure page takes them and returns only the last four digits.
 */
function PayWith({ onChange }: { onChange: (p: Pay) => void }) {
  const { methods, removeMethod } = useShop();
  const saved = [...methods].sort((a, b) => b.lastUsed - a.lastUsed);
  const [pick, setPick] = useState<string | 'new'>(saved[0]?.id ?? 'new');
  const [kind, setKind] = useState<PayKind>('upi');
  const [upi, setUpi] = useState(''), [qr, setQr] = useState(false), [bank, setBank] = useState(''), [save, setSave] = useState(true);
  const last4 = useState(() => String(1000 + Math.floor(Math.random() * 9000)))[0];

  useEffect(() => {
    const s = saved.find((m) => m.id === pick);
    if (s) return onChange({ kind: s.kind, label: s.label, save: false });
    const label = kind === 'upi' ? (qr ? 'QR code' : validUpi(upi) ? upi.trim() : '') : kind === 'card' ? `Card •••• ${last4}` : bank;
    onChange(label ? { kind, label, save: save && !(kind === 'upi' && qr) } : null);
  }, [pick, kind, upi, qr, bank, save, methods.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const chip = (on: boolean) => cn('rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-inset transition-colors', on ? 'bg-fg text-bg ring-fg' : 'bg-panel text-muted ring-border-strong hover:text-fg');
  return (
    <div className="space-y-2">
      {saved.map((m, k) => {
        const Icon = PAY_ICON[m.kind], on = pick === m.id;
        return (
          <label key={m.id} className={cn('flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 ring-inset transition-colors', on ? 'bg-panel ring-2 ring-fg' : 'bg-subtle ring-border hover:ring-border-strong')}>
            <input type="radio" name="pay" className="sr-only" checked={on} onChange={() => setPick(m.id)} />
            <span className={cn('grid size-4 shrink-0 place-items-center rounded-full ring-1 ring-inset', on ? 'bg-fg ring-fg' : 'ring-border-strong')}>{on && <span className="size-1.5 rounded-full bg-bg" />}</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-panel ring-1 ring-border"><Icon className="size-4" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{PAY_KIND[m.kind]} · {m.label}</span><span className="block text-2xs text-muted">Used {fmtDate(m.lastUsed)}</span></span>
            {k === 0 && <span className="rounded-full bg-pop px-2 py-0.5 text-[10px] font-bold text-pop-fg">Last used</span>}
            <button type="button" onClick={(e) => { e.preventDefault(); removeMethod(m.id); if (on) setPick(saved.find((x) => x.id !== m.id)?.id ?? 'new'); }} aria-label={`Remove ${m.label}`} className="grid size-7 place-items-center rounded-full text-faint hover:bg-hover hover:text-fg"><X className="size-3.5" /></button>
          </label>
        );
      })}

      {pick !== 'new' ? (
        <button type="button" onClick={() => setPick('new')} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm font-semibold text-muted border border-dashed border-border-strong hover:text-fg"><Plus className="size-4" /> Use another method</button>
      ) : (
        <div className="space-y-3 rounded-xl p-3 ring-1 ring-inset ring-border">
          <div className="flex items-center gap-2">
            <Segmented value={kind} onChange={setKind} className="flex-1" options={(Object.keys(PAY_KIND) as PayKind[]).map((k) => { const Icon = PAY_ICON[k]; return { value: k, label: <><Icon className="size-3.5" />{PAY_KIND[k]}</> }; })} />
            {saved.length > 0 && <Button size="sm" variant="ghost" onClick={() => setPick(saved[0].id)}>Cancel</Button>}
          </div>

          {kind === 'upi' && (qr ? (
            <div className="flex items-center gap-4 rounded-xl bg-subtle p-3">
              <span className="grid size-24 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-border"><QrCode className="size-16 text-black" strokeWidth={1.25} /></span>
              <div className="text-xs text-muted"><b className="block text-sm text-fg">Scan to pay</b>Open GPay, PhonePe, Paytm or any UPI app and scan. The QR appears from the payment gateway after you press Pay.<button type="button" onClick={() => setQr(false)} className="mt-1.5 block font-semibold text-fg underline">Enter UPI ID instead</button></div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2"><Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@bank" aria-label="UPI ID" className="flex-1" /><Button onClick={() => setQr(true)}><QrCode /> Pay by QR</Button></div>
              <p className={cn('text-2xs', upi && !validUpi(upi) ? 'text-bad' : 'text-muted')}>{upi && !validUpi(upi) ? 'Enter a UPI ID like name@okaxis.' : 'You will approve the payment in your UPI app.'}</p>
            </div>
          ))}

          {kind === 'card' && (
            <div className="rounded-xl bg-subtle p-3 text-xs text-muted">
              <div className="mb-2 flex gap-1.5">{['VISA', 'Mastercard', 'RuPay', 'Amex'].map((b) => <span key={b} className="rounded-md bg-panel px-2 py-1 text-[10px] font-bold tracking-wide text-fg ring-1 ring-border">{b}</span>)}</div>
              <span className="flex gap-1.5"><Lock className="mt-0.5 size-3 shrink-0" />You'll enter card details on the payment gateway's secure page. Parallax Flow never sees or stores your card number; a saved card shows only its last four digits.</span>
            </div>
          )}

          {kind === 'netbanking' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{TOP_BANKS.map((b) => <button key={b} type="button" onClick={() => setBank(b)} className={chip(bank === b)}>{b}</button>)}</div>
              <Select aria-label="All banks" value={ALL_BANKS.includes(bank) && !TOP_BANKS.includes(bank) ? bank : ''} onChange={(e) => setBank(e.target.value)}><option value="">Other banks…</option>{ALL_BANKS.filter((b) => !TOP_BANKS.includes(b)).map((b) => <option key={b}>{b}</option>)}</Select>
            </div>
          )}

          {!(kind === 'upi' && qr) && (
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="size-4 accent-[hsl(var(--fg))]" />Save this method for next time</label>
          )}
        </div>
      )}
    </div>
  );
}
