import { motion } from 'framer-motion';
import { Copy, Download, FileSpreadsheet, KeyRound, PenLine, QrCode, RefreshCw, Upload } from 'lucide-react';
import QRCode from 'qrcode';
import readXlsxFile from 'read-excel-file';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { COURSES, defaultPassword, useStore, validEmail, type Batch, type Course, type Gender, type Student, type StudentDetails } from '../lib/store';
import { EventDialog, RecordedDialog } from './CalendarDialogs';
import { FacultyDialog } from './FacultyDialog';
import { CalendarImportDialog } from './CalendarImport';
import { useUI } from '../lib/ui-state';
import { cn, downloadCSV } from '../lib/utils';
import { Badge, Button, Dialog, Field, Input, Progress, Segmented, Select, Skeleton } from './ui';

export function Dialogs() {
  return (<><BatchDialog /><AddStudentsDialog /><InviteDialog /><EventDialog /><RecordedDialog /><CalendarImportDialog /></>);
}

function useDialog(...names: string[]) {
  const { dialog, close, dialogArg } = useUI();
  const open = !!dialog && names.includes(dialog);
  return { open, onOpenChange: (v: boolean) => !v && close(), close, arg: dialogArg, which: dialog };
}

function BatchDialog() {
  const d = useDialog('batch');
  const { addBatch, updateBatch, batches, members } = useStore();
  const editing = batches.find((b) => b.id === d.arg);
  const blank = { name: '', course: 'CA Inter' as Course, facultyId: '', startDate: '', endDate: '', status: 'active' as Batch['status'] };
  const [f, setF] = useState(blank);
  useEffect(() => {
    if (d.open) setF(editing ? { name: editing.name, course: editing.course, facultyId: editing.facultyId, startDate: editing.startDate, endDate: editing.endDate ?? '', status: editing.status }
      : { ...blank, startDate: new Date().toISOString().slice(0, 10) });
  }, [d.open]); // eslint-disable-line
  const ok = f.name.trim() && (!f.endDate || f.endDate >= f.startDate);
  const submit = (e: FormEvent) => {
    e.preventDefault(); if (!ok) return;
    const data = { ...f, name: f.name.trim(), endDate: f.endDate || undefined };
    if (editing) updateBatch(editing.id, { ...data, facultyIds: f.facultyId && !editing.facultyIds.includes(f.facultyId) ? [f.facultyId, ...editing.facultyIds] : editing.facultyIds });
    else addBatch(data);
    toast.success(editing ? 'Batch updated' : 'Batch created'); d.close();
  };
  return (
    <Dialog open={d.open} onOpenChange={d.onOpenChange} title={editing ? 'Edit batch' : 'New batch'} desc="Students belong to a batch. Courses, faculty and exams are given to batches."
      footer={<><Button onClick={d.close}>Cancel</Button><Button variant="primary" type="submit" form="batch-form" disabled={!ok}>{editing ? 'Save' : 'Create batch'}</Button></>}>
      <form id="batch-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="nb-name" className="sm:col-span-2"><Input id="nb-name" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="CA Inter · May 2027 · Batch A" /></Field>
        <Field label="Course" htmlFor="nb-course"><Select id="nb-course" value={f.course} onChange={(e) => setF({ ...f, course: e.target.value as Course })}>{COURSES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Lead faculty" htmlFor="nb-fac" optional><Select id="nb-fac" value={f.facultyId} onChange={(e) => setF({ ...f, facultyId: e.target.value })}><option value="">Not assigned</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
        <Field label="Starts" htmlFor="nb-start"><Input id="nb-start" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
        <Field label="End date" htmlFor="nb-end" optional hint={f.endDate && f.endDate < f.startDate ? <span className="text-bad">Ends before it starts.</span> : undefined}><Input id="nb-end" type="date" min={f.startDate} value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></Field>
        {editing && <Field label="Status" className="sm:col-span-2" hint={f.status === 'archived' ? 'Archived batches move to the Archived tab. Their students and records stay.' : undefined}><Segmented value={f.status} onChange={(v) => setF({ ...f, status: v })} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} /></Field>}
      </form>
    </Dialog>
  );
}

// ---------- Add students: manual, Excel, QR, academy code ----------
type Method = 'manual' | 'excel' | 'qr' | 'code';

