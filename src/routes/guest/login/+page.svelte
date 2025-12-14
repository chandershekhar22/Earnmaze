<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Logger, Features } from '$lib/utils/app-logger';

	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		Features.trackPageView('/guest/login');
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		
		if (!email) {
			error = 'Please enter your email';
			return;
		}

		isLoading = true;
		error = '';
		Logger.root.info({ context: 'security' }, 'Guest login attempt started');

		try {
			const response = await fetch('/api/guest/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			const result = await response.json();

			if (result.success) {
				Logger.root.info({ context: 'security' }, 'Guest login successful');
				Features.trackUserAction('guest-login-success', 'guest-login');
				goto('/guest/dashboard');
			} else {
				error = result.message || 'Failed to create guest session';
				Logger.root.warn({ context: 'security', error: result.error }, 'Guest login failed');
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			Logger.root.error({ context: 'errors', error: err }, 'Guest login error');
		} finally {
			isLoading = false;
		}
	}

	function handleFullLoginClick() {
		Features.trackUserAction('switch-to-full-login', 'guest-login');
		goto('/login');
	}
</script>

<svelte:head>
	<title>Quick Access - EarnMaze Panel</title>
	<meta name="description" content="Quick access to view available surveys. Enter your email to get started." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Quick Access</h1>
			<p class="text-gray-600">
				Enter your email to view available surveys and track session points
			</p>
		</div>

		<!-- Info Banner -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
					</svg>
				</div>
				<div class="ml-3 text-sm text-blue-700">
					<p><strong>Guest Mode Features:</strong></p>
					<ul class="mt-2 space-y-1 list-disc list-inside">
						<li>View available surveys</li>
						<li>Track session points (24 hours)</li>
						<li>No password required</li>
					</ul>
					<p class="mt-2 text-xs">
						Create a full account to save progress and redeem rewards
					</p>
				</div>
			</div>
		</div>

		<!-- Login Form -->
		<div class="bg-white rounded-lg shadow-lg p-8">
			<form onsubmit={handleSubmit} class="space-y-6">
				{#if error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4">
						<p class="text-sm text-red-800">{error}</p>
					</div>
				{/if}

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						Email Address
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						placeholder="you@example.com"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={isLoading}
					/>
					<p class="mt-2 text-xs text-gray-500">
						Just enter your email - no password or verification needed
					</p>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
				>
					{isLoading ? 'Logging In...' : 'Get Started Now'}
				</button>
			</form>

			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600">
					Have an account?
					<button
						onclick={handleFullLoginClick}
						class="text-blue-600 hover:text-blue-800 font-medium"
					>
						Sign in here
					</button>
				</p>
			</div>
		</div>

		<!-- Security Notice -->
		<div class="text-center text-xs text-gray-500">
			<p>
				Guest sessions are temporary and expire after 24 hours. 
				Your email is used only for this session and is not stored permanently.
			</p>
		</div>
	</div>
</div>
