import { Suspense } from 'react';
import { Loading } from '@/components/ui';
import { NewDesign } from './NewDesign';

export default function NewDesignPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewDesign />
    </Suspense>
  );
}
