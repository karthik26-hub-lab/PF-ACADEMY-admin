import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Topbar, type Crumb } from './Topbar';

export function Page({ crumbs, actions, children, width = 'default' }: { crumbs: Crumb[]; actions?: ReactNode; children: ReactNode; width?: 'default' | 'narrow' | 'wide' }) {
  return (
    <div className="flex min-h-screen min-w-0 flex-1 flex-col">
      <Topbar crumbs={crumbs} actions={actions} />
      <motion.main
        key={location.hash}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className={cn('mx-auto w-full flex-1 px-4 pb-16 pt-6 md:px-8', width === 'narrow' ? 'max-w-3xl' : width === 'wide' ? 'max-w-[1400px]' : 'max-w-6xl')}>
        {children}
      </motion.main>
    </div>
  );
}
