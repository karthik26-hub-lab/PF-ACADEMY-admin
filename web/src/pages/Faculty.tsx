// Faculty: cards with status and infographics, filters, and a 3-dot menu
// (View profile · Edit details · Manage assignments · Suspend · Remove). Subjects and batches are given from Assign.
import { motion } from 'framer-motion';
import { Ban, CalendarClock, ChevronRight, ClipboardList, Eye, Layers, Mail, MoreHorizontal, Pencil, Phone, Plus, Search, Send, Trash2, UserCheck, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BatchSubjectPicker, CourseLegend, subjectsDone, type BatchSubjects } from '../components/BatchSubjectPicker';
import { FacultyDialog } from '../components/FacultyDialog';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger, EmptyState, Field, Input, Segmented, Select, Textarea, btn } from '../components/ui';
import { BUILT_IN } from '../lib/permissions';
import { href } from '../lib/router';
import { COURSES, COURSE_TONE, SUBJECTS, useStore, type Member, type MemberStatus } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn, fmtDate, fmtDateTime } from '../lib/utils';
import { StudentTable } from './Students';

const STATUS: Record<MemberStatus, { label: string; tone: 'warn' | 'ink' | 'bad' }> = { pending: { label: 'Invitation pending', tone: 'warn' }, active: { label: 'Active', tone: 'ink' }, suspended: { label: 'Suspended', tone: 'bad' } };
type Popup = { kind: 'profile' | 'edit' | 'assign' | 'tasks' | 'remove' | 'students'; m: Member } | null;

