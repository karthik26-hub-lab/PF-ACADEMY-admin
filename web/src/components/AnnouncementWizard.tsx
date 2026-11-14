// Create / edit an announcement in four steps, then a preview:
// 1 Content · 2 Audience · 3 Display options · 4 Schedule & publish · Preview (Publish, Save as draft, Cancel).
import { Bell, CheckCircle2, CloudUpload, Layers, Link2, PanelTop, Pencil, Send, Users, X } from 'lucide-react';
import { useState, type ElementType } from 'react';
import { toast } from 'sonner';
import { useStore, type AnnCategory, type AnnDisplay, type Announcement } from '../lib/store';
import { cn, fmtDateTime } from '../lib/utils';
import { Audience } from '../pages/store/MyProducts';
import { Button, Dialog, Field, Input, Segmented, Select, Textarea } from './ui';

export const CATEGORIES: AnnCategory[] = ['General', 'Academic', 'Examination', 'Deadlines', 'Offers'];
export const DISPLAY: Record<AnnDisplay, { label: string; desc: string; push: boolean; icon: ElementType }> = {
  notification: { label: 'Notification only', desc: 'Appears in the student’s in-app notification area and sends a mobile push notification.', push: true, icon: Bell },
  popup: { label: 'Pop-up only', desc: 'Appears as a pop-up when students open the app. No push notification and no entry in the notification area.', push: false, icon: PanelTop },
  both: { label: 'Both', desc: 'Appears in the notification area, sends a push notification and also appears as a pop-up.', push: true, icon: Layers },
};
export const POPUP_MODE = { once: 'Only once', daily: 'Once a day', custom: 'A set number of times', every: 'Every time the app opens' } as const;
export const popupText = (a: Pick<Announcement, 'popup'>) => (a.popup.mode === 'custom' ? `${a.popup.times} times` : POPUP_MODE[a.popup.mode]);

/** How many students an audience reaches. */
export function useReach() {
  const { students, batches } = useStore();
  const course = new Map(batches.map((b) => [b.id, b.course as string]));
  return (a: Pick<Announcement, 'who' | 'whoIds'>) => (a.who === 'all' ? students.length : a.who === 'students' ? a.whoIds.length : students.filter((s) => a.who === 'batches' ? a.whoIds.includes(s.batchId) : a.whoIds.includes(course.get(s.batchId) ?? '')).length);
}

type Draft = Omit<Announcement, 'id' | 'createdAt' | 'reads' | 'state'>;
const blank = (batchId?: string): Draft => ({ title: '', category: 'General', description: '', files: [], links: [], who: batchId ? 'batches' : 'all', whoIds: batchId ? [batchId] : [], display: 'both', popup: { mode: 'once', times: 3 } });
const STEPS = ['Announcement content', 'Audience', 'Display options', 'Schedule and publish'];

