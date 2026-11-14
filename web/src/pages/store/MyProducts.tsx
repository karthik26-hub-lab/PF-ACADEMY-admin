// My Store · Products: list, actions and the five-step "Create product" wizard.
import { Archive, Copy, Eye, MoreHorizontal, Pencil, Plus, Send, Undo2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger, Field, Input, Segmented, Select, Switch, Table, Td, Th, Textarea, btn } from '../../components/ui';
import { MY_TYPE, myPrice, useShop, type MyProduct, type MyType, type ProductStatus } from '../../lib/shop';
import { COURSES, SUBJECTS, inr, useStore, type Course } from '../../lib/store';
import { cn, fmtDate } from '../../lib/utils';
import { CHAPTERS } from '../../lib/syllabus';
import { CourseToggle, Cover, type CourseFilter } from './shared';

const STATUS: Record<ProductStatus, { label: string; tone: 'pop' | 'neutral' | 'warn' | 'ink' }> = { published: { label: 'Published', tone: 'pop' }, draft: { label: 'Draft', tone: 'neutral' }, scheduled: { label: 'Scheduled', tone: 'warn' }, unpublished: { label: 'Unpublished', tone: 'neutral' }, archived: { label: 'Archived', tone: 'ink' } };
export const ProductStatusBadge = ({ s }: { s: ProductStatus }) => <Badge tone={STATUS[s].tone}>{STATUS[s].label}</Badge>;

export function MyProducts({ onUpgrade }: { onUpgrade: () => void }) {
  const { mine, addon, setStatus, duplicate } = useShop();
  const [filter, setFilter] = useState<'all' | ProductStatus>('all'), [c, setC] = useState<CourseFilter>('all');
  const inCourse = mine.filter((p) => c === 'all' || p.course === c);
  const [edit, setEdit] = useState<MyProduct | 'new' | null>(null);
  const [preview, setPreview] = useState<MyProduct | null>(null);
  const shown = inCourse.filter((p) => filter === 'all' || p.status === filter);
  const publish = (p: MyProduct) => (addon ? (setStatus(p.id, 'published'), toast.success('Published')) : onUpgrade());
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CourseToggle value={c} onChange={setC} />
        <Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All', count: inCourse.length }, ...(Object.keys(STATUS) as ProductStatus[]).map((s) => ({ value: s, label: STATUS[s].label, count: inCourse.filter((p) => p.status === s).length }))]} />
        <Button variant="primary" className="sm:ml-auto" onClick={() => setEdit('new')}><Plus /> Create product</Button>
      </div>
      <Table>
        <thead><tr><Th>Product</Th><Th>Type</Th><Th className="text-right">Price</Th><Th>Status</Th><Th>Updated</Th><Th /></tr></thead>
        <tbody>{shown.map((p) => (
          <tr key={p.id}>
            <Td><span className="flex items-center gap-3"><Cover type={p.type} label="" className="h-10 w-8 p-1.5 [&_svg]:size-3" /><span className="min-w-0"><span className="block truncate font-semibold">{p.title}</span><span className="text-2xs text-muted">{p.code} · {p.subject}</span></span></span></Td>
            <Td className="text-xs">{MY_TYPE[p.type]}</Td><Td className="tnum text-right font-semibold">{p.free ? 'Free' : inr(myPrice(p))}</Td><Td><ProductStatusBadge s={p.status} /></Td><Td className="text-xs text-muted">{fmtDate(p.updatedAt)}</Td>
            <Td className="w-10"><DropdownMenu><DropdownTrigger className={btn('ghost', 'icon', 'size-8')} aria-label="Actions"><MoreHorizontal /></DropdownTrigger>
              <DropdownContent>
                {p.type !== 'bundle' && <DropdownItem onSelect={() => setEdit(p)}><Pencil /> Edit</DropdownItem>}
                <DropdownItem onSelect={() => setPreview(p)}><Eye /> Preview</DropdownItem>
                {p.status === 'published' ? <DropdownItem onSelect={() => { setStatus(p.id, 'unpublished'); toast('Unpublished'); }}><Undo2 /> Unpublish</DropdownItem> : <DropdownItem onSelect={() => publish(p)}><Send /> Publish</DropdownItem>}
                <DropdownItem onSelect={() => { duplicate(p.id); toast.success('Copied as a draft'); }}><Copy /> Duplicate</DropdownItem>
                {p.status !== 'archived' && <DropdownItem onSelect={() => { setStatus(p.id, 'archived'); toast('Archived'); }}><Archive /> Archive</DropdownItem>}
              </DropdownContent></DropdownMenu></Td>
          </tr>
        ))}{!shown.length && <tr><Td colSpan={6} className="h-20 text-center text-muted">No products here.</Td></tr>}</tbody>
      </Table>
      {edit && <Wizard p={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onUpgrade={onUpgrade} />}
      {preview && <Dialog open onOpenChange={(v) => !v && setPreview(null)} title="Storefront preview" desc="How students see this product."><StoreCard p={preview} /></Dialog>}
    </>
  );
}

