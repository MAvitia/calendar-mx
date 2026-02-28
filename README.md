# Calendar.mx — Multi-Tenant SaaS Scheduling

Multi-tenant scheduling calendar (like Calendly), built on Cloudflare Workers + D1 + Pages. Forked from [CloudMeet](https://github.com/dennisklappe/CloudMeet).

## Architecture

```
calendar.mx          → Free tier (shared D1, personal scheduling)
acme.calendar.mx     → Pro tenant (isolated by tenant_id, branded)
agency.calendar.mx   → Pro tenant (own branding, team, group events)
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
| Users | Single admin user | Multi-user with roles (owner/admin/member) |
| Data isolation | None (one user) | `tenant_id` column on all tables |
| Auth | Google OAuth → admin only | Google OAuth → any user, JWT includes `tenant_id` |
| Routing | Single domain | Host-based: subdomain → KV lookup → tenant context |
| Event types | Personal meetings | Group events with `max_attendees` support |
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

### 4. Initialize Database

```bash
# Local development
npm run db:init

# Production
npm run db:init:remote
```

### 5. Set Secrets

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

### 6. Deploy

```bash
npm run deploy
```

### 7. Provision a Pro Tenant

```bash
CF_API_TOKEN=xxx CF_ACCOUNT_ID=xxx CF_ZONE_ID=xxx D1_DATABASE_ID=xxx TENANT_KV_ID=xxx \
  npx tsx scripts/provision-tenant.ts --name "Acme Corp" --subdomain "acme" --email "owner@acme.com"
```

## Tenant Resolution Flow

```
Request: GET https://acme.calendar.mx/dashboard
  │
  ├─ _middleware.ts: Extract "acme" from Host header
  │
  ├─ hooks.server.ts: TENANT_KV.get("tenant:acme") → { tenant_id }
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
127.0.0.1 acme.localhost
```

Then visit `http://acme.localhost:5173`.

## License

MIT — Built on [CloudMeet](https://github.com/dennisklappe/CloudMeet)
