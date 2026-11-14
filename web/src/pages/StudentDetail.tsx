import { motion } from 'framer-motion';
import { ArrowLeftRight, Cake, ClipboardCheck, GraduationCap, KeyRound, ListChecks, LogIn, Mail, MoreHorizontal, Pencil, Phone, Smartphone, Trash2, User } from 'lucide-react';
import { useState, type ElementType } from 'react';
import { toast } from 'sonner';
import { Ring } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, CardHeader, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger, EmptyState, Field, Input, Segmented, Select, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { defaultPassword, useStore, validEmail, type Gender, type StudentActivity, type StudentDetails, type StudentStatus } from '../lib/store';
import { fmtDate, fmtDateTime } from '../lib/utils';
import { MODE, modeOf, type ClassMode } from '../lib/insights';
import { STATUS, joinDate } from './Students';

const ACT_ICON: Record<StudentActivity['kind'], ElementType> = { mcq: ListChecks, test: ClipboardCheck, batch: ArrowLeftRight, device: Smartphone, login: LogIn };

export function StudentDetail({ id }: { id: string }) {
  const { students, batches, deleteStudent, updateStudent, decideDevice } = useStore();
  const [pw, setPw] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [edit, setEdit] = useState<StudentDetails | null>(null);
  const s = students.find((x) => x.id === id);
  if (!s) {
    return <Page crumbs={[{ label: 'Students', href: href({ page: 'students' }) }, { label: 'Not found' }]}>
      <Card><EmptyState icon={User} title="Student not found" action={<a className={btn()} href={href({ page: 'students' })}>All students</a>}>They may have been removed.</EmptyState></Card>
    </Page>;
  }
  const b = batches.find((x) => x.id === s.batchId);
  const emailTaken = edit && students.some((x) => x.id !== s.id && x.loginId === edit.email.trim().toLowerCase());
  const editOk = edit && edit.name.trim() && edit.dob && validEmail(edit.email) && !emailTaken;
  const row = 'grid grid-cols-[120px_minmax(0,1fr)] items-center gap-2';
  // The two rings open this student's report in the Reports tab.
  const ring = (section: 'learning' | 'scores', value: number, label: string, tone?: 'pop') => (
    <button type="button" onClick={() => navigate({ page: 'student-report', id: s.id, section })} title={`Open ${label.toLowerCase()} in Reports`}
      className="group flex flex-col items-center gap-1 rounded-2xl p-2 transition hover:bg-subtle">
      <Ring value={value} size={68} stroke={7} tone={tone} label={label} /><span className="text-2xs text-muted group-hover:text-fg">{label} ›</span>
    </button>
  );

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Students', href: href({ page: 'students' }) }, { label: s.name }]}
      actions={<>
        <Button onClick={() => setEdit({ name: s.name, dob: s.dob, gender: s.gender, phone: s.phone, email: s.email, parentName: s.parentName, parentPhone: s.parentPhone })}><Pencil /> Edit details</Button>
        <DropdownMenu>
          <DropdownTrigger className={btn('secondary', 'icon')} aria-label="More actions"><MoreHorizontal /></DropdownTrigger>
          <DropdownContent><DropdownItem onSelect={() => setPw(defaultPassword(s.name, s.dob))}><KeyRound /> Reset to default password</DropdownItem></DropdownContent>
        </DropdownMenu>
      </>}>
      {/* Header: name, then course, mobile, email and date of birth; the rings open Reports */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex flex-wrap items-center gap-5 rounded-2xl bg-panel p-6 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        <Avatar name={s.name} size="lg" className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <div className="mb-1"><Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge></div>
          <h1 className="text-[26px] font-bold tracking-[-0.03em]">{s.name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><GraduationCap className="size-3" />{b?.course ?? '—'}</span>
            {s.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{s.phone}</span>}
            {s.email && <span className="flex items-center gap-1"><Mail className="size-3" />{s.email}</span>}
            {s.dob && <span className="flex items-center gap-1"><Cake className="size-3" />{fmtDate(s.dob)}</span>}
          </div>
        </div>
        <div className="flex gap-2">{ring('learning', s.progress, 'Learning')}{ring('scores', s.avgScore ?? 0, 'Avg score', 'pop')}</div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Enrolment" desc="Changes here apply everywhere this student appears" />
          <dl className="space-y-3 p-5 pt-2 text-sm">
            <div className={row}><dt className="text-muted">Student ID</dt><dd className="font-mono">{s.studentId}</dd></div>
            <div className={row}><dt className="text-muted">Batch</dt><dd><Select aria-label="Batch" value={s.batchId} onChange={(e) => { updateStudent(s.id, { batchId: e.target.value }); toast.success('Moved to the new batch'); }}>{batches.filter((x) => x.status === 'active' || x.id === s.batchId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></dd></div>
            <div className={row}><dt className="text-muted">Classes</dt><dd><Segmented value={modeOf(s)} onChange={(m) => { updateStudent(s.id, { mode: m }); toast.success(`Now ${MODE[m].toLowerCase()}`, { description: 'Fees and attendance follow the new mode.' }); }} options={(Object.keys(MODE) as ClassMode[]).map((m) => ({ value: m, label: MODE[m] }))} /></dd></div>
            <div className={row}><dt className="text-muted">Status</dt><dd><Select aria-label="Status" value={s.status} onChange={(e) => updateStudent(s.id, { status: e.target.value as StudentStatus })}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></Select></dd></div>
            <div className={row}><dt className="text-muted">Login ID</dt><dd className="break-all font-mono text-xs">{s.loginId}</dd></div>
            <div className={row}><dt className="text-muted">Date of joining</dt><dd>{joinDate(s.admissionDate)}</dd></div>
            <div className={row}><dt className="text-muted">Parent</dt><dd>{s.parentName || '—'}{s.parentPhone && <span className="block text-xs text-muted">{s.parentPhone}</span>}</dd></div>
            <div className={row}><dt className="text-muted">Phone in use</dt><dd className="flex items-center gap-1.5"><Smartphone className="size-3.5 text-muted" />{s.device || 'Not signed in yet'}</dd></div>
          </dl>
          {s.deviceRequest && (
            <div className="mx-5 mb-4 rounded-xl bg-subtle p-3 ring-1 ring-inset ring-border">
              <div className="text-xs font-semibold">Device change request</div>
              <p className="mt-0.5 text-xs text-muted">Wants to sign in on <b className="text-fg">{s.deviceRequest.name}</b> · {fmtDateTime(s.deviceRequest.at)}. Approving signs out {s.device || 'the old phone'}.</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => { decideDevice(s.id, false); toast('Request rejected'); }}>Reject</Button>
                <Button size="sm" variant="primary" onClick={() => { decideDevice(s.id, true); toast.success('New phone approved'); }}>Approve</Button>
              </div>
            </div>
          )}
          <div className="border-t border-border p-5 pt-4">
            <Button variant="danger" size="sm" onClick={() => setDel('')}><Trash2 /> Delete permanently</Button>
            <p className="mt-1.5 text-2xs text-muted">Removes the student, their login and their results. This can’t be undone.</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" desc="MCQs, tests, batch changes and sign-ins" />
          {s.activity.length ? (
            <ol className="relative mx-5 mb-5 space-y-4 border-l border-border pl-5 pt-1">{s.activity.slice(0, 12).map((a, i) => {
              const Icon = ACT_ICON[a.kind];
              return (
                <li key={i} className="relative">
                  <span className="absolute -left-[31px] grid size-5 place-items-center rounded-full bg-panel ring-1 ring-border"><Icon className="size-3 text-muted" /></span>
                  <div className="text-sm">{a.text}</div><div className="text-2xs text-muted">{fmtDateTime(a.at)}</div>
                </li>
              );
            })}</ol>
          ) : <EmptyState compact icon={User} title="Nothing yet">Activity appears once the student uses the app.</EmptyState>}
        </Card>
      </div>

      {edit && (
        <Dialog wide open onOpenChange={(v) => !v && setEdit(null)} title="Edit details" desc="Changes apply everywhere this student appears. The email is also the login ID."
          footer={<><Button onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" disabled={!editOk} onClick={() => { updateStudent(s.id, { ...edit, name: edit.name.trim(), email: edit.email.trim(), loginId: edit.email.trim().toLowerCase() }); toast.success('Details saved'); setEdit(null); }}>Save</Button></>}>
          <div className="grid gap-4 pb-2 sm:grid-cols-2">
            <Field label="Student name"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Date of birth"><Input type="date" value={edit.dob} onChange={(e) => setEdit({ ...edit, dob: e.target.value })} /></Field>
            <Field label="Gender"><Segmented value={edit.gender} onChange={(g: Gender) => setEdit({ ...edit, gender: g })} options={(['Male', 'Female', 'Other'] as const).map((g) => ({ value: g, label: g }))} /></Field>
            <Field label="Mobile number"><Input inputMode="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Email ID" className="sm:col-span-2" hint={emailTaken ? <span className="text-bad">Another student already uses this email.</span> : 'Also the login ID for the app.'}><Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Parent’s name"><Input value={edit.parentName} onChange={(e) => setEdit({ ...edit, parentName: e.target.value })} /></Field>
            <Field label="Parent’s mobile number"><Input inputMode="tel" value={edit.parentPhone} onChange={(e) => setEdit({ ...edit, parentPhone: e.target.value })} /></Field>
          </div>
        </Dialog>
      )}
      <Dialog open={!!pw} onOpenChange={(v) => !v && setPw(null)} title="Password reset to default" desc={`Share it with ${s.name}. They can change it in the app.`}
        footer={<Button variant="primary" onClick={() => setPw(null)}>Done</Button>}>
        <div className="rounded-2xl bg-subtle p-5 text-center font-mono text-xl tracking-wider">{pw}</div>
        <p className="mt-2 pb-2 text-center text-2xs text-muted">First 4 letters of the name @ year of birth</p>
      </Dialog>
      <Dialog open={del !== null} onOpenChange={(v) => !v && setDel(null)} title="Delete this student permanently?" desc={`${s.name}, their login, results and activity are removed for good. This can’t be undone.`}
        footer={<><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" disabled={del !== s.studentId} onClick={() => { deleteStudent(s.id); toast(`${s.name} deleted permanently`); navigate({ page: 'students' }); }}>Delete permanently</Button></>}>
        <Field label={`Type ${s.studentId} to confirm`} className="pb-2"><Input autoFocus value={del ?? ''} onChange={(e) => setDel(e.target.value.toUpperCase())} className="font-mono" /></Field>
      </Dialog>
    </Page>
  );
}
