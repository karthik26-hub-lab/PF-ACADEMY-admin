// Store, following the client's "Store Map":
//  · Explore Store — the academy buys Parallax Flow products for a number of students (capacity),
//    then allocates them in cycles. Each cycle allows `capacity` unique students.
//  · My Store — the academy sells its own products, bundles and offers to its students (paid add-on).
// Every business number lives in `rules` (Settings → Store rules).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid, type Course } from './store';

// ---------- Types ----------
export type PfType = 'study' | 'revision' | 'qbank' | 'tests' | 'bundle';
export const PF_TYPE: Record<PfType, string> = { study: 'Study material', revision: 'Revision material', qbank: 'Question bank', tests: 'Test series', bundle: 'Bundle' };
export type MyType = 'ebook' | 'tests' | 'qbank' | 'bundle';
export const MY_TYPE: Record<MyType, string> = { ebook: 'E-book / PDF', tests: 'Test series', qbank: 'Question bank', bundle: 'Bundle' };

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'partial-refund' | 'refunded';
export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: 'neutral' | 'warn' | 'pop' | 'bad' }> = {
  pending: { label: 'Pending payment', tone: 'warn' }, processing: { label: 'Payment processing', tone: 'warn' }, completed: { label: 'Completed', tone: 'pop' },
  failed: { label: 'Failed', tone: 'bad' }, cancelled: { label: 'Cancelled', tone: 'neutral' }, 'partial-refund': { label: 'Partially refunded', tone: 'warn' }, refunded: { label: 'Refunded', tone: 'neutral' },
};

export interface PfProduct { id: string; title: string; type: PfType; course: Course; subject: string; chapters: string[]; about: string; price: number; updatedAt: number; cycles: number; preview: string[]; pages?: number; art?: string }
export interface Line { productId: string; qty: number; amount: number }
export interface Billing { academy: string; gstin: string; address: string; contact: string; email: string; phone: string; method: string }
/** A payment method remembered after a successful payment. Cards are kept by the gateway; we only hold the last four digits. */
export type PayKind = 'upi' | 'card' | 'netbanking';
export interface SavedMethod { id: string; kind: PayKind; label: string; lastUsed: number }
export const PAY_KIND: Record<PayKind, string> = { upi: 'UPI', card: 'Card', netbanking: 'Net banking' };
export interface Purchase { id: string; at: number; lines: Line[]; subtotal: number; discount: number; total: number; status: OrderStatus; method: string; txn: string; billing?: Billing }
export interface Cycle { n: number; startedAt: number; completedAt?: number; students: string[] }
export interface LogEntry { at: number; action: 'allocated' | 'revoked'; studentIds: string[] }
export interface Licence { id: string; productId: string; orderId: string; capacity: number; maxCycles: number; activatedAt: number; expiresAt: number; cycles: Cycle[]; active: Record<string, number>; log: LogEntry[] }

export type ProductStatus = 'published' | 'draft' | 'scheduled' | 'unpublished' | 'archived';
export interface MyProduct {
  id: string; title: string; type: MyType; course: Course; subject: string; chapters: string[]; short: string; detail: string; code: string;
  status: ProductStatus; publishAt?: string; updatedAt: number;
  content: Record<string, string | boolean>;           // type-specific fields from step 2
  free: boolean; price: number; discounted?: number; limited: boolean; stock?: number; perStudent?: number; saleFrom?: string; saleTo?: string;
  who: 'all' | 'batches' | 'courses'; whoIds: string[];
  items?: string[];                                     // bundles: the products inside
}
export interface Offer { id: string; name: string; code: string; auto: boolean; kind: 'percent' | 'fixed'; value: number; products: string[]; minOrder?: number; maxDiscount?: number; limit: number; perStudent: number; from: string; to: string; who: MyProduct['who']; whoIds: string[]; active: boolean; used: number }
export interface Sale { id: string; at: number; studentId: string; lines: Line[]; subtotal: number; discount: number; total: number; status: OrderStatus; method: string; txn: string; refund: number }
export interface Rules { validityMonths: number; cycles: number; payout: 'parallax' | 'academy'; commission: number; addonPrice: number }

