import type { LayoutLoad } from './$types';

export const prerender = false;
export const ssr = true;

export const load: LayoutLoad = async () => {
	return { timestamp: Date.now() };
};
