import { motion } from 'framer-motion';
import { useId, useState } from 'react';
import { cn } from '../lib/utils';

const ease = [0.22, 1, 0.36, 1] as const;

/** Bars drawn over a hatched "track" of the same height, as in the reference design. */
export function HatchedBars({ data, height = 180, format = (v: number) => String(v), highlight }: {
  data: { label: string; value: number; ghost?: number }[]; height?: number; format?: (v: number) => string; highlight?: number;
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.ghost ?? 0))) * 1.08;
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }} role="img" aria-label={data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}>
      {data.map((d, i) => {
        const ghostH = ((d.ghost ?? max / 1.08) / max) * 100;
        const h = (d.value / max) * 100;
        const on = hover === i || (hover === null && highlight === i);
        return (
          <div key={`${d.label}-${i}`} className="flex h-full min-w-0 flex-1 flex-col items-center gap-2" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="relative w-full flex-1">
              <div className="hatch absolute inset-x-0 bottom-0 rounded-xl" style={{ height: `${ghostH}%` }} />
              <motion.div className={cn('absolute inset-x-0 bottom-0 rounded-xl transition-colors duration-200', on ? 'bg-fg' : 'bg-fg/90 dark:bg-fg/80')}
                initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.8, delay: i * 0.05, ease }}>
                <span className={cn('absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-panel px-2 py-0.5 text-2xs font-semibold shadow-pop transition-opacity duration-200', on ? 'opacity-100' : 'opacity-0')}>{format(d.value)}</span>
              </motion.div>
            </div>
            <span className="truncate text-2xs text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Donut with a big centre figure; segments use ink, hatching and grey. */
export function Donut({ segments, size = 180, thickness = 26, center, sub }: {
  segments: { label: string; value: number; tone: 'ink' | 'pop' | 'hatch' | 'grey' }[]; size?: number; thickness?: number; center: React.ReactNode; sub?: React.ReactNode;
}) {
  const id = useId().replace(/:/g, '');
  const total = Math.max(1, segments.reduce((a, s) => a + s.value, 0));
  const r = (size - thickness) / 2, c = 2 * Math.PI * r, gap = segments.length > 1 ? 4 : 0;
  let offset = 0;
  const color = (t: string) => t === 'ink' ? 'hsl(var(--fg))' : t === 'pop' ? 'hsl(var(--pop))' : t === 'hatch' ? `url(#h${id})` : 'hsl(var(--border-strong))';
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(', ')}>
        <defs>
          <pattern id={`h${id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="hsl(var(--subtle))" /><line x1="0" y1="0" x2="0" y2="6" stroke="hsl(var(--border-strong))" strokeWidth="2" />
          </pattern>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--subtle))" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = Math.max(0, (s.value / total) * c - gap);
          const el = (
            <motion.circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color(s.tone)} strokeWidth={thickness} strokeLinecap="round"
              strokeDasharray={`${len} ${c}`} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: -offset }} transition={{ duration: 0.9, delay: i * 0.08, ease }} />
          );
          offset += (s.value / total) * c;
          return el;
        })}
      </svg>
      <div className="absolute text-center"><div className="tnum text-2xl font-bold tracking-tight">{center}</div>{sub && <div className="text-2xs text-muted">{sub}</div>}</div>
    </div>
  );
}

export function Sparkline({ values, className, tone = 'ink' }: { values: number[]; className?: string; tone?: 'ink' | 'pop' }) {
  if (values.length < 2) return null;
  const w = 120, h = 36, min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const stroke = tone === 'pop' ? 'hsl(var(--pop))' : 'hsl(var(--fg))';
  return (
    <motion.div className={cn('h-9 w-full', className)} initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 1, ease }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
        <path d={`${d} L${w},${h} L0,${h} Z`} fill={stroke} opacity={0.08} />
        <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </motion.div>
  );
}

/** Small ring gauge for a percentage. */
export function Ring({ value, size = 44, stroke = 5, tone = 'ink', label }: { value: number; size?: number; stroke?: number; tone?: 'ink' | 'pop'; label?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(v)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--subtle))" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone === 'pop' ? 'hsl(var(--pop))' : 'hsl(var(--fg))'} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (v / 100) * c }} transition={{ duration: 0.9, ease }} />
      </svg>
      <span className="tnum absolute text-[10px] font-bold">{Math.round(v)}%</span>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; tone: 'ink' | 'pop' | 'hatch' | 'grey'; value?: React.ReactNode }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2.5 text-xs">
          <span className={cn('size-2.5 shrink-0 rounded-full', it.tone === 'ink' ? 'bg-fg' : it.tone === 'pop' ? 'bg-pop' : it.tone === 'hatch' ? 'hatch ring-1 ring-border-strong' : 'bg-border-strong')} />
          <span className="flex-1 text-muted">{it.label}</span>
          {it.value !== undefined && <span className="tnum font-semibold">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Change indicator chip, lime when up, coral when down. */
export const Delta = ({ value, suffix = '%' }: { value: number; suffix?: string }) => (
  <span className={cn('tnum inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-2xs font-bold', value >= 0 ? 'bg-pop text-pop-fg' : 'bg-coral text-coral-fg')}>
    {value >= 0 ? '+' : '−'}{Math.abs(value)}{suffix}
  </span>
);
