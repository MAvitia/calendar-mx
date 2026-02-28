/**
 * Email service — re-exports from modular email module (kept from CloudMeet)
 */

export {
	type BookingEmailData,
	type RescheduleEmailData,
	type EmailTemplate,
	type EmailTemplateType,
	createEmailFormatters,
	replaceSubjectVariables,
	generateBookingEmail,
	generateBookingEmailText,
	generateCancellationEmail,
	generateAdminCancellationEmail,
	generateRescheduleEmail,
	generateAdminRescheduleEmail,
	generateReminderEmail,
	getDefaultReminderSubject,
	generateAdminNotificationEmail,
	sendBookingEmail,
	sendCancellationEmail,
	sendRescheduleEmail,
	sendReminderEmail,
	sendAdminNotificationEmail,
	sendAdminCancellationNotification,
	sendAdminRescheduleNotification,
	getEmailTemplates,
	isEmailEnabled
} from './email/index';
