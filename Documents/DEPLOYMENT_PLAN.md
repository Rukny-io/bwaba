# Rukny.io — DigitalOcean VPS Deployment Plan

**Project:** Rukny.io (Monorepo — 7 Next.js apps + NestJS API + Postgres + Redis + Nginx + Cloudflared)
**Target:** DigitalOcean Droplet (Ubuntu 22.04/24.04 LTS)
**Orchestration:** Docker Compose (`docker-compose.yml`)
**Date:** 2026-07-30

---

## 1. Overview

This plan describes a full production deployment of the Rukny.io platform on a single DigitalOcean VPS using Docker Compose. Traffic is fronted by Cloudflare, terminated at Nginx inside the compose network, and reverse-proxied to each Next.js/NestJS service. Postgres and Redis are containerized and bound to `127.0.0.1` only.

### Services in `docker-compose.yml`
| Service | Type | Internal Port | Public Subdomain |
|---|---|---|---|
| `postgres` | Postgres 16 | 5432 (localhost) | — |
| `redis` | Redis 7 | 6379 (localhost) | — |
| `api` | NestJS | 3001 | `api.rukny.io` |
| `app` | Next.js | 3000 | `app.rukny.io` |
| `accounts` | Next.js | 3005 | `accounts.rukny.io` |
| `hq` | Next.js | 3002 | `hq.rukny.io` |
| `public` | Next.js | 3006 | `rukny.io`, `www.rukny.io` |
| `developers` | Next.js | 3007 | `developers.rukny.io` |
| `forms` | Next.js | 3008 | `forms.rukny.io` |
| `pgadmin` | Admin UI | — | `db.rukny.io` (optional) |
| `nginx` | Reverse proxy | 80/443 | — |
| `cloudflared` | Cloudflare Tunnel | — | — |

---

## 2. Prerequisites Checklist

Before starting, make sure you have:

- [ ] DigitalOcean account with billing enabled
- [ ] Domain `rukny.io` managed by Cloudflare (DNS + SSL)
- [ ] SSH public key ready (`~/.ssh/id_ed25519.pub`)
- [ ] Filled `.env.production` file with real secrets (DB password, JWT secret, WhatsApp/OAuth keys, SMTP, S3, etc.)
- [ ] Cloudflare Tunnel token (if using `cloudflared` service) OR firewall rules ready to open 80/443
- [ ] Git repo access from the VPS (deploy key or PAT)

---

## 3. Sizing & Cost

Given 7 Next.js apps + NestJS + Postgres + Redis + Nginx on one host:

| Tier | Specs | Est. Cost | Recommendation |
|---|---|---|---|
| Minimum | 4 vCPU / 8 GB RAM / 160 GB SSD | ~$48/mo | **Recommended to start** |
| Comfortable | 8 vCPU / 16 GB RAM / 320 GB SSD | ~$96/mo | For real traffic |
| Split later | + Managed Postgres | +$15/mo | When DB grows |

Region: **FRA1** (Frankfurt) or **AMS3** — good latency for MENA users.

---

## 4. Deployment Phases

### Phase 1 — Provision the Droplet

1. Create a new Droplet:
   - Image: **Ubuntu 24.04 LTS x64**
   - Plan: Regular / **4 vCPU · 8 GB RAM**
   - Datacenter: **FRA1**
   - Authentication: SSH key (paste your public key)
   - Hostname: `rukny-prod-01`
   - Enable: **Monitoring**, **IPv6**, **Backups** (weekly, +20%)
2. Add a **Reserved IP** and attach it to the Droplet (so IP is stable if you rebuild).
3. Create a **DigitalOcean Cloud Firewall**:
   - Inbound: `22` (your IP only), `80`, `443` (any)
   - Outbound: all
4. Log in: `ssh root@<reserved_ip>`.

### Phase 2 — Server Hardening

```bash
# Create deploy user
adduser deploy && usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Disable root SSH + password auth
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# System basics
apt update && apt upgrade -y
apt install -y ufw fail2ban unattended-upgrades git curl htop
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

# Automatic security updates
dpkg-reconfigure --priority=low unattended-upgrades
```

### Phase 3 — Install Docker

```bash
# As deploy user
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
newgrp docker
docker --version && docker compose version
```

### Phase 4 — Clone the Repository

```bash
sudo mkdir -p /opt/rukny && sudo chown deploy:deploy /opt/rukny
cd /opt/rukny
git clone git@github.com:<org>/Rukny-v1.git .
# Or via HTTPS + PAT:
# git clone https://<token>@github.com/<org>/Rukny-v1.git .
```

### Phase 5 — Configure Environment

```bash
# 1) Copy the production env file
cp .env.production .env

# 2) Edit and set real production secrets
#    (DB_PASSWORD, REDIS_PASSWORD, JWT_SECRET, NEXTAUTH_SECRET,
#     WHATSAPP_*, SMTP_*, S3_*, CLOUDFLARE_TUNNEL_TOKEN, etc.)
nano .env

# 3) Verify WhatsApp/critical env
bash scripts/check-whatsapp-env.sh
```

Generate strong secrets if needed:

```bash
openssl rand -base64 48   # for JWT_SECRET / NEXTAUTH_SECRET
openssl rand -base64 32   # for DB_PASSWORD / REDIS_PASSWORD
```

### Phase 6 — DNS + Cloudflare

