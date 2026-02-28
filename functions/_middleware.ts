import type { PagesFunction } from '@cloudflare/workers-types';

/**
 * Cloudflare Pages middleware — tenant detection + security headers + caching.
 * Checks Host header: subdomain.calendar.mx → pro tenant, calendar.mx → free tier.
 * Stores resolved tenant in request headers for SvelteKit hooks to read.
 */
export const onRequest: PagesFunction = async (context) => {
	const { request, next, env } = context;
	const url = new URL(request.url);
	const host = request.headers.get('host') || '';
	const path = url.pathname;

	const appDomain = (env as any).APP_DOMAIN || 'calendar.mx';
	const normalizedHost = host.replace(/:\d+$/, '').toLowerCase();
	let subdomain: string | null = null;

	if (normalizedHost !== appDomain && normalizedHost !== `www.${appDomain}`) {
		if (normalizedHost.endsWith(`.${appDomain}`)) {
			subdomain = normalizedHost.replace(`.${appDomain}`, '');
		}
	}

	const response = await next();
	const headers = new Headers(response.headers);

	headers.set('X-Frame-Options', 'DENY');
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	if (subdomain) {
		headers.set('X-Tenant-Subdomain', subdomain);
	}

	if (path.startsWith('/api/availability')) {
		headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
		headers.set('CDN-Cache-Control', 'max-age=300');
	} else if (path.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
		headers.set('Cache-Control', 'public, max-age=31536000, immutable');
		headers.set('CDN-Cache-Control', 'max-age=31536000');
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
};
