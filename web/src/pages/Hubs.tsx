import { statsOf } from '../lib/banks';
import { motion } from 'framer-motion';
import { ArrowUpRight, BarChart3, CalendarDays, CheckCheck, ClipboardCheck, FileQuestion, FolderOpen, GraduationCap, Inbox, Layers, LineChart, Megaphone, PenLine, Trophy, UserCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Donut, HatchedBars, Ring, Sparkline } from '../components/charts';
import { Page } from '../components/layout/Page';
import { Avatar, Badge } from '../components/ui';
import { href, type Route } from '../lib/router';
import { annStatus, examStatus, useStore } from '../lib/store';
import { scriptsOf } from '../lib/scripts';
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
  const { courses, announcements, materials: all } = useStore();
  const live = all.filter((m) => m.status !== 'archived'), count = (id: string) => live.filter((m) => m.courseId === id).length, materials = live.length;
  return (
    <Hub crumb="Learning" title="Learning" desc="Courses, study materials and announcements for your students." tiles={[
      { title: 'Courses', desc: 'Create courses, subjects and chapters', icon: GraduationCap, to: { page: 'courses' }, metric: courses.length, sub: courses.map((c) => c.name).join(' · ') || 'No courses yet',
        visual: courses.length ? <div className="flex"><Donut size={84} thickness={12} center={<span className="text-sm">{materials}</span>} segments={courses.map((c, i) => ({ label: c.name, value: count(c.id), tone: (['ink', 'pop', 'hatch'] as const)[i % 3] }))} /></div> : null },
      { title: 'Study materials', desc: 'Upload and organise resources, Drive-style', icon: FolderOpen, to: { page: 'materials' }, metric: materials, sub: 'PDFs, videos, notes and links' },
      { title: 'Announcements', desc: 'Notifications and pop-ups to courses, batches or everyone', icon: Megaphone, to: { page: 'announcements' }, metric: announcements.filter((a) => annStatus(a) === 'published').length, sub: 'published now' },
    ]} />
  );
}

export function AssessmentsHub() {
  const { exams, banks, templates, students, marking } = useStore();
  const st = exams.map((e) => examStatus(e));
  const count = (s: string) => st.filter((x) => x === s).length;
  // Scripts of live and completed tests, for submissions, evaluation and results.
  const scripts = exams.filter((_, i) => st[i] === 'live' || st[i] === 'closed').flatMap((e) => scriptsOf(e, students, banks, marking));
  const sub = scripts.filter((s) => s.submitted), late = sub.filter((s) => s.late).length, review = sub.filter((s) => s.status === 'flagged').length;
  const done = exams.filter((_, i) => st[i] === 'closed').slice(0, 8);
  const avgs = done.map((e) => { const sc = scriptsOf(e, students, banks, marking).filter((s) => s.submitted); return sc.length ? Math.round(sc.reduce((a, s) => a + (s.marks / s.max) * 100, 0) / sc.length) : 0; }).reverse();
  const passPct = sub.length ? Math.round((sub.filter((s) => s.marks / s.max >= 0.4).length / sub.length) * 100) : 0;
  const live = banks.filter((b) => !b.deleted), qs = statsOf(live.flatMap((b) => b.questions));
  const evalBars = (['ai', 'flagged', 'reviewed', 'published'] as const).map((k, i) => ({ label: ['AI', 'Review', 'Done', 'Out'][i], value: sub.filter((s) => s.status === k).length }));
  return (
    <Hub crumb="Assessments" title="Assessments" desc="Build tests from the question bank or a paper, run them, evaluate with AI help, and publish results." tiles={[
      { title: 'Create test', desc: 'Build a new examination', icon: PenLine, to: { page: 'exam-new' }, metric: templates.length, sub: 'saved templates to start from',
        visual: <div className="flex flex-wrap gap-1">{templates.slice(0, 3).map((t) => <span key={t.id} className="max-w-full truncate rounded-full bg-subtle px-2 py-0.5 text-2xs ring-1 ring-border">{t.name}</span>)}{count('draft') > 0 && <Badge>{count('draft')} drafts</Badge>}</div> },
      { title: 'Question bank', desc: 'Word and Excel banks by course and subject', icon: FileQuestion, to: { page: 'question-bank' }, metric: live.length, sub: `banks · ${qs.questions.toLocaleString('en-IN')} questions · ${qs.cases} case studies`,
        visual: <div className="flex"><Donut size={84} thickness={12} center={<span className="text-sm">{qs.questions}</span>} segments={[{ label: 'MCQ', value: qs.mcq, tone: 'ink' }, { label: 'Descriptive', value: qs.descriptive, tone: 'pop' }]} /></div> },
      { title: 'Scheduled tests', desc: 'Draft, scheduled, live, completed, cancelled', icon: CalendarDays, to: { page: 'exams' }, metric: count('scheduled') + count('live'), sub: `${count('live')} live · ${count('scheduled')} scheduled · ${count('closed')} completed`,
        visual: <div className="flex"><Donut size={84} thickness={12} center={<span className="text-sm">{exams.length}</span>} segments={[{ label: 'Live', value: count('live'), tone: 'pop' }, { label: 'Scheduled', value: count('scheduled'), tone: 'ink' }, { label: 'Completed', value: count('closed'), tone: 'hatch' }]} /></div> },
      { title: 'Submissions', desc: 'Who submitted, who hasn’t, late uploads', icon: Inbox, to: { page: 'submissions' }, metric: sub.length.toLocaleString('en-IN'), sub: `${(scripts.length - sub.length).toLocaleString('en-IN')} not submitted · ${late} late`,
        visual: <div className="flex items-center gap-3"><Ring value={scripts.length ? (sub.length / scripts.length) * 100 : 0} size={64} stroke={8} tone="pop" label="Submitted share" /><span className="text-2xs text-muted">submitted in live and completed tests</span></div> },
      { title: 'Evaluation', desc: 'AI-assisted marking and faculty review', icon: ClipboardCheck, to: { page: 'reviews' }, metric: review, sub: 'scripts need a faculty review', visual: <HatchedBars data={evalBars} height={70} highlight={1} /> },
      { title: 'Results', desc: 'Marks, rankings, pass % and downloads', icon: Trophy, to: { page: 'results' }, metric: `${passPct}%`, sub: `pass rate in the last ${done.length} completed tests`, visual: avgs.length > 1 ? <Sparkline values={avgs} /> : null },
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