function AddStudentsDialog() {
  const d = useDialog('student', 'import');
  const { batches } = useStore();
  const active = batches.filter((b) => b.status === 'active');
  const [method, setMethod] = useState<Method>('manual');
  const [batchId, setBatchId] = useState('');
  useEffect(() => {
    if (!d.open) return;
    setMethod(d.which === 'import' ? 'excel' : 'manual');
    setBatchId(d.arg && batches.some((b) => b.id === d.arg) ? d.arg : active[0]?.id || '');
  }, [d.open]); // eslint-disable-line

  if (!batches.length) {
    return <Dialog open={d.open} onOpenChange={d.onOpenChange} title="Create a batch first" desc="Every student belongs to a batch."
      footer={<><Button onClick={d.close}>Cancel</Button><Button variant="primary" onClick={() => useUI.getState().open('batch')}>New batch</Button></>} />;
  }
  return (
    <Dialog wide open={d.open} onOpenChange={d.onOpenChange} title="Add students" desc="Four ways in. Every student gets one record, shared by the directory and their batch.">
      <div className="space-y-5 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented value={method} onChange={setMethod} options={[
            { value: 'manual', label: <><PenLine className="size-3.5" /> Manual</> }, { value: 'excel', label: <><FileSpreadsheet className="size-3.5" /> Excel</> },
            { value: 'qr', label: <><QrCode className="size-3.5" /> QR code</> }, { value: 'code', label: <><KeyRound className="size-3.5" /> Academy code</> },
          ]} />
          {method !== 'manual' && <Select aria-label="Batch" value={batchId} onChange={(e) => setBatchId(e.target.value)} className="ml-auto w-full sm:w-64">{active.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>}
        </div>
        <motion.div key={method} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {method === 'manual' && <ManualForm onDone={d.close} />}
          {method === 'excel' && <ExcelImport batchId={batchId} onDone={d.close} />}
          {method === 'qr' && <QrJoin batchId={batchId} />}
          {method === 'code' && <CodeJoin batchId={batchId} />}
        </motion.div>
      </div>
    </Dialog>
  );
}

// The student fields, in the order the client gave them. The Excel template and export use the same order.
export const STUDENT_COLUMNS = ['Student Name', 'DOB', 'Gender', 'Mobile Number', 'Email ID', 'Course', 'Batch', 'Parents Name', 'Parents Mobile Number', 'Admission Date'] as const;
const todayIso = () => new Date().toISOString().slice(0, 10);
type Form = StudentDetails & { course: Course; batchId: string; admissionDate: string };

