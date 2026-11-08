import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type Crumb = { label: string; href?: string };

export function Page({ crumbs, actions, children, width = 'default' }: { crumbs: Crumb[]; actions?: ReactNode; children: ReactNode; width?: 'default' | 'narrow' | 'wide' }) {
  const showCrumbs = crumbs.length > 1;
  return (
    <motion.main
      key={location.hash}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn('mx-auto w-full flex-1 px-4 pb-20 pt-7 md:px-8', width === 'narrow' ? 'max-w-3xl' : width === 'wide' ? 'max-w-[1400px]' : 'max-w-[1400px]')}>
      {(showCrumbs || actions) && (
        <div className="mb-4 flex min-h-8 flex-wrap items-center justify-between gap-2">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs">
            {showCrumbs && crumbs.map((c, i) => (
              <Fragment key={i}>
                {i > 0 && <ChevronRight className="size-3 shrink-0 text-faint" />}
                {c.href && i < crumbs.length - 1
                  ? <a href={c.href} className="truncate text-muted transition hover:text-fg">{c.label}</a>
                  : <span className="truncate font-semibold">{c.label}</span>}
              </Fragment>
            ))}
          </nav>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </motion.main>
  );
}