const DAY = 86400e3;
export const DEFAULT_RULES: Rules = { validityMonths: 12, cycles: 3, payout: 'parallax', commission: 15, addonPrice: 2999 };

// ---------- Helpers ----------
/** Capacity must be a positive whole number: no decimals, fractions, zero or negatives. */
export const validCapacity = (raw: string) => /^[1-9]\d*$/.test(raw.trim());
/** Prices are final: the total is the subtotal less any discount (no GST is added). */
export const orderTotal = (subtotal: number, discount = 0) => {
  return { subtotal, discount, total: Math.max(0, subtotal - discount) };
};
export const current = (l: Licence) => l.cycles[l.cycles.length - 1];
export const licenceStatus = (l: Licence) => (Date.now() > l.expiresAt ? 'Expired' : 'Active');
/**
 * What "Allocate" may do right now, so the screen can guide the academy:
 *  · places left in this cycle → share up to that many new students;
 *  · cycle full but someone was revoked → the next cycle starts; active students carry over, freed seats become new places;
 *  · cycle full and every seat taken, or no cycles left → revoke first (or nothing more to share).
 */
export function allocState(l: Licence) {
  const c = current(l), active = Object.keys(l.active).length, freeSeats = l.capacity - active, placesLeft = l.capacity - c.students.length;
  if (Date.now() > l.expiresAt) return { can: false, limit: 0, note: 'This licence has expired.' };
  if (placesLeft > 0) return { can: true, limit: placesLeft, note: `Cycle ${c.n} of ${l.maxCycles} · ${placesLeft} ${placesLeft === 1 ? 'place' : 'places'} left in this cycle` };
  if (c.n >= l.maxCycles) return { can: false, limit: 0, note: `All ${l.maxCycles} cycles are used.` };
  if (freeSeats === 0) return { can: false, limit: 0, note: `Cycle ${c.n} is full. Revoke access first to share with the next group.` };
  return { can: true, limit: freeSeats, note: `This starts Cycle ${c.n + 1} of ${l.maxCycles} · ${active} active ${active === 1 ? 'student carries' : 'students carry'} over · ${freeSeats} new ${freeSeats === 1 ? 'place' : 'places'}` };
}
export const myPrice =(p: MyProduct) => (p.free ? 0 : p.discounted ?? p.price);

/**
 * Allocation rule from the Store Map:
 * - each cycle allows `capacity` unique students; giving access back to someone already in this cycle is free;
 * - revoking frees the seat but not the unique place;
 * - when a cycle is full, the next one starts (students still active carry over into it).
 * Returns the ids that could not be allocated.
 */
function allocate(l: Licence, ids: string[], now: number): { licence: Licence; blocked: string[] } {
  let cycles = [...l.cycles];
  const active = { ...l.active }, added: string[] = [], blocked: string[] = [];
  for (const id of ids) {
    if (active[id]) continue;
    let c = cycles[cycles.length - 1];
    if (!c.students.includes(id) && c.students.length >= l.capacity) {
      // A new cycle needs a free seat (someone revoked) and a cycle left to start.
      if (cycles.length >= l.maxCycles || Object.keys(active).length >= l.capacity) { blocked.push(id); continue; }
      cycles = [...cycles.slice(0, -1), { ...c, completedAt: now }, { n: c.n + 1, startedAt: now, students: Object.keys(active) }];
      c = cycles[cycles.length - 1];
    }
    if (!c.students.includes(id)) cycles = [...cycles.slice(0, -1), { ...c, students: [...c.students, id] }];
    active[id] = now; added.push(id);
  }
  const log = added.length ? [{ at: now, action: 'allocated' as const, studentIds: added }, ...l.log] : l.log;
  return { licence: { ...l, cycles, active, log }, blocked };
}

// ---------- Sample data ----------
const ago = (d: number) => Date.now() - d * DAY;
const pf = (id: string, title: string, type: PfType, course: Course, subject: string, chapters: string[], price: number, about: string, updated: number): PfProduct =>
  ({ id, title, type, course, subject, chapters, price, about, updatedAt: ago(updated), cycles: 3, preview: [`Sample from ${chapters[0]}`, 'Page 1 of the contents', 'One worked example with solution'] });
