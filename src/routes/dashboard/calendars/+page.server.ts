import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { listCalendars, getValidAccessToken } from '$lib/server/google-calendar';

export const load: PageServerLoad = async (event) => {
	const session = await requireAuth(event);
	const db = event.locals.db;
	const env = event.platform?.env;

	const user = await db
		.prepare('SELECT google_refresh_token, outlook_refresh_token FROM users WHERE id = ?')
		.bind(session.userId)
		.first<{ google_refresh_token: string | null; outlook_refresh_token: string | null }>();

	let googleCalendars: unknown[] = [];
	const googleConnected = !!user?.google_refresh_token;
	const outlookConnected = !!user?.outlook_refresh_token;

	if (googleConnected && env?.GOOGLE_CLIENT_ID && env?.GOOGLE_CLIENT_SECRET) {
		try {
			const accessToken = await getValidAccessToken(db, session.userId, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
			googleCalendars = await listCalendars(accessToken);
		} catch (err) {
			console.error('Failed to list Google calendars:', err);
		}
	}

	return {
		googleConnected,
		outlookConnected,
		googleCalendars,
		outlookConfigured: !!(env?.MICROSOFT_CLIENT_ID && env?.MICROSOFT_CLIENT_SECRET),
	};
};
