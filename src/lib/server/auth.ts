/**
 * Authentication — Google OAuth + JWT with tenant_id claim.
 * Extended from CloudMeet's single-user auth to multi-tenant.
 */

import type { RequestEvent } from '@sveltejs/kit';

export interface GoogleTokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
	scope: string;
}

export interface GoogleUserInfo {
	id: string;
	email: string;
	name: string;
	picture: string;
}

export interface SessionPayload {
	userId: string;
	tenantId: string | null;
	role: string;
	iat: number;
}

export function getAuthUrl(clientId: string, redirectUri: string, state: string): string {
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: [
			'https://www.googleapis.com/auth/calendar',
			'https://www.googleapis.com/auth/calendar.events',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/userinfo.profile'
		].join(' '),
		access_type: 'offline',
		prompt: 'consent',
		state
	});
	return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(
	code: string, clientId: string, clientSecret: string, redirectUri: string
): Promise<GoogleTokenResponse> {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code, client_id: clientId, client_secret: clientSecret,
			redirect_uri: redirectUri, grant_type: 'authorization_code'
		})
	});
	if (!response.ok) {
		throw new Error(`Token exchange failed: ${await response.text()}`);
	}
	return response.json();
}

export async function refreshAccessToken(
	refreshToken: string, clientId: string, clientSecret: string
): Promise<GoogleTokenResponse> {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			refresh_token: refreshToken, client_id: clientId,
			client_secret: clientSecret, grant_type: 'refresh_token'
		})
	});
	if (!response.ok) {
		throw new Error(`Token refresh failed: ${await response.text()}`);
	}
	return response.json();
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
	const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!response.ok) throw new Error('Failed to get user info');
	return response.json();
}

async function hashString(str: string): Promise<string> {
	const data = new TextEncoder().encode(str);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create session token with tenant_id claim
 */
export async function createSessionToken(
	userId: string, tenantId: string | null, role: string, secret: string
): Promise<string> {
	const payload: SessionPayload = { userId, tenantId, role, iat: Date.now() };
	const data = btoa(JSON.stringify(payload));
	const signature = await hashString(`${data}.${secret}`);
	return `${data}.${signature}`;
}

/**
 * Verify session token — returns payload with userId + tenantId
 */
export async function verifySessionToken(
	token: string, secret: string
): Promise<SessionPayload | null> {
	try {
		const [data, signature] = token.split('.');
		const expectedSignature = await hashString(`${data}.${secret}`);
		if (signature !== expectedSignature) return null;

		const payload: SessionPayload = JSON.parse(atob(data));
		const age = Date.now() - payload.iat;
		if (age > 7 * 24 * 60 * 60 * 1000) return null;

		return payload;
	} catch {
		return null;
	}
}

/**
 * Get current user from session cookie — returns { userId, tenantId, role }
 */
export async function getCurrentUser(
	event: RequestEvent
): Promise<SessionPayload | null> {
	const sessionToken = event.cookies.get('session');
	if (!sessionToken) return null;

	const jwtSecret = event.platform?.env?.JWT_SECRET;
	if (!jwtSecret) return null;

	return verifySessionToken(sessionToken, jwtSecret);
}

/**
 * Require authentication — throws if not authenticated
 */
export async function requireAuth(event: RequestEvent): Promise<SessionPayload> {
	const session = await getCurrentUser(event);
	if (!session) throw new Error('Not authenticated');
	return session;
}
