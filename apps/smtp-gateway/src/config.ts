export type GatewayConfig = {
  host: string;
  port: number;
  securePort: number;
  hostname: string;
  mailboxHostname: string;
  apiBaseUrl: string;
  internalSecret: string;
  developerUsername: string;
  tlsCertPath?: string;
  tlsKeyPath?: string;
};

export function loadConfig(): GatewayConfig {
  const apiBaseUrl =
    process.env.SMTP_GATEWAY_API_BASE_URL?.trim() ||
    process.env.API_INTERNAL_URL?.trim() ||
    'http://api:3001/api/v1';
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  if (!internalSecret) {
    throw new Error('INTERNAL_API_SECRET is required for smtp-gateway');
  }

  return {
    host: process.env.SMTP_GATEWAY_HOST?.trim() || '0.0.0.0',
    port: Number(process.env.SMTP_GATEWAY_PORT || 587),
    securePort: Number(process.env.SMTP_GATEWAY_TLS_PORT || 465),
    hostname:
      process.env.SMTP_GATEWAY_HOSTNAME?.trim() || 'smtp.rukny.io',
    mailboxHostname:
      process.env.SMTP_GATEWAY_MAILBOX_HOSTNAME?.trim() ||
      'smtp.mail.rukny.io',
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
    internalSecret,
    developerUsername:
      process.env.SMTP_GATEWAY_DEVELOPER_USERNAME?.trim() || 'rukny',
    tlsCertPath: process.env.SMTP_GATEWAY_TLS_CERT?.trim(),
    tlsKeyPath: process.env.SMTP_GATEWAY_TLS_KEY?.trim(),
  };
}