/** The product as a student sees it in the store. */
export const StoreCard = ({ p }: { p: Omit<MyProduct, 'id' | 'updatedAt'> }) => (
  <div className="mb-2 flex gap-4 rounded-2xl bg-subtle p-4">
    <Cover type={p.type} label={MY_TYPE[p.type]} className="h-32 w-24 shrink-0" />
    <div className="min-w-0 space-y-1 text-sm">
      <div className="text-base font-bold">{p.title || 'Untitled product'}</div>
      <div className="text-xs text-muted">{p.course} · {p.subject || 'No subject'} · {p.chapters.length ? p.chapters.join(', ') : 'All chapters'}</div>
      <p className="text-xs">{p.short}</p>
      <div className="flex items-baseline gap-2 pt-1">{p.free ? <b>Free</b> : <><b>{inr(p.discounted ?? p.price)}</b>{p.discounted != null && <s className="text-xs text-muted">{inr(p.price)}</s>}</>}</div>
      {p.limited && <div className="text-2xs text-warn">Only {p.stock} available</div>}
    </div>
  </div>
);

const STEPS = ['Basic information', 'Product content', 'Pricing & availability', 'Access & distribution', 'Review & publish'];
const blank = (): Omit<MyProduct, 'id' | 'updatedAt'> => ({ title: '', type: 'ebook', course: 'CA Inter', subject: '', chapters: [], short: '', detail: '', code: '', status: 'draft', content: {}, free: false, price: 199, limited: false, who: 'all', whoIds: [] });

