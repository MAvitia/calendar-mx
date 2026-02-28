/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		interface Locals {
			tenant: import('$lib/server/tenant').TenantContext | null;
			userId: string | null;
			locale: 'en' | 'es';
			db: D1Database;
		}

		interface Platform {
			env?: {
				DB: D1Database;
				KV: KVNamespace;
				TENANT_KV: KVNamespace;
				GOOGLE_CLIENT_ID: string;
				GOOGLE_CLIENT_SECRET: string;
				MICROSOFT_CLIENT_ID?: string;
				MICROSOFT_CLIENT_SECRET?: string;
				JWT_SECRET: string;
				APP_URL: string;
				APP_DOMAIN: string;
				ADMIN_EMAIL?: string;
				EMAILIT_API_KEY?: string;
				EMAIL_FROM?: string;
				TURNSTILE_SECRET_KEY?: string;
				CRON_SECRET?: string;
				STRIPE_SECRET_KEY?: string;
				STRIPE_WEBHOOK_SECRET?: string;
				CF_API_TOKEN: string;
				CF_ACCOUNT_ID: string;
				CF_ZONE_ID: string;
			};
		}
	}
}

export {};
