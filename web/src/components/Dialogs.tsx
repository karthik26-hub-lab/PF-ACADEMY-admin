import { motion } from 'framer-motion';
import { Copy, FileSpreadsheet, KeyRound, PenLine, QrCode, RefreshCw, Upload } from 'lucide-react';
import QRCode from 'qrcode';
import readXlsxFile from 'read-excel-file';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { COURSES, SUBJECTS, useStore, type Course, type Role, type Student } from '../lib/store';
import { EventDialog, RecordedDialog } from './CalendarDialogs';
import { CalendarImportDialog } from './CalendarImport';
import { useUI } from '../lib/ui-state';
import { cn } from '../lib/utils';
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
  const [f, setF] = useState({ name: '', course: 'CA Inter' as Course, facultyId: '', startDate: '', schedule: '' });
  useEffect(() => {
    if (d.open) setF(editing ? { name: editing.name, course: editing.course, facultyId: editing.facultyId, startDate: editing.startDate, schedule: editing.schedule }
      : { name: '', course: 'CA Inter', facultyId: '', startDate: new Date().toISOString().slice(0, 10), schedule: '' });
  }, [d.open]); // eslint-disable-line
  const submit = (e: FormEvent) => {
    e.preventDefault(); if (!f.name.trim()) return;
    if (editing) updateBatch(editing.id, { ...f, name: f.name.trim(), facultyIds: f.facultyId && !editing.facultyIds.includes(f.facultyId) ? [f.facultyId, ...editing.facultyIds] : editing.facultyIds });
    else addBatch({ ...f, name: f.name.trim() });
    toast.success(editing ? 'Batch updated' : 'Batch created'); d.close();
  };
  return (
    <Dialog open={d.open} onOpenChange={d.onOpenChange} title={editing ? 'Edit batch' : 'New batch'} desc="Students belong to a batch. Courses, faculty and exams are given to batches."
      footer={<><Button onClick={d.close}>Cancel</Button><Button variant="primary" type="submit" form="batch-form" disabled={!f.name.trim()}>{editing ? 'Save' : 'Create batch'}</Button></>}>
      <form id="batch-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="nb-name" className="sm:col-span-2"><Input id="nb-name" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="CA Inter · May 2027 · Batch A" /></Field>
        <Field label="Course" htmlFor="nb-course"><Select id="nb-course" value={f.course} onChange={(e) => setF({ ...f, course: e.target.value as Course })}>{COURSES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Starts" htmlFor="nb-start"><Input id="nb-start" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
        <Field label="Class schedule" htmlFor="nb-sch" optional><Input id="nb-sch" value={f.schedule} onChange={(e) => setF({ ...f, schedule: e.target.value })} placeholder="Mon, Wed, Fri · 9:00–12:00" /></Field>
        <Field label="Lead faculty" htmlFor="nb-fac" optional><Select id="nb-fac" value={f.facultyId} onChange={(e) => setF({ ...f, facultyId: e.target.value })}><option value="">Not assigned</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
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
          <Select aria-label="Batch" value={batchId} onChange={(e) => setBatchId(e.target.value)} className="ml-auto w-full sm:w-64">{active.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
        </div>
        <motion.div key={method} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {method === 'manual' && <ManualForm batchId={batchId} onDone={d.close} />}
          {method === 'excel' && <ExcelImport batchId={batchId} onDone={d.close} />}
          {method === 'qr' && <QrJoin batchId={batchId} />}
          {method === 'code' && <CodeJoin batchId={batchId} />}
        </motion.div>
      </div>
    </Dialog>
  );
}

function ManualForm({ batchId, onDone }: { batchId: string; onDone: () => void }) {
  const { addStudent, academy, batches } = useStore();
  const blank = { name: '', roll: '', phone: '', email: '' };
  const [f, setF] = useState(blank);
  const [done, setDone] = useState<{ student: Student; password: string } | null>(null);
  const [error, setError] = useState('');
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => { setF({ ...f, [k]: e.target.value }); setError(''); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = addStudent({ name: f.name.trim(), roll: f.roll.trim(), batchId, phone: f.phone.trim(), email: f.email.trim(), joinedVia: 'manual' });
    if ('error' in r) { setError(r.error); return; }
    setDone(r);
  };
  if (done) {
    const text = `${academy.name || 'Parallax Flow'}\nLogin ID: ${done.student.loginId}\nTemporary password: ${done.password}`;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-subtle p-5">
          <div className="mb-3 flex items-center gap-2"><Badge tone="pop">Login created</Badge><span className="text-sm font-semibold">{done.student.name}</span></div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">Student ID</dt><dd className="font-mono">{done.student.studentId}</dd>
            <dt className="text-muted">Login ID</dt><dd className="font-mono">{done.student.loginId}</dd>
            <dt className="text-muted">Temporary password</dt><dd className="font-mono">{done.password}</dd>
            <dt className="text-muted">Batch</dt><dd>{batches.find((b) => b.id === done.student.batchId)?.name}</dd>
          </dl>
        </div>
        <p className="text-xs text-muted">The password is shown only once. The student picks their own on first sign-in.</p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => navigator.clipboard?.writeText(text).then(() => toast.success('Copied'), () => toast('Select the details and copy them'))}><Copy /> Copy</Button>
          <Button onClick={() => { setF(blank); setDone(null); }}>Add another</Button>
          <Button variant="primary" onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" htmlFor="as-name"><Input id="as-name" autoFocus value={f.name} onChange={set('name')} /></Field>
      <Field label="Roll number" htmlFor="as-roll" hint={error && <span className="text-bad">{error}</span>}><Input id="as-roll" value={f.roll} onChange={set('roll')} /></Field>
      <Field label="Mobile" htmlFor="as-ph" optional><Input id="as-ph" inputMode="tel" value={f.phone} onChange={set('phone')} /></Field>
      <Field label="Email" htmlFor="as-em" optional><Input id="as-em" type="email" value={f.email} onChange={set('email')} /></Field>
      <div className="flex justify-end sm:col-span-2"><Button type="submit" variant="primary" disabled={!f.name.trim() || !f.roll.trim() || !batchId}>Create login</Button></div>
    </form>
  );
}

