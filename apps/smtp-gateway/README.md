# Rukny SMTP Gateway

Accepts SMTP connections for:

- **Developer Email API** — username `rukny`, password = API key (`rk_live_…`)
- **Rukny Mail** — username = full mailbox address, password = app password (`ruap_…`)

Relays messages to the NestJS API internal endpoints (`/api/v1/internal/smtp/*`).

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `INTERNAL_API_SECRET` | — | Required. Same as API. |
| `SMTP_GATEWAY_API_BASE_URL` | `http://api:3001/api/v1` | Internal API base URL |
| `SMTP_GATEWAY_PORT` | `587` | STARTTLS submission |
| `SMTP_GATEWAY_TLS_PORT` | `465` | SMTPS |
| `SMTP_GATEWAY_TLS_CERT` | — | PEM path for TLS (required in production) |
| `SMTP_GATEWAY_TLS_KEY` | — | PEM private key path |

## Production checklist

1. Run API migration `20260924120000_smtp_service`.
2. DNS: `smtp.rukny.io` and `smtp.mail.rukny.io` → VPS.
3. Mount TLS cert/key and set `SMTP_GATEWAY_TLS_CERT` / `SMTP_GATEWAY_TLS_KEY`.
4. Open firewall ports **587** and **465**.
5. `docker compose up -d smtp-gateway api`.
