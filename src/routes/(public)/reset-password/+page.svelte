<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Logger } from '$lib/utils/app-logger';
	import { onMount } from 'svelte';
	import { CircleCheck, KeyRound } from '@lucide/svelte';

	let { data }: { data: { requiresConsent: boolean; tokenValid: boolean } } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state(false);
	let tokenInvalid = $state(false);
	let mounted = $state(false);

	// Only collected when this reset is also a first-time activation
	// (guest converting via /forgot-password). Existing panelists skip these.
	let ageVerified = $state(false);
	let tosAccepted = $state(false);
	let privacyAccepted = $state(false);
	let marketingConsent = $state(false);

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

		if (data.requiresConsent && (!ageVerified || !tosAccepted || !privacyAccepted)) {
			error = 'Please confirm age and accept the Terms and Privacy Policy';
			return;
		}

		isLoading = true;
		error = '';
		Logger.root.info({ context: 'security' }, 'Password reset submitted');

		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					token,
					password,
					...(data.requiresConsent && {
						ageVerified: true,
						tosAccepted: true,
						privacyAccepted: true,
						marketingConsent,
					}),
				}),
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

<div class="w-full max-w-md space-y-8">
	<!-- Logo -->
	<div class="flex justify-center">
		<div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
			<KeyRound class="w-7 h-7 text-white" />
		</div>
	</div>

	<!-- Header -->
	<div class="text-center">
		<h1 class="text-4xl font-bold text-white mb-2">Reset Password</h1>
		<p class="text-neutral-400">
			Create a new secure password for your account.
		</p>
	</div>

	<!-- Form Container -->
	<div class="card">
		{#if tokenInvalid}
			<div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
				<h3 class="text-sm font-medium text-rose-400 mb-2">Invalid Reset Link</h3>
				<p class="text-sm text-rose-400/80 mb-4">
					The reset link is invalid or has expired. Please request a new one.
				</p>
				<div class="flex space-x-3">
					<a
						href="/login"
						class="btn-secondary flex-1 text-center"
					>
						Back to Login
					</a>
					<a
						href="/forgot-password"
						class="btn-primary flex-1 text-center"
					>
						Request New Link
					</a>
				</div>
			</div>
		{:else if success}
			<div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
				<div class="flex items-start">
					<div class="flex-shrink-0">
						<CircleCheck class="h-5 w-5 text-emerald-400" />
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-emerald-400">Password Reset Successful</h3>
						<p class="text-sm text-emerald-400/80 mt-1">
							Your password has been reset. Redirecting to login...
						</p>
					</div>
				</div>
			</div>
		{:else}
			{#if error}
				<div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
					<p class="text-sm text-rose-400">{error}</p>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<label for="password" class="label">
						New Password
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="At least 8 characters"
						required
						minlength="8"
						class="input"
						disabled={isLoading}
					/>
					<p class="text-xs text-neutral-600 mt-2">Must be at least 8 characters</p>
				</div>

				<div>
					<label for="confirmPassword" class="label">
						Confirm Password
					</label>
					<input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder="Re-enter password"
						required
						minlength="8"
						class="input"
						disabled={isLoading}
					/>
				</div>

				{#if data.requiresConsent}
					<!-- First-time activation via forgot-password flow.
					     Same required checkboxes as /register and /guest/upgrade. -->
					<div class="p-4 bg-surface-200 rounded-xl space-y-3">
						<label class="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={ageVerified}
								required
								disabled={isLoading}
								class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50 flex-shrink-0"
							/>
							<span class="text-sm text-neutral-400 leading-relaxed">
								I confirm I am at least 18 years old.
							</span>
						</label>
						<label class="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={tosAccepted}
								required
								disabled={isLoading}
								class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50 flex-shrink-0"
							/>
							<span class="text-sm text-neutral-400 leading-relaxed">
								I agree to the
								<a href="/terms-of-service" class="link" target="_blank" rel="noopener">Terms of Service</a>.
							</span>
						</label>
						<label class="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={privacyAccepted}
								required
								disabled={isLoading}
								class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50 flex-shrink-0"
							/>
							<span class="text-sm text-neutral-400 leading-relaxed">
								I agree to the
								<a href="/privacy-policy" class="link" target="_blank" rel="noopener">Privacy Policy</a>.
							</span>
						</label>
					</div>

					<div class="p-4 bg-surface-200 rounded-xl">
						<label class="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={marketingConsent}
								disabled={isLoading}
								class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50 flex-shrink-0"
							/>
							<span class="text-sm text-neutral-400 leading-relaxed">
								Send me product updates and offers from EarnMaze. You can opt
								out any time.
							</span>
						</label>
					</div>
				{/if}

				<div class="flex space-x-3">
					<a
						href="/login"
						class="btn-secondary flex-1 text-center"
					>
						Back
					</a>
					<button
						type="submit"
						disabled={isLoading || !password || !confirmPassword || (data.requiresConsent && (!ageVerified || !tosAccepted || !privacyAccepted))}
						class="btn-primary flex-1"
					>
						{isLoading ? 'Resetting...' : (data.requiresConsent ? 'Activate Account' : 'Reset Password')}
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
