// Add faculty and Edit details share one form: Name, Email, Phone, DOB (optional), Access and an optional photo.
// Subjects and batches are given later from Assign.
import { Copy, ImagePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BUILT_IN } from '../lib/permissions';
import { facultyPassword, useStore, validEmail, type Member } from '../lib/store';
import { photoToDataUrl } from '../lib/utils';
import { Avatar, Badge, Button, Dialog, Field, Input, Select } from './ui';

type Form = { name: string; email: string; phone: string; dob: string; role: string; photo?: string };

export function FacultyDialog({ open, member, onClose }: { open: boolean; member?: Member | null; onClose: () => void }) {
  const { members, roles, invite, updateMember, academy } = useStore();
  const [f, setF] = useState<Form>({ name: '', email: '', phone: '', dob: '', role: 'Faculty' });
  const [made, setMade] = useState<Member | null>(null);
  useEffect(() => {
    if (!open) return;
    setMade(null);
    setF(member ? { name: member.name, email: member.email, phone: member.phone ?? '', dob: member.dob ?? '', role: member.role, photo: member.photo } : { name: '', email: '', phone: '', dob: '', role: 'Faculty' });
  }, [open, member]);
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  const digits = f.phone.replace(/\D/g, '');
  const taken = members.some((m) => m.id !== member?.id && m.email.toLowerCase() === f.email.trim().toLowerCase());
  const ok = f.name.trim() && validEmail(f.email) && !taken && digits.length >= 10;
  const allRoles = [...BUILT_IN.map((r) => ({ name: r.name, desc: `${r.kind} · ${r.desc}` })), ...roles.map((r) => ({ name: r.name, desc: `Custom role · ${r.desc}` }))];
  const pickPhoto = (file?: File) => file && photoToDataUrl(file).then((photo) => set({ photo }), () => toast.error('That image couldn’t be read'));

  const save = () => {
    if (!ok) return;
    const data = { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), dob: f.dob || undefined, role: f.role, photo: f.photo };
    if (member) { updateMember(member.id, data); toast.success('Details saved'); onClose(); }
    else setMade(invite({ ...data, subjects: [], batchIds: [] }));
  };

  if (made) {
    const pw = facultyPassword(made.name, made.phone ?? '');
    const share = `${academy.name || 'Parallax Flow'} portal\nLogin ID: ${made.email}\nPassword: ${pw}`;
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Faculty account created" desc="Shows “Invitation pending” until their first sign-in."
        footer={<><Button onClick={() => navigator.clipboard?.writeText(share).then(() => toast.success('Copied'), () => toast('Select the details and copy them'))}><Copy /> Copy</Button><Button variant="primary" onClick={onClose}>Done</Button></>}>
        <div className="mb-2 rounded-2xl bg-subtle p-5">
          <div className="mb-3 flex items-center gap-3"><Avatar name={made.name} src={made.photo} /><span className="font-semibold">{made.name}</span><Badge tone="warn">Invitation pending</Badge></div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">Login ID</dt><dd className="break-all font-mono">{made.email}</dd>
            <dt className="text-muted">Password</dt><dd className="font-mono">{pw}</dd>
            <dt className="text-muted">Access</dt><dd>{made.role}</dd>
          </dl>
        </div>
        <p className="pb-2 text-xs text-muted">Default password: first 4 letters of the name @ last 4 digits of the phone. They can change it after signing in.</p>
      </Dialog>
    );
  }

  return (
    <Dialog wide open={open} onOpenChange={(v) => !v && onClose()} title={member ? 'Edit details' : 'Add faculty'} desc={member ? 'Changes apply everywhere this person appears.' : 'Faculty sign in to this portal with their email.'}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!ok} onClick={save}>{member ? 'Save' : 'Create account'}</Button></>}>
      <div className="grid gap-4 pb-2 sm:grid-cols-[120px_minmax(0,1fr)]">
        {/* Photo (optional): shown on their profile and on this page instead of initials */}
        <div className="flex flex-col items-center gap-2">
          {f.photo ? <img src={f.photo} alt="" className="size-24 rounded-full object-cover ring-1 ring-border" /> : <span className="grid size-24 place-items-center rounded-full bg-subtle text-muted ring-1 ring-inset ring-border"><ImagePlus className="size-6" /></span>}
          <label className="cursor-pointer text-xs font-semibold underline-offset-2 hover:underline">{f.photo ? 'Change photo' : 'Upload photo'}<input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} /></label>
          {f.photo ? <button type="button" onClick={() => set({ photo: undefined })} className="flex items-center gap-1 text-2xs text-muted hover:text-fg"><X className="size-3" /> Remove</button> : <span className="text-2xs text-faint">Optional</span>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="fd-name"><Input id="fd-name" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Phone number" htmlFor="fd-ph" hint={f.phone && digits.length < 10 ? <span className="text-bad">Enter the full mobile number.</span> : undefined}><Input id="fd-ph" inputMode="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91" /></Field>
          <Field label="Email" htmlFor="fd-mail" className="sm:col-span-2" hint={taken ? <span className="text-bad">Someone already uses this email.</span> : 'This is also their login ID.'}><Input id="fd-mail" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Date of birth" htmlFor="fd-dob" optional><Input id="fd-dob" type="date" value={f.dob} onChange={(e) => set({ dob: e.target.value })} /></Field>
          <Field label="Access" htmlFor="fd-role" hint={allRoles.find((r) => r.name === f.role)?.desc}><Select id="fd-role" value={f.role} onChange={(e) => set({ role: e.target.value })}>{allRoles.map((r) => <option key={r.name}>{r.name}</option>)}</Select></Field>
          {!member && (
            <div className="rounded-xl bg-subtle p-3 text-xs sm:col-span-2">
              <span className="font-semibold">Created automatically · </span>
              <span className="text-muted">Login ID </span><span className="font-mono">{f.email.trim() || 'their email'}</span>
              <span className="text-muted"> · Password </span><span className="font-mono">{f.name.trim() && digits.length >= 4 ? facultyPassword(f.name, f.phone) : 'Name@1234'}</span>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
