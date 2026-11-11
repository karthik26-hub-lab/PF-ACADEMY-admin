// Reads a schedule from Excel, CSV or Word and turns its rows into calendar entries.
// Columns are recognised by their headings (many common spellings), values are cleaned up
// (dates in most Indian formats, "9 am – 11 am" style times, type and mode words), and each
// row is checked against the same per-type rules as the "Add on calendar" form.
import { unzipSync, strFromU8 } from 'fflate';
import readXlsxFile from 'read-excel-file';
import { LIVE_RULES, REC_RULES, parseVideos } from './calendar';
import { SUBJECTS, type Batch, type CalendarEvent, type Course, type Delivery, type EventType, type Member, type RecordedDay, type RecordedType } from './store';

export type Cell = string | number | boolean | Date | null;
export type Target = 'live' | 'recorded';

// ---------- 1. Reading the file into rows ----------
export async function readRows(file: File): Promise<Cell[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) return (await readXlsxFile(file)) as Cell[][];
  if (name.endsWith('.csv') || name.endsWith('.txt')) return parseCsv(await file.text());
  if (name.endsWith('.docx')) return readDocx(await file.arrayBuffer());
  if (name.endsWith('.xls') || name.endsWith('.doc')) throw new Error('This is an older Office format. Save it as .xlsx or .docx and try again.');
  throw new Error('Use an Excel (.xlsx), CSV or Word (.docx) file.');
}

