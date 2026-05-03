<script lang="ts">
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { pointsStore } from '$lib/stores/points.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { LayoutDashboard, ClipboardList, Coins, Gift, User, HelpCircle, Users, X, LogOut, Sparkles, Gamepad2 } from '@lucide/svelte';

	let { isOpen = $bindable(false) }: { isOpen?: boolean } = $props();

	let showLogoutConfirm = $state(false);

	async function handleLogout() {
		showLogoutConfirm = false;
		await authStore.logout();
		goto('/');
	}

	function navigateTo(href: string) {
		goto(href);
		isOpen = false;
	}

	let isActive = $derived.by(() => (href: string) => $page.url.pathname === href);

	const navItems = [
		{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ name: 'Surveys', href: '/surveys', icon: ClipboardList },
		{ name: 'Games', href: '/games', icon: Gamepad2 },
		{ name: 'Points', href: '/points', icon: Coins },
		{ name: 'Rewards', href: '/rewards', icon: Gift },
		{ name: 'Referrals', href: '/referrals', icon: Users },
		{ name: 'Profile', href: '/profile', icon: User },
		{ name: 'Support', href: '/support', icon: HelpCircle },
	];

	let pointsFetched = $state(false);

	// Fetch points on mount
	onMount(async () => {
		if (authStore.state.user && !pointsFetched) {
			pointsFetched = true;
			await pointsStore.fetchPoints();
		}
	});

	// Re-fetch points on page navigation (throttled to once per 30s)
	let lastFetchTime = 0;
	$effect(() => {
		const _path = $page.url.pathname;
		const now = Date.now();
		if (pointsFetched && authStore.state.user && now - lastFetchTime > 30000) {
			lastFetchTime = now;
			pointsStore.fetchPoints();
		}
	});

	let userInitial = $derived(authStore.state.user?.name?.charAt(0)?.toUpperCase() || 'U');
	let userName = $derived(authStore.state.user?.name || 'User');
	let userEmail = $derived(authStore.state.user?.email || '');
</script>

<!-- Mobile Overlay -->
{#if isOpen}
	<button
		type="button"
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
		onclick={() => isOpen = false}
		aria-label="Close navigation overlay"
	></button>
{/if}

<aside class="fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-surface-50 border-r border-white/[0.06] flex flex-col transform transition-transform duration-300 ease-in-out {isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}">
	<!-- Brand -->
	<div class="px-5 pt-6 pb-5 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="w-9 h-9 bg-gradient-to-br from-primary-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
				<Sparkles class="w-5 h-5 text-white" />
			</div>
			<div>
				<div class="text-base font-black text-white tracking-tight">EarnMaze</div>
			</div>
		</div>
		<button
			onclick={() => isOpen = false}
			aria-label="Close sidebar"
			class="lg:hidden p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
		>
			<X class="w-5 h-5" />
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
		{#each navItems as item}
			<a
				href={item.href}
				data-sveltekit-preload-data="hover"
				onclick={() => isOpen = false}
				class="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 {isActive(item.href)
					? 'bg-primary-500/10 text-white'
					: 'text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300'}"
			>
				<div class="p-1.5 rounded-lg transition-colors {isActive(item.href)
					? 'bg-primary-500/15 text-primary-400'
					: 'text-neutral-600 group-hover:text-neutral-400'}">
					<item.icon class="w-4.5 h-4.5" />
				</div>
				<span>{item.name}</span>
				{#if isActive(item.href)}
					<div class="ml-auto w-1.5 h-1.5 bg-primary-400 rounded-full shadow-sm shadow-primary-400/50"></div>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Points Balance -->
	<div class="mx-3 mb-3">
		<div class="relative overflow-hidden bg-gradient-to-br from-violet-600/15 via-fuchsia-600/10 to-sky-600/5 border border-violet-500/15 rounded-2xl p-4">
			<div class="absolute -top-8 -right-8 w-24 h-24 bg-violet-500/15 rounded-full blur-2xl"></div>
			<div class="absolute bottom-0 left-0 w-16 h-16 bg-fuchsia-500/10 rounded-full blur-xl"></div>
			<div class="relative">
				<div class="flex items-center gap-2 mb-2">
					<Coins class="w-4 h-4 text-amber-400" />
					<span class="text-[10px] font-bold text-white/30 uppercase tracking-widest">Balance</span>
				</div>
				<div class="text-2xl font-black text-white tracking-tight">
					{(pointsStore.data?.currentBalance ?? 0).toLocaleString()}
				</div>
				<div class="text-[10px] text-violet-300/40 font-medium mt-0.5">points available</div>
			</div>
		</div>
	</div>

	<!-- User + Logout -->
	<div class="px-3 pb-4 pt-2 border-t border-white/[0.06]">
		<div class="flex items-center gap-3 px-3 py-3">
			<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
				{userInitial}
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-semibold text-white truncate">{userName}</div>
				<div class="text-[10px] text-neutral-600 truncate">{userEmail}</div>
			</div>
			<button
				onclick={() => showLogoutConfirm = true}
				class="p-2 text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
				aria-label="Sign out"
			>
				<LogOut class="w-4 h-4" />
			</button>
		</div>
	</div>

	<!-- Logout confirmation -->
	{#if showLogoutConfirm}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick={() => showLogoutConfirm = false} onkeydown={(e) => e.key === 'Escape' && (showLogoutConfirm = false)}>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="bg-surface-100 rounded-2xl border border-white/[0.06] shadow-2xl max-w-xs w-full p-5 animate-scale-in" onclick={(e) => e.stopPropagation()}>
				<div class="text-center">
					<div class="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
						<LogOut class="w-6 h-6 text-rose-400" />
					</div>
					<h3 class="text-base font-bold text-white mb-1">Sign out?</h3>
					<p class="text-xs text-neutral-500 mb-5">You'll need to log in again to access your account.</p>
					<div class="flex gap-2">
						<button onclick={() => showLogoutConfirm = false} class="btn-secondary flex-1 !text-xs">Cancel</button>
						<button onclick={handleLogout} class="btn-danger flex-1 !text-xs">Sign Out</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</aside>
