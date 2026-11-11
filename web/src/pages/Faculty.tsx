import { motion } from 'framer-motion';
import { ChevronRight, Layers, Mail, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react';
import { StudentTable } from './Students';
import { useState } from 'react';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, Dialog, EmptyState, Input, Select } from '../components/ui';
import { href } from '../lib/router';
import { SUBJECTS, useStore, type Member, type Role } from '../lib/store';
import { useUI } from '../lib/ui-state';

export function Faculty() {
  const { members, batches, students, updateMember, removeMember } = useStore();
  const open = useUI((u) => u.open);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Member | null>(null);
  const [list, setList] = useState<Member | null>(null);
  const shown = members.filter((m) => !q || `${m.name} ${(m.subjects || []).join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  const studentsOf = (m: Member) => students.filter((s) => m.batchIds.includes(s.batchId)).length;

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Faculty' }]} actions={<Button variant="primary" onClick={() => open('invite')}><Plus /> Add faculty</Button>}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-[28px] font-bold tracking-[-0.03em]">Faculty</h1><p className="text-sm text-muted">Assign faculty to batches and subjects, and choose what they can access.</p></div>
        <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or subject" className="pl-10" aria-label="Search faculty" /></div>
      </div>
      {shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.03 }}
              className="flex flex-col rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
              <div className="flex items-start gap-3">
                <Avatar name={m.name} size="lg" className="size-12 text-sm" />
                <div className="min-w-0 flex-1"><div className="truncate text-base font-bold">{m.name}</div><div className="flex items-center gap-1 truncate text-xs text-muted"><Mail className="size-3" />{m.email}</div></div>
                <Badge tone={m.role === 'Academy admin' ? 'ink' : m.role === 'Reviewer' ? 'pop' : 'neutral'}>{m.role}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">{(m.subjects || []).map((s) => <span key={s} className="rounded-full bg-subtle px-2.5 py-1 text-2xs font-medium">{s}</span>)}</div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-subtle p-3"><div className="flex items-center gap-1.5 text-2xs text-muted"><Layers className="size-3" />Batches</div><div className="tnum mt-0.5 text-lg font-bold">{m.batchIds.length}</div></div>
                <button onClick={() => setList(m)} className="rounded-xl bg-subtle p-3 text-left transition hover:bg-hover"><div className="flex items-center gap-1.5 text-2xs text-muted"><Users className="size-3" />Students<ChevronRight className="ml-auto size-3" /></div><div className="tnum mt-0.5 text-lg font-bold">{studentsOf(m)}</div></button>
              </div>
              <div className="mt-2 truncate text-2xs text-muted">{m.batchIds.map((id) => batches.find((b) => b.id === id)?.name).filter(Boolean).join(' · ') || 'No batches assigned'}</div>
              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <Button size="sm" className="flex-1" onClick={() => setEdit(m)}>Assign &amp; access</Button>
                <Button size="sm" variant="ghost" aria-label={`Remove ${m.name}`} onClick={() => { removeMember(m.id); toast('Faculty removed'); }}><Trash2 /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : <Card><EmptyState icon={UserCheck} title={members.length ? 'No faculty match' : 'No faculty yet'} action={<Button variant="primary" onClick={() => open('invite')}><Plus /> Add faculty</Button>} /></Card>}

      {list && (
        <Dialog wide open onOpenChange={(v) => !v && setList(null)} title={`${list.name}'s students`} desc={`${studentsOf(list)} students across ${list.batchIds.length} batches`}>
          <div className="-mx-5 pb-2"><StudentTable students={students.filter((s) => list.batchIds.includes(s.batchId))} /></div>
        </Dialog>
      )}
      <AssignDialog member={edit} onClose={() => setEdit(null)} onSave={(patch) => { if (edit) { updateMember(edit.id, patch); toast.success('Saved'); } setEdit(null); }} />
    </Page>
  );
}

function AssignDialog({ member, onClose, onSave }: { member: Member | null; onClose: () => void; onSave: (p: Partial<Member>) => void }) {
  const { batches } = useStore();
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [role, setRole] = useState<Role>('Faculty');
  const [lastId, setLastId] = useState('');
  if (member && member.id !== lastId) { setLastId(member.id); setBatchIds(member.batchIds); setSubjects(member.subjects || []); setRole(member.role); }
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <Dialog wide open={!!member} onOpenChange={(v) => !v && onClose()} title={member ? `${member.name}` : ''} desc="Batches they teach, their subjects, and what they can open in this portal."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onSave({ batchIds, subjects, role })}>Save</Button></>}>
      <div className="space-y-5">
        <div><div className="mb-2 text-xs font-semibold">Access</div>
          <Select aria-label="Access" value={role} onChange={(e) => setRole(e.target.value as Role)} className="sm:w-72"><option value="Faculty">Faculty · their batches and materials</option><option value="Reviewer">Reviewer · also evaluates scripts</option><option value="Exam manager">Exam manager · creates and publishes tests</option><option value="Academy admin">Academy admin · everything</option></Select></div>
        <div><div className="mb-2 text-xs font-semibold">Subjects</div>
          <div className="flex flex-wrap gap-2">{SUBJECTS.map((s) => <button key={s} type="button" onClick={() => setSubjects(toggle(subjects, s))} className={subjects.includes(s) ? 'rounded-full bg-fg px-3 py-1.5 text-xs font-semibold text-bg' : 'rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-muted hover:text-fg'}>{s}</button>)}</div></div>
        <div><div className="mb-2 text-xs font-semibold">Batches</div>
          <div className="flex flex-wrap gap-2">{batches.filter((b) => b.status === 'active').map((b) => <button key={b.id} type="button" onClick={() => setBatchIds(toggle(batchIds, b.id))} className={batchIds.includes(b.id) ? 'rounded-full bg-pop px-3 py-1.5 text-xs font-semibold text-pop-fg' : 'rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-muted hover:text-fg'}>{b.name}</button>)}</div></div>
      </div>
    </Dialog>
  );
}
