import { Command } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { BarChart3, ClipboardCheck, FileText, Layers, LayoutGrid, Moon, Plus, Settings, Sun, Upload, UserPlus, Users } from 'lucide-react';
import { useEffect, type ElementType } from 'react';
import { navigate, type Route } from '../../lib/router';
import { useStore } from '../../lib/store';
import { useUI } from '../../lib/ui-state';
import { Avatar, Kbd } from '../ui';

export function CommandMenu() {
  const { dialog, open, close, theme, setTheme } = useUI();
  const { exams, students, batches } = useStore();
  const isOpen = dialog === 'command';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); isOpen ? close() : open('command'); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [isOpen, open, close]);

  const go = (r: Route) => { close(); navigate(r); };
  const item = (value: string, Icon: ElementType, label: string, run: () => void, hint?: string) => (
    <Command.Item key={value} value={value} onSelect={run}
      className="flex h-9 cursor-default items-center gap-2.5 rounded-md px-2.5 text-sm text-fg aria-selected:bg-hover [&_svg]:size-4 [&_svg]:text-muted">
      <Icon />{label}{hint && <span className="ml-auto text-xs text-faint">{hint}</span>}
    </Command.Item>
  );
  const dark = document.documentElement.classList.contains('dark');

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(v) => (v ? open('command') : close())}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed left-1/2 top-[14vh] z-50 w-[calc(100vw-32px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg bg-panel shadow-pop data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out">
          <DialogPrimitive.Title className="sr-only">Search and commands</DialogPrimitive.Title>
          <Command loop className="flex flex-col">
            <Command.Input autoFocus placeholder="Search exams, students, batches, or type a command…" className="h-12 border-b border-border bg-transparent px-4 text-sm outline-none placeholder:text-faint" />
            <Command.List className="max-h-[52vh] overflow-y-auto p-1.5 scroll-thin">
              <Command.Empty className="py-10 text-center text-sm text-muted">No results.</Command.Empty>
              <Command.Group heading="Create" className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint">
                {item('create exam', Plus, 'Create exam', () => go({ page: 'exam-new' }))}
                {item('add student', UserPlus, 'Add student', () => open('student'))}
                {item('import students excel', Upload, 'Import students from Excel', () => open('import'))}
                {item('new batch', Layers, 'New batch', () => open('batch'))}
                {item('invite faculty team', Users, 'Invite to team', () => open('invite'))}
              </Command.Group>
              <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint">
                {item('dashboard home overview', LayoutGrid, 'Dashboard', () => go({ page: 'overview' }))}
                {item('academics', Layers, 'Academics', () => go({ page: 'academics' }))}
                {item('batches', Layers, 'Batches', () => go({ page: 'batches' }))}
                {item('students directory', Users, 'Students', () => go({ page: 'students' }))}
                {item('faculty teachers', Users, 'Faculty', () => go({ page: 'faculty' }))}
                {item('academic calendar schedule', FileText, 'Academic calendar', () => go({ page: 'calendar' }))}
                {item('learning courses materials', FileText, 'Learning', () => go({ page: 'learning' }))}
                {item('assessments tests exams', ClipboardCheck, 'Assessments', () => go({ page: 'assessments' }))}
                {item('reports', BarChart3, 'Reports', () => go({ page: 'reports' }))}
                {item('settings profile', Settings, 'Settings', () => go({ page: 'settings', tab: 'general' }))}
              </Command.Group>
              {exams.length > 0 && <Command.Group heading="Exams" className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint">
                {exams.map((e) => item(`exam ${e.title} ${e.id}`, FileText, e.title, () => go({ page: 'exam', id: e.id }), e.subject))}
              </Command.Group>}
              {students.length > 0 && <Command.Group heading="Students" className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint">
                {students.slice(0, 300).map((s) => (
                  <Command.Item key={s.id} value={`student ${s.name} ${s.roll} ${s.id}`} onSelect={() => go({ page: 'student', id: s.id })}
                    className="flex h-9 cursor-default items-center gap-2.5 rounded-md px-2.5 text-sm aria-selected:bg-hover">
                    <Avatar name={s.name} size="sm" />{s.name}<span className="ml-auto font-mono text-xs text-faint">{s.roll}</span>
                  </Command.Item>
                ))}
              </Command.Group>}
              {batches.length > 0 && <Command.Group heading="Batches" className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint">
                {batches.map((b) => item(`batch ${b.name} ${b.id}`, Layers, b.name, () => go({ page: 'batch', id: b.id }), b.course))}
              </Command.Group>}
              <Command.Group heading="Preferences" className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint">
                {item('theme toggle dark light', dark ? Sun : Moon, dark ? 'Switch to light theme' : 'Switch to dark theme', () => { setTheme(dark ? 'light' : 'dark'); close(); }, theme === 'system' ? 'Following system' : undefined)}
              </Command.Group>
            </Command.List>
            <div className="flex items-center gap-3 border-t border-border bg-subtle/60 px-3 py-2 text-2xs text-faint">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> move</span>
              <span className="flex items-center gap-1"><Kbd>Enter</Kbd> open</span>
              <span className="flex items-center gap-1"><Kbd>Esc</Kbd> close</span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
