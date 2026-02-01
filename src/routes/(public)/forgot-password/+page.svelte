<script lang="ts">
	import { Logger } from '$lib/utils/app-logger';
	import { onMount } from 'svelte';

	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state(false);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!email) {
			error = 'Please enter your email address';
			return;
		}

		isLoading = true;
		error = '';
		success = false;
		Logger.root.info({ context: 'security', email }, 'Forgot password request initiated');

		try {
			const response = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			const result = await response.json();

			if (response.ok) {
				Logger.root.info({ context: 'security', email }, 'Forgot password email sent');
				success = true;
				error = '';
				email = '';
			} else {
				error = result.message || 'Failed to process request';
				Logger.root.warn({ context: 'security', email, error: result.error }, 'Forgot password request failed');
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			Logger.root.error({ context: 'errors', error: err }, 'Forgot password error');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - EarnMaze Panel</title>
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
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
			<p class="text-gray-600">
				Enter your email address and we'll send you a link to reset your password.
			</p>
		</div>

		<!-- Form Container -->
		<div class="bg-white rounded-lg shadow-lg p-8">
			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<p class="text-sm text-red-800">{error}</p>
				</div>
			{/if}

			{#if success}
				<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-green-800">Email Sent Successfully</h3>
							<p class="text-sm text-green-700 mt-1">
								If an account with this email exists, you will receive a password reset link shortly.
							</p>
						</div>
					</div>
				</div>

				<div class="space-y-3">
					<p class="text-sm text-gray-600 text-center">
						Didn't receive the email? Check your spam folder or try again.
					</p>
					<a
						href="/login"
						class="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
					>
						Back to Login
					</a>
				</div>
			{:else}
				<form onsubmit={handleSubmit} class="space-y-6">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
							Email Address
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="your@email.com"
							required
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
							disabled={isLoading || !email}
							class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						>
							{isLoading ? 'Sending...' : 'Send Reset Link'}
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
