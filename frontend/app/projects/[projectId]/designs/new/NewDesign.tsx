'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DesignEditor } from '@/components/design/DesignEditor';
import { PageTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { RequireAuth } from '@/lib/auth';

export function NewDesign() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  return (
    <RequireAuth>
      <p className="mb-2 text-sm"><Link href={`/projects/${projectId}`} className="text-blue-700 hover:underline">← Back to the project</Link></p>
      <PageTitle title="New design" subtitle="Set the inputs, choose thicknesses, then save the design to the project." />
      <DesignEditor saveLabel="Save design" onSave={async (name, inputs) => {
        const saved = await api.designs.create(projectId, { name, inputs });
        router.replace(`/projects/${projectId}/designs/${saved.id}`);
      }} />
    </RequireAuth>
  );
}
