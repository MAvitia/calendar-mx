<script lang="ts">
	import { t } from '$lib/i18n';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form: any;

	$: locale = (data as any).locale || 'es';

	let name = '';
	let slug = '';
	let autoSlug = true;

	$: if (autoSlug && name) {
		slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	}
</script>

<main class="max-w-xl mx-auto px-4 py-8 animate-fade-in">
	<a href="/dashboard" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block">&larr; {t(locale, 'common.back')}</a>
	<h1 class="text-xl font-bold text-gray-900 dark:text-white mb-6">{t(locale, 'dashboard.createEvent')}</h1>

	{#if form?.error}
		<div class="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">{form.error}</div>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<div>
			<label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.name')}</label>
			<input type="text" id="name" name="name" bind:value={name} required
				class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
				placeholder={locale === 'es' ? 'Clase de Yoga' : 'Yoga Class'} />
		</div>

		<div>
			<label for="slug" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug</label>
			<input type="text" id="slug" name="slug" bind:value={slug} on:input={() => autoSlug = false} required
				pattern="[a-z0-9][a-z0-9-]*[a-z0-9]" minlength="3"
				class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" />
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="duration" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.duration')}</label>
				<select id="duration" name="duration" class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500">
					<option value="15">15</option>
					<option value="30" selected>30</option>
					<option value="45">45</option>
					<option value="60">60</option>
					<option value="90">90</option>
				</select>
			</div>
			<div>
				<label for="buffer" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.buffer')}</label>
				<select id="buffer" name="buffer" class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500">
					<option value="0" selected>0</option>
					<option value="5">5</option>
					<option value="10">10</option>
					<option value="15">15</option>
					<option value="30">30</option>
				</select>
			</div>
		</div>

		<div>
			<label for="maxAttendees" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.maxAttendees')}</label>
			<input type="number" id="maxAttendees" name="maxAttendees" value="1" min="1" max="100"
				class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" />
		</div>

		<div>
			<label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.description')}</label>
			<textarea id="description" name="description" rows="3"
				class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"></textarea>
		</div>

		<div>
			<label for="locationType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'event.location')}</label>
			<select id="locationType" name="locationType" class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500">
				<option value="google_meet">Google Meet</option>
				<option value="zoom">Zoom</option>
				<option value="in_person">{locale === 'es' ? 'Presencial' : 'In Person'}</option>
				<option value="phone">{locale === 'es' ? 'Teléfono' : 'Phone'}</option>
			</select>
		</div>

		<div>
			<label for="color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
			<input type="color" id="color" name="color" value="#10b981" class="h-10 w-20 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer" />
		</div>

		<button type="submit" class="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
			{t(locale, 'common.save')}
		</button>
	</form>
</main>
