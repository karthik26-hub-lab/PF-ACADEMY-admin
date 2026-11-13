import { motion } from 'framer-motion';
import { ArrowUpRight, BarChart3, CalendarDays, CheckCheck, ClipboardCheck, FileQuestion, FolderOpen, GraduationCap, Inbox, Layers, LineChart, Megaphone, PenLine, Trophy, UserCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Donut, HatchedBars, Ring, Sparkline } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Avatar, Badge } from '../components/ui';
import { href, type Route } from '../lib/router';
import { examStatus, useStore } from '../lib/store';
import { cn } from '../lib/utils';

type Tile = { title: string; desc: string; icon: typeof Users; to?: Route; metric?: ReactNode; sub?: ReactNode; visual?: ReactNode; phase?: number };

function Hub({ title, desc, tiles, crumb }: { title: string; desc: string; tiles: Tile[]; crumb: string }) {
  return (
    <Page crumbs={[{ label: crumb }]}>
      <div className="mb-7">
        <h1 className="text-[30px] font-bold leading-tight tracking-[-0.03em]">{title}</h1>
        <p className="mt-1 text-sm text-muted">{desc}</p>
      </div>
      <div className={cn('grid gap-4 sm:grid-cols-2', tiles.length > 4 ? 'xl:grid-cols-3' : 'xl:grid-cols-4')}>
        {tiles.map((t, i) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-subtle ring-1 ring-border"><t.icon className="size-[18px]" /></span>
                {t.phase ? <Badge>Phase {t.phase}</Badge> : <span className="grid size-9 place-items-center rounded-full bg-subtle text-muted transition-all duration-300 group-hover:rotate-45 group-hover:bg-fg group-hover:text-bg"><ArrowUpRight className="size-4" /></span>}
              </div>
              <div className="mt-5">
                <div className="text-[15px] font-bold tracking-tight">{t.title}</div>
                <div className="mt-0.5 text-xs text-muted">{t.desc}</div>
              </div>
              {(t.metric !== undefined || t.visual) && (
                <div className="mt-5 flex flex-col gap-4">
                  {t.metric !== undefined && <div><div className="tnum text-[28px] font-bold leading-none tracking-tight">{t.metric}</div>{t.sub && <div className="mt-1.5 text-2xs text-muted">{t.sub}</div>}</div>}
                  {t.visual && <div className="min-w-0">{t.visual}</div>}
                </div>
              )}
            </>
          );
          const cls = 'group flex h-full flex-col rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] transition-[transform,box-shadow] duration-300 dark:ring-white/[0.06]';
          return (
            <motion.div key={t.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}>
              {t.to ? <a href={href(t.to)} className={cn(cls, 'hover:-translate-y-0.5 hover:shadow-float')}>{body}</a>
                : <div className={cn(cls, 'opacity-80')} title="Coming in a later phase">{body}</div>}
            </motion.div>
          );
        })}
      </div>
    </Page>
  );
}

const shortBatch = (n: string) => { const [c, m, sec] = n.split(' · '); const cc = c.includes('Foundation') ? 'Fdn' : c.includes('Inter') ? 'Int' : 'Fin'; return `${cc} ${sec || (m || '').slice(0, 3)}`; };

export function AcademicsHub() {
  const { batches, students, members, events } = useStore();
  const active = batches.filter((b) => b.status === 'active');
  const activeStudents = students.filter((s) => s.status === 'active').length;
  const per = active.slice(0, 7).map((b) => ({ label: shortBatch(b.name), value: students.filter((s) => s.batchId === b.id).length }));
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= todayIso).length;
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); const k = d.toISOString().slice(0, 10); return { d, n: events.filter((e) => e.date === k).length }; });
  return (
    <Hub crumb="Academics" title="Academics" desc="Batches, the student directory, faculty and the academic calendar." tiles={[
      { title: 'Batches', desc: `${active.length} active batches`, icon: Layers, to: { page: 'batches' }, metric: active.length, sub: `${batches.length - active.length} archived`, visual: per.length ? <HatchedBars data={per} height={70} /> : null },
      { title: 'Students', desc: `${students.length.toLocaleString('en-IN')} students`, icon: Users, to: { page: 'students' }, metric: students.length.toLocaleString('en-IN'), sub: `${activeStudents.toLocaleString('en-IN')} active`, visual: <div className="flex"><Ring value={students.length ? (activeStudents / students.length) * 100 : 0} size={64} stroke={7} tone="pop" label="Active students" /></div> },
      { title: 'Faculty', desc: `${members.length} faculty members`, icon: UserCheck, to: { page: 'faculty' }, metric: members.length, sub: 'Assigned to batches and subjects', visual: <div className="flex -space-x-2">{members.slice(0, 5).map((m) => <Avatar key={m.id} name={m.name} className="ring-2 ring-panel" />)}{members.length > 5 && <span className="grid size-8 place-items-center rounded-full bg-fg text-2xs font-bold text-bg ring-2 ring-panel">+{members.length - 5}</span>}</div> },
      { title: 'Academic calendar', desc: 'Schedules and events', icon: CalendarDays, to: { page: 'calendar' }, metric: upcoming, sub: 'Upcoming entries', visual: <div className="flex justify-between gap-1">{week.map(({ d, n }) => <div key={+d} className="flex w-6 flex-col items-center gap-1"><span className="text-[9px] text-faint">{d.toLocaleDateString('en-IN', { weekday: 'narrow' })}</span><span className={cn('grid size-6 place-items-center rounded-full text-[10px] font-bold', n ? 'bg-fg text-bg' : 'bg-subtle text-muted')}>{d.getDate()}</span></div>)}</div> },
    ]} />
  );
}