function ManualForm({ onDone }: { onDone: () => void }) {
  const { addStudent, academy, batches, students } = useStore();
  const active = batches.filter((b) => b.status === 'active');
  const blank = (): Form => ({ name: '', dob: '', gender: 'Male', phone: '', email: '', course: 'CA Foundation', batchId: active.find((b) => b.course === 'CA Foundation')?.id ?? '', parentName: '', parentPhone: '', admissionDate: todayIso() });
  const [f, setF] = useState<Form>(blank);
  const [done, setDone] = useState<{ student: Student; password: string } | null>(null);
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  const text = (k: keyof StudentDetails) => (e: { target: { value: string } }) => set({ [k]: e.target.value });
  const taken = students.some((x) => x.loginId === f.email.trim().toLowerCase());
  const ok = f.name.trim() && f.dob && f.phone.trim() && validEmail(f.email) && !taken && f.batchId && f.parentName.trim() && f.parentPhone.trim() && f.admissionDate;
  const nextId = `PF${Math.max(10000, ...students.map((x) => +x.studentId.slice(2) || 0)) + 1}`;
  const submit = (e: FormEvent) => {
    e.preventDefault(); if (!ok) return;
    const { course: _c, ...st } = f;
    const r = addStudent({ ...st, name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), parentName: f.parentName.trim(), parentPhone: f.parentPhone.trim(), joinedVia: 'manual' });
    if ('error' in r) { toast.error(r.error); return; }
    setDone(r);
  };
  if (done) {
    const share = `${academy.name || 'Parallax Flow'}\nStudent ID: ${done.student.studentId}\nLogin ID: ${done.student.loginId}\nPassword: ${done.password}`;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-subtle p-5">
          <div className="mb-3 flex items-center gap-2"><Badge tone="pop">Login created</Badge><span className="text-sm font-semibold">{done.student.name}</span></div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">Student ID</dt><dd className="font-mono">{done.student.studentId}</dd>
            <dt className="text-muted">Login ID</dt><dd className="break-all font-mono">{done.student.loginId}</dd>
            <dt className="text-muted">Password</dt><dd className="font-mono">{done.password}</dd>
            <dt className="text-muted">Batch</dt><dd>{batches.find((b) => b.id === done.student.batchId)?.name}</dd>
          </dl>
        </div>
        <p className="text-xs text-muted">Default password: first 4 letters of the name @ year of birth. The student can change it in the app.</p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => navigator.clipboard?.writeText(share).then(() => toast.success('Copied'), () => toast('Select the details and copy them'))}><Copy /> Copy</Button>
          <Button onClick={() => { setF(blank()); setDone(null); }}>Add another</Button>
          <Button variant="primary" onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Student name" htmlFor="as-name"><Input id="as-name" autoFocus value={f.name} onChange={text('name')} /></Field>
      <Field label="Date of birth" htmlFor="as-dob"><Input id="as-dob" type="date" max={todayIso()} value={f.dob} onChange={text('dob')} /></Field>
      <Field label="Gender"><Segmented value={f.gender} onChange={(g: Gender) => set({ gender: g })} options={(['Male', 'Female', 'Other'] as const).map((g) => ({ value: g, label: g }))} /></Field>
      <Field label="Mobile number" htmlFor="as-ph"><Input id="as-ph" inputMode="tel" value={f.phone} onChange={text('phone')} placeholder="+91" /></Field>
      <Field label="Email ID" htmlFor="as-em" className="sm:col-span-2" hint={taken ? <span className="text-bad">Another student already uses this email.</span> : f.email && !validEmail(f.email) ? <span className="text-bad">Enter a valid email.</span> : 'This is also the student’s login ID.'}>
        <Input id="as-em" type="email" value={f.email} onChange={text('email')} />
      </Field>
      <Field label="Course" htmlFor="as-course"><Select id="as-course" value={f.course} onChange={(e) => { const c = e.target.value as Course; set({ course: c, batchId: active.find((b) => b.course === c)?.id ?? '' }); }}>{COURSES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
      <Field label="Batch" htmlFor="as-batch"><Select id="as-batch" value={f.batchId} onChange={(e) => set({ batchId: e.target.value })}>{active.filter((b) => b.course === f.course).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
      <Field label="Parent’s name" htmlFor="as-pn"><Input id="as-pn" value={f.parentName} onChange={text('parentName')} /></Field>
      <Field label="Parent’s mobile number" htmlFor="as-pp"><Input id="as-pp" inputMode="tel" value={f.parentPhone} onChange={text('parentPhone')} placeholder="+91" /></Field>
      <Field label="Admission date" htmlFor="as-ad"><Input id="as-ad" type="date" value={f.admissionDate} onChange={(e) => set({ admissionDate: e.target.value })} /></Field>
      <div className="rounded-xl bg-subtle p-3 text-xs">
        <div className="mb-1 font-semibold">Created automatically</div>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-muted">
          <span>Student ID</span><span className="font-mono text-fg">{nextId}</span>
          <span>Login ID</span><span className="truncate font-mono text-fg">{f.email.trim().toLowerCase() || 'the email'}</span>
          <span>Password</span><span className="font-mono text-fg">{f.name.trim() && f.dob ? defaultPassword(f.name, f.dob) : 'Name@Year'}</span>
        </div>
      </div>
      <div className="flex justify-end sm:col-span-2"><Button type="submit" variant="primary" disabled={!ok}>Create login</Button></div>
    </form>
  );
}

// ---------- Excel import: same columns as the form ----------
type Row = StudentDetails & { course: string; batch: string; admissionDate: string };
const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '');
const HEAD: Record<keyof Row, string[]> = {
  name: ['studentname', 'name'], dob: ['dob', 'dateofbirth'], gender: ['gender'], phone: ['mobilenumber', 'mobile', 'mobileno', 'phone'], email: ['emailid', 'email'],
  course: ['course'], batch: ['batch'], parentName: ['parentsname', 'parentname'], parentPhone: ['parentsmobilenumber', 'parentmobilenumber', 'parentsmobile', 'parentmobile'], admissionDate: ['admissiondate', 'dateofjoining'],
};
/** Excel dates arrive as Date objects; typed dates may be dd-mm-yyyy or dd/mm/yyyy. Everything becomes yyyy-mm-dd. */
const toIso = (v: unknown) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const t = String(v ?? '').trim(), m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : '';
};
const toGender = (v: string): Gender => (/^f/i.test(v) ? 'Female' : /^m/i.test(v) ? 'Male' : 'Other');
function toRows(table: unknown[][]): Row[] {
  if (!table.length) return [];
  const head = table[0].map((h) => norm(String(h ?? '')));
  const hasHeader = head.some((h) => HEAD.name.includes(h));
  const keys = Object.keys(HEAD) as (keyof Row)[];
  const at = (k: keyof Row) => (hasHeader ? head.findIndex((h) => HEAD[k].includes(h)) : keys.indexOf(k));
  return (hasHeader ? table.slice(1) : table).map((r) => {
    const get = (k: keyof Row) => { const i = at(k); return i >= 0 ? r[i] : ''; };
    const str = (k: keyof Row) => String(get(k) ?? '').trim();
    return { name: str('name'), dob: toIso(get('dob')), gender: toGender(str('gender')), phone: str('phone'), email: str('email'), course: str('course'), batch: str('batch'), parentName: str('parentName'), parentPhone: str('parentPhone'), admissionDate: toIso(get('admissionDate')) || todayIso() };
  }).filter((r) => r.name);
}
function parseCsv(text: string): string[][] {
  return text.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
}

