import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Suspense } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Pavement Design', template: '%s · Pavement Design' },
  description: 'AASHTO 1993 flexible pavement layer-by-layer design — prepared by Abenezer Tilahun',
};

/** Shown while the header (which reads the URL) is still loading on dynamic pages. */
function HeaderFallback() {
  return <div className="h-[60px] border-b border-slate-200 bg-white" />;
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900">
        <AuthProvider>
          <Suspense fallback={<HeaderFallback />}>
            <AppHeader />
          </Suspense>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            AASHTO 1993 Flexible Pavement Design · Prepared by Abenezer Tilahun
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
