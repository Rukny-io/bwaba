import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { ApiKeysService } from '../../developer/api-keys/api-keys.service';

export type EmailApiTryInput = {
  appId: string;
  apiKeySlug: string;
  from: string;
  to: string;
  subject: string;
  bodyText: string;
};

@Injectable()
export class EmailApiTryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  async execute(userId: string, input: EmailApiTryInput) {
    const app = await this.prisma.developerApp.findFirst({
      where: { userId, appId: input.appId, status: 'ACTIVE' }, select: { id: true },
    });
    if (!app) throw new NotFoundException('Developer app not found.');
    const key = await this.prisma.developerApiKey.findFirst({
      where: { slug: input.apiKeySlug, userId, developerAppId: app.id, status: 'ACTIVE', environment: 'test' },
      select: { slug: true, encryptedKey: true, scopes: true },
    });
    if (!key?.encryptedKey || !key.scopes.includes('email:send')) {
      throw new ForbiddenException('Choose an active test key for this app with email:send.');
    }
    const { key: rawKey } = await this.apiKeys.revealKey(userId, key.slug);
    if (!rawKey.startsWith('rk_test_')) throw new ForbiddenException('Live API keys are not allowed in Try it.');

    const baseUrl = process.env.API_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001/api/v1';
    const response = await fetch(`${baseUrl}/email/messages`, {
      method: 'POST',
      headers: {
        'X-API-Key': rawKey,
        'Idempotency-Key': `try_${randomUUID().replace(/-/g, '')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: input.from, to: [input.to], subject: input.subject, bodyText: input.bodyText }),
      signal: AbortSignal.timeout(30_000),
    });
    const text = await response.text();
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : null; } catch { /* retain text */ }
    return { status: response.status, body, keyFingerprint: createHash('sha256').update(rawKey).digest('hex').slice(0, 12) };
  }
}
