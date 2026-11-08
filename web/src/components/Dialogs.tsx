import { Copy, FileSpreadsheet, Upload } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { COURSES, useStore, type Course, type Role, type Student } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { Button, Dialog, Field, Input, Select } from './ui';

export function Dialogs() {
  return (<><BatchDialog /><StudentDialog /><InviteDialog /><ImportDialog /></>);
}

function useDialog(name: Parameters<ReturnType<typeof useUI.getState>['open']>[0]) {
  const { dialog, close, dialogArg } = useUI();
  return { open: dialog === name, onOpenChange: (v: boolean) => !v && close(), close, arg: dialogArg };
}

function BatchDialog() {
  const d = useDialog('batch');
  const { addBatch, members } = useStore();
  const [name, setName] = useState(''); const [course, setCourse] = useState<Course>('CA Inter'); const [facultyId, setFacultyId] = useState('');
  useEffect(() => { if (d.open) { setName(''); setFacultyId(''); } }, [d.open]);
  const submit = (e: FormEvent) => { e.preventDefault(); if (!name.trim()) return; addBatch({ name: name.trim(), course, facultyId }); toast.success('Batch created'); d.close(); };
  return (
    <Dialog open={d.open} onOpenChange={d.onOpenChange} title="New batch" desc="Students are added to a batch, and exams are given to batches."
      footer={<><Button onClick={d.close}>Cancel</Button><Button variant="primary" type="submit" form="batch-form" disabled={!name.trim()}>Create batch</Button></>}>
      <form id="batch-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="nb-name" className="sm:col-span-2"><Input id="nb-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="CA Inter · May 2027 · Batch A" /></Field>
        <Field label="Course" htmlFor="nb-course"><Select id="nb-course" value={course} onChange={(e) => setCourse(e.target.value as Course)}>{COURSES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Faculty" htmlFor="nb-fac" optional><Select id="nb-fac" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}><option value="">Not assigned</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
      </form>
    </Dialog>
  );
}

function StudentDialog() {
  const d = useDialog('student');
  const { addStudent, batches, academy } = useStore();
  const blank = { name: '', roll: '', batchId: '', phone: '', email: '' };
  const [f, setF] = useState(blank);
  const [done, setDone] = useState<{ student: Student; password: string } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { if (d.open) { setF({ ...blank, batchId: d.arg || batches[0]?.id || '' }); setDone(null); setError(''); } }, [d.open]); // eslint-disable-line
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = addStudent({ name: f.name.trim(), roll: f.roll.trim(), batchId: f.batchId, phone: f.phone.trim(), email: f.email.trim() });
    if ('error' in r) { setError(r.error); return; }
    setDone(r);
  };
  const credText = done ? `${academy.name || 'Parallax Flow'}\nLogin ID: ${done.student.loginId}\nTemporary password: ${done.password}` : '';
  const copy = () => navigator.clipboard?.writeText(credText).then(() => toast.success('Login details copied'), () => toast('Select the details and copy them'));

  if (!batches.length) {
    return (
      <Dialog open={d.open} onOpenChange={d.onOpenChange} title="Create a batch first" desc="Every student belongs to a batch."
        footer={<><Button onClick={d.close}>Cancel</Button><Button variant="primary" onClick={() => useUI.getState().open('batch')}>New batch</Button></>} />
    );
  }
  if (done) {
    return (
      <Dialog open={d.open} onOpenChange={d.onOpenChange} title="Login created" desc={`Share these with ${done.student.name}. They choose their own password on first sign-in.`}
        footer={<><Button onClick={() => { setF({ ...blank, batchId: f.batchId }); setDone(null); }}>Add another</Button><Button onClick={copy}><Copy /> Copy</Button><Button variant="primary" onClick={d.close}>Done</Button></>}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-md border border-border bg-subtle p-4 text-sm">
          <dt className="text-muted">Login ID</dt><dd className="font-mono">{done.student.loginId}</dd>
          <dt className="text-muted">Temporary password</dt><dd className="font-mono">{done.password}</dd>
          <dt className="text-muted">Batch</dt><dd>{batches.find((b) => b.id === done.student.batchId)?.name}</dd>
        </dl>
        <p className="mt-2 text-xs text-muted">The password is shown only once. You can reset it later from the student’s page.</p>
      </Dialog>
    );
  }
  return (
    <Dialog open={d.open} onOpenChange={d.onOpenChange} title="Add student" desc="Creates a login for the Parallax Flow app."
      footer={<><Button onClick={d.close}>Cancel</Button><Button variant="primary" type="submit" form="student-form" disabled={!f.name.trim() || !f.roll.trim()}>Create login</Button></>}>
      <form id="student-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="as-name" className="sm:col-span-2"><Input id="as-name" autoFocus value={f.name} onChange={set('name')} /></Field>
        <Field label="Batch" htmlFor="as-batch"><Select id="as-batch" value={f.batchId} onChange={set('batchId')}>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        <Field label="Roll number" htmlFor="as-roll" hint={error && <span className="text-bad">{error}</span>}><Input id="as-roll" value={f.roll} onChange={(e) => { set('roll')(e); setError(''); }} /></Field>
        <Field label="Mobile" htmlFor="as-ph" optional><Input id="as-ph" inputMode="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Email" htmlFor="as-em" optional><Input id="as-em" type="email" value={f.email} onChange={set('email')} /></Field>
      </form>
    </Dialog>
  );
}

