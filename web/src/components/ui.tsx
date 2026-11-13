import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as Menu from '@radix-ui/react-dropdown-menu';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Check, ChevronDown, X } from 'lucide-react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { cn, initials } from '../lib/utils';
import { useFirstVisit } from '../lib/first-visit';
import type { ExamStatus } from '../lib/store';

// ---------- Button ----------
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type BtnSize = 'sm' | 'md' | 'icon';
const btnBase = 'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-150 ease-out border border-transparent active:scale-[0.97] disabled:pointer-events-none disabled:border-border disabled:bg-subtle disabled:text-faint disabled:shadow-none select-none [&_svg]:size-4 [&_svg]:shrink-0';
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-fg text-bg hover:bg-fg/85',
  accent: 'bg-accent text-accent-fg hover:bg-accent/90 shadow-xs',
  secondary: 'bg-panel text-fg border border-border-strong hover:bg-hover',
  ghost: 'text-muted hover:text-fg hover:bg-hover',
  danger: 'bg-panel text-bad border border-border-strong hover:bg-bad-soft',
};
const btnSizes: Record<BtnSize, string> = { sm: 'h-8 px-3.5 text-xs rounded-full', md: 'h-10 px-4.5 px-[18px] text-sm rounded-full', icon: 'size-10 rounded-full' };
export const btn = (v: BtnVariant = 'secondary', s: BtnSize = 'md', c?: string) => cn(btnBase, btnVariants[v], btnSizes[s], c);

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }>(
  ({ variant = 'secondary', size = 'md', className, type = 'button', ...p }, ref) => <button ref={ref} type={type} className={btn(variant, size, className)} {...p} />,
);
Button.displayName = 'Button';

// ---------- Form controls ----------
const field = 'w-full rounded-xl border border-border bg-panel px-3.5 text-sm text-fg placeholder:text-faint shadow-xs outline-none transition-[border-color,box-shadow] duration-150 focus:border-fg/40 focus:ring-4 focus:ring-fg/[0.06] disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, 'h-10', className)} {...p} />
));
Input.displayName = 'Input';
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn(field, 'min-h-20 py-2', p.className)} />;
// Native select (keeps the phone pickers), styled like the inputs with its own chevron.
export const Select = ({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <span className={cn('relative block', className)}>
    <select {...p} className={cn(field, 'h-10 cursor-pointer appearance-none pr-9 hover:border-faint [&>option]:bg-panel [&>option]:text-fg')} />
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
  </span>
);

export function Field({ label, hint, htmlFor, children, className, optional }: { label: string; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode; className?: string; optional?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-fg">{label}{optional && <span className="ml-1 font-normal text-faint">Optional</span>}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Checkbox({ checked, onChange, id, label, desc }: { checked: boolean; onChange: (v: boolean) => void; id: string; label: React.ReactNode; desc?: React.ReactNode }) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-2.5 rounded-xl border bg-panel p-3.5 transition-[border-color,box-shadow,background-color] duration-200', checked ? 'border-accent shadow-[0_0_0_1px_hsl(var(--accent))]' : 'border-border hover:border-border-strong hover:bg-subtle')}>
      <span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-200', checked ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong bg-panel')}>
        <motion.span initial={false} animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }} transition={{ type: 'spring', stiffness: 600, damping: 30 }} className="grid place-items-center">
          <Check className="size-3" strokeWidth={3} />
        </motion.span>
      </span>
      <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0"><span className="block text-sm font-medium">{label}</span>{desc && <span className="block text-xs text-muted">{desc}</span>}</span>
    </label>
  );
}

export function RadioCard({ checked, onChange, name, id, title, desc, badge }: { checked: boolean; onChange: () => void; name: string; id: string; title: string; desc: string; badge?: string }) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border bg-panel p-3.5 transition-[border-color,box-shadow,background-color] duration-200', checked ? 'border-accent shadow-[0_0_0_1px_hsl(var(--accent))]' : 'border-border hover:border-border-strong hover:bg-subtle')}>
      <span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border bg-panel transition-colors duration-200', checked ? 'border-accent' : 'border-border-strong')}>
        <motion.span initial={false} animate={{ scale: checked ? 1 : 0 }} transition={{ type: 'spring', stiffness: 600, damping: 28 }} className="size-2 rounded-full bg-accent" />
      </span>
      <input id={id} type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} />
      <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-medium">{title}{badge && <Badge tone="accent">{badge}</Badge>}</span><span className="block text-xs text-muted">{desc}</span></span>
    </label>
  );
}

export function Switch({ checked, onCheckedChange, id, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string; label?: string }) {
  return (
    <SwitchPrimitive.Root id={id} aria-label={label} checked={checked} onCheckedChange={onCheckedChange}
      className="relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-border-strong transition-colors duration-200 data-[state=checked]:bg-accent">
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  );
}

