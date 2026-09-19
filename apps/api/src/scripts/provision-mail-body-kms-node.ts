/**
 * Provision KMS CMK via AWS SDK (no aws CLI required).
 * Usage: npx ts-node src/scripts/provision-mail-body-kms-node.ts [staging|production]
 */
import {
  CreateAliasCommand,
  CreateKeyCommand,
  DescribeKeyCommand,
  EnableKeyRotationCommand,
  KMSClient,
  ListAliasesCommand,
  TagResourceCommand,
  UpdateAliasCommand,
} from '@aws-sdk/client-kms';

import { loadScriptEnv } from './load-script-env';

async function main() {
  loadScriptEnv();

  const envName = process.argv[2] || 'staging';
  const region =
    process.env.MAIL_AWS_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    'eu-north-1';
  const alias =
    envName === 'production'
      ? 'alias/rukny-mail-body-encryption'
      : `alias/rukny-mail-body-encryption-${envName}`;

  const client = new KMSClient({ region });

  const aliases = await client.send(new ListAliasesCommand({}));
  const existing = aliases.Aliases?.find((a) => a.AliasName === alias);
  if (existing?.TargetKeyId) {
    const keyId = existing.TargetKeyId;
    console.log(
      JSON.stringify({
        ok: true,
        existing: true,
        region,
        alias,
        keyId,
        mailKmsKeyId: alias,
      }),
    );
    return;
  }

  const created = await client.send(
    new CreateKeyCommand({
      Description: `Rukny Mail message body encryption (${envName})`,
      KeyUsage: 'ENCRYPT_DECRYPT',
      Origin: 'AWS_KMS',
    }),
  );
  const keyId = created.KeyMetadata?.KeyId;
  if (!keyId) throw new Error('CreateKey returned no KeyId');

  await client.send(
    new EnableKeyRotationCommand({ KeyId: keyId }),
  );

  try {
    await client.send(
      new CreateAliasCommand({ AliasName: alias, TargetKeyId: keyId }),
    );
  } catch {
    await client.send(
      new UpdateAliasCommand({ AliasName: alias, TargetKeyId: keyId }),
    );
  }

  await client.send(
    new TagResourceCommand({
      KeyId: keyId,
      Tags: [
        { TagKey: 'service', TagValue: 'rukny-mail' },
        { TagKey: 'purpose', TagValue: 'body-encryption' },
        { TagKey: 'env', TagValue: envName },
      ],
    }),
  );

  await client.send(new DescribeKeyCommand({ KeyId: keyId }));

  console.log(
    JSON.stringify({
      ok: true,
      existing: false,
      region,
      alias,
      keyId,
      mailKmsKeyId: alias,
      next: `Set MAIL_KMS_KEY_ID=${alias} and MAIL_AWS_REGION=${region} on API`,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
