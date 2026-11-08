import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import './index.css';
import { useRoute } from './lib/router';
import { useStore } from './lib/store';
import { applyTheme, systemIsDark, useUI } from './lib/ui-state';
import { Sidebar } from './components/layout/Sidebar';
import { CommandMenu } from './components/layout/CommandMenu';
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
import { Batches } from './pages/Batches';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

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
      case 'batches': return <Batches />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings tab={route.tab} />;
      default: return <Overview />;
    }
  })();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <Sidebar route={route} />
        {page}
      </div>
      <CommandMenu />
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
      <Toaster position="bottom-right" theme={dark ? 'dark' : 'light'} toastOptions={{ className: '!rounded-md !text-sm !border-border !shadow-pop' }} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>);