export const spring = { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 } as const;

/**
 * The highlight that slides to the selected option (the one with aria-selected).
 * Moved with a plain CSS transform, so it stays smooth inside dialogs and scrolling lists.
 * Put it first inside a `relative` container. `line` draws an underline instead of a pill.
 */
export function Glide({ value, line, className }: { value: string; line?: boolean; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null), moved = React.useRef(false);
  const [box, setBox] = React.useState<{ x: number; y: number; w: number; h: number; anim: boolean }>();
  const place = React.useCallback((anim: boolean) => {
    const on = ref.current?.parentElement?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (on) setBox({ x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight, anim });
  }, []);
  React.useLayoutEffect(() => { place(moved.current); moved.current = true; }, [value, place]);
  React.useEffect(() => {
    const ro = new ResizeObserver(() => place(false));
    ro.observe(ref.current!.parentElement!);
    return () => ro.disconnect();
  }, [place]);
  return <span ref={ref} aria-hidden style={box && { transform: `translate(${box.x}px, ${line ? 0 : box.y}px)`, width: box.w, height: line ? undefined : box.h }}
    className={cn('pointer-events-none absolute left-0', line ? 'bottom-0 h-0.5' : 'top-0', box?.anim && 'transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]', !box && 'opacity-0', className)} />;
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; count?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={cn('relative inline-flex h-10 max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-subtle p-1 ring-1 ring-inset ring-border [scrollbar-width:none]', className)}>
      <Glide value={value} className="rounded-full bg-fg" />
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn('relative inline-flex h-8 shrink-0 grow items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors duration-200', value === o.value ? 'text-bg' : 'text-muted hover:text-fg')}>
          {o.label}{o.count !== undefined && <span className="tnum text-faint">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="relative flex gap-4 overflow-x-auto border-b border-border px-4 [scrollbar-width:none]">
      <Glide value={value} line className="rounded-full bg-fg" />
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('relative flex h-10 items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors duration-200', value === t.value ? 'text-fg' : 'text-muted hover:text-fg')}>
          {t.label}{t.count !== undefined && <span className="tnum rounded bg-subtle px-1.5 text-2xs text-muted ring-1 ring-inset ring-border">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Counts up to the value when it first appears, and glides between values afterwards. */
export function AnimatedNumber({ value }: { value: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const first = useFirstVisit();
  const mv = useMotionValue(first ? 0 : value);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString('en-IN'));
  React.useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: 0.7, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [inView, value, mv]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

/** Reveals children with a short fade-up; use `delay` to stagger siblings. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

export const Skeleton = ({ className }: { className?: string }) => <span aria-hidden className={cn('block animate-pulse rounded-xl bg-subtle', className)} />;

// ---------- Display ----------
type Tone = 'neutral' | 'accent' | 'good' | 'warn' | 'bad' | 'pop' | 'ink';
const tones: Record<Tone, string> = {
  neutral: 'bg-subtle text-muted ring-border',
  accent: 'bg-accent-soft text-fg ring-border',
  good: 'bg-good-soft text-good ring-good/20',
  pop: 'bg-pop text-pop-fg ring-transparent',
  ink: 'bg-fg text-bg ring-transparent',
  warn: 'bg-warn-soft text-warn ring-warn/25',
  bad: 'bg-bad-soft text-bad ring-bad/20',
};
export const Badge = ({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) => (
  <span className={cn('inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-2xs font-semibold ring-1 ring-inset', tones[tone], className)}>{children}</span>
);

const STATUS: Record<ExamStatus, { label: string; dot: string }> = {
  draft: { label: 'Draft', dot: 'border border-faint bg-transparent' },
  scheduled: { label: 'Scheduled', dot: 'bg-fg' },
  live: { label: 'Live', dot: 'bg-pop ring-2 ring-pop/30 animate-pulse' },
  closed: { label: 'Closed', dot: 'bg-faint' },
};
export const StatusPill = ({ status }: { status: ExamStatus }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-fg"><span className={cn('size-1.5 rounded-full', STATUS[status].dot)} />{STATUS[status].label}</span>
);

export const Kbd = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-subtle px-1 font-sans text-2xs font-medium text-muted', className)}>{children}</kbd>
);

export const Avatar = ({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full font-medium bg-[hsl(var(--h)_70%_55%/0.16)] text-[hsl(var(--h)_50%_36%)] dark:text-[hsl(var(--h)_70%_74%)]', size === 'sm' ? 'size-6 text-[10px]' : size === 'lg' ? 'size-14 text-lg' : 'size-8 text-2xs', className)}
      style={{ '--h': hue } as React.CSSProperties}>{initials(name)}</span>
  );
};

export const Card = ({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) => (
  <section id={id} className={cn('rounded-2xl bg-panel ring-1 ring-black/[0.04] dark:ring-white/[0.06]', className)}>{children}</section>
);
export const CardHeader = ({ title, desc, action, className }: { title: React.ReactNode; desc?: React.ReactNode; action?: React.ReactNode; className?: string }) => (
  <header className={cn('flex min-h-12 items-start justify-between gap-3 px-5 pb-2 pt-4', className)}>
    <div className="min-w-0"><h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>{desc && <p className="mt-0.5 text-xs text-muted">{desc}</p>}</div>
    {action}
  </header>
);

export function Progress({ value, className, tone = 'accent' }: { value: number; className?: string; tone?: 'accent' | 'good' }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full hatch', className)}>
      <motion.div className={cn('h-full rounded-full', tone === 'good' ? 'bg-pop' : 'bg-fg')} initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action, compact }: { icon: React.ElementType; title: string; children?: React.ReactNode; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'px-4 py-7' : 'px-6 py-14')}>
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-subtle text-muted ring-1 ring-border"><Icon className="size-4" /></div>
      <p className="text-sm font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-xs text-muted">{children}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, desc, actions, meta }: { title: React.ReactNode; desc?: React.ReactNode; actions?: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {meta && <div className="mb-1.5 flex items-center gap-2">{meta}</div>}
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.025em] [text-wrap:balance]">{title}</h1>
        {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------- Table ----------
export const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto scroll-thin"><table className="w-full border-collapse text-sm">{children}</table></div>
);
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={cn('h-10 whitespace-nowrap border-y border-border bg-subtle/70 px-5 text-left text-xs font-medium text-muted', className)}>{children}</th>
);
export const Td = ({ children, className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td {...p} className={cn('h-14 border-b border-border px-5 align-middle', className)}>{children}</td>
);

// ---------- Overlays ----------
export function Dialog({ open, onOpenChange, title, desc, children, footer, wide, className }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; desc?: string; children?: React.ReactNode; footer?: React.ReactNode; wide?: boolean; className?: string }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content aria-describedby={undefined}
          className={cn('fixed left-1/2 top-[12vh] z-50 flex max-h-[80vh] w-[calc(100vw-32px)] -translate-x-1/2 flex-col rounded-2xl bg-panel shadow-float', wide ? 'max-w-2xl' : 'max-w-md', 'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out', className)}>
          <div className="flex items-start justify-between gap-4 px-5 pb-1 pt-4">
            <div><DialogPrimitive.Title className="text-base font-semibold">{title}</DialogPrimitive.Title>
              {desc && <DialogPrimitive.Description className="mt-0.5 text-sm text-muted">{desc}</DialogPrimitive.Description>}</div>
            <DialogPrimitive.Close className={btn('ghost', 'icon', '-mr-2 -mt-1 size-7')} aria-label="Close"><X /></DialogPrimitive.Close>
          </div>
          <div className="overflow-y-auto px-5 py-3 scroll-thin">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border bg-subtle/60 px-5 py-3 rounded-b-2xl">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DropdownMenu = Menu.Root;
export const DropdownTrigger = Menu.Trigger;
export function DropdownContent({ children, align = 'end', className }: { children: React.ReactNode; align?: 'start' | 'end'; className?: string }) {
  return (
    <Menu.Portal>
      <Menu.Content align={align} sideOffset={6} className={cn('z-50 min-w-48 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-xl bg-panel p-1.5 shadow-float data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out', className)}>{children}</Menu.Content>
    </Menu.Portal>
  );
}
export const DropdownItem = ({ children, onSelect, danger, disabled, className }: { children: React.ReactNode; onSelect?: () => void; danger?: boolean; disabled?: boolean; className?: string }) => (
  <Menu.Item disabled={disabled} onSelect={onSelect}
    className={cn('flex h-9 cursor-default select-none items-center gap-2 rounded-lg px-2.5 text-sm outline-none transition-colors duration-100 data-[disabled]:opacity-40 data-[highlighted]:bg-hover [&_svg]:size-4 [&_svg]:text-muted', danger && 'text-bad [&_svg]:text-bad', className)}>{children}</Menu.Item>
);
export const DropdownLabel = ({ children }: { children: React.ReactNode }) => <Menu.Label className="px-2 pb-1 pt-1.5 text-2xs font-medium text-faint">{children}</Menu.Label>;
export const DropdownSeparator = () => <Menu.Separator className="-mx-1 my-1 h-px bg-border" />;

export function Tip({ label, children, side = 'right' }: { label: React.ReactNode; children: React.ReactNode; side?: 'right' | 'bottom' | 'top' }) {
  return (
    <TooltipPrimitive.Root delayDuration={250}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} sideOffset={6} className="z-50 rounded-lg bg-fg px-2.5 py-1.5 text-xs text-bg data-[state=delayed-open]:animate-fade-in data-[state=closed]:animate-fade-out">{label}</TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
export const TooltipProvider = TooltipPrimitive.Provider;
