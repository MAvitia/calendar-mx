-- Migration: Add multi-tenant support to CloudMeet base
-- Run this AFTER the base schema.sql if migrating from single-tenant

-- Add tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    owner_user_id TEXT,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#10b981',
    brand_secondary TEXT DEFAULT '#0ea5e9',
    custom_css TEXT,
    timezone TEXT DEFAULT 'America/Mexico_City',
    locale TEXT DEFAULT 'es',
    settings JSON DEFAULT '{}',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add tenant_id to existing tables (safe ALTER — SQLite adds nullable columns)
ALTER TABLE users ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN locale TEXT DEFAULT 'es';

ALTER TABLE event_types ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE event_types ADD COLUMN max_attendees INTEGER DEFAULT 1;

ALTER TABLE availability_rules ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE availability_overrides ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE email_templates ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE scheduled_emails ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE reschedule_proposals ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE webhooks ADD COLUMN tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE api_usage ADD COLUMN tenant_id TEXT;

-- Indexes for tenant lookups
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_types_tenant ON event_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
