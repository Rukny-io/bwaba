declare module 'mailparser' {
  export type AddressObject = {
    value?: Array<{ address?: string; name?: string }>;
  };

  export type ParsedMail = {
    from?: AddressObject;
    to?: AddressObject;
    cc?: AddressObject;
    bcc?: AddressObject;
    replyTo?: AddressObject;
    subject?: string;
    text?: string;
    html?: string | false;
    messageId?: string;
  };

  export function simpleParser(
    source: NodeJS.ReadableStream,
  ): Promise<ParsedMail>;
}
