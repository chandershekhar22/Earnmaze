<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Logger } from '$lib/utils/app-logger';
	import { onMount } from 'svelte';

	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state(false);
	let tokenInvalid = $state(false);
	let mounted = $state(false);

	$effect(() => {
		if (mounted && !$page.url.searchParams.get('token')) {
			tokenInvalid = true;
		}
	});

	onMount(() => {
		mounted = true;
		Logger.root.info({ context: 'security' }, 'Reset password page loaded');
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		const token = $page.url.searchParams.get('token');
		if (!token) {
			error = 'Invalid or missing reset token';
			return;
		}

		if (!password || !confirmPassword) {
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

		isLoading = true;
		error = '';
		Logger.root.info({ context: 'security' }, 'Password reset submitted');

		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, password }),
			});

			const result = await response.json();

			if (response.ok) {
				Logger.root.info({ context: 'security' }, 'Password reset successful');
				success = true;
				error = '';

				// Redirect to login after 2 seconds
				setTimeout(() => {
					goto('/login');
				}, 2000);
			} else {
				error = result.message || 'Failed to reset password';
				Logger.root.warn({ context: 'security', error: result.error }, 'Password reset failed');
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			Logger.root.error({ context: 'errors', error: err }, 'Password reset error');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - EarnMaze Panel</title>
	<meta name="description" content="Reset your EarnMaze password" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<!-- Logo -->
		<div class="flex justify-center">
			<div class="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
				<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
				</svg>
			</div>
		</div>

		<!-- Header -->
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Reset Password</h1>
			<p class="text-gray-600">
				Create a new secure password for your account.
			</p>
		</div>

		<!-- Form Container -->
		<div class="bg-white rounded-lg shadow-lg p-8">
			{#if tokenInvalid}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<h3 class="text-sm font-medium text-red-800 mb-2">Invalid Reset Link</h3>
					<p class="text-sm text-red-700 mb-4">
						The reset link is invalid or has expired. Please request a new one.
					</p>
					<div class="flex space-x-3">
						<a
							href="/login"
							class="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
						>
							Back to Login
						</a>
						<a
							href="/forgot-password"
							class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
						>
							Request New Link
						</a>
					</div>
				</div>
			{:else if success}
				<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-green-800">Password Reset Successful</h3>
							<p class="text-sm text-green-700 mt-1">
								Your password has been reset. Redirecting to login...
							</p>
						</div>
					</div>
				</div>
			{:else}
				{#if error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<p class="text-sm text-red-800">{error}</p>
					</div>
				{/if}

				<form onsubmit={handleSubmit} class="space-y-6">
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
							New Password
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							placeholder="At least 8 characters"
							required
							minlength="8"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={isLoading}
						/>
						<p class="text-xs text-gray-500 mt-2">Must be at least 8 characters</p>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
							Confirm Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							placeholder="Re-enter password"
							required
							minlength="8"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={isLoading}
						/>
					</div>

					<div class="flex space-x-3">
						<a
							href="/login"
							class="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
						>
							Back
						</a>
						<button
							type="submit"
							disabled={isLoading || !password || !confirmPassword}
							class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						>
							{isLoading ? 'Resetting...' : 'Reset Password'}
						</button>
					</div>
				</form>
			{/if}
		</div>

		<!-- Security Notice -->
		<div class="text-center text-xs text-gray-500">
			<p>
				For your security, password reset links expire after 1 hour.
			</p>
		</div>
	</div>
</div>