function ExcelImport({ batchId, onDone }: { batchId: string; onDone: () => void }) {
  const { addStudents, batches, students } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const load = async (f: File) => {
    setFile(f); setErr('');
    try {
      const table: unknown[][] = f.name.toLowerCase().endsWith('.csv') ? parseCsv(await f.text()) : await readXlsxFile(f);
      const parsed = toRows(table);
      if (!parsed.length) setErr(`No students found. The first row should be the headings: ${STUDENT_COLUMNS.join(', ')}.`);
      setRows(parsed);
    } catch { setErr('This file couldn’t be read. Save it as .xlsx or .csv and try again.'); setRows([]); }
  };
  // Batch by name; if it's missing, the course's first active batch; otherwise the batch picked above.
  const batchFor = (r: Row) => batches.find((b) => b.name.toLowerCase() === r.batch.toLowerCase())?.id
    || batches.find((b) => b.status === 'active' && r.course && b.course.toLowerCase() === r.course.toLowerCase())?.id || batchId;
  const problem = (r: Row) => (!validEmail(r.email) ? 'Email missing or invalid' : students.some((x) => x.loginId === r.email.toLowerCase()) ? 'Email already used' : !r.dob ? 'Date of birth missing' : '');
  const ready = rows.filter((r) => !problem(r));
  const doImport = () => {
    const res = addStudents(ready.map(({ course: _c, batch: _b, ...r }) => ({ ...r, batchId: batchFor({ ...r, course: _c, batch: _b }), joinedVia: 'excel' as const })));
    toast.success(`${res.added} ${res.added === 1 ? 'student' : 'students'} added`, { description: `Logins created. Passwords follow the rule Name@Year.${res.skipped ? ` ${res.skipped} skipped: email already used.` : ''}` });
    onDone();
  };
  const template = () => void downloadCSV('students-template.csv', [[...STUDENT_COLUMNS], ['Aarav Kulkarni', '2004-06-15', 'Male', '+91 98000 00001', 'aarav@example.com', 'CA Foundation', '', 'Ramesh Kulkarni', '+91 98000 00002', todayIso()]])
    .then((ok) => ok && toast.success('Template downloaded', { description: 'Fill one student per row, then import it here.' }));
  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border-strong bg-subtle px-4 py-8 text-center transition hover:border-fg/40">
        {file ? <FileSpreadsheet className="size-6" /> : <Upload className="size-6 text-muted" />}
        <span className="text-sm font-semibold">{file ? file.name : 'Choose an Excel or CSV file'}</span>
        <span className="max-w-md text-xs text-muted">Columns: {STUDENT_COLUMNS.join(', ')}. If Batch is empty, the course’s first batch (or the one above) is used.</span>
        <input id="im-file" type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
      </label>
      {err && <p className="text-xs text-bad">{err}</p>}
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-border">
          <div className="flex items-center justify-between bg-subtle px-4 py-2 text-xs"><span className="font-semibold">{rows.length} rows found · {ready.length} ready</span>{rows.length > ready.length && <span className="text-warn">{rows.length - ready.length} will be skipped</span>}</div>
          <div className="max-h-56 overflow-auto">
            <table className="w-full text-xs"><thead className="text-left text-faint"><tr><th className="px-4 py-1.5 font-medium">Name</th><th className="px-2 py-1.5 font-medium">Login ID</th><th className="px-2 py-1.5 font-medium">Password</th><th className="px-4 py-1.5 font-medium">Batch</th></tr></thead>
              <tbody>{rows.slice(0, 50).map((r, i) => { const p = problem(r); return (
                <tr key={i} className="border-t border-border"><td className="px-4 py-2 font-medium">{r.name}</td>
                  {p ? <td colSpan={3} className="px-2 py-2 text-bad">{p}</td> : <><td className="px-2 py-2 font-mono">{r.email.toLowerCase()}</td><td className="px-2 py-2 font-mono">{defaultPassword(r.name, r.dob)}</td><td className="px-4 py-2 text-muted">{batches.find((b) => b.id === batchFor(r))?.name}</td></>}
                </tr>
              ); })}</tbody></table>
          </div>
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <Button onClick={template}><Download /> Download template</Button>
        <Button variant="primary" disabled={!ready.length} onClick={doImport}>Import {ready.length || ''} {ready.length === 1 ? 'student' : 'students'}</Button>
      </div>
    </div>
  );
}

