/**
 * Verify KMS (or dev fallback) can GenerateDataKey + Decrypt round-trip.
 * Usage: npx ts-node src/scripts/mail-body-encryption-kms-verify.ts
 */
import { ConfigService } from '@nestjs/config';
import { MailKmsClient } from '../domain/mail/crypto/mail-kms.client';
import { loadScriptEnv } from './load-script-env';

async function main() {
  loadScriptEnv();
  const kms = new MailKmsClient(
    new ConfigService(process.env as Record<string, string>),
  );

  if (!kms.canUseEncryption()) {
    console.error(
      JSON.stringify({
        ok: false,
        error:
          'KMS not configured: set MAIL_KMS_KEY_ID or MAIL_BODY_ENCRYPTION_DEV_FALLBACK+FIELD_ENCRYPTION_KEY',
      }),
    );
    process.exit(1);
  }

  const start = Date.now();
  const generated = await kms.generateDataKey();
  const decrypted = await kms.decryptDataKey(generated.encryptedKey);
  const latencyMs = Date.now() - start;

  const ok =
    generated.plaintextKey.length === 32 &&
    decrypted.equals(generated.plaintextKey);

  console.log(
    JSON.stringify(
      {
        ok,
        keyId: generated.keyId,
        configuredKeyId: kms.configuredKeyId(),
        roundTripLatencyMs: latencyMs,
      },
      null,
      2,
    ),
  );

  if (!ok) process.exit(2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