export function Faculty() {
  const { members, batches, students, roles, updateMember, removeMember } = useStore();
  const open = useUI((u) => u.open);
  const [q, setQ] = useState(''), [role, setRole] = useState('all'), [subject, setSubject] = useState('all'), [batch, setBatch] = useState('all'), [status, setStatus] = useState<'all' | MemberStatus>('all');
  const [pop, setPop] = useState<Popup>(null);
  const bmap = useMemo(() => new Map(batches.map((b) => [b.id, b])), [batches]);
  const perBatch = useMemo(() => students.reduce<Record<string, number>>((a, s) => ({ ...a, [s.batchId]: (a[s.batchId] ?? 0) + 1 }), {}), [students]);
  const studentsOf = (m: Member) => m.batchIds.reduce((a, id) => a + (perBatch[id] ?? 0), 0);
  const shown = members.filter((m) => (!q || `${m.name} ${m.email} ${(m.subjects || []).join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    && (role === 'all' || m.role === role) && (subject === 'all' || m.subjects?.includes(subject)) && (batch === 'all' || m.batchIds.includes(batch)) && (status === 'all' || m.status === status));
  const filtered = role !== 'all' || subject !== 'all' || batch !== 'all' || status !== 'all';
  const suspend = (m: Member) => { const back = m.status === 'suspended'; updateMember(m.id, { status: back ? (m.lastLogin ? 'active' : 'pending') : 'suspended' }); toast(back ? `${m.name} can sign in again` : `${m.name} suspended`); };
  const close = () => setPop(null);

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Faculty' }]} actions={<Button variant="primary" onClick={() => open('invite')}><Plus /> Add faculty</Button>}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-[28px] font-bold tracking-[-0.03em]">Faculty</h1><p className="text-sm text-muted">Create faculty accounts, assign batches and subjects, and send them work.</p></div><div className="flex items-center gap-2 rounded-full bg-panel px-3 py-1.5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]"><span className="text-2xs font-semibold">Batch colours</span><CourseLegend /></div></div>

      {/* Search and filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or subject" className="pl-10" aria-label="Search faculty" /></div>
        <Select aria-label="Access role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full sm:w-44"><option value="all">All access roles</option>{[...BUILT_IN.map((r) => r.name), ...roles.map((r) => r.name)].map((r) => <option key={r}>{r}</option>)}</Select>
        <Select aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full sm:w-48"><option value="all">All subjects</option>{[...new Set([...members.flatMap((m) => m.subjects ?? []), ...SUBJECTS])].sort().map((s) => <option key={s}>{s}</option>)}</Select>
        <Select aria-label="Assigned batch" value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full sm:w-52"><option value="all">All batches</option>{batches.filter((b) => b.status === 'active').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
        <Segmented value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending', count: members.filter((m) => m.status === 'pending').length }, { value: 'suspended', label: 'Suspended' }]} />
        {filtered && <Button variant="ghost" size="sm" onClick={() => { setRole('all'); setSubject('all'); setBatch('all'); setStatus('all'); }}><X /> Clear</Button>}
        <span className="tnum ml-auto text-xs text-muted">{shown.length} of {members.length}</span>
      </div>

      {shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((m, i) => {
            const mine = m.batchIds.map((id) => bmap.get(id)).filter(Boolean);
            const byCourse = COURSES.map((c) => mine.filter((b) => b!.course === c).length);
            const n = studentsOf(m);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.03 }}
                className={cn('flex flex-col rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]', m.status === 'suspended' && 'opacity-70')}>
                <div className="flex items-start gap-3">
                  <Avatar name={m.name} src={m.photo} size="lg" className="size-12 text-sm" />
                  <div className="min-w-0 flex-1"><div className="truncate text-base font-bold">{m.name}</div><div className="flex items-center gap-1 truncate text-xs text-muted"><Mail className="size-3 shrink-0" />{m.email}</div></div>
                  <div className="flex flex-col items-end gap-1"><Badge tone={m.role === 'Academy admin' ? 'ink' : m.role === 'Reviewer' ? 'pop' : 'neutral'}>{m.role}</Badge><Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge></div>
                </div>
                <div className="mt-4 flex min-h-6 flex-wrap gap-1.5">{(m.subjects || []).map((s) => <span key={s} className="rounded-full bg-subtle px-2.5 py-1 text-2xs font-medium">{s}</span>)}{!m.subjects?.length && <span className="text-2xs text-faint">No subjects yet</span>}</div>

                {/* Infographics: batches split by course, students per batch */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-subtle p-3">
                    <div className="flex items-center gap-1.5 text-2xs text-muted"><Layers className="size-3" />Batches</div>
                    <div className="tnum mt-0.5 text-lg font-bold leading-tight">{mine.length}</div>
                    <div className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-border" title={COURSES.map((c, k) => `${c}: ${byCourse[k]}`).join(' · ')}>{byCourse.map((v, k) => v ? <span key={k} className={cn('tone-bar', COURSE_TONE[COURSES[k]])} style={{ flex: v }} /> : null)}</div>
                  </div>
                  <button onClick={() => setPop({ kind: 'students', m })} className="rounded-xl bg-subtle p-3 text-left transition hover:bg-hover">
                    <div className="flex items-center gap-1.5 text-2xs text-muted"><Users className="size-3" />Students<ChevronRight className="ml-auto size-3" /></div>
                    <div className="tnum mt-0.5 text-lg font-bold leading-tight">{n}</div>
                    <div className="mt-2 text-[10px] text-muted">Across {mine.length} {mine.length === 1 ? 'batch' : 'batches'}</div>
                  </button>
                </div>
                <div className="mt-2 truncate text-2xs text-muted">{mine.map((b) => b!.name).join(' · ') || 'No batches assigned'}</div>

                <div className="mt-4 flex gap-2 border-t border-border pt-4">
                  <Button size="sm" className="flex-1" onClick={() => setPop({ kind: 'assign', m })}>Assign subjects &amp; batches</Button>
                  <DropdownMenu>
                    <DropdownTrigger className={btn('ghost', 'icon', 'size-8')} aria-label={`More for ${m.name}`}><MoreHorizontal /></DropdownTrigger>
                    <DropdownContent align="end">
                      <DropdownItem onSelect={() => setPop({ kind: 'profile', m })}><Eye /> View profile</DropdownItem>
                      <DropdownItem onSelect={() => setPop({ kind: 'edit', m })}><Pencil /> Edit details</DropdownItem>
                      <DropdownItem onSelect={() => setPop({ kind: 'tasks', m })}><ClipboardList /> Manage assignments{m.tasks.some((t) => !t.done) && <span className="tnum ml-auto text-2xs text-faint">{m.tasks.filter((t) => !t.done).length}</span>}</DropdownItem>
                      <DropdownItem onSelect={() => suspend(m)}>{m.status === 'suspended' ? <><UserCheck /> Reactivate account</> : <><Ban /> Suspend account</>}</DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem danger onSelect={() => setPop({ kind: 'remove', m })}><Trash2 /> Remove faculty</DropdownItem>
                    </DropdownContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : <Card><EmptyState icon={UserCheck} title={members.length ? 'No faculty match' : 'No faculty yet'} action={<Button variant="primary" onClick={() => open('invite')}><Plus /> Add faculty</Button>} /></Card>}

      {pop?.kind === 'students' && (
        <Dialog wide open onOpenChange={(v) => !v && close()} title={`${pop.m.name}'s students`} desc={`${studentsOf(pop.m)} students across ${pop.m.batchIds.length} batches`}>
          <div className="-mx-5 pb-2"><StudentTable students={students.filter((s) => pop.m.batchIds.includes(s.batchId))} /></div>
        </Dialog>
      )}
      {pop?.kind === 'profile' && <ProfileDialog m={members.find((x) => x.id === pop.m.id) ?? pop.m} students={studentsOf(pop.m)} onClose={close} onEdit={() => setPop({ kind: 'edit', m: pop.m })} />}
      <FacultyDialog open={pop?.kind === 'edit'} member={pop?.kind === 'edit' ? pop.m : null} onClose={close} />
      {pop?.kind === 'assign' && <AssignDialog m={pop.m} onClose={close} />}
      {pop?.kind === 'tasks' && <TasksDialog m={members.find((x) => x.id === pop.m.id) ?? pop.m} onClose={close} />}
      {pop?.kind === 'remove' && (
        <Dialog open onOpenChange={(v) => !v && close()} title={`Remove ${pop.m.name}?`} desc="Their portal account is deleted and they are taken off their batches. Their past evaluations stay in the records."
          footer={<><Button onClick={close}>Cancel</Button><Button variant="danger" onClick={() => { removeMember(pop.m.id); toast(`${pop.m.name} removed`); close(); }}>Remove faculty</Button></>} />
      )}
    </Page>
  );
}

