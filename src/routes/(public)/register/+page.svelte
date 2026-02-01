<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let isLoading = $state(false);
	let turnstileToken = $state<string | null>(null);
	let turnstileRef: any;
	
	let passwordMismatch = $derived(password !== confirmPassword && confirmPassword.length > 0);

	onMount(() => {
		authStore.clearError();

		if (!authStore.state.isLoading && authStore.state.user) {
			const targetUrl = getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		}
	});

	// Watch for auth state changes and redirect if user logs in
	$effect(() => {
		if (authStore.state.user && !authStore.state.isLoading) {
			const targetUrl = getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		}
	});

	function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		handleSubmit();
	}

	async function handleSubmit() {
		if (!email || !password || !confirmPassword || passwordMismatch) return;
		
		// Validate Turnstile token
		if (!turnstileToken) {
			authStore.state.error = 'Please complete the CAPTCHA verification';
			return;
		}

		isLoading = true;
		const result = await authStore.register({
			email,
			password,
			name: name || undefined,
			turnstileToken
		});
		isLoading = false;

		if (result.success && authStore.state.user) {
			const targetUrl = getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		} else {
			// Reset Turnstile on error
			turnstileRef?.reset();
			turnstileToken = null;
		}
	}
	
	function handleTurnstileVerify(token: string) {
		turnstileToken = token;
	}
	
	function handleTurnstileError() {
		turnstileToken = null;
	}
	
	function handleTurnstileExpire() {
		turnstileToken = null;
	}
</script>

<svelte:head>
	<title>Sign Up - EarnMaze Panel</title>
	<meta
		name="description"
		content="Create your EarnMaze account and start earning rewards by participating in surveys."
	/>
</svelte:head>

<div class="w-full max-w-md space-y-8 animate-fade-in">
	<!-- Header -->
	<div class="text-center">
		<div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-glow mb-6">
			<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
			</svg>
		</div>
		<h1 class="text-2xl font-bold text-neutral-900">Create your account</h1>
		<p class="text-neutral-500 mt-2">Join EarnMaze and start earning rewards</p>
	</div>

	<!-- Form Card -->
	<div class="card">
		<form onsubmit={handleFormSubmit} class="space-y-5">
			{#if authStore.state.error}
				<div class="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl animate-scale-in">
					<div class="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
						<svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<span class="text-sm font-medium text-rose-700">{authStore.state.error}</span>
				</div>
			{/if}

			<!-- Email Field -->
			<div>
				<label for="email" class="label">Email address</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="input"
					placeholder="you@example.com"
				/>
			</div>

			<!-- Name Field -->
			<div>
				<label for="name" class="label">
					Full name <span class="text-neutral-400 font-normal">(optional)</span>
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					class="input"
					placeholder="John Doe"
				/>
			</div>

			<!-- Password Field -->
			<div>
				<label for="password" class="label">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="input"
					placeholder="Create a strong password"
				/>
			</div>

			<!-- Confirm Password Field -->
			<div>
				<label for="confirmPassword" class="label">Confirm password</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					required
					class="input {passwordMismatch ? 'input-error' : ''}"
					placeholder="Confirm your password"
				/>
				{#if passwordMismatch}
					<p class="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						Passwords do not match
					</p>
				{/if}
			</div>

			<!-- Terms and Conditions -->
			<div class="p-4 bg-neutral-50 rounded-xl">
				<label class="flex items-start gap-3 cursor-pointer">
					<input
						id="terms"
						type="checkbox"
						required
						class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
					/>
					<span class="text-sm text-neutral-600 leading-relaxed">
						I agree to the
						<a href="/terms-of-service" class="link">Terms of Service</a>
						and
						<a href="/privacy-policy" class="link">Privacy Policy</a>
					</span>
				</label>
			</div>

			<!-- Cloudflare Turnstile -->
			<div class="flex justify-center">
				<Turnstile
					bind:this={turnstileRef}
					onVerify={handleTurnstileVerify}
					onError={handleTurnstileError}
					onExpire={handleTurnstileExpire}
					theme="auto"
					size="normal"
				/>
			</div>

			<!-- Submit Button -->
			<button
				type="submit"
				disabled={isLoading || !email || !password || !confirmPassword || passwordMismatch || !turnstileToken}
				class="btn-primary w-full"
			>
				{#if isLoading}
					<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Creating account...
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
					</svg>
					Create account
				{/if}
			</button>
		</form>

		<!-- Sign In Link -->
		<div class="mt-6 pt-6 border-t border-neutral-200">
			<p class="text-center text-sm text-neutral-500">
				Already have an account?
				<a href="/login" class="link ml-1">Sign in here →</a>
			</p>
		</div>

		<!-- Legal Links Footer -->
		<div class="relative text-center pt-4 mt-4">
			<div class="text-xs text-neutral-500 space-x-4">
				<a href="/privacy-policy" class="hover:text-violet-600 transition-colors">Privacy Policy</a>
				<span>•</span>
				<a href="/terms-of-service" class="hover:text-violet-600 transition-colors">Terms of Service</a>
			</div>
		</div>
	</div>
</div>
