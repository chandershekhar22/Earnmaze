<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const status = $page.status;
	const error = $page.error;

	const errorMessages: Record<number, { title: string; icon: string; description: string; color: string }> = {
		400: {
			title: 'Invalid Request',
			icon: '⚠️',
			description: 'The survey link is missing or invalid. Please check the link from your email or survey provider.',
			color: 'from-yellow-500 to-amber-500'
		},
		401: {
			title: 'Session Required',
			icon: '🔐',
			description: 'You need to be logged in to view your survey completion. Please log in first.',
			color: 'from-red-500 to-rose-500'
		},
		404: {
			title: 'Survey Not Found',
			icon: '🔍',
			description: 'We couldn\'t find your survey. It may have been completed already or the link is incorrect.',
			color: 'from-orange-500 to-red-500'
		},
		500: {
			title: 'Something Went Wrong',
			icon: '⚡',
			description: 'An unexpected error occurred. Our team has been notified. Please try again later.',
			color: 'from-red-600 to-red-500'
		}
	};

	const errorInfo = errorMessages[status] || {
		title: 'Error',
		icon: '❌',
		description: 'An unexpected error occurred. Please try again.',
		color: 'from-slate-500 to-slate-600'
	};

	function handleDashboard() {
		goto('/surveys');
	}

	function handleHome() {
		goto('/');
	}
</script>

<div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
	<div class="max-w-md w-full">
		<!-- Error Card -->
		<div class="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl p-8 text-center">
			<!-- Icon -->
			<div class="mb-6 text-6xl animate-bounce" style="animation-duration: 2s;">
				{errorInfo.icon}
			</div>

			<!-- Error Code Badge -->
			<div class="inline-block mb-4">
				<span class="px-4 py-2 rounded-full text-sm font-semibold {`bg-gradient-to-r ${errorInfo.color} text-white`}">
					Error {status}
				</span>
			</div>

			<!-- Title -->
			<h1 class="text-3xl font-bold text-white mb-3">
				{errorInfo.title}
			</h1>

			<!-- Description -->
			<p class="text-slate-300 mb-8 leading-relaxed">
				{errorInfo.description}
			</p>

			<!-- Error Details -->
			{#if error?.message}
				<div class="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4 mb-8 text-left">
					<p class="text-xs font-mono text-slate-400 break-words">
						{error.message}
					</p>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="space-y-3">
				<button
					onclick={handleDashboard}
					class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
				>
					Go to Dashboard
				</button>

				<button
					onclick={handleHome}
					class="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
				>
					Return Home
				</button>
			</div>

			<!-- Support Link -->
			<p class="text-sm text-slate-400 mt-6 pt-6 border-t border-slate-700/30">
				Still having issues?{' '}
				<a href="/contact" class="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
					Contact Support
				</a>
			</p>
		</div>

		<!-- Background Decoration -->
		<div class="mt-8 text-center">
			<p class="text-slate-500 text-sm">
				Status Code: <span class="font-mono text-slate-400">{status}</span>
			</p>
		</div>
	</div>

	<!-- Animated Background Elements -->
	<div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
		<div class="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute bottom-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
	</div>
</div>