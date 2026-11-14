// Assessments · question banks. A bank is one uploaded Word or Excel file, filed under a course and a main subject.
// Inside it are questions, each with its own source and examination attempt (the client's templates give them per row):
//  - a direct question (one part), or a question group: Q1 (a) (b) (c)
//  - a case study: a shared passage (the parent) with linked sub-questions (the children).
// Every part has its own subject, chapter, concept and marks — a case can combine subjects and chapters — so a
// test can pick just the parts that match its syllabus. MCQs have 1 to 6 options, with explanations.
import type { CourseInfo } from './courses';

export type QType = 'mcq' | 'descriptive';
export type QFormat = 'direct' | 'case';
export type FileKind = 'word' | 'excel';
export const QTYPE: Record<QType, string> = { mcq: 'MCQ', descriptive: 'Descriptive' };
export const QFORMAT: Record<QFormat, string> = { direct: 'Direct question', case: 'Case-based' };
export const SOURCES = ['PYQ', 'MTP', 'RTP', 'ICAI Study Material', 'Parallax Generated', 'Academy'] as const;
/** Attempt applies to past papers, MTPs and RTPs; series only to MTPs. */
export const hasAttempt = (source: string) => ['PYQ', 'MTP', 'RTP'].includes(source);

export interface Part {
  id: string; label: string; text: string; marks: number;
  /** Only when it differs from the bank's main subject (cases can combine subjects). */ subjectId?: string; chapterId?: string; concept?: string;
  options?: string[]; answer?: number; explanation?: string; wrongExplanation?: string; /** Referenced files (images, PDFs). */ files?: string[];
}
export interface Question {
  id: string; type: QType; format: QFormat; /** Case passage, or the main question of a group. */ stem?: string; parts: Part[];
  /** Per question; falls back to the bank's. */ source?: string; attempt?: string;
}
export interface QBank {
  id: string; name: string; courseId: string; subjectId: string;
  /** Defaults for questions that don't give their own. */ source: string; /** "May 2025" */ attempt?: string; series?: number;
  file: { name: string; size: number; kind: FileKind }; questions: Question[]; by: string; createdAt: number;
  /** Questions from a replaced file, and the deleted flag: kept so tests that used them still work. */ retired?: Question[]; deleted?: boolean;
}

export const fileKind = (name: string): FileKind => (/\.(xlsx|csv)$/i.test(name) ? 'excel' : 'word');
export const SHEETS = /\.(docx|xlsx|csv)$/i;
/** Question files, plus the images and PDFs they mention under File Name(s). */
export const ACCEPT = '.docx,.xlsx,.csv,.pdf,.png,.jpg,.jpeg,.webp';
export const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export const sourceLabel = (b: Pick<QBank, 'source' | 'attempt' | 'series'>) => [b.source, b.attempt, b.series && `Series ${b.series}`].filter(Boolean).join(' · ');
/** A question's own source and attempt, or its bank's. */
export const sourceOf = (q: Question, b: QBank) => ({ source: q.source ?? b.source, attempt: q.attempt ?? b.attempt, series: (q.source ?? b.source) === 'MTP' ? b.series : undefined });
export const subjectOfPart = (p: Part, b: QBank) => p.subjectId ?? b.subjectId;
/** Template spellings → our source names; '' when it isn't one we know. */
export const normSource = (s: string) => { const t = s.trim().toLowerCase(); return t === 'ism' || t.includes('study material') ? 'ICAI Study Material' : t === 'pyq' || t.includes('past') ? 'PYQ' : SOURCES.find((x) => x.toLowerCase() === t) ?? ''; };

/** Counts for a bank (or any list of questions). */
export function statsOf(qs: Question[]) {
  const parts = qs.flatMap((q) => q.parts);
  return {
    questions: parts.length, marks: parts.reduce((a, p) => a + p.marks, 0),
    mcq: qs.filter((q) => q.type === 'mcq').reduce((a, q) => a + q.parts.length, 0),
    descriptive: qs.filter((q) => q.type === 'descriptive').reduce((a, q) => a + q.parts.length, 0),
    cases: qs.filter((q) => q.format === 'case').length, groups: qs.filter((q) => q.parts.length > 1).length,
    chapters: [...new Set(parts.map((p) => p.chapterId).filter(Boolean))] as string[],
  };
}

