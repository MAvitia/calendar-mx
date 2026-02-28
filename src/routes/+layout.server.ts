import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	return {
		tenant: locals.tenant,
		userId: locals.userId,
		locale: locals.locale,
		theme: cookies.get('theme') || 'light',
	};
};
