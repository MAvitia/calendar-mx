/**
 * Microsoft Outlook Calendar API integration
 * Kept from CloudMeet — uses Microsoft Graph API directly for Workers compatibility
 */

export interface OutlookCalendarEvent {
	id: string;
	subject: string;
	start: { dateTime: string; timeZone: string };
	end: { dateTime: string; timeZone: string };
	webLink?: string;
	onlineMeeting?: { joinUrl: string };
}

export interface BusySlot {
	start: string;
	end: string;
}

export function getOutlookAuthUrl(clientId: string, redirectUri: string, state: string): string {
	const params = new URLSearchParams({
		client_id: clientId, response_type: 'code', redirect_uri: redirectUri,
		scope: 'offline_access Calendars.ReadWrite User.Read', state, response_mode: 'query'
	});
	return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeOutlookCode(
	code: string, clientId: string, clientSecret: string, redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
	const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: 'authorization_code' }).toString()
	});
	if (!response.ok) throw new Error(`Failed to exchange Outlook code: ${await response.text()}`);
	return response.json();
}

export async function refreshOutlookAccessToken(
	refreshToken: string, clientId: string, clientSecret: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
	const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }).toString()
	});
	if (!response.ok) throw new Error(`Failed to refresh Outlook token: ${await response.text()}`);
	return response.json();
}

export async function getOutlookBusyTimes(accessToken: string, startDate: Date, endDate: Date): Promise<BusySlot[]> {
	const response = await fetch(
		`https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(startDate.toISOString())}&endDateTime=${encodeURIComponent(endDate.toISOString())}&$select=start,end,showAs`,
		{ headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
	);
	if (!response.ok) throw new Error(`Failed to fetch Outlook busy times: ${await response.text()}`);

	const data = await response.json() as {
		value: Array<{ start: { dateTime: string; timeZone: string }; end: { dateTime: string; timeZone: string }; showAs: string }>;
	};
	return data.value
		.filter(e => e.showAs === 'busy' || e.showAs === 'tentative')
		.map(e => ({ start: new Date(e.start.dateTime + 'Z').toISOString(), end: new Date(e.end.dateTime + 'Z').toISOString() }));
}

export async function createOutlookCalendarEvent(
	accessToken: string,
	event: { summary: string; description?: string; startTime: string; endTime: string; attendeeEmail: string; hostEmail: string; createTeamsMeeting?: boolean }
): Promise<OutlookCalendarEvent> {
	const body: Record<string, unknown> = {
		subject: event.summary,
		body: { contentType: 'text', content: event.description || '' },
		start: { dateTime: event.startTime.replace('Z', ''), timeZone: 'UTC' },
		end: { dateTime: event.endTime.replace('Z', ''), timeZone: 'UTC' },
		attendees: [{ emailAddress: { address: event.attendeeEmail }, type: 'required' }]
	};
	if (event.createTeamsMeeting !== false) body.isOnlineMeeting = true;

	const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
		method: 'POST',
		headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!response.ok) throw new Error(`Failed to create Outlook calendar event: ${await response.text()}`);
	return response.json();
}

export async function cancelOutlookCalendarEvent(accessToken: string, eventId: string): Promise<void> {
	const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
		method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!response.ok && response.status !== 404) throw new Error(`Failed to cancel Outlook event: ${await response.text()}`);
}

export async function getValidOutlookAccessToken(
	db: D1Database, userId: string, clientId: string, clientSecret: string
): Promise<string> {
	const user = await db.prepare('SELECT outlook_refresh_token FROM users WHERE id = ?').bind(userId)
		.first<{ outlook_refresh_token: string | null }>();
	if (!user?.outlook_refresh_token) throw new Error('User not connected to Outlook Calendar');

	const tokens = await refreshOutlookAccessToken(user.outlook_refresh_token, clientId, clientSecret);
	if (tokens.refresh_token && tokens.refresh_token !== user.outlook_refresh_token) {
		await db.prepare('UPDATE users SET outlook_refresh_token = ? WHERE id = ?').bind(tokens.refresh_token, userId).run();
	}
	return tokens.access_token;
}
