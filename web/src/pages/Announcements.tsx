// Learning → Announcements: counts, then Announcement management (course toggle, status tabs, search, filters).
// Opening one shows its content, audience, schedule and who has read it.
import { Archive, ArchiveRestore, Ban, CalendarClock, ChevronRight, Copy, Megaphone, PenLine, Pencil, Plus, Radio, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AnnouncementWizard, CATEGORIES, DISPLAY, popupText, useReach } from '../components/AnnouncementWizard';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, Dialog, EmptyState, Input, Segmented, Select } from '../components/ui';
import { href } from '../lib/router';
import { annStatus, useStore, type AnnStatus, type Announcement } from '../lib/store';
import { cn, fmtDate, fmtDateTime } from '../lib/utils';
import { CourseToggle, type CourseFilter } from './store/shared';

export const ANN_STATUS: Record<AnnStatus, { label: string; tone: 'pop' | 'neutral' | 'warn' | 'ink' | 'bad' }> = {
  published: { label: 'Published', tone: 'pop' }, scheduled: { label: 'Scheduled', tone: 'warn' }, draft: { label: 'Draft', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'ink' }, withdrawn: { label: 'Withdrawn', tone: 'bad' }, archived: { label: 'Archived', tone: 'neutral' },
};
const TABS = [['all', 'All'], ['published', 'Published'], ['scheduled', 'Scheduled'], ['draft', 'Drafts'], ['expired', 'Expired'], ['archived', 'Archived']] as const;
type Tab = (typeof TABS)[number][0];
// Withdrawn ones end like expired ones, so they sit in the Expired tab.
const inTab = (st: AnnStatus, t: Tab) => t === 'all' ? st !== 'archived' : t === 'expired' ? st === 'expired' || st === 'withdrawn' : st === t;

/** "All students", "CA Inter", "CA Foundation · Jan 2027 · A +1"… */
export function useAudienceText() {
  const batches = useStore((s) => s.batches);
  const students = useStore((s) => s.students);
  return (a: Announcement) => a.who === 'all' ? 'All students' : a.who === 'courses' ? a.whoIds.join(', ')
    : a.who === 'students' ? `${students.find((s) => s.id === a.whoIds[0])?.name ?? 'Student'}${a.whoIds.length > 1 ? ` +${a.whoIds.length - 1}` : ''}`
    : `${batches.find((b) => b.id === a.whoIds[0])?.name ?? 'Batch'}${a.whoIds.length > 1 ? ` +${a.whoIds.length - 1}` : ''}`;
}

/** The list rows, shared by this page and a batch's Announcements tab. */
export function AnnouncementList({ list, onOpen }: { list: Announcement[]; onOpen: (a: Announcement) => void }) {
  const audience = useAudienceText();
  if (!list.length) return <EmptyState compact icon={Megaphone} title="No announcements here" />;
  return (
    <ul className="space-y-2">{list.map((a) => { const st = annStatus(a); return (
      <li key={a.id}><button type="button" onClick={() => onOpen(a)} className="flex w-full items-center gap-3 rounded-2xl bg-subtle p-4 text-left ring-1 ring-inset ring-border transition hover:bg-hover">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2"><span className="font-semibold">{a.title}</span><Badge tone={ANN_STATUS[st].tone}>{ANN_STATUS[st].label}</Badge></div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs"><span className="rounded-full bg-panel px-2 py-0.5 font-semibold ring-1 ring-border">{a.category}</span><span className="truncate text-muted">{audience(a)}</span></div>
          <div className="mt-1.5 text-2xs text-muted">{DISPLAY[a.display].label} · {a.publishAt ? fmtDate(a.publishAt) : st === 'draft' ? `Created ${fmtDate(a.createdAt)}` : fmtDate(a.createdAt)}{a.expiresAt && ` → ${fmtDate(a.expiresAt)}`}</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted" />
      </button></li>
    ); })}</ul>
  );
}

