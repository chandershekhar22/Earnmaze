<script lang="ts">
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	
	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	// Navigation items
	const navItems = [
		{ href: '/admin/dashboard', label: 'Dashboard' },
		{ href: '/admin/analytics', label: 'Analytics' },
		{ href: '/admin/users', label: 'Users' },
		{ href: '/admin/surveys', label: 'Surveys' },
		{ href: '/admin/settings', label: 'Settings' }
	];

	// Get current page name from path
	let currentPageName = $derived.by(() => {
		const path = $page.url.pathname;
		const item = navItems.find(item => path.startsWith(item.href));
		return item?.label || 'Admin';
	});

	// Check if link is active
	let isActive = $derived.by(() => (href: string) => {
		return $page.url.pathname.startsWith(href);
	});
</script>

<div class="min-h-screen bg-neutral-50">
	<!-- Admin Header -->
	<header class="bg-white shadow-sm border-b border-neutral-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center gap-8">
					<h1 class="text-xl font-bold text-neutral-900">{currentPageName}</h1>
					
					<nav class="hidden md:flex gap-1">
						{#each navItems as item}
							<a 
								href={item.href}
								class="px-3 py-2 rounded-lg text-sm font-medium transition-colors {isActive(item.href) 
									? 'bg-violet-100 text-violet-700' 
									: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}"
							>
								{item.label}
							</a>
						{/each}
					</nav>
				</div>
				
				<div class="flex items-center gap-4">
					<span class="text-sm text-neutral-600">
						<span class="font-semibold">{data.user.name}</span>
						<span class="ml-2 px-2 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded">
							ADMIN
						</span>
					</span>
					
					<form method="POST" action="/api/auth/logout">
						<button 
							type="submit"
							class="px-4 py-2 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
						>
							Logout
						</button>
					</form>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Admin Content -->
	<main>
		{@render children()}
	</main>
</div>
