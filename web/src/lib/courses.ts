// Learning: course → subjects (optionally in Group I / II) → chapters, and the study materials filed inside them.
// A material is uploaded once and given to all of the course's batches or to chosen ones, so nothing is duplicated.
import type { Course } from './store';
import { CHAPTERS } from './syllabus';

export interface Chapter { id: string; name: string }
export interface Subject { id: string; name: string; group: string; chapters: Chapter[] }
export interface CourseInfo { id: string; name: Course; active: boolean; desc: string; subjects: Subject[] }

// The four kinds the client wants: Notes, Study materials, Videos and External links.
export type MaterialKind = 'notes' | 'study' | 'video' | 'link';
export const KIND: Record<MaterialKind, { label: string; accept: string; hint: string; byLink?: boolean }> = {
  notes: { label: 'Notes', accept: '.pdf,.doc,.docx,.txt', hint: 'PDF or Word notes' },
  study: { label: 'Study materials', accept: '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,image/*', hint: 'PDFs, slides, sheets, infographics and images' },
  video: { label: 'Videos', accept: 'video/*', hint: 'A video file, or a YouTube / Vimeo link', byLink: true },
  link: { label: 'External links', accept: '', hint: 'Any website or online resource', byLink: true },
};
/** A folder the academy makes inside a subject, a chapter, or another folder. */
export interface Folder { id: string; name: string; courseId: string; subjectId: string; chapterId?: string; parentId?: string }
export interface Material {
  id: string; title: string; kind: MaterialKind; file?: string; url?: string;
  courseId: string; subjectId: string; chapterId?: string; folderId?: string;
  /** Empty = every batch of the course; otherwise only these batches. */
  batchIds: string[];
  status: 'published' | 'draft' | 'archived'; updatedAt: number; version: number; by: string;
}

/** Where a material sits: "Taxation › Capital Gains". */
export const placeOf = (c: CourseInfo | undefined, m: Pick<Material, 'subjectId' | 'chapterId'>) => {
  const s = c?.subjects.find((x) => x.id === m.subjectId);
  return [s?.name, s?.chapters.find((x) => x.id === m.chapterId)?.name].filter(Boolean).join(' › ') || '—';
};

// ---------- Sample structure ----------
const PAPERS: Record<Course, [group: string, subject: string, chapters?: string[]][]> = {
  'CA Foundation': [['', 'Accounting'], ['', 'Business Laws', ['Indian Contract Act', 'Sale of Goods Act', 'Partnership Act', 'LLP Act', 'Companies Act basics']], ['', 'Quantitative Aptitude', ['Ratio & Proportion', 'Equations', 'Time Value of Money', 'Statistics', 'Probability']], ['', 'Business Economics', ['Demand & Supply', 'Theory of Production', 'Market Forms', 'National Income']]],
  'CA Inter': [['Group I', 'Advanced Accounting', CHAPTERS.Accounting], ['Group I', 'Corporate & Other Laws'], ['Group I', 'Taxation'], ['Group II', 'Cost & Management Accounting'], ['Group II', 'Auditing & Ethics'], ['Group II', 'FM & Strategic Management', [...CHAPTERS['Financial Management'], 'Introduction to Strategic Management', 'Strategic Analysis']]],
  'CA Final': [['Group I', 'Financial Reporting'], ['Group I', 'Advanced Financial Management', ['Risk Management', 'Derivatives', 'Mergers & Acquisitions', 'Portfolio Management']], ['Group I', 'Advanced Auditing', ['Quality Control', 'Audit of Banks', 'Due Diligence', 'Professional Ethics']], ['Group II', 'Direct Tax Laws'], ['Group II', 'Indirect Tax Laws'], ['Group II', 'Integrated Business Solutions', ['Case studies – set 1', 'Case studies – set 2']]],
};
const KINDS: [MaterialKind, string][] = [['notes', 'Notes'], ['video', 'Lecture'], ['study', 'Ignite sheet'], ['study', 'Practice set'], ['link', 'Reference'], ['notes', 'Summary']];

export function sampleCourses(now: number, batches: { id: string; course: Course }[]): { courses: CourseInfo[]; materials: Material[]; folders: Folder[] } {
  const materials: Material[] = [];
  const courses = (Object.keys(PAPERS) as Course[]).map((name, ci): CourseInfo => {
    const id = `c${ci + 1}`, mine = batches.filter((b) => b.course === name).map((b) => b.id);
    const subjects = PAPERS[name].map(([group, subject, chapters], si): Subject => ({
      id: `${id}s${si}`, name: subject, group,
      chapters: (chapters ?? CHAPTERS[subject.replace('Advanced ', '')] ?? ['Introduction', 'Core concepts', 'Revision']).map((ch, k) => ({ id: `${id}s${si}c${k}`, name: ch })),
    }));
    subjects.forEach((s, si) => s.chapters.forEach((ch, k) => {
      const n = 1 + ((si + k * 3) % 4);
      for (let j = 0; j < n; j++) {
        const [kind, word] = KINDS[(si + k + j) % KINDS.length], seq = materials.length;
        materials.push({
          id: `mt${seq}`, title: `${ch.name} – ${word}`, kind, courseId: id, subjectId: s.id, chapterId: ch.id,
          file: kind === 'link' || kind === 'video' ? undefined : `${ch.name.replace(/[^\w]+/g, '-')}-${word.toLowerCase().replace(/ /g, '-')}.${word === 'Summary' ? 'docx' : 'pdf'}`,
          url: kind === 'video' ? 'https://youtu.be/sample' : kind === 'link' ? 'https://www.icai.org/' : undefined,
          batchIds: seq % 7 === 3 && mine.length ? mine.slice(0, 2) : [], status: seq % 23 === 5 ? 'draft' : seq % 31 === 7 ? 'archived' : 'published',
          updatedAt: now - ((seq * 37) % 90) * 86400e3, version: 1 + (seq % 5 === 0 ? 1 : 0), by: ['S. Iyer', 'R. Menon', 'K. Das', 'Admin'][seq % 4],
        });
      }
    }));
    return { id, name, active: true, desc: { 'CA Foundation': 'Entry level · 4 papers', 'CA Inter': 'Intermediate · 6 papers in two groups', 'CA Final': 'Final level · 6 papers in two groups' }[name], subjects };
  });
  // Two sample folders inside CA Inter › Taxation › its first chapter, each with a material.
  const tax = courses[1].subjects.find((s) => s.name === 'Taxation')!, ch = tax.chapters[0];
  const folders: Folder[] = [{ id: 'fd1', name: 'Class handouts', courseId: 'c2', subjectId: tax.id, chapterId: ch.id }, { id: 'fd2', name: 'Previous year questions', courseId: 'c2', subjectId: tax.id, chapterId: ch.id }];
  folders.forEach((f, i) => materials.push({ id: `mtf${i}`, title: `${ch.name} – ${f.name}`, kind: i ? 'study' : 'notes', file: `${f.name.replace(/ /g, '-')}.pdf`, courseId: 'c2', subjectId: tax.id, chapterId: ch.id, folderId: f.id, batchIds: [], status: 'published', updatedAt: now - (i + 2) * 86400e3, version: 1, by: 'R. Menon' }));
  return { courses, materials, folders };
}
