'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useIsClient } from '@/lib/use-is-client';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/calculator', label: 'Quick calculator' },
];

export function AppHeader() {
  const { status: authStatus, user, logout } = useAuth();
  const pathname = usePathname();
  // The server cannot know whether the browser holds a sign-in token, so the first render must be
  // the neutral "loading" header on both sides; the real links appear once mounted in the browser.
  // (Without this React reports a hydration mismatch and rebuilds the page, losing typed input.)
  const status = useIsClient() ? authStatus : 'loading';
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="leading-tight">
          <span className="block text-lg font-semibold text-slate-900">Flexible Pavement Design</span>
          <span className="block text-xs text-slate-500">AASHTO 1993 · layer-by-layer structural number method</span>
        </Link>
        <p className="text-sm text-slate-500">Prepared by <strong className="font-semibold text-slate-800">Abenezer Tilahun</strong></p>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {status === 'signed-in' && NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`rounded-md px-3 py-1.5 ${pathname.startsWith(item.href)
                ? 'bg-blue-50 font-medium text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
              {item.label}
            </Link>
          ))}
          {status === 'signed-in' && (
            <>
              <span className="hidden px-2 text-slate-400 md:inline" title={user?.email}>{user?.name || user?.email}</span>
              <button onClick={logout} className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100">Sign out</button>
            </>
          )}
          {status === 'signed-out' && (
            <>
              <Link href="/calculator" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100">Quick calculator</Link>
              <Link href="/login" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100">Sign in</Link>
              <Link href="/register" className="rounded-md bg-blue-700 px-3 py-1.5 font-medium text-white hover:bg-blue-800">Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
