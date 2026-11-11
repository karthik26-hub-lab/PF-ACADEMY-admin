// Store: Parallax Flow products bought per student seat, plus the academy's own store (a paid add-on).
// Every business number lives in `rules` so it can be changed from Settings → Store rules.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid, type Course } from './store';

// Same product types as the existing Parallax Flow store (parallax-flow-web/src/features/store/types/catalog.ts).
export type ProductType = 'revision-notes' | 'visual-notes' | 'mind-maps' | 'question-bank' | 'formula-sheet' | 'mock-test' | 'bundle';
export const TYPE_LABEL: Record<ProductType, string> = {
  'revision-notes': 'Ebook', 'visual-notes': 'Visual notes', 'mind-maps': 'Mind maps', 'question-bank': 'Question bank',
  'formula-sheet': 'Formula sheet', 'mock-test': 'Test series', bundle: 'Bundle',
};

export interface Product { id: string; title: string; type: ProductType; course: Course; subject: string; price: number; about: string; status?: 'draft' | 'live' }
export interface LogEntry { at: number; studentId: string; action: 'assign' | 'revoke' }
export interface Licence { id: string; productId: string; seats: number; boughtAt: number; expiresAt: number; assigned: Record<string, number>; log: LogEntry[] }
export interface Coupon { id: string; code: string; percent: number; used: number; limit: number }
export interface Order { id: string; productId: string; student: string; amount: number; at: number }
export interface Rules { seatMonths: number; cooldownDays: number; tiers: { min: number; off: number }[]; payout: 'parallax' | 'academy'; commission: number; addonPrice: number }

const DAY = 86400e3;
export const DEFAULT_RULES: Rules = {
  seatMonths: 12, cooldownDays: 30,
  tiers: [{ min: 100, off: 10 }, { min: 250, off: 20 }, { min: 500, off: 30 }],
  payout: 'parallax', commission: 15, addonPrice: 2999,
};

/** Price for `seats` students after the volume discount that applies. */
export function seatQuote(price: number, seats: number, rules: Rules, couponOff = 0) {
  const off = Math.max(0, ...rules.tiers.filter((t) => seats >= t.min).map((t) => t.off));
  const gross = price * seats;
  const total = Math.round(gross * (1 - off / 100) * (1 - couponOff / 100));
  return { off, gross, total };
}
/** A seat can be moved once its student has held it for the cooling period. */
export const movableAt = (assignedAt: number, rules: Rules) => assignedAt + rules.cooldownDays * DAY;

const pf = (id: string, title: string, type: ProductType, course: Course, subject: string, price: number, about: string): Product => ({ id, title, type, course, subject, price, about });
const CATALOG: Product[] = [
  pf('p1', 'PYQ Bank · Advanced Accounting', 'question-bank', 'CA Inter', 'Accounting', 149, 'Every past paper question since 2015, chapter-wise, with ICAI-style solutions.'),
  pf('p2', 'Taxation Visual Notes', 'visual-notes', 'CA Inter', 'Taxation', 199, 'Income tax and GST in one-page visuals, updated for the current Finance Act.'),
  pf('p3', 'Audit Standards Mind Maps', 'mind-maps', 'CA Inter', 'Auditing & Ethics', 99, 'All SAs as mind maps with key requirements and exam keywords.'),
  pf('p4', 'GST Formula & Rate Sheet', 'formula-sheet', 'CA Final', 'Indirect Tax Laws', 49, 'Rates, time of supply and ITC rules on six printable pages.'),
  pf('p5', 'Costing Mock Test Series', 'mock-test', 'CA Inter', 'Cost & Management Accounting', 249, 'Eight full-length mocks with step-wise marking.'),
  pf('p6', 'Financial Reporting Revision Ebook', 'revision-notes', 'CA Final', 'Financial Management', 299, 'Ind AS revision in 180 pages with solved illustrations.'),
  pf('p7', 'Corporate Law Question Bank', 'question-bank', 'CA Foundation', 'Corporate & Other Laws', 129, '600 MCQs and case questions with explanations.'),
  pf('p8', 'CA Foundation Complete Bundle', 'bundle', 'CA Foundation', 'All subjects', 499, 'Notes, question banks and mocks for all four papers.'),
];

