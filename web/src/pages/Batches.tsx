import { motion } from 'framer-motion';
import { Archive, ArchiveRestore, CalendarDays, ChevronRight, Layers, Megaphone, MoreHorizontal, Pencil, Plus, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Ring } from '../components/charts';
import { AnnouncementWizard } from '../components/AnnouncementWizard';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger, EmptyState, Field, Input, Segmented, Select, Tabs, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { SUBJECTS, examStatus, useStore, type Announcement, type Batch, type Member, type Student, type StudentStatus } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn, fmtDate } from '../lib/utils';
import { AnnouncementDetail, AnnouncementList } from './Announcements';
import { StudentTable } from './Students';

export function Batches() {
  const { batches, students, members, updateBatch, deleteBatch } = useStore();
  const open = useUI((u) => u.open);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [q, setQ] = useState('');
  const [course, setCourse] = useState('all');
  const [del, setDel] = useState<Batch | null>(null);
  const count = (id: string) => students.filter((s) => s.batchId === id).length;
  const shown = batches.filter((b) => b.status === tab && (course === 'all' || b.course === course) && (!q || b.name.toLowerCase().includes(q.toLowerCase())));

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Batches' }]}
      actions={<Button variant="primary" onClick={() => open('batch')}><Plus /> New batch</Button>}>
      <div className="mb-6"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Batches</h1><p className="text-sm text-muted">Create batches, see their strength, and archive the ones that have finished.</p></div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'active', label: 'Active', count: batches.filter((b) => b.status === 'active').length }, { value: 'archived', label: 'Archived', count: batches.filter((b) => b.status === 'archived').length }]} />
        <Segmented value={course} onChange={setCourse} options={[{ value: 'all', label: 'All courses' }, { value: 'CA Foundation', label: 'Foundation' }, { value: 'CA Inter', label: 'Inter' }, { value: 'CA Final', label: 'Final' }]} />
        <div className="relative ml-auto w-full sm:w-64"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search batches" className="pl-10" aria-label="Search batches" /></div>
      </div>
      {shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((b, i) => {
            const n = count(b.id);
            const fac = members.filter((m) => b.facultyIds.includes(m.id));
            return (
              <motion.div key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.03 }}>
                <div className="group relative flex h-full flex-col rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float dark:ring-white/[0.06]">
                  <a href={href({ page: 'batch', id: b.id })} className="absolute inset-0 rounded-2xl" aria-label={`Open ${b.name}`} />
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone={b.course === 'CA Foundation' ? 'pop' : b.course === 'CA Inter' ? 'ink' : 'neutral'}>{b.course}</Badge>
                    <DropdownMenu>
                      <DropdownTrigger className={btn('ghost', 'icon', 'relative z-10 size-8')} aria-label={`Actions for ${b.name}`}><MoreHorizontal /></DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onSelect={() => open('batch', b.id)}><Pencil /> Edit</DropdownItem>
                        <DropdownItem onSelect={() => open('student', b.id)}><UserPlus /> Add students</DropdownItem>
                        {b.status === 'active'
                          ? <DropdownItem onSelect={() => { updateBatch(b.id, { status: 'archived' }); toast('Batch archived'); }}><Archive /> Archive</DropdownItem>
                          : <DropdownItem onSelect={() => { updateBatch(b.id, { status: 'active' }); toast('Batch restored'); }}><ArchiveRestore /> Restore</DropdownItem>}
                        <DropdownSeparator />
                        <DropdownItem danger onSelect={() => setDel(b)}><Trash2 /> Delete</DropdownItem>
                      </DropdownContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 text-base font-bold tracking-tight">{b.name}</div>
                  <button type="button" onClick={() => { useUI.setState({ calendarBatch: b.id }); navigate({ page: 'calendar' }); }} className="relative z-10 mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted hover:text-fg"><CalendarDays className="size-3" /> View schedule</button>
                  <div className="mt-5 flex items-end justify-between">
                    <div><div className="tnum text-[28px] font-bold leading-none">{n}</div><div className="mt-1 text-2xs text-muted">students</div></div>
                    <div className="flex -space-x-2">{fac.slice(0, 3).map((m) => <Avatar key={m.id} name={m.name} className="ring-2 ring-panel" />)}</div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full hatch"><motion.div className="h-full rounded-full bg-fg" initial={{ width: 0 }} animate={{ width: `${Math.min(100, n)}%` }} transition={{ duration: 0.8 }} /></div>
                  <div className="mt-1.5 flex justify-between text-2xs text-faint"><span>Since {fmtDate(b.startDate)}</span><span>{Math.min(100, n)}% of 100 seats</span></div>
                </div>
              </motion.div>
            );
          })}
          {tab === 'active' && (
            <button onClick={() => open('batch')} className="grid min-h-[220px] place-items-center rounded-2xl border-2 border-dashed border-border-strong text-sm font-semibold text-muted transition hover:border-fg/40 hover:text-fg">
              <span className="flex flex-col items-center gap-2"><Plus className="size-5" /> New batch</span>
            </button>
          )}
        </div>
      ) : (
        <Card><EmptyState icon={Layers} title={batches.length ? 'No batches match' : 'No batches yet'} action={<Button variant="primary" onClick={() => open('batch')}><Plus /> New batch</Button>}>For example “CA Inter · May 2027 · Batch A”.</EmptyState></Card>
      )}
      <Dialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this batch?" desc={del ? `“${del.name}” and its ${count(del.id)} students will be removed. Archive it instead to keep their records.` : ''}
        footer={<><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (del) { deleteBatch(del.id); toast('Batch deleted'); } setDel(null); }}>Delete batch</Button></>} />
    </Page>
  );
}

