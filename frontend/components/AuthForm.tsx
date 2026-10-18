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
        <h1 className="text-xl font-semibold text-slate-900">{isLogin ? 'Sign in' : 'Create your account'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLogin ? 'Welcome back.' : 'Save designs in projects and see them on your dashboard.'}
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <ErrorBox title={isLogin ? 'Could not sign in' : 'Could not create the account'} messages={errors} />
          {!isLogin && (
            <label className="block text-sm text-slate-600">Name (optional)
              <input className={`${inputClass} mt-1`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
          )}
          <label className="block text-sm text-slate-600">Email
            <input className={`${inputClass} mt-1`} type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="block text-sm text-slate-600">Password
            <input className={`${inputClass} mt-1`} type="password" required minLength={isLogin ? 1 : 8} value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} />
            {!isLogin && <span className="mt-1 block text-xs text-slate-400">At least 8 characters.</span>}
          </label>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {isLogin ? <>No account yet? <Link className="text-blue-700 hover:underline" href="/register">Create one</Link></>
            : <>Already have an account? <Link className="text-blue-700 hover:underline" href="/login">Sign in</Link></>}
        </p>
      </Card>
    </div>
  );
}
