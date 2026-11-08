import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ---------- types ----------
export type Course = 'CA Foundation' | 'CA Inter' | 'CA Final';
export type Role = 'Academy admin' | 'Exam manager' | 'Reviewer';
export type Policy = 'clean' | 'auto' | 'manual';
export type Mode = 'timed' | 'practice';
export type Late = 'none' | '30m' | '24h';
export type ExamStatus = 'draft' | 'scheduled' | 'live' | 'closed';

export interface Academy { name: string; city: string; email: string; phone: string; code: string }
export interface Me { name: string; email: string }
export interface Batch { id: string; name: string; course: Course; facultyId: string; createdAt: number }
export interface Member { id: string; name: string; email: string; role: Role; batchIds: string[]; invitedAt: number }
export interface Student { id: string; name: string; roll: string; batchId: string; phone: string; email: string; loginId: string; createdAt: number }
export interface JoinRequest { id: string; name: string; phone: string; roll: string; at: number }
export interface See { steps: boolean; needed: boolean; model: boolean; rank: boolean }
export interface Exam {
  id: string; title: string; subject: string; fileName: string; batchIds: string[];
  mode: Mode; opensAt: string; closesAt: string; perQuestion: boolean; questionCount: number; late: Late;
  practiceFrom: string; practiceTo: string; attempts: 'unlimited' | '1' | '3';
  policy: Policy; reviewerId: string; see: See;
  draft: boolean; closedAt: number | null; createdAt: number;
  received: number; evaluated: number; flagged: number; reviewed: number; published: number;
}
export interface Activity { id: string; kind: 'exam' | 'student' | 'batch' | 'team' | 'settings'; text: string; at: number }
export interface Defaults { policy: Policy; late: Late; flagBelow: number }
export interface Access { academyCreatesLogins: boolean; joinWithCode: boolean; approveJoins: boolean; otpReset: boolean }