In Cloudflare DNS for `rukny.io`, create **A records** (all proxied — orange cloud):

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `@` (root) | `<reserved_ip>` | ✅ |
| A | `www` | `<reserved_ip>` | ✅ |
| A | `app` | `<reserved_ip>` | ✅ |
| A | `accounts` | `<reserved_ip>` | ✅ |
| A | `api` | `<reserved_ip>` | ✅ |
| A | `hq` | `<reserved_ip>` | ✅ |
| A | `developers` | `<reserved_ip>` | ✅ |
| A | `forms` | `<reserved_ip>` | ✅ |
| A | `db` | `<reserved_ip>` | ✅ (or Zero Trust access) |

**SSL/TLS mode:** Full (Strict). Enable **Always Use HTTPS** + **HSTS**.

> If using the `cloudflared` service in compose, create a Cloudflare Tunnel in the Zero Trust dashboard, put the token in `CLOUDFLARE_TUNNEL_TOKEN`, and DNS records become CNAMEs to the tunnel instead of A records.

### Phase 7 — SSL Certificates

Two options:

**Option A — Cloudflare Origin Certificates (recommended, simplest):**
1. Cloudflare dashboard → SSL/TLS → Origin Server → Create Certificate (15 years).
2. Save cert + key on VPS under `nginx/ssl/` (paths already referenced by nginx config).
3. This works because Cloudflare proxy sits in front.

**Option B — Let's Encrypt (if not using Cloudflare proxy):**
```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d rukny.io -d www.rukny.io -d app.rukny.io ...
```

### Phase 8 — First Build & Start

```bash
cd /opt/rukny

# Build all images (first build ~15–25 min)
docker compose -f docker-compose.yml build

# Start the stack
docker compose -f docker-compose.yml up -d

# Watch logs
docker compose logs -f --tail=100
```

Or use the provided script:

```bash
bash deploy.sh
```

### Phase 9 — Database Migrations & Seed

```bash
# Run Prisma / migration inside the API container
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed   # if seed script exists
```

### Phase 10 — Verification

```bash
docker compose ps                    # all services healthy
curl -I https://api.rukny.io/health  # 200 OK
curl -I https://rukny.io             # 200 OK
```

Check each domain in the browser:
- https://rukny.io
- https://accounts.rukny.io
- https://app.rukny.io
- https://api.rukny.io
- https://hq.rukny.io
- https://developers.rukny.io
- https://forms.rukny.io

---

## 5. Post-Deployment

### 5.1 Backups
- **DigitalOcean weekly backups** (enabled at Droplet creation).
- **Postgres dumps** — nightly cron:

```bash
# /etc/cron.daily/rukny-db-backup (as root)
#!/bin/bash
cd /opt/rukny
mkdir -p /var/backups/rukny
docker compose exec -T postgres pg_dump -U rukny_admin rukny_io \
  | gzip > /var/backups/rukny/rukny_$(date +\%F).sql.gz
find /var/backups/rukny -name "*.sql.gz" -mtime +14 -delete
```

- Optional: sync `/var/backups/rukny` to a DigitalOcean **Space** (S3-compatible) using `s3cmd` or `rclone`.

### 5.2 Monitoring & Logs
- DigitalOcean Monitoring (CPU/RAM/Disk alerts).
- `docker compose logs -f <service>` for live logs.
- Optional: Grafana Loki / Uptime Kuma / Better Stack for uptime + logs.

### 5.3 Updates & Redeploys
```bash
cd /opt/rukny
git pull
docker compose build --pull
docker compose up -d
docker system prune -f
```

### 5.4 Security
- Rotate secrets every 90 days.
- Keep Cloudflare **WAF** on with the OWASP ruleset.
- Restrict `db.rukny.io` behind **Cloudflare Access** or remove the DNS record and tunnel only.
- Disable `pgadmin` in compose when not needed.

---

## 6. Rollback Plan

If a deployment breaks production:

```bash
cd /opt/rukny
git log --oneline -n 5           # find last good commit
git checkout <last_good_sha>
docker compose build
docker compose up -d
```

Database rollback: restore from latest dump:

```bash
gunzip -c /var/backups/rukny/rukny_YYYY-MM-DD.sql.gz \
  | docker compose exec -T postgres psql -U rukny_admin rukny_io
```

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Single VPS = single point of failure | High | DO weekly backups + off-site DB dumps + IaC-style repo so rebuild is < 1h |
| Postgres on same box as apps | Medium | Migrate to Managed Postgres when DAU > few hundreds |
| First build OOMs on small droplet | Medium | Start on 8 GB RAM; add 4 GB swap |
| Cloudflare misconfig blocks origin | Medium | Keep Origin Cert + firewall rule that allows only Cloudflare IPs on 443 |
| Secrets leak via `.env` | High | `.env` not in git; `chmod 600 .env`; rotate on suspicion |

Add a swap file just in case:

```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 8. Timeline (One-Person Deploy)

| Step | Duration |
|---|---|
| Droplet + firewall + DNS | 20 min |
| Hardening + Docker install | 20 min |
| Clone + `.env` fill-in | 30 min |
| First `docker compose build` | 20–30 min |
| Migrations + smoke tests | 20 min |
| Cloudflare SSL + final checks | 20 min |
| **Total** | **~2.5 hours** |

---

## 9. Quick Command Reference

```bash
# Status
docker compose ps
docker compose logs -f api

# Restart one service
docker compose restart accounts

# Rebuild one service after code change
docker compose build accounts && docker compose up -d accounts

# Enter a container
docker compose exec api sh

# DB shell
docker compose exec postgres psql -U rukny_admin rukny_io

# Full stop / start
docker compose down
docker compose up -d
```

---

**Owner:** DevOps / Backend
**Next action:** Create the DigitalOcean Droplet and reserved IP, then follow Phase 2.
