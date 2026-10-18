import { Suspense } from 'react';
import { Loading } from '@/components/ui';
import { ProjectDetail } from './ProjectDetail';

// The project id is only known at request time, so the client part sits inside <Suspense>
// (required by Next.js 16 Cache Components for components that read URL params).
export default function ProjectPage() {
  return (
    <Suspense fallback={<Loading label="Loading project…" />}>
      <ProjectDetail />
    </Suspense>
  );
}
