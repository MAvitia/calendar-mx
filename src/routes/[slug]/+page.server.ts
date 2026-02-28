/**
 * Public booking page for a specific event type — multi-tenant.
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { tenantWhere } from '$lib/server/tenant';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { slug } = params;
	const db = locals.db;
	const tenant = locals.tenant;
	const tw = tenantWhere(tenant);

	let user;
	if (tenant) {
		user = await db
			.prepare(`SELECT id, name, slug, profile_image, brand_color, timezone, settings FROM users WHERE tenant_id = ? AND role IN ('owner', 'trainer') LIMIT 1`)
			.bind(tenant.id)
			.first<{ id: string; name: string; slug: string; profile_image: string | null; brand_color: string | null; timezone: string; settings: string | null }>();
	} else {
		user = await db
			.prepare('SELECT id, name, slug, profile_image, brand_color, timezone, settings FROM users WHERE tenant_id IS NULL LIMIT 1')
			.first<{ id: string; name: string; slug: string; profile_image: string | null; brand_color: string | null; timezone: string; settings: string | null }>();
	}

	if (!user) throw error(404, 'Not found');

	const eventType = await db
		.prepare(
			`SELECT id, name, slug, duration_minutes as duration, buffer_minutes as buffer,
			        description, location_type, color, max_attendees, cover_image
			 FROM event_types
			 WHERE user_id = ? AND slug = ? AND is_active = 1 ${tw.clause}`
		)
		.bind(user.id, slug, ...tw.binds)
		.first();

	if (!eventType) throw error(404, 'Event type not found');

	return {
		user: {
			id: user.id,
			name: user.name,
			slug: user.slug,
			profileImage: user.profile_image,
			brandColor: user.brand_color,
			timezone: user.timezone,
		},
		eventType,
		tenant,
	};
};