export function LearningHub() {
  const { courses } = useStore();
  const materials = courses.reduce((a, c) => a + c.materials, 0);
  return (
    <Hub crumb="Learning" title="Learning" desc="Courses, study materials and announcements for your students." tiles={[
      { title: 'Courses', desc: 'Create courses, subjects and chapters', icon: GraduationCap, phase: 2, metric: courses.length, sub: courses.map((c) => c.name).join(' · ') || 'No courses yet',
        visual: courses.length ? <div className="flex"><Donut size={84} thickness={12} center={<span className="text-sm">{materials}</span>} segments={courses.map((c, i) => ({ label: c.name, value: c.materials, tone: (['ink', 'pop', 'hatch'] as const)[i % 3] }))} /></div> : null },
      { title: 'Study materials', desc: 'Upload and organise resources, Drive-style', icon: FolderOpen, phase: 2, metric: materials, sub: 'PDFs, videos, notes and links' },
      { title: 'Announcements', desc: 'Learning notifications to batches or students', icon: Megaphone, phase: 2 },
    ]} />
  );
}

export function AssessmentsHub() {
  const { exams } = useStore();
  const st = exams.map((e) => examStatus(e));
  const count = (s: string) => st.filter((x) => x === s).length;
  const last = exams.filter((e) => e.received).slice(0, 10).map((e) => e.received).reverse();
  return (
    <Hub crumb="Assessments" title="Assessments" desc="Build tests, run them, and evaluate submissions with AI help." tiles={[
      { title: 'Create test', desc: 'Build a new examination', icon: PenLine, to: { page: 'exam-new' } },
      { title: 'Question bank', desc: 'Central database of questions', icon: FileQuestion, phase: 3 },
      { title: 'Scheduled tests', desc: 'Upcoming and live examinations', icon: CalendarDays, to: { page: 'exams' }, metric: count('scheduled') + count('live'), sub: `${count('live')} live · ${count('scheduled')} scheduled`,
        visual: <div className="flex"><Donut size={84} thickness={12} center={<span className="text-sm">{exams.length}</span>} segments={[{ label: 'Live', value: count('live'), tone: 'pop' }, { label: 'Scheduled', value: count('scheduled'), tone: 'ink' }, { label: 'Closed', value: count('closed'), tone: 'hatch' }]} /></div> },
      { title: 'Submissions', desc: 'Student answer submissions', icon: Inbox, to: { page: 'exams' }, metric: exams.reduce((a, e) => a + e.received, 0).toLocaleString('en-IN'), sub: 'Uploads across all tests', visual: last.length > 1 ? <Sparkline values={last} /> : null },
      { title: 'Evaluation', desc: 'AI-assisted marking and faculty review', icon: ClipboardCheck, to: { page: 'reviews' }, metric: exams.reduce((a, e) => a + Math.max(0, e.flagged - e.reviewed), 0), sub: 'Scripts waiting for review' },
      { title: 'Results', desc: 'Marks, rankings and downloads', icon: Trophy, phase: 3 },
    ]} />
  );
}

export function ReportsHub() {
  const { students } = useStore();
  const avg = students.length ? Math.round(students.reduce((a, s) => a + (s.avgScore ?? 0), 0) / students.length) : 0;
  return (
    <Hub crumb="Reports" title="Reports" desc="Performance, learning activity and attendance." tiles={[
      { title: 'Performance', desc: 'Marks and progress over time', icon: LineChart, phase: 4, metric: `${avg}%`, sub: 'Average score', visual: <Sparkline values={[58, 61, 60, 64, 63, 67, avg || 66]} /> },
      { title: 'Learning analytics', desc: 'Materials, chapters, MCQs, consistency', icon: BarChart3, phase: 4 },
      { title: 'Attendance', desc: 'Participation and attendance', icon: CheckCheck, phase: 4 },
    ]} />
  );
}

