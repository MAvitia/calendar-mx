<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	export let data: PageData;
	$: locale = (data as any).locale || 'es';
	$: googleConnected = (data as any).googleConnected;
	$: outlookConnected = (data as any).outlookConnected;
	$: outlookConfigured = (data as any).outlookConfigured;
	$: googleCalendars = (data as any).googleCalendars || [];
</script>

<main class="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
	<a href="/dashboard" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block">&larr; {t(locale, 'common.back')}</a>
	<h1 class="text-xl font-bold text-gray-900 dark:text-white mb-6">{t(locale, 'nav.calendars')}</h1>

	<div class="space-y-4">
		<!-- Google Calendar -->
		<div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
						<svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
					</div>
					<div>
						<p class="font-medium text-gray-900 dark:text-white">Google Calendar</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							{googleConnected
								? (locale === 'es' ? 'Conectado' : 'Connected')
								: (locale === 'es' ? 'No conectado' : 'Not connected')}
						</p>
					</div>
				</div>
				{#if googleConnected}
					<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
				{:else}
					<a href="/auth/login" class="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
						{locale === 'es' ? 'Conectar' : 'Connect'}
					</a>
				{/if}
			</div>
			{#if googleCalendars.length > 0}
				<div class="mt-4 space-y-1.5">
					{#each googleCalendars as cal}
						<div class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
							<span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
							{cal.summary}
							{#if cal.primary}<span class="text-xs text-gray-400">(primary)</span>{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Outlook Calendar -->
		{#if outlookConfigured}
			<div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
							<svg class="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
						</div>
						<div>
							<p class="font-medium text-gray-900 dark:text-white">Outlook Calendar</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{outlookConnected
									? (locale === 'es' ? 'Conectado' : 'Connected')
									: (locale === 'es' ? 'No conectado' : 'Not connected')}
							</p>
						</div>
					</div>
					{#if outlookConnected}
						<a href="/auth/outlook/disconnect" class="text-sm text-red-500 hover:text-red-700">
							{locale === 'es' ? 'Desconectar' : 'Disconnect'}
						</a>
					{:else}
						<a href="/auth/outlook" class="text-sm px-3 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors">
							{locale === 'es' ? 'Conectar' : 'Connect'}
						</a>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>
