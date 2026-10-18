'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DesignEditor } from '@/components/design/DesignEditor';
import { ErrorBox, Loading, PageTitle, VerdictBadge } from '@/components/ui';
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
      <p className="mb-2 text-sm">
        <Link href={`/projects/${projectId}`} className="text-blue-700 hover:underline">← {design.project.name}</Link>
      </p>
      <PageTitle title={design.name}
        subtitle={<>Saved result: <VerdictBadge adequate={design.adequate} /> · last saved {new Date(design.updatedAt).toLocaleString()}</>} />
      <DesignEditor key={design.id} initialInputs={design.inputs} initialName={design.name} saveLabel="Save changes"
        onSave={async (name, inputs) => { setDesign(await api.designs.update(design.id, { name, inputs }).then((d) => ({ ...design, ...d }))); }} />
    </>
  );
}
