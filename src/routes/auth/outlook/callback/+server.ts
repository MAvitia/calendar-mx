import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { exchangeOutlookCode } from '$lib/server/outlook-calendar';

export const GET: RequestHandler = async (event) => {
	const session = await requireAuth(event);
	const env = event.platform?.env;
	if (!env?.MICROSOFT_CLIENT_ID || !env?.MICROSOFT_CLIENT_SECRET) throw error(500, 'Outlook not configured');

	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	if (!code || !state) throw error(400, 'Missing code or state');

	const storedState = await env.KV.get(`outlook_state:${state}`);
	if (!storedState) throw error(400, 'Invalid state');
	await env.KV.delete(`outlook_state:${state}`);

	const tokens = await exchangeOutlookCode(code, env.MICROSOFT_CLIENT_ID, env.MICROSOFT_CLIENT_SECRET, `${env.APP_URL}/auth/outlook/callback`);

	await env.DB.prepare('UPDATE users SET outlook_refresh_token = ? WHERE id = ?')
		.bind(tokens.refresh_token, session.userId).run();

	throw redirect(302, '/dashboard/calendars');
};
