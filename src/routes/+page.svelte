<script lang="ts">
	import { t, tArray } from '$lib/i18n';
	import type { PageData } from './$types';

	export let data: PageData;
	$: locale = (data as any).locale || 'es';
	$: mode = (data as any).mode;
	$: tenant = (data as any).tenant;
	$: eventTypes = (data as any).eventTypes || [];
</script>

{#if mode === 'landing'}
	<!-- LANDING PAGE -->
	<main class="animate-fade-in">
		<!-- Hero -->
		<section class="relative overflow-hidden">
			<div class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-sky-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900"></div>
			<div class="relative max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
				<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
					{t(locale, 'landing.hero')}
				</h1>
				<p class="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
					{t(locale, 'landing.subtitle')}
				</p>
				<div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
					<a href="/signup?plan=free"
						class="px-8 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
						{t(locale, 'landing.ctaFree')}
					</a>
					<a href="/signup?plan=pro"
						class="px-8 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/25">
						{t(locale, 'landing.ctaPro')}
					</a>
				</div>
			</div>
		</section>

		<!-- Features -->
		<section class="max-w-6xl mx-auto px-4 py-20">
			<h2 class="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
				{t(locale, 'landing.features')}
			</h2>
			<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each [
					{ icon: '📅', title: t(locale, 'landing.featCalendar'), desc: t(locale, 'landing.featCalendarDesc'), gradient: 'from-emerald-500 to-teal-500' },
					{ icon: '⚡', title: t(locale, 'landing.featBooking'), desc: t(locale, 'landing.featBookingDesc'), gradient: 'from-sky-500 to-blue-500' },
					{ icon: '👥', title: t(locale, 'landing.featMultiUser'), desc: t(locale, 'landing.featMultiUserDesc'), gradient: 'from-violet-500 to-purple-500' },
					{ icon: '🎨', title: t(locale, 'landing.featBranding'), desc: t(locale, 'landing.featBrandingDesc'), gradient: 'from-rose-500 to-pink-500' },
				] as feat}
					<div class="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
						<div class="w-10 h-10 rounded-xl bg-gradient-to-br {feat.gradient} flex items-center justify-center text-white text-lg mb-4">
							{feat.icon}
						</div>
						<h3 class="font-semibold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">{feat.desc}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- Pricing -->
		<section class="max-w-4xl mx-auto px-4 py-20">
			<h2 class="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
				{t(locale, 'landing.pricing')}
			</h2>
			<div class="grid md:grid-cols-2 gap-8">
				<!-- Free -->
				<div class="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">{t(locale, 'landing.priceFreeTitle')}</h3>
					<p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">{t(locale, 'landing.priceFreePrice')}</p>
					<ul class="mt-6 space-y-3">
						{#each tArray(locale, 'landing.priceFreeFeatures') as feature}
							<li class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
								<svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
								{feature}
							</li>
						{/each}
					</ul>
					<a href="/signup?plan=free" class="mt-8 block text-center px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
						{t(locale, 'landing.ctaFree')}
					</a>
				</div>
				<!-- Pro -->
				<div class="p-8 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white relative overflow-hidden">
					<div class="absolute top-0 right-0 px-3 py-1 bg-white/20 rounded-bl-xl text-xs font-bold">PRO</div>
					<h3 class="text-xl font-bold">{t(locale, 'landing.priceProTitle')}</h3>
					<p class="text-3xl font-bold mt-2">{t(locale, 'landing.priceProPrice')}</p>
					<ul class="mt-6 space-y-3">
						{#each tArray(locale, 'landing.priceProFeatures') as feature}
							<li class="flex items-center gap-2 text-sm text-white/90">
								<svg class="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
								{feature}
							</li>
						{/each}
					</ul>
					<a href="/signup?plan=pro" class="mt-8 block text-center px-6 py-2.5 rounded-xl bg-white text-emerald-700 font-medium hover:bg-gray-100 transition-colors">
						{t(locale, 'landing.ctaPro')}
					</a>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer class="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-sm text-gray-500 dark:text-gray-500">
			<p>Calendar.mx &mdash; {locale === 'es' ? 'Agenda profesional' : 'Professional scheduling'}</p>
		</footer>
	</main>

{:else if mode === 'tenant'}
	<!-- TENANT PUBLIC PAGE -->
	<main class="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
		<div class="text-center mb-10">
			{#if tenant.logo_url}
				<img src={tenant.logo_url} alt={tenant.name} class="h-16 w-16 rounded-2xl object-cover mx-auto mb-4" />
			{/if}
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
			<p class="text-gray-500 dark:text-gray-400 mt-1">{t(locale, 'booking.selectDate')}</p>
		</div>

		{#if eventTypes.length === 0}
			<p class="text-center text-gray-500 dark:text-gray-400">{t(locale, 'dashboard.noBookings')}</p>
		{:else}
			<div class="grid sm:grid-cols-2 gap-4">
				{#each eventTypes as et}
					<a href="/{et.slug}"
						class="block p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all hover:border-emerald-300 dark:hover:border-emerald-700 group">
						<div class="flex items-start gap-3">
							<div class="w-2 h-10 rounded-full" style="background-color: {et.color || tenant.brand_color}"></div>
							<div class="flex-1">
								<h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{et.name}</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{et.duration} min</p>
								{#if et.description}
									<p class="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{et.description}</p>
								{/if}
							{#if et.host_name}
								<div class="flex items-center gap-2 mt-3">
									{#if et.host_image}
										<img src={et.host_image} alt="" class="w-5 h-5 rounded-full" />
									{/if}
									<span class="text-xs text-gray-500 dark:text-gray-500">{et.host_name}</span>
								</div>
							{/if}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>

{:else}
	<!-- USER HOME (logged in free user) -->
	<main class="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
		<div class="flex items-center justify-between mb-8">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">{t(locale, 'nav.eventTypes')}</h1>
			<a href="/dashboard" class="text-sm px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
				{t(locale, 'nav.dashboard')}
			</a>
		</div>
		{#if eventTypes.length === 0}
			<div class="text-center py-16">
				<p class="text-gray-500 dark:text-gray-400 mb-4">{t(locale, 'dashboard.noBookings')}</p>
				<a href="/dashboard/event-types/new" class="text-emerald-600 dark:text-emerald-400 hover:underline">{t(locale, 'dashboard.createEvent')}</a>
			</div>
		{:else}
			<div class="grid sm:grid-cols-2 gap-4">
				{#each eventTypes as et}
					<a href="/{et.slug}" class="block p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
						<div class="flex items-start gap-3">
							<div class="w-2 h-10 rounded-full" style="background-color: {et.color}"></div>
							<div>
								<h3 class="font-semibold text-gray-900 dark:text-white">{et.name}</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{et.duration} min</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>
{/if}