/** Everything collected about them, plus batches, students and subjects handled. */
function ProfileDialog({ m, students, onClose, onEdit }: { m: Member; students: number; onClose: () => void; onEdit: () => void }) {
  const batches = useStore((s) => s.batches).filter((b) => m.batchIds.includes(b.id));
  const facts: [string, string][] = [['Login ID', m.email], ['Phone', m.phone || '—'], ['Date of birth', m.dob ? fmtDate(m.dob) : '—'], ['Access', m.role], ['Account created', fmtDate(m.invitedAt)], ['Last sign-in', m.lastLogin ? fmtDateTime(m.lastLogin) : 'Not signed in yet']];
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title="Faculty profile" footer={<><Button onClick={onClose}>Close</Button><Button variant="primary" onClick={onEdit}><Pencil /> Edit details</Button></>}>
      <div className="space-y-5 pb-2">
        <div className="flex items-center gap-4">
          <Avatar name={m.name} src={m.photo} size="lg" className="size-16 text-lg" />
          <div className="min-w-0 flex-1"><div className="text-xl font-bold tracking-tight">{m.name}</div>
            <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-muted"><span className="flex items-center gap-1"><Mail className="size-3" />{m.email}</span>{m.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{m.phone}</span>}</div></div>
          <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">{[['Batches handled', batches.length], ['Students handled', students], ['Subjects handled', m.subjects?.length ?? 0]].map(([k, v]) => (
          <div key={k as string} className="rounded-xl bg-subtle p-3"><div className="text-2xs text-muted">{k}</div><div className="tnum text-2xl font-bold leading-tight">{v}</div></div>
        ))}</div>
        <dl className="grid gap-x-6 gap-y-2.5 rounded-xl p-1 text-sm sm:grid-cols-2">{facts.map(([k, v]) => <div key={k}><dt className="text-2xs text-muted">{k}</dt><dd className="break-all font-medium">{v}</dd></div>)}</dl>
        <section><h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">Subjects</h4><div className="flex flex-wrap gap-1.5">{m.subjects?.length ? m.subjects.map((s) => <span key={s} className="rounded-full bg-subtle px-2.5 py-1 text-xs">{s}</span>) : <span className="text-xs text-muted">None assigned</span>}</div></section>
        <section><h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">Batches and subjects</h4>{batches.length ? <ul className="space-y-1.5">{batches.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-subtle px-3 py-2 text-xs"><i className={cn('tone-bar size-2.5 rounded-full', COURSE_TONE[b.course])} /><span className="font-semibold">{b.name}</span><span className="text-muted">{m.batchSubjects?.[b.id]?.join(', ') || 'No subject set'}</span></li>
        ))}</ul> : <span className="text-xs text-muted">None assigned</span>}</section>
      </div>
    </Dialog>
  );
}

