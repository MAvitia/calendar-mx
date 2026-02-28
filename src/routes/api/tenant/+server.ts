/**
 * Tenant management API — create, update, list tenants.
 * Only accessible to authenticated tenant owners/admins.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	const session = await requireAuth(event);
	const db = event.locals.db;
	const tenant = event.locals.tenant;

	if (!tenant) {
		throw error(403, 'Tenant context required');
	}

	const user = await db
		.prepare('SELECT role FROM users WHERE id = ? AND tenant_id = ?')
		.bind(session.userId, tenant.id)
		.first<{ role: string }>();

	if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
		throw error(403, 'Insufficient permissions');
	}

	return json({
		id: tenant.id,
		name: tenant.name,
		subdomain: tenant.subdomain,
		plan: tenant.plan,
		brand_color: tenant.brand_color,
		brand_secondary: tenant.brand_secondary,
		logo_url: tenant.logo_url,
		timezone: tenant.timezone,
		locale: tenant.locale,
	});
};

export const PUT: RequestHandler = async (event) => {
	const session = await requireAuth(event);
	const db = event.locals.db;
	const tenant = event.locals.tenant;

	if (!tenant) throw error(403, 'Tenant context required');

	const user = await db
		.prepare('SELECT role FROM users WHERE id = ? AND tenant_id = ?')
		.bind(session.userId, tenant.id)
		.first<{ role: string }>();

	if (!user || user.role !== 'owner') throw error(403, 'Only owners can update tenant settings');

	const body = await event.request.json() as {
		name?: string; brand_color?: string; brand_secondary?: string;
		logo_url?: string; timezone?: string; locale?: string;
	};

	const updates: string[] = [];
	const values: (string | null)[] = [];

	if (body.name) { updates.push('name = ?'); values.push(body.name); }
	if (body.brand_color) { updates.push('brand_color = ?'); values.push(body.brand_color); }
	if (body.brand_secondary) { updates.push('brand_secondary = ?'); values.push(body.brand_secondary); }
	if (body.logo_url !== undefined) { updates.push('logo_url = ?'); values.push(body.logo_url); }
	if (body.timezone) { updates.push('timezone = ?'); values.push(body.timezone); }
	if (body.locale) { updates.push('locale = ?'); values.push(body.locale); }

	if (updates.length === 0) return json({ success: true });

	updates.push('updated_at = CURRENT_TIMESTAMP');

	await db
		.prepare(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`)
		.bind(...values, tenant.id)
		.run();

	const env = event.platform?.env;
	if (env?.TENANT_KV) {
		await env.TENANT_KV.put(`tenant:${tenant.subdomain}`, JSON.stringify({
			tenant_id: tenant.id,
			name: body.name || tenant.name,
			plan: tenant.plan,
		}));
	}

	return json({ success: true });
};
