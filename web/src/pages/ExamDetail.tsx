import { BellRing, CalendarCheck, FileText, Lock, MoreHorizontal, Trash2, Upload, Users } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { AnimatedNumber, Avatar, Badge, Button, Card, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger, EmptyState, PageHeader, StatusPill, Table, Tabs, Td, Th, btn } from '../components/ui';
import { href, navigate } from '../lib/router';
import { examStatus, LATE, POLICY, useStore } from '../lib/store';
import { fmtDateTime, relativeTo } from '../lib/utils';

export function ExamDetail({ id }: { id: string }) {
  const { exams, batches, students, members, updateExam, deleteExam } = useStore();
  const [tab, setTab] = useState<'uploads' | 'missing' | 'paper' | 'settings'>('uploads');
  const [confirm, setConfirm] = useState(false);
  const e = exams.find((x) => x.id === id);
  if (!e) {
    return <Page crumbs={[{ label: 'Exams', href: href({ page: 'exams' }) }, { label: 'Not found' }]}>
      <Card><EmptyState icon={FileText} title="This exam doesn’t exist" action={<a className={btn()} href={href({ page: 'exams' })}>All exams</a>}>It may have been deleted.</EmptyState></Card>
    </Page>;
  }
  const st = examStatus(e);
  const enrolledList = students.filter((s) => e.batchIds.includes(s.batchId));
  const notSubmitted = Math.max(0, enrolledList.length - e.received);
  const bname = (bid: string) => batches.find((b) => b.id === bid)?.name ?? '—';
  const when = e.draft ? 'Draft · not scheduled' : e.mode === 'timed'
    ? (st === 'scheduled' ? `Opens ${relativeTo(e.opensAt)}` : st === 'live' ? `Closes ${relativeTo(e.closesAt)}` : `Closed`)
    : 'Open practice paper';

  const stats: [string, number, string][] = [
    ['Uploaded', e.received, `of ${enrolledList.length} students`],
    ['Marked by AI', e.evaluated, `${e.received - e.evaluated} in progress`],
    ['Flagged', e.flagged, `${e.reviewed} reviewed`],
    ['Published', e.published, POLICY[e.policy].short],
  ];

  return (
    <Page crumbs={[{ label: 'Exams', href: href({ page: 'exams' }) }, { label: e.title }]}
      actions={
        <DropdownMenu>
          <DropdownTrigger className={btn('secondary', 'icon', 'size-7')} aria-label="More actions"><MoreHorizontal /></DropdownTrigger>
          <DropdownContent>
            {e.draft && <DropdownItem disabled={!e.fileName || !e.batchIds.length} onSelect={() => { updateExam(e.id, { draft: false }); toast.success('Exam scheduled'); }}><CalendarCheck /> Schedule</DropdownItem>}
            {st === 'live' && <DropdownItem onSelect={() => { updateExam(e.id, { closedAt: Date.now() }); toast('Exam closed to new uploads'); }}><Lock /> Close to uploads</DropdownItem>}
            {st === 'closed' && e.closedAt && <DropdownItem onSelect={() => { updateExam(e.id, { closedAt: null }); toast('Exam reopened'); }}><Lock /> Reopen</DropdownItem>}
            <DropdownSeparator />
            <DropdownItem danger onSelect={() => setConfirm(true)}><Trash2 /> Delete exam</DropdownItem>
          </DropdownContent>
        </DropdownMenu>
      }>
      <PageHeader title={e.title} meta={<><StatusPill status={st} /><span className="text-xs text-muted">· {when}</span></>}
        desc={`${e.subject} · ${e.batchIds.map(bname).join(', ') || 'No batch'}`}
        actions={e.draft ? <Button variant="primary" disabled={!e.fileName || !e.batchIds.length} onClick={() => { updateExam(e.id, { draft: false }); toast.success('Exam scheduled'); }}><CalendarCheck /> Schedule</Button> : undefined} />

      <Card className="mb-5 grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4">
        {stats.map(([l, v, s]) => (
          <div key={l} className="bg-panel px-4 py-3.5"><div className="text-xs text-muted">{l}</div><div className="tnum mt-1 text-2xl font-semibold tracking-tight"><AnimatedNumber value={v} /></div><div className="text-xs text-faint">{s}</div></div>
        ))}
      </Card>

      <Card>
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'uploads', label: 'Uploads', count: e.received },
          { value: 'missing', label: 'Not submitted', count: e.mode === 'timed' ? notSubmitted : undefined },
          { value: 'paper', label: 'Question paper' },
          { value: 'settings', label: 'Timing & results' },
        ]} />
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {tab === 'uploads' && (
          <EmptyState icon={Upload} title="No uploads yet">
            {e.draft ? 'This is a draft. Schedule it so students can see it.' : st === 'scheduled' ? `Students can upload from ${fmtDateTime(e.mode === 'timed' ? e.opensAt : e.practiceFrom)}.` : 'Scripts from the Parallax Flow app appear here as students submit, with AI marks and flags.'}
          </EmptyState>
        )}
        {tab === 'missing' && (e.mode === 'practice'
          ? <EmptyState icon={Users} title="Practice papers have no deadline" />
          : enrolledList.length ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
                <span className="text-xs text-muted">{notSubmitted} of {enrolledList.length} haven’t uploaded</span>
                <Button size="sm" disabled={st !== 'live'} onClick={() => toast.success(`Reminder sent to ${notSubmitted} students`)}><BellRing /> Remind all</Button>
              </div>
              <Table>
                <thead><tr><Th>Student</Th><Th>Roll no.</Th><Th>Batch</Th></tr></thead>
                <tbody>{enrolledList.map((s) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-hover" onClick={() => navigate({ page: 'student', id: s.id })}>
                    <Td><span className="flex items-center gap-2.5"><Avatar name={s.name} />{s.name}</span></Td>
                    <Td className="font-mono text-xs">{s.studentId}</Td><Td className="text-muted">{bname(s.batchId)}</Td>
                  </tr>
                ))}</tbody>
              </Table>
            </>
          ) : <EmptyState icon={Users} title="No students in these batches" action={<a href={href({ page: 'students' })} className={btn('secondary', 'sm')}>Add students</a>} />)}
        {tab === 'paper' && (e.fileName
          ? <div className="p-4"><div className="flex items-center gap-3 rounded-md border border-border bg-subtle px-3 py-2.5"><FileText className="size-4 text-accent" /><span className="flex-1 truncate text-sm font-medium">{e.fileName}</span><Badge>Waiting for server</Badge></div>
              <p className="mt-3 text-xs text-muted">Once the server reads the paper, each question is listed here with its steps, marks and ICAI keywords so you can check them before the exam opens.</p></div>
          : <EmptyState icon={FileText} title="No question paper">Upload the paper before scheduling.</EmptyState>)}
        {tab === 'settings' && (
          <dl className="grid gap-x-8 gap-y-3 p-4 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
            {([
              ['Type', e.mode === 'timed' ? 'Timed exam' : 'Open practice paper'],
              ['Window', e.mode === 'timed' ? `${fmtDateTime(e.opensAt)} – ${fmtDateTime(e.closesAt)}${e.perQuestion ? ` · own window for each of ${e.questionCount} questions` : ''}` : `From ${e.practiceFrom}${e.practiceTo ? ` to ${e.practiceTo}` : ''} · ${e.attempts === 'unlimited' ? 'unlimited attempts' : `${e.attempts} attempt(s)`}`],
              ['Late uploads', e.mode === 'timed' ? LATE[e.late] : '—'],
              ['Results', POLICY[e.policy].title],
              ['Reviewer', members.find((m) => m.id === e.reviewerId)?.name || 'Any reviewer'],
              ['Students see', [e.see.steps && 'step marks', e.see.needed && 'what was needed', e.see.model && 'model answer', e.see.rank && 'rank'].filter(Boolean).join(', ') || 'Total only'],
            ] as const).map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>)}
          </dl>
        )}
        </motion.div>
      </Card>

      <Dialog open={confirm} onOpenChange={setConfirm} title="Delete this exam?" desc={`“${e.title}” and its uploads will be deleted for everyone. This can’t be undone.`}
        footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { deleteExam(e.id); toast('Exam deleted'); navigate({ page: 'exams' }); }}>Delete exam</Button></>} />
    </Page>
  );
}
