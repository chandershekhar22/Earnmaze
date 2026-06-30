<script lang="ts">
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { Menu, Copy, Check, Bell } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	let { onMenuClick }: { onMenuClick?: () => void } = $props();

	let pageInfo = $derived(getPageInfo($page.route.id));
	let userId = $derived(authStore.state.user?.id || '');
	let shortId = $derived(userId ? userId.slice(0, 8) : '');
	let copied = $state(false);

	function copyId() {
		if (!userId) return;
		navigator.clipboard.writeText(userId);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	function getPageInfo(routeId: string | null): { title: string; description: string } {
		if (!routeId) return { title: m.nav_dashboard(), description: m.hdr_dashboard_desc() };

		const pageMap: Record<string, { title: string; description: string }> = {
			'/(panelist)/dashboard': { title: m.nav_dashboard(), description: m.hdr_dashboard_desc() },
			'/(panelist)/surveys': { title: m.nav_surveys(), description: m.hdr_surveys_desc() },
			'/(panelist)/games': { title: 'Games', description: 'Play and earn instantly' },
			'/(panelist)/points': { title: m.nav_points(), description: m.hdr_points_desc() },
			'/(panelist)/rewards': { title: m.nav_rewards(), description: m.hdr_rewards_desc() },
			'/(panelist)/profile': { title: m.nav_profile(), description: m.hdr_profile_desc() },
			'/(panelist)/history': { title: m.hdr_history_title(), description: m.hdr_history_desc() },
			'/(panelist)/referrals': { title: m.nav_referrals(), description: m.hdr_referrals_desc() },
			'/(panelist)/support': { title: m.nav_support(), description: m.hdr_support_desc() }
		};

		return pageMap[routeId] || { title: m.nav_dashboard(), description: m.hdr_dashboard_desc() };
	}
</script>

<header class="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/[0.07]">
	<div class="flex items-center justify-between gap-3 px-4 md:px-8 py-4">
		<div class="flex items-center gap-3 min-w-0">
			<button
				onclick={onMenuClick}
				class="lg:hidden p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
				aria-label={m.hdr_toggle_menu()}
			>
				<Menu class="w-5 h-5" />
			</button>

			<div class="min-w-0">
				<h1 class="text-[20px] font-bold text-white tracking-tight truncate">{pageInfo.title}</h1>
				<p class="text-[13px] text-neutral-500 truncate hidden sm:block">{pageInfo.description}</p>
			</div>
		</div>

		<div class="flex items-center gap-2.5 flex-shrink-0">
			{#if shortId}
				<button
					onclick={copyId}
					class="group inline-flex items-center gap-2 px-3 py-[7px] bg-white/[0.03] border border-white/[0.07] rounded-full hover:border-white/[0.13] transition-colors"
					title="Click to copy full ID: {userId}"
				>
					<span class="font-mono text-[11px] text-neutral-400 group-hover:text-neutral-300">
						<span class="hidden sm:inline">ID:</span>{shortId}
					</span>
					{#if copied}
						<Check class="w-3.5 h-3.5 text-primary-400" />
					{:else}
						<Copy class="w-3.5 h-3.5 text-neutral-500 group-hover:text-primary-400 transition-colors" />
					{/if}
				</button>
			{/if}

			<button
				class="relative w-[38px] h-[38px] rounded-full bg-white/[0.03] border border-white/[0.07] grid place-items-center text-neutral-400 hover:text-white hover:border-white/[0.13] transition-all"
				title="Notifications"
				aria-label="Notifications"
			>
				<Bell class="w-[15px] h-[15px]" />
				<span class="absolute top-[8px] right-[9px] w-[7px] h-[7px] rounded-full bg-rose-400 ring-2 ring-surface"></span>
			</button>
		</div>
	</div>
</header>