/** A Parallax Flow "Ignite" visual-notes title: its cover and sample pages come from assets/store/<art>-<page>.webp. */
const ignite = (id: string, title: string, type: PfType, subject: string, chapters: string[], price: number, about: string, updated: number, pages: number, art: string): PfProduct =>
  ({ ...pf(id, title, type, 'CA Inter', subject, chapters, price, about, updated), pages, art });
const CATALOG: PfProduct[] = [
  pf('p1', 'AS 10 Question Bank', 'qbank', 'CA Inter', 'Accounting', ['AS 10 – Property, Plant & Equipment'], 10, 'Every past-paper and RTP question on AS 10, with ICAI-style answers.', 6),
  pf('p2', 'AS 11 Question Bank', 'qbank', 'CA Inter', 'Accounting', ['AS 11 – Foreign Exchange'], 10, 'Practice questions on foreign exchange transactions.', 12),
  ignite('p3', 'Audit Strategy, Planning and Programme', 'study', 'Auditing & Ethics', ['Audit strategy and plan', 'SA 300 – Planning an audit', 'Audit programme'], 12, 'The chapter as visual notes: strategy, plan and programme, with a chapter roadmap, comparison tables and key takeaways.', 3, 28, 'audit-strategy'),
  ignite('p4', 'Supply under GST', 'revision', 'Taxation', ['Section 7 – Meaning of supply', 'Schedule I – Supply without consideration', 'Schedule II – Goods or services'], 8, 'One-page Ignite revision sheets on the scope of supply, with circulars and worked examples.', 20, 7, 'gst-supply'),
  pf('p5', 'Audit Test Series', 'tests', 'CA Inter', 'Auditing & Ethics', ['Standards on Auditing', 'Audit Report'], 15, 'Subject-wise tests with model answers and marking.', 9),
  ignite('p6', 'Nature, Scope and Objectives of Audit', 'study', 'Auditing & Ethics', ['Origin and history of auditing', 'Meaning, nature and aspects of audit', 'Relationship with other disciplines', 'Objectives of the auditor (SA 200)'], 12, 'The full chapter as visual notes, from the history of auditing to the auditor’s objectives under SA 200.', 4, 34, 'audit-nature'),
  pf('p7', 'Company Law Question Bank', 'qbank', 'CA Foundation', 'Corporate & Other Laws', ['Share Capital', 'Board Meetings'], 9, 'MCQs and case questions with explanations.', 15),
  pf('p8', 'Foundation Combo', 'bundle', 'CA Foundation', 'All subjects', ['All papers'], 25, 'Question banks and revision material for all four papers.', 5),
  ignite('p9', 'Foundations of Audit', 'study', 'Auditing & Ethics', ['Why the world needs audit', 'What exactly is an audit', 'How an audit works', 'The auditor and the objective of audit'], 8, 'A visual starter on why audits exist and how they work, before the detailed chapters.', 2, 9, 'audit-foundations'),
  ignite('p10', 'Nature, Scope and Objective of Audit – Ignite', 'revision', 'Auditing & Ethics', ['Meaning of audit', 'Books of account and financial statements', 'Financial reporting frameworks', 'Misstatement', 'Objectives under SA 200'], 6, 'The whole chapter revised in seven Ignite pages.', 8, 7, 'audit-nature-ignite'),
  ignite('p11', 'SA 230 – Audit Documentation', 'study', 'Auditing & Ethics', ['Meaning and objective', 'Nature and purpose', 'Form, content and extent', 'Audit file and assembly'], 10, 'Visual notes on SA 230: what to document, why it matters, and how the audit file is put together.', 1, 15, 'sa-230'),
  ignite('p12', 'Introduction to Strategic Management', 'study', 'Strategic Management', ['Management', 'Strategy', 'Strategic management', 'Strategic levels in organisations'], 8, 'Ignite visual notes for the opening chapter of Strategic Management.', 10, 7, 'strategic-management'),
];

