import { loadConfig } from './config';
import { InternalApiClient } from './api-client';
import { startServers } from './server';

async function main() {
  const config = loadConfig();
  const api = new InternalApiClient({
    baseUrl: config.apiBaseUrl,
    internalSecret: config.internalSecret,
  });

  startServers(config, api);
  console.log(
    `[smtp-gateway] Developer host ${config.hostname} (username: ${config.developerUsername})`,
  );
  console.log(`[smtp-gateway] Mailbox host ${config.mailboxHostname}`);
}

main().catch((error) => {
  console.error('[smtp-gateway] Failed to start:', error);
  process.exit(1);
});
