// Reads an uploaded question file into questions.
// Excel (.xlsx / .csv): the client's templates. Columns are found by their header names, so either template works:
//   Normal: Question, Option A–D, Correct Answer, explanations, File Name(s), Exam attempt, Source, Chapter Name, Concept Name, Marks
//   Case:   Case Passage (first row of each case only), Sub-question, … Sub-question Chapter Name, Sub-question Concept Name, Marks
//   Options can be 1 to 4; a row with no options is a descriptive question.
// Word (.docx), one item per line:
//   Q1. Question text [2 marks] {Chapter name}        ← a direct question ({Subject › Chapter} works too)
//   A) option  B) option …   then   Answer: B          ← makes it an MCQ
//   Q2. Case: the shared passage…                      ← a case study (or a group if it doesn't start with "Case")
//   (a) Sub-question [3 marks] {Chapter name}          ← its parts
// "Chapter Name" may name a chapter or a subject of the course; names it can't find are left for the academy to map.
import readXlsxFile from 'read-excel-file';
import { uid, type CourseInfo } from './store';
import { normSource, type Part, type Question } from './banks';

export interface Parsed {
  questions: Question[]; problems: string[];
  /** Chapter / subject names in the file that didn't match the course; their parts keep the name in `place`. */ unknown: string[];
  /** File names the questions refer to (images, PDFs). */ files: string[];
}
export type PlacedPart = Part & { place?: string };
type Place = { subjectId: string; chapterId?: string };

const MARKS = /\[\s*(\d+(?:\.\d+)?)\s*marks?\s*\]/i, CHAPTER = /\{([^}]+)\}/;
const lc = (s: string) => s.trim().toLowerCase();

/** A chapter (in any subject of the course) or a subject, by name: exact first, then partial. */
export function findPlace(course: CourseInfo, name: string): Place | undefined {
  const [a, b] = name.split(/\s*[›>|]\s*/).map(lc);
  if (!a) return undefined;
  if (b) {
    const s = course.subjects.find((x) => lc(x.name) === a) ?? course.subjects.find((x) => lc(x.name).includes(a));
    const c = s?.chapters.find((x) => lc(x.name) === b) ?? s?.chapters.find((x) => lc(x.name).includes(b));
    return s && { subjectId: s.id, chapterId: c?.id };
  }
  const chapters = course.subjects.flatMap((s) => s.chapters.map((c) => ({ s, c })));
  // Exact name, then a name that starts with it as a whole word ("AS 10" → "AS 10 – Property…", never "AS 1 – …"), then one containing it.
  const word = (hay: string, n: string) => new RegExp(`(^|\\W)${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\W)`).test(hay);
  const ch = chapters.find((x) => lc(x.c.name) === a) ?? chapters.find((x) => word(lc(x.c.name), a)) ?? chapters.find((x) => lc(x.c.name).includes(a));
  if (ch) return { subjectId: ch.s.id, chapterId: ch.c.id };
  const sub = course.subjects.find((x) => lc(x.name) === a) ?? course.subjects.find((x) => lc(x.name).includes(a));
  return sub && { subjectId: sub.id };
}

/** Types each question, puts each part in its subject and chapter, and lists what's missing. */
function finish(course: CourseInfo, qs: Question[], problems: string[], files: string[]): Parsed {
  const unknown = new Set<string>();
  const questions = qs.filter((q) => q.parts.length).map((q): Question => ({ ...q, type: q.parts.every((p) => p.options?.length) ? 'mcq' : 'descriptive' }));
  questions.forEach((q, i) => q.parts.forEach((p: PlacedPart) => {
    const tag = `Q${i + 1}${p.label ? `(${p.label})` : ''}`;
    if (p.place) { const f = findPlace(course, p.place); if (f) { Object.assign(p, f); delete p.place; } else unknown.add(p.place); }
    if (!p.marks) problems.push(`${tag} has no marks`);
    if (p.options && (p.answer ?? -1) < 0) problems.push(`${tag} has no correct answer`);
  }));
  return { questions, problems, unknown: [...unknown], files: [...new Set(files)] };
}

/** The paragraphs of a .docx, read straight from its zip (no extra library). */
async function docxParagraphs(file: File): Promise<string[]> {
  const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer);
  let e = buf.length - 22; while (e > 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  let p = dv.getUint32(e + 16, true);
  for (let i = 0, n = dv.getUint16(e + 10, true); i < n; i++) {
    const nl = dv.getUint16(p + 28, true), name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nl));
    if (name === 'word/document.xml') {
      const size = dv.getUint32(p + 20, true), off = dv.getUint32(p + 42, true), start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const raw = buf.slice(start, start + size);
      const data = dv.getUint16(p + 10, true) === 0 ? raw : new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat))).arrayBuffer());
      const xml = new TextDecoder().decode(data);
      const ent = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
      return xml.split('</w:p>').map((par) => ent([...par.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g)].map((m) => m[1] ?? ' ').join('')).trim()).filter(Boolean);
    }
    p += 46 + nl + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
  }
  throw new Error('No document inside');
}

