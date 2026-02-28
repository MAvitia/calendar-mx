import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	const session = await requireAuth(event);
	const env = event.platform?.env;
	if (env?.DB) {
		await env.DB.prepare('UPDATE users SET outlook_refresh_token = NULL WHERE id = ?')
			.bind(session.userId).run();
	}
	throw redirect(302, '/dashboard/calendars');
};
