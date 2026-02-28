/**
 * Cron trigger worker — calls the reminder endpoint every 5 minutes.
 */
export default {
	async scheduled(event, env) {
		const appUrl = env.APP_URL || 'https://calendar.mx';
		const secret = env.CRON_SECRET;
		if (!secret) return;

		try {
			const response = await fetch(`${appUrl}/api/cron/send-reminders?secret=${secret}`);
			const result = await response.json();
			console.log('Cron reminders:', result);
		} catch (err) {
			console.error('Cron error:', err);
		}
	}
};
