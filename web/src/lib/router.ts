import { useEffect, useState } from 'react';

// Plain #names (e.g. #batches, #batch-b3) so a shared link can open any screen.
export type Section = 'dashboard' | 'academics' | 'learning' | 'assessments' | 'store' | 'reports';
export type Route =
  | { page: 'overview' } | { page: 'academics' } | { page: 'learning' } | { page: 'assessments' } | { page: 'reports' }
  | { page: 'batches' } | { page: 'batch'; id: string } | { page: 'students' } | { page: 'student'; id: string } | { page: 'join-requests' }
  | { page: 'student-report'; id: string; section: 'learning' | 'scores' }
  | { page: 'faculty' } | { page: 'calendar' } | { page: 'announcements' } | { page: 'courses' } | { page: 'course'; id: string } | { page: 'materials' } | { page: 'question-bank' } | { page: 'submissions' } | { page: 'results'; id?: string }
  | { page: 'exams' } | { page: 'exam-new' } | { page: 'exam'; id: string } | { page: 'reviews' }
  | { page: 'report'; kind: ReportKind }
  | { page: 'settings'; tab: string } | { page: 'store'; tab: StoreTab };
export type ReportKind = 'revenue' | 'performance' | 'learning' | 'attendance';
const REPORTS: ReportKind[] = ['revenue', 'performance', 'learning', 'attendance'];
export type StoreTab = 'catalogue' | 'licences' | 'purchases' | 'products' | 'bundles' | 'offers' | 'sales';
const STORE_TABS: StoreTab[] = ['catalogue', 'licences', 'purchases', 'products', 'bundles', 'offers', 'sales'];

export function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  if (h === 'exams-new') return { page: 'exam-new' };
  const rk = REPORTS.find((k) => h === `reports-${k}`);
  if (rk) return { page: 'report', kind: rk };
  if (h.startsWith('results')) return { page: 'results', id: h.slice(8) || undefined };
  const rep = h.match(/^report-(.+)-(learning|scores)$/);
  if (rep) return { page: 'student-report', id: rep[1], section: rep[2] as 'learning' | 'scores' };
  const m = h.match(/^(exam|student|batch|course)-(.+)$/);
  if (m) return { page: m[1] as 'exam' | 'student' | 'batch' | 'course', id: m[2] };
  if (h === 'store' || h.startsWith('store-')) return { page: 'store', tab: STORE_TABS.find((t) => t === h.slice(6)) ?? 'catalogue' };
  if (h.startsWith('academy-')) return { page: 'settings', tab: h.slice(8) || 'general' };
  if (h === 'students-join') return { page: 'join-requests' };
  if (['academics', 'learning', 'assessments', 'reports', 'batches', 'students', 'faculty', 'calendar', 'exams', 'reviews', 'announcements', 'courses', 'materials', 'question-bank', 'submissions'].includes(h)) return { page: h } as Route;
  return { page: 'overview' };
}

export function href(r: Route): string {
  switch (r.page) {
    case 'exam-new': return '#exams-new';
    case 'exam': return `#exam-${r.id}`;
    case 'student': return `#student-${r.id}`;
    case 'student-report': return `#report-${r.id}-${r.section}`;
    case 'batch': return `#batch-${r.id}`;
    case 'course': return `#course-${r.id}`;
    case 'results': return r.id ? `#results-${r.id}` : '#results';
    case 'report': return `#reports-${r.kind}`;
    case 'join-requests': return '#students-join';
    case 'settings': return `#academy-${r.tab}`;
    case 'store': return r.tab === 'catalogue' ? '#store' : `#store-${r.tab}`;
    case 'overview': return '#dashboard';
    default: return `#${r.page}`;
  }
}

export function sectionOf(r: Route): Section | null {
  switch (r.page) {
    case 'overview': return 'dashboard';
    case 'academics': case 'batches': case 'batch': case 'students': case 'student': case 'join-requests': case 'faculty': case 'calendar': return 'academics';
    case 'learning': case 'announcements': case 'courses': case 'course': case 'materials': return 'learning';
    case 'assessments': case 'exams': case 'exam-new': case 'exam': case 'reviews': case 'question-bank': case 'submissions': case 'results': return 'assessments';
    case 'reports': case 'report': case 'student-report': return 'reports';
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
