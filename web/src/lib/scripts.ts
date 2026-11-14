// Submissions, evaluation and results. Until the server sends real answer scripts, each test's scripts are
// worked out from its counts (received, flagged, reviewed, published) and each student's own scores, so the
// numbers always match the test cards. Changes the academy makes (marks, comments, reviews) are saved separately
// and win over the sample — with who made them and when, so the Academy Admin can see every change.
import { partIndex, type PartRef, type QBank } from './banks';
import type { Exam, Student } from './store';

export interface MarkChange { marks?: number; comment?: string; reviewed?: boolean; by: string; at: number; from?: number }
export type ScriptStatus = 'missing' | 'ai' | 'flagged' | 'reviewed' | 'published';
export interface Script {
  key: string; examId: string; student: Student; submitted: boolean; at?: number; late: boolean; file?: string;
  aiMarks: number; marks: number; max: number; status: ScriptStatus; comment?: string; history: MarkChange[];
  /** Marks per question (bank tests). */ perQuestion: { id: string; marks: number; max: number }[];
}

const hash = (s: string) => { let h = 7; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 2654435761); return (h >>> 0) / 4294967296; };
export const scriptKey = (examId: string, studentId: string) => `${examId}:${studentId}`;
export const PASS_PCT = 40;

/** Everyone who should write the test: its batches, or the chosen students. */
export const enrolledIn = (e: Exam, students: Student[]) => (e.studentIds?.length ? students.filter((s) => e.studentIds!.includes(s.id)) : students.filter((s) => e.batchIds.includes(s.batchId)));

export function scriptsOf(e: Exam, students: Student[], banks: QBank[], changes: Record<string, MarkChange[]>): Script[] {
  const list = enrolledIn(e, students).map((s) => ({ s, r: hash(`${e.id}${s.id}`) })).sort((a, b) => a.r - b.r);
  const idx = partIndex(banks), parts = (e.partIds ?? []).map((id) => idx.get(id)).filter(Boolean) as PartRef[];
  const max = e.maxMarks ?? (parts.length ? parts.reduce((a, r) => a + r.part.marks, 0) : 100);
  const opens = +new Date(e.mode === 'timed' ? e.opensAt : e.practiceFrom), closes = +new Date(e.mode === 'timed' ? e.closesAt : e.practiceTo || e.practiceFrom) || opens + 3 * 3600e3;
  const received = Math.min(e.received, list.length);
  // A test still running has nothing published yet.
  const pub = Date.now() > closes ? e.published : 0;
  return list.map(({ s, r }, i): Script => {
    const key = scriptKey(e.id, s.id), history = changes[key] ?? [], submitted = i < received;
    const pct = Math.max(5, Math.min(98, (s.avgScore ?? 55) - 8 + (hash(`${key}p`) - 0.5) * 44));
    // Per question: MCQs are right or wrong; written answers get half marks. The total is their sum.
    const perQuestion = parts.map(({ part, q }) => { const m = part.marks, h = hash(`${key}${part.id}`); return { id: part.id, max: m, marks: !submitted ? 0 : q.type === 'mcq' ? (h < pct / 100 ? m : 0) : Math.round(m * Math.max(0, Math.min(1, pct / 100 + (h - 0.5) * 0.5)) * 2) / 2 }; });
    const aiMarks = !submitted ? 0 : perQuestion.length ? perQuestion.reduce((a, p) => a + p.marks, 0) : Math.round((pct / 100) * max);
    const latest = [...history].reverse();
    const marks = latest.find((h) => h.marks !== undefined)?.marks ?? aiMarks;
    const late = submitted && hash(`${key}l`) < 0.08;
    const at = submitted ? Math.round(opens + (closes - opens) * (0.35 + 0.6 * r) + (late ? 40 * 60e3 : 0)) : undefined;
    // Status from the test's counts: the first ones are published, then reviewed, then flagged, the rest AI-marked.
    const status: ScriptStatus = !submitted ? 'missing' : latest.some((h) => h.reviewed) ? (i < pub ? 'published' : 'reviewed')
      : i < pub ? 'published' : i < pub + e.reviewed ? 'reviewed' : i < pub + e.reviewed + Math.max(0, e.flagged - e.reviewed) ? 'flagged' : 'ai';
    return { key, examId: e.id, student: s, submitted, at, late, file: submitted ? `${s.studentId}-${e.title.replace(/\W+/g, '-')}.pdf` : undefined, aiMarks, marks, max, status, comment: latest.find((h) => h.comment)?.comment, history, perQuestion };
  });
}

/** Rank by marks (ties share a rank). */
export function ranked<T extends { marks: number }>(list: T[]): (T & { rank: number })[] {
  const sorted = [...list].sort((a, b) => b.marks - a.marks);
  return sorted.map((x, i) => ({ ...x, rank: i && sorted[i - 1].marks === x.marks ? 0 : i + 1 })).map((x, i, arr) => ({ ...x, rank: x.rank || arr.slice(0, i).reverse().find((y) => y.rank)!.rank }));
}
