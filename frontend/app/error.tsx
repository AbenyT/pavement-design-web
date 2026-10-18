'use client'; // Error boundaries must be Client Components
import { useEffect } from 'react';
import { Button, Card } from '@/components/ui';

/** Shown when a page crashes unexpectedly; "Try again" re-renders it. */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-12">
      <Card>
        <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page could not be shown. If the server was asleep (free hosting), wait a moment and try again.
        </p>
        <Button className="mt-4" onClick={() => retry()}>Try again</Button>
      </Card>
    </div>
  );
}
