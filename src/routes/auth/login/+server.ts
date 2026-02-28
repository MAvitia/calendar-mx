/**
 * Google OAuth login — tenant-aware.
 */

import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUrl } from '$lib/server/auth';

export const GET: RequestHandler = async ({ platform, url, locals }) => {
	const env = platform?.env;
	if (!env) throw error(500, 'Platform env not available');

	const clientId = env.GOOGLE_CLIENT_ID;
	const appUrl = env.APP_URL;
	if (!clientId || !appUrl) {
		throw error(500, `Missing OAuth config: GOOGLE_CLIENT_ID=${!!clientId}, APP_URL=${!!appUrl}`);
	}

	const stateData = {
		csrf: crypto.randomUUID(),
		tenantId: locals.tenant?.id || null,
		returnTo: url.searchParams.get('returnTo') || '/dashboard',
	};
	const state = btoa(JSON.stringify(stateData));

	if (env.KV) {
		await env.KV.put(`oauth_state:${stateData.csrf}`, JSON.stringify(stateData), { expirationTtl: 600 });
	}

	const redirectUri = `${appUrl}/auth/callback`;
	const authUrl = getAuthUrl(clientId, redirectUri, state);

	throw redirect(302, authUrl);
};
