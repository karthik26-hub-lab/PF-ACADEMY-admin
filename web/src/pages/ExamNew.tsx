import { Check, FileText, Plus, Upload, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { Badge, Button, Card, Checkbox, Field, Input, PageHeader, RadioCard, Segmented, Select, Switch } from '../components/ui';
import { href, navigate } from '../lib/router';
import { LATE, POLICY, SUBJECTS, useStore, type Late, type Mode, type Policy, type See } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { cn, fmtDateTime, toLocalInput } from '../lib/utils';

function Section({ n, title, desc, children, done }: { n: number; title: string; desc: string; children: ReactNode; done: boolean }) {
  return (
    <Card>
      <div className="grid gap-5 p-5 md:grid-cols-[200px_minmax(0,1fr)]">
        <div className="flex gap-3 md:block">
          <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-2xs font-semibold ring-1 ring-inset md:mb-2', done ? 'bg-fg text-bg ring-fg' : 'bg-subtle text-muted ring-border')}>{done ? <Check className="size-3.5" strokeWidth={3} /> : n}</span>
          <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-0.5 text-xs text-muted">{desc}</p></div>
        </div>
        <div className="min-w-0 space-y-4">{children}</div>
      </div>
    </Card>
  );
}

export function ExamNew() {
  const { batches, students, members, defaults, addExam } = useStore();
  const open = useUI((u) => u.open);
  const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0);
  const end = new Date(start); end.setHours(13);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[2]);
  const [file, setFile] = useState('');
  const [batchIds, setBatchIds] = useState<string[]>(batches[0] ? [batches[0].id] : []);
  const [mode, setMode] = useState<Mode>('timed');
  const [perQuestion, setPerQuestion] = useState(false);
  const [opensAt, setOpensAt] = useState(toLocalInput(start));
  const [closesAt, setClosesAt] = useState(toLocalInput(end));
  const [questionCount, setQuestionCount] = useState(4);
  const [late, setLate] = useState<Late>(defaults.late);
  const [practiceFrom, setPracticeFrom] = useState(toLocalInput(new Date()).slice(0, 10));
  const [practiceTo, setPracticeTo] = useState('');
  const [attempts, setAttempts] = useState<'unlimited' | '1' | '3'>('unlimited');
  const [policy, setPolicy] = useState<Policy>(defaults.policy);
  const [reviewerId, setReviewerId] = useState('');
  const [see, setSee] = useState<See>({ steps: true, needed: true, model: true, rank: false });

  const reviewers = members.filter((m) => m.role !== 'Exam manager');
  const enrolled = students.filter((s) => batchIds.includes(s.batchId)).length;
  const timingOk = mode === 'practice' ? !!practiceFrom : !!opensAt && !!closesAt && +new Date(closesAt) > +new Date(opensAt);
  const missing = [!title.trim() && 'a title', !file && 'the question paper', !batchIds.length && 'a batch', !timingOk && 'a valid time window'].filter(Boolean) as string[];

  const save = (draft: boolean) => {
    const e = addExam({ title: title.trim(), subject, fileName: file, batchIds, mode, opensAt, closesAt, perQuestion, questionCount, late, practiceFrom, practiceTo, attempts, policy, reviewerId, see, draft });
    toast.success(draft ? 'Draft saved' : 'Exam scheduled', { description: draft ? undefined : 'Students are notified in the app when it opens.' });
    navigate({ page: 'exam', id: e.id });
  };

  const summary: [string, ReactNode][] = [
    ['Paper', file || <span className="text-faint">Not uploaded</span>],
    ['Batches', batchIds.length ? `${batchIds.length} · ${enrolled} students` : <span className="text-faint">None</span>],
    ['Type', mode === 'timed' ? 'Timed exam' : 'Open practice'],
    ['Window', mode === 'timed' ? (timingOk ? `${fmtDateTime(opensAt)} → ${fmtDateTime(closesAt)}` : <span className="text-bad">Deadline must be after opening</span>) : `From ${practiceFrom}${practiceTo ? ` to ${practiceTo}` : ''}`],
    ['Results', POLICY[policy].short],
  ];

  return (
    <Page crumbs={[{ label: 'Exams', href: href({ page: 'exams' }) }, { label: 'Create exam' }]} width="wide">
      <PageHeader title="Create exam" desc="Nothing reaches students until the exam opens." />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Section n={1} title="Question paper" desc="One Word file with questions, steps, marks, ICAI keywords and model answers." done={!!title.trim() && !!file}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="x-title"><Input id="x-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="PGBP Unit Test 1" /></Field>
              <Field label="Subject" htmlFor="x-subj"><Select id="x-subj" value={subject} onChange={(e) => setSubject(e.target.value)}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            </div>
            {file ? (
              <div className="flex items-center gap-3 rounded-md border border-border bg-subtle px-3 py-2.5">
                <FileText className="size-4 text-accent" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{file}</span>
                <Badge tone="good">Attached</Badge>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => setFile('')} aria-label="Remove file"><X /></Button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-md border border-dashed border-border-strong bg-subtle px-4 py-7 text-center transition hover:border-accent/60 hover:bg-accent-soft/40">
                <Upload className="size-5 text-muted" />
                <span className="text-sm font-medium">Upload question paper</span>
                <span className="text-xs text-muted">.docx, .pdf or .xlsx · questions are read when the exam is saved</span>
                <input id="x-file" type="file" accept=".docx,.pdf,.xlsx" className="sr-only" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return; setFile(f.name);
                  if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
                }} />
              </label>
            )}
          </Section>

          <Section n={2} title="Students" desc="Everyone in the chosen batches sees this exam in the app." done={batchIds.length > 0}>
            {batches.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {batches.map((b) => (
                  <Checkbox key={b.id} id={`x-b-${b.id}`} checked={batchIds.includes(b.id)} label={b.name}
                    desc={`${b.course} · ${students.filter((s) => s.batchId === b.id).length} students`}
                    onChange={(v) => setBatchIds(v ? [...batchIds, b.id] : batchIds.filter((x) => x !== b.id))} />
                ))}
              </div>
            ) : <p className="text-sm text-muted">No batches yet.</p>}
            <Button size="sm" variant="ghost" onClick={() => open('batch')}><Plus /> New batch</Button>
          </Section>

          <Section n={3} title="Timing" desc="A fixed window with a deadline, or an open practice paper." done={timingOk}>
            <Segmented value={mode} onChange={setMode} options={[{ value: 'timed', label: 'Timed exam' }, { value: 'practice', label: 'Open practice' }]} />
            {mode === 'timed' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Opens" htmlFor="x-open"><Input id="x-open" type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} /></Field>
                  <Field label="Deadline" htmlFor="x-close" hint={!timingOk && <span className="text-bad">Must be after the opening time</span>}><Input id="x-close" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} /></Field>
                  <Field label="Late uploads" htmlFor="x-late"><Select id="x-late" value={late} onChange={(e) => setLate(e.target.value as Late)}>{Object.entries(LATE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2.5">
                  <div><div className="text-sm font-medium">Separate window for each question</div><div className="text-xs text-muted">Release questions one at a time, each with its own deadline.</div></div>
                  <Switch id="x-perq" label="Separate window for each question" checked={perQuestion} onCheckedChange={setPerQuestion} />
                </div>
                {perQuestion && (
                  <div className="overflow-x-auto rounded-md border border-border scroll-thin">
                    <div className="flex items-center gap-3 border-b border-border bg-subtle px-3 py-2">
                      <label htmlFor="x-nq" className="text-xs font-medium">Questions</label>
                      <Input id="x-nq" type="number" min={1} max={20} value={questionCount} onChange={(e) => setQuestionCount(Math.max(1, Math.min(20, +e.target.value || 1)))} className="h-7 w-16" />
                      <span className="text-xs text-muted">Matched to the paper once it’s read.</span>
                    </div>
                    <table className="w-full min-w-[520px] text-sm">
                      <thead><tr className="text-left text-xs text-muted"><th className="px-3 py-2 font-medium">Question</th><th className="px-3 py-2 font-medium">Opens</th><th className="px-3 py-2 font-medium">Deadline</th></tr></thead>
                      <tbody>{Array.from({ length: questionCount }, (_, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">Q{i + 1}</td>
                          <td className="px-3 py-2"><Input id={`x-q${i}-o`} aria-label={`Q${i + 1} opens`} type="datetime-local" defaultValue={opensAt} className="h-7" /></td>
                          <td className="px-3 py-2"><Input id={`x-q${i}-c`} aria-label={`Q${i + 1} deadline`} type="datetime-local" defaultValue={closesAt} className="h-7" /></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Available from" htmlFor="x-pf"><Input id="x-pf" type="date" value={practiceFrom} onChange={(e) => setPracticeFrom(e.target.value)} /></Field>
                <Field label="Available until" htmlFor="x-pt" optional><Input id="x-pt" type="date" value={practiceTo} onChange={(e) => setPracticeTo(e.target.value)} /></Field>
                <Field label="Attempts" htmlFor="x-att"><Select id="x-att" value={attempts} onChange={(e) => setAttempts(e.target.value as typeof attempts)}><option value="unlimited">Unlimited</option><option value="1">1 attempt</option><option value="3">Up to 3</option></Select></Field>
              </div>
            )}
          </Section>

          <Section n={4} title="Results" desc="When students see marks, who reviews, and what the result shows." done>
            <div className="space-y-2">
              {(['clean', 'auto', 'manual'] as Policy[]).map((p) => (
                <RadioCard key={p} id={`x-pol-${p}`} name="policy" checked={policy === p} onChange={() => setPolicy(p)} title={POLICY[p].title} desc={POLICY[p].desc} badge={p === 'clean' ? 'Recommended' : undefined} />
              ))}
            </div>
            <Field label="Reviewer" htmlFor="x-rev" hint={reviewers.length ? 'Flagged scripts go to this person’s queue.' : 'Invite reviewers in Settings → Team.'} className="sm:max-w-xs">
              <Select id="x-rev" value={reviewerId} onChange={(e) => setReviewerId(e.target.value)}><option value="">Any reviewer</option>{reviewers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select>
            </Field>
            <div className="divide-y divide-border rounded-md border border-border">
              {([['steps', 'Marks for each step'], ['needed', 'What was needed for each lost step'], ['model', 'Model answer, after the deadline'], ['rank', 'Rank in the batch']] as [keyof See, string][]).map(([k, l]) => (
                <div key={k} className="flex items-center justify-between gap-4 px-3 py-2.5">
                  <label htmlFor={`x-see-${k}`} className="text-sm">{l}</label>
                  <Switch id={`x-see-${k}`} checked={see[k]} onCheckedChange={(v) => setSee({ ...see, [k]: v })} />
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="xl:sticky xl:top-16">
          <Card>
            <div className="border-b border-border px-4 py-3"><h3 className="text-sm font-semibold">{title.trim() || 'Untitled exam'}</h3><p className="text-xs text-muted">{subject}</p></div>
            <dl className="space-y-2.5 px-4 py-3 text-sm">
              {summary.map(([k, v]) => <div key={k} className="grid grid-cols-[72px_minmax(0,1fr)] gap-2"><dt className="text-xs text-muted">{k}</dt><dd className="min-w-0 break-words text-xs">{v}</dd></div>)}
            </dl>
            <div className="space-y-2 border-t border-border p-3">
              {missing.length > 0 && <p className="px-1 text-xs text-muted">Add {missing.join(', ')} to schedule.</p>}
              <Button variant="primary" className="w-full" disabled={missing.length > 0} onClick={() => save(false)}>Schedule exam</Button>
              <Button className="w-full" disabled={!title.trim()} onClick={() => save(true)}>Save as draft</Button>
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  );
}
