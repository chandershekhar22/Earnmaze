<script lang="ts">
	import type { PageData } from './$types';
	import { ShieldCheck, Megaphone, Users, FileCheck2, Cake, TrendingUp, TrendingDown, Clock } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const channelLabel: Record<string, string> = {
		marketing: 'Marketing email',
		'survey-data-sharing': 'Survey data sharing',
		newsletter: 'Newsletter',
	};

	const sourceLabel: Record<string, string> = {
		'register-form': 'Register page',
		'earn-points-form': 'Earn-points form',
		'guest-upgrade-form': 'Guest upgrade',
		'forgot-password-flow': 'Forgot password',
		'survey-consent-page': 'Survey consent',
		'profile-page': 'Profile settings',
		'unsubscribe-link': 'Unsubscribe link',
		'admin-action': 'Admin action',
		unknown: 'Unknown source',
	};

	function formatDate(d: Date | string): string {
		const date = typeof d === 'string' ? new Date(d) : d;
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function maskEmail(email: string | null | undefined): string {
		if (!email) return '—';
		const at = email.lastIndexOf('@');
		if (at <= 0) return email;
		const local = email.slice(0, at);
		const domain = email.slice(at + 1);
		if (local.length <= 2) return `${local[0]}*@${domain}`;
		return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
	}

	const maxDailyGranted = $derived(
		Math.max(1, ...data.stats.dailyLast30d.map((d) => d.granted))
	);
</script>

<svelte:head>
	<title>Consent stats - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<div class="p-2.5 bg-primary-500/10 rounded-xl">
			<ShieldCheck class="w-5 h-5 text-primary-400" />
		</div>
		<div>
			<h1 class="text-lg font-bold text-white">Consent &amp; compliance</h1>
			<p class="text-xs text-neutral-500">
				Current opt-in state across all channels and recent grant/revoke activity
			</p>
		</div>
	</div>

	<!-- KPI cards -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="card !p-4">
			<div class="flex items-center gap-2 mb-3">
				<Users class="w-4 h-4 text-neutral-500" />
				<span class="text-xs text-neutral-500">Active users</span>
			</div>
			<div class="text-2xl font-black text-white tracking-tight tabular-nums">
				{data.stats.totals.activeUsers.toLocaleString()}
			</div>
		</div>

		<div class="card !p-4">
			<div class="flex items-center gap-2 mb-3">
				<Megaphone class="w-4 h-4 text-violet-400" />
				<span class="text-xs text-neutral-500">Marketing opt-ins</span>
			</div>
			<div class="text-2xl font-black text-white tracking-tight tabular-nums">
				{data.stats.totals.marketingOptedIn.toLocaleString()}
			</div>
			<div class="text-xs text-neutral-500 mt-1">
				{data.stats.totals.marketingOptedInPercent}% of active
			</div>
		</div>

		<div class="card !p-4">
			<div class="flex items-center gap-2 mb-3">
				<FileCheck2 class="w-4 h-4 text-emerald-400" />
				<span class="text-xs text-neutral-500">Survey-data consent</span>
			</div>
			<div class="text-2xl font-black text-white tracking-tight tabular-nums">
				{data.stats.totals.surveyDataSharingAccepted.toLocaleString()}
			</div>
			<div class="text-xs text-neutral-500 mt-1">
				{data.stats.totals.surveyDataSharingPercent}% of active
			</div>
		</div>

		<div class="card !p-4">
			<div class="flex items-center gap-2 mb-3">
				<Cake class="w-4 h-4 text-amber-400" />
				<span class="text-xs text-neutral-500">Age &amp; ToS verified</span>
			</div>
			<div class="text-2xl font-black text-white tracking-tight tabular-nums">
				{data.stats.totals.ageVerified.toLocaleString()}
			</div>
			<div class="text-xs text-neutral-500 mt-1">
				{data.stats.totals.tosAccepted.toLocaleString()} accepted ToS
			</div>
		</div>
	</div>

	<!-- Recent activity numbers -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="card !p-4">
			<div class="flex items-center gap-2 mb-2">
				<TrendingUp class="w-4 h-4 text-emerald-400" />
				<span class="text-xs text-neutral-500">Granted (24h)</span>
			</div>
			<div class="text-xl font-black text-emerald-400 tracking-tight tabular-nums">
				+{data.stats.recent.marketingGrantedLast24h}
			</div>
		</div>
		<div class="card !p-4">
			<div class="flex items-center gap-2 mb-2">
				<TrendingDown class="w-4 h-4 text-rose-400" />
				<span class="text-xs text-neutral-500">Revoked (24h)</span>
			</div>
			<div class="text-xl font-black text-rose-400 tracking-tight tabular-nums">
				−{data.stats.recent.marketingRevokedLast24h}
			</div>
		</div>
		<div class="card !p-4">
			<div class="flex items-center gap-2 mb-2">
				<TrendingUp class="w-4 h-4 text-emerald-400" />
				<span class="text-xs text-neutral-500">Granted (7d)</span>
			</div>
			<div class="text-xl font-black text-emerald-400 tracking-tight tabular-nums">
				+{data.stats.recent.marketingGrantedLast7d}
			</div>
		</div>
		<div class="card !p-4">
			<div class="flex items-center gap-2 mb-2">
				<TrendingDown class="w-4 h-4 text-rose-400" />
				<span class="text-xs text-neutral-500">Revoked (7d)</span>
			</div>
			<div class="text-xl font-black text-rose-400 tracking-tight tabular-nums">
				−{data.stats.recent.marketingRevokedLast7d}
			</div>
		</div>
	</div>

	<!-- Source breakdown -->
	<div class="card">
		<h2 class="text-sm font-bold text-white mb-4">Source breakdown</h2>
		{#if data.stats.bySource.length === 0}
			<p class="text-sm text-neutral-500">No consent events recorded yet.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-xs text-neutral-500 border-b border-white/[0.06]">
							<th class="text-left py-2">Channel</th>
							<th class="text-left py-2">Source</th>
							<th class="text-right py-2">Granted</th>
							<th class="text-right py-2">Revoked</th>
							<th class="text-right py-2">Net</th>
						</tr>
					</thead>
					<tbody>
						{#each data.stats.bySource as row}
							<tr class="border-b border-white/[0.03]">
								<td class="py-2 text-neutral-300">
									{channelLabel[row.channel] ?? row.channel}
								</td>
								<td class="py-2 text-neutral-400">
									{sourceLabel[row.source] ?? row.source}
								</td>
								<td class="py-2 text-right text-emerald-400 tabular-nums">
									+{row.granted}
								</td>
								<td class="py-2 text-right text-rose-400 tabular-nums">
									−{row.revoked}
								</td>
								<td class="py-2 text-right text-white font-semibold tabular-nums">
									{row.granted - row.revoked >= 0 ? '+' : ''}{row.granted - row.revoked}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Daily trend (marketing) -->
	<div class="card">
		<h2 class="text-sm font-bold text-white mb-4">Marketing — last 30 days</h2>
		{#if data.stats.dailyLast30d.length === 0}
			<p class="text-sm text-neutral-500">No daily activity in the last 30 days.</p>
		{:else}
			<div class="space-y-1.5">
				{#each data.stats.dailyLast30d as day}
					<div class="flex items-center gap-3 text-xs">
						<div class="w-20 text-neutral-500 tabular-nums flex-shrink-0">{day.day}</div>
						<div class="flex-1 flex items-center gap-1">
							<div
								class="bg-emerald-500/30 h-4 rounded-sm"
								style="width: {(day.granted / maxDailyGranted) * 100}%; min-width: {day.granted > 0 ? '2px' : '0'}"
								title="{day.granted} granted"
							></div>
							{#if day.revoked > 0}
								<div
									class="bg-rose-500/30 h-4 rounded-sm"
									style="width: {(day.revoked / maxDailyGranted) * 100}%; min-width: 2px"
									title="{day.revoked} revoked"
								></div>
							{/if}
						</div>
						<div class="w-24 text-right tabular-nums flex-shrink-0">
							<span class="text-emerald-400">+{day.granted}</span>
							{#if day.revoked > 0}
								<span class="text-rose-400 ml-2">−{day.revoked}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Recent events -->
	<div class="card">
		<div class="flex items-center gap-2 mb-4">
			<Clock class="w-4 h-4 text-neutral-500" />
			<h2 class="text-sm font-bold text-white">Recent events</h2>
		</div>
		{#if data.stats.recentEvents.length === 0}
			<p class="text-sm text-neutral-500">No consent events recorded yet.</p>
		{:else}
			<div class="space-y-2">
				{#each data.stats.recentEvents as ev}
					<div class="flex items-center gap-3 p-3 bg-surface-200 rounded-xl text-xs">
						<div class="w-2 h-2 rounded-full flex-shrink-0 {ev.granted ? 'bg-emerald-400' : 'bg-rose-400'}"></div>
						<div class="flex-1 min-w-0">
							<div class="text-neutral-300 truncate">
								<a href="/admin/users/{ev.userId}" class="hover:text-primary-400 transition-colors">
									{maskEmail(ev.userEmail)}
								</a>
								<span class="text-neutral-500"> · </span>
								<span class="text-neutral-400">{channelLabel[ev.channel] ?? ev.channel}</span>
							</div>
							<div class="text-neutral-600">
								{ev.granted ? 'Granted' : 'Revoked'} via {sourceLabel[ev.source ?? 'unknown'] ?? ev.source}
							</div>
						</div>
						<div class="text-neutral-500 tabular-nums flex-shrink-0">{formatDate(ev.createdAt)}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
