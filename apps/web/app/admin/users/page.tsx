import { Suspense } from 'react';

import Link from 'next/link';

import { loadAdminUsers } from '~/lib/admin/load-users';

export const metadata = { title: 'Admin users', robots: { index: false } };

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Users searchParams={searchParams} />
    </Suspense>
  );
}

async function Users({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, Math.trunc(Number((await searchParams).page)) || 1);
  const { rows, hasMore } = await loadAdminUsers(page);

  return (
    <>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p>
        <Link href="/admin" className="underline">
          Back to admin
        </Link>
      </p>
      {rows.length === 0 ? (
        <p>None.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Email</th>
              <th>Confirmed</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.emailConfirmed ? 'yes' : 'no'}</td>
                <td>{u.plan ?? '-'}</td>
                <td>{u.status ?? '-'}</td>
                <td>{new Date(u.createdAt).toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <nav aria-label="Pagination" className="flex gap-4">
        {page > 1 && (
          <Link href={`/admin/users?page=${page - 1}`} className="underline">
            Previous
          </Link>
        )}
        {hasMore && (
          <Link href={`/admin/users?page=${page + 1}`} className="underline">
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
