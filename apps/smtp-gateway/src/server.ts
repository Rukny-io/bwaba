import fs from 'node:fs';
import { Readable } from 'node:stream';
import { SMTPServer, type SMTPServerAuthentication, type SMTPServerOptions } from 'smtp-server';
import type { GatewayConfig } from './config';
import { InternalApiClient } from './api-client';
import {
  idempotencyKeyFromMessage,
  parseEnvelopeAddress,
  parseMimeStream,
} from './parse-mime';
import type { GatewaySession } from './session';

function tlsOptions(config: GatewayConfig) {
  if (!config.tlsCertPath || !config.tlsKeyPath) return undefined;
  return {
    cert: fs.readFileSync(config.tlsCertPath),
    key: fs.readFileSync(config.tlsKeyPath),
  };
}

function isMailboxUsername(username: string): boolean {
  return username.includes('@');
}

function createServerOptions(
  config: GatewayConfig,
  api: InternalApiClient,
  secure: boolean,
): SMTPServerOptions {
  const tls = tlsOptions(config);

  return {
    secure,
    authOptional: false,
    key: tls?.key,
    cert: tls?.cert,
    banner: `${config.hostname} ESMTP Rukny`,
    onConnect(session, callback) {
      const gatewaySession = session as GatewaySession;
      gatewaySession.remoteIp = session.remoteAddress;
      callback();
    },
    async onAuth(
      auth: SMTPServerAuthentication,
      session,
      callback,
    ) {
      const gatewaySession = session as GatewaySession;
      const username = auth.username?.trim() || '';
      const password = auth.password || '';

      try {
        if (username.toLowerCase() === config.developerUsername.toLowerCase()) {
          const result = await api.validateDeveloperKey(
            password,
            gatewaySession.remoteIp,
          );
          gatewaySession.mode = 'developer';
          gatewaySession.apiKey = password;
          callback(null, { user: result.apiKeyId });
          return;
        }

        if (isMailboxUsername(username)) {
          const result = await api.validateMailbox(username, password);
          gatewaySession.mode = 'mailbox';
          gatewaySession.mailboxAddress = result.address;
          gatewaySession.appPassword = password;
          gatewaySession.allowedFrom = result.allowedFrom;
          callback(null, { user: result.mailboxId });
          return;
        }

        callback(new Error('Invalid credentials'));
      } catch (error) {
        callback(error instanceof Error ? error : new Error('Authentication failed'));
      }
    },
    onMailFrom(address, session, callback) {
      const gatewaySession = session as GatewaySession;
      const from = parseEnvelopeAddress(address.address);
      if (!from) {
        callback(new Error('Invalid MAIL FROM address'));
        return;
      }

      if (gatewaySession.mode === 'mailbox' && gatewaySession.allowedFrom) {
        if (!gatewaySession.allowedFrom.includes(from)) {
          callback(
            new Error(
              'MAIL FROM must match the authenticated mailbox or an alias.',
            ),
          );
          return;
        }
      }

      gatewaySession.envelopeFrom = from;
      callback();
    },
    onRcptTo(address, session, callback) {
      const gatewaySession = session as GatewaySession;
      const recipient = parseEnvelopeAddress(address.address);
      if (!recipient) {
        callback(new Error('Invalid RCPT TO address'));
        return;
      }

      if (gatewaySession.mode === 'developer') {
        const recipients = gatewaySession.envelopeRecipients ?? [];
        if (recipients.length >= 1) {
          callback(new Error('Only one recipient is supported for Developer SMTP.'));
          return;
        }
      }

      gatewaySession.envelopeRecipients = [
        ...(gatewaySession.envelopeRecipients ?? []),
        recipient,
      ];
      callback();
    },
    onData(stream, session, callback) {
      const gatewaySession = session as GatewaySession;
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', async () => {
        try {
          const parsed = await parseMimeStream(
            Readable.from(Buffer.concat(chunks)),
          );

          if (!parsed.to.length && gatewaySession.envelopeRecipients?.length) {
            parsed.to = gatewaySession.envelopeRecipients;
          }

          if (gatewaySession.mode === 'developer' && gatewaySession.apiKey) {
            await api.sendDeveloper({
              apiKey: gatewaySession.apiKey,
              parsed,
              idempotencyKey: idempotencyKeyFromMessage(parsed),
              clientIp: gatewaySession.remoteIp,
            });
          } else if (
            gatewaySession.mode === 'mailbox' &&
            gatewaySession.mailboxAddress &&
            gatewaySession.appPassword
          ) {
            await api.sendMailbox({
              address: gatewaySession.mailboxAddress,
              appPassword: gatewaySession.appPassword,
              parsed,
            });
          } else {
            throw new Error('Unauthenticated session.');
          }

          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error('Send failed'));
        }
      });
    },
  };
}

export function startServers(config: GatewayConfig, api: InternalApiClient) {
  const submission = new SMTPServer(createServerOptions(config, api, false));
  const smtps = new SMTPServer(createServerOptions(config, api, true));

  submission.listen(config.port, config.host, () => {
    console.log(
      `[smtp-gateway] STARTTLS submission listening on ${config.host}:${config.port}`,
    );
  });

  smtps.listen(config.securePort, config.host, () => {
    console.log(
      `[smtp-gateway] SMTPS listening on ${config.host}:${config.securePort}`,
    );
  });

  return { submission, smtps };
}
