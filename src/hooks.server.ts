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
		return resolve(event);
	}

	event.locals.db = env.DB;

	const host = event.request.headers.get('host') || '';
	const appDomain = env.APP_DOMAIN || 'calendar.mx';

	const tenant = await resolveTenant(host, appDomain, env.TENANT_KV, env.DB);
	event.locals.tenant = tenant;

	const session = await getCurrentUser(event);
	event.locals.userId = session?.userId ?? null;

	const cookieLocale = event.cookies.get('locale');
	event.locals.locale = (cookieLocale === 'en' || cookieLocale === 'es')
		? cookieLocale
		: (tenant?.locale === 'en' ? 'en' : 'es');

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html
				.replace('%lang%', event.locals.locale)
				.replace('%theme%', event.cookies.get('theme') === 'dark' ? 'dark' : '');
		}
	});

	return response;
};