/** Two steps: the batches they handle, then their subjects in each batch. Access is changed from Edit details. */
function AssignDialog({ m, onClose }: { m: Member; onClose: () => void }) {
  const assignFaculty = useStore((s) => s.assignFaculty);
  const [step, setStep] = useState<'batches' | 'subjects'>('batches');
  const [bs, setBs] = useState<BatchSubjects>(() => Object.fromEntries(m.batchIds.map((id) => [id, m.batchSubjects?.[id] ?? []])));
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={`Assign · ${m.name}`} desc={step === 'batches' ? 'Step 1 of 2 · Pick the batches they handle.' : 'Step 2 of 2 · Pick what they teach in each batch.'}
      footer={step === 'batches' ? <><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => setStep('subjects')} disabled={!Object.keys(bs).length}>Next: subjects</Button></>
        : <><Button onClick={() => setStep('batches')}>Back</Button><Button variant="primary" disabled={!subjectsDone(bs)} onClick={() => { assignFaculty(m.id, bs); toast.success('Assignments saved'); onClose(); }}>Save</Button></>}>
      <div className="pb-2"><BatchSubjectPicker step={step} value={bs} onChange={setBs} /></div>
    </Dialog>
  );
}

/** Send work to a faculty member with an optional deadline; it appears in their tasks when they sign in. */
function TasksDialog({ m, onClose }: { m: Member; onClose: () => void }) {
  const { addTask, removeTask } = useStore();
  const [text, setText] = useState(''), [due, setDue] = useState('');
  const send = () => { addTask(m.id, text.trim(), due || undefined); toast.success('Assignment sent', { description: `${m.name} sees it in their tasks.` }); setText(''); setDue(''); };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={`Manage assignments · ${m.name}`} desc="Send them work, for example making a question bank. It shows in their tasks when they sign in.">
      <div className="space-y-5 pb-2">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <Field label="Assignment"><Textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Make a 40-question bank on Capital Gains with answers" className="min-h-24" /></Field>
          <div className="flex flex-col gap-3">
            <Field label="Deadline" optional><Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
            <Button variant="primary" disabled={!text.trim()} onClick={send} className="mt-auto"><Send /> Send assignment</Button>
          </div>
        </div>
        <section>
          <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-faint">Sent · {m.tasks.length}</h4>
          {m.tasks.length ? <ul className="divide-y divide-border rounded-xl ring-1 ring-inset ring-border">{m.tasks.map((t) => (
            <li key={t.id} className="flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1"><div className="text-sm">{t.text}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-2xs text-muted"><span>Sent {fmtDate(t.at)}</span>{t.due && <span className="flex items-center gap-1"><CalendarClock className="size-3" />Due {fmtDateTime(+new Date(t.due))}</span>}</div></div>
              <Badge tone={t.done ? 'pop' : 'neutral'}>{t.done ? 'Done' : 'Open'}</Badge>
              <button type="button" onClick={() => removeTask(m.id, t.id)} aria-label="Withdraw assignment" className="text-faint hover:text-fg"><X className="size-4" /></button>
            </li>
          ))}</ul> : <p className="rounded-xl bg-subtle p-4 text-center text-xs text-muted">Nothing sent yet.</p>}
        </section>
      </div>
    </Dialog>
  );
}
