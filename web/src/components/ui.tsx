import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as Menu from '@radix-ui/react-dropdown-menu';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Check, X } from 'lucide-react';
import { cn, initials } from '../lib/utils';
import type { ExamStatus } from '../lib/store';

// ---------- Button ----------
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type BtnSize = 'sm' | 'md' | 'icon';
const btnBase = 'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 select-none [&_svg]:size-4 [&_svg]:shrink-0';
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
const field = 'w-full rounded-md border border-border-strong bg-panel px-2.5 text-sm text-fg placeholder:text-faint shadow-xs outline-none transition focus:border-accent focus:ring-[3px] focus:ring-accent/15 disabled:opacity-50';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, 'h-8', className)} {...p} />
));
Input.displayName = 'Input';
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn(field, 'min-h-20 py-2', p.className)} />;
export const Select = ({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={cn(field, 'h-8 appearance-none bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8', className)}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E\")" }} />
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
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-2.5 rounded-md border p-3 transition-colors', checked ? 'border-accent/60 bg-accent-soft/60' : 'border-border hover:bg-hover')}>
      <span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border transition', checked ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong bg-panel')}>
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0"><span className="block text-sm font-medium">{label}</span>{desc && <span className="block text-xs text-muted">{desc}</span>}</span>
    </label>
  );
}

export function RadioCard({ checked, onChange, name, id, title, desc, badge }: { checked: boolean; onChange: () => void; name: string; id: string; title: string; desc: string; badge?: string }) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors', checked ? 'border-accent/60 bg-accent-soft/60' : 'border-border hover:bg-hover')}>
      <span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition', checked ? 'border-accent' : 'border-border-strong bg-panel')}>
        {checked && <span className="size-2 rounded-full bg-accent" />}
      </span>
      <input id={id} type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} />
      <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-medium">{title}{badge && <Badge tone="accent">{badge}</Badge>}</span><span className="block text-xs text-muted">{desc}</span></span>
    </label>
  );
}

export function Switch({ checked, onCheckedChange, id, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string; label?: string }) {
  return (
    <SwitchPrimitive.Root id={id} aria-label={label} checked={checked} onCheckedChange={onCheckedChange}
      className="relative h-5 w-9 shrink-0 rounded-full bg-border-strong transition-colors data-[state=checked]:bg-accent">
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-xs transition-transform data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; count?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={cn('inline-flex h-8 items-center gap-0.5 rounded-md bg-subtle p-0.5 ring-1 ring-inset ring-border', className)}>
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn('inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition', value === o.value ? 'bg-panel text-fg shadow-xs ring-1 ring-border' : 'text-muted hover:text-fg')}>
          {o.label}{o.count !== undefined && <span className="tnum text-faint">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="flex gap-4 overflow-x-auto border-b border-border px-4 [scrollbar-width:none]">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('relative -mb-px flex h-10 items-center gap-1.5 whitespace-nowrap border-b-2 text-sm font-medium transition', value === t.value ? 'border-fg text-fg' : 'border-transparent text-muted hover:text-fg')}>
          {t.label}{t.count !== undefined && <span className="tnum rounded bg-subtle px-1.5 text-2xs text-muted ring-1 ring-inset ring-border">{t.count}</span>}
        </button>
      ))}
    </div>
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
      <div className={cn('h-full rounded-full transition-[width]', tone === 'good' ? 'bg-good' : 'bg-accent')} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 animate-fade-in" />
        <DialogPrimitive.Content aria-describedby={undefined}
          className={cn('fixed left-1/2 top-[12vh] z-50 flex max-h-[80vh] w-[calc(100vw-32px)] -translate-x-1/2 flex-col rounded-lg bg-panel shadow-pop animate-pop-in', wide ? 'max-w-2xl' : 'max-w-md')}>
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
      <Menu.Content align={align} sideOffset={6} className={cn('z-50 min-w-48 rounded-md bg-panel p-1 shadow-pop animate-pop-in', className)}>{children}</Menu.Content>
    </Menu.Portal>
  );
}
export const DropdownItem = ({ children, onSelect, danger, disabled }: { children: React.ReactNode; onSelect?: () => void; danger?: boolean; disabled?: boolean }) => (
  <Menu.Item disabled={disabled} onSelect={onSelect}
    className={cn('flex h-8 cursor-default select-none items-center gap-2 rounded px-2 text-sm outline-none data-[disabled]:opacity-40 data-[highlighted]:bg-hover [&_svg]:size-4 [&_svg]:text-muted', danger && 'text-bad [&_svg]:text-bad')}>{children}</Menu.Item>
);
export const DropdownLabel = ({ children }: { children: React.ReactNode }) => <Menu.Label className="px-2 pb-1 pt-1.5 text-2xs font-medium text-faint">{children}</Menu.Label>;
export const DropdownSeparator = () => <Menu.Separator className="-mx-1 my-1 h-px bg-border" />;

export function Tip({ label, children, side = 'right' }: { label: React.ReactNode; children: React.ReactNode; side?: 'right' | 'bottom' | 'top' }) {
  return (
    <TooltipPrimitive.Root delayDuration={250}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} sideOffset={6} className="z-50 rounded bg-fg px-2 py-1 text-xs text-bg animate-fade-in">{label}</TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
export const TooltipProvider = TooltipPrimitive.Provider;
