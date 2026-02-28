/**
 * OAuth callback — multi-tenant aware.
 * Creates/updates user, creates session with tenant_id claim.
 */

import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForTokens, getGoogleUserInfo, createSessionToken } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	const env = platform?.env;
	if (!env) throw error(500, 'Platform env not available');

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	if (errorParam) throw error(400, `OAuth error: ${errorParam}`);
	if (!code || !state) throw error(400, 'Missing code or state parameter');

	let stateData: { csrf: string; tenantId: string | null; returnTo: string };
	try {
		stateData = JSON.parse(atob(state));
	} catch {
		throw error(400, 'Invalid state parameter');
	}

	const storedState = await env.KV.get(`oauth_state:${stateData.csrf}`);
	if (!storedState) throw error(400, 'Expired or invalid state');
	await env.KV.delete(`oauth_state:${stateData.csrf}`);

	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	const appUrl = env.APP_URL;
	if (!clientId || !clientSecret || !appUrl) throw error(500, 'Missing OAuth configuration');

	try {
		const redirectUri = `${appUrl}/auth/callback`;
		const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
		const userInfo = await getGoogleUserInfo(tokens.access_token);

		const db = env.DB;
		const tenantId = stateData.tenantId;

		let user = await db
			.prepare('SELECT id, role, tenant_id FROM users WHERE email = ? AND (tenant_id = ? OR (tenant_id IS NULL AND ? IS NULL))')
			.bind(userInfo.email, tenantId, tenantId)
			.first<{ id: string; role: string; tenant_id: string | null }>();

		if (!user) {
			const userId = crypto.randomUUID();
			const slug = userInfo.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
			const role = tenantId ? 'client' : 'user';
			const plan = tenantId ? 'pro' : 'free';

			await db
				.prepare(
					`INSERT INTO users (id, tenant_id, email, name, slug, role, plan, google_refresh_token, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
				)
				.bind(userId, tenantId, userInfo.email, userInfo.name, slug, role, plan, tokens.refresh_token || null)
				.run();

			user = { id: userId, role, tenant_id: tenantId };
		} else {
			await db
				.prepare(
					`UPDATE users SET google_refresh_token = COALESCE(?, google_refresh_token), name = ? WHERE id = ?`
				)
				.bind(tokens.refresh_token || null, userInfo.name, user.id)
				.run();
		}

		const sessionToken = await createSessionToken(user.id, user.tenant_id, user.role, env.JWT_SECRET);

		cookies.set('session', sessionToken, {
			path: '/',
			httpOnly: true,
			secure: appUrl.startsWith('https'),
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(302, stateData.returnTo || '/dashboard');
	} catch (err: any) {
		if (err?.status && err?.location) throw err;
		console.error('OAuth callback error:', err);
		throw error(500, `Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
};
