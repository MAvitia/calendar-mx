/**
 * Profile API — update user profile (name, image, brand color, settings).
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

export const PUT: RequestHandler = async (event) => {
	const session = await requireAuth(event);
	const db = event.locals.db;

	const body = await event.request.json() as {
		name?: string;
		brand_color?: string;
		contact_email?: string;
		timezone?: string;
		settings?: Record<string, unknown>;
	};

	const updates: string[] = [];
	const values: unknown[] = [];

	if (body.name) { updates.push('name = ?'); values.push(body.name); }
	if (body.brand_color) { updates.push('brand_color = ?'); values.push(body.brand_color); }
	if (body.contact_email !== undefined) { updates.push('contact_email = ?'); values.push(body.contact_email || null); }
	if (body.timezone) { updates.push('timezone = ?'); values.push(body.timezone); }
	if (body.settings) { updates.push('settings = ?'); values.push(JSON.stringify(body.settings)); }

	if (updates.length === 0) return json({ success: true });

	await db
		.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
		.bind(...values, session.userId)
		.run();

	return json({ success: true });
};
