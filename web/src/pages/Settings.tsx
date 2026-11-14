import { motion } from 'framer-motion';
import { AlertTriangle, CloudUpload, CreditCard, KeyRound, Monitor, Plus, Smartphone, Webhook } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { SETTINGS_TABS } from '../components/layout/TopNav';
import { Ring } from '../components/charts';
import { Avatar, Badge, Button, Card, CardHeader, Dialog, Field, Input, RadioCard, Segmented, Select, Switch, Table, Td, Th } from '../components/ui';
import { BUILT_IN, LEVELS, MODULES, levelOf } from '../lib/permissions';
import { RoleDialog } from '../components/RoleDialog';
import { href } from '../lib/router';
import { LATE, POLICY, useStore, type Access, type CustomRole, type Late, type Level, type Policy } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn } from '../lib/utils';
import { useShop } from '../lib/shop';

const Row = ({ title, desc, children }: { title: string; desc: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-6 px-5 py-4"><div className="min-w-0"><div className="text-sm font-semibold">{title}</div><div className="text-xs text-muted">{desc}</div></div>{children}</div>
);

export function Settings({ tab }: { tab: string }) {
  const current = SETTINGS_TABS.some(([k]) => k === tab) ? tab : 'general';
  const label = SETTINGS_TABS.find(([k]) => k === current)![1];
  return (
    <Page crumbs={[{ label: 'Settings' }, { label }]} screen="settings">
      <div className="mb-6"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Settings</h1><p className="text-sm text-muted">Academy profile, people and access, notifications, integrations and billing.</p></div>
      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Settings sections">
          {SETTINGS_TABS.map(([k, l, Icon]) => (
            <a key={k} href={href({ page: 'settings', tab: k })} aria-current={current === k ? 'page' : undefined}
              className={cn('relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-150', current === k ? 'text-bg' : 'text-muted hover:text-fg')}>
              {current === k && <motion.span layoutId="settings-nav" transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-full bg-fg" />}
              <Icon className="relative size-4" /><span className="relative">{l}</span>
            </a>
          ))}
        </nav>
        <motion.div key={current} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="min-w-0 space-y-5">
          {current === 'general' && <General />}
          {current === 'access' && <UserAccess />}
          {current === 'roles' && <Roles />}
          {current === 'notifications' && <Notifications />}
          {current === 'integrations' && <Integrations />}
          {current === 'security' && <Security />}
          {current === 'subscription' && <Subscription />}
          {current === 'exams' && <ExamDefaults />}
          {current === 'store' && <StoreRules />}
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
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = (e: FormEvent) => { e.preventDefault(); saveAcademy({ name: f.name.trim(), city: f.city.trim(), email: f.email.trim(), phone: f.phone.trim() }, { name: f.myName.trim() }); toast.success('Saved'); };
  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader title="Academy profile" desc="Shown to students in the app and to your team." />
        <div className="flex items-center gap-4 px-5 pb-2 pt-3">
          <span className="grid size-16 place-items-center rounded-full bg-fg text-lg font-bold text-bg">{(f.name || 'PF').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
          <label className="cursor-pointer rounded-full border border-border-strong px-4 py-2 text-xs font-semibold hover:bg-hover">Upload logo<input id="g-logo" type="file" accept="image/*" className="sr-only" onChange={() => toast('Logo upload needs the server, coming soon')} /></label>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Academy name" htmlFor="g-name"><Input id="g-name" value={f.name} onChange={set('name')} /></Field>
          <Field label="City" htmlFor="g-city"><Input id="g-city" value={f.city} onChange={set('city')} /></Field>
          <Field label="Contact email" htmlFor="g-mail"><Input id="g-mail" type="email" value={f.email} onChange={set('email')} /></Field>
          <Field label="Phone" htmlFor="g-ph"><Input id="g-ph" value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Your name" htmlFor="g-me"><Input id="g-me" value={f.myName} onChange={set('myName')} /></Field>
          <Field label="Sign-in email" htmlFor="g-myemail"><Input id="g-myemail" value={me.email} disabled /></Field>
          <Field label="GSTIN" htmlFor="g-gstin" hint="Set when your academy account was created. Used on every invoice."><Input id="g-gstin" value={academy.gstin || '—'} disabled /></Field>
          <Field label="Billing address" htmlFor="g-addr" hint="To change billing details, contact Parallax Flow."><Input id="g-addr" value={academy.address || '—'} disabled /></Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button disabled={!dirty} onClick={() => setF({ ...academy, myName: me.name })}>Discard</Button>
          <Button type="submit" variant="primary" disabled={!dirty}>Save changes</Button>
        </div>
      </Card>
    </form>
  );
}

function UserAccess() {
  const { members, me, updateMember, removeMember, access, setAccess, academy, newCode, roles } = useStore();
  const open = useUI((u) => u.open);
  const rows: [keyof Access, string, string][] = [
    ['academyCreatesLogins', 'Academy creates student logins', 'Add students and hand them a login ID and temporary password.'],
    ['joinWithCode', 'Students can join with a code or QR', 'From the Parallax Flow app.'],
    ['approveJoins', 'Approve every join request', 'Students who join see nothing until approved.'],
    ['otpReset', 'Students reset their own password', 'By OTP to their registered mobile.'],
  ];
  return (
    <>
      <Card>
        <CardHeader title="Admins & faculty" desc="Everyone who can sign in to this portal." action={<Button size="sm" variant="primary" onClick={() => open('invite')}><Plus /> Add</Button>} />
        <Table>
          <thead><tr><Th>Person</Th><Th>Access</Th><Th className="w-10" /></tr></thead>
          <tbody>
            <tr><Td><span className="flex items-center gap-3"><Avatar name={me.name || 'You'} /><span><span className="block font-semibold">{me.name || 'You'} <span className="text-faint">(you)</span></span><span className="text-2xs text-muted">{me.email || '—'}</span></span></span></Td><Td>Academy admin</Td><Td /></tr>
            {members.map((m) => (
              <tr key={m.id}>
                <Td><span className="flex items-center gap-3"><Avatar name={m.name} /><span><span className="block font-semibold">{m.name}</span><span className="text-2xs text-muted">{m.email}</span></span></span></Td>
                <Td><Select aria-label={`Access for ${m.name}`} value={m.role} onChange={(e) => updateMember(m.id, { role: e.target.value })} className="w-44">{[...BUILT_IN.map((r) => r.name), ...roles.map((r) => r.name)].map((r) => <option key={r}>{r}</option>)}</Select></Td>
                <Td><Button size="sm" variant="ghost" onClick={() => { removeMember(m.id); toast('Removed'); }}>Remove</Button></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card>
        <CardHeader title="Student sign-in" desc={`Academy code ${academy.code || 'not created'}`} action={<Button size="sm" onClick={() => toast.success(`New code ${newCode()}`)}><KeyRound /> {academy.code ? 'New academy code' : 'Create code'}</Button>} />
        <div className="divide-y divide-border">{rows.map(([k, t, d]) => <Row key={k} title={t} desc={d}><Switch label={t} checked={access[k]} onCheckedChange={(v) => setAccess({ [k]: v })} /></Row>)}</div>
      </Card>
    </>
  );
}

// ---------- Roles & permissions (from the client's Faculty UI brief) ----------
const LEVEL_CHIP: Record<Level | 'none', string> = { full: 'bg-fg text-bg', assigned: 'bg-pop text-pop-fg', limited: 'bg-subtle ring-1 ring-inset ring-border-strong', view: 'bg-subtle text-muted ring-1 ring-inset ring-border', none: 'text-faint' };
function Roles() {
  const { roles, removeRole } = useStore();
  const [mod, setMod] = useState(MODULES[0].name);
  const [edit, setEdit] = useState<CustomRole | 'new' | null>(null);
  const [safe, setSafe] = useState({ marks: true, publish: false });
  const m = MODULES.find((x) => x.name === mod)!;
  return (
    <>
      <Card>
        <CardHeader title="Roles" desc="The four built-in roles, plus any your academy creates." action={<Button size="sm" variant="primary" onClick={() => setEdit('new')}><Plus /> New role</Button>} />
        <div className="grid gap-2 p-5 pt-2 sm:grid-cols-2">
          {BUILT_IN.map((r) => <div key={r.name} className="rounded-xl bg-subtle p-3"><div className="flex items-center gap-2 text-sm font-semibold">{r.name}<Badge>{r.kind}</Badge></div><p className="mt-1 text-xs text-muted">{r.desc}</p></div>)}
          {roles.map((r) => (
            <div key={r.id} className="rounded-xl p-3 ring-1 ring-inset ring-border-strong">
              <div className="flex items-center gap-2 text-sm font-semibold">{r.name}<Badge tone="pop">Custom</Badge><span className="ml-auto flex gap-1"><Button size="sm" variant="ghost" onClick={() => setEdit(r)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => { removeRole(r.id); toast('Role removed'); }}>Remove</Button></span></div>
              <p className="mt-1 text-xs text-muted">{r.desc} · {Object.keys(r.perms).length} features on</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Permissions" desc="What each role can do, module by module." />
        <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
          <Segmented value={mod} onChange={setMod} options={MODULES.map((x) => ({ value: x.name, label: x.name }))} />
          <div className="flex flex-wrap gap-2 text-2xs text-muted sm:ml-auto">{(Object.keys(LEVELS) as (Level | 'none')[]).map((l) => <span key={l} title={LEVELS[l].desc} className={cn('rounded-full px-2 py-0.5 font-semibold', LEVEL_CHIP[l])}>{LEVELS[l].label}</span>)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="text-left text-xs text-muted"><th className="px-5 py-2.5 font-medium">Feature</th>{BUILT_IN.map((r) => <th key={r.name} className="px-3 py-2.5 font-medium">{r.name}</th>)}{roles.map((r) => <th key={r.id} className="px-3 py-2.5 font-medium">{r.name}</th>)}</tr></thead>
            <tbody>{m.rows.map(([f, ...cells]) => (
              <tr key={f} className="border-t border-border">
                <td className="px-5 py-2.5 font-medium">{f}</td>
                {cells.map((c, i) => <td key={i} className="px-3 py-2.5"><span className={cn('inline-block rounded-full px-2 py-0.5 text-2xs font-semibold', LEVEL_CHIP[levelOf(c)])}>{c}</span></td>)}
                {roles.map((r) => { const l = r.perms[f] ?? 'none'; return <td key={r.id} className="px-3 py-2.5"><span className={cn('inline-block rounded-full px-2 py-0.5 text-2xs font-semibold', LEVEL_CHIP[l])}>{LEVELS[l].label}</span></td>; })}
              </tr>
            ))}</tbody>
          </table>
        </div>
        {m.note && <p className="border-t border-border px-5 py-3 text-xs text-muted">{m.note}</p>}
      </Card>

      <Card>
        <CardHeader title="Evaluation safeguards" desc="Reviewers enter marks but can't publish results or change questions. Every change to marks is recorded." />
        <div className="divide-y divide-border">
          <Row title="Second approval for changing marks" desc="A change to marks after evaluation waits for an Exam manager or Admin to approve."><Switch label="Second approval for marks" checked={safe.marks} onCheckedChange={(v) => setSafe({ ...safe, marks: v })} /></Row>
          <Row title="Second approval before publishing results" desc="Final results go out only after a second person approves."><Switch label="Second approval for results" checked={safe.publish} onCheckedChange={(v) => setSafe({ ...safe, publish: v })} /></Row>
          <Row title="Show who changed marks or answers" desc="The Academy Admin sees every change, who made it and when."><Badge tone="pop">Always on</Badge></Row>
        </div>
      </Card>
      {edit && <RoleDialog role={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </>
  );
}


function Notifications() {
  const items = [['New registrations', true, false], ['Join requests waiting', true, true], ['Test submissions', false, true], ['Scripts flagged for review', true, true], ['Fee payments', true, false], ['Weekly academy summary', true, false]] as const;
  const [state, setState] = useState(items.map(([, e, a]) => [e, a] as [boolean, boolean]));
  return (
    <Card>
      <CardHeader title="Notifications" desc="Choose what reaches you by email and in the app." />
      <div className="grid grid-cols-[minmax(0,1fr)_64px_64px] items-center gap-y-1 px-5 pb-4 text-sm">
        <span /><span className="text-center text-2xs font-semibold text-muted">Email</span><span className="text-center text-2xs font-semibold text-muted">App</span>
        {items.map(([l], i) => (
          <div key={l} className="contents"><span className="border-t border-border py-3 font-medium">{l}</span>
            {[0, 1].map((c) => <span key={c} className="grid place-items-center border-t border-border py-3"><Switch label={`${l} ${c ? 'app' : 'email'}`} checked={state[i][c]} onCheckedChange={(v) => setState(state.map((x, j) => (j === i ? (c ? [x[0], v] : [v, x[1]]) : x)) as [boolean, boolean][])} /></span>)}
          </div>
        ))}
      </div>
    </Card>
  );
}

function Integrations() {
  const list = [
    { name: 'Payment gateway', desc: 'Collect fees and sell e-books, tests and question banks', icon: CreditCard, status: 'Not connected' },
    { name: 'Cloud storage', desc: 'Keep study materials and answer scripts in your storage', icon: CloudUpload, status: 'Parallax Flow storage' },
    { name: 'SMS & WhatsApp', desc: 'Send logins, reminders and results to students', icon: Smartphone, status: 'Not connected' },
    { name: 'API access', desc: 'Connect your website or other tools', icon: Webhook, status: 'Off' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {list.map((it) => (
        <div key={it.name} className="flex flex-col rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-full bg-subtle"><it.icon className="size-5" /></span><Badge tone={it.status.startsWith('Parallax') ? 'pop' : 'neutral'}>{it.status}</Badge></div>
          <div className="mt-4 font-bold">{it.name}</div><p className="mt-0.5 flex-1 text-xs text-muted">{it.desc}</p>
          <Button className="mt-4 self-start" size="sm" onClick={() => toast('Integrations are set up with the backend, coming in a later phase')}>{it.status.startsWith('Not') || it.status === 'Off' ? 'Connect' : 'Manage'}</Button>
        </div>
      ))}
    </div>
  );
}

function Security() {
  const [twoStep, setTwoStep] = useState(false);
  const logins = [['Chrome on Windows', 'Chennai, IN', 'Now', true], ['Safari on iPhone', 'Chennai, IN', 'Yesterday, 9:14 pm', false], ['Chrome on Windows', 'Bengaluru, IN', '5 Nov, 10:02 am', false]] as const;
  return (
    <>
      <Card>
        <CardHeader title="Password" />
        <form onSubmit={(e) => { e.preventDefault(); toast.success('Password changed'); (e.target as HTMLFormElement).reset(); }} className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="Current password" htmlFor="sec-cur"><Input id="sec-cur" type="password" autoComplete="current-password" /></Field>
          <Field label="New password" htmlFor="sec-new"><Input id="sec-new" type="password" autoComplete="new-password" /></Field>
          <Field label="Repeat new password" htmlFor="sec-rep"><Input id="sec-rep" type="password" autoComplete="new-password" /></Field>
          <div className="sm:col-span-3"><Button type="submit" variant="primary">Change password</Button></div>
        </form>
      </Card>
      <Card><div className="divide-y divide-border"><Row title="Two-step sign-in" desc="Ask for a code from your phone when signing in on a new device."><Switch label="Two-step sign-in" checked={twoStep} onCheckedChange={setTwoStep} /></Row></div></Card>
      <Card>
        <CardHeader title="Login history" desc="Recent sign-ins to your account (sample)" />
        <ul className="divide-y divide-border">{logins.map(([d, p, t, cur], i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-3.5 text-sm"><Monitor className="size-4 text-muted" /><span className="flex-1"><span className="block font-semibold">{d}</span><span className="text-2xs text-muted">{p}</span></span><span className="text-xs text-muted">{t}</span>{cur && <Badge tone="pop">This device</Badge>}</li>
        ))}</ul>
      </Card>
    </>
  );
}

function Subscription() {
  const { students } = useStore();
  const limit = 1500;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl bg-fg p-6 text-bg lg:col-span-2">
        <Badge tone="pop">Current plan</Badge>
        <div className="mt-4 text-[28px] font-bold tracking-tight">Growth</div>
        <p className="mt-1 text-sm opacity-70">Up to {limit.toLocaleString('en-IN')} students · AI evaluation included · renews 1 Dec 2026</p>
        <div className="mt-6 flex gap-2"><Button className="border-bg/20 bg-bg/10 text-bg hover:bg-bg/20" onClick={() => toast('Plan changes go through Parallax Flow sales for now')}>Change plan</Button><Button className="border-bg/20 bg-bg/10 text-bg hover:bg-bg/20" onClick={() => toast('Invoices appear here once billing is connected')}>Invoices</Button></div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-panel p-6 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        <Ring value={(students.length / limit) * 100} size={110} stroke={11} tone="pop" label="Seats used" />
        <div className="tnum text-sm font-bold">{students.length.toLocaleString('en-IN')} / {limit.toLocaleString('en-IN')}</div><div className="text-2xs text-muted">student seats used</div>
      </div>
    </div>
  );
}

function ExamDefaults() {
  const { defaults, setDefaults } = useStore();
  return (
    <Card>
      <CardHeader title="Exam defaults" desc="Pre-filled on every new test. You can change them per test." />
      <div className="space-y-5 p-5">
        <div className="space-y-2"><div className="text-xs font-semibold">Results</div>
          {(['clean', 'auto', 'manual'] as Policy[]).map((p) => <RadioCard key={p} id={`d-${p}`} name="d-policy" checked={defaults.policy === p} onChange={() => setDefaults({ policy: p })} title={POLICY[p].title} desc={POLICY[p].desc} />)}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Late uploads" htmlFor="d-late"><Select id="d-late" value={defaults.late} onChange={(e) => setDefaults({ late: e.target.value as Late })}>{Object.entries(LATE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Flag a step when AI confidence is below" htmlFor="d-flag"><Select id="d-flag" value={defaults.flagBelow} onChange={(e) => setDefaults({ flagBelow: +e.target.value })}>{[0.6, 0.7, 0.8].map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
        </div>
        <div className="rounded-2xl bg-warn-soft p-4 text-xs text-warn"><b>Marking rules are being finalised.</b> Current direction: a skipped step gets 0, and every other step is marked on what the student wrote.</div>
      </div>
    </Card>
  );
}

/** Every number the Store uses; change them here and the Store follows. */
function StoreRules() {
  const { rules, setRules } = useShop();
  const num = (label: string, value: number, apply: (v: number) => void, hint?: string) => (
    <Field label={label} hint={hint}><Input type="number" min={0} value={value} onChange={(e) => apply(Math.max(0, Math.floor(+e.target.value)))} /></Field>
  );
  return (
    <Card>
      <CardHeader title="Store rules" desc="Licences for Parallax Flow products, and the My Store add-on." />
      <div className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {num('Licence validity (months)', rules.validityMonths, (v) => setRules({ validityMonths: v }), 'Expires even if cycles are unused.')}
          {num('Allocation cycles per licence', rules.cycles, (v) => setRules({ cycles: Math.max(1, v) }), 'Each cycle allows the purchased number of unique students.')}
        </div>
        <div className="space-y-2"><div className="text-xs font-semibold">My Store payments</div>
          <RadioCard id="pay-pf" name="payout" checked={rules.payout === 'parallax'} onChange={() => setRules({ payout: 'parallax' })} title="Parallax Flow collects and pays the academy" desc="Simpler for academies. Parallax Flow keeps a commission and handles payouts and invoices." />
          <RadioCard id="pay-ac" name="payout" checked={rules.payout === 'academy'} onChange={() => setRules({ payout: 'academy' })} title="Each academy connects its own payment account" desc="Money goes straight to the academy. Each academy sets up its own gateway." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {rules.payout === 'parallax' && num('Commission per sale (%)', rules.commission, (v) => setRules({ commission: v }))}
          {num('My Store add-on (₹ / month)', rules.addonPrice, (v) => setRules({ addonPrice: v }))}
        </div>
      </div>
    </Card>
  );
}

function DataTab() {
  const { sample, clearAll, loadSample } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader title="Data" desc={sample ? 'You are looking at sample data. All names and figures are made up.' : 'Your academy’s data in this preview is kept in this browser only.'} />
      <div className="flex flex-wrap items-center gap-3 p-5">
        <AlertTriangle className="size-4 text-bad" /><span className="flex-1 text-sm text-muted">{sample ? 'Clear the sample to start your own academy from empty.' : 'Load the sample academy to explore the dashboards.'}</span>
        {sample ? <Button variant="danger" onClick={() => setOpen(true)}>Clear sample data</Button> : <><Button onClick={() => { loadSample(); toast.success('Sample data loaded'); }}>Load sample data</Button><Button variant="danger" onClick={() => setOpen(true)}>Clear all data</Button></>}
      </div>
      <Dialog open={open} onOpenChange={setOpen} title="Clear all data?" desc="Every batch, student, faculty member, test and calendar entry in this browser is removed. This can’t be undone."
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { clearAll(); setOpen(false); toast('All data cleared'); location.hash = '#dashboard'; }}>Clear all data</Button></>} />
    </Card>
  );
}
