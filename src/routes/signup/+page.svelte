<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: any;

	$: locale = (data as any).locale || 'es';
	$: plan = form?.plan || (data as any).plan || 'free';

	let subdomain = '';
	let gymName = '';
</script>

<main class="max-w-lg mx-auto px-4 py-16 animate-fade-in">
	<h1 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
		{t(locale, 'auth.signupTitle')}
	</h1>
	<p class="text-center text-gray-500 dark:text-gray-400 mb-8">
		{t(locale, 'auth.chooseYourPlan')}
	</p>

	{#if form?.error}
		<div class="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
			{form.error}
		</div>
	{/if}

	<!-- Plan switcher -->
	<div class="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-8">
		<button
			class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all {plan === 'free' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}"
			on:click={() => plan = 'free'}>
			{t(locale, 'common.free')}
		</button>
		<button
			class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all {plan === 'pro' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}"
			on:click={() => plan = 'pro'}>
			{t(locale, 'common.pro')} — $19/mo
		</button>
	</div>

	<form method="POST" use:enhance>
		<input type="hidden" name="plan" value={plan} />

		{#if plan === 'pro'}
			<div class="space-y-4 mb-6">
				<div>
					<label for="gymName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
						{t(locale, 'tenant.gymName')}
					</label>
					<input type="text" id="gymName" name="gymName" bind:value={gymName} required
						class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
						placeholder="FitZone Gym" />
				</div>
				<div>
					<label for="subdomain" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
						{t(locale, 'tenant.subdomain')}
					</label>
					<div class="flex items-center">
						<input type="text" id="subdomain" name="subdomain" bind:value={subdomain} required
							pattern="[a-z0-9][a-z0-9-]*[a-z0-9]" minlength="3" maxlength="50"
							class="flex-1 rounded-l-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
							placeholder="fitzone" />
						<span class="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-xl text-sm text-gray-500 dark:text-gray-400">
							.calendar.mx
						</span>
					</div>
					{#if subdomain}
						<p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
							{t(locale, 'tenant.subdomainHelp').replace('{subdomain}', subdomain)}
						</p>
					{/if}
				</div>
			</div>
		{/if}

		<button type="submit"
			class="w-full py-3 rounded-xl font-semibold text-white transition-colors {plan === 'pro' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'}">
			{plan === 'pro' ? t(locale, 'auth.signupPro') : t(locale, 'auth.signupFree')}
		</button>
	</form>

	<p class="text-center text-sm text-gray-500 dark:text-gray-500 mt-6">
		{#if plan === 'free'}
			{locale === 'es' ? 'Inicia sesión con Google para empezar' : 'Sign in with Google to get started'}
		{:else}
			{locale === 'es' ? 'Serás redirigido a Stripe para completar el pago' : "You'll be redirected to Stripe to complete payment"}
		{/if}
	</p>
</main>
