/**
 * Outlook OAuth initiation — requires existing Google login
 */

import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { getOutlookAuthUrl } from '$lib/server/outlook-calendar';

export const GET: RequestHandler = async (event) => {
	await requireAuth(event);
	const env = event.platform?.env;
	if (!env?.MICROSOFT_CLIENT_ID) throw error(500, 'Outlook not configured');

	const state = crypto.randomUUID();
	await env.KV.put(`outlook_state:${state}`, '1', { expirationTtl: 600 });

	const redirectUri = `${env.APP_URL}/auth/outlook/callback`;
	const authUrl = getOutlookAuthUrl(env.MICROSOFT_CLIENT_ID, redirectUri, state);
	throw redirect(302, authUrl);
};
