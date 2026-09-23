import { buildRawMimeMessage } from './mail-raw-mime.util';

const baseInput = {
  from: 'support@rukny.io',
  to: ['customer@example.com'],
  subject: 'Test message',
  messageIdHeader: '<test@rukny.io>',
};

describe('buildRawMimeMessage', () => {
  it('separates multipart headers from the first MIME boundary', () => {
    const message = Buffer.from(
      buildRawMimeMessage({
        ...baseInput,
        bodyText: 'Hello',
        bodyHtml: '<p>Hello</p>',
      }),
    ).toString('utf8');

    const separator = message.indexOf('\r\n\r\n');
    expect(separator).toBeGreaterThan(0);

    const headers = message.slice(0, separator);
    const body = message.slice(separator + 4);
    const boundary = headers.match(
      /^Content-Type: multipart\/alternative; boundary="([^"]+)"$/m,
    )?.[1];

    expect(boundary).toBeDefined();
    expect(headers.match(/^Content-Type:/gm)).toHaveLength(1);
    expect(body.startsWith(`--${boundary}\r\n`)).toBe(true);
  });

  it('uses exactly one header/body separator for plain text', () => {
    const message = Buffer.from(
      buildRawMimeMessage({
        ...baseInput,
        bodyText: 'Hello',
      }),
    ).toString('utf8');

    expect(message).toContain(
      'Content-Transfer-Encoding: base64\r\n\r\nSGVsbG8=\r\n',
    );
  });

  it('embeds PDF attachments in multipart/mixed', () => {
    const message = Buffer.from(
      buildRawMimeMessage({
        ...baseInput,
        bodyHtml: '<p>Invoice</p>',
        attachments: [
          {
            filename: 'INV-1.pdf',
            contentType: 'application/pdf',
            content: Buffer.from('%PDF-1.4 test'),
          },
        ],
      }),
    ).toString('utf8');

    expect(message).toContain('multipart/mixed');
    expect(message).toContain('Content-Disposition: attachment; filename="INV-1.pdf"');
    expect(message).toContain('application/pdf');
  });
});