interface State {
  signedIn: boolean;
  academy: Academy; me: Me;
  batches: Batch[]; members: Member[]; students: Student[]; joinRequests: JoinRequest[]; exams: Exam[];
  activity: Activity[]; defaults: Defaults; access: Access;
  signIn: (email: string) => void; signOut: () => void;
  saveAcademy: (a: Partial<Academy>, me?: Partial<Me>) => void;
  newCode: () => string;
  addBatch: (b: Omit<Batch, 'id' | 'createdAt'>) => Batch;
  updateBatch: (id: string, b: Partial<Batch>) => void;
  deleteBatch: (id: string) => void;
  addStudent: (s: Omit<Student, 'id' | 'createdAt' | 'loginId'>) => { student: Student; password: string } | { error: string };
  deleteStudent: (id: string) => void;
  invite: (m: Omit<Member, 'id' | 'invitedAt'>) => void;
  updateMember: (id: string, m: Partial<Member>) => void;
  removeMember: (id: string) => void;
  addExam: (e: Omit<Exam, 'id' | 'createdAt' | 'received' | 'evaluated' | 'flagged' | 'reviewed' | 'published' | 'closedAt'>) => Exam;
  updateExam: (id: string, e: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  setDefaults: (d: Partial<Defaults>) => void;
  setAccess: (a: Partial<Access>) => void;
  clearAll: () => void;
}

// ---------- helpers ----------
export const uid = () => Math.random().toString(36).slice(2, 10);
const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', N = '23456789';
const pick = (s: string, n: number) => Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('');
export const tempPassword = () => `${pick(L, 4)}-${pick(N, 4)}`;

const empty = {
  signedIn: false,
  academy: { name: '', city: '', email: '', phone: '', code: '' },
  me: { name: '', email: '' },
  batches: [], members: [], students: [], joinRequests: [], exams: [], activity: [],
  defaults: { policy: 'clean' as Policy, late: 'none' as Late, flagBelow: 0.7 },
  access: { academyCreatesLogins: true, joinWithCode: true, approveJoins: true, otpReset: false },
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const log = (kind: Activity['kind'], text: string) =>
        set((s) => ({ activity: [{ id: uid(), kind, text, at: Date.now() }, ...s.activity].slice(0, 50) }));
      return {
        ...empty,
        signIn: (email) => set((s) => ({ signedIn: true, me: { ...s.me, email: email || s.me.email } })),
        signOut: () => set({ signedIn: false }),
        saveAcademy: (a, me) => { set((s) => ({ academy: { ...s.academy, ...a }, me: { ...s.me, ...me } })); log('settings', 'Academy details updated'); },
        newCode: () => {
          const name = get().academy.name || 'Parallax Flow';
          const base = name.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 4) || 'PF';
          const code = `${base}-${pick(N, 2)}${pick(L, 2)}`;
          set((s) => ({ academy: { ...s.academy, code } }));
          log('settings', `New academy code ${code}`);
          return code;
        },
        addBatch: (b) => {
          const batch = { ...b, id: uid(), createdAt: Date.now() };
          set((s) => ({ batches: [...s.batches, batch] }));
          log('batch', `Batch “${batch.name}” created`);
          return batch;
        },
        updateBatch: (id, b) => set((s) => ({ batches: s.batches.map((x) => (x.id === id ? { ...x, ...b } : x)) })),
        deleteBatch: (id) => set((s) => ({ batches: s.batches.filter((x) => x.id !== id), students: s.students.filter((x) => x.batchId !== id) })),
        addStudent: (st) => {
          const prefix = (get().academy.code.split('-')[0] || 'pf').toLowerCase();
          const loginId = `${prefix}-${st.roll.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          if (get().students.some((x) => x.loginId === loginId)) return { error: `Roll number ${st.roll} is already used` };
          const student = { ...st, id: uid(), loginId, createdAt: Date.now() };
          set((s) => ({ students: [...s.students, student] }));
          log('student', `${student.name} added`);
          return { student, password: tempPassword() };
        },
        deleteStudent: (id) => set((s) => ({ students: s.students.filter((x) => x.id !== id) })),
        invite: (m) => { set((s) => ({ members: [...s.members, { ...m, id: uid(), invitedAt: Date.now() }] })); log('team', `${m.name} invited as ${m.role}`); },
        updateMember: (id, m) => set((s) => ({ members: s.members.map((x) => (x.id === id ? { ...x, ...m } : x)) })),
        removeMember: (id) => set((s) => ({ members: s.members.filter((x) => x.id !== id) })),
        addExam: (e) => {
          const exam: Exam = { ...e, id: uid(), createdAt: Date.now(), closedAt: null, received: 0, evaluated: 0, flagged: 0, reviewed: 0, published: 0 };
          set((s) => ({ exams: [exam, ...s.exams] }));
          log('exam', exam.draft ? `“${exam.title}” saved as a draft` : `“${exam.title}” scheduled`);
          return exam;
        },
        updateExam: (id, e) => set((s) => ({ exams: s.exams.map((x) => (x.id === id ? { ...x, ...e } : x)) })),
        deleteExam: (id) => { const t = get().exams.find((x) => x.id === id)?.title; set((s) => ({ exams: s.exams.filter((x) => x.id !== id) })); log('exam', `“${t}” deleted`); },
        setDefaults: (d) => set((s) => ({ defaults: { ...s.defaults, ...d } })),
        setAccess: (a) => set((s) => ({ access: { ...s.access, ...a } })),
        clearAll: () => set({ ...empty, signedIn: true }),
      };
    },
    {
      name: 'pf-academy',
      storage: createJSONStorage(() => {
        try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
        catch { const m = new Map<string, string>(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; }
      }),
      partialize: ({ signedIn, academy, me, batches, members, students, joinRequests, exams, activity, defaults, access }) =>
        ({ signedIn, academy, me, batches, members, students, joinRequests, exams, activity, defaults, access }),
    },
  ),
);

// ---------- derived ----------
export function examStatus(e: Exam, now = Date.now()): ExamStatus {
  if (e.draft) return 'draft';
  if (e.closedAt) return 'closed';
  if (e.mode === 'timed') {
    const lateMs = e.late === '30m' ? 30 * 60e3 : e.late === '24h' ? 24 * 3600e3 : 0;
    if (now < +new Date(e.opensAt)) return 'scheduled';
    if (now <= +new Date(e.closesAt) + lateMs) return 'live';
    return 'closed';
  }
  if (now < +new Date(e.practiceFrom)) return 'scheduled';
  if (e.practiceTo && now > +new Date(e.practiceTo) + 86400e3) return 'closed';
  return 'live';
}

export const POLICY: Record<Policy, { short: string; title: string; desc: string }> = {
  clean: { short: 'Hold flagged', title: 'Publish clean results, hold flagged ones', desc: 'Results without review flags go out automatically. Flagged scripts wait for a reviewer.' },
  auto: { short: 'Auto-publish', title: 'Publish every result automatically', desc: 'Students see marks as soon as the AI finishes. Flagged scripts still appear in Reviews.' },
  manual: { short: 'Faculty publishes', title: 'Hold everything for faculty', desc: 'Nothing reaches students until a reviewer or admin publishes.' },
};
export const LATE: Record<Late, string> = { none: 'Not allowed after the deadline', '30m': 'Up to 30 minutes, marked late', '24h': 'Up to 24 hours, marked late' };
export const SUBJECTS = ['Accounting', 'Corporate & Other Laws', 'Taxation', 'Cost & Management Accounting', 'Auditing & Ethics', 'Financial Management', 'Financial Reporting', 'Direct Tax Laws', 'Indirect Tax Laws'];
export const COURSES: Course[] = ['CA Foundation', 'CA Inter', 'CA Final'];