function sample() {
  const ids = (from: number, n: number) => Array.from({ length: n }, (_, i) => `s${from + i}`);
  const c1 = ids(1, 100), c2 = ids(101, 70);
  const lic1: Licence = {
    id: 'l1', productId: 'p1', orderId: 'PF-P001', capacity: 100, maxCycles: 3, activatedAt: ago(130), expiresAt: ago(130) + 365 * DAY,
    cycles: [{ n: 1, startedAt: ago(130), completedAt: ago(60), students: c1 }, { n: 2, startedAt: ago(60), students: c2 }],
    active: Object.fromEntries(c2.map((s, i) => [s, ago(60 - (i % 30))])),
    log: [{ at: ago(30), action: 'allocated', studentIds: c2.slice(50) }, { at: ago(60), action: 'allocated', studentIds: c2.slice(0, 50) }, { at: ago(61), action: 'revoked', studentIds: c1 }, { at: ago(100), action: 'allocated', studentIds: c1.slice(70) }, { at: ago(130), action: 'allocated', studentIds: c1.slice(0, 70) }],
  };
  const c3 = ids(300, 120);
  const lic2: Licence = { id: 'l2', productId: 'p3', orderId: 'PF-P002', capacity: 300, maxCycles: 3, activatedAt: ago(40), expiresAt: ago(40) + 365 * DAY, cycles: [{ n: 1, startedAt: ago(40), students: c3 }], active: Object.fromEntries(c3.map((s) => [s, ago(40)])), log: [{ at: ago(40), action: 'allocated', studentIds: c3 }] };
  const order = (id: string, d: number, lines: [string, number][], status: OrderStatus): Purchase => {
    const ls = lines.map(([productId, qty]) => ({ productId, qty, amount: qty * CATALOG.find((p) => p.id === productId)!.price }));
    return { id, at: ago(d), lines: ls, ...orderTotal(ls.reduce((a, l) => a + l.amount, 0)), status, method: 'UPI', txn: status === 'completed' ? `TXN${id.slice(-3)}84Q` : '' };
  };
  const purchases = [
    order('PF-P001', 130, [['p1', 100]], 'completed'), order('PF-P002', 40, [['p3', 300]], 'completed'),
    order('PF-P003', 150, [['p7', 150]], 'completed'), order('PF-P004', 118, [['p4', 80]], 'completed'), order('PF-P005', 95, [['p8', 120]], 'completed'),
    order('PF-P006', 70, [['p6', 200]], 'completed'), order('PF-P007', 52, [['p5', 150]], 'completed'), order('PF-P008', 25, [['p2', 250]], 'completed'),
    order('PF-P009', 12, [['p2', 100], ['p4', 50]], 'pending'), order('PF-P010', 8, [['p5', 200]], 'failed'), order('PF-P011', 4, [['p7', 125]], 'refunded'),
  ].reverse();
  // Every completed order has its licence; the first two are filled in above, the rest start empty.
  const fresh = purchases.filter((o) => o.status === 'completed' && !['PF-P001', 'PF-P002'].includes(o.id)).map((o): Licence => ({
    id: `l-${o.id}`, productId: o.lines[0].productId, orderId: o.id, capacity: o.lines[0].qty, maxCycles: 3, activatedAt: o.at, expiresAt: o.at + 365 * DAY,
    cycles: [{ n: 1, startedAt: o.at, students: [] }], active: {}, log: [],
  }));

  const mp = (id: string, title: string, type: MyType, subject: string, price: number, status: ProductStatus, extra: Partial<MyProduct> = {}): MyProduct =>
    ({ id, title, type, course: 'CA Inter', subject, chapters: [], short: `${title} for CA Inter students.`, detail: '', code: id.toUpperCase(), status, updatedAt: ago(5), content: {}, free: false, price, limited: false, who: 'all', whoIds: [], ...extra });
  const mine = [
    mp('m1', 'Accounts Revision PDF', 'ebook', 'Accounting', 199, 'published', { content: { download: false, watermark: true, version: '2026.2' } }),
    mp('m2', 'GST Test Series', 'tests', 'Indirect Tax Laws', 499, 'published', { content: { scheduled: false, marks: '100', duration: '180' } }),
    mp('m3', 'AS 10 MCQ Bank', 'qbank', 'Accounting', 149, 'draft', { content: { mode: 'practice' } }),
    mp('m4', 'Accounts Mega Pack', 'bundle', 'Accounting', 799, 'published', { items: ['m1', 'm3'] }),
    mp('m5', 'Audit Case Question Bank', 'qbank', 'Auditing & Ethics', 249, 'published', { content: { mode: 'timed' } }),
    mp('m6', 'Foundation Accounts Notes', 'ebook', 'Accounting', 149, 'published', { course: 'CA Foundation', short: 'Foundation Accounts Notes for CA Foundation students.' }),
    mp('m7', 'FR Mock Test Series', 'tests', 'Financial Reporting', 699, 'published', { course: 'CA Final', short: 'FR Mock Test Series for CA Final students.' }),
  ];
  const sales: Sale[] = Array.from({ length: 48 }, (_, i) => {
    const p = mine[[0, 1, 3, 4, 5, 6][i % 6]], st: OrderStatus = i % 17 === 5 ? 'pending' : i % 23 === 7 ? 'refunded' : i % 29 === 9 ? 'failed' : 'completed';
    const b = orderTotal(p.price);
    return { id: `ORD${String(i + 1).padStart(3, '0')}`, at: ago(Math.floor((1 - Math.sqrt(1 - i / 48)) * 170)), studentId: `s${i * 37 + 3}`, lines: [{ productId: p.id, qty: 1, amount: p.price }], ...b, status: st, method: i % 3 ? 'UPI' : 'Card', txn: `pay_${i}x7Q`, refund: st === 'refunded' ? b.total : 0 };
  });
  const offers: Offer[] = [{ id: 'o1', name: 'Diwali Offer', code: 'DIWALI20', auto: false, kind: 'percent', value: 20, products: [], limit: 100, perStudent: 1, from: '2026-10-25', to: '2026-11-15', who: 'all', whoIds: [], active: true, used: 37 }];
  return { licences: [lic1, lic2, ...fresh], purchases, mine, sales, offers };
}

