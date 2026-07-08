<script lang="ts">
	import { goto } from '$app/navigation';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { LayoutDashboard, BarChart3, Users, ClipboardList, Gift, Coins, Settings, HelpCircle, Globe, LogOut, Menu, X, ArrowLeftRight, MessageSquareText, Repeat, Share2, ShieldCheck } from '@lucide/svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const navItems = [
		{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
		{ href: '/admin/users', label: 'Users', icon: Users },
		{ href: '/admin/surveys', label: 'Surveys', icon: ClipboardList },
		{ href: '/admin/responses', label: 'Responses', icon: MessageSquareText },
		{ href: '/admin/rewards', label: 'Rewards', icon: Gift },
		{ href: '/admin/redemptions', label: 'Redeem', icon: Repeat },
		{ href: '/admin/points', label: 'Points', icon: Coins },
		{ href: '/admin/transactions', label: 'Txns', icon: ArrowLeftRight },
		{ href: '/admin/referrals', label: 'Referrals', icon: Share2 },
		{ href: '/admin/support', label: 'Support', icon: HelpCircle },
		{ href: '/admin/geo-settings', label: 'Geo', icon: Globe },
		{ href: '/admin/consent', label: 'Consent', icon: ShieldCheck },
		{ href: '/admin/settings', label: 'Settings', icon: Settings },
	];

	let mobileMenuOpen = $state(false);

	async function handleLogout() {
		await authStore.logout();
		goto('/login');
	}

	let currentPageName = $derived.by(() => {
		const path = $page.url.pathname;
		const item = navItems.find(item => path.startsWith(item.href));
		return item?.label || 'Admin';
	});

	let isActive = $derived.by(() => (href: string) => $page.url.pathname.startsWith(href));
</script>

<!-- Admin UI is English-only and always LTR. Force dir=ltr so RTL locales
     (Arabic) don't flip the admin layout — admins may have an em_locale
     cookie set from earlier visits to public pages. -->
<div class="min-h-screen bg-surface" dir="ltr">
	<!-- Admin Header -->
	<header class="bg-surface-50/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-40" style="transform: translateZ(0);">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-14">
				<div class="flex items-center gap-6">
					<!-- Mobile menu toggle -->
					<button onclick={() => mobileMenuOpen = !mobileMenuOpen} class="md:hidden p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
						{#if mobileMenuOpen}
							<X class="w-5 h-5" />
						{:else}
							<Menu class="w-5 h-5" />
						{/if}
					</button>

					<div class="flex items-center gap-2">
						<span class="text-sm font-black text-white">Admin</span>
						<span class="text-neutral-700">/</span>
						<span class="text-sm font-semibold text-neutral-400">{currentPageName}</span>
					</div>

					<!-- Desktop nav -->
					<nav class="hidden md:flex items-center gap-0.5">
						{#each navItems as item}
							<a
								href={item.href}
								data-sveltekit-preload-data="hover"
								class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors {isActive(item.href)
									? 'bg-primary-500/15 text-primary-400'
									: 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]'}"
							>
								<item.icon class="w-3.5 h-3.5" />
								{item.label}
							</a>
						{/each}
					</nav>
				</div>

				<div class="flex items-center gap-3">
					<span class="hidden sm:flex items-center gap-2 text-xs">
						<span class="font-semibold text-white">{data.user.name}</span>
						<span class="badge-primary text-[10px]">ADMIN</span>
					</span>
					<button onclick={handleLogout} type="button" class="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Logout">
						<LogOut class="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile nav dropdown -->
		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-white/[0.06] bg-surface-50 px-4 py-3 space-y-1 animate-fade-in">
				{#each navItems as item}
					<a
						href={item.href}
						onclick={() => mobileMenuOpen = false}
						class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive(item.href)
							? 'bg-primary-500/15 text-primary-400'
							: 'text-neutral-500 hover:text-white hover:bg-white/[0.04]'}"
					>
						<item.icon class="w-4 h-4" />
						{item.label}
					</a>
				{/each}
			</div>
		{/if}
	</header>

	<main>
		{@render children()}
	</main>
</div>
