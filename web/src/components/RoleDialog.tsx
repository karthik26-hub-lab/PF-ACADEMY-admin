// Create or edit a custom role, from Settings or straight from Add/Edit faculty.
// "Start from" combines built-in roles (e.g. Faculty + Reviewer): each feature takes the higher of their levels.
// Then every feature can still be switched on or off and its level changed.
import { Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { BUILT_IN, LEVELS, MODULES, combinePerms } from '../lib/permissions';
import { useStore, type CustomRole, type Level } from '../lib/store';
import { cn } from '../lib/utils';
import { Button, Dialog, Field, Input, Segmented, Select, Switch } from './ui';

export function RoleDialog({ role, onClose, onSaved }: { role: CustomRole | null; onClose: () => void; onSaved?: (name: string) => void }) {
  const { saveRole, roles } = useStore();
  const [name, setName] = useState(role?.name ?? ''), [desc, setDesc] = useState(role?.desc ?? '');
  const [base, setBase] = useState<string[]>(role ? [] : ['Faculty']);
  const [perms, setPerms] = useState<CustomRole['perms']>(role?.perms ?? combinePerms(['Faculty']));
  const [mod, setMod] = useState(MODULES[0].name);
  const clash = [...BUILT_IN.map((r) => r.name), ...roles.filter((r) => r.id !== role?.id).map((r) => r.name)].some((n) => n.toLowerCase() === name.trim().toLowerCase());
  const set = (f: string, l: Level | null) => setPerms((p) => { const n = { ...p }; if (l) n[f] = l; else delete n[f]; return n; });
  const pickBase = (r: string) => {
    const next = base.includes(r) ? base.filter((x) => x !== r) : [...base, r];
    setBase(next); setPerms(combinePerms(next));
    if (!name.trim() || name === base.join(' + ')) setName(next.join(' + '));  // name follows the picks until you type your own
  };
  const rows = MODULES.find((x) => x.name === mod)!.rows;
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={role ? `Edit role · ${role.name}` : 'New custom role'} desc="Combine built-in roles, then switch features on or off and set how much each one allows."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim() || clash || !Object.keys(perms).length} onClick={() => { saveRole({ name: name.trim(), desc: desc.trim() || `Custom role${base.length ? `: ${base.join(' + ')}` : ''}`, perms }, role?.id); toast.success(role ? 'Role saved' : `Role “${name.trim()}” created`); onSaved?.(name.trim()); onClose(); }}>{role ? 'Save role' : 'Create role'}</Button></>}>
      <div className="space-y-4 pb-2">
        <div>
          <div className="mb-1.5 text-xs font-medium">Start from {role && <span className="font-normal text-muted">· replaces the current switches</span>}</div>
          <div className="flex flex-wrap gap-1.5">{BUILT_IN.map((r) => { const on = base.includes(r.name); return (
            <button key={r.name} type="button" onClick={() => pickBase(r.name)} title={r.desc} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors', on ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg')}>{on && <Check className="size-3" />}{r.name}</button>
          ); })}</div>
          <p className="mt-1.5 text-2xs text-muted">Pick more than one to combine them, for example Faculty + Reviewer teaches and also evaluates scripts.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role name" hint={clash ? <span className="text-bad">A role with this name already exists.</span> : undefined}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Faculty + Reviewer" /></Field>
          <Field label="What they do" optional><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Teaches Taxation and evaluates its scripts" /></Field>
        </div>
        <Segmented value={mod} onChange={setMod} options={MODULES.map((x) => ({ value: x.name, label: <>{x.name}<span className="tnum text-faint">{x.rows.filter(([f]) => perms[f]).length}</span></> }))} />
        <ul className="divide-y divide-border rounded-xl ring-1 ring-inset ring-border">{rows.map(([f]) => (
          <li key={f} className="flex items-center gap-3 px-3 py-2">
            <Switch label={f} checked={!!perms[f]} onCheckedChange={(v) => set(f, v ? 'view' : null)} />
            <span className={cn('flex-1 text-sm', !perms[f] && 'text-muted')}>{f}</span>
            {perms[f] && <Select aria-label={`${f} level`} value={perms[f]} onChange={(e) => set(f, e.target.value as Level)} className="w-36">{(['full', 'assigned', 'limited', 'view'] as const).map((l) => <option key={l} value={l}>{LEVELS[l].label}</option>)}</Select>}
          </li>
        ))}</ul>
      </div>
    </Dialog>
  );
}
