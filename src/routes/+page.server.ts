/**
 * Landing / Home page
 * - Free (calendar.mx): Show landing page with pricing
 * - Pro subdomain (gym1.calendar.mx): Show tenant's public event types
 */

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { tenant, db, userId } = locals;

	if (tenant) {
		const eventTypes = await db
			.prepare(
				`SELECT et.id, et.name, et.slug, et.duration_minutes as duration, et.description,
				        et.color, et.max_attendees, u.name as trainer_name, u.profile_image as trainer_image
				 FROM event_types et
				 JOIN users u ON et.user_id = u.id
				 WHERE et.tenant_id = ? AND et.is_active = 1
				 ORDER BY et.name ASC`
			)
			.bind(tenant.id)
			.all();

		return {
			mode: 'tenant' as const,
			tenant,
			eventTypes: eventTypes.results,
			userId,
		};
	}

	if (userId) {
		const eventTypes = await db
			.prepare(
				`SELECT id, name, slug, duration_minutes as duration, description, color
				 FROM event_types
				 WHERE user_id = ? AND tenant_id IS NULL AND is_active = 1
				 ORDER BY name ASC`
			)
			.bind(userId)
			.all();

		return {
			mode: 'user' as const,
			tenant: null,
			eventTypes: eventTypes.results,
			userId,
		};
	}

	return {
		mode: 'landing' as const,
		tenant: null,
		eventTypes: [],
		userId: null,
	};
};