/** Every part by id, with its question and bank. Cached per banks list. */
export type PartRef = { part: Part; q: Question; bank: QBank };
const cache = new WeakMap<QBank[], Map<string, PartRef>>();
export function partIndex(banks: QBank[]) {
  let m = cache.get(banks);
  if (!m) { m = new Map(); for (const bank of banks) for (const q of [...bank.questions, ...(bank.retired ?? [])]) for (const part of q.parts) m.set(part.id, { part, q, bank }); cache.set(banks, m); }
  return m;
}

/** Picked parts as numbered groups: a case scenario or group appears once, with only its picked parts. */
export function groupsOf(banks: QBank[], partIds: string[]) {
  const idx = partIndex(banks), out: { q: Question; bank: QBank; parts: Part[]; n: number }[] = [];
  for (const id of partIds) {
    const r = idx.get(id); if (!r) continue;
    const g = out.find((x) => x.q.id === r.q.id);
    if (g) g.parts.push(r.part); else out.push({ q: r.q, bank: r.bank, parts: [r.part], n: out.length + 1 });
  }
  out.forEach((g) => g.parts.sort((a, b) => g.q.parts.indexOf(a) - g.q.parts.indexOf(b)));
  return out;
}
/** "Q3(b)" for a part inside a group, "Q3" for a single question. */
export const partLabel = (g: { q: Question; n: number }, p: Part) => `Q${g.n}${g.q.parts.length > 1 ? `(${p.label})` : ''}`;

/** The client's Excel templates. Normal: one question per row. Case: the passage on its first row; the rows below
 *  with the passage left blank are its sub-questions. Options can be 1 to 4. */
export const NORMAL_COLUMNS = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Correct Explanation', 'Wrong Options Explanation', 'File Name(s)', 'Exam attempt', 'Source', 'Chapter Name', 'Concept Name', 'Marks'];
export const CASE_COLUMNS = ['Case Passage', 'Sub-question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Correct Explanation', 'Wrong Options Explanation', 'File Name(s)', 'Exam attempt', 'Source', 'Sub-question Chapter Name', 'Sub-question Concept Name', 'Marks'];

/** Files uploaded in this session, so they can be downloaded again until the server stores them. */
export const bankFiles = new Map<string, File>();
/** Attached files (images, PDFs) by file name, from this session's uploads. */
export const attachments = new Map<string, File>();

// ---------- Sample banks ----------
const MCQ_OPTS = ['Statement I only', 'Statement II only', 'Both I and II', 'Neither I nor II'], TRUE_FALSE = ['True', 'False'];
const KINDS: [string, string?, number?][] = [['PYQ', 'May 2025'], ['MTP', 'September 2025', 1], ['RTP', 'January 2026'], ['ICAI Study Material'], ['MTP', 'May 2026', 2], ['Parallax Generated']];