function sample() {
  const now = Date.now();
  const lic = (id: string, productId: string, seats: number, used: number, from: number, daysAgo: number): Licence => {
    const assigned = Object.fromEntries(Array.from({ length: used }, (_, i) => [`s${from + i}`, now - (daysAgo - (i % 20)) * DAY]));
    return { id, productId, seats, boughtAt: now - daysAgo * DAY, expiresAt: now + (365 - daysAgo) * DAY, assigned, log: Object.entries(assigned).slice(0, 12).map(([studentId, at]) => ({ at, studentId, action: 'assign' as const })) };
  };
  return {
    licences: [lic('l1', 'p1', 100, 86, 1, 45), lic('l2', 'p2', 50, 50, 200, 12)],
    mine: [
      { id: 'm1', title: 'Northstar Taxation Crash Notes', type: 'revision-notes' as const, course: 'CA Inter' as Course, subject: 'Taxation', price: 349, about: '120 pages of last-minute revision.', status: 'live' as const },
      { id: 'm2', title: 'Accounts Practice Workbook', type: 'question-bank' as const, course: 'CA Inter' as Course, subject: 'Accounting', price: 199, about: '300 practice questions with answers.', status: 'draft' as const },
      { id: 'm3', title: 'Inter Group 1 Mock Series', type: 'mock-test' as const, course: 'CA Inter' as Course, subject: 'Taxation', price: 599, about: 'Four full mocks with evaluation.', status: 'live' as const },
      { id: 'm4', title: 'Audit Case Question Bank', type: 'question-bank' as const, course: 'CA Inter' as Course, subject: 'Auditing & Ethics', price: 249, about: '200 case questions with model answers.', status: 'live' as const },
    ],
    // About 90 sales over six months, a little busier each month.
    orders: Array.from({ length: 90 }, (_, i) => {
      const [productId, amount] = ([['m1', 349], ['m3', 599], ['m4', 249], ['m1', 349]] as const)[i % 4];
      return { id: `o${i}`, productId, amount, student: ['Aarav Shah', 'Diya Menon', 'Kabir Rao', 'Meera Iyer', 'Rohan Nair', 'Tara Joshi'][i % 6], at: now - Math.floor((1 - Math.sqrt(1 - i / 90)) * 175) * DAY };
    }),
    coupons: [{ id: 'c1', code: 'NORTH20', percent: 20, used: 14, limit: 50 }],
  };
}

interface Shop {
  catalog: Product[]; licences: Licence[]; mine: Product[]; orders: Order[]; coupons: Coupon[]; rules: Rules; addon: boolean;
  buy: (productId: string, seats: number) => void;
  assign: (licenceId: string, studentIds: string[]) => void;
  revoke: (licenceId: string, studentIds: string[]) => void;
  saveMine: (p: Omit<Product, 'id'>, id?: string) => string;
  setRules: (r: Partial<Rules>) => void;
  addCoupon: (c: Omit<Coupon, 'id' | 'used'>) => void;
  unlock: () => void;
}

const editLicence = (list: Licence[], id: string, fn: (l: Licence) => Licence) => list.map((l) => (l.id === id ? fn(l) : l));

export const useShop = create<Shop>()(persist((set) => ({
  catalog: CATALOG, rules: DEFAULT_RULES, addon: false, ...sample(),
  // Buying a product the academy already holds adds seats to the same licence.
  buy: (productId, seats) => set((s) => {
    const held = s.licences.find((l) => l.productId === productId);
    if (held) return { licences: editLicence(s.licences, held.id, (l) => ({ ...l, seats: l.seats + seats })) };
    const now = Date.now();
    return { licences: [{ id: uid(), productId, seats, boughtAt: now, expiresAt: now + s.rules.seatMonths * 30 * DAY, assigned: {}, log: [] }, ...s.licences] };
  }),
  assign: (id, ids) => set((s) => ({ licences: editLicence(s.licences, id, (l) => {
    const free = l.seats - Object.keys(l.assigned).length, now = Date.now(), add = ids.filter((x) => !l.assigned[x]).slice(0, free);
    return { ...l, assigned: { ...l.assigned, ...Object.fromEntries(add.map((x) => [x, now])) }, log: [...add.map((studentId) => ({ at: now, studentId, action: 'assign' as const })), ...l.log] };
  }) })),
  revoke: (id, ids) => set((s) => ({ licences: editLicence(s.licences, id, (l) => {
    const now = Date.now(), ok = ids.filter((x) => l.assigned[x] && movableAt(l.assigned[x], s.rules) <= now);
    const assigned = { ...l.assigned }; ok.forEach((x) => delete assigned[x]);
    return { ...l, assigned, log: [...ok.map((studentId) => ({ at: now, studentId, action: 'revoke' as const })), ...l.log] };
  }) })),
  saveMine: (p, id) => { const key = id ?? uid(); set((s) => ({ mine: id ? s.mine.map((x) => (x.id === id ? { ...p, id } : x)) : [{ ...p, id: key }, ...s.mine] })); return key; },
  setRules: (r) => set((s) => ({ rules: { ...s.rules, ...r } })),
  addCoupon: (c) => set((s) => ({ coupons: [{ ...c, id: uid(), used: 0 }, ...s.coupons] })),
  unlock: () => set({ addon: true }),
}), { name: 'pf-shop-v2', partialize: ({ licences, mine, orders, coupons, rules, addon }) => ({ licences, mine, orders, coupons, rules, addon }) as Partial<Shop> }));

/** Sales from the academy's own store: total, split by kind, and per month for the last `months` months. */
export function salesSummary(orders: Order[], mine: Product[], months = 6) {
  const kind = (id: string) => { const t = mine.find((p) => p.id === id)?.type; return t === 'mock-test' ? 'tests' : t === 'question-bank' ? 'banks' : 'ebooks'; };
  const kinds = { ebooks: 0, tests: 0, banks: 0 };
  const now = new Date(), monthly = Array(months).fill(0) as number[];
  for (const o of orders) {
    kinds[kind(o.productId)] += o.amount;
    const d = new Date(o.at), ago = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
    if (ago < months) monthly[months - 1 - ago] += o.amount;
  }
  return { total: kinds.ebooks + kinds.tests + kinds.banks, kinds, monthly };
}

// Parallax Flow coupons for academies (sample).
export const PF_COUPONS: Record<string, number> = { LAUNCH10: 10, BULK15: 15 };
