import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { makeSample } from './sample';

// ---------- types ----------
export type Course = 'CA Foundation' | 'CA Inter' | 'CA Final';
export type Role = 'Academy admin' | 'Exam manager' | 'Faculty' | 'Reviewer';
export type Policy = 'clean' | 'auto' | 'manual';
export type Mode = 'timed' | 'practice';
export type Late = 'none' | '30m' | '24h';
export type ExamStatus = 'draft' | 'scheduled' | 'live' | 'closed';
export type ExamKind = 'mcq' | 'descriptive' | 'mixed';
export type StudentStatus = 'active' | 'inactive' | 'suspended';
export type Gender = 'Male' | 'Female' | 'Other';
export type EventType = 'class' | 'exam' | 'deadline' | 'holiday' | 'event' | 'task';
/** Where a live session happens. One entry can be on both, so the academy never has to keep two schedules in sync. */
export type Delivery = 'offline' | 'online';
export type RecordedType = 'class' | 'revision' | 'buffer' | 'task';

export interface Academy { name: string; city: string; email: string; phone: string; code: string; gstin: string; address: string }
export interface Me { name: string; email: string }
export interface Announcement { id: string; text: string; at: number }
export interface Batch {
  id: string; name: string; course: Course; facultyId: string; createdAt: number;
  status: 'active' | 'archived'; startDate: string; schedule: string; facultyIds: string[]; announcements: Announcement[];
}
export interface Member { id: string; name: string; email: string; phone?: string; role: Role; batchIds: string[]; subjects?: string[]; invitedAt: number }
/** Something the student did, shown on their profile (newest first). */
export interface StudentActivity { at: number; kind: 'mcq' | 'test' | 'batch' | 'device' | 'login'; text: string }
export interface Student {
  id: string; studentId: string; name: string; batchId: string; phone: string; email: string; loginId: string; createdAt: number;
  dob: string; gender: Gender; parentName: string; parentPhone: string;
  admissionDate: string; status: StudentStatus; progress: number; avgScore: number | null; trend: number[]; joinedVia: 'manual' | 'excel' | 'qr' | 'code';
  /** The one phone the app is tied to; a sign-in on another phone waits here for approval. */
  device: string; deviceRequest?: { name: string; at: number };
  activity: StudentActivity[];
}
/** The details a student enters in the app when joining with a QR or academy code. */
export type StudentDetails = Pick<Student, 'name' | 'phone' | 'email' | 'dob' | 'gender' | 'parentName' | 'parentPhone'>;
export interface JoinRequest extends StudentDetails { id: string; at: number }
export interface See { steps: boolean; needed: boolean; model: boolean; rank: boolean }
export interface Exam {
  id: string; title: string; subject: string; fileName: string; batchIds: string[]; kind?: ExamKind;
  mode: Mode; opensAt: string; closesAt: string; perQuestion: boolean; questionCount: number; late: Late;
  practiceFrom: string; practiceTo: string; attempts: 'unlimited' | '1' | '3';
  policy: Policy; reviewerId: string; see: See;
  draft: boolean; closedAt: number | null; createdAt: number;
  received: number; evaluated: number; flagged: number; reviewed: number; published: number;
}
/**
 * A dated entry on the live calendar. `time` is the start, `end` the finish.
 * `batchId` empty means the whole academy. A deadline is shown to every student in the batch's course
 * (or everyone, with no batch), in the offline, online and recorded views alike.
 */
export interface CalendarEvent {
  id: string; date: string; time?: string; end?: string; title: string; type: EventType; batchId?: string;
  subject?: string; topic?: string; facultyId?: string; delivery?: Delivery[];
}
/** One day of a course's recorded (self-paced) plan. Days are numbered, not dated. */
export interface RecordedDay { id: string; course: Course; day: number; type: RecordedType; subject?: string; chapter?: string; videos: string[]; topics?: string }
export interface JoinCode { id: string; code: string; batchId: string; limit: number; used: number; createdAt: number; active: boolean }
export interface CourseInfo { id: string; name: Course; active: boolean; subjects: number; materials: number }
export interface Revenue { ebooks: number; tests: number; questionBanks: number; monthly: number[] }
export interface Feed { uploads: { title: string; kind: string; at: number }[]; studentActs: { text: string; at: number }[] }
export interface Activity { id: string; kind: 'exam' | 'student' | 'batch' | 'team' | 'settings'; text: string; at: number }
export interface Defaults { policy: Policy; late: Late; flagBelow: number }
export interface Access { academyCreatesLogins: boolean; joinWithCode: boolean; approveJoins: boolean; otpReset: boolean }

