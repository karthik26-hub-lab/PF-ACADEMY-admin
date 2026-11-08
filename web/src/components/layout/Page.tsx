import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, RotateCw, TriangleAlert } from 'lucide-react';
import { Component, Fragment, useEffect, useMemo, type ErrorInfo, type ReactNode } from 'react';
import { FirstVisit, isFirstVisit, markVisited } from '../../lib/first-visit';
import { cn } from '../../lib/utils';
import { btn } from '../ui';

export type Crumb = { label: string; href?: string };

export function Page({ crumbs, actions, children, width = 'default' }: { crumbs: Crumb[]; actions?: ReactNode; children: ReactNode; width?: 'default' | 'narrow' | 'wide' }) {
  const showCrumbs = crumbs.length > 1;
  const key = location.hash || '#dashboard';
  // Decided once per route: the first visit animates, later visits appear instantly.
  const first = useMemo(() => isFirstVisit(key), [key]);
  useEffect(() => { markVisited(key); }, [key]);
  return (
    <FirstVisit.Provider value={first}>
      {/* initial={false} also tells every motion element inside to start in its final state. */}
      <AnimatePresence initial={first}>
        <motion.main
          key={key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn('mx-auto w-full min-w-0 flex-1 px-4 pt-7 md:px-8', width === 'narrow' ? 'max-w-3xl' : 'max-w-[1400px]')}>
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
          <PageBoundary>{children}</PageBoundary>
          <footer className="flex flex-wrap items-center justify-between gap-2 pb-8 pt-16 text-2xs text-faint">
            <span>Powered by <span className="font-semibold text-muted">Parallax Flow</span></span>
            <span>Press <kbd className="rounded border border-border bg-panel px-1 font-sans">?</kbd> for keyboard shortcuts</span>
          </footer>
        </motion.main>
      </AnimatePresence>
    </FirstVisit.Provider>
  );
}

/** Keeps one broken page from blanking the whole console. */
class PageBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Page failed to render', error, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid place-items-center rounded-3xl bg-panel px-6 py-20 text-center ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        <span className="grid size-12 place-items-center rounded-full bg-coral text-coral-fg"><TriangleAlert className="size-5" /></span>
        <h2 className="mt-4 text-lg font-bold tracking-tight">This page couldn’t load</h2>
        <p className="mt-1 max-w-sm text-sm text-muted">Something went wrong while showing it. Your data is safe. Try again, or go back to the dashboard.</p>
        <div className="mt-5 flex gap-2">
          <a href="#dashboard" onClick={() => this.setState({ error: null })} className={btn('secondary')}>Go to dashboard</a>
          <button onClick={() => location.reload()} className={btn('primary')}><RotateCw /> Try again</button>
        </div>
      </div>
    );
  }
}
