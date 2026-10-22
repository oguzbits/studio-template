import { Suspense } from 'react';

import { AuthProvider } from '~/components/auth-provider';
import { requireAdmin } from '~/lib/admin/load-metrics';

// Sync layout (Cache Components): the guard streams behind Suspense and renders
// nothing but a 404 for non-admins. The page/data loader checks again.
export default function AdminLayout({ children }: React.PropsWithChildren) {
  return (
    <AuthProvider>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Suspense fallback={<p>Loading…</p>}>
          <Guard>{children}</Guard>
        </Suspense>
      </div>
    </AuthProvider>
  );
}

async function Guard({ children }: React.PropsWithChildren) {
  await requireAdmin();

  return children;
}
