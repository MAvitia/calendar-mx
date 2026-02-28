/**
 * Stripe webhook — handles checkout.session.completed to provision new pro tenants.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { constructWebhookEvent } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env;
	if (!env?.STRIPE_WEBHOOK_SECRET || !env?.DB) {
		throw error(500, 'Stripe not configured');
	}

	const payload = await request.text();
	const signature = request.headers.get('stripe-signature');
	if (!signature) throw error(400, 'Missing stripe-signature header');

	let event;
	try {
		event = await constructWebhookEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		throw error(400, 'Invalid signature');
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as Record<string, any>;
		const tenantName = session.metadata?.tenant_name;
		const subdomain = session.metadata?.subdomain;
		const customerEmail = session.customer_email || session.customer_details?.email;
		const customerId = session.customer;
		const subscriptionId = session.subscription;

		if (!tenantName || !subdomain) {
			console.error('Missing tenant metadata in checkout session');
			return json({ received: true });
		}

		const db = env.DB;
		const tenantId = crypto.randomUUID().replace(/-/g, '');
		const userId = crypto.randomUUID().replace(/-/g, '');
		const userSlug = customerEmail?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || subdomain;

		await db.batch([
			db.prepare(
				`INSERT INTO tenants (id, name, slug, subdomain, plan, stripe_customer_id, stripe_subscription_id, owner_user_id, is_active)
				 VALUES (?, ?, ?, ?, 'pro', ?, ?, ?, 1)`
			).bind(tenantId, tenantName, subdomain, subdomain, customerId, subscriptionId, userId),

			db.prepare(
				`INSERT INTO users (id, tenant_id, email, name, slug, role, plan)
				 VALUES (?, ?, ?, ?, ?, 'owner', 'pro')`
			).bind(userId, tenantId, customerEmail || '', tenantName, userSlug),
		]);

		if (env.TENANT_KV) {
			await env.TENANT_KV.put(`tenant:${subdomain}`, JSON.stringify({
				tenant_id: tenantId,
				name: tenantName,
				plan: 'pro',
			}));
		}

		if (env.CF_API_TOKEN && env.CF_ZONE_ID) {
			try {
				await fetch(`https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/dns_records`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${env.CF_API_TOKEN}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						type: 'CNAME',
						name: `${subdomain}.calendar.mx`,
						content: 'calendar-mx.pages.dev',
						proxied: true,
						ttl: 1,
					})
				});
			} catch (dnsErr) {
				console.error('DNS record creation failed:', dnsErr);
			}
		}

		console.log(`Tenant provisioned: ${tenantName} (${subdomain}.calendar.mx)`);
	}

	if (event.type === 'customer.subscription.deleted') {
		const subscription = event.data.object as Record<string, any>;
		const subscriptionId = subscription.id;

		await env.DB
			.prepare('UPDATE tenants SET is_active = 0, plan = \'free\' WHERE stripe_subscription_id = ?')
			.bind(subscriptionId)
			.run();
	}

	return json({ received: true });
};
