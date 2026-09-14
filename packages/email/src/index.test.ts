import { describe, expect, it, vi } from 'vitest';
import { RuknyEmail, RuknyEmailError } from './index';

describe('RuknyEmail', () => {
  it('requires an api key', () => {
    expect(() => new RuknyEmail({ apiKey: '' })).toThrow(/apiKey/);
  });

  it('sends email with Idempotency-Key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'em_1', status: 'queued' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new RuknyEmail({
      apiKey: 'rk_test_x',
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await client.messages.send(
      {
        from: 'noreply@example.com',
        to: 'user@example.com',
        subject: 'Welcome',
        bodyText: 'Hello',
      },
      { idempotencyKey: 'welcome_001' },
    );

    expect(result.id).toBe('em_1');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      'X-API-Key': 'rk_test_x',
      'Idempotency-Key': 'welcome_001',
    });
  });

  it('throws RuknyEmailError on failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Quota exceeded' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new RuknyEmail({
      apiKey: 'rk_live_x',
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(
      client.messages.send(
        {
          from: 'noreply@example.com',
          to: ['user@example.com'],
          subject: 'Hi',
          bodyText: 'Hi',
        },
        { idempotencyKey: 'k1' },
      ),
    ).rejects.toBeInstanceOf(RuknyEmailError);
  });

  it('requires idempotency key', async () => {
    const client = new RuknyEmail({
      apiKey: 'rk_test_x',
      fetch: vi.fn() as unknown as typeof fetch,
    });

    await expect(
      client.messages.send(
        {
          from: 'a@b.com',
          to: 'c@d.com',
          subject: 'x',
          bodyText: 'y',
        },
        { idempotencyKey: '' },
      ),
    ).rejects.toThrow(/idempotencyKey/);
  });
});
