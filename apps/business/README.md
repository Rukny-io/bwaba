# Rukny Business Hub

صندوق وارد موحّد لمحادثات **Instagram** و **Messenger** — مبني بنفس تصميم ركني Forms.

## التطوير المحلي

```bash
cd apps/business
npm install
npm run dev
```

- **Port:** `3003`
- **Marketing:** `/`
- **Dashboard:** `/app`
- **Instagram:** `/app/instagram`
- **Messenger:** `/app/messenger` (قريباً)

## Docker

من جذر المستودع:

```bash
docker compose -f docker-compose.rukny-dev.yml up business --build
```

أو في الإنتاج:

```bash
docker compose up business --build
```

## البنية

- `app/` — Next.js App Router (marketing + dashboard)
- `components/` — landing, inbox, instagram, messenger
- `lib/` — API client, auth, Instagram integration
- `proxy.ts` — حماية `/app` + security headers