function parseCsv(text: string): Cell[][] {
  const rows: string[][] = []; let row: string[] = []; let cur = ''; let q = false;
  const sep = (text.split('\n')[0].match(/\t/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? '\t' : ',';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; continue; }
    if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.map((r) => r.map((v) => v.replace(/^﻿/, '') as Cell));
}

/** Word files are zip archives; the schedule is read from the tables in word/document.xml. */
function readDocx(buf: ArrayBuffer): Cell[][] {
  const files = unzipSync(new Uint8Array(buf), { filter: (f) => f.name === 'word/document.xml' });
  const xml = files['word/document.xml'];
  if (!xml) throw new Error('This Word file could not be read.');
  const doc = new DOMParser().parseFromString(strFromU8(xml), 'application/xml');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const text = (el: Element) => Array.from(el.getElementsByTagNameNS(W, 'p')).map((p) => Array.from(p.getElementsByTagNameNS(W, 't')).map((t) => t.textContent ?? '').join('')).filter(Boolean).join(', ');
  const tables = Array.from(doc.getElementsByTagNameNS(W, 'tbl'));
  if (tables.length) {
    // Several tables (e.g. one per week) are joined; repeated heading rows are dropped later.
    return tables.flatMap((t) => Array.from(t.getElementsByTagNameNS(W, 'tr')).filter((tr) => tr.parentNode === t).map((tr) => Array.from(tr.getElementsByTagNameNS(W, 'tc')).map(text)));
  }
  // No table: accept lines split by tabs or " | ".
  const lines = Array.from(doc.getElementsByTagNameNS(W, 'p')).map((p) => Array.from(p.getElementsByTagNameNS(W, 't')).map((t) => t.textContent ?? '').join(''));
  const split = lines.filter((l) => /\t|\s\|\s/.test(l)).map((l) => l.split(/\t|\s\|\s/).map((x) => x.trim()));
  if (split.length < 2) throw new Error('No table found in this Word file. Put the schedule in a table with a heading row.');
  return split;
}

// ---------- 2. Recognising columns ----------
export type Field =
  | 'title' | 'subject' | 'topic' | 'faculty' | 'type' | 'batch' | 'date' | 'start' | 'end' | 'time' | 'mode' | 'course'
  | 'day' | 'chapter' | 'videos' | 'topics';
export const FIELD_LABEL: Record<Field, string> = {
  title: 'Title', subject: 'Subject', topic: 'Topic', faculty: 'Faculty', type: 'Type', batch: 'Batch', date: 'Date',
  start: 'Start time', end: 'End time', time: 'Time (start–end)', mode: 'Offline / Online', course: 'Course',
  day: 'Day number', chapter: 'Chapter', videos: 'Videos', topics: 'Topics',
};
export const LIVE_FIELDS: Field[] = ['title', 'subject', 'topic', 'faculty', 'type', 'batch', 'date', 'time', 'start', 'end', 'mode', 'course'];
export const REC_FIELDS: Field[] = ['day', 'type', 'subject', 'chapter', 'videos', 'topics', 'course'];

const SYN: Record<Field, string[]> = {
  title: ['title', 'name', 'event', 'session', 'class name', 'event name', 'session name', 'activity', 'description', 'particulars'],
  subject: ['subject', 'paper', 'subject name'],
  topic: ['topic', 'lesson', 'portion', 'topic name'],
  faculty: ['faculty', 'teacher', 'lecturer', 'trainer', 'staff', 'tutor', 'faculty name', 'taken by', 'by', 'mentor'],
  type: ['type', 'category', 'kind', 'event type', 'entry type'],
  batch: ['batch', 'group', 'section', 'batch name', 'class'],
  date: ['date', 'on', 'scheduled date', 'class date', 'exam date', 'event date'],
  start: ['start', 'start time', 'from', 'begins', 'starts', 'from time'],
  end: ['end', 'end time', 'to', 'ends', 'till', 'to time'],
  time: ['time', 'timing', 'timings', 'slot', 'hours', 'duration', 'time slot'],
  mode: ['mode', 'delivery', 'offline online', 'venue', 'where', 'platform', 'online offline', 'medium'],
  course: ['course', 'programme', 'program', 'level'],
  day: ['day', 'day no', 'day number', 'day #', 'd'],
  chapter: ['chapter', 'unit', 'module', 'chapter name'],
  videos: ['videos', 'video', 'videos to be watched', 'lectures', 'recordings', 'video list', 'watch'],
  topics: ['topics', 'topic', 'coverage', 'notes', 'topics covered', 'portion'],
};
const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9#]+/g, ' ').trim();

function fieldFor(header: string, allowed: Field[]): Field | null {
  const h = norm(header);
  if (!h) return null;
  for (const f of allowed) if (SYN[f].includes(h)) return f;
  for (const f of allowed) if (SYN[f].some((s) => s.length > 3 && (h.includes(s) || s.includes(h)))) return f;
  return null;
}

export interface Detected { headerIndex: number; headers: string[]; target: Target; map: (Field | null)[] }

/** Finds the heading row (the first row naming at least two known columns) and guesses live vs recorded. */
export function detect(rows: Cell[][], preferred: Target): Detected {
  let best = { i: -1, score: 0 };
  rows.slice(0, 15).forEach((r, i) => {
    const score = r.filter((c) => fieldFor(String(c ?? ''), [...LIVE_FIELDS, ...REC_FIELDS])).length;
    if (score > best.score) best = { i, score };
  });
  if (best.i < 0 || best.score < 2) throw new Error('Could not find a heading row. The first row of the table should name the columns, e.g. Date, Title, Batch, Time.');
  const headers = rows[best.i].map((c) => String(c ?? '').trim());
  const live = headers.map((h) => fieldFor(h, LIVE_FIELDS));
  const rec = headers.map((h) => fieldFor(h, REC_FIELDS));
  // A Date column means dated sessions; a Day column with numbers and no dates means a recorded plan.
  const dayCol = rec.indexOf('day');
  const dayNumeric = dayCol >= 0 && rows.slice(best.i + 1, best.i + 8).filter((r) => /\d/.test(String(r[dayCol] ?? '')) && !/[a-z]{4,}day/i.test(String(r[dayCol] ?? ''))).length >= 2;
  const target: Target = live.includes('date') ? 'live' : dayNumeric || rec.includes('videos') || rec.includes('chapter') ? 'recorded' : preferred;
  return { headerIndex: best.i, headers, target, map: target === 'live' ? live : rec };
}

export const remap = (headers: string[], target: Target) => headers.map((h) => fieldFor(h, target === 'live' ? LIVE_FIELDS : REC_FIELDS));

// ---------- 3. Cleaning values ----------
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const iso = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
};

