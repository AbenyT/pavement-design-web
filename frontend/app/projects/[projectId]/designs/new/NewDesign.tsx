'use client';
import { useParams, useRouter } from 'next/navigation';
import { DesignEditor } from '@/components/design/DesignEditor';
import { BackLink, PageTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { RequireAuth } from '@/lib/auth';

export function NewDesign() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  return (
    <RequireAuth>
      <BackLink href={`/projects/${projectId}`}>Back to the project</BackLink>
      <PageTitle title="New design" subtitle="Set the inputs, choose thicknesses, then save the design to the project." />
      <DesignEditor saveLabel="Save design" onSave={async (name, inputs) => {
        const saved = await api.designs.create(projectId, { name, inputs });
        router.replace(`/projects/${projectId}/designs/${saved.id}`);
      }} />
    </RequireAuth>
  );
}
