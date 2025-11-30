<script lang="ts">
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';
	
	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="min-h-screen bg-gray-100">
	<!-- Admin Header -->
	<header class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center gap-8">
					<h1 class="text-xl font-bold text-gray-900">Admin Panel</h1>
					
					<nav class="hidden md:flex gap-6">
						<a 
							href="/admin/dashboard" 
							class="text-gray-700 hover:text-primary-600 font-medium transition-colors"
						>
							Dashboard
						</a>
						<a 
							href="/admin/analytics" 
							class="text-gray-700 hover:text-primary-600 font-medium transition-colors"
						>
							Analytics
						</a>
						<a 
							href="/admin/users" 
							class="text-gray-700 hover:text-primary-600 font-medium transition-colors"
						>
							Users
						</a>
						<a 
							href="/admin/surveys" 
							class="text-gray-700 hover:text-primary-600 font-medium transition-colors"
						>
							Surveys
						</a>
					</nav>
				</div>
				
				<div class="flex items-center gap-4">
					<span class="text-sm text-gray-600">
						<span class="font-semibold">{data.user.name}</span>
						<span class="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
							ADMIN
						</span>
					</span>
					
					<form method="POST" action="/api/auth/logout">
						<button 
							type="submit"
							class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