/** Accepts Excel dates, 2026-11-12, 12/11/2026 (day first, as in India), 12 Nov 2026, Nov 12, 12th November. */
export function parseDate(v: Cell, year = new Date().getFullYear()): string | null {
  if (v == null || v === '') return null;
  if (v instanceof Date) return iso(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  if (typeof v === 'number') { if (v > 20000 && v < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 86400e3); return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); } return null; }
  const s = String(v).trim().toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/,/g, ' ');
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?/);
  if (m) {
    let a = +m[1], b = +m[2]; const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : year;
    if (b > 12 && a <= 12) [a, b] = [b, a]; // clearly month-first
    return iso(y, b, a);
  }
  m = s.match(/(\d{1,2})\s*[- ]?\s*([a-z]{3,})\.?\s*[- ]?\s*(\d{2,4})?/);
  if (m && MONTHS.includes(m[2].slice(0, 3))) return iso(m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : year, MONTHS.indexOf(m[2].slice(0, 3)) + 1, +m[1]);
  m = s.match(/([a-z]{3,})\.?\s+(\d{1,2})(?:\s+(\d{4}))?/);
  if (m && MONTHS.includes(m[1].slice(0, 3))) return iso(m[3] ? +m[3] : year, MONTHS.indexOf(m[1].slice(0, 3)) + 1, +m[2]);
  return null;
}

/** "9", "9:30", "9.30 am", "21:00", "0930", Excel time cells → "HH:MM". */
export function parseTime(v: Cell): string | null {
  if (v == null || v === '') return null;
  const hm = (h: number, mi: number) => (h >= 0 && h < 24 && mi >= 0 && mi < 60 ? `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}` : null);
  if (v instanceof Date) return hm(v.getUTCHours(), v.getUTCMinutes());
  if (typeof v === 'number') { if (v >= 0 && v < 1) { const mins = Math.round(v * 1440); return hm(Math.floor(mins / 60) % 24, mins % 60); } if (v <= 24) return hm(Math.floor(v), Math.round((v % 1) * 60)); return null; }
  const s = String(v).trim().toLowerCase().replace(/\s+/g, '');
  const m = s.match(/^(\d{1,2})(?:[:.](\d{2})|(\d{2}))?(am|pm|a\.m\.|p\.m\.)?$/);
  if (!m) return null;
  let h = +m[1]; const mi = +(m[2] ?? m[3] ?? 0); const ap = m[4]?.[0];
  if (ap === 'p' && h < 12) h += 12;
  if (ap === 'a' && h === 12) h = 0;
  // A bare "2" or "4" in a class timetable is almost always afternoon.
  if (!ap && h >= 1 && h <= 6) h += 12;
  return hm(h, mi);
}
export function parseTimeRange(v: Cell): [string | null, string | null] {
  if (v instanceof Date || typeof v === 'number') return [parseTime(v), null];
  const parts = String(v ?? '').split(/\s*(?:-|–|—|to|till|until)\s*/i).filter(Boolean);
  let [a, b] = [parts[0] ?? '', parts[1] ?? ''];
  // "9 - 11 am": carry the am/pm of the end onto the start when the start has none.
  const ap = b.match(/(am|pm)\s*$/i)?.[1];
  if (ap && !/(am|pm)/i.test(a)) a = `${a}${ap}`;
  return [parseTime(a), parseTime(b)];
}

