import { beforeEach, describe, expect, it, vi } from 'vitest';

const { insert, rateLimit, enqueueJob } = vi.hoisted(() => ({
  insert: vi.fn(),
  rateLimit: vi.fn(),
  enqueueJob: vi.fn(),
}));

vi.mock('@kit/next/actions', () => ({
  enhanceAction: (fn: (p: unknown) => unknown) => fn,
}));

vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({
    from: () => ({
      insert: (row: unknown) => ({
        select: () => ({ single: () => insert(row) }),
      }),
    }),
  }),
}));

vi.mock('~/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => rateLimit(...args),
}));

vi.mock('~/lib/jobs/enqueue', () => ({ enqueueJob }));

import { submitContact } from './contact-actions';

const form = (fields: Record<string, string>) => {
  const fd = new FormData();

  for (const [key, value] of Object.entries(fields)) fd.set(key, value);

  return fd;
};

const valid = { email: 'Anna@Example.com ', name: 'Anna', message: 'Hello' };

describe('submitContact', () => {
  beforeEach(() => {
    insert
      .mockReset()
      .mockResolvedValue({ data: { id: 'msg-1' }, error: null });
    rateLimit.mockReset().mockResolvedValue(true);
    enqueueJob.mockReset().mockResolvedValue(undefined);
  });

  it('stores a valid message and enqueues the notification job', async () => {
    await expect(submitContact(form(valid))).resolves.toEqual({ ok: true });

    expect(insert).toHaveBeenCalledWith({
      email: 'anna@example.com',
      name: 'Anna',
      message: 'Hello',
    });
    expect(enqueueJob).toHaveBeenCalledWith('contact-notification', {
      messageId: 'msg-1',
    });
  });

  it('stores an empty name as null', async () => {
    await submitContact(form({ ...valid, name: '  ' }));

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: null }),
    );
  });

  it('rejects over the per-IP limit without inserting or enqueueing', async () => {
    rateLimit.mockResolvedValue(false);

    await expect(submitContact(form(valid))).resolves.toEqual({
      ok: false,
      error: 'rate-limited',
    });
    expect(rateLimit).toHaveBeenCalledWith('contact', 3, 3600);
    expect(insert).not.toHaveBeenCalled();
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  it.each([
    ['empty message', { message: '   ' }],
    ['invalid email', { email: 'nope' }],
    ['missing email', { email: '' }],
    ['2001 characters', { message: 'x'.repeat(2001) }],
    ['name over 100 characters', { name: 'n'.repeat(101) }],
    ['NUL byte in message', { message: 'a\0b' }],
    ['NUL byte in name', { name: 'a\0b' }],
    ['NUL byte in email', { email: 'a\0@example.com' }],
  ])('rejects %s as invalid without touching the database', async (_, bad) => {
    await expect(submitContact(form({ ...valid, ...bad }))).resolves.toEqual({
      ok: false,
      error: 'invalid',
    });
    expect(insert).not.toHaveBeenCalled();
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  it('counts invalid submissions against the limit (limit runs before validation)', async () => {
    await submitContact(form({ ...valid, message: '' }));

    expect(rateLimit).toHaveBeenCalledTimes(1);
  });

  it('accepts exactly 2000 characters, umlauts and HTML characters unchanged', async () => {
    const message = '<script>alert("ä")</script> '.padEnd(2000, 'ö');
    expect(message).toHaveLength(2000);

    await expect(submitContact(form({ ...valid, message }))).resolves.toEqual({
      ok: true,
    });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ message }));
  });

  it('still reports ok when only the notification job cannot be enqueued', async () => {
    enqueueJob.mockRejectedValue(new Error('queue down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(submitContact(form(valid))).resolves.toEqual({ ok: true });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('reports failed when the insert fails and enqueues nothing', async () => {
    insert.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(submitContact(form(valid))).resolves.toEqual({
      ok: false,
      error: 'failed',
    });
    expect(enqueueJob).not.toHaveBeenCalled();
  });
});
