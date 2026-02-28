/**
 * Bookings API — multi-tenant version.
 * Creates bookings scoped to the current tenant (or public if no tenant).
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCalendarEvent, getValidAccessToken } from '$lib/server/google-calendar';
import { createOutlookCalendarEvent, getValidOutlookAccessToken } from '$lib/server/outlook-calendar';
import { isValidEmail, validateLength, validateFields, MAX_LENGTHS } from '$lib/server/validation';
import { tenantWhere } from '$lib/server/tenant';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const env = platform?.env;
	if (!env) throw error(500, 'Platform env not available');

	const db = locals.db;
	const tenant = locals.tenant;
	const tw = tenantWhere(tenant);

	try {
		const body = await request.json() as {
			eventSlug: string; startTime: string; endTime: string;
			attendeeName: string; attendeeEmail: string; notes?: string;
			turnstileToken?: string; timezone?: string; userId?: string;
		};

		const { eventSlug, startTime, endTime, attendeeName, attendeeEmail, notes, turnstileToken, timezone } = body;

		if (!eventSlug || !startTime || !endTime || !attendeeName || !attendeeEmail) {
			throw error(400, 'Missing required fields');
		}
		const lengthError = validateFields([
			validateLength(attendeeName, 'Name', MAX_LENGTHS.name, true),
			validateLength(attendeeEmail, 'Email', MAX_LENGTHS.email, true),
			validateLength(notes, 'Notes', MAX_LENGTHS.notes, false)
		]);
		if (lengthError) throw error(400, lengthError);
		if (!isValidEmail(attendeeEmail)) throw error(400, 'Invalid email address');

		if (turnstileToken && env.TURNSTILE_SECRET_KEY) {
			const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: turnstileToken })
			});
			const turnstileResult = await turnstileRes.json() as { success: boolean };
			if (!turnstileResult.success) throw error(400, 'Turnstile verification failed');
		}

		let targetUserId = body.userId;
		let user: { id: string; email: string; name: string; slug: string; contact_email: string | null; settings: string | null; brand_color: string | null; outlook_refresh_token: string | null } | null;

		if (targetUserId) {
			user = await db
				.prepare(`SELECT id, email, name, slug, contact_email, settings, brand_color, outlook_refresh_token FROM users WHERE id = ? ${tw.clause}`)
				.bind(targetUserId, ...tw.binds)
				.first();
		} else if (tenant) {
			user = await db
				.prepare(`SELECT id, email, name, slug, contact_email, settings, brand_color, outlook_refresh_token FROM users WHERE tenant_id = ? AND role IN ('owner', 'trainer') LIMIT 1`)
				.bind(tenant.id)
				.first();
		} else {
			user = await db
				.prepare('SELECT id, email, name, slug, contact_email, settings, brand_color, outlook_refresh_token FROM users WHERE tenant_id IS NULL LIMIT 1')
				.first();
		}

		if (!user) throw error(404, 'User not found');

		const eventType = await db
			.prepare(`SELECT id, name, duration_minutes as duration, description, invite_calendar, max_attendees FROM event_types WHERE user_id = ? AND slug = ? AND is_active = 1 ${tw.clause}`)
			.bind(user.id, eventSlug, ...tw.binds)
			.first<{ id: string; name: string; duration: number; description: string; invite_calendar: string | null; max_attendees: number }>();

		if (!eventType) throw error(404, 'Event type not found');

		const conflict = await db
			.prepare(
				`SELECT COUNT(*) as count FROM bookings
				 WHERE user_id = ? AND event_type_id = ? AND status = 'confirmed'
				 AND start_time = ? ${tw.clause}`
			)
			.bind(user.id, eventType.id, startTime, ...tw.binds)
			.first<{ count: number }>();

		if (conflict && conflict.count >= eventType.max_attendees) {
			throw error(409, 'This time slot is full');
		}

		let userSettings: { defaultInviteCalendar?: string } = {};
		try { userSettings = user.settings ? JSON.parse(user.settings) : {}; } catch { /* noop */ }

		const outlookConnected = !!user.outlook_refresh_token;
		let inviteCalendar = eventType.invite_calendar || userSettings.defaultInviteCalendar || 'google';
		if (inviteCalendar === 'outlook' && !outlookConnected) inviteCalendar = 'google';

		const startDateTime = new Date(startTime);
		const endDateTime = new Date(endTime);
		let googleEventId: string | null = null;
		let outlookEventId: string | null = null;
		let meetingUrl: string | null = null;

		if (inviteCalendar === 'google') {
			try {
				const accessToken = await getValidAccessToken(db, user.id, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
				const calEvent = await createCalendarEvent(accessToken, {
					summary: `${eventType.name} — ${attendeeName}`,
					description: `${eventType.description || ''}\n\nAttendee: ${attendeeName} (${attendeeEmail})${notes ? `\nNotes: ${notes}` : ''}`,
					start: { dateTime: startDateTime.toISOString(), timeZone: 'UTC' },
					end: { dateTime: endDateTime.toISOString(), timeZone: 'UTC' },
					attendees: [{ email: attendeeEmail }],
					conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } }
				});
				googleEventId = calEvent.id;
				meetingUrl = calEvent.hangoutLink || null;
			} catch (err) { console.error('Google Calendar error:', err); }
		} else if (inviteCalendar === 'outlook' && env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
			try {
				const outlookToken = await getValidOutlookAccessToken(db, user.id, env.MICROSOFT_CLIENT_ID, env.MICROSOFT_CLIENT_SECRET);
				const outlookEvent = await createOutlookCalendarEvent(outlookToken, {
					summary: `${eventType.name} — ${attendeeName}`,
					description: `${eventType.description || ''}\n\nAttendee: ${attendeeName} (${attendeeEmail})`,
					startTime: startDateTime.toISOString(), endTime: endDateTime.toISOString(),
					attendeeEmail, hostEmail: user.email, createTeamsMeeting: true
				});
				outlookEventId = outlookEvent.id;
				meetingUrl = outlookEvent.onlineMeeting?.joinUrl || null;
			} catch (err) { console.error('Outlook Calendar error:', err); }
		}

		const tenantIdValue = tenant?.id || null;
		const result = await db
			.prepare(
				`INSERT INTO bookings (tenant_id, user_id, event_type_id, start_time, end_time,
				 attendee_name, attendee_email, attendee_notes, status, google_event_id, outlook_event_id, meeting_url, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, CURRENT_TIMESTAMP)`
			)
			.bind(tenantIdValue, user.id, eventType.id, startTime, endTime,
				attendeeName, attendeeEmail, notes || null, googleEventId, outlookEventId, meetingUrl)
			.run();

		const dateStr = startDateTime.toISOString().split('T')[0];
		await env.KV.delete(`availability:${eventSlug}:${dateStr}`);

		return json({
			success: true,
			bookingId: result.meta.last_row_id,
			meetingUrl,
			meetingType: inviteCalendar === 'outlook' ? 'teams' : 'google_meet'
		});
	} catch (err: any) {
		if (err?.status) throw err;
		console.error('Booking error:', err);
		throw error(500, 'Failed to create booking');
	}
};