function fromLines(lines: string[], course: CourseInfo): Parsed {
  const qs: Question[] = [];
  let q: Question | undefined, part: PlacedPart | undefined;
  const newPart = (label: string, raw: string) => {
    part = { id: uid(), label, text: raw.replace(MARKS, '').replace(CHAPTER, '').trim(), marks: +(raw.match(MARKS)?.[1] ?? 0), place: raw.match(CHAPTER)?.[1]?.trim() };
    q!.parts.push(part);
  };
  for (const line of lines) {
    const head = line.match(/^Q(?:uestion)?\s*\.?\s*(\d+)\s*[.):-]\s*(.*)$/i), sub = line.match(/^\(?([a-h])\)\s*(.+)$/), opt = line.match(/^\(?([A-F])[).]\s*(.+)$/), ans = line.match(/^(?:Answer|Ans|Correct(?: answer| option)?)\s*[:.-]\s*\(?([A-F])\)?/i);
    if (head) {
      q = { id: uid(), type: 'descriptive', format: /^case\b/i.test(head[2]) ? 'case' : 'direct', parts: [] }; qs.push(q); part = undefined;
      // A line with marks is a question by itself; otherwise it's the passage / main question of a group.
      if (MARKS.test(head[2])) newPart('', head[2]); else q.stem = head[2].replace(/^case\s*[:.-]?\s*/i, '').trim();
    } else if (sub && q) newPart(sub[1], sub[2]);
    else if (opt && part) part.options = [...(part.options ?? []), opt[2].trim()];
    else if (ans && part) part.answer = 'ABCDEF'.indexOf(ans[1].toUpperCase());
    else if (part && !part.options) part.text += ` ${line}`;
    else if (q && !part) q.stem = `${q.stem ?? ''} ${line}`.trim();
  }
  return finish(course, qs, [], []);
}

function fromRows(rows: string[][], course: CourseInfo): Parsed {
  const head = (rows[0] ?? []).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
  const col = (re: RegExp) => head.findIndex((h) => re.test(h));
  const c = {
    passage: col(/passage/), q: col(/^(sub)?question$/), correct: col(/^correct(answer|option)$/), why: col(/^correctexplanation/), whyNot: col(/^wrongoption/),
    files: col(/^filename/), attempt: col(/attempt/), source: col(/^source/), chapter: col(/chapter/), concept: col(/concept/), marks: col(/^marks?$/),
  };
  const opts = ['a', 'b', 'c', 'd', 'e', 'f'].map((l) => col(new RegExp(`^option${l}$`))).filter((i) => i >= 0);
  if (c.q < 0) throw new Error('No “Question” column found. Use the normal or case template.');
  const qs: Question[] = [], problems: string[] = [], files: string[] = [];
  let kase: Question | undefined;
  rows.slice(1).forEach((r, i) => {
    const v = (k: number) => (k >= 0 ? String(r[k] ?? '').trim() : '');
    const text = v(c.q), passage = v(c.passage);
    if (!text && !passage) return;
    if (!text) return void problems.push(`Row ${i + 2}: no question text`);
    const options = opts.map(v).filter(Boolean), correct = v(c.correct);
    const answer = !options.length ? -1 : /^[A-F]$/i.test(correct) ? 'ABCDEF'.indexOf(correct.toUpperCase()) : options.findIndex((o) => lc(o) === lc(correct));
    const rowFiles = v(c.files).split(/\s*[,;\n]\s*/).filter(Boolean);
    files.push(...rowFiles);
    const part: PlacedPart = {
      id: uid(), label: '', text, marks: +v(c.marks) || 0, place: v(c.chapter) || undefined, concept: v(c.concept) || undefined,
      ...(options.length ? { options, answer: answer < options.length ? answer : -1, explanation: v(c.why) || undefined, wrongExplanation: v(c.whyNot) || undefined } : {}),
      ...(rowFiles.length ? { files: rowFiles } : {}),
    };
    const own = { source: normSource(v(c.source)) || undefined, attempt: v(c.attempt) || undefined };
    if (v(c.source) && !own.source) problems.push(`Row ${i + 2}: source “${v(c.source)}” isn’t one we know; the default is used`);
    // Case template: a passage starts a case; the rows below with a blank passage are its sub-questions.
    if (passage) { kase = { id: uid(), type: 'mcq', format: 'case', stem: passage, parts: [], ...own }; qs.push(kase); }
    if (c.passage >= 0 && kase) kase.parts.push({ ...part, label: String.fromCharCode(97 + kase.parts.length) });
    else qs.push({ id: uid(), type: 'mcq', format: 'direct', parts: [part], ...own });
  });
  return finish(course, qs, problems, files);
}

/** CSV with quoted fields (quoted line breaks aren't supported; use .xlsx for those). */
const csv = (t: string) => t.split(/\r?\n/).filter((l) => l.trim()).map((l) => [...l.matchAll(/("([^"]*(?:""[^"]*)*)"|[^,]*)(,|$)/g)].slice(0, -1).map((m) => (m[2] ?? m[1]).replace(/""/g, '"')));

export async function parseBankFile(file: File, course: CourseInfo): Promise<Parsed> {
  const n = file.name.toLowerCase();
  if (n.endsWith('.docx')) return fromLines(await docxParagraphs(file), course);
  if (n.endsWith('.csv')) return fromRows(csv(await file.text()), course);
  if (n.endsWith('.xlsx')) return fromRows((await readXlsxFile(file)).map((r) => r.map((x) => (x instanceof Date ? x.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : String(x ?? '')))), course);
  throw new Error('Use a Word (.docx) or Excel (.xlsx, .csv) file');
}
