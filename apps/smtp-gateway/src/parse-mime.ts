import { simpleParser, type ParsedMail as MailparserResult } from 'mailparser';
import type { Readable } from 'node:stream';

export type ParsedAddress = {
  email: string;
  name?: string;
};

export type ParsedMail = {
  from: ParsedAddress;
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo?: string[];
  subject: string;
  text?: string;
  html?: string;
  messageId?: string;
};

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

function extractAddress(
  value: MailparserResult['from'] | undefined,
): ParsedAddress {
  const first = value?.value?.[0];
  const email = first?.address?.trim().toLowerCase();
  if (!email) {
    throw new Error('Missing From address.');
  }
  return {
    email,
    name: first?.name?.trim() || undefined,
  };
}

function extractList(
  value: MailparserResult['to'] | MailparserResult['cc'] | MailparserResult['bcc'],
): string[] {
  const items = value?.value ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const email = item.address?.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

export async function parseMimeStream(stream: Readable): Promise<ParsedMail> {
  const parsed = await simpleParser(stream);
  const replyTo = extractList(parsed.replyTo);
  const messageId = parsed.messageId?.trim() || undefined;

  return {
    from: extractAddress(parsed.from),
    to: extractList(parsed.to),
    cc: extractList(parsed.cc),
    bcc: extractList(parsed.bcc),
    replyTo: replyTo.length ? replyTo : undefined,
    subject: parsed.subject?.trim() || '(no subject)',
    text: parsed.text?.trim() || undefined,
    html: typeof parsed.html === 'string' ? parsed.html.trim() : undefined,
    messageId,
  };
}

export function idempotencyKeyFromMessage(parsed: ParsedMail): string {
  if (parsed.messageId) {
    const cleaned = parsed.messageId.replace(/[<>]/g, '').slice(0, 256);
    if (cleaned.length >= 8) return cleaned;
  }
  const seed = [
    parsed.from.email,
    parsed.to.join(','),
    parsed.subject,
    parsed.text?.slice(0, 120) ?? '',
  ].join('|');
  return `smtp_${Buffer.from(seed).toString('base64url').slice(0, 120)}`;
}

export function parseEnvelopeAddress(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/<([^>]+)>/);
  const email = (match?.[1] ?? value).trim().toLowerCase();
  return normalizeAddress(email);
}
