<script lang="ts">
	import { t } from '$lib/i18n';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form: any;

	$: locale = (data as any).locale || 'es';
	$: et = (data as any).eventType;
</script>

<main class="max-w-xl mx-auto px-4 py-8 animate-fade-in">
	<a href="/dashboard" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block">&larr; {t(locale, 'common.back')}</a>
	<h1 class="text-xl font-bold text-gray-900 dark:text-white mb-6">{t(locale, 'common.edit')}: {et?.name}</h1>

	{#if form?.error}
		<div class="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm">
			{locale === 'es' ? 'Guardado exitosamente' : 'Saved successfully'}
		</div>
	{/if}

	{#if et}
		<form method="POST" action="?/update" use:enhance class="space-y-5">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.name')}</label>
				<input type="text" id="name" name="name" value={et.name} required
					class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" />
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="duration" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.duration')}</label>
					<select id="duration" name="duration" class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500">
						{#each [15, 30, 45, 60, 90] as d}
							<option value={d} selected={et.duration_minutes === d}>{d}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="buffer" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.buffer')}</label>
					<select id="buffer" name="buffer" class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500">
						{#each [0, 5, 10, 15, 30] as b}
							<option value={b} selected={et.buffer_minutes === b}>{b}</option>
						{/each}
					</select>
				</div>
			</div>

			<div>
				<label for="maxAttendees" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.maxAttendees')}</label>
				<input type="number" id="maxAttendees" name="maxAttendees" value={et.max_attendees || 1} min="1" max="100"
					class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" />
			</div>

			<div>
				<label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.description')}</label>
				<textarea id="description" name="description" rows="3"
					class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500">{et.description || ''}</textarea>
			</div>

			<div>
				<label for="locationType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.location')}</label>
				<select id="locationType" name="locationType" class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500">
					{#each [['google_meet', 'Google Meet'], ['zoom', 'Zoom'], ['in_person', locale === 'es' ? 'Presencial' : 'In Person'], ['phone', locale === 'es' ? 'Teléfono' : 'Phone']] as [val, label]}
						<option value={val} selected={et.location_type === val}>{label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
				<input type="color" id="color" name="color" value={et.color || '#10b981'} class="h-10 w-20 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer" />
			</div>

			<div class="flex items-center gap-3">
				<input type="checkbox" id="isActive" name="isActive" checked={et.is_active} class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
				<label for="isActive" class="text-sm text-gray-700 dark:text-gray-300">{t(locale, 'event.active')}</label>
			</div>

			<button type="submit" class="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
				{t(locale, 'common.save')}
			</button>
		</form>

		<form method="POST" action="?/delete" use:enhance class="mt-4">
			<button type="submit" class="w-full py-3 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
				on:click|preventDefault={(e) => { if (confirm(locale === 'es' ? '¿Eliminar este evento?' : 'Delete this event type?')) e.currentTarget.closest('form')?.submit(); }}>
				{t(locale, 'common.delete')}
			</button>
		</form>
	{/if}
</main>