export function AnnouncementWizard({ edit, batchId, onClose }: { edit?: Announcement | null; batchId?: string; onClose: () => void }) {
  const { saveAnnouncement } = useStore();
  const reach = useReach();
  const [f, setF] = useState<Draft>(() => (edit ? { ...edit } : blank(batchId)));
  const [step, setStep] = useState(0);
  const [link, setLink] = useState('');
  const [when, setWhen] = useState<'now' | 'later'>(edit?.publishAt && +new Date(edit.publishAt) > Date.now() ? 'later' : 'now');
  const [ends, setEnds] = useState<'never' | 'date'>(edit?.expiresAt ? 'date' : 'never');
  const set = (p: Partial<Draft>) => setF((x) => ({ ...x, ...p }));
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
  const publishAt = when === 'later' ? f.publishAt : undefined, expiresAt = ends === 'date' ? f.expiresAt : undefined;
  // Step 1: everything is required except that description OR an attachment/link is enough.
  const ok = [
    !!f.title.trim() && !!(f.description.trim() || f.files.length || f.links.length),
    f.who === 'all' || f.whoIds.length > 0,
    f.display === 'notification' || f.popup.mode !== 'custom' || f.popup.times >= 1,
    (when === 'now' || (!!publishAt && publishAt > nowLocal)) && (ends === 'never' || (!!expiresAt && expiresAt > (publishAt || nowLocal))),
  ];
  const save = (draft: boolean) => {
    saveAnnouncement({ ...f, title: f.title.trim(), description: f.description.trim(), publishAt, expiresAt, state: draft ? 'draft' : 'live' }, edit?.id);
    toast.success(draft ? 'Saved as a draft' : publishAt ? `Scheduled for ${fmtDateTime(+new Date(publishAt))}` : 'Announcement published', { description: draft ? 'Drafts stay unpublished.' : `Reaches ${reach(f).toLocaleString('en-IN')} students.` });
    onClose();
  };
  const preview = step === 4;

  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={edit ? 'Edit announcement' : 'Create announcement'} desc="Create a new communication for your students" className="max-w-3xl"
      footer={<>
        <Button onClick={onClose}>Cancel</Button>
        {step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
        {preview ? <><Button onClick={() => save(true)}>Save as draft</Button><Button variant="primary" onClick={() => save(false)}><Send /> {publishAt ? 'Schedule' : 'Publish'}</Button></>
          : <Button variant="primary" disabled={!ok[step]} onClick={() => setStep(step + 1)}>{step === 3 ? 'Preview' : 'Next'}</Button>}
      </>}>
      <div className="space-y-5 pb-2">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 font-semibold">{preview ? <CheckCircle2 className="size-4" /> : <Pencil className="size-4" />}{preview ? 'Preview' : `Step ${step + 1} — ${STEPS[step]}`}</span><span className="rounded-full bg-subtle px-2 py-0.5 font-semibold text-muted">{preview ? 'Ready' : `Step ${step + 1} of 4`}</span></div>
          <div className="grid grid-cols-4 gap-1.5">{STEPS.map((s, i) => <button key={s} type="button" disabled={i > step && !ok.slice(0, i).every(Boolean)} onClick={() => setStep(i)} aria-label={s} className={cn('h-1.5 rounded-full transition-colors', i <= step ? 'bg-fg' : 'bg-border')} />)}</div>
        </div>

        {step === 0 && <div className="grid gap-4">
          <Field label="Announcement title"><Input autoFocus value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="E.g. CA Inter January 2027 – Exam predictions" /></Field>
          <Field label="Category"><Select value={f.category} onChange={(e) => set({ category: e.target.value as AnnCategory })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Announcement description" hint="Add a description, an attachment or a link: any one is enough."><Textarea value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="Write your announcement here…" className="min-h-28" /></Field>
          <div>
            <div className="mb-1.5 text-xs font-medium">Attachments and resources</div>
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-border-strong bg-subtle px-4 py-6 text-center transition hover:border-fg/40">
              <CloudUpload className="size-5 text-muted" /><span className="text-sm font-semibold">Upload files</span><span className="text-2xs text-muted">PDF, DOC, DOCX, PNG, JPG and more · several files allowed</span>
              <input type="file" multiple className="sr-only" onChange={(e) => set({ files: [...f.files, ...[...(e.target.files ?? [])].map((x) => x.name)] })} />
            </label>
            <div className="mt-2 flex gap-2"><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Or add a link (YouTube video, website…)" /><Button disabled={!/^https?:\/\/\S+\.\S+/.test(link.trim())} onClick={() => { set({ links: [...f.links, link.trim()] }); setLink(''); }}><Link2 /> Add</Button></div>
            {(f.files.length > 0 || f.links.length > 0) && <ul className="mt-2 flex flex-wrap gap-1.5">{[...f.files.map((x) => ['file', x]), ...f.links.map((x) => ['link', x])].map(([k, x]) => (
              <li key={k + x} className="flex max-w-full items-center gap-1.5 rounded-full bg-subtle py-1 pl-3 pr-1 text-xs ring-1 ring-inset ring-border"><span className="truncate">{x}</span>
                <button type="button" aria-label={`Remove ${x}`} onClick={() => set(k === 'file' ? { files: f.files.filter((y) => y !== x) } : { links: f.links.filter((y) => y !== x) })} className="grid size-5 place-items-center rounded-full hover:bg-hover"><X className="size-3" /></button></li>
            ))}</ul>}
          </div>
        </div>}

        {step === 1 && <div className="grid gap-4 sm:grid-cols-2">
          <Audience students label="Who should receive it?" allLabel="All students" who={f.who} ids={f.whoIds} onChange={(who, whoIds) => set({ who, whoIds })} />
          <p className="flex items-center gap-1.5 text-xs text-muted sm:col-span-2"><Users className="size-3.5" />Reaches {reach(f).toLocaleString('en-IN')} students</p>
        </div>}

        {step === 2 && <div className="space-y-3">
          <div className="text-sm font-semibold">How should students receive this announcement?</div>
          {(Object.keys(DISPLAY) as AnnDisplay[]).map((k) => { const d = DISPLAY[k], on = f.display === k; return (
            <button key={k} type="button" onClick={() => set({ display: k })} className={cn('flex w-full items-start gap-3 rounded-2xl p-4 text-left ring-1 ring-inset transition', on ? 'bg-panel ring-2 ring-fg' : 'bg-subtle ring-border hover:ring-border-strong')}>
              <d.icon className="mt-0.5 size-5 shrink-0" />
              <span className="flex-1"><span className="block text-sm font-semibold">{d.label}</span><span className="block text-xs text-muted">{d.desc}</span>
                <span className={cn('mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold', d.push ? 'bg-pop text-pop-fg' : 'bg-border text-muted')}>{d.push ? 'Push notification on' : 'No push notification'}</span></span>
              {on && <CheckCircle2 className="size-5 shrink-0" />}
            </button>
          ); })}
          {f.display !== 'notification' && (
            <div className="rounded-2xl bg-subtle p-4">
              <div className="mb-2 text-xs font-semibold">How often should the pop-up show?</div>
              <div className="flex flex-wrap items-center gap-2">
                <Segmented value={f.popup.mode} onChange={(mode) => set({ popup: { ...f.popup, mode } })} options={(Object.keys(POPUP_MODE) as (keyof typeof POPUP_MODE)[]).map((m) => ({ value: m, label: POPUP_MODE[m] }))} />
                {f.popup.mode === 'custom' && <Input type="number" min={1} value={f.popup.times} onChange={(e) => set({ popup: { ...f.popup, times: Math.max(1, Math.floor(+e.target.value)) } })} className="w-24" aria-label="Number of times" />}
              </div>
              {f.display === 'both' && <p className="mt-2 text-2xs text-muted">After the pop-up limit is reached it stays in the notification area until it expires.</p>}
            </div>
          )}
        </div>}

        {step === 3 && <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><div className="text-xs font-semibold">Publish</div>
            <Segmented value={when} onChange={setWhen} options={[{ value: 'now', label: 'Immediately' }, { value: 'later', label: 'Schedule' }]} />
            {when === 'later' && <Input type="datetime-local" min={nowLocal} value={f.publishAt ?? ''} onChange={(e) => set({ publishAt: e.target.value })} aria-label="Publish on" />}
            <p className="text-2xs text-muted">{when === 'now' ? 'Goes out as soon as you publish.' : 'Publishes automatically on this date.'}</p>
          </div>
          <div className="space-y-2"><div className="text-xs font-semibold">Expiry</div>
            <Segmented value={ends} onChange={setEnds} options={[{ value: 'never', label: 'Until removed' }, { value: 'date', label: 'Set expiry' }]} />
            {ends === 'date' && <Input type="datetime-local" min={publishAt || nowLocal} value={f.expiresAt ?? ''} onChange={(e) => set({ expiresAt: e.target.value })} aria-label="Expires on" />}
            <p className="text-2xs text-muted">{ends === 'never' ? 'Stays visible until you withdraw or archive it.' : 'On this date it disappears for students (including the notification area) and moves to Expired.'}</p>
          </div>
        </div>}

        {preview && <div className="grid gap-5 sm:grid-cols-[260px_minmax(0,1fr)]">
          {/* What students will see in the app */}
          <div className="mx-auto w-[240px] rounded-[28px] bg-[hsl(240_6%_9%)] p-2.5 shadow-float">
            <div className="relative min-h-[380px] overflow-hidden rounded-[22px] bg-[hsl(240_10%_96%)] p-3 text-black">
              <div className="mb-2 text-[10px] font-bold text-black/50">Notifications</div>
              {f.display !== 'popup' ? <div className="rounded-xl bg-white p-2.5 shadow-sm"><div className="flex items-center gap-1.5 text-[9px] font-semibold text-black/50"><Bell className="size-3" />{f.category} · now</div><div className="mt-0.5 text-xs font-bold leading-tight">{f.title}</div><div className="mt-0.5 line-clamp-2 text-[10px] text-black/60">{f.description || f.files[0] || f.links[0]}</div></div>
                : <p className="text-[10px] text-black/40">Pop-up only: nothing is stored here.</p>}
              {f.display !== 'notification' && <div className="absolute inset-0 grid place-items-center bg-black/40 p-4"><div className="w-full rounded-2xl bg-white p-3.5 text-center shadow-lg">
                <div className="mx-auto mb-1.5 w-fit rounded-full bg-[hsl(var(--pop))] px-2 py-0.5 text-[9px] font-bold">{f.category}</div>
                <div className="text-sm font-bold leading-tight">{f.title}</div><div className="mt-1 line-clamp-4 text-[10px] text-black/60">{f.description}</div>
                {(f.files.length > 0 || f.links.length > 0) && <div className="mt-1.5 text-[9px] font-semibold text-black/50">{f.files.length + f.links.length} attachment{f.files.length + f.links.length === 1 ? '' : 's'}</div>}
                <div className="mt-2.5 rounded-full bg-black py-1.5 text-[10px] font-bold text-white">Got it</div></div></div>}
            </div>
          </div>
          <dl className="space-y-2.5 text-sm">{[
            ['Title', f.title], ['Category', f.category], ['Audience', `${f.who === 'all' ? 'All students' : `${f.whoIds.length} ${f.who === 'courses' ? 'course' : f.who === 'students' ? 'student' : 'batch'}${f.whoIds.length === 1 ? '' : f.who === 'batches' ? 'es' : 's'}`} · ${reach(f).toLocaleString('en-IN')} students`],
            ['Display', `${DISPLAY[f.display].label}${f.display !== 'notification' ? ` · pop-up ${popupText(f).toLowerCase()}` : ''}`], ['Publish', publishAt ? fmtDateTime(+new Date(publishAt)) : 'Immediately'], ['Expires', expiresAt ? fmtDateTime(+new Date(expiresAt)) : 'Until removed'],
            ['Attachments', [...f.files, ...f.links].join(', ') || '—'],
          ].map(([k, v]) => <div key={k} className="grid grid-cols-[96px_minmax(0,1fr)] gap-2"><dt className="text-muted">{k}</dt><dd className="break-words font-medium">{v}</dd></div>)}</dl>
        </div>}
      </div>
    </Dialog>
  );
}
