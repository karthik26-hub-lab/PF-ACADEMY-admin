import { BarChart3, BookOpenCheck, ChevronsUpDown, ClipboardCheck, FileText, Layers, LayoutGrid, LogOut, Monitor, Moon, PanelLeft, Plus, Search, Settings, Sun, Users } from 'lucide-react';
import type { ElementType } from 'react';
import { cn, initials } from '../../lib/utils';
import { href, type Route } from '../../lib/router';
import { useStore } from '../../lib/store';
import { useUI } from '../../lib/ui-state';
import { Avatar, DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger, Kbd, Tip } from '../ui';

type Item = { route: Route; label: string; icon: ElementType; match: Route['page'][]; count?: number };

export function Sidebar({ route }: { route: Route }) {
  const { academy, me, students, batches, joinRequests, signOut } = useStore();
  const { collapsed, toggleCollapsed, open, theme, setTheme, mobileNav, setMobileNav } = useUI();
  const groups: { label?: string; items: Item[] }[] = [
    { items: [
      { route: { page: 'overview' }, label: 'Overview', icon: LayoutGrid, match: ['overview'] },
      { route: { page: 'reviews' }, label: 'Reviews', icon: ClipboardCheck, match: ['reviews'] },
    ] },
    { label: 'Teaching', items: [
      { route: { page: 'exams' }, label: 'Exams', icon: FileText, match: ['exams', 'exam', 'exam-new'] },
      { route: { page: 'reports' }, label: 'Reports', icon: BarChart3, match: ['reports'] },
    ] },
    { label: 'People', items: [
      { route: { page: 'students' }, label: 'Students', icon: Users, match: ['students', 'student', 'join-requests'], count: joinRequests.length || undefined },
      { route: { page: 'batches' }, label: 'Batches', icon: Layers, match: ['batches'], count: undefined },
    ] },
  ];
  const settingsActive = route.page === 'settings';
  const c = collapsed && !mobileNav;
  const name = academy.name || 'Your academy';

  const link = (it: Item) => {
    const active = it.match.includes(route.page);
    const a = (
      <a key={it.label} href={href(it.route)} onClick={() => setMobileNav(false)} aria-current={active ? 'page' : undefined}
        className={cn('group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors',
          active ? 'bg-panel text-fg shadow-xs ring-1 ring-border' : 'text-muted hover:bg-hover hover:text-fg', c && 'justify-center px-0')}>
        <it.icon className={cn('size-4 shrink-0', active ? 'text-fg' : 'text-faint group-hover:text-muted')} />
        {!c && <span className="truncate">{it.label}</span>}
        {!c && it.count ? <span className="tnum ml-auto rounded bg-accent px-1.5 text-2xs font-semibold text-accent-fg">{it.count}</span> : null}
      </a>
    );
    return c ? <Tip key={it.label} label={it.label}>{a}</Tip> : a;
  };

  return (
    <>
      {mobileNav && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setMobileNav(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-subtle transition-[width,transform] duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0',
        c ? 'w-[56px]' : 'w-[240px]', mobileNav ? 'translate-x-0 shadow-pop' : '-translate-x-full')}>
        {/* academy switcher */}
        <div className="p-2">
          <DropdownMenu>
            <DropdownTrigger className={cn('flex h-10 w-full items-center gap-2 rounded-md px-1.5 text-left transition hover:bg-hover', c && 'justify-center px-0')}>
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-fg text-[11px] font-semibold text-bg">{academy.name ? initials(academy.name) : 'PF'}</span>
              {!c && <><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold leading-tight">{name}</span><span className="block truncate text-2xs text-muted">Parallax Flow</span></span><ChevronsUpDown className="size-3.5 text-faint" /></>}
            </DropdownTrigger>
            <DropdownContent align="start" className="w-60">
              <DropdownLabel>Academy</DropdownLabel>
              <DropdownItem onSelect={() => (location.hash = href({ page: 'settings', tab: 'general' }))}><Settings /> Academy settings</DropdownItem>
              <DropdownItem onSelect={() => (location.hash = href({ page: 'settings', tab: 'team' }))}><Users /> Team &amp; roles</DropdownItem>
              <DropdownSeparator />
              <DropdownItem onSelect={signOut}><LogOut /> Sign out</DropdownItem>
            </DropdownContent>
          </DropdownMenu>
        </div>

        {/* search + quick create */}
        <div className={cn('flex gap-1.5 px-2 pb-2', c && 'flex-col')}>
          <button onClick={() => open('command')} className={cn('flex h-8 flex-1 items-center gap-2 rounded-md border border-border bg-panel px-2 text-sm text-faint shadow-xs transition hover:text-muted', c && 'justify-center px-0')} aria-label="Search">
            <Search className="size-4" />{!c && <><span>Search…</span><Kbd className="ml-auto">Ctrl K</Kbd></>}
          </button>
          {!c && <Tip label="Create exam"><a href={href({ page: 'exam-new' })} className="grid size-8 place-items-center rounded-md border border-border bg-panel text-muted shadow-xs transition hover:text-fg" aria-label="Create exam"><Plus className="size-4" /></a></Tip>}
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-1 scroll-thin">
          {groups.map((g, i) => (
            <div key={i} className="space-y-0.5">
              {g.label && !c && <div className="px-2 pb-1 text-2xs font-medium text-faint">{g.label}</div>}
              {g.items.map(link)}
            </div>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-border p-2">
          {link({ route: { page: 'settings', tab: 'general' }, label: 'Settings', icon: Settings, match: settingsActive ? ['settings'] : [] })}
          <DropdownMenu>
            <DropdownTrigger className={cn('flex h-10 w-full items-center gap-2 rounded-md px-1.5 text-left transition hover:bg-hover', c && 'justify-center px-0')}>
              <Avatar name={me.name || me.email || 'Admin'} />
              {!c && <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium leading-tight">{me.name || 'Academy admin'}</span><span className="block truncate text-2xs text-muted">{me.email || 'Admin'}</span></span>}
            </DropdownTrigger>
            <DropdownContent align="start" className="w-56">
              <DropdownLabel>Theme</DropdownLabel>
              {([['light', Sun, 'Light'], ['dark', Moon, 'Dark'], ['system', Monitor, 'System']] as const).map(([t, Icon, l]) => (
                <DropdownItem key={t} onSelect={() => setTheme(t)}><Icon /> {l}{theme === t && <span className="ml-auto text-accent">●</span>}</DropdownItem>
              ))}
              <DropdownSeparator />
              <DropdownItem onSelect={toggleCollapsed}><PanelLeft /> {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</DropdownItem>
              <DropdownItem onSelect={signOut}><LogOut /> Sign out</DropdownItem>
            </DropdownContent>
          </DropdownMenu>
          {!c && (
            <div className="flex items-center gap-1.5 px-2 pt-1 text-2xs text-faint">
              <BookOpenCheck className="size-3" /> {batches.length} batches · {students.length} students
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
