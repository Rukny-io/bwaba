import { ConfigService } from '@nestjs/config';
import { loadScriptEnv } from '../../../scripts/load-script-env';
import { createScriptPrisma } from '../../../scripts/script-prisma';
import { MailBodyCryptoService } from './mail-body-crypto.service';
import { MailKmsClient } from './mail-kms.client';

export function createMailBodyEncryptionScriptContext() {
  loadScriptEnv();
  const prisma = createScriptPrisma();
  const config = new ConfigService(process.env as Record<string, string>);
  const kms = new MailKmsClient(config);
  const crypto = new MailBodyCryptoService(
    kms,
    { get: async () => null, setex: async () => undefined } as never,
  );
  return { prisma, config, kms, crypto };
}
