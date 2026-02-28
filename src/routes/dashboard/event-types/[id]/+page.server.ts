import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import { tenantWhere } from '$lib/server/tenant';

export const load: PageServerLoad = async (event) => {
	const session = await requireAuth(event);
	const db = event.locals.db;
	const tw = tenantWhere(event.locals.tenant);

	const eventType = await db
		.prepare(`SELECT * FROM event_types WHERE id = ? AND user_id = ? ${tw.clause}`)
		.bind(event.params.id, session.userId, ...tw.binds)
		.first();

	if (!eventType) throw error(404, 'Event type not found');

	return { eventType };
};

export const actions: Actions = {
	update: async (event) => {
		const session = await requireAuth(event);
		const db = event.locals.db;
		const tw = tenantWhere(event.locals.tenant);

		const form = await event.request.formData();
		const name = (form.get('name') as string || '').trim();
		const duration = parseInt(form.get('duration') as string || '30');
		const buffer = parseInt(form.get('buffer') as string || '0');
		const description = (form.get('description') as string || '').trim();
		const locationType = form.get('locationType') as string || 'google_meet';
		const maxAttendees = parseInt(form.get('maxAttendees') as string || '1');
		const color = form.get('color') as string || '#10b981';
		const isActive = form.get('isActive') === 'on' ? 1 : 0;

		if (!name) return fail(400, { error: 'Name is required' });

		await db
			.prepare(
				`UPDATE event_types SET name = ?, duration_minutes = ?, buffer_minutes = ?,
				 description = ?, location_type = ?, max_attendees = ?, color = ?, is_active = ?
				 WHERE id = ? AND user_id = ? ${tw.clause}`
			)
			.bind(name, duration, buffer, description || null, locationType, maxAttendees, color, isActive,
				event.params.id, session.userId, ...tw.binds)
			.run();

		return { success: true };
	},

	delete: async (event) => {
		const session = await requireAuth(event);
		const db = event.locals.db;
		const tw = tenantWhere(event.locals.tenant);

		await db
			.prepare(`DELETE FROM event_types WHERE id = ? AND user_id = ? ${tw.clause}`)
			.bind(event.params.id, session.userId, ...tw.binds)
			.run();

		throw redirect(302, '/dashboard');
	}
};
