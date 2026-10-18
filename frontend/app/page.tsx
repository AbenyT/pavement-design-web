'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ButtonLink, Card } from '@/components/ui';
import { useAuth } from '@/lib/auth';

/** Landing page: signed-in users go straight to their dashboard. */
export default function HomePage() {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === 'signed-in') router.replace('/dashboard');
  }, [status, router]);

  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-semibold text-slate-900">AASHTO 1993 Flexible Pavement Design</h1>
      <p className="mt-3 text-lg text-slate-600">
        Find the required structural number for every layer, choose layer thicknesses, check each layer and the whole
        pavement, and keep your designs organised by project.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/register">Create a free account</ButtonLink>
        <ButtonLink href="/login" variant="secondary">Sign in</ButtonLink>
        <ButtonLink href="/calculator" variant="secondary">Try the calculator without an account</ButtonLink>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ['3, 4 or 5 layers', 'AC course, optional DBM, base, subbase and optional capping layer.'],
          ['Checked layer by layer', 'Each layer must reach the SN required on the layer below it.'],
          ['Projects & exports', 'Save designs per project, see a dashboard, export to CSV or Excel.'],
        ].map(([title, text]) => (
          <Card key={title}><p className="font-medium text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-600">{text}</p></Card>
        ))}
      </div>
    </div>
  );
}