const TYPE_WORDS: [EventType, RegExp][] = [
  ['holiday', /holiday|leave|vacation|break|closed|festival/],
  ['deadline', /deadline|last date|due|fee|registration|submission date/],
  ['exam', /exam|test|mock|assessment|quiz|paper\b/],
  ['event', /event|seminar|workshop|talk|webinar|orientation|ceremony|meet/],
  ['task', /task|assignment|homework|practice|worksheet/],
  ['class', /class|lecture|session|theory|revision|tutorial/],
];
export function parseType(v: Cell, title: string): { type: EventType; guessed: boolean } {
  const s = norm(v);
  for (const [t, re] of TYPE_WORDS) if (s && re.test(s)) return { type: t, guessed: false };
  const tt = norm(title);
  for (const [t, re] of TYPE_WORDS) if (re.test(tt)) return { type: t, guessed: true };
  return { type: 'class', guessed: true };
}
export function parseMode(v: Cell): Delivery[] | null {
  const s = norm(v);
  if (!s) return null;
  if (/both|hybrid|offline online|online offline/.test(s)) return ['offline', 'online'];
  if (/online|live|zoom|meet|stream|virtual|app/.test(s)) return ['online'];
  if (/offline|classroom|physical|in person|campus|centre|center|room|hall/.test(s)) return ['offline'];
  return null;
}
const REC_WORDS: [RecordedType, RegExp][] = [['buffer', /buffer|catch ?up|break|rest|free/], ['revision', /revis/], ['task', /task|assignment|practice|homework|test/], ['class', /class|lecture|lesson|video|session/]];
export function parseRecType(v: Cell): RecordedType | null {
  const s = norm(v);
  for (const [t, re] of REC_WORDS) if (re.test(s)) return t;
  return null;
}

function bestMatch<T>(value: string, items: T[], label: (t: T) => string): T | null {
  const v = norm(value);
  if (!v) return null;
  const exact = items.find((i) => norm(label(i)) === v);
  if (exact) return exact;
  const words = v.split(' ').filter((w) => w.length > 1);
  let best: { item: T; score: number } | null = null;
  for (const i of items) {
    const l = norm(label(i));
    const score = words.filter((w) => l.split(' ').includes(w)).length / Math.max(words.length, 1);
    if (score > (best?.score ?? 0)) best = { item: i, score };
  }
  return best && best.score >= 0.6 ? best.item : null;
}
export const matchSubject = (v: Cell) => (norm(v) ? bestMatch(String(v), SUBJECTS, (s) => s) ?? String(v).trim() : '');

// ---------- 4. Building entries ----------
export interface LiveRow { line: number; entry: Omit<CalendarEvent, 'id'>; issues: string[]; notes: string[]; duplicate: boolean }
export interface RecRow { line: number; entry: Omit<RecordedDay, 'id'>; issues: string[]; notes: string[]; duplicate: boolean }

const isHeaderAgain = (r: Cell[], headers: string[]) => r.filter((c, i) => norm(c) && norm(c) === norm(headers[i])).length >= 2;
const blank = (r: Cell[]) => r.every((c) => c == null || String(c).trim() === '');

