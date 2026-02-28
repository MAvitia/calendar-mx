/**
 * SvelteKit server hooks — runs on every request.
 * Resolves tenant from host, sets locals for all routes.
 */

import type { Handle } from '@sveltejs/kit';
import { resolveTenant } from '$lib/server/tenant';
import { getCurrentUser } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const env = event.platform?.env;
	if (!env?.DB) {
		event.locals.tenant = null;
		event.locals.userId = null;
		event.locals.locale = 'es';
		event.locals.db = null as any;
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace('%lang%', 'es').replace('%theme%', '')
		});
	}

	event.locals.db = env.DB;

	try {
		const host = event.request.headers.get('host') || '';
		const appDomain = env.APP_DOMAIN || 'calendar.mx';
		if (env.TENANT_KV) {
			event.locals.tenant = await resolveTenant(host, appDomain, env.TENANT_KV, env.DB);
		} else {
			event.locals.tenant = null;
		}
	} catch (e) {
		console.error('Tenant resolution error:', e);
		event.locals.tenant = null;
	}

	try {
		const session = await getCurrentUser(event);
		event.locals.userId = session?.userId ?? null;
	} catch (e) {
		console.error('Auth error:', e);
		event.locals.userId = null;
	}

	const cookieLocale = event.cookies.get('locale');
	event.locals.locale = (cookieLocale === 'en' || cookieLocale === 'es')
		? cookieLocale
		: (event.locals.tenant?.locale === 'en' ? 'en' : 'es');

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html
				.replace('%lang%', event.locals.locale)
				.replace('%theme%', event.cookies.get('theme') === 'dark' ? 'dark' : '');
		}
	});

	return response;
};
