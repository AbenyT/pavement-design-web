import { ButtonLink, Card } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-12">
      <Card>
        <h1 className="text-lg font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-muted">This page does not exist or was moved.</p>
        <div className="mt-4"><ButtonLink href="/">Go to the start page</ButtonLink></div>
      </Card>
    </div>
  );
}
