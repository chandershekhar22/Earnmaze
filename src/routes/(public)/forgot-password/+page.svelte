<script lang="ts">
	import { Logger } from '$lib/utils/app-logger';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { CircleCheck, KeyRound } from '@lucide/svelte';

	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state(false);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	function goBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
		} else {
			goto('/login');
		}
	}

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

<div class="w-full max-w-md space-y-8">
	<!-- Logo -->
	<div class="flex justify-center">
		<div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
			<KeyRound class="w-7 h-7 text-white" />
		</div>
	</div>

	<!-- Header -->
	<div class="text-center">
		<h1 class="text-4xl font-bold text-white mb-2">Forgot Password?</h1>
		<p class="text-neutral-400">
			Enter your email address and we'll send you a link to reset your password.
		</p>
	</div>

	<!-- Form Container -->
	<div class="card">
		{#if error}
			<div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
				<p class="text-sm text-rose-400">{error}</p>
			</div>
		{/if}

		{#if success}
			<div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
				<div class="flex items-start">
					<div class="flex-shrink-0">
						<CircleCheck class="h-5 w-5 text-emerald-400" />
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-emerald-400">Email Sent Successfully</h3>
						<p class="text-sm text-emerald-400/80 mt-1">
							If an account with this email exists, you will receive a password reset link shortly.
						</p>
					</div>
				</div>
			</div>

			<div class="space-y-3">
				<p class="text-sm text-neutral-500 text-center">
					Didn't receive the email? Check your spam folder or try again.
				</p>
				<a
					href="/login"
					class="btn-primary w-full block text-center"
				>
					Back to Login
				</a>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<label for="email" class="label">
						Email Address
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="your@email.com"
						required
						class="input"
						disabled={isLoading}
					/>
				</div>

				<div class="flex space-x-3">
					<button
						type="button"
						onclick={goBack}
						class="btn-secondary flex-1 text-center"
					>
						Back
					</button>
					<button
						type="submit"
						disabled={isLoading || !email}
						class="btn-primary flex-1"
					>
						{isLoading ? 'Sending...' : 'Send Reset Link'}
					</button>
				</div>
			</form>
		{/if}
	</div>

	<!-- Security Notice -->
	<div class="text-center text-xs text-neutral-600">
		<p>
			For your security, password reset links expire after 1 hour.
		</p>
	</div>
</div>
