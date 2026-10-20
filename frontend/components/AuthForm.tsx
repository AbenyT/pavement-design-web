'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, ErrorBox, inputClass } from './ui';

/** Sign-in and sign-up form (the same layout for both). */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { status, login, register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'signed-in') router.replace('/dashboard');
  }, [status, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name);
      router.replace('/dashboard');
    } catch (error) {
      setErrors(error instanceof ApiError ? error.messages : ['Something went wrong, please try again.']);
    } finally {
      setBusy(false);
    }
  };

  const isLogin = mode === 'login';
  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <h1 className="text-xl font-semibold text-ink">{isLogin ? 'Sign in' : 'Create your account'}</h1>
        <p className="mt-1 text-sm text-muted">
          {isLogin ? 'Welcome back.' : 'Save designs in projects and see them on your dashboard.'}
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <ErrorBox title={isLogin ? 'Could not sign in' : 'Could not create the account'} messages={errors} />
          {!isLogin && (
            <label className="block text-sm text-muted">Name (optional)
              <input className={`${inputClass} mt-1`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
          )}
          <label className="block text-sm text-muted">Email
            <input className={`${inputClass} mt-1`} type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="block text-sm text-muted">Password
            <input className={`${inputClass} mt-1`} type="password" required minLength={isLogin ? 1 : 8} value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} />
            {!isLogin && <span className="mt-1 block text-xs text-subtle">At least 8 characters.</span>}
          </label>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          {isLogin ? <>No account yet? <Link className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink" href="/register">Create one</Link></>
            : <>Already have an account? <Link className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink" href="/login">Sign in</Link></>}
        </p>
      </Card>
    </div>
  );
}
