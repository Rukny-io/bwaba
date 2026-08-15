import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { ApiKeysService } from '../../developer/api-keys/api-keys.service';

export interface WhatsappApiTryInput {
  appId: string;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: unknown;
  apiKeySlug: string;
}

@Injectable()
export class WhatsappApiTryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  async execute(userId: string, input: WhatsappApiTryInput) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId: input.appId, userId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!app) {
      throw new NotFoundException('App not found');
    }

    const apiKey = await this.prisma.developerApiKey.findFirst({
      where: {
        slug: input.apiKeySlug,
        userId,
        developerAppId: app.id,
        status: 'ACTIVE',
        environment: 'test',
      },
      select: { slug: true, encryptedKey: true },
    });

    if (!apiKey?.encryptedKey) {
      throw new ForbiddenException(
        'Only active test API keys (rk_test_) linked to this app can be used in Try it',
      );
    }

    const { key: rawKey } = await this.apiKeysService.revealKey(
      userId,
      apiKey.slug,
    );

    if (!rawKey.startsWith('rk_test_')) {
      throw new ForbiddenException('Live API keys cannot be used in Try it');
    }

    const allowedPrefix = '/whatsapp/';
    if (!input.path.startsWith(allowedPrefix)) {
      throw new BadRequestException('Path not allowed for Try it');
    }

    const baseUrl =
      process.env.API_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
      'http://localhost:3001/api/v1';
    const url = `${baseUrl}${input.path.startsWith('/') ? input.path : `/${input.path}`}`;

    const response = await fetch(url, {
      method: input.method,
      headers: {
        'X-API-Key': rawKey,
        ...(input.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
      },
      body:
        input.body !== undefined ? JSON.stringify(input.body) : undefined,
      signal: AbortSignal.timeout(30000),
    });

    const text = await response.text();
    let parsed: unknown = text;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    return {
      status: response.status,
      body: parsed,
      keyFingerprint: createHash('sha256')
        .update(rawKey)
        .digest('hex')
        .slice(0, 12),
    };
  }
}
