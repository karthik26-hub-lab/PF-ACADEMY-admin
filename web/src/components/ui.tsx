import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as Menu from '@radix-ui/react-dropdown-menu';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Check, ChevronDown, X } from 'lucide-react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { cn, initials } from '../lib/utils';
import type { ExamStatus } from '../lib/store';

// ---------- Button ----------
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type BtnSize = 'sm' | 'md' | 'icon';
const btnBase = 'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-150 ease-out border border-transparent active:scale-[0.97] disabled:pointer-events-none disabled:border-border disabled:bg-subtle disabled:text-faint disabled:shadow-none select-none [&_svg]:size-4 [&_svg]:shrink-0';
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-fg text-bg hover:bg-fg/85 shadow-xs',
  accent: 'bg-accent text-accent-fg hover:bg-accent/90 shadow-xs',
  secondary: 'bg-panel text-fg border border-border hover:bg-hover shadow-xs',
  ghost: 'text-muted hover:text-fg hover:bg-hover',
  danger: 'bg-panel text-bad border border-border hover:bg-bad-soft',
};
const btnSizes: Record<BtnSize, string> = { sm: 'h-7 px-2.5 text-xs rounded', md: 'h-8 px-3 text-sm rounded-md', icon: 'size-8 rounded-md' };
export const btn = (v: BtnVariant = 'secondary', s: BtnSize = 'md', c?: string) => cn(btnBase, btnVariants[v], btnSizes[s], c);

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }>(
  ({ variant = 'secondary', size = 'md', className, type = 'button', ...p }, ref) => <button ref={ref} type={type} className={btn(variant, size, className)} {...p} />,
);
Button.displayName = 'Button';

// ---------- Form controls ----------
const field = 'w-full rounded-md border border-border-strong bg-panel px-2.5 text-sm text-fg placeholder:text-faint shadow-xs outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:ring-[3px] focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, 'h-8', className)} {...p} />
));
Input.displayName = 'Input';
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn(field, 'min-h-20 py-2', p.className)} />;
// Native select (keeps the phone pickers), styled like the inputs with its own chevron.
export const Select = ({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <span className={cn('relative block', className)}>
    <select {...p} className={cn(field, 'h-8 cursor-pointer appearance-none pr-8 hover:border-faint [&>option]:bg-panel [&>option]:text-fg')} />
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
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
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-2.5 rounded-md border bg-panel p-3 shadow-xs transition-[border-color,box-shadow,background-color] duration-200', checked ? 'border-accent shadow-[0_0_0_1px_hsl(var(--accent))]' : 'border-border hover:border-border-strong hover:bg-subtle')}>
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
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 rounded-md border bg-panel p-3 shadow-xs transition-[border-color,box-shadow,background-color] duration-200', checked ? 'border-accent shadow-[0_0_0_1px_hsl(var(--accent))]' : 'border-border hover:border-border-strong hover:bg-subtle')}>
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

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; count?: number }[]; className?: string }) {
  const id = React.useId();
  return (
    <div role="tablist" className={cn('inline-flex h-8 items-center gap-0.5 rounded-md bg-subtle p-0.5 ring-1 ring-inset ring-border', className)}>
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn('relative inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors duration-200', value === o.value ? 'text-fg' : 'text-muted hover:text-fg')}>
          {value === o.value && <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-[5px] bg-panel shadow-xs ring-1 ring-border" />}
          <span className="relative z-10 inline-flex items-center gap-1.5">{o.label}{o.count !== undefined && <span className="tnum text-faint">{o.count}</span>}</span>
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  const id = React.useId();
  return (
    <div role="tablist" className="flex gap-4 overflow-x-auto border-b border-border px-4 [scrollbar-width:none]">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('relative flex h-10 items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors duration-200', value === t.value ? 'text-fg' : 'text-muted hover:text-fg')}>
          {t.label}{t.count !== undefined && <span className="tnum rounded bg-subtle px-1.5 text-2xs text-muted ring-1 ring-inset ring-border">{t.count}</span>}
          {value === t.value && <motion.span layoutId={`tab-${id}`} transition={spring} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-fg" />}
        </button>
      ))}
    </div>
  );
}

