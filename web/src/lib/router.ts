import { useEffect, useState } from 'react';

// Plain #names (e.g. #batches, #batch-b3) so a shared link can open any screen.
export type Section = 'dashboard' | 'academics' | 'learning' | 'assessments' | 'store' | 'reports';
export type Route =
  | { page: 'overview' } | { page: 'academics' } | { page: 'learning' } | { page: 'assessments' } | { page: 'reports' }
  | { page: 'batches' } | { page: 'batch'; id: string } | { page: 'students' } | { page: 'student'; id: string } | { page: 'join-requests' }
  | { page: 'faculty' } | { page: 'calendar' }
  | { page: 'exams' } | { page: 'exam-new' } | { page: 'exam'; id: string } | { page: 'reviews' }
  | { page: 'settings'; tab: string } | { page: 'store'; tab: 'pf' | 'licences' | 'mine' };

export function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  if (h === 'exams-new') return { page: 'exam-new' };
  const m = h.match(/^(exam|student|batch)-(.+)$/);
  if (m) return { page: m[1] as 'exam' | 'student' | 'batch', id: m[2] };
  if (h === 'store' || h.startsWith('store-')) return { page: 'store', tab: (['licences', 'mine'].includes(h.slice(6)) ? h.slice(6) : 'pf') as 'pf' };
  if (h.startsWith('academy-')) return { page: 'settings', tab: h.slice(8) || 'general' };
  if (h === 'students-join') return { page: 'join-requests' };
  if (['academics', 'learning', 'assessments', 'reports', 'batches', 'students', 'faculty', 'calendar', 'exams', 'reviews'].includes(h)) return { page: h } as Route;
  return { page: 'overview' };
}

export function href(r: Route): string {
  switch (r.page) {
    case 'exam-new': return '#exams-new';
    case 'exam': return `#exam-${r.id}`;
    case 'student': return `#student-${r.id}`;
    case 'batch': return `#batch-${r.id}`;
    case 'join-requests': return '#students-join';
    case 'settings': return `#academy-${r.tab}`;
    case 'store': return r.tab === 'pf' ? '#store' : `#store-${r.tab}`;
    case 'overview': return '#dashboard';
    default: return `#${r.page}`;
  }
}

export function sectionOf(r: Route): Section | null {
  switch (r.page) {
    case 'overview': return 'dashboard';
    case 'academics': case 'batches': case 'batch': case 'students': case 'student': case 'join-requests': case 'faculty': case 'calendar': return 'academics';
    case 'learning': return 'learning';
    case 'assessments': case 'exams': case 'exam-new': case 'exam': case 'reviews': return 'assessments';
    case 'reports': return 'reports';
    case 'store': return 'store';
    default: return null;
  }
}

export const navigate = (r: Route) => { location.hash = href(r); };

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => { setRoute(parse(location.hash)); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}
