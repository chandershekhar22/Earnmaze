<script lang="ts">
	import type { PageData } from './$types';
	
	interface Props {
		data: PageData;
	}
	
	let { data }: Props = $props();
	
	// Get reason from URL params
	const reason = $derived(
		typeof window !== 'undefined'
			? new URLSearchParams(window.location.search).get('reason') || 'region_restricted'
			: 'region_restricted'
	);
	
	const messages: Record<string, { title: string; description: string; icon: string }> = {
		'Service not available in your country': {
			title: 'Service Not Available',
			description: 'We apologize, but our service is not currently available in your country.',
			icon: '🌍'
		},
		'region_restricted': {
			title: 'Region Restricted',
			description: 'Access to this service is restricted in your region.',
			icon: '🌐'
		}
	};
	
	const message = $derived(messages[reason] || messages['region_restricted']);
</script>

<svelte:head>
	<title>{message.title} - QSurvey Panel</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
	<div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
		<!-- Icon -->
		<div class="text-6xl mb-6">
			{message.icon}
		</div>
		
		<!-- Title -->
		<h1 class="text-3xl font-bold text-gray-900 mb-4">
			{message.title}
		</h1>
		
		<!-- Description -->
		<p class="text-gray-600 mb-8">
			{message.description}
		</p>
		
		<!-- Info Box -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
			<h3 class="font-semibold text-blue-900 mb-2">Why am I seeing this?</h3>
			<ul class="text-sm text-blue-800 space-y-2">
				<li>• Our service is only available in specific countries</li>
				<li>• VPN, proxy, or TOR connections are restricted</li>
				<li>• This helps us comply with local regulations</li>
			</ul>
		</div>
		
		<!-- Actions -->
		<div class="space-y-3">
			<button
				onclick={() => window.location.reload()}
				class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
			>
				Try Again
			</button>
			
			<a
				href="/"
				class="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
			>
				Go to Homepage
			</a>
		</div>
		
		<!-- Contact -->
		<div class="mt-8 pt-8 border-t border-gray-200">
			<p class="text-sm text-gray-500">
				Think this is a mistake?
				<a href="/contact" class="text-blue-600 hover:text-blue-700 font-medium">
					Contact Support
				</a>
			</p>
		</div>
	</div>
</div>

<style>
	/* Additional animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	div > div {
		animation: fadeIn 0.5s ease-out;
	}
</style>
