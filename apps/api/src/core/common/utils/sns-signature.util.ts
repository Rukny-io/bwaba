import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { createVerify } from 'crypto';

export type SnsEnvelope = {
  Type?: string;
  Message?: string;
  MessageId?: string;
  Subject?: string;
  Timestamp?: string;
  TopicArn?: string;
  Token?: string;
  SubscribeURL?: string;
  SigningCertURL?: string;
  Signature?: string;
  SignatureVersion?: string;
};

const certificateCache = new Map<string, { pem: string; expiresAt: number }>();

export function isSnsEnvelope(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const envelope = payload as SnsEnvelope;
  return Boolean(
    envelope.Type &&
      envelope.SigningCertURL &&
      envelope.Signature &&
      envelope.SignatureVersion,
  );
}

export function asSnsEnvelope(payload: unknown): SnsEnvelope {
  if (!payload || typeof payload !== 'object') {
    throw new BadRequestException('Invalid SNS payload.');
  }
  const envelope = payload as SnsEnvelope;
  const required = [
    'Type',
    'MessageId',
    'Timestamp',
    'TopicArn',
    'SigningCertURL',
    'Signature',
    'SignatureVersion',
  ] as const;
  if (required.some((key) => !envelope[key])) {
    throw new BadRequestException('SNS payload is missing required fields.');
  }
  return envelope;
}

export async function verifySnsSignature(envelope: SnsEnvelope): Promise<void> {
  const certUrl = validateCertificateUrl(envelope.SigningCertURL!);
  const pem = await getCertificate(certUrl);
  const verifier = createVerify(
    envelope.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1',
  );
  verifier.update(canonicalSnsMessage(envelope), 'utf8');
  verifier.end();
  if (!verifier.verify(pem, envelope.Signature!, 'base64')) {
    throw new ForbiddenException('Invalid SNS message signature.');
  }
}

export function assertExpectedSnsTopic(
  topicArn: string,
  expectedArn?: string | null,
): void {
  const expected = expectedArn?.trim();
  if (!expected) return;
  if (topicArn !== expected) {
    throw new ForbiddenException('Unexpected SNS topic.');
  }
}

export async function confirmSnsSubscription(url: string): Promise<void> {
  const validated = validateSubscriptionUrl(url);
  const response = await fetch(validated, {
    method: 'GET',
    redirect: 'error',
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new BadRequestException(
      `SNS subscription confirmation failed (${response.status}).`,
    );
  }
}

function canonicalSnsMessage(envelope: SnsEnvelope): string {
  const fields =
    envelope.Type === 'Notification'
      ? ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type']
      : [
          'Message',
          'MessageId',
          'SubscribeURL',
          'Timestamp',
          'Token',
          'TopicArn',
          'Type',
        ];
  return fields
    .filter((field) => envelope[field as keyof SnsEnvelope] !== undefined)
    .map(
      (field) =>
        `${field}\n${String(envelope[field as keyof SnsEnvelope])}\n`,
    )
    .join('');
}

function validateCertificateUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('Invalid SNS signing certificate URL.');
  }
  if (
    url.protocol !== 'https:' ||
    !/^sns\.[a-z0-9-]+\.amazonaws\.com(?:\.cn)?$/i.test(url.hostname) ||
    !url.pathname.endsWith('.pem')
  ) {
    throw new ForbiddenException('Untrusted SNS signing certificate URL.');
  }
  return url.toString();
}

function validateSubscriptionUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('Invalid SNS subscription URL.');
  }
  if (
    url.protocol !== 'https:' ||
    !/^sns\.[a-z0-9-]+\.amazonaws\.com(?:\.cn)?$/i.test(url.hostname) ||
    url.searchParams.get('Action') !== 'ConfirmSubscription'
  ) {
    throw new ForbiddenException('Untrusted SNS subscription URL.');
  }
  return url.toString();
}

async function getCertificate(url: string): Promise<string> {
  const cached = certificateCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.pem;

  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new BadRequestException('Could not fetch SNS signing certificate.');
  }
  const pem = await response.text();
  if (!pem.includes('BEGIN CERTIFICATE')) {
    throw new BadRequestException('Invalid SNS signing certificate.');
  }
  certificateCache.set(url, {
    pem,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });
  return pem;
}
