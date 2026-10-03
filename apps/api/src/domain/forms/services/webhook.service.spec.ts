import axios from 'axios';
import { WebhookService } from './webhook.service';
import * as ssrfGuard from '../../../core/common/utils/ssrf-guard';

jest.mock('axios');

describe('WebhookService', () => {
  const service = new WebhookService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks unsafe webhook URLs before sending', async () => {
    jest.spyOn(ssrfGuard, 'assertUrlSafe').mockRejectedValue(
      new Error('blocked'),
    );

    const result = await service.sendWebhook('http://127.0.0.1/hook', {
      event: 'form.submission.created',
      timestamp: new Date().toISOString(),
      formId: 'form-1',
      formSlug: 'test',
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Unsafe webhook URL');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('sends webhook when URL passes SSRF validation', async () => {
    jest.spyOn(ssrfGuard, 'assertUrlSafe').mockResolvedValue(undefined);
    (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

    const result = await service.sendWebhook('https://example.com/hook', {
      event: 'form.submission.created',
      timestamp: new Date().toISOString(),
      formId: 'form-1',
      formSlug: 'test',
    });

    expect(ssrfGuard.assertUrlSafe).toHaveBeenCalledWith(
      'https://example.com/hook',
    );
    expect(axios.post).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('verifies webhook signatures with timing-safe comparison', () => {
    const secret = 'test-secret';
    const payload = {
      event: 'form.submission.created',
      timestamp: '2026-01-01T00:00:00.000Z',
      formId: 'form-1',
      formSlug: 'test',
    };

    const signature = (service as any).generateSignature(payload, secret);
    expect(service.verifySignature(payload, signature, secret)).toBe(true);
    expect(() =>
      service.verifySignature(payload, 'sha256=invalid', secret),
    ).toThrow();
  });
});
