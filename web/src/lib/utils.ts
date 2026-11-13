import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...c: ClassValue[]) => twMerge(clsx(c));

export const initials = (n: string) =>
  n.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const pad = (n: number) => String(n).padStart(2, '0');
export const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const fmtDateTime = (iso: string | number) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const fmtDate = (iso: string | number) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function timeAgo(t: number) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d ago` : fmtDate(t);
}

export function relativeTo(iso: string) {
  const ms = +new Date(iso) - Date.now();
  const abs = Math.abs(ms), m = Math.round(abs / 60000), h = Math.round(abs / 3600000), d = Math.round(abs / 86400000);
  const span = m < 60 ? `${m} min` : h < 48 ? `${h} h` : `${d} days`;
  return ms >= 0 ? `in ${span}` : `${span} ago`;
}

export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Indian short form: 2,512 → 2.5K, 9,50,000 → 9.5L, 2,10,00,000 → 2.1Cr. */
export function compactIN(n: number) {
  const a = Math.abs(n), t = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ''));
  if (a >= 1e7) return `${t(n / 1e7)}Cr`;
  if (a >= 1e5) return `${t(n / 1e5)}L`;
  if (a >= 1e3) return `${t(n / 1e3)}K`;
  return String(Math.round(n));
}
export const inrShort = (n: number) => `₹${compactIN(n)}`;

type Saver = { save: (r: { filename: string; data: Blob }) => Promise<unknown> } | null;
type Host = { use?: (name: string) => Promise<unknown> };

/** Saves rows as a CSV file that opens cleanly in Excel. */
export function downloadCSV(name: string, rows: (string | number | null | undefined)[][]): Promise<boolean> {
  const esc = (v: string | number | null | undefined) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return downloadBlob(name, new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
}

/**
 * Hands a file to the viewer. Resolves true when it was handed over.
 * Inside the shared claude.ai link, plain downloads are blocked, so the viewer's own save prompt is used there.
 */
export async function downloadBlob(name: string, blob: Blob): Promise<boolean> {
  const host = (window as unknown as { claude?: Host }).claude;
  if (host?.use) {
    const downloads = (await host.use('downloads').catch(() => null)) as Saver;
    if (downloads) {
      try { await downloads.save({ filename: name, data: blob }); return true; }
      catch { return false; } // declined or unavailable: never retry on the viewer's behalf
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return true;
}

/** Small persisted value for per-viewer preferences (columns, filters). */
export const prefs = {
  get<T>(k: string, fallback: T): T { try { const v = localStorage.getItem(k); return v ? { ...fallback, ...JSON.parse(v) } : fallback; } catch { return fallback; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};

/** Shrinks a chosen photo to a small square JPEG (data URL) so it can be saved with the record. */
export function photoToDataUrl(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'), s = Math.min(img.width, img.height);
      c.width = c.height = size;
      c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(img.src); resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
