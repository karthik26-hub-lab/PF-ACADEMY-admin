import { ClipboardCheck, Flag, PauseCircle, ScanLine } from 'lucide-react';
import { useState } from 'react';
import { Page } from '../components/layout/Page';
import { Card, EmptyState, PageHeader, Segmented } from '../components/ui';

export function Reviews() {
  const [filter, setFilter] = useState<'waiting' | 'flagged' | 'held' | 'done'>('waiting');
  return (
    <Page crumbs={[{ label: 'Reviews' }]}>
      <PageHeader title="Reviews" desc="Only scripts that need a faculty eye. Clean scripts follow each exam’s results rule." />
      <Card>
        <div className="border-b border-border p-3">
          <Segmented value={filter} onChange={setFilter} options={[
            { value: 'waiting', label: 'Waiting', count: 0 }, { value: 'flagged', label: 'Flagged by AI', count: 0 },
            { value: 'held', label: 'Held for faculty', count: 0 }, { value: 'done', label: 'Done', count: 0 },
          ]} />
        </div>
        <EmptyState icon={ClipboardCheck} title={filter === 'done' ? 'Nothing reviewed yet' : 'No scripts to review'}>
          Scripts arrive here after students upload and the AI marks them.
        </EmptyState>
        <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
          {[
            [ScanLine, 'Unclear reading', 'A figure or word the AI couldn’t read with confidence.'],
            [Flag, 'Low-confidence marks', 'A step mark the AI isn’t sure about, or evidence it couldn’t find.'],
            [PauseCircle, 'Held by the exam', 'Exams set to “Hold everything for faculty”.'],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Flag;
            return (
              <div key={t as string} className="flex gap-3 bg-panel p-4">
                <I className="mt-0.5 size-4 shrink-0 text-faint" />
                <div><div className="text-sm font-medium">{t as string}</div><div className="text-xs text-muted">{d as string}</div></div>
              </div>
            );
          })}
        </div>
      </Card>
    </Page>
  );
}
