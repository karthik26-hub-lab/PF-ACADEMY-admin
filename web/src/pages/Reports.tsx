import { BarChart3, GitCompareArrows, ListOrdered, Target, TrendingUp } from 'lucide-react';
import { Page } from '../components/layout/Page';
import { Card, EmptyState, PageHeader, btn } from '../components/ui';
import { href } from '../lib/router';

export function Reports() {
  const coming = [
    [TrendingUp, 'Score distribution', 'How marks spread across the batch for each exam.'],
    [ListOrdered, 'Average by question', 'Which questions the batch found hardest.'],
    [Target, 'Most-lost steps', 'The steps most students lose marks on, to revisit in class.'],
    [GitCompareArrows, 'AI vs faculty', 'How often reviewers change the AI’s marks, and by how much.'],
  ] as const;
  return (
    <Page crumbs={[{ label: 'Reports' }]}>
      <PageHeader title="Reports" desc="How exams went, where students lose marks, and how well the AI agrees with your faculty." />
      <Card>
        <EmptyState icon={BarChart3} title="No reports yet" action={<a href={href({ page: 'exams' })} className={btn('secondary', 'sm')}>Go to exams</a>}>
          Reports fill in once the first exam has been marked.
        </EmptyState>
        <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
          {coming.map(([Icon, t, d]) => (
            <div key={t} className="flex gap-3 bg-panel p-4"><Icon className="mt-0.5 size-4 shrink-0 text-faint" /><div><div className="text-sm font-medium">{t}</div><div className="text-xs text-muted">{d}</div></div></div>
          ))}
        </div>
      </Card>
    </Page>
  );
}
