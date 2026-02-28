/**
 * Availability API — multi-tenant version.
 * Returns available time slots for a given date and event type.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBusyTimes, getValidAccessToken } from '$lib/server/google-calendar';
import { getOutlookBusyTimes, getValidOutlookAccessToken } from '$lib/server/outlook-calendar';
import { tenantWhere } from '$lib/server/tenant';

export const GET: RequestHandler = async ({ url, platform, locals }) => {
	const env = platform?.env;
	if (!env) throw error(500, 'Platform env not available');

	const db = locals.db;
	const tenant = locals.tenant;
	const tw = tenantWhere(tenant);

	const eventSlug = url.searchParams.get('event');
	const dateStr = url.searchParams.get('date');
	const userId = url.searchParams.get('user');

	if (!eventSlug || !dateStr) throw error(400, 'Missing event or date parameter');

	const cacheKey = `availability:${tenant?.id || 'public'}:${eventSlug}:${dateStr}`;
	const cached = await env.KV.get(cacheKey);
	if (cached) return json(JSON.parse(cached));

	let targetUser;
	if (userId) {
		targetUser = await db
			.prepare(`SELECT id, timezone, settings, outlook_refresh_token FROM users WHERE id = ? ${tw.clause}`)
			.bind(userId, ...tw.binds)
			.first<{ id: string; timezone: string; settings: string | null; outlook_refresh_token: string | null }>();
	} else if (tenant) {
		targetUser = await db
			.prepare(`SELECT id, timezone, settings, outlook_refresh_token FROM users WHERE tenant_id = ? AND role IN ('owner', 'trainer') LIMIT 1`)
			.bind(tenant.id)
			.first<{ id: string; timezone: string; settings: string | null; outlook_refresh_token: string | null }>();
	} else {
		targetUser = await db
			.prepare('SELECT id, timezone, settings, outlook_refresh_token FROM users WHERE tenant_id IS NULL LIMIT 1')
			.first<{ id: string; timezone: string; settings: string | null; outlook_refresh_token: string | null }>();
	}

	if (!targetUser) throw error(404, 'User not found');

	const eventType = await db
		.prepare(`SELECT id, duration_minutes as duration, buffer_minutes as buffer, availability_calendars, max_attendees FROM event_types WHERE user_id = ? AND slug = ? AND is_active = 1 ${tw.clause}`)
		.bind(targetUser.id, eventSlug, ...tw.binds)
		.first<{ id: string; duration: number; buffer: number; availability_calendars: string; max_attendees: number }>();

	if (!eventType) throw error(404, 'Event type not found');

	const date = new Date(dateStr + 'T00:00:00Z');
	const dayOfWeek = date.getUTCDay();

	const rules = await db
		.prepare(
			`SELECT start_time, end_time FROM availability_rules
			 WHERE user_id = ? AND day_of_week = ? AND is_active = 1
			 AND (event_type_id IS NULL OR event_type_id = ?) ${tw.clause}
			 ORDER BY start_time`
		)
		.bind(targetUser.id, dayOfWeek, eventType.id, ...tw.binds)
		.all<{ start_time: string; end_time: string }>();

	if (!rules.results.length) {
		const result = { date: dateStr, slots: [] };
		await env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
		return json(result);
	}

	const override = await db
		.prepare(`SELECT available, start_time, end_time FROM availability_overrides WHERE user_id = ? AND date = ? ${tw.clause}`)
		.bind(targetUser.id, dateStr, ...tw.binds)
		.first<{ available: number; start_time: string | null; end_time: string | null }>();

	if (override && !override.available) {
		const result = { date: dateStr, slots: [] };
		await env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
		return json(result);
	}

	const startOfDay = new Date(dateStr + 'T00:00:00Z');
	const endOfDay = new Date(dateStr + 'T23:59:59Z');
	let busySlots: Array<{ start: string; end: string }> = [];

	try {
		const calendarSetting = eventType.availability_calendars || 'google';
		if (calendarSetting === 'google' || calendarSetting === 'both') {
			const accessToken = await getValidAccessToken(db, targetUser.id, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
			const googleBusy = await getBusyTimes(accessToken, startOfDay, endOfDay);
			busySlots.push(...googleBusy);
		}
		if ((calendarSetting === 'outlook' || calendarSetting === 'both') && targetUser.outlook_refresh_token && env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
			const outlookToken = await getValidOutlookAccessToken(db, targetUser.id, env.MICROSOFT_CLIENT_ID, env.MICROSOFT_CLIENT_SECRET);
			const outlookBusy = await getOutlookBusyTimes(outlookToken, startOfDay, endOfDay);
			busySlots.push(...outlookBusy);
		}
	} catch (err) {
		console.error('Calendar busy times error:', err);
	}

	const existingBookings = await db
		.prepare(
			`SELECT start_time, end_time, COUNT(*) as count FROM bookings
			 WHERE user_id = ? AND status = 'confirmed' AND date(start_time) = ? ${tw.clause}
			 GROUP BY start_time, end_time`
		)
		.bind(targetUser.id, dateStr, ...tw.binds)
		.all<{ start_time: string; end_time: string; count: number }>();

	const slots: string[] = [];
	const duration = eventType.duration;
	const buffer = eventType.buffer || 0;
	const maxAttendees = eventType.max_attendees || 1;

	const availRules = override?.start_time && override?.end_time
		? [{ start_time: override.start_time, end_time: override.end_time }]
		: rules.results;

	for (const rule of availRules) {
		const [startH, startM] = rule.start_time.split(':').map(Number);
		const [endH, endM] = rule.end_time.split(':').map(Number);

		let currentMinutes = startH * 60 + startM;
		const endMinutes = endH * 60 + endM;

		while (currentMinutes + duration <= endMinutes) {
			const slotStart = new Date(date);
			slotStart.setUTCHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);
			const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

			if (slotStart <= new Date()) {
				currentMinutes += duration + buffer;
				continue;
			}

			const isBusy = busySlots.some(busy =>
				new Date(busy.start) < slotEnd && new Date(busy.end) > slotStart
			);

			if (!isBusy) {
				const bookingCount = existingBookings.results.find(b =>
					b.start_time === slotStart.toISOString()
				)?.count || 0;

				if (bookingCount < maxAttendees) {
					slots.push(slotStart.toISOString());
				}
			}

			currentMinutes += duration + buffer;
		}
	}

	const result = { date: dateStr, slots };
	await env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
	return json(result);
};
