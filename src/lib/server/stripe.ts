/**
 * Stripe integration for Pro tier checkout & subscription management.
 * Uses Stripe's REST API directly (no Node SDK) for Workers compatibility.
 */

const STRIPE_API = 'https://api.stripe.com/v1';

interface StripeHeaders {
	Authorization: string;
	'Content-Type': string;
}

function headers(apiKey: string): StripeHeaders {
	return {
		Authorization: `Bearer ${apiKey}`,
		'Content-Type': 'application/x-www-form-urlencoded'
	};
}

export async function createCheckoutSession(
	apiKey: string,
	params: {
		customerEmail: string;
		tenantName: string;
		subdomain: string;
		successUrl: string;
		cancelUrl: string;
		priceId?: string;
	}
): Promise<{ id: string; url: string }> {
	const body = new URLSearchParams({
		'mode': 'subscription',
		'customer_email': params.customerEmail,
		'success_url': params.successUrl,
		'cancel_url': params.cancelUrl,
		'line_items[0][quantity]': '1',
		'metadata[tenant_name]': params.tenantName,
		'metadata[subdomain]': params.subdomain,
	});

	if (params.priceId) {
		body.set('line_items[0][price]', params.priceId);
	} else {
		body.set('line_items[0][price_data][currency]', 'usd');
		body.set('line_items[0][price_data][unit_amount]', '1900');
		body.set('line_items[0][price_data][recurring][interval]', 'month');
		body.set('line_items[0][price_data][product_data][name]', 'Calendar.mx Pro');
		body.set('line_items[0][price_data][product_data][description]', `Pro plan for ${params.tenantName}`);
	}

	const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
		method: 'POST',
		headers: headers(apiKey),
		body: body.toString()
	});

	if (!response.ok) {
		throw new Error(`Stripe checkout error: ${await response.text()}`);
	}

	return response.json() as Promise<{ id: string; url: string }>;
}

export async function constructWebhookEvent(
	payload: string,
	signature: string,
	secret: string
): Promise<{ type: string; data: { object: Record<string, unknown> } }> {
	const parts = signature.split(',').reduce((acc, part) => {
		const [key, value] = part.split('=');
		acc[key] = value;
		return acc;
	}, {} as Record<string, string>);

	const timestamp = parts['t'];
	const expectedSig = parts['v1'];

	const signedPayload = `${timestamp}.${payload}`;
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
	const computedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

	if (computedSig !== expectedSig) {
		throw new Error('Invalid webhook signature');
	}

	return JSON.parse(payload);
}
