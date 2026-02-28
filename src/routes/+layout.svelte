<script lang="ts">
	import '../app.css';
	import { t } from '$lib/i18n';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: locale = (data as any).locale || 'es';
	$: tenant = (data as any).tenant;
	$: theme = (data as any).theme || 'light';
	$: userId = (data as any).userId;

	function toggleTheme() {
		const next = theme === 'dark' ? 'light' : 'dark';
		document.cookie = `theme=${next};path=/;max-age=31536000`;
		document.documentElement.classList.toggle('dark', next === 'dark');
		theme = next;
	}

	function toggleLocale() {
		const next = locale === 'es' ? 'en' : 'es';
		document.cookie = `locale=${next};path=/;max-age=31536000`;
		locale = next;
		location.reload();
	}

	$: brandColor = tenant?.brand_color || '#10b981';
	$: brandSecondary = tenant?.brand_secondary || '#0ea5e9';
</script>

<svelte:head>
	<title>{tenant?.name || t(locale, 'common.appName')}</title>
	{#if tenant?.brand_color}
		<style>
			:root {
				--brand-500: {brandColor};
				--brand-600: {brandSecondary};
			}
		</style>
	{/if}
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
	<!-- Top Bar -->
	<nav class="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-14">
				<!-- Logo / Brand -->
				<a href="/" class="flex items-center gap-2">
					{#if tenant?.logo_url}
						<img src={tenant.logo_url} alt={tenant.name} class="h-8 w-8 rounded-lg object-cover" />
					{:else}
						<div class="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
							style="background: linear-gradient(135deg, {brandColor}, {brandSecondary})">
							C
						</div>
					{/if}
					<span class="font-semibold text-gray-900 dark:text-white text-sm">
						{tenant?.name || t(locale, 'common.appName')}
					</span>
				</a>

				<!-- Nav links -->
				<div class="flex items-center gap-3">
					{#if userId}
						<a href="/dashboard" class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
							{t(locale, 'nav.dashboard')}
						</a>
						<a href="/auth/logout" class="text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
							{t(locale, 'nav.logout')}
						</a>
					{:else}
						<a href="/auth/login" class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
							{t(locale, 'nav.login')}
						</a>
						<a href="/signup" class="text-sm px-3 py-1.5 rounded-lg text-white font-medium transition-colors"
							style="background-color: {brandColor}">
							{t(locale, 'nav.signup')}
						</a>
					{/if}

					<!-- Locale toggle -->
					<button on:click={toggleLocale}
						class="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors uppercase">
						{locale === 'es' ? 'EN' : 'ES'}
					</button>

					<!-- Theme toggle -->
					<button on:click={toggleTheme}
						class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
						aria-label="Toggle theme">
						{#if theme === 'dark'}
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
						{:else}
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
						{/if}
					</button>
				</div>
			</div>
		</div>
	</nav>

	<slot />
</div>
