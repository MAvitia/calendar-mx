import { en, type TranslationKeys } from './en';
import { es } from './es';

export type Locale = 'en' | 'es';

const translations: Record<Locale, TranslationKeys> = { en, es };

export function t(locale: Locale, path: string): string {
	const keys = path.split('.');
	let current: unknown = translations[locale] || translations.es;
	for (const key of keys) {
		if (current && typeof current === 'object' && key in current) {
			current = (current as Record<string, unknown>)[key];
		} else {
			return path;
		}
	}
	return typeof current === 'string' ? current : path;
}

export function tArray(locale: Locale, path: string): readonly string[] {
	const keys = path.split('.');
	let current: unknown = translations[locale] || translations.es;
	for (const key of keys) {
		if (current && typeof current === 'object' && key in current) {
			current = (current as Record<string, unknown>)[key];
		} else {
			return [];
		}
	}
	return Array.isArray(current) ? current : [];
}

export { en, es };
export type { TranslationKeys };
