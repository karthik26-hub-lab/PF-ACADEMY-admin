// A test's questions in order: Q1, Q2 (a) (b)… A case passage or group heading shows once, with only the parts
// the test uses. MCQs list their options (1 to 6) with the correct one marked and the explanations.
// `rounding` marks the parts added to round off the total marks.
import { Check, Paperclip } from 'lucide-react';
import { QFORMAT, QTYPE, attachments, groupsOf, sourceLabel, sourceOf, subjectOfPart } from '../lib/banks';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { Badge } from './ui';

const open = (name: string) => { const f = attachments.get(name); if (f) window.open(URL.createObjectURL(f), '_blank', 'noopener'); };

export function QuestionList({ partIds, rounding = [] }: { partIds: string[]; rounding?: string[] }) {
  const { banks, courses } = useStore();
  const subjects = courses.flatMap((c) => c.subjects);
  const groups = groupsOf(banks, partIds);
  if (!groups.length) return <p className="p-4 text-center text-xs text-muted">No questions.</p>;
  return (
    <ol className="space-y-3">{groups.map((g) => (
      <li key={g.q.id} className="rounded-2xl ring-1 ring-inset ring-border">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2 text-2xs">
          <b className="mr-1 text-sm">Q{g.n}</b><Badge>{QTYPE[g.q.type]}</Badge><Badge tone={g.q.format === 'case' ? 'pop' : 'neutral'}>{QFORMAT[g.q.format]}</Badge>
          <span className="truncate text-muted">{sourceLabel(sourceOf(g.q, g.bank))}</span><b className="tnum ml-auto">{g.parts.reduce((a, p) => a + p.marks, 0)} marks</b>
        </div>
        {g.q.stem && <p className="whitespace-pre-line border-b border-border bg-subtle px-3 py-2 text-xs leading-relaxed">{g.q.stem}</p>}
        <ul className="divide-y divide-border">{g.parts.map((p) => { const s = subjects.find((x) => x.id === subjectOfPart(p, g.bank)); return (
          <li key={p.id} className="flex items-start gap-3 px-3 py-2 text-sm">
            {g.q.parts.length > 1 && <span className="w-5 shrink-0 font-semibold">({p.label})</span>}
            <span className="min-w-0 flex-1 space-y-1.5">
              <span className="block">{p.text}</span>
              {p.options && <span className="grid gap-1 sm:grid-cols-2">{p.options.map((o, i) => (
                <span key={i} className={cn('flex items-center gap-2 rounded-lg px-2 py-1 text-xs ring-1 ring-inset', i === p.answer ? 'bg-pop/10 font-medium ring-pop/40' : 'ring-border')}>
                  <b className="w-3">{'ABCDEF'[i]}</b><span className="flex-1">{o}</span>{i === p.answer && <Check className="size-3.5 text-pop" />}</span>
              ))}</span>}
              {(p.explanation || p.wrongExplanation) && <span className="block text-2xs text-muted">{p.explanation && <><b className="text-fg">Why it’s right:</b> {p.explanation} </>}{p.wrongExplanation && <><b className="text-fg">Why the others are wrong:</b> {p.wrongExplanation}</>}</span>}
              <span className="flex flex-wrap items-center gap-1.5 text-2xs text-muted">
                <span>{s?.name} › {s?.chapters.find((c) => c.id === p.chapterId)?.name ?? 'No chapter'}{p.concept && ` · ${p.concept}`}</span>
                {p.files?.map((f) => <button key={f} type="button" onClick={() => open(f)} disabled={!attachments.has(f)} className="inline-flex items-center gap-1 rounded-full px-1.5 ring-1 ring-inset ring-border enabled:hover:text-fg"><Paperclip className="size-3" />{f}</button>)}
                {rounding.includes(p.id) && <Badge tone="warn">Added to round off marks</Badge>}
              </span>
            </span>
            <span className="tnum shrink-0 text-xs font-semibold">{p.marks} m</span>
          </li>
        ); })}</ul>
      </li>
    ))}</ol>
  );
}
