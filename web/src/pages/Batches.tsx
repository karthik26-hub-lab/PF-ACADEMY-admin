import { motion } from 'framer-motion';
import { Archive, ArchiveRestore, ArrowUpRight, BookOpen, CalendarDays, Layers, Megaphone, MoreHorizontal, Plus, Search, Send, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { HatchedBars, Ring } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Avatar, Badge, Button, Card, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger, EmptyState, Input, Segmented, Tabs, Textarea, btn } from '../components/ui';
import { href } from '../lib/router';
import { useStore, type Batch } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn, fmtDate, timeAgo } from '../lib/utils';
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
                <div className="group relative flex h-full flex-col rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-pop dark:ring-white/[0.06]">
                  <a href={href({ page: 'batch', id: b.id })} className="absolute inset-0 rounded-2xl" aria-label={`Open ${b.name}`} />
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone={b.course === 'CA Foundation' ? 'pop' : b.course === 'CA Inter' ? 'ink' : 'neutral'}>{b.course}</Badge>
                    <DropdownMenu>
                      <DropdownTrigger className={btn('ghost', 'icon', 'relative z-10 size-8')} aria-label={`Actions for ${b.name}`}><MoreHorizontal /></DropdownTrigger>
                      <DropdownContent>
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
                  <div className="mt-0.5 text-xs text-muted">{b.schedule || 'No schedule set'}</div>
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

