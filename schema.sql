-- ============================================================
-- Calendar.mx — Multi-tenant D1 Schema
-- Extends CloudMeet with tenant_id columns for logical isolation
-- ============================================================

-- Tenants (Pro tier businesses/teams)
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

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_owner ON tenants(owner_user_id);
CREATE INDEX idx_tenants_stripe ON tenants(stripe_customer_id);

-- Users (shared across tenants; tenant_id NULL = free/public user)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    google_refresh_token TEXT,
    outlook_refresh_token TEXT,
    timezone TEXT DEFAULT 'America/Mexico_City',
    locale TEXT DEFAULT 'es',
    role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'member', 'user')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sync_token TEXT,
    last_sync DATETIME,
    slug TEXT NOT NULL,
    settings JSON DEFAULT '{}',
    profile_image TEXT,
    brand_color TEXT DEFAULT '#10b981',
    contact_email TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_users_slug ON users(slug);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- Event types (meetings, appointments, group events)
CREATE TABLE IF NOT EXISTS event_types (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    buffer_minutes INTEGER DEFAULT 0,
    color TEXT DEFAULT '#10b981',
    slug TEXT NOT NULL,
    description TEXT,
    location_type TEXT DEFAULT 'google_meet',
    location_details TEXT,
    is_active BOOLEAN DEFAULT 1,
    cover_image TEXT,
    max_attendees INTEGER DEFAULT 1,
    availability_calendars TEXT DEFAULT 'both',
    invite_calendar TEXT DEFAULT 'google',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, user_id, slug)
);

CREATE INDEX idx_event_types_user ON event_types(user_id);
CREATE INDEX idx_event_types_tenant ON event_types(tenant_id);
CREATE INDEX idx_event_types_active ON event_types(tenant_id, user_id, is_active);

-- Availability rules (recurring weekly schedule)
CREATE TABLE IF NOT EXISTS availability_rules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    user_id TEXT NOT NULL,
    event_type_id TEXT,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
);

CREATE INDEX idx_availability_rules_user ON availability_rules(user_id);
CREATE INDEX idx_availability_rules_tenant ON availability_rules(tenant_id);

-- Availability overrides (specific date exceptions)
CREATE TABLE IF NOT EXISTS availability_overrides (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    available BOOLEAN NOT NULL,
    start_time TIME,
    end_time TIME,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_availability_overrides_user_date ON availability_overrides(user_id, date);
CREATE INDEX idx_availability_overrides_tenant ON availability_overrides(tenant_id);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    event_type_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    attendee_notes TEXT,
    google_event_id TEXT,
    outlook_event_id TEXT,
    meeting_url TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'canceled', 'rescheduled')),
    canceled_at DATETIME,
    canceled_by TEXT CHECK (canceled_by IN ('host', 'attendee')),
    cancellation_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (event_type_id) REFERENCES event_types(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_bookings_user_time ON bookings(user_id, start_time);
CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_bookings_event_type ON bookings(event_type_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Sessions for auth
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    tenant_id TEXT,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    user_id TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('confirmation', 'cancellation', 'reschedule', 'reminder_24h', 'reminder_1h', 'reminder_30m')),
    is_enabled BOOLEAN DEFAULT 1,
    subject TEXT,
    custom_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, user_id, template_type)
);

CREATE INDEX idx_email_templates_user ON email_templates(user_id);
CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);

-- Scheduled emails for reminders
CREATE TABLE IF NOT EXISTS scheduled_emails (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    booking_id TEXT NOT NULL,
    template_type TEXT NOT NULL,
    scheduled_for DATETIME NOT NULL,
    sent_at DATETIME,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_scheduled_emails_pending ON scheduled_emails(status, scheduled_for);

-- Reschedule proposals
CREATE TABLE IF NOT EXISTS reschedule_proposals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    booking_id TEXT NOT NULL,
    proposed_start_time DATETIME NOT NULL,
    proposed_end_time DATETIME NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'counter_proposed', 'expired')),
    proposed_by TEXT NOT NULL CHECK (proposed_by IN ('host', 'attendee')),
    response_token TEXT UNIQUE NOT NULL,
    responded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_reschedule_proposals_token ON reschedule_proposals(response_token);

-- Cache control (fallback when KV unavailable)
CREATE TABLE IF NOT EXISTS cache_control (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    date DATE NOT NULL,
    endpoint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    UNIQUE(tenant_id, date, endpoint)
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT,
    user_id TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Views
CREATE VIEW IF NOT EXISTS active_event_types AS
SELECT * FROM event_types WHERE is_active = 1;

CREATE VIEW IF NOT EXISTS upcoming_bookings AS
SELECT * FROM bookings
WHERE status = 'confirmed'
AND start_time > CURRENT_TIMESTAMP
ORDER BY start_time;
