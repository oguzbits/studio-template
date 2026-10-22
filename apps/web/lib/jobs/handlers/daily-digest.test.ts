import { beforeEach, describe, expect, it, vi } from 'vitest';

const { digestSends, sendEmail, getUserById, getDigestItems } = vi.hoisted(
  () => ({
    digestSends: new Set<string>(),
    sendEmail: vi.fn(),
    getUserById: vi.fn(),
    getDigestItems: vi.fn(),
  }),
);

type Row = { user_id: string; day: string };

// in-memory digest_sends with the primary key (user_id, day)
const table = {
  upsert: (row: Row) => ({
    select: () => ({
      maybeSingle: async () => {
        const key = `${row.user_id}:${row.day}`;

        if (digestSends.has(key)) {
          return { data: null, error: null };
        }

        digestSends.add(key);

        return { data: row, error: null };
      },
    }),
  }),
  delete: () => ({
    match: async (row: Row) => {
      digestSends.delete(`${row.user_id}:${row.day}`);

      return { error: null };
    },
  }),
};

vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({
    from: () => table,
    auth: { admin: { getUserById } },
  }),
}));
vi.mock('~/lib/email/send-email', () => ({ sendEmail }));
vi.mock('~/lib/jobs/digest-items', () => ({ getDigestItems }));
vi.mock('~/config/app.config', () => ({ default: { name: 'Studio' } }));

const { dailyDigest } = await import('./daily-digest');

const userId = '00000000-0000-0000-0000-00000000000a';
const day = '2026-10-22';
const ctx = { now: new Date('2026-10-22T06:00:00Z') };
const items = [{ title: 'Item', url: 'http://localhost:3000' }];

beforeEach(() => {
  vi.clearAllMocks();
  digestSends.clear();
  getDigestItems.mockResolvedValue(items);
  getUserById.mockResolvedValue({
    data: { user: { id: userId, email: 'a@test.local' } },
    error: null,
  });
  sendEmail.mockResolvedValue({ id: 'email_1' });
});

describe('daily-digest', () => {
  it('sends at most one digest per user and day', async () => {
    await dailyDigest({ user_id: userId, day }, ctx);
    await dailyDigest({ user_id: userId, day }, ctx);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@test.local',
        idempotencyKey: `digest:${userId}:${day}`,
      }),
    );
    expect(getDigestItems).toHaveBeenCalledWith(userId, day);
  });

  it('releases the reservation and rethrows when sending fails', async () => {
    sendEmail.mockRejectedValueOnce(new Error('resend down'));

    await expect(dailyDigest({ user_id: userId, day }, ctx)).rejects.toThrow(
      'resend down',
    );
    expect(digestSends.size).toBe(0);

    // the retry sends
    await dailyDigest({ user_id: userId, day }, ctx);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it('sends nothing for an empty digest but keeps the reservation', async () => {
    getDigestItems.mockResolvedValue([]);

    await dailyDigest({ user_id: userId, day }, ctx);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(digestSends.has(`${userId}:${day}`)).toBe(true);
  });

  it('rejects an invalid payload', async () => {
    await expect(
      dailyDigest({ user_id: userId, day: 'today' }, ctx),
    ).rejects.toThrow();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
