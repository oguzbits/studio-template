import { beforeEach, describe, expect, it, vi } from 'vitest';

const { state, updateUser, accountsUpdate, match } = vi.hoisted(() => ({
  state: { user: null as { id: string } | null },
  updateUser: vi.fn(),
  accountsUpdate: vi.fn(),
  match: vi.fn(),
}));

// same contract as the real enhanceAction: auth is required unless `auth: false`
vi.mock('@kit/next/actions', () => ({
  enhanceAction:
    (fn: (p: unknown, user: unknown) => unknown, config: { auth?: boolean }) =>
    async (params: unknown) => {
      if ((config.auth ?? true) && !state.user) {
        throw new Error('UNAUTHENTICATED');
      }

      return fn(params, state.user ?? undefined);
    },
}));
vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: () => ({
    auth: { updateUser },
    from: (table: string) => ({
      update: (values: unknown) => {
        accountsUpdate(table, values);

        return { match };
      },
    }),
  }),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const { completeOnboarding } = await import('./onboarding-actions');

const form = (fields: Record<string, string>) => {
  const fd = new FormData();

  for (const [key, value] of Object.entries(fields)) fd.set(key, value);

  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  state.user = { id: 'user-1' };
  updateUser.mockResolvedValue({ error: null });
  match.mockResolvedValue({ error: null });
});

describe('completeOnboarding', () => {
  it('saves the name like the profile form and sets the flag, then goes home', async () => {
    await expect(
      completeOnboarding(form({ intent: 'continue', name: '  Anna  ' })),
    ).rejects.toThrow('REDIRECT /home');

    expect(accountsUpdate).toHaveBeenCalledWith('accounts', { name: 'Anna' });
    expect(match).toHaveBeenCalledWith({ id: 'user-1' });
    expect(updateUser).toHaveBeenCalledWith({ data: { onboarded: true } });
  });

  it('continue without a name only sets the flag', async () => {
    await expect(
      completeOnboarding(form({ intent: 'continue', name: '  ' })),
    ).rejects.toThrow('REDIRECT /home');

    expect(accountsUpdate).not.toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalledWith({ data: { onboarded: true } });
  });

  it('skip sets only the flag, even when a name was typed', async () => {
    await expect(
      completeOnboarding(form({ intent: 'skip', name: 'Anna' })),
    ).rejects.toThrow('REDIRECT /home');

    expect(accountsUpdate).not.toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalledWith({ data: { onboarded: true } });
  });

  it('rejects a name over 80 characters and leaves the flag unset', async () => {
    await expect(
      completeOnboarding(form({ intent: 'continue', name: 'a'.repeat(81) })),
    ).rejects.not.toThrow('REDIRECT');

    expect(accountsUpdate).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('accepts exactly 80 characters', async () => {
    await expect(
      completeOnboarding(form({ intent: 'continue', name: 'a'.repeat(80) })),
    ).rejects.toThrow('REDIRECT /home');
  });

  it('does not set the flag when saving the name fails', async () => {
    match.mockResolvedValue({ error: { message: 'x' } });

    await expect(
      completeOnboarding(form({ intent: 'continue', name: 'Anna' })),
    ).rejects.not.toThrow('REDIRECT');
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('throws when the flag cannot be set (no silent redirect loop)', async () => {
    updateUser.mockResolvedValue({ error: { message: 'x' } });

    await expect(
      completeOnboarding(form({ intent: 'skip' })),
    ).rejects.not.toThrow('REDIRECT');
  });

  it('rejects a signed-out caller before any write', async () => {
    state.user = null;

    await expect(completeOnboarding(form({ intent: 'skip' }))).rejects.toThrow(
      'UNAUTHENTICATED',
    );
    expect(accountsUpdate).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });
});
