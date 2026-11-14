import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import './index.css';
import { useRoute } from './lib/router';
import { useStore } from './lib/store';
import { applyTheme, systemIsDark, useUI } from './lib/ui-state';
import { TopNav } from './components/layout/TopNav';
import { CommandMenu } from './components/layout/CommandMenu';
import { Shortcuts } from './components/layout/Shortcuts';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { Dialogs } from './components/Dialogs';
import { TooltipProvider } from './components/ui';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Exams } from './pages/Exams';
import { ExamNew } from './pages/ExamNew';
import { ExamDetail } from './pages/ExamDetail';
import { Reviews } from './pages/Reviews';
import { Students } from './pages/Students';
import { StudentDetail } from './pages/StudentDetail';
import { StudentReport } from './pages/StudentReport';
import { Announcements } from './pages/Announcements';
import { CourseExplorer, Courses, Materials } from './pages/Courses';
import { BatchDetail, Batches } from './pages/Batches';
import { Faculty } from './pages/Faculty';
import { Calendar } from './pages/Calendar';
import { AcademicsHub, AssessmentsHub, LearningHub, ReportsHub } from './pages/Hubs';
import { Settings } from './pages/Settings';
import { Store } from './pages/Store';

function App() {
  const route = useRoute();
  const signedIn = useStore((s) => s.signedIn);
  const theme = useUI((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => applyTheme('system');
    mq.addEventListener('change', on);
    const mo = new MutationObserver(on);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { mq.removeEventListener('change', on); mo.disconnect(); };
  }, [theme]);

  if (!signedIn) return <Login />;

  const page = (() => {
    switch (route.page) {
      case 'exams': return <Exams />;
      case 'exam-new': return <ExamNew />;
      case 'exam': return <ExamDetail id={route.id} />;
      case 'reviews': return <Reviews />;
      case 'students': return <Students tab="all" />;
      case 'join-requests': return <Students tab="requests" />;
      case 'student': return <StudentDetail id={route.id} />;
      case 'student-report': return <StudentReport id={route.id} section={route.section} />;
      case 'batches': return <Batches />;
      case 'batch': return <BatchDetail id={route.id} />;
      case 'faculty': return <Faculty />;
      case 'calendar': return <Calendar />;
      case 'academics': return <AcademicsHub />;
      case 'learning': return <LearningHub />;
      case 'announcements': return <Announcements />;
      case 'courses': return <Courses />;
      case 'course': return <CourseExplorer key={route.id} id={route.id} />;
      case 'materials': return <Materials />;
      case 'assessments': return <AssessmentsHub />;
      case 'reports': return <ReportsHub />;
      case 'settings': return <Settings tab={route.tab} />;
      case 'store': return <Store tab={route.tab} />;
      default: return <Overview />;
    }
  })();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col">
        <TopNav route={route} />
        {page}
      </div>
      <CommandMenu />
      <Shortcuts />
      <Dialogs />
    </TooltipProvider>
  );
}

function Root() {
  const theme = useUI((s) => s.theme);
  const dark = theme === 'dark' || (theme === 'system' && systemIsDark());
  return (
    <>
      <App />
      <OfflineBanner />
      <Toaster position="bottom-right" theme={dark ? 'dark' : 'light'} toastOptions={{ className: '!rounded-2xl !text-sm !border-border !shadow-float' }} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><MotionConfig reducedMotion="user"><Root /></MotionConfig></StrictMode>);