// ---------- Store ----------
interface Shop {
  catalog: PfProduct[]; cart: Line[]; purchases: Purchase[]; licences: Licence[];
  mine: MyProduct[]; offers: Offer[]; sales: Sale[]; rules: Rules; addon: boolean; methods: SavedMethod[];
  setCart: (productId: string, qty: number) => void;
  /** Pays for the cart. `pay` is the method used; `save` remembers it for next time. */
  checkout: (billing: Billing, pay: { kind: PayKind; label: string }, save: boolean) => string;
  removeMethod: (id: string) => void;
  allocate: (licenceId: string, ids: string[]) => string[];
  revoke: (licenceId: string, ids: string[]) => void;
  saveMine: (p: Omit<MyProduct, 'id' | 'updatedAt'>, id?: string) => string;
  setStatus: (id: string, status: ProductStatus) => void;
  duplicate: (id: string) => void;
  saveOffer: (o: Omit<Offer, 'id' | 'used'>, id?: string) => void;
  refund: (saleId: string) => void;
  setRules: (r: Partial<Rules>) => void;
  unlock: () => void;
}
const swap = <T extends { id: string }>(list: T[], id: string, fn: (x: T) => T) => list.map((x) => (x.id === id ? fn(x) : x));

export const useShop = create<Shop>()(persist((set, get) => ({
  catalog: CATALOG, cart: [], rules: DEFAULT_RULES, addon: false, ...sample(),
  methods: [{ id: 'm-nb', kind: 'netbanking', label: 'HDFC Bank', lastUsed: Date.now() - 11 * DAY }, { id: 'm-upi', kind: 'upi', label: 'northstar@okaxis', lastUsed: Date.now() - 40 * DAY }],
  setCart: (productId, qty) => set((s) => {
    const price = s.catalog.find((p) => p.id === productId)!.price, rest = s.cart.filter((l) => l.productId !== productId);
    return { cart: qty > 0 ? [...rest, { productId, qty, amount: qty * price }] : rest };
  }),
  // Sample checkout: payment is marked successful, then one licence per product is created.
  checkout: (billing, pay, save) => {
    const s = get(), now = Date.now(), id = `PF-P${String(s.purchases.length + 1).padStart(3, '0')}`;
    billing = { ...billing, method: `${PAY_KIND[pay.kind]} · ${pay.label}` };
    const order: Purchase = { id, at: now, lines: s.cart, ...orderTotal(s.cart.reduce((a, l) => a + l.amount, 0)), status: 'completed', method: billing.method, txn: `TXN${uid().toUpperCase()}`, billing };
    const licences = s.cart.map((l): Licence => ({ id: uid(), productId: l.productId, orderId: id, capacity: l.qty, maxCycles: s.rules.cycles, activatedAt: now, expiresAt: now + s.rules.validityMonths * 30 * DAY, cycles: [{ n: 1, startedAt: now, students: [] }], active: {}, log: [] }));
    const known = s.methods.find((m) => m.kind === pay.kind && m.label === pay.label);
    const methods = known ? swap(s.methods, known.id, (m) => ({ ...m, lastUsed: now })) : save ? [{ id: uid(), ...pay, lastUsed: now }, ...s.methods] : s.methods;
    set({ purchases: [order, ...s.purchases], licences: [...licences, ...s.licences], cart: [], methods });
    return id;
  },
  removeMethod: (id) => set((s) => ({ methods: s.methods.filter((m) => m.id !== id) })),
  allocate: (licenceId, ids) => {
    const l = get().licences.find((x) => x.id === licenceId)!, r = allocate(l, ids, Date.now());
    set((s) => ({ licences: swap(s.licences, licenceId, () => r.licence) }));
    return r.blocked;
  },
  revoke: (licenceId, ids) => set((s) => ({ licences: swap(s.licences, licenceId, (l) => {
    const active = { ...l.active }, gone = ids.filter((x) => active[x]); gone.forEach((x) => delete active[x]);
    return { ...l, active, log: gone.length ? [{ at: Date.now(), action: 'revoked', studentIds: gone }, ...l.log] : l.log };
  }) })),
  saveMine: (p, id) => { const key = id ?? uid(); set((s) => ({ mine: id ? swap(s.mine, id, () => ({ ...p, id, updatedAt: Date.now() })) : [{ ...p, id: key, updatedAt: Date.now() }, ...s.mine] })); return key; },
  setStatus: (id, status) => set((s) => ({ mine: swap(s.mine, id, (p) => ({ ...p, status, updatedAt: Date.now() })) })),
  duplicate: (id) => set((s) => { const p = s.mine.find((x) => x.id === id)!; return { mine: [{ ...p, id: uid(), title: `${p.title} (copy)`, code: `${p.code}-COPY`, status: 'draft', updatedAt: Date.now() }, ...s.mine] }; }),
  saveOffer: (o, id) => set((s) => ({ offers: id ? swap(s.offers, id, (x) => ({ ...x, ...o })) : [{ ...o, id: uid(), used: 0 }, ...s.offers] })),
  refund: (saleId) => set((s) => ({ sales: swap(s.sales, saleId, (x) => ({ ...x, status: 'refunded', refund: x.total })) })),
  setRules: (r) => set((s) => ({ rules: { ...s.rules, ...r } })),
  unlock: () => set({ addon: true }),
}), { name: 'pf-shop-v9', partialize: ({ cart, purchases, licences, mine, offers, sales, rules, addon, methods }) => ({ cart, purchases, licences, mine, offers, sales, rules, addon, methods }) as Partial<Shop> }));

/** Sales from the academy's own store: total, split by kind, and per month for the last `months` months. */
export function salesSummary(sales: Sale[], mine: MyProduct[], months = 6) {
  const kind = (id: string) => { const t = mine.find((p) => p.id === id)?.type; return t === 'tests' ? 'tests' : t === 'qbank' ? 'banks' : 'ebooks'; };
  const kinds = { ebooks: 0, tests: 0, banks: 0 }, now = new Date(), monthly = Array(months).fill(0) as number[];
  for (const s of sales.filter((x) => x.status === 'completed')) {
    for (const l of s.lines) kinds[kind(l.productId)] += l.amount;
    const d = new Date(s.at), back = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
    if (back < months) monthly[months - 1 - back] += s.subtotal;
  }
  return { total: kinds.ebooks + kinds.tests + kinds.banks, kinds, monthly };
}
