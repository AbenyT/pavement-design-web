'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DesignEditor } from '@/components/design/DesignEditor';
import { BackLink, ErrorBox, Loading, PageTitle, VerdictBadge } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { RequireAuth } from '@/lib/auth';
import type { SavedDesign } from '@/lib/types';

export function EditDesign() {
  return <RequireAuth><EditDesignContent /></RequireAuth>;
}

function EditDesignContent() {
  const { projectId, designId } = useParams<{ projectId: string; designId: string }>();
  const [design, setDesign] = useState<SavedDesign | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    api.designs.get(designId).then(setDesign).catch((e) => setErrors(e instanceof ApiError ? e.messages : [String(e)]));
  }, [designId]);

  if (errors.length) return <ErrorBox messages={errors} title="Could not load the design" />;
  if (!design) return <Loading label="Loading design…" />;

  return (
    <>
      <BackLink href={`/projects/${projectId}`}>{design.project.name}</BackLink>
      <PageTitle title={design.name}
        subtitle={<>Saved result: <VerdictBadge adequate={design.adequate} /> · last saved {new Date(design.updatedAt).toLocaleString()}</>} />
      <DesignEditor key={design.id} initialInputs={design.inputs} initialName={design.name} saveLabel="Save changes"
        onSave={async (name, inputs) => { setDesign(await api.designs.update(design.id, { name, inputs }).then((d) => ({ ...design, ...d }))); }} />
    </>
  );
}