function Wizard({ p, onClose, onUpgrade }: { p: MyProduct | null; onClose: () => void; onUpgrade: () => void }) {
  const { saveMine, addon } = useShop();
  const { exams } = useStore();
  const [f, setF] = useState(p ?? blank());
  const [step, setStep] = useState(0);
  const [when, setWhen] = useState('');
  const set = (x: Partial<typeof f>) => setF({ ...f, ...x });
  const c = (k: string) => f.content[k], setC = (k: string, v: string | boolean) => set({ content: { ...f.content, [k]: v } });
  const ok = [!!f.title.trim() && !!f.subject, true, f.free || f.price > 0, f.who === 'all' || f.whoIds.length > 0, true][step];
  const save = (status: ProductStatus) => {
    if ((status === 'published' || status === 'scheduled') && !addon) { saveMine({ ...f, status: 'draft', code: f.code || autoCode() }, p?.id); onClose(); return onUpgrade(); }
    saveMine({ ...f, title: f.title.trim(), code: f.code || autoCode(), status, publishAt: status === 'scheduled' ? when : undefined }, p?.id);
    toast.success({ draft: 'Saved as a draft', published: 'Published to your store', scheduled: `Scheduled for ${when}` }[status as 'draft']); onClose();
  };
  const autoCode = () => `${f.type.slice(0, 2).toUpperCase()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
  const text = (k: string, label: string, hint?: string, type = 'text') => <Field label={label} hint={hint}><Input type={type} value={String(c(k) ?? '')} onChange={(e) => setC(k, e.target.value)} /></Field>;
  const toggle = (k: string, label: string) => <Toggle label={label} on={!!c(k)} set={(v) => setC(k, v)} />;
  const content: Record<Exclude<MyType, 'bundle'>, ReactNode> = {
    ebook: <>
      <Field label="Upload PDF"><Input type="file" accept=".pdf" /></Field>
      <Field label="Preview / sample" hint="Up to 3 images, or a PDF."><Input type="file" accept="image/*,.pdf" multiple /></Field>
      {text('version', 'Version / edition')}{text('access', 'Access duration (days)', 'Leave empty for no limit.', 'number')}
      {toggle('download', 'Allow download')}{c('download') ? text('maxDownloads', 'Maximum downloads', 'Optional', 'number') : <span />}
      {toggle('watermark', "Watermark with the buyer's name")}<span />
      <Field label="Content description" className="sm:col-span-2"><Textarea value={String(c('about') ?? '')} onChange={(e) => setC('about', e.target.value)} /></Field>
      <p className="text-2xs text-muted sm:col-span-2">The cover image is the first page of the PDF unless you upload one in step 1.</p>
    </>,
    tests: <>
      <Field label="Select existing tests" hint="Or add a new test in Assessments." className="sm:col-span-2"><div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{exams.slice(0, 24).map((e) => {
        const ids = String(c('tests') ?? '').split('|').filter(Boolean), on = ids.includes(e.id);
        return <button key={e.id} type="button" onClick={() => setC('tests', (on ? ids.filter((x) => x !== e.id) : [...ids, e.id]).join('|'))} className={cn('rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset', on ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong')}>{e.title}</button>;
      })}</div></Field>
      {text('series', 'Test series name')}{text('marks', 'Total marks', undefined, 'number')}{text('duration', 'Duration (minutes)', undefined, 'number')}<span />
      {text('start', 'Start date', 'Leave both dates empty for an unscheduled test.', 'date')}{text('end', 'End date', undefined, 'date')}
      <p className="text-2xs text-muted sm:col-span-2">Students see this as <b>{c('start') ? 'Scheduled' : 'Unscheduled: write and upload any time'}</b> before buying. A single test can be sold on its own.</p>
      <Field label="Result visibility"><Select value={String(c('results') ?? 'after-review')} onChange={(e) => setC('results', e.target.value)}><option value="instant">Straight after evaluation</option><option value="after-review">After faculty review</option><option value="end">After the end date</option></Select></Field>
      <Field label="Answer key"><Select value={String(c('key') ?? 'after')} onChange={(e) => setC('key', e.target.value)}><option value="after">After submitting</option><option value="end">After the end date</option><option value="never">Not shown</option></Select></Field>
    </>,
    qbank: <>
      {text('bank', 'Question bank name')}<Field label="Bulk upload questions" hint="Excel, using the question bank template."><Input type="file" accept=".xlsx,.csv" /></Field>
      <Field label="Mode"><Select value={String(c('mode') ?? 'practice')} onChange={(e) => setC('mode', e.target.value)}><option value="practice">Practice mode</option><option value="timed">Timed mode</option></Select></Field>
      {text('validity', 'Validity period (days)', undefined, 'number')}
      <p className="text-2xs text-muted sm:col-span-2">For descriptive questions, students cannot upload answers; they can only view the model answers.</p>
    </>,
  };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={p ? 'Edit product' : 'Create product'} desc={`Step ${step + 1} of 5 · ${STEPS[step]}`}
      footer={<>
        {step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}<span className="mr-auto" />
        {step < 4 ? <Button variant="primary" disabled={!ok} onClick={() => setStep(step + 1)}>Next</Button> : <>
          <Button onClick={() => save('draft')}>Save as draft</Button>
          <Input type="date" aria-label="Publish on" value={when} onChange={(e) => setWhen(e.target.value)} className="h-10 w-40" />
          <Button disabled={!when} onClick={() => save('scheduled')}>Schedule</Button>
          <Button variant="primary" onClick={() => save('published')}>Publish now</Button>
        </>}
      </>}>
      <ol className="mb-4 flex gap-1">{STEPS.map((s, i) => <li key={s} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-fg' : 'bg-subtle')} title={s} />)}</ol>
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        {step === 0 && <>
          <Field label="Product name" className="sm:col-span-2"><Input autoFocus value={f.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Product type"><Select value={f.type} onChange={(e) => set({ type: e.target.value as MyType, content: {} })} disabled={!!p}>{(['ebook', 'tests', 'qbank'] as const).map((t) => <option key={t} value={t}>{MY_TYPE[t]}</option>)}</Select></Field>
          <Field label="Course"><Select value={f.course} onChange={(e) => set({ course: e.target.value as Course })}>{COURSES.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Subject" hint="Subjects come from the Learning tab."><Select value={f.subject} onChange={(e) => set({ subject: e.target.value, chapters: [] })}><option value="">Choose</option>{SUBJECTS.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Chapters" className="sm:col-span-2" hint={!f.subject ? 'Choose a subject to see its chapters.' : f.chapters.length ? `${f.chapters.length} selected` : 'None selected means all chapters.'}>
            <div className="flex flex-wrap gap-1.5">{(CHAPTERS[f.subject] ?? []).map((ch) => {
              const on = f.chapters.includes(ch);
              return <button key={ch} type="button" onClick={() => set({ chapters: on ? f.chapters.filter((x) => x !== ch) : [...f.chapters, ch] })} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors', on ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg')}>{ch}</button>;
            })}</div>
          </Field>
          <Field label="Short description" className="sm:col-span-2"><Textarea value={f.short} onChange={(e) => set({ short: e.target.value })} /></Field>
          <Field label="Detailed description" optional className="sm:col-span-2"><Textarea value={f.detail} onChange={(e) => set({ detail: e.target.value })} className="min-h-28" /></Field>
          <Field label="Product thumbnail" optional><Input type="file" accept="image/*" /></Field>
          <Field label="Product code" hint="Leave empty to generate one."><Input value={f.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} /></Field>
        </>}
        {step === 1 && (f.type === 'bundle' ? <p className="text-sm text-muted">Bundles are edited in the Bundles tab.</p> : content[f.type])}
        {step === 2 && <>
          <Field label="Pricing model"><Segmented value={f.free ? 'free' : 'paid'} onChange={(v) => set({ free: v === 'free' })} options={[{ value: 'paid', label: 'Paid' }, { value: 'free', label: 'Free' }]} /></Field>
          {!f.free && <>
            <Field label="Selling price (₹)"><Input type="number" min={1} value={f.price} onChange={(e) => set({ price: +e.target.value })} /></Field>
            <Field label="Discounted price (₹)" optional><Input type="number" value={f.discounted ?? ''} onChange={(e) => set({ discounted: e.target.value ? +e.target.value : undefined })} /></Field>
          </>}
          <Field label="Product availability" hint="When the limit is reached, the product leaves the store until you set a new limit.">
            <div className="flex h-10 items-center gap-3"><Switch checked={f.limited} onCheckedChange={(v) => set({ limited: v })} label="Limited availability" /><span className="text-sm">{f.limited ? 'Limited' : 'Available'}</span>{f.limited && <Input type="number" min={1} aria-label="Limit" placeholder="Limit" value={f.stock ?? ''} onChange={(e) => set({ stock: +e.target.value })} className="w-28" />}</div>
          </Field>
          <Field label="Purchase limit per student" hint="Leave empty for unlimited."><Input type="number" value={f.perStudent ?? ''} onChange={(e) => set({ perStudent: e.target.value ? +e.target.value : undefined })} /></Field>
          <Field label="Sale starts" optional><Input type="date" value={f.saleFrom ?? ''} onChange={(e) => set({ saleFrom: e.target.value })} /></Field>
          <Field label="Sale ends" optional><Input type="date" value={f.saleTo ?? ''} onChange={(e) => set({ saleTo: e.target.value })} /></Field>
        </>}
        {step === 3 && <>
          <Audience label="Who can purchase?" allLabel="All students" who={f.who} ids={f.whoIds} onChange={(who, whoIds) => set({ who, whoIds })} />
          <p className="text-2xs text-muted sm:col-span-2">After purchase the student gets access in the Parallax Flow app straight away. Student groups arrive with the Learning phase.</p>
        </>}
        {step === 4 && <div className="sm:col-span-2"><StoreCard p={f} />
          <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">{[['Type', MY_TYPE[f.type]], ['Content', Object.entries(f.content).filter(([, v]) => v !== '' && v !== false).map(([k]) => k).join(', ') || '—'], ['Access', f.who === 'all' ? 'All students' : `${f.whoIds.length} ${f.who}`], ['Per student', f.perStudent ?? 'Unlimited'], ['Availability', f.limited ? `Limited to ${f.stock}` : 'Available'], ['Sale dates', f.saleFrom || f.saleTo ? `${f.saleFrom || '…'} to ${f.saleTo || '…'}` : 'Always']].map(([k, v]) => <div key={k as string} className="flex justify-between border-b border-border py-1"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        </div>}
      </div>
    </Dialog>
  );
}

export const Toggle = ({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) => (
  <label className="flex h-10 items-center gap-3 text-sm"><Switch checked={on} onCheckedChange={set} label={label} />{label}</label>
);

/** Who a product or bundle is for: selected courses, selected batches (all pre-selected, with filters), or everyone. */
type Who = MyProduct['who'] | 'students';
/** Pass `students` to also offer picking individual students (used by announcements). */
export function Audience<W extends Who>({ label, allLabel, who, ids, onChange, students }: { label: string; allLabel: string; who: W; ids: string[]; onChange: (who: W, ids: string[]) => void; students?: boolean }) {
  const active = useStore((s) => s.batches).filter((b) => b.status === 'active');
  const everyone = useStore((s) => s.students);
  const [sq, setSq] = useState('');
  const found = sq.trim().length < 2 ? [] : everyone.filter((s) => !ids.includes(s.id) && `${s.name} ${s.studentId}`.toLowerCase().includes(sq.toLowerCase())).slice(0, 8);
  const [bc, setBc] = useState<CourseFilter>('all'), [bq, setBq] = useState('');
  const shown = active.filter((b) => (bc === 'all' || b.course === bc) && b.name.toLowerCase().includes(bq.toLowerCase()));
  const chip = (id: string, text: string) => {
    const on = ids.includes(id);
    return <button key={id} type="button" onClick={() => onChange(who, on ? ids.filter((x) => x !== id) : [...ids, id])} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset', on ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong')}>{text}</button>;
  };
  return <>
    <Field label={label} className="sm:col-span-2"><Segmented value={who as Who} onChange={(v) => onChange(v as W, v === 'batches' ? active.map((b) => b.id) : [])} options={[{ value: 'courses', label: 'Selected courses' }, { value: 'batches', label: 'Selected batches' }, ...(students ? [{ value: 'students' as const, label: 'Specific students' }] : []), { value: 'all', label: allLabel }]} /></Field>
    {who === 'courses' && <div className="flex flex-wrap gap-1.5 sm:col-span-2">{COURSES.map((x) => chip(x, x))}</div>}
    {who === 'batches' && <div className="space-y-2 sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <CourseToggle value={bc} onChange={setBc} />
        <Input value={bq} onChange={(e) => setBq(e.target.value)} placeholder="Search batches" className="w-full sm:w-52" />
        <Button size="sm" variant="ghost" onClick={() => onChange(who, [...new Set([...ids, ...shown.map((b) => b.id)])])}>Select shown</Button>
        <Button size="sm" variant="ghost" onClick={() => onChange(who, ids.filter((id) => !shown.some((b) => b.id === id)))}>Clear shown</Button>
        <span className="ml-auto text-2xs text-muted">{ids.length} of {active.length} batches</span>
      </div>
      <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">{shown.map((b) => chip(b.id, b.name))}</div>
    </div>}
    {who === 'students' && <div className="space-y-2 sm:col-span-2">
      <div className="relative"><Input value={sq} onChange={(e) => setSq(e.target.value)} placeholder="Search a student by name or student ID" aria-label="Search students" />
        {found.length > 0 && <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-xl bg-panel p-1 shadow-float ring-1 ring-border">{found.map((s) => (
          <li key={s.id}><button type="button" onClick={() => { onChange(who, [...ids, s.id]); setSq(''); }} className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-subtle"><span className="truncate">{s.name}</span><span className="font-mono text-2xs text-faint">{s.studentId}</span></button></li>
        ))}</ul>}
      </div>
      <div className="flex flex-wrap gap-1.5">{ids.map((id) => { const s = everyone.find((x) => x.id === id); return s ? <span key={id} className="flex items-center gap-1 rounded-full bg-fg py-1 pl-3 pr-1 text-xs font-semibold text-bg">{s.name}<button type="button" aria-label={`Remove ${s.name}`} onClick={() => onChange(who, ids.filter((x) => x !== id))} className="grid size-5 place-items-center rounded-full hover:bg-bg/20">×</button></span> : null; })}
        {!ids.length && <span className="text-2xs text-muted">No students picked yet.</span>}</div>
    </div>}
  </>;
}
