import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useStore } from '../lib/store';
import { Button, Field, Input } from '../components/ui';

export function Login() {
  const signIn = useStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); signIn(email.trim()); if (!location.hash) location.hash = '#overview'; };

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-fg text-[11px] font-semibold text-bg">PF</span>
          <span className="text-sm font-semibold">Parallax Flow</span>
        </div>
        <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Academy admins, exam managers and reviewers.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Work email" htmlFor="lg-email"><Input id="lg-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@academy.com" className="h-9" /></Field>
            <Field label="Password" htmlFor="lg-pass">
              <div className="relative">
                <Input id="lg-pass" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-9 pr-9" />
                <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-9 place-items-center text-faint hover:text-fg" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
            </Field>
            <Button type="submit" variant="primary" className="h-9 w-full">Continue <ArrowRight /></Button>
          </form>
          <p className="mt-6 text-xs leading-relaxed text-muted">Students sign in on the Parallax Flow app with the login ID from their academy.</p>
          <p className="mt-3 rounded-md border border-border bg-subtle px-3 py-2 text-xs text-muted">Preview build: sign-in isn’t connected yet, so any details open the console.</p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-subtle lg:block">
        <div className="absolute inset-0 [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative flex h-full flex-col justify-center px-14">
          <p className="max-w-md text-[28px] font-semibold leading-[1.15] tracking-[-0.025em]">Run exams, let AI mark the scripts, and review only what needs a faculty eye.</p>
          <div className="mt-10 w-full max-w-md overflow-hidden rounded-lg border border-border bg-panel shadow-pop">
            {[
              ['Step 3 · Add back donation', '1 / 1', 'Reviewed'],
              ['Step 4 · Depreciation u/s 32', '1 / 1.5', 'Partly correct'],
              ['Step 5 · Income from business', '3 / 3', 'Matches'],
            ].map(([s, m, t]) => (
              <div key={s} className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-0">
                <span className="flex-1 truncate">{s}</span><span className="text-xs text-muted">{t}</span><span className="tnum w-14 text-right font-medium">{m}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">Step-wise marking against the ICAI scheme</p>
        </div>
      </div>
    </div>
  );
}
