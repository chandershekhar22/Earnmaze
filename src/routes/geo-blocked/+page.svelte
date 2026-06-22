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

<div class="min-h-screen bg-surface flex items-center justify-center px-4">
	<div class="max-w-md w-full bg-surface-100 rounded-2xl border border-white/[0.06] p-8 text-center">
		<!-- Icon -->
		<div class="text-6xl mb-6">
			{message.icon}
		</div>

		<!-- Title -->
		<h1 class="text-3xl font-bold text-white mb-4">
			{message.title}
		</h1>

		<!-- Description -->
		<p class="text-neutral-400 mb-8">
			{message.description}
		</p>

		<!-- Info Box -->
		<div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 text-start">
			<h3 class="font-semibold text-rose-300 mb-2">Why am I seeing this?</h3>
			<ul class="text-sm text-rose-400/80 space-y-2">
				<li>&#8226; Our service is only available in specific countries</li>
				<li>&#8226; VPN, proxy, or TOR connections are restricted</li>
				<li>&#8226; This helps us comply with local regulations</li>
			</ul>
		</div>

		<!-- Actions -->
		<div class="space-y-3">
			<button
				onclick={() => window.location.reload()}
				class="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
			>
				Try Again
			</button>

			<a
				href="/"
				class="block w-full bg-surface-200 hover:bg-white/[0.03] text-neutral-400 font-semibold py-3 px-6 rounded-lg transition-colors"
			>
				Go to Homepage
			</a>
		</div>

		<!-- Contact -->
		<div class="mt-8 pt-8 border-t border-white/[0.06]">
			<p class="text-sm text-neutral-500">
				Think this is a mistake?
				<a href="/contact" class="text-primary-400 hover:text-primary-300 font-medium">
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