type Row = { name: string; roll: string; phone: string; email: string; batch: string };
function parseCsv(text: string): string[][] {
  return text.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
}
function toRows(table: string[][]): Row[] {
  if (!table.length) return [];
  const head = table[0].map((h) => String(h).toLowerCase());
  const col = (...names: string[]) => head.findIndex((h) => names.some((n) => h.includes(n)));
  const ci = { name: col('name'), roll: col('roll', 'id'), phone: col('mobile', 'phone'), email: col('mail'), batch: col('batch') };
  const hasHeader = ci.name >= 0;
  const rows = hasHeader ? table.slice(1) : table;
  return rows.map((r) => ({
    name: String(r[hasHeader ? ci.name : 0] ?? '').trim(), roll: String(r[hasHeader ? ci.roll : 1] ?? '').trim(),
    phone: String(r[hasHeader ? ci.phone : 2] ?? '').trim(), email: String(r[hasHeader ? ci.email : 3] ?? '').trim(), batch: hasHeader && ci.batch >= 0 ? String(r[ci.batch] ?? '').trim() : '',
  })).filter((r) => r.name);
}

function ExcelImport({ batchId, onDone }: { batchId: string; onDone: () => void }) {
  const { addStudents, batches } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const load = async (f: File) => {
    setFile(f); setErr('');
    try {
      const table = f.name.toLowerCase().endsWith('.csv') ? parseCsv(await f.text()) : (await readXlsxFile(f)).map((r) => r.map((c) => (c == null ? '' : String(c))));
      const parsed = toRows(table);
      if (!parsed.length) setErr('No students found. The first row should be headings: Name, Roll number, Mobile, Email, Batch.');
      setRows(parsed);
    } catch { setErr('This file couldn’t be read. Save it as .xlsx or .csv and try again.'); setRows([]); }
  };
  const missingRoll = rows.filter((r) => !r.roll).length;
  const doImport = () => {
    const byName = new Map(batches.map((b) => [b.name.toLowerCase(), b.id]));
    const res = addStudents(rows.filter((r) => r.roll).map((r) => ({ name: r.name, roll: r.roll, phone: r.phone, email: r.email, batchId: byName.get(r.batch.toLowerCase()) || batchId, joinedVia: 'excel' as const })));
    toast.success(`${res.added} students added`, { description: res.skipped ? `${res.skipped} skipped: roll number already used` : undefined });
    onDone();
  };
  const template = () => {
    const csv = 'Name,Roll number,Mobile,Email,Batch\nAarav Kulkarni,INT-0101,+91 98xxxxxx01,aarav@example.com,\n';
    navigator.clipboard?.writeText(csv).then(() => toast.success('Template copied', { description: 'Paste it into Excel and save as .xlsx or .csv' }), () => toast(csv));
  };
  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border-strong bg-subtle px-4 py-8 text-center transition hover:border-fg/40">
        {file ? <FileSpreadsheet className="size-6" /> : <Upload className="size-6 text-muted" />}
        <span className="text-sm font-semibold">{file ? file.name : 'Choose an Excel or CSV file'}</span>
        <span className="text-xs text-muted">Columns: Name, Roll number, Mobile, Email, Batch (optional; otherwise the batch above)</span>
        <input id="im-file" type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
      </label>
      {err && <p className="text-xs text-bad">{err}</p>}
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-border">
          <div className="flex items-center justify-between bg-subtle px-4 py-2 text-xs"><span className="font-semibold">{rows.length} rows found</span>{missingRoll > 0 && <span className="text-warn">{missingRoll} without a roll number will be skipped</span>}</div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs"><tbody>{rows.slice(0, 50).map((r, i) => (
              <tr key={i} className="border-t border-border"><td className="px-4 py-2 font-medium">{r.name}</td><td className="px-4 py-2 font-mono">{r.roll || '—'}</td><td className="px-4 py-2 text-muted">{r.batch || batches.find((b) => b.id === batchId)?.name}</td></tr>
            ))}</tbody></table>
          </div>
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <Button onClick={template}><Copy /> Copy template</Button>
        <Button variant="primary" disabled={!rows.some((r) => r.roll)} onClick={doImport}>Import {rows.filter((r) => r.roll).length || ''} students</Button>
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
  const { invite, batches } = useStore();
  const [f, setF] = useState({ name: '', email: '', phone: '', role: 'Faculty' as Role, batch: 'all', subject: SUBJECTS[0] });
  useEffect(() => { if (d.open) setF({ name: '', email: '', phone: '', role: 'Faculty', batch: 'all', subject: SUBJECTS[0] }); }, [d.open]);
  const ok = f.name.trim() && /\S+@\S+\.\S+/.test(f.email);
  const submit = (e: FormEvent) => { e.preventDefault(); if (!ok) return; invite({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), role: f.role, subjects: [f.subject], batchIds: f.batch === 'all' ? [] : [f.batch] }); toast.success(`${f.name.trim()} added`, { description: `Invitation will go to ${f.email.trim()}` }); d.close(); };
  return (
    <Dialog open={d.open} onOpenChange={d.onOpenChange} title="Add faculty" desc="Faculty sign in to this portal with their own email."
      footer={<><Button onClick={d.close}>Cancel</Button><Button variant="primary" type="submit" form="invite-form" disabled={!ok}>Add faculty</Button></>}>
      <form id="invite-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="iv-name"><Input id="iv-name" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email" htmlFor="iv-mail"><Input id="iv-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Subject" htmlFor="iv-sub"><Select id="iv-sub" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Access" htmlFor="iv-role"><Select id="iv-role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}><option>Faculty</option><option>Reviewer</option><option>Exam manager</option><option>Academy admin</option></Select></Field>
        <Field label="Batch" htmlFor="iv-b" className="sm:col-span-2"><Select id="iv-b" value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })}><option value="all">All batches</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
      </form>
    </Dialog>
  );
}

