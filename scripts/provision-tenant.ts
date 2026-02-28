/**
 * Tenant provisioning script — creates:
 * 1. Tenant record in shared D1
 * 2. KV entry mapping subdomain → tenant_id
 * 3. DNS CNAME record for subdomain.calendar.mx
 *
 * Usage: npx tsx scripts/provision-tenant.ts --name "Acme Corp" --subdomain "acme" --email "owner@acme.com"
 *
 * Requires env vars: CF_API_TOKEN, CF_ACCOUNT_ID, CF_ZONE_ID, D1_DATABASE_ID, TENANT_KV_ID
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

interface ProvisionArgs {
	name: string;
	subdomain: string;
	email: string;
	plan?: string;
	brandColor?: string;
}

function parseArgs(): ProvisionArgs {
	const args = process.argv.slice(2);
	const parsed: Record<string, string> = {};
	for (let i = 0; i < args.length; i += 2) {
		const key = args[i].replace(/^--/, '');
		parsed[key] = args[i + 1];
	}

	if (!parsed.name || !parsed.subdomain || !parsed.email) {
		console.error('Usage: npx tsx scripts/provision-tenant.ts --name "Acme Corp" --subdomain "acme" --email "owner@acme.com"');
		process.exit(1);
	}

	return {
		name: parsed.name,
		subdomain: parsed.subdomain.toLowerCase(),
		email: parsed.email,
		plan: parsed.plan || 'pro',
		brandColor: parsed.brandColor || '#10b981',
	};
}

async function cfFetch(path: string, token: string, options: RequestInit = {}) {
	const res = await fetch(`${CF_API}${path}`, {
		...options,
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
			...options.headers,
		},
	});
	const data = await res.json() as { success: boolean; errors: Array<{ message: string }>; result: unknown };
	if (!data.success) {
		throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(', ')}`);
	}
	return data.result;
}

async function main() {
	const args = parseArgs();
	const token = process.env.CF_API_TOKEN!;
	const accountId = process.env.CF_ACCOUNT_ID!;
	const zoneId = process.env.CF_ZONE_ID!;
	const d1Id = process.env.D1_DATABASE_ID!;
	const kvId = process.env.TENANT_KV_ID!;

	if (!token || !accountId || !zoneId) {
		console.error('Missing env vars: CF_API_TOKEN, CF_ACCOUNT_ID, CF_ZONE_ID, D1_DATABASE_ID, TENANT_KV_ID');
		process.exit(1);
	}

	console.log(`\nProvisioning tenant: ${args.name} (${args.subdomain}.calendar.mx)\n`);

	// 1. Create tenant record in D1 via REST API
	const tenantId = crypto.randomUUID().replace(/-/g, '');
	const slug = args.subdomain;

	console.log('1. Creating tenant record in D1...');
	await cfFetch(`/accounts/${accountId}/d1/database/${d1Id}/query`, token, {
		method: 'POST',
		body: JSON.stringify({
			sql: `INSERT INTO tenants (id, name, slug, subdomain, plan, brand_color, owner_user_id, is_active)
			      VALUES (?, ?, ?, ?, ?, ?, NULL, 1)`,
			params: [tenantId, args.name, slug, args.subdomain, args.plan, args.brandColor]
		})
	});
	console.log(`   Tenant ID: ${tenantId}`);

	// 2. Create KV entry: tenant:{subdomain} → { tenant_id, name, plan }
	console.log('2. Creating KV mapping...');
	const kvValue = JSON.stringify({ tenant_id: tenantId, name: args.name, plan: args.plan });
	await cfFetch(`/accounts/${accountId}/storage/kv/namespaces/${kvId}/values/tenant:${args.subdomain}`, token, {
		method: 'PUT',
		headers: { 'Content-Type': 'text/plain' },
		body: kvValue
	});
	console.log(`   KV key: tenant:${args.subdomain}`);

	// 3. Create DNS CNAME record: subdomain.calendar.mx → calendar-mx.pages.dev
	console.log('3. Creating DNS record...');
	try {
		await cfFetch(`/zones/${zoneId}/dns_records`, token, {
			method: 'POST',
			body: JSON.stringify({
				type: 'CNAME',
				name: `${args.subdomain}.calendar.mx`,
				content: 'calendar-mx.pages.dev',
				proxied: true,
				ttl: 1 // Auto
			})
		});
		console.log(`   DNS: ${args.subdomain}.calendar.mx → calendar-mx.pages.dev`);
	} catch (e: any) {
		if (e.message.includes('already exists')) {
			console.log('   DNS record already exists, skipping.');
		} else {
			throw e;
		}
	}

	// 4. Create owner user in D1 (linked to tenant)
	console.log('4. Creating owner user...');
	const userId = crypto.randomUUID().replace(/-/g, '');
	const userSlug = args.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
	await cfFetch(`/accounts/${accountId}/d1/database/${d1Id}/query`, token, {
		method: 'POST',
		body: JSON.stringify({
			sql: `INSERT INTO users (id, tenant_id, email, name, slug, role, plan)
			      VALUES (?, ?, ?, ?, ?, 'owner', 'pro')`,
			params: [userId, tenantId, args.email, args.name, userSlug]
		})
	});

	// Update tenant owner
	await cfFetch(`/accounts/${accountId}/d1/database/${d1Id}/query`, token, {
		method: 'POST',
		body: JSON.stringify({
			sql: `UPDATE tenants SET owner_user_id = ? WHERE id = ?`,
			params: [userId, tenantId]
		})
	});

	console.log(`   User ID: ${userId} (owner)`);

	console.log('\n--- Provisioning complete ---');
	console.log(`URL: https://${args.subdomain}.calendar.mx`);
	console.log(`Tenant ID: ${tenantId}`);
	console.log(`Owner User ID: ${userId}`);
}

main().catch(err => {
	console.error('Provisioning failed:', err);
	process.exit(1);
});
