import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import { tenantWhere } from '$lib/server/tenant';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const load: PageServerLoad = async (event) => {
	const session = await requireAuth(event);
	const db = event.locals.db;
	const tw = tenantWhere(event.locals.tenant);

	const rules = await db
		.prepare(`SELECT * FROM availability_rules WHERE user_id = ? ${tw.clause} ORDER BY day_of_week, start_time`)
		.bind(session.userId, ...tw.binds)
		.all();

	return { rules: rules.results, days: DAYS };
};

export const actions: Actions = {
	add: async (event) => {
		const session = await requireAuth(event);
		const db = event.locals.db;
		const tenant = event.locals.tenant;

		const form = await event.request.formData();
		const dayOfWeek = parseInt(form.get('dayOfWeek') as string);
		const startTime = form.get('startTime') as string;
		const endTime = form.get('endTime') as string;

		if (isNaN(dayOfWeek) || !startTime || !endTime) return fail(400, { error: 'Missing fields' });
		if (startTime >= endTime) return fail(400, { error: 'End time must be after start time' });

		await db
			.prepare(
				`INSERT INTO availability_rules (tenant_id, user_id, day_of_week, start_time, end_time, is_active)
				 VALUES (?, ?, ?, ?, ?, 1)`
			)
			.bind(tenant?.id || null, session.userId, dayOfWeek, startTime, endTime)
			.run();

		return { success: true };
	},

	delete: async (event) => {
		const session = await requireAuth(event);
		const db = event.locals.db;
		const tw = tenantWhere(event.locals.tenant);

		const form = await event.request.formData();
		const ruleId = form.get('ruleId') as string;

		await db
			.prepare(`DELETE FROM availability_rules WHERE id = ? AND user_id = ? ${tw.clause}`)
			.bind(ruleId, session.userId, ...tw.binds)
			.run();

		return { success: true };
	}
};