export function sampleBanks(courses: CourseInfo[], now: number): QBank[] {
  const out: QBank[] = [];
  let id = 0;
  const nid = () => `p${id++}`;
  courses.forEach((c, ci) => c.subjects.forEach((s, si) => {
    const chs = s.chapters.length ? s.chapters : [{ id: undefined as unknown as string, name: s.name }];
    // Parallax Generated banks only where the academy bought them (CA Inter in the sample).
    const kinds = KINDS.filter(([src]) => src !== 'Parallax Generated' || c.name === 'CA Inter');
    for (let j = 0; j < 3; j++) {
      const [source, attempt, series] = kinds[(si + j * 2 + ci) % kinds.length], b = out.length;
      const questions: Question[] = [];
      for (let k = 0; k < 8; k++) {
        const ch = chs[(k + j + b) % chs.length], ch2 = chs[(k + j + b + 1) % chs.length], qid = `q${b}-${k}`;
        // Another subject of the course, for case studies that combine subjects.
        const other = c.subjects[(si + 1) % c.subjects.length], och = other.chapters[(k + b) % Math.max(1, other.chapters.length)];
        const opts = [MCQ_OPTS, TRUE_FALSE, MCQ_OPTS.slice(0, 3)][(k + b) % 3];
        const mcqPart = (label: string, chapter: typeof ch, text: string): Part => ({ id: nid(), label, text, chapterId: chapter.id, concept: chapter.name.split(' – ')[0], marks: 2, options: opts, answer: (k + b) % opts.length,
          explanation: `Option ${'ABCD'[(k + b) % opts.length]} follows directly from ${chapter.name}.`, wrongExplanation: 'The other options misread the scope of the provision.' });
        if (k % 4 === 0) questions.push({ id: qid, type: 'mcq', format: 'direct', parts: [mcqPart('', ch, `Which of the following is correct regarding ${ch.name}?`)] });
        else if (k % 4 === 1) questions.push({ id: qid, type: 'descriptive', format: 'direct', parts: [{ id: nid(), label: '', text: `Explain ${ch.name} with a suitable example, stating the relevant provisions.`, chapterId: ch.id, marks: 5 }] });
        else if (k % 4 === 2) questions.push({ id: qid, type: 'descriptive', format: 'direct', stem: `Answer the following on ${ch.name}.`, parts: [
          { id: nid(), label: 'a', text: `State the scope of ${ch.name}.`, chapterId: ch.id, marks: 3 },
          { id: nid(), label: 'b', text: 'Distinguish between the two treatments with an illustration.', chapterId: ch.id, marks: 4 },
          { id: nid(), label: 'c', text: 'Comment on the disclosure required.', chapterId: ch.id, marks: 3 }] });
        else if (b % 2) questions.push({ id: qid, type: 'mcq', format: 'case', stem: `Case: M/s Alpha Ltd. presents the following facts relating to ${ch.name} and ${ch2.name}. Read them and answer the questions that follow.`, parts: [
          mcqPart('a', ch, `Which treatment applies under ${ch.name}?`), mcqPart('b', ch2, `What amount is recognised under ${ch2.name}?`),
          { ...mcqPart('c', ch, `How does ${other.name} affect this?`), subjectId: other.id, chapterId: och?.id, concept: och?.name }], source: 'RTP', attempt: 'January 2026' });
        else questions.push({ id: qid, type: 'descriptive', format: 'case', stem: `Case: A company purchased machinery, incurred installation expenses, later revalued it and charged depreciation. The questions relate to ${ch.name} and ${ch2.name}.`, parts: [
          { id: nid(), label: 'a', text: `Determine the initial cost under ${ch.name}.`, chapterId: ch.id, marks: 2 },
          { id: nid(), label: 'b', text: 'Calculate the depreciation for the year.', chapterId: ch2.id, marks: 2 },
          { id: nid(), label: 'c', text: 'Explain the treatment of the revaluation surplus.', chapterId: ch2.id, marks: 3 },
          { id: nid(), label: 'd', text: `State the ${other.name} position on this transaction.`, subjectId: other.id, chapterId: och?.id, marks: 3 }] });
      }
      const name = `${s.name} · ${[source, attempt, series && `Series ${series}`].filter(Boolean).join(' ')}`, kind: FileKind = j === 1 ? 'excel' : 'word';
      out.push({ id: `qb${b}`, name, courseId: c.id, subjectId: s.id, source, attempt, series, questions,
        file: { name: `${name.replace(/[^\w]+/g, '_')}.${kind === 'excel' ? 'xlsx' : 'docx'}`, size: 60e3 + ((b * 7919) % 900) * 1e3, kind }, by: ['S. Iyer', 'R. Menon', 'K. Das'][b % 3], createdAt: now - ((b * 13) % 120) * 86400e3 });
    }
  }));
  return out;
}
