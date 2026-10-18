import { Suspense } from 'react';
import { Loading } from '@/components/ui';
import { EditDesign } from './EditDesign';

export default function DesignPage() {
  return (
    <Suspense fallback={<Loading label="Loading design…" />}>
      <EditDesign />
    </Suspense>
  );
}
