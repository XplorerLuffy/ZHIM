# Zhim — Deployment Plan

## Infrastructure Overview

**Region:** Singapore (ap-southeast-1) — lowest latency to Bhutan (~80ms vs 180ms from EU)
**Provider:** Hetzner Cloud (CPX31) or DigitalOcean (s-4vcpu-8gb) per service
**CDN / Edge:** Cloudflare (free tier covers Bhutan adequately)
**Storage:** Cloudflare R2 (S3-compatible, no egress fees)

---

## Server Sizing — MVP (Thimphu, 50 restaurants, 20 riders)

| Service       | Spec              | Monthly cost (est.) |
|---------------|-------------------|----------------------|
| API server    | 4 vCPU / 8 GB RAM | ~$25 USD             |
| PostgreSQL    | 4 vCPU / 8 GB RAM | ~$25 USD (managed DO) or self-host |
| Redis         | 2 vCPU / 4 GB RAM | ~$15 USD             |
| Meilisearch   | 2 vCPU / 4 GB RAM | co-locate on API box  |
| Console (SSR) | 2 vCPU / 4 GB RAM | co-locate or Vercel  |
| Cloudflare R2 | —                 | ~$0–5 USD at MVP scale |
| **Total**     |                   | **~$65–80 USD/mo**   |

---

## Docker Compose (Production)

```yaml
# docker-compose.prod.yml — key differences from dev:
# - No volume mounts for source code
# - NODE_ENV=production
# - Nginx with TLS termination
# - Health checks on all services
# - Restart: always
```

### Build & Deploy script

```bash
#!/bin/bash
# infra/scripts/deploy.sh

set -e

REGISTRY="registry.digitalocean.com/zhim"
TAG=$(git rev-parse --short HEAD)

echo "Building images (tag: $TAG)"
docker build -t $REGISTRY/api:$TAG ./apps/api
docker build -t $REGISTRY/console:$TAG ./apps/console

echo "Pushing to registry"
docker push $REGISTRY/api:$TAG
docker push $REGISTRY/console:$TAG

echo "Deploying to production"
ssh deploy@YOUR_SERVER_IP << EOF
  cd /srv/zhim
  export API_TAG=$TAG
  export CONSOLE_TAG=$TAG
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d --remove-orphans
  docker system prune -f
EOF

echo "Deploy complete: $TAG"
```

---

## CI/CD — GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run type-check
      - run: npm run test -- --passWithNoTests

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          SERVER: ${{ secrets.DEPLOY_SERVER }}
        run: |
          echo "$DEPLOY_KEY" > /tmp/deploy_key
          chmod 600 /tmp/deploy_key
          GIT_SSH_COMMAND="ssh -i /tmp/deploy_key" ./infra/scripts/deploy.sh
```

---

## Nginx Configuration

```nginx
# infra/nginx/conf.d/zhim.conf

upstream api {
    server api:3000;
    keepalive 64;
}

upstream console {
    server console:3001;
    keepalive 16;
}

server {
    listen 80;
    server_name api.zhim.bt zhim.bt console.zhim.bt;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.zhim.bt;

    ssl_certificate     /etc/ssl/zhim/fullchain.pem;
    ssl_certificate_key /etc/ssl/zhim/privkey.pem;

    # Rate limiting
    limit_req zone=api_limit burst=20 nodelay;

    # Gzip
    gzip on;
    gzip_types application/json text/plain;
    gzip_min_length 1000;

    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
        client_max_body_size 10M;
    }
}

server {
    listen 443 ssl http2;
    server_name console.zhim.bt;

    ssl_certificate     /etc/ssl/zhim/fullchain.pem;
    ssl_certificate_key /etc/ssl/zhim/privkey.pem;

    location / {
        proxy_pass http://console;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Database — PostgreSQL

### Connection pooling
Use **PgBouncer** in transaction mode (co-locate on API server):
- Max pool size: 20 connections
- Server pool size: 5

### Backups
```bash
# Daily backup to R2 — run via cron 02:00 UTC
pg_dump $DATABASE_URL | gzip | \
  aws s3 cp - s3://zhim-backups/$(date +%Y%m%d).sql.gz \
  --endpoint-url https://YOUR_ACCOUNT.r2.cloudflarestorage.com
```

### Indexes to monitor
Watch query performance on:
- `orders` (customer_id, status, created_at) — high-frequency
- `restaurants` (location GIST) — every home screen load
- `delivery_pings` — insert-heavy; partition by month in V2

---

## Mobile App Distribution

### Customer & Rider apps
- **Android APK** via direct distribution + Google Play (Bhutan Play Store access is limited — provide APK download on website)
- **iOS** via TestFlight for pilots; App Store for GA
- OTA updates via Expo EAS Update (no app store review cycle for JS changes)

### Build commands
```bash
# Install EAS CLI
npm install -g eas-cli

# Build Android APK (for direct distribution)
cd apps/customer
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production
```

### EAS config (apps/customer/eas.json)
```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "production": {
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    }
  }
}
```

---

## SMS Gateway Setup

1. Register merchant account with **TashiCell** (covers B-Mobile ~17/16 prefix)
2. Register with **Bhutan Telecom** gateway (covers TashiCell ~77 prefix — confusing naming)
3. Twilio as fallback for international numbers (+91, tourist phones)
4. Set `TASHICELL_API_KEY`, `BT_SMS_API_KEY` in production `.env`

---

## Bandwidth Optimisation (3G users)

- All images served via Cloudflare R2 with `?w=400&q=70` transform parameters
- Menu item images: max 400px wide, WebP, ~30KB
- Cover images: max 800px wide, progressive JPEG
- Offline tile cache for Thimphu/Paro in Rider app (MapTiler offline tiles, ~50MB)
- React Query `staleTime: 5min` for restaurant lists — reduces repeat API calls on slow connections
- Expo Image with `contentFit="cover"` and blurhash placeholders

---

## Monitoring & Alerting

- **Uptime:** Cloudflare health checks on `/api/v1/health`
- **Errors:** Sentry (free tier, ~5K errors/month)
- **Logs:** Loki + Grafana (self-hosted on monitoring server, ~$10/mo)
- **Alerts:** Telegram bot for critical alerts (common in Bhutan; WhatsApp is less reliable for automated msgs)

---

## Launch Checklist — MVP Go-Live

- [ ] PostgreSQL schema migrated and seeded (5 Thimphu zones)
- [ ] TashiCell + BT SMS credentials live
- [ ] mBoB merchant account approved
- [ ] MyPay merchant account approved
- [ ] Firebase project created, FCM keys configured
- [ ] Google Maps API key with Bhutan billing enabled
- [ ] R2 bucket `zhim-media` created with public read policy
- [ ] Jomolhari font hosted in R2/CDN (not bundled in APK to save size)
- [ ] SSL certificates provisioned (Let's Encrypt via Certbot)
- [ ] 5 pilot restaurants onboarded with Loyverse sync tested
- [ ] 3 pilot riders KYC approved
- [ ] Load test: 50 concurrent users placing orders simultaneously
- [ ] COD change-required flow tested end-to-end
- [ ] Dzongkha OTP SMS sent and received on TashiCell number
- [ ] Surge banner visible in customer + rider app during test surge
- [ ] Console admin can approve KYC document end-to-end
- [ ] Order tracking WebSocket stable on 3G (packet loss simulation)
