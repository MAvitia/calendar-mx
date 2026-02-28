/**
 * Input validation utilities — kept from CloudMeet
 */

import validator from 'validator';

export const MAX_LENGTHS = {
	name: 100,
	email: 254,
	description: 5000,
	notes: 1000,
	slug: 50
} as const;

export function isValidEmail(email: string): boolean {
	if (!email || typeof email !== 'string') return false;
	if (email.length > MAX_LENGTHS.email) return false;
	return validator.isEmail(email, { allow_display_name: false, require_tld: true, allow_ip_domain: false });
}

export function validateLength(
	value: string | null | undefined, fieldName: string, maxLength: number, required: boolean = false
): string | null {
	if (!value || value.trim().length === 0) {
		return required ? `${fieldName} is required` : null;
	}
	if (value.length > maxLength) return `${fieldName} must be ${maxLength} characters or less`;
	return null;
}

export function validateFields(validations: (string | null)[]): string | null {
	for (const error of validations) {
		if (error) return error;
	}
	return null;
}

export function isValidSlug(slug: string): boolean {
	return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}