/** Mon–Sun week start (local) for grouping the schedule. */
const weekStart = (iso: string) => { const d = new Date(`${iso}T00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
const dayLabel = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const BANDS = [0, 40, 50, 60, 70, 80];
const bandOf = (v: number) => BANDS.reduce((a, lo, i) => (v >= lo ? i : a), 0);
const bandLabel = (i: number) => (i === BANDS.length - 1 ? `${BANDS[i]}+` : `${BANDS[i]}–${BANDS[i + 1] - 1}`);

export function BatchDetail({ id }: { id: string }) {
  const s = useStore();
  const open = useUI((u) => u.open);
  const [tab, setTab] = useState<'students' | 'faculty' | 'schedule' | 'announcements'>('students');
  const [pop, setPop] = useState<'students' | 'faculty' | 'add-faculty' | null>(null);
  const [q, setQ] = useState(''), [status, setStatus] = useState<'all' | StudentStatus>('all'), [band, setBand] = useState<number | null>(null);
  const [ann, setAnn] = useState<Announcement | null>(null), [wizard, setWizard] = useState<Announcement | 'new' | null>(null);
  const b = s.batches.find((x) => x.id === id);
  if (!b) return <Page crumbs={[{ label: 'Batches', href: href({ page: 'batches' }) }, { label: 'Not found' }]}><Card><EmptyState icon={Layers} title="Batch not found" action={<a className={btn()} href={href({ page: 'batches' })}>All batches</a>} /></Card></Page>;
  const roster = s.students.filter((x) => x.batchId === id);
  const fac = s.members.filter((m) => b.facultyIds.includes(m.id));
  const scored = roster.filter((x) => x.trend.length);
  const avg = scored.length ? Math.round(scored.reduce((a, x) => a + (x.avgScore ?? 0), 0) / scored.length) : 0;
  const activeN = roster.filter((x) => x.status === 'active').length;
  const today = new Date().toISOString().slice(0, 10), weekEnd = new Date(weekStart(today).getTime() + 7 * 86400e3).toISOString().slice(0, 10);
  const upcoming = s.events.filter((e) => (e.batchId === id || !e.batchId) && e.date >= today).sort((x, y) => x.date.localeCompare(y.date));
  const thisWeek = upcoming.filter((e) => e.date < weekEnd);
  // Score bands come from the most recently conducted test of this batch; clicking a band filters the list below.
  const lastTest = s.exams.filter((e) => e.batchIds.includes(id) && !e.draft && examStatus(e) === 'closed').sort((x, y) => +new Date(y.closesAt) - +new Date(x.closesAt))[0];
  const last = (x: Student) => x.trend[x.trend.length - 1];
  const bands = BANDS.map((_, i) => scored.filter((x) => bandOf(last(x)) === i).length), maxBand = Math.max(1, ...bands);
  const shown = roster.filter((x) => (status === 'all' || x.status === status) && (band === null || (x.trend.length > 0 && bandOf(last(x)) === band)) && `${x.name} ${x.studentId}`.toLowerCase().includes(q.toLowerCase()));
  const mine = s.announcements.filter((a) => a.who === 'batches' && a.whoIds.includes(id));
  const subjectIn = (m: Member) => m.batchSubjects?.[id] ?? m.subjects?.[0] ?? m.role;
  const removeFaculty = (m: Member) => { s.updateBatch(id, { facultyIds: b.facultyIds.filter((x) => x !== m.id) }); s.updateMember(m.id, { batchIds: m.batchIds.filter((x) => x !== id) }); toast(`${m.name} removed from this batch`); };
  const viewSchedule = () => { useUI.setState({ calendarBatch: id }); navigate({ page: 'calendar' }); };
  const weeks = [...new Set(upcoming.slice(0, 40).map((e) => weekStart(e.date).getTime()))].slice(0, 6);
  const tile = 'flex flex-col rounded-2xl bg-panel p-5 text-left ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-float dark:ring-white/[0.06]';

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Batches', href: href({ page: 'batches' }) }, { label: b.name }]}
      actions={<><Button onClick={() => open('batch', b.id)}><Pencil /> Edit</Button><Button onClick={() => open('student', b.id)}><UserPlus /> Add students</Button></>}>
      <div className="mb-6">
        <div className="mb-2 flex gap-2"><Badge tone="ink">{b.course}</Badge><Badge tone={b.status === 'active' ? 'pop' : 'neutral'}>{b.status === 'active' ? 'Active' : 'Archived'}</Badge></div>
        <h1 className="text-[28px] font-bold tracking-[-0.03em]">{b.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted"><span>Since {fmtDate(b.startDate)}{b.endDate && ` · ends ${fmtDate(b.endDate)}`}</span><button type="button" onClick={viewSchedule} className="flex items-center gap-1 font-semibold text-fg underline-offset-2 hover:underline"><CalendarDays className="size-3.5" /> View schedule</button></div>
      </div>

      {/* Faculty, Students, Upcoming events, Avg score */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setPop('faculty')} className={tile}>
          <span className="flex items-center justify-between text-xs text-muted">Faculty<ChevronRight className="size-3.5" /></span>
          <span className="tnum mt-1 text-2xl font-bold leading-tight">{fac.length}</span>
          <span className="mt-auto flex items-center pt-3"><span className="flex -space-x-2">{fac.slice(0, 4).map((m) => <Avatar key={m.id} name={m.name} src={m.photo} className="ring-2 ring-panel" />)}</span><span className="ml-2 truncate text-2xs text-muted">{[...new Set(fac.map(subjectIn))].slice(0, 2).join(', ')}</span></span>
        </motion.button>
        <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} onClick={() => setPop('students')} className={tile}>
          <span className="flex items-center justify-between text-xs text-muted">Students<ChevronRight className="size-3.5" /></span>
          <span className="mt-1 flex items-center justify-between"><span className="tnum text-2xl font-bold leading-tight">{roster.length}</span><Ring value={roster.length ? (activeN / roster.length) * 100 : 0} size={40} stroke={5} tone="pop" label="Active share" /></span>
          <span className="mt-auto pt-2 text-2xs text-muted">{activeN} active · {roster.length - activeN} inactive or suspended</span>
        </motion.button>
        <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onClick={viewSchedule} className={tile}>
          <span className="flex items-center justify-between text-xs text-muted">Upcoming this week<ChevronRight className="size-3.5" /></span>
          {thisWeek.length ? <ul className="mt-2 space-y-1.5">{thisWeek.slice(0, 3).map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-xs"><span className="tnum w-14 shrink-0 rounded-md bg-subtle px-1.5 py-0.5 text-center text-[10px] font-semibold">{dayLabel(e.date).split(',')[0]} {new Date(`${e.date}T00:00`).getDate()}</span><span className="truncate">{e.title}</span></li>
          ))}{thisWeek.length > 3 && <li className="text-2xs text-muted">+{thisWeek.length - 3} more</li>}</ul> : <span className="mt-2 text-xs text-muted">Nothing scheduled this week</span>}
        </motion.button>
        <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} onClick={() => navigate({ page: 'reports' })} className={tile}>
          <span className="flex items-center justify-between text-xs text-muted">Average score<ChevronRight className="size-3.5" /></span>
          <span className="mt-1 flex items-center justify-between"><span className="tnum text-2xl font-bold leading-tight">{avg}%</span><Ring value={avg} size={40} stroke={5} label="Average score" /></span>
          <span className="mt-auto pt-2 text-2xs text-muted">Open in Reports</span>
        </motion.button>
      </div>

      <Card>
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'students', label: 'Students', count: roster.length }, { value: 'faculty', label: 'Faculty', count: fac.length }, { value: 'schedule', label: 'Schedule' }, { value: 'announcements', label: 'Announcements', count: mine.length }]} />
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {tab === 'students' && (roster.length ? (
            <>
              <div className="p-5 pb-2">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><span className="text-xs font-semibold">Score bands · {lastTest ? `${lastTest.title}, ${fmtDate(lastTest.closesAt)}` : 'latest test'}</span><span className="text-2xs text-muted">Click a band to see those students</span></div>
                <div className="flex h-28 items-end gap-2">{bands.map((n, i) => (
                  <button key={i} type="button" onClick={() => setBand(band === i ? null : i)} className="group flex h-full flex-1 flex-col justify-end" aria-pressed={band === i} title={`${n} students scored ${bandLabel(i)}`}>
                    <span className="tnum mb-1 text-center text-2xs font-semibold">{n}</span>
                    <span className={cn('block rounded-xl transition-colors', band === i ? 'bg-pop' : band === null ? 'bg-fg group-hover:bg-fg/80' : 'bg-fg/25 group-hover:bg-fg/50')} style={{ height: `${Math.max(6, (n / maxBand) * 100)}%` }} />
                    <span className="mt-1 text-center text-2xs text-muted">{bandLabel(i)}</span>
                  </button>
                ))}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-5 py-3">
                <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or student ID" className="pl-10" aria-label="Search students in this batch" /></div>
                <Segmented value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }]} />
                {band !== null && <Button size="sm" variant="ghost" onClick={() => setBand(null)}><X /> Score {bandLabel(band)}</Button>}
                <span className="tnum ml-auto text-xs text-muted">{shown.length} shown</span>
              </div>
              <StudentTable key={`${q}${status}${band}`} students={shown} hideBatch />
            </>
          ) : <EmptyState icon={Users} title="No students in this batch" action={<Button variant="primary" onClick={() => open('student', b.id)}><UserPlus /> Add students</Button>} />)}

          {tab === 'faculty' && (
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between"><span className="text-xs text-muted">Faculty teaching this batch</span><Button size="icon" variant="secondary" className="size-8" aria-label="Add faculty to this batch" onClick={() => setPop('add-faculty')}><Plus /></Button></div>
              {fac.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fac.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-subtle p-4"><Avatar name={m.name} src={m.photo} size="lg" className="size-11 text-sm" />
                  <div className="min-w-0 flex-1"><div className="truncate font-bold">{m.name}</div><div className="truncate text-xs text-muted">{subjectIn(m)}</div></div>
                  <Button size="icon" variant="ghost" className="size-7" aria-label={`Remove ${m.name} from this batch`} onClick={() => removeFaculty(m)}><X /></Button></div>
              ))}</div> : <p className="text-sm text-muted">No faculty yet. Use + to add one.</p>}
            </div>
          )}

          {tab === 'schedule' && (
            <div className="space-y-5 p-5">
              <div className="flex justify-end"><Button size="sm" onClick={() => open('event')}><CalendarDays /> Add date</Button></div>
              {weeks.length ? weeks.map((w) => {
                const end = w + 7 * 86400e3, list = upcoming.filter((e) => weekStart(e.date).getTime() === w);
                const first = new Date(w), last7 = new Date(end - 86400e3), label = w === weekStart(today).getTime() ? 'This week' : w === weekStart(today).getTime() + 7 * 86400e3 ? 'Next week' : '';
                return (
                  <section key={w}>
                    <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-faint">{label && `${label} · `}{first.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {last7.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</h4>
                    <ul className="space-y-2">{list.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 rounded-xl bg-subtle px-3 py-2.5 text-sm"><span className="tnum w-24 shrink-0 text-xs font-semibold">{dayLabel(e.date)}</span><span className="flex-1 truncate">{e.title}</span><Badge tone={e.type === 'exam' ? 'ink' : e.type === 'holiday' ? 'pop' : 'neutral'}>{e.type}</Badge></li>
                    ))}</ul>
                  </section>
                );
              }) : <p className="text-sm text-muted">Nothing scheduled ahead.</p>}
            </div>
          )}

          {tab === 'announcements' && (
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between"><span className="text-xs text-muted">Announcements sent to this batch</span><Button size="sm" variant="primary" onClick={() => setWizard('new')}><Megaphone /> New announcement</Button></div>
              <AnnouncementList list={mine} onOpen={setAnn} />
            </div>
          )}
        </motion.div>
      </Card>
      <p className="mt-3 text-2xs text-faint">Batch ID {b.id}</p>

      {pop === 'students' && <Dialog wide open onOpenChange={(v) => !v && setPop(null)} title={`Students · ${b.name}`} desc={`${roster.length} students`}><div className="-mx-5 pb-2"><StudentTable students={roster} hideBatch /></div></Dialog>}
      {pop === 'faculty' && (
        <Dialog open onOpenChange={(v) => !v && setPop(null)} title={`Faculty · ${b.name}`} desc={`${fac.length} teaching this batch`}>
          <ul className="space-y-2 pb-2">{fac.map((m) => <li key={m.id} className="flex items-center gap-3"><Avatar name={m.name} src={m.photo} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{m.name}</span><span className="block truncate text-2xs text-muted">{subjectIn(m)} · {m.email}</span></span><Badge>{m.role}</Badge></li>)}</ul>
        </Dialog>
      )}
      {pop === 'add-faculty' && <AddFacultyToBatch batchId={id} onClose={() => setPop(null)} />}
      {ann && <AnnouncementDetail a={s.announcements.find((x) => x.id === ann.id) ?? ann} onClose={() => setAnn(null)} onEdit={(a) => { setAnn(null); setWizard(a); }} />}
      {wizard && <AnnouncementWizard edit={wizard === 'new' ? null : wizard} batchId={id} onClose={() => setWizard(null)} />}
    </Page>
  );
}

/** Pick a faculty member, then the subject they'll teach in this batch, then Add. */
function AddFacultyToBatch({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  const { members, batches, updateMember, updateBatch } = useStore();
  const b = batches.find((x) => x.id === batchId)!;
  const [pick, setPick] = useState(''), [subject, setSubject] = useState(''), [q, setQ] = useState('');
  const pool = members.filter((m) => !b.facultyIds.includes(m.id) && m.status !== 'suspended' && `${m.name} ${(m.subjects || []).join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  const m = members.find((x) => x.id === pick);
  const add = () => {
    if (!m || !subject) return;
    updateMember(m.id, { batchIds: [...new Set([...m.batchIds, batchId])], batchSubjects: { ...m.batchSubjects, [batchId]: subject }, subjects: [...new Set([...(m.subjects ?? []), subject])] });
    updateBatch(batchId, { facultyIds: [...b.facultyIds, m.id] });
    toast.success(`${m.name} added for ${subject}`); onClose();
  };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title="Add faculty to this batch" desc={b.name}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!m || !subject} onClick={add}><Plus /> Add</Button></>}>
      <div className="space-y-4 pb-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search faculty or subject" aria-label="Search faculty" />
        <ul className="max-h-60 space-y-1 overflow-y-auto">{pool.map((x) => (
          <li key={x.id}><button type="button" onClick={() => { setPick(x.id); setSubject(x.subjects?.[0] ?? SUBJECTS[0]); }} className={cn('flex w-full items-center gap-3 rounded-xl p-2.5 text-left ring-1 ring-inset transition', pick === x.id ? 'bg-panel ring-2 ring-fg' : 'ring-transparent hover:bg-subtle')}>
            <Avatar name={x.name} src={x.photo} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{x.name}</span><span className="block truncate text-2xs text-muted">{(x.subjects || []).join(', ') || 'No subjects yet'}</span></span><Badge>{x.role}</Badge>
          </button></li>
        ))}{!pool.length && <li className="p-3 text-center text-xs text-muted">Everyone is already in this batch.</li>}</ul>
        {m && <Field label={`Subject ${m.name} will teach here`}><Select value={subject} onChange={(e) => setSubject(e.target.value)}>{[...new Set([...(m.subjects ?? []), ...SUBJECTS])].map((x) => <option key={x}>{x}</option>)}</Select></Field>}
      </div>
    </Dialog>
  );
}
