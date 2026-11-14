import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CircleCheck, Download, FileText, GraduationCap, Inbox, Layers, Plus, Radio, ScanLine, Smartphone, Upload, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Delta, Donut, HatchedBars, Sparkline } from '../components/charts';
import { Page } from '../components/layout/Page';
import { AnimatedNumber, Avatar, Badge, Button, EmptyState, btn } from '../components/ui';
import { href, navigate, type Route } from '../lib/router';
import { examStatus, inr, useStore } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { salesSummary, useShop } from '../lib/shop';
import { cn, downloadCSV, fmtDate, inrShort, timeAgo } from '../lib/utils';
import { useTick } from '../lib/hooks';
import { toast } from 'sonner';

const ease = [0.22, 1, 0.36, 1] as const;

function Box({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay, ease }}
      className={cn('rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]', className)}>{children}</motion.section>
  );
}
// When the dashboard figures were last read. With the server this becomes the last sync time.
const LOADED = Date.now();
const Updated = () => <span className="text-2xs text-faint">Updated {timeAgo(LOADED)}</span>;
const BoxHead = ({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) => (
  <div className="mb-4 flex items-start justify-between gap-3">
    <div><h2 className="text-[15px] font-bold tracking-tight">{title}</h2><p className="mt-0.5 text-xs text-muted">{sub}{sub && ' · '}<Updated /></p></div>{right}
  </div>
);
const ViewLink = ({ to, children, onClick }: { to: Route; children: ReactNode; onClick?: () => void }) => (
  <a href={href(to)} onClick={onClick} className="group mt-auto flex items-center justify-between border-t border-border pt-3 text-xs font-semibold">
    {children}<ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
  </a>
);
const IconDot = ({ icon: Icon }: { icon: typeof Users }) => <span className="grid size-10 place-items-center rounded-full bg-subtle ring-1 ring-border"><Icon className="size-[18px]" /></span>;

export function Overview() {
  const s = useStore();
  const setExamPreset = useUI((u) => u.setExamPreset);
  const now = new Date();
  const statuses = s.exams.map((e) => ({ e, st: examStatus(e) }));
  const scheduled = statuses.filter((x) => x.st === 'scheduled');
  const live = statuses.filter((x) => x.st === 'live');
  const completed = statuses.filter((x) => x.st === 'closed');
  const mcq = s.exams.filter((e) => e.kind === 'mcq').length;
  const desc = s.exams.filter((e) => e.kind === 'descriptive').length;
  const activeBatches = s.batches.filter((b) => b.status === 'active');
  const shop = useShop();
  const sales = salesSummary(shop.sales, shop.mine);
  const totalRevenue = sales.total;
  // Last 30 days against the 30 before, so a half-finished month never reads as a drop.
  const inWindow = (from: number, to: number) => shop.sales.filter((o) => o.status === 'completed' && o.at > Date.now() - to * 864e5 && o.at <= Date.now() - from * 864e5).reduce((a, o) => a + o.subtotal, 0);
  const prevSales = inWindow(30, 60), salesGrowth = prevSales ? Math.round(((inWindow(0, 30) - prevSales) / prevSales) * 100) : 0;
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return d.toLocaleDateString('en-IN', { month: 'short' }); });
  const monthly = sales.monthly;
  const regsByMonth = Array.from({ length: 8 }, (_, i) => { const from = new Date(); from.setMonth(from.getMonth() - 7 + i, 1); const to = new Date(from); to.setMonth(to.getMonth() + 1); return s.students.filter((x) => x.createdAt >= +from && x.createdAt < +to).length; });
  const DAY = 86400e3, t = Date.now();
  const last30 = s.students.filter((x) => x.createdAt > t - 30 * DAY).length, prev30 = s.students.filter((x) => x.createdAt > t - 60 * DAY && x.createdAt <= t - 30 * DAY).length;
  const growth = prev30 ? Math.round(((last30 - prev30) / prev30) * 100) : 0;
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const openExams = (status: string, kind = 'all') => { setExamPreset({ status, kind }); navigate({ page: 'exams' }); };
  const upcoming = [...scheduled, ...live].sort((a, b) => +new Date(a.e.opensAt) - +new Date(b.e.opensAt)).slice(0, 4);
  const empty = !s.students.length && !s.exams.length && !s.batches.length;
  useTick();
  const pendingReview = completed.reduce((a, x) => a + Math.max(0, x.e.flagged - x.e.reviewed), 0);
  const phoneAsks = s.students.filter((x) => x.deviceRequest).length;
  // One spreadsheet with the figures on this page.
  const exportReport = () => void downloadCSV(`dashboard-${now.toISOString().slice(0, 10)}.csv`, [
    ['Section', 'Item', 'Value'],
    ['Students', 'Enrolled', s.students.length], ['Students', 'Joined in the last 30 days', last30], ['Students', 'Asking to change phone', phoneAsks],
    ['Batches', 'Active', activeBatches.length], ['Batches', 'Archived', s.batches.length - activeBatches.length],
    ['Exams', 'Live', live.length], ['Exams', 'Scheduled', scheduled.length], ['Exams', 'Completed', completed.length], ['Exams', 'Scripts waiting for review', pendingReview],
    ['Store revenue', 'E-books', sales.kinds.ebooks], ['Store revenue', 'Tests', sales.kinds.tests], ['Store revenue', 'Question banks', sales.kinds.banks],
    ...monthly.map((v, i) => ['Store revenue by month', months[i], v]),
  ]).then((ok) => ok && toast.success('Dashboard report exported'));
  const attention = [
    { n: live.length, label: live.length === 1 ? 'exam live now' : 'exams live now', icon: Radio, go: () => openExams('live'), hot: true },
    { n: pendingReview, label: 'scripts waiting for faculty review', icon: ScanLine, go: () => openExams('closed') },
    { n: s.joinRequests.length, label: s.joinRequests.length === 1 ? 'join request' : 'join requests', icon: Inbox, go: () => navigate({ page: 'join-requests' }) },
    { n: phoneAsks, label: phoneAsks === 1 ? 'student asking to change phone' : 'students asking to change phone', icon: Smartphone, go: () => { useUI.getState().setStudentPreset({ batch: 'all', phone: true }); navigate({ page: 'students' }); } },
  ].filter((a) => a.n > 0);

  return (
    <Page crumbs={[{ label: 'Dashboard' }]}>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{greeting}{s.me.name ? `, ${s.me.name.split(' ')[0]}` : ''} · {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight tracking-[-0.03em]">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportReport}><Download /> Export report</Button>
          <a href={href({ page: 'exam-new' })} className={btn('primary')}><Plus /> Create test</a>
        </div>
      </div>

      {!empty && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
          className="mb-4 flex flex-wrap items-center gap-2 rounded-[22px] bg-fg p-2 text-bg">
          <span className="px-3 text-xs font-bold">Needs attention</span>
          {attention.length ? attention.map((a) => (
            <button key={a.label} onClick={a.go} className="group flex h-9 items-center gap-2 rounded-full bg-bg/10 pl-2 pr-3 text-xs transition hover:bg-bg/20">
              <span className={cn('grid size-6 place-items-center rounded-full', a.hot ? 'bg-pop text-pop-fg' : 'bg-bg/15')}><a.icon className="size-3.5" /></span>
              <span className="tnum font-bold">{a.n.toLocaleString('en-IN')}</span><span className="opacity-75">{a.label}</span>
              <ArrowRight className="size-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
            </button>
          )) : <span className="flex items-center gap-2 text-xs opacity-75"><CircleCheck className="size-4" /> All clear. Nothing waiting on you today.</span>}
        </motion.div>
      )}

      {empty ? (
        <Box><EmptyState icon={GraduationCap} title="Your academy is empty" action={<><Button onClick={() => useUI.getState().open('batch')}>New batch</Button><Button variant="primary" onClick={() => s.loadSample()}>Load sample data</Button></>}>Create a batch and add students to get started, or load the sample academy to see the dashboard filled in.</EmptyState></Box>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* 1. Student & batch overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            <Box className="flex flex-col">
              <div className="flex items-start justify-between"><div><div className="text-xs font-medium text-muted">Total students</div><Updated /></div><IconDot icon={Users} /></div>
              <div className="mb-0.5 mt-2 flex items-center gap-3"><span className="tnum text-[34px] font-bold leading-[1.1] tracking-tight"><AnimatedNumber value={s.students.length} /></span>{s.students.length > 0 && <Delta value={growth} />}</div>
              <div className="text-2xs text-muted">{last30} joined in the last 30 days</div>
              <Sparkline values={regsByMonth} className="my-3 h-12" />
              <ViewLink to={{ page: 'students' }}>View all students</ViewLink>
            </Box>
            <Box className="flex flex-col" delay={0.05}>
              <div className="flex items-start justify-between"><div><div className="text-xs font-medium text-muted">Total batches</div><Updated /></div><IconDot icon={Layers} /></div>
              <div className="mb-0.5 mt-2 flex items-center gap-3"><span className="tnum text-[34px] font-bold leading-[1.1] tracking-tight"><AnimatedNumber value={s.batches.length} /></span><Badge tone="ink">{activeBatches.length} active</Badge></div>
              <div className="my-4 flex h-3 gap-1 overflow-hidden rounded-full">
                {(['CA Foundation', 'CA Inter', 'CA Final'] as const).map((c, i) => { const n = activeBatches.filter((b) => b.course === c).length; return n ? <motion.div key={c} title={`${c}: ${n}`} initial={{ flexGrow: 0 }} animate={{ flexGrow: n }} transition={{ duration: 0.8, ease }} className={cn('h-full rounded-full', i === 0 ? 'bg-pop' : i === 1 ? 'bg-fg' : 'hatch')} /> : null; })}
              </div>
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-pop" />Foundation</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-fg" />Inter</span><span className="flex items-center gap-1.5"><i className="hatch size-2 rounded-full ring-1 ring-border-strong" />Final</span></div>
              <ViewLink to={{ page: 'batches' }}>View all batches</ViewLink>
            </Box>
          </div>

          {/* 4. Revenue */}
          <Box className="lg:col-span-5" delay={0.1}>
            <BoxHead title="Store revenue" sub={shop.addon ? 'Your store, all time' : 'Preview · store add-on locked'} right={<Badge tone="pop">Sample</Badge>} />
            <div className="flex flex-wrap items-center gap-3"><span className="tnum text-[34px] font-bold leading-[1.1] tracking-tight" title={inr(totalRevenue)}>{inrShort(totalRevenue)}</span><Delta value={salesGrowth} /></div>
            <div className="mt-8"><HatchedBars data={monthly.map((v, i) => ({ label: months[i], value: v }))} height={170} format={(v) => inrShort(v)} highlight={monthly.length - 1} /></div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[['E-books', sales.kinds.ebooks], ['Tests', sales.kinds.tests], ['Question banks', sales.kinds.banks]].map(([l, v]) => (
                <button key={l as string} onClick={() => navigate({ page: 'store', tab: 'sales' })} className="group rounded-xl bg-subtle p-3 text-left transition hover:bg-hover">
                  <div className="text-2xs text-muted">{l}</div><div className="tnum mt-0.5 text-sm font-bold" title={inr(v as number)}>{inrShort(v as number)}</div>
                  <div className="mt-1 flex items-center gap-1 text-2xs font-semibold text-muted group-hover:text-fg">Open store <ArrowRight className="size-3" /></div>
                </button>
              ))}
            </div>
          </Box>

          {/* 3. Tests & examinations */}
          <Box className="flex flex-col lg:col-span-3" delay={0.15}>
            <BoxHead title="Examinations" sub="By status" />
            <div className="flex justify-center"><Donut size={168} thickness={22} center={<AnimatedNumber value={s.exams.length} />} sub="tests" segments={[{ label: 'Ongoing', value: live.length, tone: 'pop' }, { label: 'Scheduled', value: scheduled.length, tone: 'ink' }, { label: 'Completed', value: completed.length, tone: 'hatch' }]} /></div>
            <div className="mt-5 space-y-1">
              {([['Scheduled', scheduled.length, 'ink', 'scheduled'], ['Ongoing', live.length, 'pop', 'live'], ['Completed', completed.length, 'hatch', 'closed']] as const).map(([l, v, tone, key]) => (
                <button key={l} onClick={() => openExams(key)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-xs transition hover:bg-subtle">
                  <span className={cn('size-2.5 rounded-full', tone === 'ink' ? 'bg-fg' : tone === 'pop' ? 'bg-pop' : 'hatch ring-1 ring-border-strong')} />
                  <span className="flex-1 text-muted">{l}</span><span className="tnum font-bold">{v}</span><ArrowRight className="size-3.5 text-faint" />
                </button>
              ))}
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
              <button onClick={() => openExams('all', 'mcq')} className="rounded-xl bg-fg p-3 text-left text-bg transition hover:bg-fg/90"><div className="text-2xs opacity-70">MCQ tests</div><div className="tnum text-xl font-bold">{mcq}</div></button>
              <button onClick={() => openExams('all', 'descriptive')} className="rounded-xl bg-pop p-3 text-left text-pop-fg transition hover:brightness-95"><div className="text-2xs opacity-70">Descriptive</div><div className="tnum text-xl font-bold">{desc}</div></button>
            </div>
          </Box>

          {/* 2. Courses & learning materials */}
          <Box className="lg:col-span-7" delay={0.2}>
            <BoxHead title="Courses & learning materials" sub="What students can study" right={<a href={href({ page: 'learning' })} className={btn('secondary', 'sm')}>Open learning</a>} />
            {s.courses.length ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {s.courses.map((c, i) => {
                  const n = (id: string) => s.materials.filter((m) => m.courseId === id && m.status !== 'archived').length, max = Math.max(1, ...s.courses.map((x) => n(x.id)));
                  return (
                    <a key={c.id} href={href({ page: 'course', id: c.id })} className="group flex flex-col rounded-2xl bg-subtle p-4 transition hover:bg-hover">
                      <div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-full bg-panel"><BookOpen className="size-4" /></span>{c.active && <Badge tone="pop">Active</Badge>}</div>
                      <div className="mt-4 text-sm font-bold">{c.name}</div>
                      <div className="text-2xs text-muted">{c.subjects.length} subjects · {n(c.id)} materials</div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full hatch"><motion.div className={cn('h-full rounded-full', i === 1 ? 'bg-pop' : 'bg-fg')} initial={{ width: 0 }} animate={{ width: `${(n(c.id) / max) * 100}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease }} /></div>
                      <div className="mt-3 flex items-center gap-1 text-2xs font-semibold text-muted group-hover:text-fg">View in detail <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" /></div>
                    </a>
                  );
                })}
              </div>
            ) : <EmptyState compact icon={BookOpen} title="No courses yet" />}
          </Box>

          {/* Upcoming exams */}
          <Box className="flex flex-col lg:col-span-5" delay={0.25}>
            <BoxHead title="Upcoming exams" sub="Live now and next" right={<button onClick={() => openExams('scheduled')} className={btn('secondary', 'sm')}>View all</button>} />
            {upcoming.length ? (
              <ul className="space-y-1">
                {upcoming.map(({ e, st }) => {
                  const d = new Date(e.opensAt);
                  return (
                    <li key={e.id}><a href={href({ page: 'exam', id: e.id })} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-subtle">
                      <span className={cn('grid w-12 shrink-0 place-items-center rounded-xl py-1.5 text-center leading-none', st === 'live' ? 'bg-pop text-pop-fg' : 'bg-fg text-bg')}><span className="text-[9px] font-semibold uppercase opacity-75">{d.toLocaleDateString('en-IN', { month: 'short' })}</span><span className="tnum text-lg font-bold">{d.getDate()}</span></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{e.title}</span><span className="block truncate text-2xs text-muted">{e.subject} · {s.batches.find((b) => b.id === e.batchIds[0])?.name}</span></span>
                      {st === 'live' ? <Badge tone="pop">Live</Badge> : <span className="text-2xs text-muted">{d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>}
                    </a></li>
                  );
                })}
              </ul>
            ) : <EmptyState compact icon={FileText} title="Nothing scheduled" />}
          </Box>

          {/* 5. Recent activities */}
          <Box className="lg:col-span-12" delay={0.3}>
            <BoxHead title="Recent activities" sub="Across your academy" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col rounded-2xl bg-subtle p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold"><Users className="size-4" /> New registrations</div>
                <ul className="space-y-2.5">{s.students.slice(0, 4).map((x) => (
                  <li key={x.id}><a href={href({ page: 'student', id: x.id })} className="flex items-center gap-2.5 text-xs"><Avatar name={x.name} size="sm" className="size-7" /><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{x.name}</span><span className="block truncate text-2xs text-muted">{s.batches.find((b) => b.id === x.batchId)?.course}</span></span><span className="text-2xs text-faint">{fmtDate(x.createdAt).replace(/ \d{4}$/, '')}</span></a></li>
                ))}</ul>
                <ViewLink to={{ page: 'students' }}>View all</ViewLink>
              </div>
              <div className="flex flex-col rounded-2xl bg-subtle p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold"><Upload className="size-4" /> Recently uploaded</div>
                <ul className="space-y-2.5">{s.feed.uploads.slice(0, 4).map((u) => (
                  <li key={u.title} className="flex items-center gap-2.5 text-xs"><span className="grid h-7 w-10 shrink-0 place-items-center rounded-lg bg-panel text-[9px] font-bold">{u.kind}</span><span className="min-w-0 flex-1 truncate font-semibold">{u.title}</span><span className="shrink-0 text-2xs text-faint">{timeAgo(u.at)}</span></li>
                ))}</ul>
                <ViewLink to={{ page: 'learning' }}>View all</ViewLink>
              </div>
              <div className="flex flex-col rounded-2xl bg-subtle p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold"><GraduationCap className="size-4" /> Student activities</div>
                <ul className="space-y-2.5">{s.feed.studentActs.slice(0, 4).map((a, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs"><span className={cn('size-2 shrink-0 rounded-full', i === 0 ? 'bg-pop' : 'bg-border-strong')} /><span className="min-w-0 flex-1 truncate">{s.students[i * 7]?.name ?? 'A student'} {a.text}</span><span className="shrink-0 text-2xs text-faint">{timeAgo(a.at)}</span></li>
                ))}</ul>
                <ViewLink to={{ page: 'reports' }}>View all</ViewLink>
              </div>
            </div>
          </Box>
        </div>
      )}
    </Page>
  );
}
