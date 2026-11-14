// A small "well done" moment after creating something: the pop-up closes, a burst of confetti plays
// and a success message appears (with a Copy button when there are login details to hand over).
import { motion } from 'framer-motion';
import { create } from 'zustand';
import { toast } from 'sonner';

const useBurst = create<{ key: number }>(() => ({ key: 0 }));

export function celebrate(title: string, opts: { description?: string; copy?: string } = {}) {
  useBurst.setState({ key: Date.now() });
  const copy = opts.copy;
  toast.success(title, {
    description: opts.description, duration: copy ? 12000 : 4000,
    action: copy ? { label: 'Copy', onClick: () => void navigator.clipboard?.writeText(copy).then(() => toast('Copied'), () => toast('Select the details and copy them')) } : undefined,
  });
}

const COLORS = ['hsl(var(--pop))', 'hsl(212 85% 60%)', 'hsl(330 80% 65%)', 'hsl(172 60% 50%)', 'hsl(30 90% 60%)', 'hsl(262 75% 65%)'];

/** Mounted once; plays a confetti burst from the top centre whenever celebrate() is called. Transform-only, so it stays smooth. */
export function Celebration() {
  const key = useBurst((s) => s.key);
  if (!key || Date.now() - key > 1500) return null;
  return (
    <div key={key} aria-hidden className="pointer-events-none fixed inset-x-0 top-[18vh] z-[60] flex justify-center motion-reduce:hidden">
      {Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2, d = 90 + (i % 5) * 28;
        return <motion.span key={i} className="absolute size-2 rounded-[2px]" style={{ background: COLORS[i % COLORS.length] }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }} animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d + 60, opacity: 0, rotate: 260, scale: 0.6 }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.3, 1] }} />;
      })}
    </div>
  );
}
