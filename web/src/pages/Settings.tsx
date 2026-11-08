import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, CardHeader, Dialog, Field, Input, PageHeader, RadioCard, Select, Switch, Table, Td, Th } from '../components/ui';
import { href } from '../lib/router';
import { LATE, POLICY, useStore, type Access, type Late, type Policy, type Role } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn } from '../lib/utils';

const TABS = [
  ['general', 'General'], ['team', 'Team & roles'], ['access', 'Student access'], ['exams', 'Exam defaults'],
  ['marking', 'Marking rules'], ['usage', 'Plan & usage'], ['data', 'Data'],
] as const;

const Row = ({ title, desc, children }: { title: string; desc: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-6 px-4 py-3.5"><div className="min-w-0"><div className="text-sm font-medium">{title}</div><div className="text-xs text-muted">{desc}</div></div>{children}</div>
);

export function Settings({ tab }: { tab: string }) {
  const current = TABS.some(([k]) => k === tab) ? tab : 'general';
  return (
    <Page crumbs={[{ label: 'Settings' }, { label: TABS.find(([k]) => k === current)![1] }]}>
      <PageHeader title="Settings" />
      <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col [scrollbar-width:none]" aria-label="Settings sections">
          {TABS.map(([k, l]) => (
            <a key={k} href={href({ page: 'settings', tab: k })} aria-current={current === k ? 'page' : undefined}
              className={cn('relative whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors duration-150', current === k ? 'text-fg' : 'text-muted hover:text-fg')}>
              {current === k && <motion.span layoutId="settings-nav" transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-md bg-hover" />}
              <span className="relative">{l}</span></a>
          ))}
        </nav>
        <motion.div key={current} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="min-w-0 space-y-5">
          {current === 'general' && <General />}
          {current === 'team' && <Team />}
          {current === 'access' && <AccessTab />}
          {current === 'exams' && <ExamDefaults />}
          {current === 'marking' && <Marking />}
          {current === 'usage' && <Usage />}
          {current === 'data' && <DataTab />}
        </motion.div>
      </div>
    </Page>
  );
}

function General() {
  const { academy, me, saveAcademy } = useStore();
  const [f, setF] = useState({ ...academy, myName: me.name });
  useEffect(() => setF({ ...academy, myName: me.name }), [academy, me.name]);
  const dirty = f.name !== academy.name || f.city !== academy.city || f.email !== academy.email || f.phone !== academy.phone || f.myName !== me.name;
  const submit = (e: FormEvent) => { e.preventDefault(); saveAcademy({ name: f.name.trim(), city: f.city.trim(), email: f.email.trim(), phone: f.phone.trim() }, { name: f.myName.trim() }); toast.success('Settings saved'); };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader title="Academy" desc="Shown to students in the app and to your team." />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Academy name" htmlFor="g-name"><Input id="g-name" value={f.name} onChange={set('name')} placeholder="Your academy’s name" /></Field>
          <Field label="City" htmlFor="g-city"><Input id="g-city" value={f.city} onChange={set('city')} /></Field>
          <Field label="Contact email" htmlFor="g-mail"><Input id="g-mail" type="email" value={f.email} onChange={set('email')} /></Field>
          <Field label="Phone" htmlFor="g-ph"><Input id="g-ph" value={f.phone} onChange={set('phone')} /></Field>
        </div>
        <CardHeader title="Your profile" className="border-t" />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="g-me"><Input id="g-me" value={f.myName} onChange={set('myName')} /></Field>
          <Field label="Email" htmlFor="g-myemail" hint="Used to sign in"><Input id="g-myemail" value={me.email} disabled /></Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button disabled={!dirty} onClick={() => setF({ ...academy, myName: me.name })}>Discard</Button>
          <Button type="submit" variant="primary" disabled={!dirty}>Save changes</Button>
        </div>
      </Card>
    </form>
  );
}

function Team() {
  const { members, me, updateMember, removeMember, batches } = useStore();
  const open = useUI((u) => u.open);
  return (
    <Card>
      <CardHeader title="Team & roles" desc="Admins manage everything. Exam managers create and publish exams. Reviewers see their batches’ scripts." action={<Button size="sm" variant="primary" onClick={() => open('invite')}><Plus /> Invite</Button>} />
      <Table>
        <thead><tr><Th>Member</Th><Th>Role</Th><Th>Batches</Th><Th className="w-10" /></tr></thead>
        <tbody>
          <tr><Td><span className="flex items-center gap-2.5"><Avatar name={me.name || me.email || 'You'} /><span><span className="block font-medium">{me.name || 'You'} <span className="text-faint">(you)</span></span><span className="text-xs text-muted">{me.email || '—'}</span></span></span></Td><Td>Academy admin</Td><Td className="text-muted">All</Td><Td /></tr>
          {members.map((m) => (
            <tr key={m.id}>
              <Td><span className="flex items-center gap-2.5"><Avatar name={m.name} /><span><span className="block font-medium">{m.name} <Badge>Invited</Badge></span><span className="text-xs text-muted">{m.email}</span></span></span></Td>
              <Td><Select aria-label={`Role for ${m.name}`} value={m.role} onChange={(e) => updateMember(m.id, { role: e.target.value as Role })} className="w-40"><option>Academy admin</option><option>Exam manager</option><option>Reviewer</option></Select></Td>
              <Td className="text-muted">{m.batchIds.length ? m.batchIds.map((id) => batches.find((b) => b.id === id)?.name).join(', ') : 'All'}</Td>
              <Td><Button variant="ghost" size="icon" className="size-7" aria-label={`Remove ${m.name}`} onClick={() => { removeMember(m.id); toast('Removed from team'); }}><Trash2 /></Button></Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!members.length && <p className="px-4 py-3 text-xs text-muted">Only you so far. Invite faculty so they can review scripts.</p>}
    </Card>
  );
}

function AccessTab() {
  const { access, setAccess, academy, newCode } = useStore();
  const rows: [keyof Access, string, string][] = [
    ['academyCreatesLogins', 'Academy creates student logins', 'Add a student and hand them a login ID and a temporary password.'],
    ['joinWithCode', 'Students can join with the academy code', 'Students enter the code in the Parallax Flow app.'],
    ['approveJoins', 'Approve every join request', 'Students who join with the code see nothing until approved.'],
    ['otpReset', 'Students reset their own password', 'By OTP to their registered mobile.'],
  ];
  return (
    <>
      <Card>
        <CardHeader title="Academy code" desc="Students type this in the app to ask to join." />
        <div className="flex flex-wrap items-center gap-3 p-4">
          {academy.code ? <span className="rounded-md border border-border bg-subtle px-3 py-1.5 font-mono text-base tracking-wider">{academy.code}</span> : <span className="text-sm text-muted">No code yet.</span>}
          <Button size="sm" onClick={() => { const c = newCode(); toast.success(`New code ${c}`); }}>{academy.code ? 'Generate new code' : 'Create code'}</Button>
          {academy.code && <span className="text-xs text-muted">A new code stops the old one working. Approved students aren’t affected.</span>}
        </div>
      </Card>
      <Card>
        <CardHeader title="Sign-in options" />
        <div className="divide-y divide-border">
          {rows.map(([k, t, d]) => <Row key={k} title={t} desc={d}><Switch label={t} checked={access[k]} onCheckedChange={(v) => setAccess({ [k]: v })} /></Row>)}
        </div>
      </Card>
    </>
  );
}

function ExamDefaults() {
  const { defaults, setDefaults } = useStore();
  return (
    <Card>
      <CardHeader title="Exam defaults" desc="Pre-filled on every new exam. You can change them per exam." />
      <div className="space-y-5 p-4">
        <div className="space-y-2">
          <div className="text-xs font-medium">Results</div>
          {(['clean', 'auto', 'manual'] as Policy[]).map((p) => <RadioCard key={p} id={`d-${p}`} name="d-policy" checked={defaults.policy === p} onChange={() => setDefaults({ policy: p })} title={POLICY[p].title} desc={POLICY[p].desc} />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Late uploads" htmlFor="d-late"><Select id="d-late" value={defaults.late} onChange={(e) => setDefaults({ late: e.target.value as Late })}>{Object.entries(LATE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Flag a step when AI confidence is below" htmlFor="d-flag"><Select id="d-flag" value={defaults.flagBelow} onChange={(e) => setDefaults({ flagBelow: +e.target.value })}>{[0.6, 0.7, 0.8].map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
        </div>
      </div>
    </Card>
  );
}

function Marking() {
  return (
    <Card>
      <CardHeader title="Marking rules" action={<Badge tone="warn">Being finalised</Badge>} />
      <div className="divide-y divide-border text-sm">
        {[['Skipped step', 'Only that step gets 0. Every other step is marked on what the student wrote.'], ['Partly correct step', 'Part marks as per the marking scheme.'], ['Final answer', 'To be decided with the academy.']].map(([k, v]) => (
          <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)]"><span className="text-muted">{k}</span><span>{v}</span></div>
        ))}
      </div>
    </Card>
  );
}

function Usage() {
  return (
    <Card>
      <CardHeader title="Plan & usage" />
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between text-sm"><span className="text-muted">Plan</span><Badge>Not chosen</Badge></div>
        <div>
          <div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">Scripts evaluated this month</span><span className="tnum font-medium">0</span></div>
          <div className="h-1.5 rounded-full bg-subtle ring-1 ring-inset ring-border" />
        </div>
        <p className="text-xs text-muted">The AI runs on Parallax Flow’s servers. Your academy doesn’t need its own API key.</p>
      </div>
    </Card>
  );
}

function DataTab() {
  const clearAll = useStore((s) => s.clearAll);
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-bad/30">
      <CardHeader title="Clear all data" desc="Removes every batch, student, team member and exam in this preview." />
      <div className="flex items-center gap-3 p-4">
        <AlertTriangle className="size-4 text-bad" /><span className="flex-1 text-sm text-muted">In this preview, data is kept in your browser only.</span>
        <Button variant="danger" onClick={() => setOpen(true)}>Clear data</Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen} title="Clear all data?" desc="Everything you added in this browser is removed. This can’t be undone."
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { clearAll(); setOpen(false); toast('All data cleared'); location.hash = '#overview'; }}>Clear all data</Button></>} />
    </Card>
  );
}
