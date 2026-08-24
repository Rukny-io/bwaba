type RawMimeInput = {
  from: string;
  fromName?: string | null;
  to: string[];
  cc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  replyTo?: string[];
  messageIdHeader: string;
  inReplyTo?: string | null;
};

function encodeHeaderWord(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function formatMailbox(email: string, name?: string | null): string {
  const trimmedName = name?.trim();
  if (!trimmedName) return email;
  const encoded = encodeHeaderWord(trimmedName);
  if (/^[\x20-\x7E]*$/.test(trimmedName) && !/[,<>()"]/.test(trimmedName)) {
    return `${encoded} <${email}>`;
  }
  if (/^[\x20-\x7E]*$/.test(trimmedName)) {
    return `"${encoded}" <${email}>`;
  }
  return `${encoded} <${email}>`;
}

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
}

function crlf(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
}

function wrapBase64(value: string): string {
  const encoded = Buffer.from(value, 'utf8').toString('base64');
  return encoded.replace(/(.{76})/g, '$1\r\n').trim();
}

export function buildRawMimeMessage(input: RawMimeInput): Uint8Array {
  const boundary = `rukny-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toUTCString().replace(/GMT$/, '+0000');
  const messageId = input.messageIdHeader.trim();
  const fromHeader = formatMailbox(input.from, input.fromName);
  const toHeader = input.to.join(', ');
  const text =
    input.bodyText?.trim() ||
    (input.bodyHtml
      ? input.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : '');
  const html = input.bodyHtml?.trim();

  const headers = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    input.cc?.length ? `Cc: ${input.cc.join(', ')}` : null,
    input.replyTo?.length
      ? `Reply-To: ${input.replyTo.join(', ')}`
      : `Reply-To: ${input.from}`,
    `Subject: ${encodeSubject(input.subject)}`,
    `Message-ID: ${messageId}`,
    input.inReplyTo?.trim() ? `In-Reply-To: ${input.inReplyTo.trim()}` : null,
    input.inReplyTo?.trim() ? `References: ${input.inReplyTo.trim()}` : null,
    `Date: ${now}`,
    'MIME-Version: 1.0',
  ].filter((line): line is string => Boolean(line));

  let body: string;
  if (html) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(text || ' '),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(html),
      `--${boundary}--`,
      '',
    ].join('\r\n');
  } else {
    headers.push(
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
    );
    body = `\r\n${wrapBase64(text || ' ')}\r\n`;
  }

  return Buffer.from(crlf(`${headers.join('\r\n')}\r\n${body}`), 'utf8');
}
