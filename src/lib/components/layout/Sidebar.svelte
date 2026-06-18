<script lang="ts">
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { pointsStore } from '$lib/stores/points.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { LayoutDashboard, ClipboardList, Coins, Gift, User, HelpCircle, Users, X, LogOut, Sparkles, Gamepad2, Zap, Flame } from '@lucide/svelte';

	let { isOpen = $bindable(false), variant = 'surveys' }: { isOpen?: boolean; variant?: 'surveys' | 'discover' } = $props();

	let showLogoutConfirm = $state(false);

	async function handleLogout() {
		showLogoutConfirm = false;
		await authStore.logout();
		goto('/');
	}

	let isActive = $derived.by(() => (href: string) => $page.url.pathname === href);

	// Home/brand link points at whichever dashboard the user is currently in.
	let homeHref = $derived(variant === 'discover' ? '/discover' : '/dashboard');

	const surveyNav = [
		{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ name: 'Surveys', href: '/surveys', icon: ClipboardList },
		{ name: 'Games', href: '/games', icon: Gamepad2 },
		{ name: 'Points', href: '/points', icon: Coins },
		{ name: 'Rewards', href: '/rewards', icon: Gift },
		{ name: 'Referrals', href: '/referrals', icon: Users },
		{ name: 'Profile', href: '/profile', icon: User },
		{ name: 'Support', href: '/support', icon: HelpCircle },
	];

	const discoverNav = [
		{ name: 'Dashboard', href: '/discover', icon: LayoutDashboard },
		{ name: 'Quizzes', href: '/discover?tab=quizzes', icon: Zap },
		{ name: 'Streaks', href: '/discover?tab=streaks', icon: Flame },
		{ name: 'Games', href: '/games', icon: Gamepad2 },
		{ name: 'Points', href: '/points', icon: Coins },
		{ name: 'Rewards', href: '/rewards', icon: Gift },
		{ name: 'Referrals', href: '/referrals', icon: Users },
		{ name: 'Profile', href: '/profile', icon: User },
		{ name: 'Support', href: '/support', icon: HelpCircle },
	];

	let navItems = $derived(variant === 'discover' ? discoverNav : surveyNav);

	let pointsFetched = $state(false);

	onMount(async () => {
		if (authStore.state.user && !pointsFetched) {
			pointsFetched = true;
			await pointsStore.fetchPoints();
		}
	});

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

<aside class="fixed lg:static inset-y-0 left-0 z-50 h-screen w-[248px] bg-surface-50 border-r border-white/[0.07] flex flex-col transform transition-transform duration-300 ease-in-out {isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}">
	<!-- Brand -->
	<div class="flex-shrink-0 flex items-center justify-between px-4 pt-[18px] pb-[22px]">
		<a href={homeHref} class="flex items-center gap-[11px] px-2.5 font-bold text-[18px] tracking-tight text-white">
			<span class="w-9 h-9 rounded-[11px] bg-gradient-to-br from-primary-400 to-primary-500 grid place-items-center text-surface shadow-[0_6px_18px_rgba(199,244,99,0.25)]">
				<Sparkles class="w-5 h-5" />
			</span>
			EarnMaze
		</a>
		<button
			onclick={() => isOpen = false}
			aria-label="Close sidebar"
			class="lg:hidden p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
		>
			<X class="w-5 h-5" />
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 min-h-0 px-3.5 flex flex-col gap-[3px] overflow-y-auto">
		{#each navItems as item}
			{@const active = isActive(item.href)}
			<a
				href={item.href}
				data-sveltekit-preload-data="hover"
				onclick={() => isOpen = false}
				class="relative flex items-center gap-[13px] px-[13px] py-[11px] rounded-xl text-[14px] font-medium transition-all duration-200
					{active
						? 'text-white bg-gradient-to-r from-primary-400/[0.12] to-primary-400/[0.02] ring-1 ring-inset ring-primary-400/[0.18]'
						: 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'}"
			>
				{#if active}
					<span class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-[3px] bg-primary-400 shadow-[0_0_10px_var(--tw-shadow-color)] shadow-primary-400"></span>
				{/if}
				<item.icon class="w-[18px] h-[18px] flex-shrink-0 {active ? 'text-primary-400' : ''}" />
				<span class="truncate">{item.name}</span>
				{#if active}
					<span class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_var(--tw-shadow-color)] shadow-primary-400"></span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Points Balance -->
	<div class="flex-shrink-0 mx-4 my-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-400/[0.12] to-surface-100/40 border border-primary-400/15 p-4">
		<div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary-400/[0.12] blur-2xl pointer-events-none"></div>
		<div class="relative">
			<div class="flex items-center gap-[7px] mb-2">
				<Coins class="w-3.5 h-3.5 text-primary-500" />
				<span class="font-mono text-[10px] text-primary-500 uppercase tracking-[0.14em] font-semibold">Balance</span>
			</div>
			<div class="text-[30px] font-bold text-white tracking-tight leading-none">
				{(pointsStore.data?.currentBalance ?? 0).toLocaleString()}
			</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-1">points available</div>
		</div>
	</div>

	<!-- User + Logout -->
	<div class="flex-shrink-0 mx-3.5 mb-4 flex items-center gap-[11px] p-2.5 rounded-xl border border-white/[0.07]">
		<div class="w-9 h-9 rounded-[10px] bg-gradient-to-br from-violet-400 to-primary-400 grid place-items-center text-surface text-sm font-bold flex-shrink-0">
			{userInitial}
		</div>
		<div class="flex-1 min-w-0">
			<div class="text-[13px] font-semibold text-white truncate">{userName}</div>
			<div class="font-mono text-[10px] text-neutral-500 truncate">{userEmail}</div>
		</div>
		<button
			onclick={() => showLogoutConfirm = true}
			class="p-1.5 rounded-md text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
			aria-label="Sign out"
		>
			<LogOut class="w-4 h-4" />
		</button>
	</div>

	{#if showLogoutConfirm}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick={() => showLogoutConfirm = false} onkeydown={(e) => e.key === 'Escape' && (showLogoutConfirm = false)}>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="bg-surface-100 rounded-2xl border border-white/[0.07] shadow-2xl max-w-xs w-full p-5 animate-scale-in" onclick={(e) => e.stopPropagation()}>
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
