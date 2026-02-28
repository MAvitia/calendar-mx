<script lang="ts">
	import { t } from '$lib/i18n';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form: any;

	$: locale = (data as any).locale || 'es';
	$: rules = (data as any).rules || [];
	$: days = (data as any).days || [];

	const daysEs = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

	let newDay = 1;
	let newStart = '09:00';
	let newEnd = '17:00';
</script>

<main class="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
	<a href="/dashboard" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block">&larr; {t(locale, 'common.back')}</a>
	<h1 class="text-xl font-bold text-gray-900 dark:text-white mb-6">{t(locale, 'nav.availability')}</h1>

	{#if form?.error}
		<div class="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">{form.error}</div>
	{/if}

	<!-- Add Rule -->
	<form method="POST" action="?/add" use:enhance class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-6">
		<div class="grid grid-cols-4 gap-3 items-end">
			<div>
				<label for="newDay" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{locale === 'es' ? 'Día' : 'Day'}</label>
				<select id="newDay" name="dayOfWeek" bind:value={newDay} class="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:ring-emerald-500">
					{#each (locale === 'es' ? daysEs : days) as day, i}
						<option value={i}>{day}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="newStart" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{locale === 'es' ? 'Inicio' : 'Start'}</label>
				<input type="time" id="newStart" name="startTime" bind:value={newStart} class="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:ring-emerald-500" />
			</div>
			<div>
				<label for="newEnd" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{locale === 'es' ? 'Fin' : 'End'}</label>
				<input type="time" id="newEnd" name="endTime" bind:value={newEnd} class="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:ring-emerald-500" />
			</div>
			<button type="submit" class="py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
				+
			</button>
		</div>
	</form>

	<!-- Existing Rules -->
	<div class="space-y-2">
		{#each rules as rule}
			<div class="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
				<div class="flex items-center gap-3">
					<span class="text-sm font-medium text-gray-900 dark:text-white w-24">
						{locale === 'es' ? daysEs[rule.day_of_week] : days[rule.day_of_week]}
					</span>
					<span class="text-sm text-gray-600 dark:text-gray-400">
						{rule.start_time} — {rule.end_time}
					</span>
				</div>
				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="ruleId" value={rule.id} />
					<button type="submit" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm">
						{t(locale, 'common.delete')}
					</button>
				</form>
			</div>
		{:else}
			<p class="text-center text-gray-500 dark:text-gray-400 py-8">
				{locale === 'es' ? 'Sin reglas de disponibilidad. Agrega tu horario.' : 'No availability rules. Add your schedule.'}
			</p>
		{/each}
	</div>
</main>
