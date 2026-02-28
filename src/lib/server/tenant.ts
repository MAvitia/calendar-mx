/**
 * Tenant resolution — detects tenant from Host header via TENANT_KV lookup.
 * Returns null for free-tier requests on the main domain.
 */

export interface TenantContext {
	id: string;
	name: string;
	slug: string;
	subdomain: string;
	plan: 'free' | 'pro' | 'enterprise';
	logo_url: string | null;
	brand_color: string;
	brand_secondary: string;
	timezone: string;
	locale: string;
	settings: Record<string, unknown>;
	is_active: boolean;
}

export interface TenantKVEntry {
	tenant_id: string;
	name: string;
	plan: string;
}

/**
 * Resolve tenant from the incoming request Host header.
 * gym1.calendar.mx → lookup "gym1" in TENANT_KV → return TenantContext
 * calendar.mx → return null (free tier / public)
 */
export async function resolveTenant(
	host: string,
	appDomain: string,
	tenantKV: KVNamespace,
	db: D1Database
): Promise<TenantContext | null> {
	const normalizedHost = host.replace(/:\d+$/, '').toLowerCase();
	const normalizedDomain = appDomain.toLowerCase();

	if (normalizedHost === normalizedDomain || normalizedHost === `www.${normalizedDomain}`) {
		return null;
	}

	if (!normalizedHost.endsWith(`.${normalizedDomain}`)) {
		return null;
	}

	const subdomain = normalizedHost.replace(`.${normalizedDomain}`, '');
	if (!subdomain || subdomain.includes('.')) {
		return null;
	}

	const kvEntry = await tenantKV.get<TenantKVEntry>(`tenant:${subdomain}`, 'json');
	if (!kvEntry) {
		return null;
	}

	const tenant = await db
		.prepare(
			`SELECT id, name, slug, subdomain, plan, logo_url, brand_color, brand_secondary,
			        timezone, locale, settings, is_active
			 FROM tenants WHERE id = ? AND is_active = 1`
		)
		.bind(kvEntry.tenant_id)
		.first<{
			id: string; name: string; slug: string; subdomain: string;
			plan: string; logo_url: string | null; brand_color: string;
			brand_secondary: string; timezone: string; locale: string;
			settings: string; is_active: number;
		}>();

	if (!tenant) {
		return null;
	}

	let settings: Record<string, unknown> = {};
	try { settings = JSON.parse(tenant.settings || '{}'); } catch { /* noop */ }

	return {
		id: tenant.id,
		name: tenant.name,
		slug: tenant.slug,
		subdomain: tenant.subdomain,
		plan: tenant.plan as TenantContext['plan'],
		logo_url: tenant.logo_url,
		brand_color: tenant.brand_color,
		brand_secondary: tenant.brand_secondary,
		timezone: tenant.timezone,
		locale: tenant.locale,
		settings,
		is_active: !!tenant.is_active,
	};
}

/**
 * Build a tenant-scoped WHERE clause fragment.
 * For pro tenants: "AND tenant_id = ?"
 * For free tier: "AND tenant_id IS NULL"
 */
export function tenantWhere(tenant: TenantContext | null): { clause: string; binds: string[] } {
	if (tenant) {
		return { clause: 'AND tenant_id = ?', binds: [tenant.id] };
	}
	return { clause: 'AND tenant_id IS NULL', binds: [] };
}