export function buildLive(rows: Cell[][], d: Detected, ctx: { batches: Batch[]; members: Member[]; events: CalendarEvent[]; defaultDelivery: Delivery[] }): LiveRow[] {
  const col = (f: Field) => d.map.indexOf(f);
  const get = (r: Cell[], f: Field) => (col(f) >= 0 ? r[col(f)] ?? null : null);
  const active = ctx.batches.filter((b) => b.status === 'active');
  const seen = new Set(ctx.events.map((e) => `${e.date}|${e.time ?? ''}|${norm(e.title)}|${e.batchId ?? ''}`));
  const out: LiveRow[] = [];
  rows.slice(d.headerIndex + 1).forEach((r, k) => {
    if (blank(r) || isHeaderAgain(r, d.headers)) return;
    const issues: string[] = [], notes: string[] = [];
    const rawTitle = String(get(r, 'title') ?? '').trim();
    const subject = matchSubject(get(r, 'subject'));
    const { type, guessed } = parseType(get(r, 'type'), `${rawTitle} ${get(r, 'subject') ?? ''}`);
    if (guessed && col('type') >= 0 && norm(get(r, 'type'))) notes.push(`Type “${get(r, 'type')}” not recognised, using ${type}`);
    const rule = LIVE_RULES[type];
    const title = rawTitle || (type === 'class' && subject ? `${subject} class` : type === 'holiday' ? 'Holiday' : '');
    const date = parseDate(get(r, 'date'));
    let [time, end] = col('time') >= 0 ? parseTimeRange(get(r, 'time')) : [null, null];
    if (col('start') >= 0) time = parseTime(get(r, 'start')) ?? time;
    if (col('end') >= 0) end = parseTime(get(r, 'end')) ?? end;
    const rawBatch = String(get(r, 'batch') ?? '').trim();
    const allBatches = /^(all|all batches|everyone|whole academy|academy)$/i.test(rawBatch);
    const batch = rawBatch && !allBatches ? bestMatch(rawBatch, active, (b) => b.name) : null;
    if (rawBatch && !allBatches && !batch) issues.push(`Batch “${rawBatch}” not found`);
    const rawFac = String(get(r, 'faculty') ?? '').trim();
    const fac = rawFac ? bestMatch(rawFac, ctx.members, (m) => m.name) : null;
    if (rawFac && !fac && rule.req.includes('faculty')) issues.push(`Faculty “${rawFac}” not found`);
    const delivery = parseMode(get(r, 'mode')) ?? (rule.req.includes('delivery') ? ctx.defaultDelivery : undefined);
    if (col('mode') >= 0 && norm(get(r, 'mode')) && !parseMode(get(r, 'mode'))) notes.push(`Mode “${get(r, 'mode')}” not recognised, using the default`);
    if (get(r, 'date') != null && String(get(r, 'date')).trim() && !date) issues.push(`Date “${get(r, 'date')}” not understood`);

    const filled: Record<string, boolean> = {
      title: !!title, subject: !!subject, topic: !!String(get(r, 'topic') ?? '').trim(), faculty: !!fac, date: !!date,
      batch: !!batch || (allBatches && !!rule.allBatches) || (!rawBatch && !!rule.allBatches), time: !!time && !!end && end > time, delivery: !!delivery?.length,
    };
    for (const f of rule.req) if (!filled[f] && !issues.some((i) => i.toLowerCase().startsWith(f))) issues.push(f === 'time' ? (time && end ? 'End time is before the start' : 'Start and end time missing') : `${f[0].toUpperCase()}${f.slice(1)} missing`);
    const entry: Omit<CalendarEvent, 'id'> = {
      type, title, date: date ?? '',
      subject: rule.req.includes('subject') || rule.opt.includes('subject') ? subject || undefined : undefined,
      topic: rule.req.includes('topic') ? String(get(r, 'topic') ?? '').trim() || undefined : undefined,
      facultyId: rule.req.includes('faculty') ? fac?.id : undefined,
      batchId: batch?.id,
      time: rule.req.includes('time') || rule.opt.includes('time') ? time ?? undefined : undefined,
      end: rule.req.includes('time') || rule.opt.includes('time') ? end ?? undefined : undefined,
      delivery: rule.req.includes('delivery') ? delivery : undefined,
    };
    const key = `${entry.date}|${entry.time ?? ''}|${norm(entry.title)}|${entry.batchId ?? ''}`;
    const duplicate = seen.has(key);
    seen.add(key);
    out.push({ line: d.headerIndex + k + 2, entry, issues, notes, duplicate });
  });
  return out;
}

