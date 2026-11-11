import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnline } from '../../lib/hooks';

export function OfflineBanner() {
  const online = useOnline();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          className="fixed inset-x-0 bottom-5 z-[60] mx-auto flex w-fit max-w-[calc(100vw-32px)] items-center gap-2.5 rounded-full bg-fg px-4 py-2.5 text-xs text-bg shadow-float">
          <span className="grid size-6 place-items-center rounded-full bg-coral text-coral-fg"><WifiOff className="size-3.5" /></span>
          <span><b>You’re offline.</b> <span className="opacity-75">Some actions won’t work until the connection is back.</span></span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
