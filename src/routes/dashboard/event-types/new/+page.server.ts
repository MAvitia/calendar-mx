import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import { isValidSlug, validateLength, MAX_LENGTHS } from '$lib/server/validation';

export const load: PageServerLoad = async (event) => {
	const session = await requireAuth(event);
	return { userId: session.userId };
};

export const actions: Actions = {
	default: async (event) => {
		const session = await requireAuth(event);
		const db = event.locals.db;
		const tenant = event.locals.tenant;

		const form = await event.request.formData();
		const name = (form.get('name') as string || '').trim();
		const slug = (form.get('slug') as string || '').toLowerCase().trim();
		const duration = parseInt(form.get('duration') as string || '30');
		const buffer = parseInt(form.get('buffer') as string || '0');
		const description = (form.get('description') as string || '').trim();
		const locationType = form.get('locationType') as string || 'google_meet';
		const maxAttendees = parseInt(form.get('maxAttendees') as string || '1');
		const color = form.get('color') as string || '#10b981';

		const nameErr = validateLength(name, 'Name', MAX_LENGTHS.name, true);
		if (nameErr) return fail(400, { error: nameErr });
		if (!isValidSlug(slug)) return fail(400, { error: 'Invalid slug' });

		const existing = await db
			.prepare('SELECT id FROM event_types WHERE user_id = ? AND slug = ?')
			.bind(session.userId, slug)
			.first();
		if (existing) return fail(400, { error: 'Slug already in use' });

		const id = crypto.randomUUID();
		await db
			.prepare(
				`INSERT INTO event_types (id, tenant_id, user_id, name, slug, duration_minutes, buffer_minutes, description, location_type, max_attendees, color, is_active)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
			)
			.bind(id, tenant?.id || null, session.userId, name, slug, duration, buffer, description || null, locationType, maxAttendees, color)
			.run();

		throw redirect(302, `/dashboard/event-types/${id}`);
	}
};
