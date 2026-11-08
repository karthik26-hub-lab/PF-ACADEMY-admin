import { ArrowUpRight, Building2, CalendarClock, Check, ClipboardCheck, FileText, Layers, Plus, Settings2, UserPlus, Users } from 'lucide-react';
import type { ElementType } from 'react';
import { Page } from '../components/layout/Page';
import { AnimatedNumber, Badge, Button, Card, CardHeader, EmptyState, PageHeader, Progress, Reveal, StatusPill, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { examStatus, useStore, type Activity } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn, fmtDateTime, relativeTo, sameDay, timeAgo } from '../lib/utils';

const ACT_ICON: Record<Activity['kind'], ElementType> = { exam: FileText, student: UserPlus, batch: Layers, team: Users, settings: Settings2 };

export function Overview() {
  const s = useStore();
  const open = useUI((u) => u.open);
  const now = new Date();
  const withStatus = s.exams.map((e) => ({ e, st: examStatus(e) }));
  const live = withStatus.filter((x) => x.st === 'live');
  const upcoming = withStatus.filter((x) => x.st === 'scheduled').sort((a, b) => +new Date(a.e.opensAt || a.e.practiceFrom) - +new Date(b.e.opensAt || b.e.practiceFrom));
  const inProgress = [...live, ...upcoming].slice(0, 6);
  const batchName = (id: string) => s.batches.find((b) => b.id === id)?.name ?? '—';
  const enrolled = (ids: string[]) => s.students.filter((x) => ids.includes(x.batchId)).length;

  const today = s.exams.flatMap((e) => {
    if (e.draft || e.mode !== 'timed') return [];
    const out: { t: Date; label: string; e: typeof e }[] = [];
    const o = new Date(e.opensAt), c = new Date(e.closesAt);
    if (sameDay(o, now)) out.push({ t: o, label: 'Opens', e });
    if (sameDay(c, now)) out.push({ t: c, label: 'Closes', e });
    return out;
  }).sort((a, b) => +a.t - +b.t);

  const setup = [
    { done: !!s.academy.name, title: 'Academy details', desc: 'Name, contact and the code students join with', icon: Building2, action: () => navigate({ page: 'settings', tab: 'general' }), cta: 'Add details' },
    { done: s.batches.length > 0, title: 'Create a batch', desc: 'Group students by course and attempt', icon: Layers, action: () => open('batch'), cta: 'New batch' },
    { done: s.students.length > 0, title: 'Add students', desc: 'Create logins or import from Excel', icon: UserPlus, action: () => open('student'), cta: 'Add student' },
    { done: s.exams.length > 0, title: 'Create an exam', desc: 'Upload the paper, set timing and results', icon: FileText, action: () => navigate({ page: 'exam-new' }), cta: 'Create exam' },
  ];
  const doneCount = setup.filter((x) => x.done).length;
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const first = s.me.name.split(' ')[0];

  const metrics = [
    { label: 'Live exams', value: live.length, sub: upcoming.length ? `${upcoming.length} scheduled` : 'None scheduled' },
    { label: 'Uploads received', value: live.reduce((a, x) => a + x.e.received, 0), sub: live.length ? 'Across live exams' : 'No exam open' },
    { label: 'Waiting for review', value: s.exams.reduce((a, e) => a + Math.max(0, e.flagged - e.reviewed), 0), sub: 'Flagged or held scripts' },
    { label: 'Students', value: s.students.length, sub: `${s.batches.length} batch${s.batches.length === 1 ? '' : 'es'}` },
  ];

  return (
    <Page crumbs={[{ label: 'Overview' }]} actions={<a href={href({ page: 'exam-new' })} className={btn('primary', 'sm')}><Plus /> Create exam</a>}>
      <PageHeader title={`${greeting}${first ? `, ${first}` : ''}`} desc={now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />

      {doneCount < setup.length && (
        <Reveal><Card className="mb-5">
          <CardHeader title="Set up your academy" desc={`${doneCount} of ${setup.length} done`} action={<Progress value={(doneCount / setup.length) * 100} className="w-28" />} />
          <ol className="grid gap-px overflow-hidden rounded-b-lg bg-border sm:grid-cols-2 lg:grid-cols-4">
            {setup.map((st, i) => (
              <li key={st.title} className="flex flex-col gap-3 bg-panel p-4">
                <div className="flex items-center gap-2">
                  <span className={cn('grid size-6 place-items-center rounded-full text-2xs font-semibold ring-1 ring-inset transition-colors duration-300', st.done ? 'bg-good text-white ring-good' : 'bg-subtle text-muted ring-border')}>{st.done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}</span>
                  <span className={cn('text-sm font-medium', st.done && 'text-muted line-through decoration-faint')}>{st.title}</span>
                </div>
                <p className="flex-1 text-xs text-muted">{st.desc}</p>
                {!st.done && <Button size="sm" className="self-start" onClick={st.action}>{st.cta}</Button>}
              </li>
            ))}
          </ol>
        </Card></Reveal>
      )}

      <Reveal delay={0.05}><Card className="mb-5 grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-panel px-4 py-3.5">
            <div className="text-xs text-muted">{m.label}</div>
            <div className="tnum mt-1 text-2xl font-semibold tracking-tight"><AnimatedNumber value={m.value} /></div>
            <div className="text-xs text-faint">{m.sub}</div>
          </div>
        ))}
      </Card></Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal delay={0.1} className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Exams in progress" desc="Live now and coming up" action={<a href={href({ page: 'exams' })} className={btn('ghost', 'sm')}>All exams <ArrowUpRight /></a>} />
            {inProgress.length ? (
              <ul className="divide-y divide-border">
                {inProgress.map(({ e, st }) => {
                  const n = enrolled(e.batchIds);
                  return (
                    <li key={e.id}>
                      <a href={href({ page: 'exam', id: e.id })} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 px-4 py-3 transition hover:bg-hover sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px]">
                        <div className="min-w-0"><div className="truncate font-medium">{e.title}</div><div className="truncate text-xs text-muted">{e.batchIds.map(batchName).join(', ') || 'No batch'}</div></div>
                        <div className="flex items-center gap-2 text-xs text-muted"><StatusPill status={st} /><span className="hidden sm:inline">· {st === 'live' ? (e.mode === 'timed' ? `closes ${relativeTo(e.closesAt)}` : 'open practice') : `opens ${relativeTo(e.mode === 'timed' ? e.opensAt : e.practiceFrom)}`}</span></div>
                        <div className="col-span-2 sm:col-span-1">
                          <div className="tnum mb-1 flex justify-between text-2xs text-muted"><span>Uploads</span><span>{e.received}/{n}</span></div>
                          <Progress value={n ? (e.received / n) * 100 : 0} />
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState compact icon={FileText} title="Nothing running" action={<a href={href({ page: 'exam-new' })} className={btn('secondary', 'sm')}><Plus /> Create exam</a>}>Live and scheduled exams show here with their upload progress.</EmptyState>
            )}
          </Card>

          <Card>
            <CardHeader title="Review queue" desc="Scripts the AI flagged, or that an exam holds for faculty" action={<a href={href({ page: 'reviews' })} className={btn('ghost', 'sm')}>Open reviews <ArrowUpRight /></a>} />
            <EmptyState compact icon={ClipboardCheck} title="No scripts waiting">When students upload, the AI marks each script. Anything it isn’t sure about lands here.</EmptyState>
          </Card>
        </Reveal>

        <Reveal delay={0.15} className="space-y-5">
          <Card>
            <CardHeader title="Today" desc={now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} />
            {today.length ? (
              <ul className="space-y-0 p-2">
                {today.map((t, i) => (
                  <li key={i}><a href={href({ page: 'exam', id: t.e.id })} className="flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-hover">
                    <span className="tnum w-16 shrink-0 text-xs font-medium">{t.t.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{t.e.title}</span>
                    <Badge tone={t.label === 'Opens' ? 'accent' : 'neutral'}>{t.label}</Badge>
                  </a></li>
                ))}
              </ul>
            ) : <EmptyState compact icon={CalendarClock} title="Nothing scheduled today" />}
          </Card>

          <Card>
            <CardHeader title="Batches" action={<Button variant="ghost" size="sm" onClick={() => open('batch')}><Plus /> New</Button>} />
            {s.batches.length ? (
              <ul className="divide-y divide-border">
                {s.batches.slice(0, 6).map((b) => (
                  <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{b.name}</span><span className="text-xs text-muted">{b.course}</span></span>
                    <span className="tnum text-xs text-muted">{s.students.filter((x) => x.batchId === b.id).length} students</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyState compact icon={Layers} title="No batches yet" />}
          </Card>

          <Card>
            <CardHeader title="Recent activity" />
            {s.activity.length ? (
              <ul className="space-y-0.5 p-2">
                {s.activity.slice(0, 8).map((a) => { const Icon = ACT_ICON[a.kind]; return (
                  <li key={a.id} className="flex items-start gap-2.5 rounded-md px-2 py-1.5">
                    <Icon className="mt-0.5 size-3.5 shrink-0 text-faint" />
                    <span className="min-w-0 flex-1 text-sm">{a.text}</span>
                    <span className="shrink-0 text-2xs text-faint" title={fmtDateTime(a.at)}>{timeAgo(a.at)}</span>
                  </li>
                ); })}
              </ul>
            ) : <EmptyState compact icon={Users} title="No activity yet">Uploads, reviews and changes by your team appear here.</EmptyState>}
          </Card>
        </Reveal>
      </div>
    </Page>
  );
}
