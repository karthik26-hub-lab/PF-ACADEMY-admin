import { useEffect, useState } from 'react';

/** Re-renders every `ms` so relative times ("2 min ago") stay current. */
export function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]);
}

export function useOnline() {
  const [online, set] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => set(true), off = () => set(false);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);
  return online;
}
