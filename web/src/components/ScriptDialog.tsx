// One student's answer script: AI-suggested marks, per-question marks, the final marks, examiner comment,
// and a "Mark reviewed" step. Every change is recorded with who made it and when (shown below), so the
// Academy Admin can see who changed marks.
import { Check, FileText, History } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { QTYPE, groupsOf, partLabel } from '../lib/banks';
import type { Script } from '../lib/scripts';
import { useStore } from '../lib/store';
import { fmtDateTime } from '../lib/utils';
import { Avatar, Badge, Button, Dialog, Field, Input, Textarea } from './ui';

export const SCRIPT_STATUS: Record<Script['status'], { label: string; tone: 'neutral' | 'warn' | 'pop' | 'ink' | 'bad' }> = {
  missing: { label: 'Not submitted', tone: 'neutral' }, ai: { label: 'AI marked', tone: 'ink' }, flagged: { label: 'Needs review', tone: 'warn' },
  reviewed: { label: 'Reviewed', tone: 'pop' }, published: { label: 'Published', tone: 'pop' },
};

export function ScriptDialog({ s, onClose }: { s: Script; onClose: () => void }) {
  const { exams, banks, markScript } = useStore();
  const labels = new Map(groupsOf(banks, s.perQuestion.map((p) => p.id)).flatMap((g) => g.parts.map((p) => [p.id, { label: partLabel(g, p), text: p.text, type: g.q.type }] as const)));
  const e = exams.find((x) => x.id === s.examId)!;
  const [marks, setMarks] = useState(s.marks), [comment, setComment] = useState(s.comment ?? '');
  const [per, setPer] = useState(s.perQuestion);
  const changed = marks !== s.marks || comment !== (s.comment ?? '');
  const save = (reviewed: boolean) => {
    markScript(s.key, { ...(marks !== s.marks ? { marks, from: s.marks } : {}), ...(comment !== (s.comment ?? '') ? { comment } : {}), ...(reviewed ? { reviewed: true } : {}) });
    toast.success(reviewed ? 'Marked as reviewed' : 'Changes saved', { description: marks !== s.marks ? `Marks ${s.marks} → ${marks}. Recorded with your name.` : undefined });
    onClose();
  };
  const setQ = (i: number, v: number) => { const next = per.map((p, k) => (k === i ? { ...p, marks: Math.max(0, Math.min(p.max, v)) } : p)); setPer(next); setMarks(next.reduce((a, p) => a + p.marks, 0)); };
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={e.title} desc={`${e.subject} · out of ${s.max} marks`}
      footer={<><Button onClick={onClose}>Close</Button><Button disabled={!changed} onClick={() => save(false)}>Save changes</Button>{s.status !== 'reviewed' && s.status !== 'published' && <Button variant="primary" onClick={() => save(true)}><Check /> Mark reviewed</Button>}</>}>
      <div className="space-y-5 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name={s.student.name} src={undefined} /><div className="min-w-0 flex-1"><div className="font-semibold">{s.student.name}</div><div className="text-2xs text-muted"><span className="font-mono">{s.student.studentId}</span>{s.at && ` · submitted ${fmtDateTime(s.at)}`}</div></div>
          {s.late && <Badge tone="warn">Late</Badge>}<Badge tone={SCRIPT_STATUS[s.status].tone}>{SCRIPT_STATUS[s.status].label}</Badge>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-subtle px-3 py-2.5"><FileText className="size-4" /><span className="min-w-0 flex-1 truncate text-sm">{s.file}</span><Button size="sm" onClick={() => toast('Answer sheets open once the server is connected')}>Open answer sheet</Button></div>
        {per.length > 0 && (
          <section>
            <h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">Marks by question</h4>
            <ul className="divide-y divide-border rounded-xl ring-1 ring-inset ring-border">{per.map((p, i) => { const q = labels.get(p.id); return (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-11 shrink-0 text-xs font-bold">{q?.label ?? `Q${i + 1}`}</span>
                <span className="min-w-0 flex-1"><span className="line-clamp-1">{q?.text}</span><span className="text-2xs text-muted">{q ? QTYPE[q.type] : ''}{q && q.type !== 'mcq' && ' · evaluated against the model answer'}</span></span>
                <Input type="number" min={0} max={p.max} step={0.5} value={p.marks} onChange={(ev) => setQ(i, +ev.target.value)} disabled={q?.type === 'mcq'} className="h-8 w-20 text-right" aria-label={`Marks for ${q?.label ?? `question ${i + 1}`}`} />
                <span className="w-10 text-xs text-muted">/ {p.max}</span>
              </li>
            ); })}</ul>
            <p className="mt-1 text-2xs text-muted">MCQs are marked automatically{e.negative ? `, with −${e.negative} for each wrong answer` : ''}.</p>
          </section>
        )}
        <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
          <Field label="Final marks" hint={`AI suggested ${s.aiMarks}`}><Input type="number" min={0} max={s.max} step={0.5} value={marks} onChange={(ev) => setMarks(Math.max(0, Math.min(s.max, +ev.target.value)))} /></Field>
          <Field label="Feedback and examiner comments" optional><Textarea value={comment} onChange={(ev) => setComment(ev.target.value)} placeholder="Good working notes; lost marks for the missing provision in step 3." className="min-h-20" /></Field>
        </div>
        {s.history.length > 0 && (
          <section>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-faint"><History className="size-3" />Change history</h4>
            <ul className="space-y-1 text-xs">{[...s.history].reverse().map((h, i) => (
              <li key={i} className="rounded-lg bg-subtle px-3 py-1.5">{[h.marks !== undefined && `Marks ${h.from ?? '—'} → ${h.marks}`, h.comment && 'Comment updated', h.reviewed && 'Marked reviewed'].filter(Boolean).join(' · ')} <span className="text-muted">by {h.by} · {fmtDateTime(h.at)}</span></li>
            ))}</ul>
          </section>
        )}
      </div>
    </Dialog>
  );
}