/** Counts up to the value when it first appears, and glides between values afterwards. */
export function AnimatedNumber({ value }: { value: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
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

// ---------- Display ----------
type Tone = 'neutral' | 'accent' | 'good' | 'warn' | 'bad';
const tones: Record<Tone, string> = {
  neutral: 'bg-subtle text-muted ring-border',
  accent: 'bg-accent-soft text-accent ring-accent/20',
  good: 'bg-good-soft text-good ring-good/20',
  warn: 'bg-warn-soft text-warn ring-warn/25',
  bad: 'bg-bad-soft text-bad ring-bad/20',
};
export const Badge = ({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) => (
  <span className={cn('inline-flex h-5 items-center gap-1 whitespace-nowrap rounded px-1.5 text-2xs font-medium ring-1 ring-inset', tones[tone], className)}>{children}</span>
);

const STATUS: Record<ExamStatus, { label: string; dot: string }> = {
  draft: { label: 'Draft', dot: 'border border-faint bg-transparent' },
  scheduled: { label: 'Scheduled', dot: 'bg-accent' },
  live: { label: 'Live', dot: 'bg-good animate-pulse' },
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
    <span className={cn('grid shrink-0 place-items-center rounded-full font-medium bg-[hsl(var(--h)_70%_55%/0.16)] text-[hsl(var(--h)_50%_36%)] dark:text-[hsl(var(--h)_70%_74%)]', size === 'sm' ? 'size-5 text-[10px]' : size === 'lg' ? 'size-12 text-base' : 'size-7 text-2xs', className)}
      style={{ '--h': hue } as React.CSSProperties}>{initials(name)}</span>
  );
};

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <section className={cn('rounded-lg border border-border bg-panel shadow-xs', className)}>{children}</section>
);
export const CardHeader = ({ title, desc, action, className }: { title: React.ReactNode; desc?: React.ReactNode; action?: React.ReactNode; className?: string }) => (
  <header className={cn('flex min-h-11 items-center justify-between gap-3 border-b border-border px-4 py-2.5', className)}>
    <div className="min-w-0"><h3 className="text-sm font-semibold">{title}</h3>{desc && <p className="text-xs text-muted">{desc}</p>}</div>
    {action}
  </header>
);

export function Progress({ value, className, tone = 'accent' }: { value: number; className?: string; tone?: 'accent' | 'good' }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-subtle ring-1 ring-inset ring-border', className)}>
      <motion.div className={cn('h-full rounded-full', tone === 'good' ? 'bg-good' : 'bg-accent')} initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action, compact }: { icon: React.ElementType; title: string; children?: React.ReactNode; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'px-4 py-7' : 'px-6 py-14')}>
      <div className="mb-3 grid size-9 place-items-center rounded-md border border-border bg-subtle text-muted shadow-xs"><Icon className="size-4" /></div>
      <p className="text-sm font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-xs text-muted">{children}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, desc, actions, meta }: { title: React.ReactNode; desc?: React.ReactNode; actions?: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {meta && <div className="mb-1.5 flex items-center gap-2">{meta}</div>}
        <h1 className="text-xl font-semibold tracking-[-0.015em] [text-wrap:balance]">{title}</h1>
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
  <th className={cn('h-9 whitespace-nowrap border-b border-border bg-subtle px-4 text-left text-xs font-medium text-muted first:pl-4', className)}>{children}</th>
);
export const Td = ({ children, className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td {...p} className={cn('h-11 border-b border-border px-4 align-middle', className)}>{children}</td>
);

// ---------- Overlays ----------
export function Dialog({ open, onOpenChange, title, desc, children, footer, wide }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; desc?: string; children?: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content aria-describedby={undefined}
          className={cn('fixed left-1/2 top-[12vh] z-50 flex max-h-[80vh] w-[calc(100vw-32px)] -translate-x-1/2 flex-col rounded-lg bg-panel shadow-pop', wide ? 'max-w-2xl' : 'max-w-md', 'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out')}>
          <div className="flex items-start justify-between gap-4 px-5 pb-1 pt-4">
            <div><DialogPrimitive.Title className="text-base font-semibold">{title}</DialogPrimitive.Title>
              {desc && <DialogPrimitive.Description className="mt-0.5 text-sm text-muted">{desc}</DialogPrimitive.Description>}</div>
            <DialogPrimitive.Close className={btn('ghost', 'icon', '-mr-2 -mt-1 size-7')} aria-label="Close"><X /></DialogPrimitive.Close>
          </div>
          <div className="overflow-y-auto px-5 py-3 scroll-thin">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border bg-subtle/60 px-5 py-3 rounded-b-lg">{footer}</div>}
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
      <Menu.Content align={align} sideOffset={6} className={cn('z-50 min-w-48 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-md bg-panel p-1 shadow-pop data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out', className)}>{children}</Menu.Content>
    </Menu.Portal>
  );
}
export const DropdownItem = ({ children, onSelect, danger, disabled }: { children: React.ReactNode; onSelect?: () => void; danger?: boolean; disabled?: boolean }) => (
  <Menu.Item disabled={disabled} onSelect={onSelect}
    className={cn('flex h-8 cursor-default select-none items-center gap-2 rounded px-2 text-sm outline-none transition-colors duration-100 data-[disabled]:opacity-40 data-[highlighted]:bg-hover [&_svg]:size-4 [&_svg]:text-muted', danger && 'text-bad [&_svg]:text-bad')}>{children}</Menu.Item>
);
export const DropdownLabel = ({ children }: { children: React.ReactNode }) => <Menu.Label className="px-2 pb-1 pt-1.5 text-2xs font-medium text-faint">{children}</Menu.Label>;
export const DropdownSeparator = () => <Menu.Separator className="-mx-1 my-1 h-px bg-border" />;

export function Tip({ label, children, side = 'right' }: { label: React.ReactNode; children: React.ReactNode; side?: 'right' | 'bottom' | 'top' }) {
  return (
    <TooltipPrimitive.Root delayDuration={250}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} sideOffset={6} className="z-50 rounded bg-fg px-2 py-1 text-xs text-bg data-[state=delayed-open]:animate-fade-in data-[state=closed]:animate-fade-out">{label}</TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
export const TooltipProvider = TooltipPrimitive.Provider;
