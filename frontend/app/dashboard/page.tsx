'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ButtonLink, Card, EmptyState, ErrorBox, Loading, PageTitle, VerdictBadge } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { RequireAuth, useAuth } from '@/lib/auth';
import { fixed } from '@/lib/design-defaults';
import type { Dashboard } from '@/lib/types';

export default function DashboardPage() {
  return <RequireAuth><DashboardContent /></RequireAuth>;
}

function DashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setErrors(e instanceof ApiError ? e.messages : [String(e)]));
  }, []);

  if (errors.length) return <ErrorBox messages={errors} title="Could not load the dashboard" />;
  if (!data) return <Loading label="Loading your dashboard…" />;

  const { totals, perProject, recent } = data;
  const maxDesigns = Math.max(1, ...perProject.map((p) => p.designs));

  return (
    <>
      <PageTitle title={`Welcome${user?.name ? `, ${user.name}` : ''}`} subtitle="Your projects and designs at a glance."
        actions={<><ButtonLink href="/projects">New project</ButtonLink><ButtonLink href="/calculator" variant="secondary">Quick calculator</ButtonLink></>} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['Projects', totals.projects, 'text-slate-900'], ['Designs', totals.designs, 'text-slate-900'],
          ['Adequate', totals.adequate, 'text-green-700'], ['Not adequate', totals.notAdequate, 'text-red-700']]
          .map(([label, value, color]) => (
            <Card key={label as string}>
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className={`mt-1 text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
            </Card>
          ))}
      </div>

      {totals.projects === 0 ? (
        <div className="mt-6">
          <EmptyState title="No projects yet">
            Create a project (for example a road section), then add designs to it.
            <div className="mt-4"><ButtonLink href="/projects">Create your first project</ButtonLink></div>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-semibold text-slate-900">Designs per project</h2>
            <div className="mt-2 flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-green-600" />Adequate</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-500" />Not adequate</span>
            </div>
            <ul className="mt-4 space-y-3">
              {perProject.map((p) => (
                <li key={p.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:text-blue-700 hover:underline">{p.name}</Link>
                    <span className="text-slate-500">
                      {p.designs} design{p.designs === 1 ? '' : 's'}
                      {p.averageThicknessMm !== null && ` · avg ${fixed(p.averageThicknessMm, 0)} mm`}
                    </span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img"
                    aria-label={`${p.adequate} adequate, ${p.notAdequate} not adequate`}>
                    <div className="bg-green-600" style={{ width: `${(p.adequate / maxDesigns) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(p.notAdequate / maxDesigns) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-semibold text-slate-900">Recent designs</h2>
            {recent.length === 0 ? <p className="mt-3 text-sm text-slate-500">No designs yet — open a project and add one.</p> : (
              <ul className="mt-3 divide-y divide-slate-100">
                {recent.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/projects/${d.project.id}/designs/${d.id}`} className="block truncate font-medium text-slate-800 hover:text-blue-700 hover:underline">{d.name}</Link>
                      <span className="text-xs text-slate-500">{d.project.name} · {d.layerCount} layers · {fixed(d.totalThicknessMm, 0)} mm</span>
                    </div>
                    <VerdictBadge adequate={d.adequate} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
