import { useEffect, useState } from 'react';

// Plain #names (e.g. #exams, #exam-ab12cd) so a shared link can open any screen.
export type Route =
  | { page: 'overview' } | { page: 'exams' } | { page: 'exam-new' } | { page: 'exam'; id: string }
  | { page: 'reviews' } | { page: 'students' } | { page: 'student'; id: string } | { page: 'join-requests' }
  | { page: 'batches' } | { page: 'reports' } | { page: 'settings'; tab: string };

export function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  const m = h.match(/^(exam|student)-(.+)$/);
  if (h === 'exams-new') return { page: 'exam-new' };
  if (m && m[2] !== 'new') return m[1] === 'exam' ? { page: 'exam', id: m[2] } : { page: 'student', id: m[2] };
  if (h.startsWith('academy-')) return { page: 'settings', tab: h.slice(8) || 'general' };
  if (h === 'students-join') return { page: 'join-requests' };
  if (['exams', 'reviews', 'students', 'batches', 'reports'].includes(h)) return { page: h } as Route;
  return { page: 'overview' };
}

export function href(r: Route): string {
  switch (r.page) {
    case 'exam-new': return '#exams-new';
    case 'exam': return `#exam-${r.id}`;
    case 'student': return `#student-${r.id}`;
    case 'join-requests': return '#students-join';
    case 'settings': return `#academy-${r.tab}`;
    default: return `#${r.page}`;
  }
}

export const navigate = (r: Route) => { location.hash = href(r); };

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => { setRoute(parse(location.hash)); document.querySelector('main')?.scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}
