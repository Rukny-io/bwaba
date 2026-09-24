export type AuthMode = 'developer' | 'mailbox';

export type GatewaySession = {
  remoteAddress?: string;
} & {
  mode?: AuthMode;
  apiKey?: string;
  mailboxAddress?: string;
  appPassword?: string;
  allowedFrom?: string[];
  envelopeFrom?: string;
  envelopeRecipients?: string[];
  remoteIp?: string;
};