export interface Data {
  sample: boolean;
  academy: Academy; me: Me;
  batches: Batch[]; members: Member[]; students: Student[]; joinRequests: JoinRequest[]; exams: Exam[];
  events: CalendarEvent[]; recorded: RecordedDay[]; codes: JoinCode[]; courses: CourseInfo[]; revenue: Revenue; feed: Feed;
  activity: Activity[]; defaults: Defaults; access: Access;
}

export type NewStudent = StudentDetails & Pick<Student, 'batchId'> & Partial<Pick<Student, 'joinedVia' | 'admissionDate'>>;

interface State extends Data {
  signedIn: boolean;
  signIn: (email: string) => void; signOut: () => void;
  saveAcademy: (a: Partial<Academy>, me?: Partial<Me>) => void;
  newCode: () => string;
  addBatch: (b: Pick<Batch, 'name' | 'course' | 'facultyId'> & Partial<Pick<Batch, 'startDate' | 'schedule'>>) => Batch;
  updateBatch: (id: string, b: Partial<Batch>) => void;
  deleteBatch: (id: string) => void;
  announce: (batchId: string, text: string) => void;
  addStudent: (s: NewStudent) => { student: Student; password: string } | { error: string };
  addStudents: (rows: NewStudent[]) => { added: number; skipped: number };
  updateStudent: (id: string, s: Partial<Student>) => void;
  updateStudents: (ids: string[], s: Partial<Student>) => void;
  removeStudents: (ids: string[]) => void;
  deleteStudent: (id: string) => void;
  decideDevice: (id: string, approve: boolean) => void;
  invite: (m: Omit<Member, 'id' | 'invitedAt'>) => void;
  updateMember: (id: string, m: Partial<Member>) => void;
  removeMember: (id: string) => void;
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  addEvents: (list: Omit<CalendarEvent, 'id'>[]) => void;
  addRecordedMany: (list: Omit<RecordedDay, 'id'>[]) => void;
  updateEvent: (id: string, e: Omit<CalendarEvent, 'id'>) => void;
  saveRecorded: (r: Omit<RecordedDay, 'id'>, id?: string) => void;
  removeRecorded: (id: string) => void;
  removeEvent: (id: string) => void;
  createJoinCode: (batchId: string, limit: number) => JoinCode;
  toggleJoinCode: (id: string) => void;
  addExam: (e: Omit<Exam, 'id' | 'createdAt' | 'received' | 'evaluated' | 'flagged' | 'reviewed' | 'published' | 'closedAt'>) => Exam;
  updateExam: (id: string, e: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  setDefaults: (d: Partial<Defaults>) => void;
  setAccess: (a: Partial<Access>) => void;
  clearAll: () => void;
  loadSample: () => void;
}

// ---------- helpers ----------
export const uid = () => Math.random().toString(36).slice(2, 10);
const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', N = '23456789';
const pick = (s: string, n: number) => Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('');
export const tempPassword = () => `${pick(L, 4)}-${pick(N, 4)}`;
/** Default app password: first 4 letters of the name (letters only, first one capital) @ year of birth, e.g. Gaut@2004. */
export const defaultPassword = (name: string, dob: string) => {
  const l = name.replace(/[^A-Za-z]/g, '').slice(0, 4).toLowerCase();
  return `${l.charAt(0).toUpperCase()}${l.slice(1)}@${dob.slice(0, 4)}`;
};
export const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const randomCode = (prefix = 'PF') => `${prefix}-${pick(N, 2)}${pick(L, 3)}`;
const today = () => new Date().toISOString().slice(0, 10);

export const emptyData = (): Data => ({
  sample: false,
  academy: { name: '', city: '', email: '', phone: '', code: '', gstin: '', address: '' },
  me: { name: '', email: '' },
  batches: [], members: [], students: [], joinRequests: [], exams: [], events: [], recorded: [], codes: [], courses: [],
  revenue: { ebooks: 0, tests: 0, questionBanks: 0, monthly: Array(12).fill(0) }, feed: { uploads: [], studentActs: [] },
  activity: [],
  defaults: { policy: 'clean', late: 'none', flagBelow: 0.7 },
  access: { academyCreatesLogins: true, joinWithCode: true, approveJoins: true, otpReset: false },
});

const DATA_KEYS: (keyof Data)[] = ['sample', 'academy', 'me', 'batches', 'members', 'students', 'joinRequests', 'exams', 'events', 'recorded', 'codes', 'courses', 'revenue', 'feed', 'activity', 'defaults', 'access'];

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const log = (kind: Activity['kind'], text: string) =>
        set((s) => ({ activity: [{ id: uid(), kind, text, at: Date.now() }, ...s.activity].slice(0, 60) }));
      // Student ID is the next number; the login ID is the email, so an email can only be used once.
      const makeStudent = (st: NewStudent): Student | null => {
        const loginId = st.email.trim().toLowerCase();
        if (!loginId || get().students.some((x) => x.loginId === loginId)) return null;
        const n = Math.max(10000, ...get().students.map((x) => +x.studentId.slice(2) || 0)) + 1;
        return {
          ...st, id: uid(), loginId, createdAt: Date.now(), studentId: `PF${n}`,
          admissionDate: st.admissionDate || today(), status: 'active', progress: 0, avgScore: null, trend: [], joinedVia: st.joinedVia || 'manual',
          device: '', activity: [{ at: Date.now(), kind: 'login', text: 'Account created' }],
        };
      };
      // A batch change is written to the student's activity.
      const moved = (x: Student, patch: Partial<Student>): Student => {
        if (!patch.batchId || patch.batchId === x.batchId) return { ...x, ...patch };
        const name = (id: string) => get().batches.find((b) => b.id === id)?.name ?? 'another batch';
        return { ...x, ...patch, activity: [{ at: Date.now(), kind: 'batch', text: `Moved from ${name(x.batchId)} to ${name(patch.batchId)}` }, ...x.activity] };
      };
      return {
        ...makeSample(),
        signedIn: false,
        signIn: (email) => set((s) => ({ signedIn: true, me: { ...s.me, email: email || s.me.email } })),
        signOut: () => set({ signedIn: false }),
        saveAcademy: (a, me) => { set((s) => ({ academy: { ...s.academy, ...a }, me: { ...s.me, ...me } })); log('settings', 'Academy details updated'); },
        newCode: () => {
          const name = get().academy.name || 'Parallax Flow';
          const base = name.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 4) || 'PF';
          const code = randomCode(base);
          set((s) => ({ academy: { ...s.academy, code } }));
          return code;
        },
        addBatch: (b) => {
          const batch: Batch = { startDate: today(), schedule: '', ...b, id: uid(), createdAt: Date.now(), status: 'active', facultyIds: b.facultyId ? [b.facultyId] : [], announcements: [] };
          set((s) => ({ batches: [...s.batches, batch] }));
          log('batch', `Batch “${batch.name}” created`);
          return batch;
        },
        updateBatch: (id, b) => set((s) => ({ batches: s.batches.map((x) => (x.id === id ? { ...x, ...b } : x)) })),
        deleteBatch: (id) => set((s) => ({ batches: s.batches.filter((x) => x.id !== id), students: s.students.filter((x) => x.batchId !== id) })),
        announce: (batchId, text) => set((s) => ({ batches: s.batches.map((b) => (b.id === batchId ? { ...b, announcements: [{ id: uid(), text, at: Date.now() }, ...b.announcements] } : b)) })),
        addStudent: (st) => {
          const student = makeStudent(st);
          if (!student) return { error: `${st.email.trim()} is already used by another student` };
          set((s) => ({ students: [student, ...s.students] }));
          log('student', `${student.name} added`);
          return { student, password: defaultPassword(student.name, student.dob) };
        },
        addStudents: (rows) => {
          let added = 0, skipped = 0;
          for (const r of rows) {
            const st = makeStudent(r);
            if (!st) { skipped++; continue; }
            set((s) => ({ students: [st, ...s.students] })); added++;
          }
          if (added) log('student', `${added} students imported`);
          return { added, skipped };
        },
        updateStudent: (id, st) => set((s) => ({ students: s.students.map((x) => (x.id === id ? moved(x, st) : x)) })),
        updateStudents: (ids, st) => { const pick = new Set(ids); set((s) => ({ students: s.students.map((x) => (pick.has(x.id) ? moved(x, st) : x)) })); },
        decideDevice: (id, approve) => set((s) => ({ students: s.students.map((x) => {
          if (x.id !== id || !x.deviceRequest) return x;
          const d = x.deviceRequest.name;
          return { ...x, device: approve ? d : x.device, deviceRequest: undefined, activity: [{ at: Date.now(), kind: 'device', text: approve ? `New phone approved: ${d}` : `Sign-in on ${d} was rejected` }, ...x.activity] };
        }) })),
        removeStudents: (ids) => { const pick = new Set(ids); set((s) => ({ students: s.students.filter((x) => !pick.has(x.id)) })); log('student', `${ids.length} students removed`); },
        deleteStudent: (id) => set((s) => ({ students: s.students.filter((x) => x.id !== id) })),
        invite: (m) => { set((s) => ({ members: [...s.members, { ...m, id: uid(), invitedAt: Date.now() }] })); log('team', `${m.name} added as ${m.role}`); },
        updateMember: (id, m) => set((s) => ({ members: s.members.map((x) => (x.id === id ? { ...x, ...m } : x)) })),
        removeMember: (id) => set((s) => ({ members: s.members.filter((x) => x.id !== id) })),
        addEvent: (e) => set((s) => ({ events: [...s.events, { ...e, id: uid() }] })),
        addEvents: (list) => { set((s) => ({ events: [...s.events, ...list.map((e) => ({ ...e, id: uid() }))] })); log('settings', `${list.length} calendar entries imported`); },
        addRecordedMany: (list) => { set((s) => ({ recorded: [...s.recorded, ...list.map((r) => ({ ...r, id: uid() }))] })); log('settings', `${list.length} recorded plan days imported`); },
        updateEvent: (id, e) => set((s) => ({ events: s.events.map((x) => (x.id === id ? { ...e, id } : x)) })),
        saveRecorded: (r, id) => set((s) => ({ recorded: id ? s.recorded.map((x) => (x.id === id ? { ...r, id } : x)) : [...s.recorded, { ...r, id: uid() }] })),
        removeRecorded: (id) => set((s) => ({ recorded: s.recorded.filter((x) => x.id !== id) })),
        removeEvent: (id) => set((s) => ({ events: s.events.filter((x) => x.id !== id) })),
        createJoinCode: (batchId, limit) => {
          const base = (get().academy.name || 'PF').replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 3) || 'PF';
          const code: JoinCode = { id: uid(), code: randomCode(base), batchId, limit, used: 0, createdAt: Date.now(), active: true };
          set((s) => ({ codes: [code, ...s.codes] }));
          return code;
        },
        toggleJoinCode: (id) => set((s) => ({ codes: s.codes.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) })),
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
        clearAll: () => set({ ...emptyData() }),
        loadSample: () => set({ ...makeSample() }),
      };
    },
    {
      name: 'pf-academy-v6',
      storage: createJSONStorage(() => {
        try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
        catch { const m = new Map<string, string>(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; }
      }),
      partialize: (s) => Object.fromEntries([['signedIn', s.signedIn], ...DATA_KEYS.map((k) => [k, s[k]])]) as Partial<State>,
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
export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