export function Announcements() {
  const { announcements, batches, students } = useStore();
  const [course, setCourse] = useState<CourseFilter>('all'), [tab, setTab] = useState<Tab>('all'), [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [fl, setFl] = useState({ category: 'all', batch: 'all', from: '', to: '', display: 'all' });
  const [open, setOpen] = useState<Announcement | null>(null), [wizard, setWizard] = useState<Announcement | 'new' | null>(null);
  const courseOf = useMemo(() => new Map(batches.map((b) => [b.id, b.course as string])), [batches]);
  const studentBatch = useMemo(() => new Map(students.map((s) => [s.id, s.batchId])), [students]);
  const reaches = (a: Announcement, c: string) => a.who === 'all' || (a.who === 'courses' ? a.whoIds.includes(c) : a.whoIds.some((id) => courseOf.get(a.who === 'students' ? studentBatch.get(id) ?? '' : id) === c));
  const statuses = announcements.map((a) => annStatus(a));
  const count = (s: AnnStatus) => statuses.filter((x) => x === s).length;
  const shown = announcements.filter((a, i) => {
    const day = (a.publishAt ?? new Date(a.createdAt).toISOString()).slice(0, 10);
    return inTab(statuses[i], tab) && (course === 'all' || reaches(a, course)) && `${a.title} ${a.description}`.toLowerCase().includes(q.toLowerCase())
      && (fl.category === 'all' || a.category === fl.category) && (fl.display === 'all' || a.display === fl.display)
      && (fl.batch === 'all' || a.who === 'all' || a.whoIds.includes(fl.batch) || a.whoIds.includes(courseOf.get(fl.batch) ?? ''))
      && (!fl.from || day >= fl.from) && (!fl.to || day <= fl.to);
  });
  const filtered = Object.entries(fl).some(([k, v]) => (k === 'from' || k === 'to' ? !!v : v !== 'all'));
  const tiles = [[Megaphone, announcements.length, 'Total announcements', 'All time', 'text-[hsl(212_85%_50%)]'], [Radio, count('published'), 'Published', 'Currently active', 'text-good'], [CalendarClock, count('scheduled'), 'Scheduled', 'Upcoming', 'text-warn'], [PenLine, count('draft'), 'Drafts', 'Unpublished', 'text-[hsl(270_60%_55%)]']] as const;

  return (
    <Page crumbs={[{ label: 'Learning', href: href({ page: 'learning' }) }, { label: 'Announcements' }]} actions={<Button variant="primary" onClick={() => setWizard('new')}><Plus /> Create new</Button>}>
      <div className="mb-5"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Announcements</h1><p className="text-sm text-muted">Manage your academy communications.</p></div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(([Icon, n, label, sub, tone]) => (
        <div key={label} className="rounded-2xl bg-panel p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <Icon className={cn('size-5', tone)} />
          <div className="tnum mt-2 text-[28px] font-bold leading-[1.1]">{n}</div>
          <div className="text-sm font-semibold">{label}</div><div className="text-2xs text-muted">{sub}</div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full bg-fg" style={{ width: `${(n / Math.max(1, announcements.length)) * 100}%` }} /></div>
        </div>
      ))}</div>

      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="mr-auto text-base font-semibold">Announcement management</h2><CourseToggle value={course} onChange={setCourse} /></div>
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">{TABS.map(([k, l]) => { const n = statuses.filter((s) => inTab(s, k)).length; return (
          <button key={k} type="button" onClick={() => setTab(k)} className={cn('h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold ring-1 ring-inset transition-colors', tab === k ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg')}>{l} <span className="tnum opacity-60">{n}</span></button>
        ); })}</div>
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search announcements…" className="pl-10" aria-label="Search announcements" /></div>
          <Button variant={showFilters || filtered ? 'primary' : 'secondary'} onClick={() => setShowFilters(!showFilters)} aria-label="Filters"><SlidersHorizontal /> Filters</Button>
        </div>
        {showFilters && (
          <div className="mb-3 grid gap-2 rounded-2xl bg-subtle p-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select aria-label="Category" value={fl.category} onChange={(e) => setFl({ ...fl, category: e.target.value })}><option value="all">Any category</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
            <Select aria-label="Audience" value={fl.batch} onChange={(e) => setFl({ ...fl, batch: e.target.value })}><option value="all">Any audience</option>{batches.filter((b) => b.status === 'active').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
            <Input type="date" aria-label="From date" value={fl.from} onChange={(e) => setFl({ ...fl, from: e.target.value })} />
            <Input type="date" aria-label="To date" value={fl.to} onChange={(e) => setFl({ ...fl, to: e.target.value })} />
            <div className="flex gap-2"><Select aria-label="Display mode" value={fl.display} onChange={(e) => setFl({ ...fl, display: e.target.value })} className="flex-1"><option value="all">Any display</option>{Object.entries(DISPLAY).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}</Select>
              {filtered && <Button size="icon" variant="ghost" aria-label="Clear filters" onClick={() => setFl({ category: 'all', batch: 'all', from: '', to: '', display: 'all' })}><X /></Button>}</div>
          </div>
        )}
        <AnnouncementList list={shown} onOpen={setOpen} />
      </Card>
      <p className="mt-3 text-2xs text-faint">Published announcements move to Expired on their end date. Archived ones stay under Archived instead of being deleted.</p>

      {open && <AnnouncementDetail a={announcements.find((x) => x.id === open.id) ?? open} onClose={() => setOpen(null)} onEdit={(a) => { setOpen(null); setWizard(a); }} />}
      {wizard && <AnnouncementWizard edit={wizard === 'new' ? null : wizard} onClose={() => setWizard(null)} />}
    </Page>
  );
}