function InviteDialog() {
  const d = useDialog('invite');
  const { invite, batches } = useStore();
  const [f, setF] = useState({ name: '', email: '', role: 'Reviewer' as Role, batch: 'all' });
  useEffect(() => { if (d.open) setF({ name: '', email: '', role: 'Reviewer', batch: 'all' }); }, [d.open]);
  const ok = f.name.trim() && /\S+@\S+\.\S+/.test(f.email);
  const submit = (e: FormEvent) => { e.preventDefault(); if (!ok) return; invite({ name: f.name.trim(), email: f.email.trim(), role: f.role, batchIds: f.batch === 'all' ? [] : [f.batch] }); toast.success(`Invitation ready for ${f.email.trim()}`); d.close(); };
  return (
    <Dialog open={d.open} onOpenChange={d.onOpenChange} title="Invite to team" desc="Faculty sign in to this console with their own email."
      footer={<><Button onClick={d.close}>Cancel</Button><Button variant="primary" type="submit" form="invite-form" disabled={!ok}>Send invite</Button></>}>
      <form id="invite-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="iv-name"><Input id="iv-name" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email" htmlFor="iv-mail"><Input id="iv-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Role" htmlFor="iv-role"><Select id="iv-role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}><option>Reviewer</option><option>Exam manager</option><option>Academy admin</option></Select></Field>
        <Field label="Batches" htmlFor="iv-b"><Select id="iv-b" value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })}><option value="all">All batches</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        <p className="text-xs text-muted sm:col-span-2"><b className="font-medium text-fg">Admins</b> manage everything. <b className="font-medium text-fg">Exam managers</b> create and publish exams. <b className="font-medium text-fg">Reviewers</b> see only their batches’ scripts.</p>
      </form>
    </Dialog>
  );
}

function ImportDialog() {
  const d = useDialog('import');
  const [file, setFile] = useState<File | null>(null);
  useEffect(() => { if (d.open) setFile(null); }, [d.open]);
  return (
    <Dialog open={d.open} onOpenChange={d.onOpenChange} title="Import students" desc="Each row becomes a student with a login ID and a temporary password."
      footer={<><Button onClick={d.close}>Cancel</Button><Button variant="primary" disabled={!file} onClick={() => { toast('Importing runs on the server, which isn’t connected yet'); d.close(); }}>Import</Button></>}>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border-strong bg-subtle px-4 py-8 text-center transition hover:border-accent/60">
        {file ? <FileSpreadsheet className="size-5 text-accent" /> : <Upload className="size-5 text-muted" />}
        <span className="text-sm font-medium">{file ? file.name : 'Choose an Excel or CSV file'}</span>
        <span className="text-xs text-muted">Columns: Name, Roll number, Batch, Mobile, Email</span>
        <input id="im-file" type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
    </Dialog>
  );
}
