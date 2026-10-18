'use client';
// Sign-in state for the whole app: the JWT is kept in localStorage and checked with /auth/me.
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, onUnauthorized, setToken } from './api';
import { useIsClient } from './use-is-client';
import type { User } from './types';

type Status = 'loading' | 'signed-in' | 'signed-out';

interface AuthState {
  status: Status;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus('signed-out');
  }, []);

  // On first load: is there a stored token, and is it still valid?
  useEffect(() => {
    let cancelled = false;
    const check = getToken() ? api.me() : Promise.reject(new Error('not signed in'));
    check
      .then((me) => { if (!cancelled) { setUser(me); setStatus('signed-in'); } })
      .catch(() => { if (!cancelled) signOut(); });
    return () => { cancelled = true; };
  }, [signOut]);

  // Any 401 from the API (expired token) signs the user out.
  useEffect(() => {
    const unsubscribe = onUnauthorized(signOut);
    return () => { unsubscribe(); };
  }, [signOut]);

  const value = useMemo<AuthState>(() => ({
    status,
    user,
    login: async (email, password) => {
      const res = await api.login({ email, password });
      setToken(res.accessToken);
      setUser(res.user);
      setStatus('signed-in');
    },
    register: async (email, password, name) => {
      const res = await api.register({ email, password, name: name || undefined });
      setToken(res.accessToken);
      setUser(res.user);
      setStatus('signed-in');
    },
    logout: signOut,
  }), [status, user, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

/** Wrap protected pages: shows a loader while checking, sends signed-out users to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  // First render matches the server ("checking"), even if the sign-in check already finished,
  // so React can hydrate without a mismatch.
  const mounted = useIsClient();
  useEffect(() => {
    if (status === 'signed-out') router.replace('/login');
  }, [status, router]);
  if (!mounted || status !== 'signed-in') {
    return <div className="py-24 text-center text-slate-500">Checking your sign-in…</div>;
  }
  return <>{children}</>;
}
