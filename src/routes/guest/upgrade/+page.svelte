<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { Logger, Features } from '$lib/utils/app-logger';

	let name = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let turnstileToken = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let mounted = $state(false);
	let guestEmail = $state('');

	onMount(() => {
		mounted = true;
		Features.trackPageView('/guest/upgrade');
		
		// Check if coming from guest session
		checkGuestSession();
	});

	async function checkGuestSession() {
		try {
			const response = await fetch('/api/guest/dashboard');
			if (response.ok) {
				const result = await response.json();
				if (result.success && result.data) {
					guestEmail = result.data.email;
				}
			}
		} catch (err) {
			Logger.root.error({ context: 'errors', error: err }, 'Failed to check guest session');
		}
	}

	function handleTurnstileVerify(token: string) {
		turnstileToken = token;
		error = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		
		if (!name || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (!turnstileToken) {
			error = 'Please complete the verification';
			return;
		}

		isLoading = true;
		error = '';
		Logger.root.info({ context: 'security' }, 'Guest account upgrade attempt started');

		try {
			const response = await fetch('/api/guest/upgrade', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, password, turnstileToken }),
			});

			const result = await response.json();

			if (result.success) {
				Logger.root.info({ context: 'security' }, 'Guest account upgraded successfully');
				Features.trackUserAction('guest-upgrade-success', 'guest-upgrade');
				goto('/dashboard');
			} else {
				error = result.message || 'Failed to create account';
				Logger.root.warn({ context: 'security', error: result.error }, 'Guest upgrade failed');
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			Logger.root.error({ context: 'errors', error: err }, 'Guest upgrade error');
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		goto('/guest/dashboard');
	}
</script>

<svelte:head>
	<title>Create Account - EarnMaze Panel</title>
	<meta name="description" content="Complete your registration to unlock all features" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Create Your Account</h1>
			<p class="text-gray-600">
				Unlock all features and save your progress
			</p>
		</div>

		<!-- Benefits Banner -->
		<div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
			<h3 class="font-bold text-lg mb-3">Full Account Benefits:</h3>
			<ul class="space-y-2 text-sm">
				<li class="flex items-start">
					<svg class="h-5 w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
					</svg>
					Save and track all your points permanently
				</li>
				<li class="flex items-start">
					<svg class="h-5 w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
					</svg>
					Redeem rewards and gift cards
				</li>
				<li class="flex items-start">
					<svg class="h-5 w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
					</svg>
					Access complete survey history
				</li>
				<li class="flex items-start">
					<svg class="h-5 w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
					</svg>
					Unlock tier rewards and bonuses
				</li>
			</ul>
		</div>

		{#if guestEmail}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<p class="text-sm text-blue-700">
					<strong>Email:</strong> {guestEmail}
				</p>
			</div>
		{/if}

		<!-- Registration Form -->
		<div class="bg-white rounded-lg shadow-lg p-8">
			<form onsubmit={handleSubmit} class="space-y-6">
				{#if error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4">
						<p class="text-sm text-red-800">{error}</p>
					</div>
				{/if}

				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
						Full Name
					</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						required
						placeholder="John Doe"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={isLoading}
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						minlength="8"
						placeholder="At least 8 characters"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={isLoading}
					/>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
						Confirm Password
					</label>
					<input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						required
						minlength="8"
						placeholder="Re-enter password"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={isLoading}
					/>
				</div>

				<div>
					<Turnstile onVerify={handleTurnstileVerify} />
				</div>

				<div class="flex space-x-3">
					<button
						type="button"
						onclick={handleCancel}
						disabled={isLoading}
						class="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isLoading || !turnstileToken}
						class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
					>
						{isLoading ? 'Creating Account...' : 'Create Account'}
					</button>
				</div>
			</form>
		</div>

		<!-- Security Notice -->
		<div class="text-center text-xs text-gray-500">
			<p>
				By creating an account, you agree to our Terms of Service and Privacy Policy.
				Your guest session data will be transferred to your new account.
			</p>
		</div>
	</div>
</div>