export function BatchDetail({ id }: { id: string }) {
  const s = useStore();
  const open = useUI((u) => u.open);
  const [tab, setTab] = useState<'students' | 'courses' | 'faculty' | 'schedule' | 'announcements'>('students');
  const [msg, setMsg] = useState('');
  const b = s.batches.find((x) => x.id === id);
  if (!b) return <Page crumbs={[{ label: 'Batches', href: href({ page: 'batches' }) }, { label: 'Not found' }]}><Card><EmptyState icon={Layers} title="Batch not found" action={<a className={btn()} href={href({ page: 'batches' })}>All batches</a>} /></Card></Page>;
  const roster = s.students.filter((x) => x.batchId === id);
  const fac = s.members.filter((m) => b.facultyIds.includes(m.id));
  const avg = roster.length ? Math.round(roster.reduce((a, x) => a + (x.avgScore ?? 0), 0) / roster.length) : 0;
  const paid = roster.filter((x) => x.fee === 'paid').length;
  const events = s.events.filter((e) => e.batchId === id || !e.batchId).filter((e) => e.date >= new Date().toISOString().slice(0, 10)).sort((a, c) => a.date.localeCompare(c.date)).slice(0, 10);
  const course = s.courses.find((c) => c.name === b.course);
  const bands = [0, 40, 50, 60, 70, 80].map((lo, i, arr) => ({ label: i === arr.length - 1 ? `${lo}+` : `${lo}–${arr[i + 1] - 1}`, value: roster.filter((x) => (x.avgScore ?? -1) >= lo && (x.avgScore ?? -1) < (arr[i + 1] ?? 101)).length }));

  return (
    <Page crumbs={[{ label: 'Academics', href: href({ page: 'academics' }) }, { label: 'Batches', href: href({ page: 'batches' }) }, { label: b.name }]}
      actions={<><Button onClick={() => open('student', b.id)}><UserPlus /> Add students</Button></>}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><div className="mb-2 flex gap-2"><Badge tone="ink">{b.course}</Badge><Badge tone={b.status === 'active' ? 'pop' : 'neutral'}>{b.status === 'active' ? 'Active' : 'Archived'}</Badge></div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em]">{b.name}</h1><p className="text-sm text-muted">{b.schedule || 'No schedule'} · since {fmtDate(b.startDate)}</p></div>
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[['Students', roster.length, <Users key="u" className="size-4" />], ['Faculty', fac.length, <Users key="f" className="size-4" />], ['Average score', `${avg}%`, <Ring key="r" value={avg} size={40} stroke={4} />], ['Fees fully paid', `${paid}/${roster.length}`, <Ring key="p" value={roster.length ? (paid / roster.length) * 100 : 0} size={40} stroke={4} tone="pop" />]].map(([l, v, ic], i) => (
          <motion.div key={l as string} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <div><div className="text-xs text-muted">{l}</div><div className="tnum mt-1 text-2xl font-bold tracking-tight">{v}</div></div>{ic}
          </motion.div>
        ))}
      </div>
      <Card>
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'students', label: 'Students', count: roster.length }, { value: 'courses', label: 'Assigned courses' }, { value: 'faculty', label: 'Faculty', count: fac.length }, { value: 'schedule', label: 'Schedule' }, { value: 'announcements', label: 'Announcements', count: b.announcements.length }]} />
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {tab === 'students' && (roster.length ? (
            <>
              <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div><div className="mb-2 text-xs font-semibold">Score bands</div><HatchedBars data={bands} height={120} /></div>
                <div className="rounded-2xl bg-subtle p-4 text-xs text-muted">This is the same student record as in the central directory. Changing a student’s batch, status or fee here updates it everywhere.</div>
              </div>
              <StudentTable students={roster} hideBatch />
            </>
          ) : <EmptyState icon={Users} title="No students in this batch" action={<Button variant="primary" onClick={() => open('student', b.id)}><UserPlus /> Add students</Button>} />)}
          {tab === 'courses' && (
            <div className="p-5">{course ? (
              <a href={href({ page: 'learning' })} className="flex items-center gap-4 rounded-2xl bg-subtle p-4 transition hover:bg-hover">
                <span className="grid size-11 place-items-center rounded-full bg-panel"><BookOpen className="size-5" /></span>
                <span className="flex-1"><span className="block font-bold">{course.name}</span><span className="text-xs text-muted">{course.subjects} subjects · {course.materials} materials</span></span>
                <ArrowUpRight className="size-4" />
              </a>) : <p className="text-sm text-muted">No course assigned. Courses are set up in Learning (next phase).</p>}
            </div>
          )}
          {tab === 'faculty' && (
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {fac.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-subtle p-4"><Avatar name={m.name} size="lg" className="size-11 text-sm" /><div className="min-w-0"><div className="truncate font-bold">{m.name}</div><div className="truncate text-xs text-muted">{(m.subjects || []).join(', ') || m.role}</div></div></div>
              ))}
              <a href={href({ page: 'faculty' })} className="grid place-items-center rounded-2xl border-2 border-dashed border-border-strong p-4 text-sm font-semibold text-muted hover:text-fg">Assign faculty</a>
            </div>
          )}
          {tab === 'schedule' && (
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between"><div className="text-sm"><span className="text-muted">Regular classes: </span><b>{b.schedule || 'Not set'}</b></div><Button size="sm" onClick={() => open('event')}><CalendarDays /> Add date</Button></div>
              <ul className="space-y-2">{events.map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-xl bg-subtle px-3 py-2.5 text-sm"><span className="tnum w-24 shrink-0 text-xs font-semibold">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}</span><span className="flex-1 truncate">{e.title}</span><Badge tone={e.type === 'exam' ? 'ink' : e.type === 'holiday' ? 'pop' : 'neutral'}>{e.type}</Badge></li>
              ))}</ul>
            </div>
          )}
          {tab === 'announcements' && (
            <div className="space-y-4 p-5">
              <form onSubmit={(e) => { e.preventDefault(); if (!msg.trim()) return; s.announce(b.id, msg.trim()); setMsg(''); toast.success('Announcement sent to the batch'); }} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Textarea aria-label="Announcement" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`Write to everyone in ${b.name}`} className="min-h-12 flex-1" />
                <Button type="submit" variant="primary" disabled={!msg.trim()}><Send /> Send</Button>
              </form>
              {b.announcements.length ? b.announcements.map((a) => (
                <div key={a.id} className="flex gap-3 rounded-2xl bg-subtle p-4"><Megaphone className="mt-0.5 size-4 shrink-0" /><div className="flex-1 text-sm">{a.text}</div><span className="text-2xs text-faint">{timeAgo(a.at)}</span></div>
              )) : <p className="text-sm text-muted">No announcements yet.</p>}
            </div>
          )}
        </motion.div>
      </Card>
      <p className={cn('mt-3 text-2xs text-faint')}>Batch ID {b.id}</p>
    </Page>
  );
}

