import { GoneException, Injectable } from '@nestjs/common';

export interface WhatsappApiTryInput {
  appId: string;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: unknown;
  apiKeySlug: string;
}

@Injectable()
export class WhatsappApiTryService {
  async execute(
    userId: string,
    input: WhatsappApiTryInput,
  ): Promise<never> {
    throw new GoneException(
      'Try it is disabled because WhatsApp test keys are not sandboxed. Use a live API key only after confirming billing.',
    );
  }
}
