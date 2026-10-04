import { loadConfig } from './config';
import { InternalApiClient } from './api-client';
import { startServers } from './server';

async function main() {
  const config = loadConfig();
  const api = new InternalApiClient({
    baseUrl: config.apiBaseUrl,
    internalSecret: config.internalSecret,
  });

  const { submission, smtps } = startServers(config, api);

  if (!config.tlsCertPath || !config.tlsKeyPath) {
    console.warn(
      '[smtp-gateway] SMTP_GATEWAY_TLS_CERT/KEY not set — using built-in TLS cert (not for production).',
    );
  }

  const shutdown = () => {
    submission.close(() => smtps.close(() => process.exit(0)));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  console.log(
    `[smtp-gateway] Developer host ${config.hostname} (username: ${config.developerUsername})`,
  );
  console.log(`[smtp-gateway] Mailbox host ${config.mailboxHostname}`);
}

main().catch((error) => {
  console.error('[smtp-gateway] Failed to start:', error);
  process.exit(1);
});
