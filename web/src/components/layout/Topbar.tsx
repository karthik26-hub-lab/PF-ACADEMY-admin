import { ChevronRight, Menu, Search } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { useUI } from '../../lib/ui-state';
import { Button, Kbd } from '../ui';

export type Crumb = { label: string; href?: string };

export function Topbar({ crumbs, actions }: { crumbs: Crumb[]; actions?: ReactNode }) {
  const { setMobileNav, open } = useUI();
  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg/85 px-3 backdrop-blur md:px-5">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu /></Button>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-faint" />}
            {c.href && i < crumbs.length - 1
              ? <a href={c.href} className="truncate text-muted transition hover:text-fg">{c.label}</a>
              : <span className="truncate font-medium">{c.label}</span>}
          </Fragment>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => open('command')} aria-label="Search"><Search /></Button>
        <span className="hidden items-center gap-1 text-2xs text-faint lg:flex"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
      </div>
    </header>
  );
}
