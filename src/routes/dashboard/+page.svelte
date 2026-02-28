<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	export let data: PageData;

	$: locale = (data as any).locale || 'es';
	$: user = (data as any).user;
	$: tenant = (data as any).tenant;
	$: eventTypes = (data as any).eventTypes || [];
	$: recentBookings = (data as any).recentBookings || [];
	$: stats = (data as any).stats || { total_bookings: 0, unique_clients: 0 };
	$: teamMembers = (data as any).teamMembers || [];
	$: appUrl = (data as any).appUrl || '';
	$: brandColor = tenant?.brand_color || '#10b981';

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
			weekday: 'short', month: 'short', day: 'numeric'
		});
	}

	function formatTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleTimeString(locale === 'es' ? 'es-MX' : 'en-US', {
			hour: '2-digit', minute: '2-digit'
		});
	}
</script>

<main class="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
				{t(locale, 'dashboard.welcome')}, {user?.name?.split(' ')[0] || ''}
			</h1>
			{#if tenant}
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{tenant.name} &middot; {user?.role}</p>
			{/if}
		</div>
		<a href="/dashboard/event-types/new"
			class="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
			style="background-color: {brandColor}">
			+ {t(locale, 'dashboard.createEvent')}
		</a>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
			<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t(locale, 'dashboard.totalBookings')}</p>
			<p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_bookings}</p>
		</div>
		<div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
			<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t(locale, 'dashboard.newClients')}</p>
			<p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.unique_clients}</p>
		</div>
		<div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
			<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t(locale, 'nav.eventTypes')}</p>
			<p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{eventTypes.length}</p>
		</div>
		{#if tenant && teamMembers.length > 0}
			<div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
				<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t(locale, 'nav.team')}</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{teamMembers.length}</p>
			</div>
		{/if}
	</div>

	<div class="grid lg:grid-cols-3 gap-6">
		<!-- Upcoming Bookings -->
		<div class="lg:col-span-2">
			<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(locale, 'dashboard.upcomingBookings')}</h2>
			{#if recentBookings.length === 0}
				<div class="p-8 text-center rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
					<p class="text-gray-500 dark:text-gray-400">{t(locale, 'dashboard.noBookings')}</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each recentBookings as booking}
						<div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center gap-4">
							<div class="w-1.5 h-12 rounded-full" style="background-color: {booking.event_color || brandColor}"></div>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-gray-900 dark:text-white text-sm truncate">
									{booking.attendee_name}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{booking.event_type_name} &middot; {booking.duration_minutes}min
								</p>
							</div>
							<div class="text-right flex-shrink-0">
								<p class="text-sm font-medium text-gray-900 dark:text-white">{formatDate(booking.start_time)}</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">{formatTime(booking.start_time)}</p>
							</div>
							<span class="px-2 py-0.5 rounded-full text-xs font-medium {booking.status === 'confirmed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}">
								{booking.status}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Quick Actions -->
			<div>
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(locale, 'dashboard.quickActions')}</h2>
				<div class="space-y-2">
					<a href="/dashboard/event-types/new" class="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
						<div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">+</div>
						<span class="text-sm text-gray-700 dark:text-gray-300">{t(locale, 'dashboard.createEvent')}</span>
					</a>
					<a href="/dashboard/availability" class="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
						<div class="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 text-sm">&#x1F552;</div>
						<span class="text-sm text-gray-700 dark:text-gray-300">{t(locale, 'nav.availability')}</span>
					</a>
					<a href="/dashboard/calendars" class="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
						<div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm">&#x1F517;</div>
						<span class="text-sm text-gray-700 dark:text-gray-300">{t(locale, 'nav.calendars')}</span>
					</a>
					{#if tenant && (user?.role === 'owner' || user?.role === 'admin')}
						<a href="/dashboard/team" class="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
							<div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm">&#x1F465;</div>
							<span class="text-sm text-gray-700 dark:text-gray-300">{t(locale, 'dashboard.manageTeam')}</span>
						</a>
					{/if}
				</div>
			</div>

			<!-- Event Types -->
			<div>
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(locale, 'nav.eventTypes')}</h2>
				{#if eventTypes.length === 0}
					<p class="text-sm text-gray-500 dark:text-gray-400">{t(locale, 'dashboard.noBookings')}</p>
				{:else}
					<div class="space-y-2">
						{#each eventTypes as et}
							<a href="/dashboard/event-types/{et.id}"
								class="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
								<div class="w-2 h-8 rounded-full" style="background-color: {et.color}"></div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900 dark:text-white truncate">{et.name}</p>
									<p class="text-xs text-gray-500 dark:text-gray-400">{et.duration}min</p>
								</div>
								<span class="w-2 h-2 rounded-full {et.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}"></span>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Share Link -->
			<div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
				<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
					{locale === 'es' ? 'Tu enlace de reservas' : 'Your booking link'}
				</p>
				<div class="flex items-center gap-2">
					<code class="flex-1 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 truncate">
						{tenant ? `${tenant.subdomain}.calendar.mx` : `${appUrl}/${user?.slug || ''}`}
					</code>
				</div>
			</div>
		</div>
	</div>
</main>
