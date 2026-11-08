// Sample academy used for the preview. Every name and figure is made up.
// The app labels it "Sample data", and Settings → Data clears it.
import type { Batch, CalendarEvent, Course, Data, Exam, ExamKind, FeeStatus, JoinCode, Member, Student, StudentStatus } from './store';

function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const FIRST = ['Aarav', 'Diya', 'Rohan', 'Sneha', 'Kabir', 'Meera', 'Ishaan', 'Ananya', 'Vihaan', 'Tara', 'Nikhil', 'Pooja', 'Arjun', 'Saanvi', 'Kunal', 'Ira', 'Dev', 'Neha', 'Yash', 'Aditi', 'Rahul', 'Kavya', 'Siddharth', 'Riya', 'Harsh', 'Lavanya', 'Farhan', 'Nandini', 'Varun', 'Shreya', 'Aditya', 'Keerthana', 'Pranav', 'Divya', 'Rakesh', 'Swathi', 'Gautham', 'Janani', 'Manoj', 'Priya'];
const LAST = ['Kulkarni', 'Menon', 'Pillai', 'Joshi', 'Sethi', 'Nair', 'Gupta', 'Rao', 'Shah', 'Bhatt', 'Verma', 'Reddy', 'Iyer', 'Desai', 'Bose', 'Kapoor', 'Patil', 'Kamath', 'Sharma', 'Agarwal', 'Krishnan', 'Subramanian', 'Raghavan', 'Venkatesh', 'Chandran'];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const local = (d: Date) => { const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const day = (offset: number, h = 10, m = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(h, m, 0, 0); return d; };

export function makeSample(): Data {
  const r = rng(20261108);
  const pickOne = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const now = Date.now();

  const faculty: Member[] = [
    ['R. Menon', 'Reviewer', ['Taxation', 'Direct Tax Laws']], ['S. Iyer', 'Faculty', ['Accounting', 'Financial Reporting']], ['P. Shah', 'Faculty', ['Corporate & Other Laws']],
    ['K. Das', 'Exam manager', ['Auditing & Ethics']], ['M. Krishnan', 'Faculty', ['Cost & Management Accounting']], ['A. Venkatesh', 'Reviewer', ['Financial Management']],
    ['L. Raghavan', 'Faculty', ['Indirect Tax Laws']], ['V. Chandran', 'Faculty', ['Accounting']], ['N. Subramanian', 'Reviewer', ['Taxation']],
    ['J. Kapoor', 'Faculty', ['Business Economics']], ['T. Bose', 'Faculty', ['Quantitative Aptitude']], ['H. Patil', 'Faculty', ['Business Laws']],
    ['G. Rao', 'Faculty', ['Financial Reporting']], ['D. Kulkarni', 'Reviewer', ['Auditing & Ethics']], ['C. Nair', 'Faculty', ['Strategic Cost Management']],
    ['B. Joshi', 'Faculty', ['Direct Tax Laws']], ['E. Desai', 'Exam manager', ['Accounting']], ['U. Kamath', 'Reviewer', ['Corporate & Other Laws']],
    ['I. Sethi', 'Faculty', ['Financial Management']], ['O. Reddy', 'Faculty', ['Indirect Tax Laws']],
  ].map(([name, role, subjects], i) => ({
    id: `f${i}`, name: name as string, email: `${(name as string).toLowerCase().replace(/[^a-z]/g, '')}@northstar.example`, phone: `+91 98${String(40000000 + i * 7919).slice(0, 8)}`,
    role: role as Member['role'], subjects: subjects as string[], batchIds: [], invitedAt: now - (60 - i) * 86400e3,
  }));

  // About 2,500 students across 31 batches, the size the client's academies run at.
  const SCHED = ['Mon, Wed, Fri · 9:00–12:00', 'Tue, Thu, Sat · 14:00–17:00', 'Weekends · 9:00–13:00', 'Mon–Fri · 7:00–9:00', 'Mon–Fri · 18:00–20:00', 'Mon, Wed, Fri · 10:00–13:00', 'Tue, Thu, Sat · 10:00–13:00', 'Mon–Sat · 7:00–9:00', 'Mon–Fri · 19:00–21:00'];
  const intakes: [Course, string, string[]][] = [
    ['CA Foundation', 'Jan 2027', ['A', 'B', 'C', 'D']], ['CA Foundation', 'May 2027', ['A', 'B', 'C']], ['CA Foundation', 'Sep 2027', ['A', 'B']],
    ['CA Inter', 'Jan 2027', ['A', 'B', 'C', 'D']], ['CA Inter', 'May 2027', ['A', 'B', 'C', 'D']], ['CA Inter', 'Sep 2027', ['A', 'B']], ['CA Inter', 'Nov 2026', ['A', 'B']],
    ['CA Final', 'Nov 2026', ['A', 'B', 'C']], ['CA Final', 'May 2027', ['A', 'B', 'C']], ['CA Final', 'Nov 2027', ['A']],
  ];
  const batchDefs: [string, Course, number, string][] = [];
  intakes.forEach(([c, m, secs]) => secs.forEach((sec) => batchDefs.push([`${c} · ${m} · ${sec}`, c, 62 + Math.floor(r() * 46), SCHED[batchDefs.length % SCHED.length]])));
  batchDefs.push(['CA Inter · May 2026', 'CA Inter', 71, 'Completed'], ['CA Foundation · Sep 2026 · A', 'CA Foundation', 64, 'Completed'], ['CA Foundation · Sep 2026 · B', 'CA Foundation', 58, 'Completed']);
  const ACTIVE = batchDefs.length - 3;
  const batches: Batch[] = batchDefs.map(([name, course, , schedule], i) => {
    const fIds = [faculty[i % faculty.length].id, faculty[(i + 3) % faculty.length].id];
    fIds.forEach((fid) => faculty.find((f) => f.id === fid)!.batchIds.push(`b${i}`));
    return {
      id: `b${i}`, name, course, facultyId: fIds[0], facultyIds: fIds, createdAt: now - (240 - i * 6) * 86400e3,
      status: i >= ACTIVE ? 'archived' : 'active', startDate: iso(day(-220 + i * 6)), schedule,
      announcements: i < 6 ? [{ id: `a${i}`, text: i % 2 ? 'Mock test on Saturday. Bring your calculator.' : 'Revision class moved to 10 am this week.', at: now - (i + 1) * 3600e3 * 7 }] : [],
    };
  });

  const students: Student[] = [];
  let n = 0;
  batchDefs.forEach(([, course], bi) => {
    const prefix = course === 'CA Foundation' ? 'FDN' : course === 'CA Inter' ? 'INT' : 'FIN';
    for (let k = 0; k < batchDefs[bi][2]; k++) {
      n++;
      const name = `${pickOne(FIRST)} ${pickOne(LAST)}`;
      const base = 45 + r() * 40;
      const trend = Array.from({ length: 8 }, (_, t) => Math.round(Math.max(20, Math.min(98, base + (t - 4) * (r() * 2.5 - 0.6) + (r() * 10 - 5)))));
      const status: StudentStatus = r() < 0.9 ? 'active' : r() < 0.6 ? 'inactive' : 'suspended';
      const fee: FeeStatus = r() < 0.72 ? 'paid' : r() < 0.6 ? 'partial' : 'due';
      const roll = `${prefix}-${String(n).padStart(4, '0')}`;
      students.push({
        id: `s${n}`, studentId: `PF${10000 + n}`, name, roll, batchId: `b${bi}`, phone: `+91 9${String(Math.floor(r() * 1e9)).padStart(9, '0')}`,
        email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}${n}@mail.example`, loginId: `ns-${roll.toLowerCase().replace('-', '')}`,
        createdAt: now - Math.floor(r() * 180) * 86400e3, admissionDate: iso(day(-Math.floor(r() * 200))), status, fee,
        progress: Math.round(20 + r() * 75), avgScore: trend[trend.length - 1], trend, joinedVia: pickOne(['manual', 'excel', 'excel', 'qr', 'code'] as const),
      });
    }
  });
  students.sort((a, b) => b.createdAt - a.createdAt);

  const subjects = ['Accounting', 'Taxation', 'Auditing & Ethics', 'Corporate & Other Laws', 'Cost & Management Accounting', 'Financial Management', 'Indirect Tax Laws'];
  const exams: Exam[] = [];
  const mk = (i: number, title: string, opens: Date, hours: number, kind: ExamKind, draft = false): Exam => {
    const bIds = [`b${(i * 7) % ACTIVE}`];
    const enrolled = students.filter((s) => s.batchId === bIds[0]).length;
    const past = opens.getTime() + hours * 3600e3 < now;
    const live = !past && opens.getTime() < now;
    const received = past ? Math.round(enrolled * (0.8 + r() * 0.18)) : live ? Math.round(enrolled * r() * 0.6) : 0;
    const flagged = past ? Math.round(received * 0.08) : 0;
    return {
      id: `e${i}`, title, subject: subjects[i % subjects.length], fileName: `${title.replace(/\s+/g, '_')}.docx`, batchIds: bIds, kind,
      mode: 'timed', opensAt: local(opens), closesAt: local(new Date(opens.getTime() + hours * 3600e3)), perQuestion: false, questionCount: kind === 'mcq' ? 40 : 5, late: 'none',
      practiceFrom: iso(opens), practiceTo: '', attempts: '1', policy: 'clean', reviewerId: 'f0', see: { steps: true, needed: true, model: true, rank: false },
      draft, closedAt: null, createdAt: opens.getTime() - 5 * 86400e3, received, evaluated: received, flagged, reviewed: Math.round(flagged * 0.7), published: Math.max(0, received - flagged),
    };
  };
  const names = ['PGBP Unit Test', 'Capital Gains Test', 'AS 10 Quiz', 'GST Mock', 'Audit Standards Test', 'Company Law MCQs', 'Costing Revision', 'FM Ratio Test', 'Ind AS Drill', 'Partnership Accounts'];
  for (let i = 0; i < 44; i++) exams.push(mk(i, `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`, day(-2 - Math.floor(i * 1.6), 10), 3, i % 3 === 0 ? 'descriptive' : i % 3 === 1 ? 'mcq' : 'mixed'));
  const hr = new Date().getHours();
  exams.push(mk(44, 'Taxation Weekly Test', day(0, hr - 1), 3, 'descriptive'));
  exams.push(mk(45, 'Accounts MCQ Sprint', day(0, hr - 1), 2, 'mcq'));
  exams.push(mk(46, 'Audit Case Drill', day(0, hr), 3, 'mixed'));
  [['Accounts Mock', 1], ['Taxation Full Test', 2], ['Audit Chapter Test', 3], ['Law Case Study', 4], ['Costing MCQs', 6], ['FM Descriptive', 7], ['GST Full Mock', 9], ['Ind AS Revision Test', 11], ['Company Law Drill', 13], ['SFM Mock', 15]].forEach(([t, d], k) =>
    exams.push(mk(47 + k, t as string, day(d as number, 10), 3, k % 2 ? 'mcq' : 'descriptive')));
  exams.push(mk(57, 'Indirect Tax Practice', day(5, 10), 2, 'mixed', true));
  exams.push(mk(58, 'Final Revision Mock', day(20, 10), 3, 'descriptive', true));

  const events: CalendarEvent[] = [];
  exams.filter((e) => !e.draft && +new Date(e.opensAt) > now - 86400e3).forEach((e) => events.push({ id: `ev-${e.id}`, date: e.opensAt.slice(0, 10), time: e.opensAt.slice(11), title: e.title, type: 'exam', batchId: e.batchIds[0] }));
  for (let d = -3; d < 35; d++) {
    const dt = day(d);
    if (dt.getDay() === 0) continue;
    if (d % 2 === 0) events.push({ id: `c${d}`, date: iso(dt), time: '07:00', title: `${subjects[(d + 7) % subjects.length]} class`, type: 'class', batchId: `b${(d + 20) % ACTIVE}` });
  }
  events.push({ id: 'h1', date: iso(day(6)), title: 'Academy holiday', type: 'holiday' });
  events.push({ id: 'd1', date: iso(day(3)), title: 'Fee due date · Nov instalment', type: 'deadline' });
  events.push({ id: 'd2', date: iso(day(12)), title: 'ICAI exam form last date', type: 'deadline' });
  events.push({ id: 'x1', date: iso(day(17)), time: '16:00', title: 'Toppers’ talk', type: 'event' });

  const codes: JoinCode[] = [
    { id: 'jc1', code: 'NSA-72KMP', batchId: 'b5', limit: 120, used: 97, createdAt: now - 40 * 86400e3, active: true },
    { id: 'jc2', code: 'NSA-39RTV', batchId: 'b2', limit: 60, used: 41, createdAt: now - 12 * 86400e3, active: true },
  ];

  return {
    sample: true,
    academy: { name: 'Northstar Academy', city: 'Chennai', email: 'office@northstar.example', phone: '+91 44 0000 0000', code: 'NSA-48QWE' },
    me: { name: 'Lakshmi R', email: 'admin@northstar.example' },
    batches, members: faculty, students,
    joinRequests: [
      { id: 'j1', name: 'Harsh Agarwal', phone: '+91 98••• 4410', roll: '', at: now - 12 * 60e3 },
      { id: 'j2', name: 'Lavanya S', phone: '+91 97••• 1182', roll: '', at: now - 3600e3 },
      { id: 'j3', name: 'Farhan Qureshi', phone: '+91 90••• 7759', roll: '', at: now - 26 * 3600e3 },
      { id: 'j4', name: 'Keerthana V', phone: '+91 99••• 2051', roll: '', at: now - 30 * 3600e3 },
      { id: 'j5', name: 'Rakesh Pillai', phone: '+91 96••• 6630', roll: '', at: now - 40 * 3600e3 },
      { id: 'j6', name: 'Janani M', phone: '+91 95••• 0917', roll: '', at: now - 52 * 3600e3 },
      { id: 'j7', name: 'Pranav Iyer', phone: '+91 93••• 4472', roll: '', at: now - 70 * 3600e3 },
    ],
    exams, events, codes,
    courses: [
      { id: 'c1', name: 'CA Inter', active: true, subjects: 12, materials: 412 },
      { id: 'c2', name: 'CA Foundation', active: true, subjects: 4, materials: 268 },
      { id: 'c3', name: 'CA Final', active: true, subjects: 8, materials: 305 },
    ],
    revenue: { ebooks: 2340000, tests: 410000, questionBanks: 345000, monthly: [142, 158, 171, 166, 188, 203, 214, 236, 229, 258, 284, 311].map((v) => v * 1000) },
    feed: {
      uploads: [
        { title: 'AS 10 – Property, Plant & Equipment', kind: 'PDF', at: now - 2 * 3600e3 },
        { title: 'GST Notes – Input Tax Credit', kind: 'PDF', at: now - 5 * 3600e3 },
        { title: 'Audit MCQs – SA 200 to 299', kind: 'Excel', at: now - 26 * 3600e3 },
        { title: 'Costing – Marginal Costing lecture', kind: 'Video', at: now - 50 * 3600e3 },
      ],
      studentActs: [
        { text: 'submitted Taxation Weekly Test', at: now - 8 * 60e3 },
        { text: 'completed chapter “Capital Gains”', at: now - 25 * 60e3 },
        { text: 'attempted 40 MCQs in Accounts', at: now - 48 * 60e3 },
        { text: 'downloaded GST Notes', at: now - 90 * 60e3 },
      ],
    },
    activity: [],
    defaults: { policy: 'clean', late: 'none', flagBelow: 0.7 },
    access: { academyCreatesLogins: true, joinWithCode: true, approveJoins: true, otpReset: false },
  };
}
