import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { Button, Field, Input } from '../components/ui';

const ease = [0.22, 1, 0.36, 1] as const;

// A field of soft shapes behind the card, like tiles on a board. Deterministic, so it never jumps.
function ShapeField() {
  const cols = 12, rows = 6;
  const kinds = ['sq', 'circle', 'leaf', 'blank', 'sq', 'leaf2', 'circle', 'blank', 'blank'];
  const cells = Array.from({ length: cols * rows }, (_, i) => {
    const k = kinds[(i * 7 + Math.floor(i / cols) * 3) % kinds.length];
    const tone = (i * 13) % 11 === 0 ? 'ink' : (i * 5) % 9 === 0 ? 'pop' : 'grey';
    return { k, tone, i };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden [mask-image:radial-gradient(ellipse_at_center,transparent_22%,black_62%)]">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 88px)` }}>
        {cells.map(({ k, tone, i }) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: (i % cols) * 0.03 + Math.floor(i / cols) * 0.04, ease }}
            className={cn('size-[88px]',
              k === 'blank' && 'opacity-0',
              k === 'sq' && 'rounded-[26px]', k === 'circle' && 'rounded-full', k === 'leaf' && 'rounded-[44px_44px_44px_8px]', k === 'leaf2' && 'rounded-[8px_44px_44px_44px]',
              tone === 'ink' ? 'bg-fg/90' : tone === 'pop' ? 'bg-pop' : 'bg-border/80')} />
        ))}
      </div>
    </div>
  );
}

// A hand-drawn arrow that draws itself in.
const Squiggle = ({ d, className, delay = 0 }: { d: string; className?: string; delay?: number }) => (
  <svg viewBox="0 0 120 80" className={cn('pointer-events-none absolute h-20 w-28 text-fg', className)} fill="none" aria-hidden>
    <motion.path d={d} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay, ease }} />
  </svg>
);

const STEPS = [
  { n: 1, title: 'Upload the paper', note: 'Word file with steps & ICAI keywords', pos: 'left-[4%] top-[14%] -rotate-3', arrow: { d: 'M10 10 C 40 0, 80 20, 100 55 M100 55 l-12 -3 M100 55 l2 -12', cls: 'left-[60%] top-[70%]' } },
  { n: 2, title: 'Students write & upload', note: 'From the Parallax Flow app', pos: 'right-[4%] top-[12%] rotate-2', arrow: { d: 'M110 10 C 80 0, 40 20, 18 58 M18 58 l12 -2 M18 58 l-1 -12', cls: 'right-[62%] top-[72%]' } },
  { n: 3, title: 'AI marks every step', note: 'Against your marking scheme', pos: 'left-[5%] bottom-[14%] rotate-2', arrow: { d: 'M10 70 C 40 78, 80 60, 102 24 M102 24 l-12 2 M102 24 l1 12', cls: 'left-[62%] -top-[62%]' } },
  { n: 4, title: 'You review & publish', note: 'Only what needs a faculty eye', pos: 'right-[5%] bottom-[12%] -rotate-2', arrow: { d: 'M110 70 C 80 78, 40 60, 18 22 M18 22 l12 1 M18 22 l-2 12', cls: 'right-[62%] -top-[62%]' } },
];

function DoodleStep({ s, i, inline }: { s: (typeof STEPS)[number]; i: number; inline?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 + i * 0.12, ease }}
      className={cn('z-10', inline ? 'relative' : cn('absolute hidden xl:block', s.pos))}>
      <div className="relative w-[210px] rounded-[22px] border-2 border-dashed border-fg/25 bg-panel/95 px-4 py-3 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="flex items-center gap-2">
          <span className={cn('grid size-8 place-items-center rounded-full font-hand text-xl font-bold', i % 2 ? 'bg-pop text-pop-fg' : 'bg-fg text-bg')}>{s.n}</span>
          <span className="font-hand text-[22px] font-bold leading-6">{s.title}</span>
        </div>
        <p className="mt-1 pl-10 text-2xs text-muted">{s.note}</p>
        {!inline && <Squiggle d={s.arrow.d} className={s.arrow.cls} delay={0.9 + i * 0.12} />}
      </div>
    </motion.div>
  );
}

export function Login() {
  const signIn = useStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); signIn(email.trim()); location.hash = '#dashboard'; };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <ShapeField />
      {STEPS.map((s, i) => <DoodleStep key={s.n} s={s} i={i} />)}

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease }}
          className="w-full max-w-[440px] rounded-[36px] bg-panel p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04] sm:p-10 dark:ring-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-full bg-fg text-xs font-bold text-bg">PF</span>
            <span className="text-sm font-bold tracking-tight">Parallax Flow</span>
          </div>

          <div className="relative mt-7">
            <span className="absolute -top-5 right-6 rotate-6 font-hand text-xl font-bold text-fg/70">for academies</span>
            <svg viewBox="0 0 60 40" className="absolute -top-2 right-[118px] h-6 w-9 text-fg/60" fill="none" aria-hidden><path d="M55 6 C 40 2, 20 10, 8 30 M8 30 l2 -10 M8 30 l9 -4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <h1 className="font-hand text-[44px] font-bold leading-[0.95] tracking-tight">Mark smarter,<br />teach <span className="relative inline-block">better<svg viewBox="0 0 120 14" className="absolute -bottom-1 left-0 h-3 w-full text-pop" preserveAspectRatio="none" aria-hidden><motion.path d="M2 9 C 30 2, 70 14, 118 5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.5, ease }} /></svg></span>.</h1>
            <p className="mt-3 text-sm text-muted">Sign in to your academy console.</p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="Work email" htmlFor="lg-email"><Input id="lg-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@academy.com" className="h-11" /></Field>
            <Field label="Password" htmlFor="lg-pass">
              <div className="relative">
                <Input id="lg-pass" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-11" />
                <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint hover:text-fg" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
            </Field>
            <Button type="submit" variant="primary" className="group h-12 w-full text-[15px]">Sign in <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" /></Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted">Students sign in on the Parallax Flow app.</p>
          <p className="mt-3 rounded-2xl bg-subtle px-3 py-2 text-center text-2xs text-muted">Preview: sign-in isn’t connected yet, so any details open the console.</p>
        </motion.div>

        <div className="mt-8 grid w-full max-w-[440px] gap-3 sm:grid-cols-2 xl:hidden">
          {STEPS.map((s, i) => <DoodleStep key={s.n} s={s} i={i} inline />)}
        </div>
      </div>
    </div>
  );
}
