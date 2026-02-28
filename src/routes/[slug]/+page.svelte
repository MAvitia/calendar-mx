<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	export let data: PageData;

	$: locale = (data as any).locale || 'es';
	$: eventType = (data as any).eventType;
	$: user = (data as any).user;
	$: tenant = (data as any).tenant;
	$: brandColor = tenant?.brand_color || user?.brandColor || '#10b981';

	let selectedDate = '';
	let availableSlots: string[] = [];
	let selectedSlot = '';
	let loadingSlots = false;
	let booking = false;
	let bookingSuccess = false;
	let bookingError = '';

	let attendeeName = '';
	let attendeeEmail = '';
	let notes = '';

	$: today = new Date().toISOString().split('T')[0];

	async function loadSlots() {
		if (!selectedDate) return;
		loadingSlots = true;
		try {
			const params = new URLSearchParams({
				event: eventType.slug,
				date: selectedDate,
				...(user?.id ? { user: user.id } : {}),
			});
			const res = await fetch(`/api/availability?${params}`);
			const data = await res.json();
			availableSlots = data.slots || [];
			selectedSlot = '';
		} catch (err) {
			availableSlots = [];
		} finally {
			loadingSlots = false;
		}
	}

	async function submitBooking() {
		if (!selectedSlot || !attendeeName || !attendeeEmail) return;
		booking = true;
		bookingError = '';

		try {
			const endTime = new Date(new Date(selectedSlot).getTime() + eventType.duration * 60000).toISOString();
			const res = await fetch('/api/bookings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					eventSlug: eventType.slug,
					startTime: selectedSlot,
					endTime,
					attendeeName,
					attendeeEmail,
					notes: notes || undefined,
					userId: user?.id,
				})
			});

			if (!res.ok) {
				const err = await res.json();
				bookingError = err.message || 'Booking failed';
				return;
			}

			bookingSuccess = true;
		} catch (err) {
			bookingError = 'Network error';
		} finally {
			booking = false;
		}
	}

	function formatSlot(iso: string): string {
		return new Date(iso).toLocaleTimeString(locale === 'es' ? 'es-MX' : 'en-US', {
			hour: '2-digit', minute: '2-digit'
		});
	}
</script>

<main class="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
	{#if bookingSuccess}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">{t(locale, 'booking.confirmed')}</h1>
			<p class="text-gray-500 dark:text-gray-400 mt-2">{t(locale, 'booking.confirmedMsg')}</p>
			<a href="/" class="mt-6 inline-block text-sm text-emerald-600 dark:text-emerald-400 hover:underline">{t(locale, 'common.back')}</a>
		</div>
	{:else}
		<!-- Event header -->
		<div class="flex items-start gap-4 mb-8">
			{#if user?.profileImage}
				<img src={user.profileImage} alt="" class="w-12 h-12 rounded-xl object-cover" />
			{:else}
				<div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
					style="background-color: {brandColor}">
					{user?.name?.charAt(0) || 'C'}
				</div>
			{/if}
			<div>
				<p class="text-sm text-gray-500 dark:text-gray-400">{user?.name}</p>
				<h1 class="text-xl font-bold text-gray-900 dark:text-white">{eventType.name}</h1>
				<div class="flex items-center gap-3 mt-1">
					<span class="text-sm text-gray-500 dark:text-gray-400">
						{eventType.duration} min
					</span>
					{#if eventType.max_attendees > 1}
						<span class="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
							{locale === 'es' ? 'Evento grupal' : 'Group event'}
						</span>
					{/if}
				</div>
			</div>
		</div>

		{#if eventType.description}
			<p class="text-sm text-gray-600 dark:text-gray-400 mb-6">{eventType.description}</p>
		{/if}

		<!-- Date picker -->
		<div class="mb-6">
			<label for="date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				{t(locale, 'booking.selectDate')}
			</label>
			<input type="date" id="date" bind:value={selectedDate} on:change={loadSlots}
				min={today}
				class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" />
		</div>

		<!-- Time slots -->
		{#if selectedDate}
			<div class="mb-6">
				<p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t(locale, 'booking.selectTime')}</p>
				{#if loadingSlots}
					<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
						<div class="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
						{t(locale, 'common.loading')}
					</div>
				{:else if availableSlots.length === 0}
					<p class="text-sm text-gray-500 dark:text-gray-400">{t(locale, 'booking.noSlots')}</p>
				{:else}
					<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
						{#each availableSlots as slot}
							<button
								class="py-2.5 rounded-xl text-sm font-medium border transition-all {selectedSlot === slot
									? 'text-white shadow-md'
									: 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}"
								style={selectedSlot === slot ? `background-color: ${brandColor}; border-color: ${brandColor}` : ''}
								on:click={() => selectedSlot = slot}>
								{formatSlot(slot)}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Booking form -->
		{#if selectedSlot}
			<div class="border-t border-gray-200 dark:border-gray-800 pt-6">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t(locale, 'booking.yourDetails')}</h2>
				{#if bookingError}
					<div class="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">{bookingError}</div>
				{/if}
				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'booking.name')}</label>
						<input type="text" id="name" bind:value={attendeeName} required
							class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" />
					</div>
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'booking.email')}</label>
						<input type="email" id="email" bind:value={attendeeEmail} required
							class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" />
					</div>
					<div>
						<label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(locale, 'booking.notes')}</label>
						<textarea id="notes" bind:value={notes} rows="3"
							class="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"></textarea>
					</div>
					<button on:click={submitBooking} disabled={booking || !attendeeName || !attendeeEmail}
						class="w-full py-3 rounded-xl text-white font-semibold transition-colors disabled:opacity-50"
						style="background-color: {brandColor}">
						{#if booking}
							<span class="flex items-center justify-center gap-2">
								<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								{t(locale, 'common.loading')}
							</span>
						{:else}
							{t(locale, 'booking.bookNow')}
						{/if}
					</button>
				</div>
			</div>
		{/if}
	{/if}
</main>
