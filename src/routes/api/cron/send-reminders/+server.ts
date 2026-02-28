/**
 * Cron endpoint — processes scheduled reminder emails.
 * Called by Cloudflare Workers cron every 5 minutes.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	const env = platform?.env;
	if (!env) throw error(500, 'Platform env not available');

	const secret = url.searchParams.get('secret');
	if (!secret || secret !== env.CRON_SECRET) {
		throw error(403, 'Invalid cron secret');
	}

	const db = env.DB;
	const now = new Date().toISOString();

	const pendingEmails = await db
		.prepare(
			`SELECT se.id, se.booking_id, se.template_type, se.tenant_id,
			        b.attendee_name, b.attendee_email, b.start_time, b.end_time, b.meeting_url,
			        et.name as event_type_name, et.duration_minutes,
			        u.name as host_name, u.email as host_email, u.brand_color, u.settings, u.contact_email
			 FROM scheduled_emails se
			 JOIN bookings b ON se.booking_id = b.id
			 JOIN event_types et ON b.event_type_id = et.id
			 JOIN users u ON b.user_id = u.id
			 WHERE se.status = 'pending' AND se.scheduled_for <= ? AND b.status = 'confirmed'
			 LIMIT 50`
		)
		.bind(now)
		.all();

	let sent = 0;
	let failed = 0;

	for (const email of pendingEmails.results as any[]) {
		try {
			if (env.EMAILIT_API_KEY) {
				const { sendReminderEmail, getEmailTemplates } = await import('$lib/server/email');
				const templates = await getEmailTemplates(db, email.host_email);
				const template = templates.get(email.template_type);

				let timeFormat: '12h' | '24h' = '12h';
				try {
					const settings = email.settings ? JSON.parse(email.settings) : {};
					timeFormat = settings.timeFormat === '24h' ? '24h' : '12h';
				} catch { /* noop */ }

				await sendReminderEmail(
					{
						attendeeName: email.attendee_name,
						attendeeEmail: email.attendee_email,
						eventName: email.event_type_name,
						startTime: new Date(email.start_time),
						endTime: new Date(email.end_time),
						meetingUrl: email.meeting_url,
						bookingId: email.booking_id,
						hostName: email.host_name,
						hostEmail: email.host_email,
						appUrl: env.APP_URL || '',
						timeFormat,
						timezone: 'UTC',
						brandColor: email.brand_color,
						templateType: email.template_type,
						customMessage: template?.custom_message,
					},
					{
						apiKey: env.EMAILIT_API_KEY,
						from: env.EMAIL_FROM || email.host_email,
						replyTo: email.contact_email || email.host_email,
					},
					template?.subject
				);
			}

			await db.prepare("UPDATE scheduled_emails SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?")
				.bind(email.id).run();
			sent++;
		} catch (err) {
			console.error(`Failed to send reminder ${email.id}:`, err);
			await db.prepare("UPDATE scheduled_emails SET status = 'failed', error_message = ? WHERE id = ?")
				.bind(err instanceof Error ? err.message : 'Unknown error', email.id).run();
			failed++;
		}
	}

	return json({ processed: pendingEmails.results.length, sent, failed });
};
