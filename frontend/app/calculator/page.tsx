import type { Metadata } from 'next';
import { DesignEditor } from '@/components/design/DesignEditor';
import { PageTitle } from '@/components/ui';

export const metadata: Metadata = { title: 'Quick calculator' };

/** Public calculator: no account needed, nothing is saved. */
export default function CalculatorPage() {
  return (
    <>
      <PageTitle title="Quick calculator"
        subtitle="Try a design without an account. Sign in to save designs in projects and export them." />
      <DesignEditor />
    </>
  );
}
