import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Bell, BookOpen, Building2, ClipboardList, CreditCard, Database, GraduationCap, KeyRound, LayoutGrid, LogOut, Moon, Plug, Search, ShieldCheck, Sun, UserCog, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { href, sectionOf, type Route, type Section } from '../../lib/router';
import { useStore } from '../../lib/store';
import { useUI } from '../../lib/ui-state';
import { cn, initials, timeAgo } from '../../lib/utils';
import { Avatar, Button, DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger, Kbd, Tip } from '../ui';

const NAV: { id: Section; label: string; route: Route; icon: typeof LayoutGrid }[] = [
  { id: 'dashboard', label: 'Dashboard', route: { page: 'overview' }, icon: LayoutGrid },
  { id: 'academics', label: 'Academics', route: { page: 'academics' }, icon: GraduationCap },
  { id: 'learning', label: 'Learning', route: { page: 'learning' }, icon: BookOpen },
  { id: 'assessments', label: 'Assessments', route: { page: 'assessments' }, icon: ClipboardList },
  { id: 'store', label: 'Store', route: { page: 'store', tab: 'pf' }, icon: ShoppingBag },
  { id: 'reports', label: 'Reports', route: { page: 'reports' }, icon: Users },
];

export const SETTINGS_TABS = [
  ['general', 'Academy profile', Building2], ['access', 'User access', Users], ['roles', 'Roles & permissions', UserCog],
  ['notifications', 'Notifications', Bell], ['integrations', 'Integrations', Plug], ['security', 'Security', ShieldCheck],
  ['subscription', 'Subscription', CreditCard], ['store', 'Store rules', ShoppingBag], ['exams', 'Exam defaults', ClipboardList], ['data', 'Data', Database],
] as const;

function ThemeToggle() {
  const setTheme = useUI((s) => s.setTheme);
  useUI((s) => s.theme);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const mo = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <Tip label={label} side="bottom">
      <Button variant="secondary" size="icon" aria-label={label} onClick={() => setTheme(dark ? 'light' : 'dark')} className="relative overflow-hidden border-transparent bg-panel">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={dark ? 'moon' : 'sun'} initial={{ y: 14, opacity: 0, rotate: -40 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: -14, opacity: 0, rotate: 40 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="grid place-items-center">{dark ? <Moon /> : <Sun />}</motion.span>
        </AnimatePresence>
      </Button>
    </Tip>
  );
}

export function TopNav({ route }: { route: Route }) {
  const { academy, me, sample, signOut, activity, feed } = useStore();
  const open = useUI((u) => u.open);
  const active = sectionOf(route);
  const notes = [...activity.map((a) => ({ text: a.text, at: a.at })), ...feed.studentActs.map((a) => ({ text: `A student ${a.text}`, at: a.at }))].sort((a, b) => b.at - a.at).slice(0, 8);

  const navLinks = (mobile = false) => NAV.map((n) => {
    const on = active === n.id;
    return (
      <a key={n.id} href={href(n.route)} aria-current={on ? 'page' : undefined}
        className={cn('relative flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200', on ? 'text-bg' : 'text-muted hover:text-fg')}>
        {on && <motion.span layoutId={mobile ? 'topnav-m' : 'topnav'} transition={{ type: 'spring', stiffness: 480, damping: 38 }} className="absolute inset-0 rounded-full bg-fg" />}
        <n.icon className="relative size-4" /><span className="relative">{n.label}</span>
      </a>
    );
  });

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 md:px-6">
      <div className="mx-auto max-w-[1400px] rounded-full bg-panel/90 px-2 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] backdrop-blur-xl dark:ring-white/[0.06]">
        <div className="flex items-center gap-2">
          <a href={href({ page: 'overview' })} className="flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1.5 pr-3">
            <span className="grid size-9 place-items-center rounded-full bg-fg text-xs font-bold text-bg">{academy.name ? initials(academy.name) : 'PF'}</span>
            <span className="hidden leading-tight sm:block"><span className="block text-sm font-bold tracking-tight">{academy.name || 'Your academy'}</span><span className="block text-2xs text-muted">Parallax Flow</span></span>
          </a>
          <nav aria-label="Main" className="mx-auto hidden items-center gap-1 lg:flex">{navLinks()}</nav>
          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            {sample && (
              <Tip label="Made-up figures for the preview. Clear them in Settings → Data." side="bottom">
                <a href={href({ page: 'settings', tab: 'data' })} className="hidden h-8 items-center gap-1.5 rounded-full bg-pop px-3 text-2xs font-bold text-pop-fg md:flex">Sample data</a>
              </Tip>
            )}
            <Button variant="secondary" className="hidden border-transparent bg-subtle text-muted md:inline-flex" onClick={() => open('command')}><Search /> Search <Kbd className="ml-1 bg-panel">Ctrl K</Kbd></Button>
            <Button variant="secondary" size="icon" className="border-transparent bg-panel md:hidden" onClick={() => open('command')} aria-label="Search"><Search /></Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownTrigger className="relative grid size-10 place-items-center rounded-full text-fg transition hover:bg-hover" aria-label="Notifications">
                <Bell className="size-4" />{notes.length > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-coral ring-2 ring-panel" />}
              </DropdownTrigger>
              <DropdownContent className="w-80">
                <DropdownLabel>Notifications</DropdownLabel>
                {notes.length ? notes.map((n, i) => (
                  <div key={i} className="flex gap-2 rounded-lg px-2.5 py-2 text-sm"><span className="flex-1">{n.text}</span><span className="shrink-0 text-2xs text-faint">{timeAgo(n.at)}</span></div>
                )) : <p className="px-2.5 py-3 text-sm text-muted">You’re all caught up.</p>}
              </DropdownContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownTrigger className="flex items-center gap-2 rounded-full p-0.5 pr-0.5 transition hover:bg-hover md:pr-3" aria-label="Profile and settings">
                <Avatar name={me.name || me.email || 'Admin'} size="md" className="size-9" />
                <span className="hidden text-left leading-tight md:block"><span className="block max-w-32 truncate text-xs font-semibold">{me.name || 'Academy admin'}</span><span className="block text-2xs text-muted">Admin</span></span>
              </DropdownTrigger>
              <DropdownContent className="w-60">
                <DropdownLabel>Settings</DropdownLabel>
                {SETTINGS_TABS.map(([k, l, Icon]) => <DropdownItem key={k} onSelect={() => (location.hash = href({ page: 'settings', tab: k }))}><Icon /> {l}</DropdownItem>)}
                <DropdownSeparator />
                <DropdownItem onSelect={() => open('command')}><Search /> Command menu <span className="ml-auto text-2xs text-faint">Ctrl K</span></DropdownItem>
                <DropdownItem onSelect={() => open('shortcuts')}><KeyRound /> Keyboard shortcuts <span className="ml-auto text-2xs text-faint">?</span></DropdownItem>
                <DropdownItem onSelect={signOut}><LogOut /> Sign out</DropdownItem>
              </DropdownContent>
            </DropdownMenu>
          </div>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-1 pt-2 lg:hidden">{navLinks(true)}</nav>
      </div>
    </header>
  );
}
