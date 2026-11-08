import { Layers, MoreHorizontal, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { Badge, Button, Card, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger, EmptyState, PageHeader, Table, Td, Th, btn } from '../components/ui';
import { useStore, type Batch } from '../lib/store';
import { useUI } from '../lib/ui-state';
import { fmtDate } from '../lib/utils';

export function Batches() {
  const { batches, students, exams, members, deleteBatch } = useStore();
  const open = useUI((u) => u.open);
  const [del, setDel] = useState<Batch | null>(null);
  const count = (id: string) => students.filter((s) => s.batchId === id).length;

  return (
    <Page crumbs={[{ label: 'Batches' }]} actions={<Button size="sm" variant="primary" onClick={() => open('batch')}><Plus /> New batch</Button>}>
      <PageHeader title="Batches" desc="Students belong to a batch. Exams are given to one or more batches." />
      <Card>
        {batches.length ? (
          <Table>
            <thead><tr><Th>Batch</Th><Th>Course</Th><Th className="text-right">Students</Th><Th className="text-right">Exams</Th><Th>Faculty</Th><Th>Created</Th><Th className="w-10" /></tr></thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="transition hover:bg-hover">
                  <Td className="font-medium">{b.name}</Td>
                  <Td><Badge>{b.course}</Badge></Td>
                  <Td className="tnum text-right">{count(b.id)}</Td>
                  <Td className="tnum text-right">{exams.filter((e) => e.batchIds.includes(b.id)).length}</Td>
                  <Td className="text-muted">{members.find((m) => m.id === b.facultyId)?.name || '—'}</Td>
                  <Td className="text-xs text-muted">{fmtDate(b.createdAt)}</Td>
                  <Td>
                    <DropdownMenu>
                      <DropdownTrigger className={btn('ghost', 'icon', 'size-7')} aria-label={`Actions for ${b.name}`}><MoreHorizontal /></DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onSelect={() => open('student', b.id)}><UserPlus /> Add student</DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem danger onSelect={() => setDel(b)}><Trash2 /> Delete batch</DropdownItem>
                      </DropdownContent>
                    </DropdownMenu>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={Layers} title="No batches yet" action={<Button size="sm" variant="primary" onClick={() => open('batch')}><Plus /> New batch</Button>}>
            For example “CA Inter · May 2027 · Batch A”. Add students to it, then give it exams.
          </EmptyState>
        )}
      </Card>
      <Dialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this batch?"
        desc={del ? `“${del.name}” and its ${count(del.id)} student login(s) will be removed. This can’t be undone.` : ''}
        footer={<><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (del) { deleteBatch(del.id); toast('Batch deleted'); } setDel(null); }}>Delete batch</Button></>} />
      {batches.length > 0 && <p className="mt-3 flex items-center gap-1.5 text-xs text-faint"><Users className="size-3" /> {students.length} students across {batches.length} batches</p>}
    </Page>
  );
}
