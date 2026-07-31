# Rukny Home Server Deployment (Windows + Docker + Nginx)

This setup uses your production compose file which includes Nginx:

- `docker-compose.yml` (existing app stack + Nginx)
- `nginx/` (Nginx reverse proxy and SSL configuration)

## 1) Prepare env values

1. Copy the keys from `.env.home.example` into your `.env.production`.
2. Set real domain values and a valid `ACME_EMAIL`.
3. Keep all app secrets in `.env.production` as they are.

## 2) Router and DNS requirements

1. Reserve a static LAN IP for your PC (example: `192.168.1.50`).
2. Port-forward to that IP:
   - `80 -> 80`
   - `443 -> 443`
3. Point your DNS records to your public IP (or DDNS hostname if IP changes).
4. If you use Cloudflare DNS, set records to **DNS only** (gray cloud) while issuing certificates.

## 3) Start the stack

Run from repository root:

```bash
docker compose --env-file .env.production -f docker-compose.yml up -d --build
```

## 4) Validate

Check containers:

```bash
docker compose -f docker-compose.yml ps
```

Check Nginx logs:

```bash
docker compose -f docker-compose.yml logs -f nginx
```

You should see certificates issued and routes active for your domains.

## 4.1) If SSL is failing with Cloudflare 530

If Nginx logs show SSL errors, your DNS might still be proxied by Cloudflare inappropriately.

1. In Cloudflare DNS, switch all active records (`@`, `www`, `app`, `api`, `accounts`, `admin`, `business`, `developers`, `db`) to **DNS only** (gray cloud).
2. Ensure those records point to your **home public IP**.
3. Wait 1-3 minutes, then restart Nginx:

```bash
docker compose --env-file .env.production -f docker-compose.yml restart nginx
```

4. Re-check logs:

```bash
docker compose --env-file .env.production -f docker-compose.yml logs -f nginx
```

## 5) Security checklist

- Keep Windows and Docker updated.
- Allow inbound only ports `80/443` in firewall (run firewall commands as Administrator).
- Do not expose DB ports publicly.
- Back up database and `.env.production` regularly.

## 6) Optional cloudflare mode

If you want to go back to Cloudflare Tunnel mode, run without the home override and with your previous config.
