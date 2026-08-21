import {
  CreateEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  GetEmailIdentityCommand,
  PutEmailIdentityMailFromAttributesCommand,
  SESv2Client,
} from "@aws-sdk/client-sesv2";
import { MAIL_SES_REGION } from "@/lib/ses";
import {
  mailSesStatusKey,
  redisDel,
  redisGetJson,
  redisSetJson,
} from "@/lib/redis";

function mailSesClient() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials are not configured for Mail.");
  }
  return new SESv2Client({
    region: process.env.MAIL_AWS_REGION || MAIL_SES_REGION,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function isAlreadyExists(error: unknown) {
  const name = typeof error === "object" && error && "name" in error ? String(error.name) : "";
  return name.includes("AlreadyExists");
}

export function formatSesError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("not authorized") || message.includes("AccessDenied")) {
    return "This AWS user cannot manage email identities. Add SES identity permissions, then try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not complete this request.";
}

async function getIdentity(domain: string) {
  const client = mailSesClient();
  return client.send(new GetEmailIdentityCommand({ EmailIdentity: domain }));
}

export async function ensureSesDomainIdentity(domain: string) {
  const client = mailSesClient();

  try {
    await client.send(
      new CreateEmailIdentityCommand({
        EmailIdentity: domain,
        DkimSigningAttributes: { NextSigningKeyLength: "RSA_2048_BIT" },
      }),
    );
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
  }

  try {
    await client.send(
      new PutEmailIdentityMailFromAttributesCommand({
        EmailIdentity: domain,
        MailFromDomain: `mail.${domain}`,
        BehaviorOnMxFailure: "USE_DEFAULT_VALUE",
      }),
    );
  } catch {
    // MAIL FROM is optional if the identity is still provisioning
  }

  let tokens: string[] = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const identity = await getIdentity(domain);
    tokens = identity.DkimAttributes?.Tokens ?? [];
    if (tokens.length >= 3) break;
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  if (tokens.length === 0) {
    throw new Error("The domain was added, but DKIM records are not ready yet. Try again.");
  }

  await redisDel(mailSesStatusKey(domain));
  return { tokens };
}

export type SesDomainStatus = {
  found: boolean;
  sending: boolean;
  dkim: string;
  tokens: string[];
};

const SES_STATUS_TTL_SECONDS = 60;
const sesInflight = new Map<string, Promise<SesDomainStatus>>();

export async function getSesDomainStatus(domain: string): Promise<SesDomainStatus> {
  try {
    const identity = await getIdentity(domain);
    const dkim = identity.DkimAttributes?.Status ?? "NOT_STARTED";
    return {
      found: true,
      sending: Boolean(identity.VerifiedForSendingStatus),
      dkim,
      tokens: identity.DkimAttributes?.Tokens ?? [],
    };
  } catch (error) {
    const name = typeof error === "object" && error && "name" in error ? String(error.name) : "";
    if (name.includes("NotFound")) {
      return { found: false, sending: false, dkim: "NOT_STARTED", tokens: [] };
    }
    throw error;
  }
}

/** Redis-backed SES status (falls back to live SES). In-flight dedupe per process. */
export async function getSesDomainStatusCached(
  domain: string,
  ttlSeconds = SES_STATUS_TTL_SECONDS,
): Promise<SesDomainStatus> {
  const key = domain.trim().toLowerCase();
  const cacheKey = mailSesStatusKey(key);

  const cached = await redisGetJson<SesDomainStatus>(cacheKey);
  if (cached) return cached;

  const existing = sesInflight.get(key);
  if (existing) return existing;

  const inflight = getSesDomainStatus(key)
    .then(async (value) => {
      await redisSetJson(cacheKey, value, ttlSeconds);
      return value;
    })
    .finally(() => {
      sesInflight.delete(key);
    });

  sesInflight.set(key, inflight);
  return inflight;
}

export async function deleteSesDomainIdentity(domain: string) {
  const client = mailSesClient();
  try {
    await client.send(new DeleteEmailIdentityCommand({ EmailIdentity: domain }));
  } catch (error) {
    const name = typeof error === "object" && error && "name" in error ? String(error.name) : "";
    if (!name.includes("NotFound")) throw error;
  }
  await redisDel(mailSesStatusKey(domain));
}
