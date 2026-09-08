import type { Request } from 'express';

export interface EmailApiRequest extends Request {
  userId: string;
  apiKeyId: string;
  apiKey: {
    developerAppId: string | null;
  };
}
