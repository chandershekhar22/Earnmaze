<script lang="ts">
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { Menu, Copy, Check } from '@lucide/svelte';
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

<header class="bg-surface-50/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-30">
	<div class="flex items-center justify-between px-4 md:px-6 lg:px-8 h-14">
		<div class="flex items-center gap-3 min-w-0">
			<button
				onclick={onMenuClick}
				class="lg:hidden p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
				aria-label={m.hdr_toggle_menu()}
			>
				<Menu class="w-5 h-5" />
			</button>

			<div class="min-w-0">
				<h1 class="text-sm font-bold text-white truncate">{pageInfo.title}</h1>
				<p class="text-[10px] text-neutral-600 truncate hidden sm:block">{pageInfo.description}</p>
			</div>
		</div>

		<!-- Panelist ID -->
		{#if shortId}
			<button
				onclick={copyId}
				class="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-lg hover:bg-primary-500/15 hover:border-primary-500/30 transition-colors group flex-shrink-0"
				title={m.hdr_copy_id_title({ id: userId })}
			>
				<span class="text-[11px] font-mono font-semibold text-primary-300">
					<span class="hidden sm:inline">ID: </span>{shortId}
				</span>
				{#if copied}
					<Check class="w-3.5 h-3.5 text-emerald-400" />
				{:else}
					<Copy class="w-3.5 h-3.5 text-primary-400 group-hover:text-primary-300 transition-colors" />
				{/if}
			</button>
		{/if}
	</div>
</header>
