type RawMimeAttachment = {
  filename: string;
  contentType: string;
  content: Buffer;
  contentId?: string;
  inline?: boolean;
};

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
  attachments?: RawMimeAttachment[];
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

function wrapBase64String(value: string): string {
  return value.replace(/(.{76})/g, '$1\r\n').trim();
}

function wrapBase64Utf8(value: string): string {
  return wrapBase64String(Buffer.from(value, 'utf8').toString('base64'));
}

function wrapBase64Buffer(value: Buffer): string {
  return wrapBase64String(value.toString('base64'));
}

function sanitizeFilename(filename: string): string {
  const cleaned = filename.replace(/[\r\n"]/g, '_').trim() || 'attachment.bin';
  return cleaned.slice(0, 180);
}

function buildAlternativePart(
  boundary: string,
  text: string,
  html?: string,
): string {
  if (!html) {
    return [
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64Utf8(text || ' '),
      '',
    ].join('\r\n');
  }

  return [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64Utf8(text || ' '),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64Utf8(html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

function buildInlineAttachmentPart(attachment: RawMimeAttachment): string {
  const filename = sanitizeFilename(attachment.filename);
  const contentType =
    attachment.contentType?.trim() || 'application/octet-stream';
  const lines = [
    `Content-Type: ${contentType}; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: inline; filename="${filename}"`,
  ];
  if (attachment.contentId) {
    lines.push(`Content-ID: <${attachment.contentId}>`);
  }
  lines.push('', wrapBase64Buffer(attachment.content), '');
  return lines.join('\r\n');
}

function buildFileAttachmentPart(attachment: RawMimeAttachment): string {
  const filename = sanitizeFilename(attachment.filename);
  const contentType =
    attachment.contentType?.trim() || 'application/octet-stream';
  return [
    `Content-Type: ${contentType}; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    wrapBase64Buffer(attachment.content),
    '',
  ].join('\r\n');
}

function buildRelatedPart(
  relatedBoundary: string,
  altBoundary: string,
  text: string,
  html?: string,
  inlineAttachments: RawMimeAttachment[] = [],
): string {
  const chunks = [
    `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
    '',
    `--${relatedBoundary}`,
    buildAlternativePart(altBoundary, text, html),
  ];
  for (const attachment of inlineAttachments) {
    chunks.push(`--${relatedBoundary}`, buildInlineAttachmentPart(attachment));
  }
  chunks.push(`--${relatedBoundary}--`, '');
  return chunks.join('\r\n');
}

function makeBoundary(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function buildRawMimeMessage(input: RawMimeInput): Uint8Array {
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
  const attachments = input.attachments?.filter(
    (item) => item.content?.length && item.filename,
  );
  const inlineAttachments =
    attachments?.filter((item) => item.inline || item.contentId) ?? [];
  const fileAttachments =
    attachments?.filter((item) => !item.inline && !item.contentId) ?? [];

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
  const altBoundary = makeBoundary('rukny-alt');
  const hasInline = inlineAttachments.length > 0;
  const hasFiles = fileAttachments.length > 0;

  if (hasInline && hasFiles) {
    const mixedBoundary = makeBoundary('rukny-mix');
    const relatedBoundary = makeBoundary('rukny-rel');
    headers.push(
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    );
    const parts = [
      `--${mixedBoundary}`,
      buildRelatedPart(
        relatedBoundary,
        altBoundary,
        text,
        html,
        inlineAttachments,
      ),
    ];
    for (const attachment of fileAttachments) {
      parts.push(`--${mixedBoundary}`, buildFileAttachmentPart(attachment));
    }
    parts.push(`--${mixedBoundary}--`, '');
    body = parts.join('\r\n');
  } else if (hasInline) {
    const relatedBoundary = makeBoundary('rukny-rel');
    headers.push(
      `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
    );
    const parts = [
      `--${relatedBoundary}`,
      buildAlternativePart(altBoundary, text, html),
    ];
    for (const attachment of inlineAttachments) {
      parts.push(`--${relatedBoundary}`, buildInlineAttachmentPart(attachment));
    }
    parts.push(`--${relatedBoundary}--`, '');
    body = parts.join('\r\n');
  } else if (hasFiles) {
    const mixedBoundary = makeBoundary('rukny-mix');
    headers.push(
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    );

    const parts = [
      `--${mixedBoundary}`,
      buildAlternativePart(altBoundary, text, html),
    ];

    for (const attachment of fileAttachments) {
      parts.push(`--${mixedBoundary}`, buildFileAttachmentPart(attachment));
    }

    parts.push(`--${mixedBoundary}--`, '');
    body = parts.join('\r\n');
  } else if (html) {
    const boundary = makeBoundary('rukny');
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64Utf8(text || ' '),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64Utf8(html),
      `--${boundary}--`,
      '',
    ].join('\r\n');
  } else {
    headers.push(
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
    );
    body = `${wrapBase64Utf8(text || ' ')}\r\n`;
  }

  return Buffer.from(
    crlf(`${headers.join('\r\n')}\r\n\r\n${body}`),
    'utf8',
  );
}