/** One announcement: content, delivery settings, actions, and who has read it (sample read data). */
export function AnnouncementDetail({ a, onClose, onEdit }: { a: Announcement; onClose: () => void; onEdit: (a: Announcement) => void }) {
  const { students, batches, setAnnState, saveAnnouncement } = useStore();
  const reach = useReach(), audience = useAudienceText();
  const [who, setWho] = useState<'seen' | 'not'>('seen');
  const st = annStatus(a), total = reach(a), seen = Math.min(a.reads, total);
  const course = new Map(batches.map((b) => [b.id, b.course as string]));
  const pool = students.filter((s) => a.who === 'all' || (a.who === 'students' ? a.whoIds.includes(s.id) : a.who === 'batches' ? a.whoIds.includes(s.batchId) : a.whoIds.includes(course.get(s.batchId) ?? '')));
  const people = who === 'seen' ? pool.slice(0, seen) : pool.slice(seen);
  const act = (state: Announcement['state'], msg: string) => { setAnnState(a.id, state); toast(msg); onClose(); };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={a.title} desc={`${a.category} · ${audience(a)}`}
      footer={<>
        {st === 'archived' ? <Button onClick={() => act('draft', 'Restored as a draft')}><ArchiveRestore /> Restore</Button> : <Button onClick={() => act('archived', 'Archived')}><Archive /> Archive</Button>}
        {(st === 'published' || st === 'scheduled') && <Button onClick={() => act('withdrawn', 'Withdrawn: students no longer see it')}><Ban /> Withdraw</Button>}
        <Button onClick={() => { const { id: _i, createdAt: _c, reads: _r, ...copy } = a; saveAnnouncement({ ...copy, title: `${a.title} (copy)`, state: 'draft', publishAt: undefined, expiresAt: undefined }); toast.success('Copied as a draft'); onClose(); }}><Copy /> Duplicate</Button>
        {st !== 'archived' && st !== 'expired' && st !== 'withdrawn' && <Button variant="primary" onClick={() => onEdit(a)}><Pencil /> Edit</Button>}
      </>}>
      <div className="space-y-5 pb-2">
        <div className="flex flex-wrap items-center gap-2"><Badge tone={ANN_STATUS[st].tone}>{ANN_STATUS[st].label}</Badge><span className="text-xs text-muted">{DISPLAY[a.display].label}{a.display !== 'notification' && ` · pop-up ${popupText(a).toLowerCase()}`}</span></div>
        {a.description && <p className="whitespace-pre-line text-sm">{a.description}</p>}
        {(a.files.length > 0 || a.links.length > 0) && <div className="flex flex-wrap gap-1.5">{[...a.files, ...a.links].map((x) => <span key={x} className="rounded-full bg-subtle px-3 py-1 text-xs ring-1 ring-inset ring-border">{x}</span>)}</div>}
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">{[['Publish', a.publishAt ? fmtDateTime(+new Date(a.publishAt)) : st === 'draft' ? 'Not published' : fmtDateTime(a.createdAt)], ['Expires', a.expiresAt ? fmtDateTime(+new Date(a.expiresAt)) : 'Until removed'], ['Reaches', `${total.toLocaleString('en-IN')} students`]].map(([k, v]) => <div key={k}><dt className="text-2xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        {st !== 'draft' && st !== 'scheduled' && (
          <section className="rounded-2xl bg-subtle p-4">
            <div className="flex items-baseline justify-between"><h4 className="text-sm font-semibold">Read by students</h4><span className="tnum text-sm"><b>{seen.toLocaleString('en-IN')}</b> of {total.toLocaleString('en-IN')} · {total ? Math.round((seen / total) * 100) : 0}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full hatch"><span className="block h-full rounded-full bg-fg" style={{ width: `${total ? (seen / total) * 100 : 0}%` }} /></div>
            <div className="mt-3 flex items-center gap-2"><Segmented value={who} onChange={setWho} options={[{ value: 'seen', label: 'Seen', count: seen }, { value: 'not', label: 'Not yet', count: total - seen }]} /></div>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">{people.slice(0, 50).map((s) => <li key={s.id} className="flex items-center gap-2 text-xs"><Avatar name={s.name} size="sm" /><span className="flex-1 truncate">{s.name}</span><span className="font-mono text-faint">{s.studentId}</span></li>)}
              {people.length > 50 && <li className="pt-1 text-2xs text-muted">and {(people.length - 50).toLocaleString('en-IN')} more</li>}</ul>
            <p className="mt-2 text-2xs text-faint">Sample read data. Real read receipts come from the student app.</p>
          </section>
        )}
      </div>
    </Dialog>
  );
}
