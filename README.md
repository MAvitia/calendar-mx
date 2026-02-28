# Calendar.mx — Multi-Tenant SaaS Calendar

Multi-tenant calendar for gym bookings and appointments, built on Cloudflare Workers + D1 + Pages. Forked from [CloudMeet](https://github.com/dennisklappe/CloudMeet).

## Architecture

```
calendar.mx          → Free tier (shared D1, personal scheduling)
gym1.calendar.mx     → Pro tenant (isolated by tenant_id, branded)
gym2.calendar.mx     → Pro tenant (own branding, team, classes)
```

**Stack:** SvelteKit + Cloudflare Pages Adapter + D1 + KV + Workers

## Folder Structure

```
├── functions/
│   └── _middleware.ts          # CF Pages middleware (security, caching)
├── migrations/
│   └── 0001_multi_tenant.sql   # Migration from single-tenant
├── scripts/
│   ├── provision-tenant.ts     # Create tenant: D1 record + KV + DNS
│   └── prebuild.js
├── src/
│   ├── hooks.server.ts         # Tenant resolution on every request
│   ├── app.d.ts                # Platform env types
│   ├── lib/
│   │   ├── server/
│   │   │   ├── tenant.ts       # Host → tenant_id resolution
│   │   │   ├── auth.ts         # Google OAuth + JWT w/ tenant_id
│   │   │   ├── stripe.ts       # Stripe checkout + webhooks
│   │   │   ├── google-calendar.ts
│   │   │   ├── outlook-calendar.ts
│   │   │   ├── email.ts + email/
│   │   │   └── validation.ts
│   │   └── i18n/               # Spanish/English translations
│   │       ├── en.ts
│   │       ├── es.ts
│   │       └── index.ts
│   └── routes/
│       ├── +page.svelte        # Landing (free) / Event list (tenant)
│       ├── [slug]/             # Public booking page
│       ├── auth/               # Login, callback, logout
│       ├── signup/             # Free + Pro signup (Stripe)
│       ├── dashboard/          # Protected dashboard
│       │   ├── event-types/    # CRUD event types
│       │   ├── availability/   # Weekly schedule rules
│       │   └── calendars/      # Google/Outlook connections
│       └── api/
│           ├── bookings/       # Create bookings
│           ├── availability/   # Available time slots
│           ├── tenant/         # Tenant settings API
│           └── stripe/webhook/ # Stripe webhook handler
├── schema.sql                  # Full D1 schema (multi-tenant)
├── wrangler.toml               # Cloudflare Pages config
└── package.json
```

## Key Changes from CloudMeet

| Area | CloudMeet (Single-Tenant) | Calendar.mx (Multi-Tenant) |
|------|---------------------------|---------------------------|
| Users | Single admin user | Multi-user with roles (owner/admin/trainer/client) |
| Data isolation | None (one user) | `tenant_id` column on all tables |
| Auth | Google OAuth → admin only | Google OAuth → any user, JWT includes `tenant_id` |
| Routing | Single domain | Host-based: subdomain → KV lookup → tenant context |
| Event types | Personal meetings | Classes with `max_attendees`, group bookings |
| Branding | Single brand_color | Per-tenant logo, colors, CSS |
| Payments | None | Stripe subscriptions for Pro tier |
| i18n | English only | Spanish + English toggle |
| Theme | Light only | Dark mode + light mode |

## Setup & Deployment

### 1. Prerequisites

- Cloudflare account with `calendar.mx` domain configured
- Google Cloud OAuth credentials
- Stripe account (for Pro tier)

### 2. Install

```bash
npm install
```

### 3. Create Cloudflare Resources

```bash
# Create D1 database
wrangler d1 create calendar_public

# Create KV namespaces
wrangler kv namespace create KV
wrangler kv namespace create TENANT_KV

# Note the IDs and update wrangler.toml
```

### 4. Update `wrangler.toml`

Replace `YOUR_*_ID` placeholders with the actual IDs from step 3.

### 5. Initialize Database

```bash
# Local development
npm run db:init

# Production
npm run db:init:remote
```

### 6. Set Secrets

```bash
wrangler pages secret put GOOGLE_CLIENT_ID
wrangler pages secret put GOOGLE_CLIENT_SECRET
wrangler pages secret put JWT_SECRET
wrangler pages secret put STRIPE_SECRET_KEY
wrangler pages secret put STRIPE_WEBHOOK_SECRET
wrangler pages secret put CF_API_TOKEN
wrangler pages secret put CF_ACCOUNT_ID
wrangler pages secret put CF_ZONE_ID
```

### 7. Deploy

```bash
npm run deploy
```

### 8. Connect to GitHub (auto-deploy)

1. Go to Cloudflare Dashboard → Pages → Create Project
2. Connect your GitHub repo
3. Build command: `npm run build`
4. Build output: `.svelte-kit/cloudflare`
5. Add all environment variables / secrets
6. Set custom domain: `calendar.mx`
7. Enable wildcard subdomain: `*.calendar.mx`

### 9. Provision a Pro Tenant

```bash
# Via script
CF_API_TOKEN=xxx CF_ACCOUNT_ID=xxx CF_ZONE_ID=xxx D1_DATABASE_ID=xxx TENANT_KV_ID=xxx \
  npx tsx scripts/provision-tenant.ts --name "GymOne" --subdomain "gym1" --email "owner@gym.com"

# Or via Stripe (automatic on checkout.session.completed webhook)
```

## Tenant Resolution Flow

```
Request: GET https://gym1.calendar.mx/dashboard
  │
  ├─ _middleware.ts: Extract "gym1" from Host header
  │
  ├─ hooks.server.ts: TENANT_KV.get("tenant:gym1") → { tenant_id }
  │                    DB.query("SELECT * FROM tenants WHERE id = ?")
  │                    → locals.tenant = { id, name, brand_color, ... }
  │
  ├─ +page.server.ts: DB.query("... WHERE tenant_id = ?", tenant.id)
  │
  └─ +page.svelte: Renders with tenant branding
```

## Development

```bash
npm run dev
```

Visit `http://localhost:5173` for the main app. To test tenant subdomains locally, add to your hosts file:

```
127.0.0.1 gym1.localhost
```

Then visit `http://gym1.localhost:5173`.

## License

MIT — Built on [CloudMeet](https://github.com/dennisklappe/CloudMeet)