const QR_SECONDS = 10;
function QrJoin({ batchId }: { batchId: string }) {
  const { academy, batches } = useStore();
  const [token, setToken] = useState(() => Math.random().toString(36).slice(2, 10));
  const [left, setLeft] = useState(QR_SECONDS);
  const [svg, setSvg] = useState('');
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => {
      if (l <= 1) { setToken(Math.random().toString(36).slice(2, 10)); return QR_SECONDS; }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, []);
  const payload = useMemo(() => `parallaxflow://join?academy=${encodeURIComponent(academy.code || 'preview')}&batch=${batchId}&t=${token}`, [academy.code, batchId, token]);
  useEffect(() => { QRCode.toString(payload, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0f0f12', light: '#ffffff' } }).then(setSvg); }, [payload]);
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
      <div className="relative mx-auto rounded-3xl bg-white p-4 shadow-float">
        {svg ? <motion.div key={token} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="size-48 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <Skeleton className="size-48" />}
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative grid size-14 place-items-center">
            <svg width="56" height="56" className="-rotate-90"><circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--subtle))" strokeWidth="5" />
              <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--pop))" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (left / QR_SECONDS) * c} style={{ transition: 'stroke-dashoffset 1s linear' }} /></svg>
            <span className="tnum absolute text-sm font-bold">{left}s</span>
          </div>
          <div><div className="text-sm font-semibold">New code every {QR_SECONDS} seconds</div><div className="text-xs text-muted">A photo or screenshot stops working almost at once.</div></div>
        </div>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>Show this on the classroom screen.</li>
          <li>Students scan it in the Parallax Flow app.</li>
          <li>They join <b className="font-semibold text-fg">{batches.find((b) => b.id === batchId)?.name}</b>{useStore.getState().access.approveJoins ? ' after you approve them.' : ' straight away.'}</li>
        </ol>
        <Button onClick={() => { setToken(Math.random().toString(36).slice(2, 10)); setLeft(QR_SECONDS); }}><RefreshCw /> New code now</Button>
      </div>
    </div>
  );
}

function CodeJoin({ batchId }: { batchId: string }) {
  const { codes, batches, createJoinCode, toggleJoinCode } = useStore();
  const [limit, setLimit] = useState(60);
  const forBatch = codes.filter((c) => c.batchId === batchId);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-subtle p-4">
        <Field label="How many students can join with it" htmlFor="jc-limit" className="w-56"><Input id="jc-limit" type="number" min={1} max={2000} value={limit} onChange={(e) => setLimit(Math.max(1, Math.min(2000, +e.target.value || 1)))} /></Field>
        <Button variant="primary" onClick={() => { const c = createJoinCode(batchId, limit); toast.success(`Code ${c.code} created`, { description: `Up to ${limit} students` }); }}><KeyRound /> Create code</Button>
        <p className="w-full text-xs text-muted">Students type the code in the app. It stops working once {limit} students have joined, or when you turn it off.</p>
      </div>
      {forBatch.length ? (
        <ul className="space-y-2">
          {forBatch.map((c) => (
            <li key={c.id} className={cn('flex flex-wrap items-center gap-4 rounded-2xl p-4 ring-1 ring-border', !c.active && 'opacity-60')}>
              <span className="font-mono text-lg font-bold tracking-wider">{c.code}</span>
              <div className="min-w-40 flex-1"><div className="tnum mb-1 flex justify-between text-2xs text-muted"><span>{c.used} of {c.limit} joined</span><span>{Math.round((c.used / c.limit) * 100)}%</span></div><Progress value={(c.used / c.limit) * 100} tone="good" /></div>
              <Badge tone={c.active ? 'pop' : 'neutral'}>{c.active ? 'Active' : 'Off'}</Badge>
              <Button size="sm" onClick={() => navigator.clipboard?.writeText(c.code).then(() => toast.success('Code copied'), () => toast(c.code))}><Copy /> Copy</Button>
              <Button size="sm" onClick={() => toggleJoinCode(c.id)}>{c.active ? 'Turn off' : 'Turn on'}</Button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">No codes for {batches.find((b) => b.id === batchId)?.name} yet.</p>}
    </div>
  );
}

function InviteDialog() {
  const d = useDialog('invite');
  return <FacultyDialog open={d.open} onClose={d.close} />;
}