export function buildRecorded(rows: Cell[][], d: Detected, ctx: { course: Course; recorded: RecordedDay[] }): RecRow[] {
  const col = (f: Field) => d.map.indexOf(f);
  const get = (r: Cell[], f: Field) => (col(f) >= 0 ? r[col(f)] ?? null : null);
  const seen = new Set(ctx.recorded.map((x) => `${x.course}|${x.day}|${x.type}|${norm(x.chapter)}`));
  const out: RecRow[] = [];
  rows.slice(d.headerIndex + 1).forEach((r, k) => {
    if (blank(r) || isHeaderAgain(r, d.headers)) return;
    const issues: string[] = [], notes: string[] = [];
    const dayRaw = String(get(r, 'day') ?? '').match(/\d+/)?.[0];
    const day = dayRaw ? +dayRaw : NaN;
    const rawVideos = get(r, 'videos');
    let videos = typeof rawVideos === 'number' || /^\s*\d+\s*$/.test(String(rawVideos ?? '')) ? Array.from({ length: Math.min(20, +String(rawVideos)) }, (_, i) => `Video ${i + 1}`) : parseVideos(String(rawVideos ?? ''));
    const type = parseRecType(get(r, 'type')) ?? (videos.length ? 'class' : !norm(get(r, 'subject')) && !norm(get(r, 'chapter')) ? 'buffer' : 'class');
    if (col('type') >= 0 && norm(get(r, 'type')) && !parseRecType(get(r, 'type'))) notes.push(`Type “${get(r, 'type')}” not recognised, using ${type}`);
    const courseRaw = String(get(r, 'course') ?? '');
    const course: Course = /final/i.test(courseRaw) ? 'CA Final' : /inter/i.test(courseRaw) ? 'CA Inter' : /found/i.test(courseRaw) ? 'CA Foundation' : ctx.course;
    const subject = matchSubject(get(r, 'subject'));
    const chapter = String(get(r, 'chapter') ?? '').trim();
    const topics = String(get(r, 'topics') ?? '').trim();
    const need = REC_RULES[type];
    if (!Number.isInteger(day) || day < 1) issues.push('Day number missing');
    if (need.includes('subject') && !subject) issues.push('Subject missing');
    if (need.includes('chapter') && !chapter) issues.push('Chapter missing');
    if (need.includes('videos') && !videos.length) issues.push('Videos missing');
    if (need.includes('topics') && !topics) issues.push('Topics missing');
    if (!need.includes('videos')) videos = [];
    const entry: Omit<RecordedDay, 'id'> = { course, day: Number.isInteger(day) ? day : 0, type, subject: need.includes('subject') ? subject || undefined : undefined, chapter: need.includes('chapter') ? chapter || undefined : undefined, videos, topics: need.includes('topics') ? topics || undefined : undefined };
    const key = `${course}|${entry.day}|${type}|${norm(chapter)}`;
    const duplicate = seen.has(key);
    seen.add(key);
    out.push({ line: d.headerIndex + k + 2, entry, issues, notes, duplicate });
  });
  return out;
}

// ---------- 5. Templates ----------
export const LIVE_TEMPLATE: string[][] = [
  ['Date', 'Type', 'Title', 'Subject', 'Topic', 'Faculty', 'Batch', 'Time', 'Mode'],
  ['12/11/2026', 'Class', 'Taxation class', 'Taxation', 'Capital Gains – Exemptions', 'R. Menon', 'CA Inter · Jan 2027 · A', '9:00 am - 11:00 am', 'Both'],
  ['14/11/2026', 'Exam', 'GST mock test', 'Indirect Tax Laws', '', '', 'CA Final · Nov 2026 · A', '10:00 - 13:00', 'Offline'],
  ['18/11/2026', 'Deadline', 'Fee payment last date', '', '', '', '', '', ''],
  ['20/11/2026', 'Holiday', '', '', '', '', 'All batches', '', ''],
];
export const REC_TEMPLATE: string[][] = [
  ['Day', 'Type', 'Subject', 'Chapter', 'Videos', 'Topics'],
  ['1', 'Class', 'Accounting', 'AS 10 – Property, Plant & Equipment', 'Video 1, Video 2, Video 3', 'Recognition, measurement and depreciation'],
  ['2', 'Revision', 'Accounting', 'AS 10 – Property, Plant & Equipment', '', 'Revise and attempt the chapter MCQs'],
  ['3', 'Buffer', '', '', '', ''],
];
