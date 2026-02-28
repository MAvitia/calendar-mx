/**
 * Signup page — handles both Free and Pro tier signup.
 * Free: Creates user directly → redirect to dashboard.
 * Pro: Creates Stripe checkout session → redirect to Stripe.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createCheckoutSession } from '$lib/server/stripe';
import { isValidSlug } from '$lib/server/validation';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (locals.userId) {
		throw redirect(302, '/dashboard');
	}
	return {
		plan: url.searchParams.get('plan') || 'free',
	};
};

export const actions: Actions = {
	default: async ({ request, platform, locals }) => {
		const env = platform?.env;
		if (!env?.DB) return { error: 'Platform not available' };

		const form = await request.formData();
		const plan = form.get('plan') as string;
		const subdomain = (form.get('subdomain') as string || '').toLowerCase().trim();
		const businessName = (form.get('businessName') as string || '').trim();

		if (plan === 'pro') {
			if (!subdomain || !isValidSlug(subdomain)) {
				return { error: 'Invalid subdomain. Use 3-50 lowercase letters, numbers, and hyphens.', plan };
			}
			if (!businessName) {
				return { error: 'Business name is required.', plan };
			}

			const existing = await env.DB.prepare('SELECT id FROM tenants WHERE subdomain = ?').bind(subdomain).first();
			if (existing) {
				return { error: 'This subdomain is already taken.', plan };
			}

			if (!env.STRIPE_SECRET_KEY) {
				return { error: 'Payment processing is not configured.', plan };
			}

			const appUrl = env.APP_URL || 'https://calendar.mx';
			const session = await createCheckoutSession(env.STRIPE_SECRET_KEY, {
				customerEmail: '',
				tenantName: businessName,
				subdomain,
				successUrl: `${appUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
				cancelUrl: `${appUrl}/signup?plan=pro`,
			});

			throw redirect(303, session.url);
		}

		throw redirect(302, '/auth/login');
	}
};
