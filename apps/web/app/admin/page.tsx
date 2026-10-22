import { Suspense } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

import { loadAdminMetrics } from '~/lib/admin/load-metrics';

export const metadata = { title: 'Admin', robots: { index: false } };

export default function AdminPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Metrics />
    </Suspense>
  );
}

async function Metrics() {
  const m = await loadAdminMetrics();

  const stats: [string, string][] = [
    ['Sign-ups (total)', String(m.signups_total)],
    ['Sign-ups (30 days)', String(m.signups_30d)],
    ['Active subscriptions', String(m.activeSubscriptions)],
    ['MRR', `${m.mrr.toFixed(2)} EUR`],
    ['AI costs (30 days)', `${Number(m.ai_cost_eur_30d).toFixed(4)} EUR`],
    ['AI calls unpriced (30 days)', String(m.ai_unpriced_30d)],
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid grid-cols-2 gap-4">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl">{value}</CardContent>
          </Card>
        ))}
      </div>
      <h2 className="text-lg font-semibold">Failed jobs (last 20)</h2>
      {m.failed_jobs.length === 0 ? (
        <p>None.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Type</th>
              <th>Attempts</th>
              <th>Last error</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {m.failed_jobs.map((j) => (
              <tr key={j.id}>
                <td>{j.type}</td>
                <td>{j.attempts}</td>
                <td className="max-w-xs truncate">{j.last_error}</td>
                <td>{new Date(j.created_at).toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
