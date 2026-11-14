// Reports (Phase 4): fees, attendance and learning activity for each student. Until the server sends real records,
// they're worked out from each student's batch, class mode and progress, so every screen shows the same numbers.
// Payments the academy records by hand (cash, cheque) are stored and win over the sample.
import type { Batch, CalendarEvent, Course, Student } from './store';

export type ClassMode = 'offline' | 'online' | 'recorded';
export const MODE: Record<ClassMode, string> = { offline: 'Offline', online: 'Online', recorded: 'Recorded' };
export const modeOf = (s: Student): ClassMode => s.mode ?? 'offline';

/** Course fee by class mode (sample until the academy sets its own). */
export const FEES: Record<Course, Record<ClassMode, number>> = {
  'CA Foundation': { offline: 45000, online: 32000, recorded: 18000 },
  'CA Inter': { offline: 72000, online: 54000, recorded: 30000 },
  'CA Final': { offline: 90000, online: 68000, recorded: 38000 },
};
export const PAY_METHODS = ['UPI', 'Card', 'Net banking', 'Cash'] as const;

const hash = (s: string) => { let h = 7; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 2654435761); return (h >>> 0) / 4294967296; };
const DAY = 86400e3;

// ---------- Fees ----------
export interface Payment { at: number; method: string; by: string }
export interface Instalment { key: string; n: number; due: number; amount: number; paidAt?: number; method?: string; by?: string; status: 'paid' | 'due' | 'overdue' }
export const instalmentKey = (studentId: string, n: number) => `${studentId}:${n}`;

/** The student's fee in instalments: recorded courses are paid at once; live classes in three parts, 60 days apart. */
export function feePlan(s: Student, b: Batch | undefined, paid: Record<string, Payment>, now = Date.now()): Instalment[] {
  const total = FEES[b?.course ?? 'CA Inter'][modeOf(s)], count = modeOf(s) === 'recorded' ? 1 : 3;
  const part = Math.round(total / count / 100) * 100, start = +new Date(s.admissionDate) || s.createdAt;
  return Array.from({ length: count }, (_, i) => {
    const key = instalmentKey(s.id, i + 1), due = start + i * 60 * DAY, amount = i === count - 1 ? total - part * (count - 1) : part;
    const h = hash(key), manual = paid[key];
    // Sample: most past instalments are paid (a few late or missing); some are paid early.
    const sample = due <= now ? h < [0.98, 0.92, 0.86][i] : h < 0.12;
    const paidAt = manual?.at ?? (sample ? Math.min(now, due + (h - 0.4) * 20 * DAY) : undefined);
    const method = manual?.method ?? (paidAt ? PAY_METHODS[Math.floor(hash(`${key}m`) * 4)] : undefined);
    return { key, n: i + 1, due, amount, paidAt, method, by: manual?.by, status: paidAt ? 'paid' : due < now ? 'overdue' : 'due' };
  });
}
export const feeTotals = (plan: Instalment[]) => ({
  total: plan.reduce((a, x) => a + x.amount, 0), paid: plan.filter((x) => x.paidAt).reduce((a, x) => a + x.amount, 0),
  overdue: plan.filter((x) => x.status === 'overdue').reduce((a, x) => a + x.amount, 0), due: plan.filter((x) => x.status === 'due').reduce((a, x) => a + x.amount, 0),
});

// ---------- Attendance ----------
/** Past live classes a student was expected at: their batch's classes held in their mode. Recorded students have none. */
export function sessionsFor(s: Student, events: CalendarEvent[], now = Date.now()) {
  const mode = modeOf(s);
  if (mode === 'recorded') return [];
  return events.filter((e) => e.type === 'class' && e.batchId === s.batchId && +new Date(e.date) < now && e.delivery?.includes(mode));
}
/** Present or absent for each session: faculty mark offline classes, the app records online joins. */
export function attendanceOf(s: Student, events: CalendarEvent[], now = Date.now()) {
  const sessions = sessionsFor(s, events, now), base = 0.7 + s.progress / 450;
  const marks = sessions.map((e) => ({ e, present: hash(`${s.id}${e.id}`) < base }));
  return { held: marks.length, present: marks.filter((m) => m.present).length, marks };
}
/** Recorded students: videos watched out of the course's recorded videos. */
export const videosWatched = (s: Student, total: number) => Math.round((total * s.progress) / 100);

// ---------- Learning activity ----------
/** Materials, chapters, time, MCQs, accuracy, revision and the last 28 days of activity (sample from progress). */
export function learningOf(s: Student, chaptersTotal: number) {
  const p = s.progress / 100, h = (k: string) => hash(`${s.id}${k}`);
  // Quieter at weekends.
  const days = Array.from({ length: 28 }, (_, i) => { const dow = new Date(Date.now() - (27 - i) * DAY).getDay(); return h(`d${i}`) < (0.15 + p * 0.75) * (dow === 0 ? 0.45 : dow === 6 ? 0.8 : 1); });
  return {
    materials: Math.round(4 + p * 60 + h('m') * 10), chapters: Math.round(chaptersTotal * p), chaptersTotal,
    minutes: Math.round(p * 2400 + h('t') * 600), mcqs: Math.round(p * 900 + h('q') * 150),
    accuracy: Math.round(Math.max(25, Math.min(97, (s.avgScore ?? 55) + (h('a') - 0.5) * 20))), revisions: Math.round(p * 40 + h('r') * 8),
    days, consistency: Math.round((days.filter(Boolean).length / 28) * 100),
  };
}
