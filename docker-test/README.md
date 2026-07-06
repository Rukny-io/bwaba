# Docker Test — Rukny

## رفع `apps/app` فقط (موصى به لـ rukny.work)

لا حاجة لـ API أو nginx — الصفحة تضمّن النموذج من `rukny.io` عبر iframe فقط.

```powershell
cd docker-test
Copy-Item .env.app.example .env
# ضع CLOUDFLARE_TUNNEL_TOKEN في .env

.\up-app.ps1 -Tunnel
```

**Cloudflare Tunnel:** hostname واحد فقط:

| Hostname | Service URL |
|----------|-------------|
| `rukny.work` | `http://app:3000` |

محلياً: http://127.0.0.1:3000

```powershell
docker compose -f docker-compose.app.yml --env-file .env logs -f app cloudflared
docker compose -f docker-compose.app.yml --env-file .env --profile tunnel down
```

---

## المكدس الكامل (اختياري)

بيئة Docker معزولة لاختبار **كل الخدمات** عبر **Cloudflare Tunnel**.

## ما الذي يُشغَّل؟

| الخدمة | الحاوية | الغرض |
|--------|---------|--------|
| `app` | `apps/app` | التطبيق الرئيسي (التركيز) |
| `api` | `apps/api` | الـ API |
| `accounts` | `apps/accounts` | تسجيل الدخول |
| `public` | `apps/public` | النماذج العامة `/f/...` |
| `developer` | `apps/developer` | بوابة المطوّرين |
| `forms` | `apps/forms` | لوحة النماذج |
| `nginx` | reverse proxy | توجيه حسب الـ hostname |
| `cloudflared` | tunnel | `--profile tunnel` فقط |

قاعدة بيانات و Redis **منفصلان** عن `rukny-dev` (volumes بأسماء `*_docker_test_*`).

## 1) إعداد الملفات

```powershell
cd docker-test
Copy-Item .env.example .env
# عدّل .env: كلمات المرور، النطاقات، CLOUDFLARE_TUNNEL_TOKEN
```

يمكن نسخ أسرار OAuth وغيرها من `.env.dev` في جذر المشروع.

## 2) Cloudflare Tunnel

**`apps/app` يُخدم على `rukny.work` فقط** — موقع العميل الذي يضمّن النموذج من `rukny.io`.

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels** → Create tunnel.
2. انسخ **Tunnel token** إلى `CLOUDFLARE_TUNNEL_TOKEN` في `.env`.
3. أضف **Public Hostname** — على الأقل:

| Hostname | Service URL | الغرض |
|----------|-------------|--------|
| **`rukny.work`** | `http://nginx:80` أو **`http://app:3000`** إذا استخدمت `up-app.ps1` | `apps/app` |
| `api.rukny.io` | `http://nginx:80` | API |
| `accounts.rukny.io` | `http://nginx:80` | تسجيل الدخول |
| `rukny.io` | `http://nginx:80` | النماذج العامة `/f/...` |
| `developers.rukny.io` | `http://nginx:80` | بوابة المطوّرين |
| `forms.rukny.io` | `http://nginx:80` | لوحة النماذج |

4. في **Domains** ببوابة المطوّرين: `websiteUrl` = `https://rukny.work` (يجب أن يطابق نطاق التضمين).
5. النموذج `57fb02` يُضمَّن من `https://rukny.io/f/57fb02?embed=1` — يعمل فقط داخل صفحة على `https://rukny.work`.

## 3) التشغيل

```powershell
# بناء وتشغيل (بدون tunnel — للاختبار المحلي عبر nginx:8080)
docker compose --env-file .env up -d --build

# مع Cloudflare Tunnel
docker compose --env-file .env --profile tunnel up -d --build
```

أو:

```powershell
.\up.ps1              # بدون tunnel
.\up.ps1 -Tunnel      # مع tunnel
```

## 4) التحقق

| ماذا | أين |
|------|-----|
| محلي (nginx) | http://127.0.0.1:8080 — يحتاج `Host` header أو استخدم الروابط العامة |
| `app` مباشرة | http://127.0.0.1:3000 |
| عبر الإنترنت | `https://app.docker-test.rukny.io` (بعد Tunnel + DNS) |
| API | `https://api.docker-test.rukny.io/api/v1/health` (إن وُجد) |

```powershell
docker compose --env-file .env ps
docker compose --env-file .env logs -f app api cloudflared
```

## 5) إيقاف / حذف

```powershell
docker compose --env-file .env --profile tunnel down
# حذف البيانات:
docker compose --env-file .env down -v
```

## ملاحظات

- **OAuth**: حدّث callback URLs في Google/Meta لتطابق `api.docker-test.rukny.io`.
- **Cookies**: `COOKIE_DOMAIN=.docker-test.rukny.io` يسمح بمشاركة الجلسة بين subdomains.
- **أول build**: قد يستغرق وقتاً طويلاً (كل التطبيقات).
- **Migration**: الـ API يشغّل `prisma migrate deploy` عند البدء.
