/**
 * Dashboard — tenant-aware. Shows event types, bookings, stats.
 * Free users see their personal data. Pro users see tenant-scoped data.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { tenantWhere } from '$lib/server/tenant';

export const load: PageServerLoad = async (event) => {
	const session = await getCurrentUser(event);
	if (!session) throw redirect(302, '/auth/login');

	const db = event.locals.db;
	const tenant = event.locals.tenant;
	const tw = tenantWhere(tenant);

	const user = await db
		.prepare(`SELECT id, email, name, slug, profile_image, brand_color, settings, contact_email, role, plan
		          FROM users WHERE id = ?`)
		.bind(session.userId)
		.first<{ id: string; email: string; name: string; slug: string; profile_image: string | null;
		          brand_color: string | null; settings: string | null; contact_email: string | null;
		          role: string; plan: string }>();

	if (!user) throw redirect(302, '/auth/login');

	const eventTypes = await db
		.prepare(
			`SELECT id, name, slug, duration_minutes as duration, description, is_active, color, max_attendees
			 FROM event_types
			 WHERE user_id = ? ${tw.clause}
			 ORDER BY name ASC`
		)
		.bind(user.id, ...tw.binds)
		.all();

	const twb = tenantWhere(tenant, 'b');
	const recentBookings = await db
		.prepare(
			`SELECT b.id, b.start_time, b.end_time, b.attendee_name, b.attendee_email,
			        b.status, b.created_at, b.attendee_notes, b.canceled_by,
			        et.name as event_type_name, et.duration_minutes, et.color as event_color
			 FROM bookings b
			 JOIN event_types et ON b.event_type_id = et.id
			 WHERE b.user_id = ? ${twb.clause} AND b.start_time >= datetime('now')
			 ORDER BY b.start_time ASC
			 LIMIT 20`
		)
		.bind(user.id, ...twb.binds)
		.all();

	const stats = await db
		.prepare(
			`SELECT
			   COUNT(*) as total_bookings,
			   COUNT(DISTINCT attendee_email) as unique_clients
			 FROM bookings
			 WHERE user_id = ? ${tw.clause}
			   AND status = 'confirmed'
			   AND start_time >= date('now', 'start of month')`
		)
		.bind(user.id, ...tw.binds)
		.first<{ total_bookings: number; unique_clients: number }>();

	let teamMembers: unknown[] = [];
	if (tenant && (user.role === 'owner' || user.role === 'admin')) {
		const team = await db
			.prepare('SELECT id, name, email, role, profile_image FROM users WHERE tenant_id = ? ORDER BY name')
			.bind(tenant.id)
			.all();
		teamMembers = team.results;
	}

	const appUrl = event.platform?.env?.APP_URL || '';

	return {
		user,
		eventTypes: eventTypes.results,
		recentBookings: recentBookings.results,
		stats: stats || { total_bookings: 0, unique_clients: 0 },
		teamMembers,
		tenant,
		appUrl,
		locale: event.locals.locale,
	};
};
