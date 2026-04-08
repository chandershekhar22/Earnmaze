<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { Loader, CircleX } from '@lucide/svelte';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let isRedirecting = $state(false);
	let turnstileToken = $state<string | null>(null);
	let turnstileRef: any;

	// Get redirect URL from query params
	let redirectUrl = $derived($page.url.searchParams.get('redirect'));

	onMount(() => {
		// Clear any previous errors
		authStore.clearError();

		// Check if already logged in and redirect
		// Wait for auth check to complete if still loading
		if (!authStore.state.isLoading && authStore.state.user) {
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		}
	});

	// Watch for auth state changes and redirect if user logs in
	$effect(() => {
		if (authStore.state.user && !authStore.state.isLoading) {
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		}
	});

	function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		handleSubmit();
	}

	async function handleSubmit() {
		if (!email || !password) return;

		// Validate Turnstile token
		if (!turnstileToken) {
			authStore.state.error = 'Please complete the CAPTCHA verification';
			return;
		}

		isLoading = true;
		const result = await authStore.login({ email, password, turnstileToken });
		isLoading = false;

		if (result.success && authStore.state.user) {
			isRedirecting = true;
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
			return;
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
	<title>Sign In - EarnMaze</title>
	<meta
		name="description"
		content="Sign in to your EarnMaze account to access your dashboard and start earning rewards."
	/>
</svelte:head>

{#if isRedirecting}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-surface">
		<div class="text-center animate-fade-in">
			<div class="relative w-14 h-14 mx-auto mb-5">
				<div class="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl opacity-20 blur-lg animate-pulse"></div>
				<div class="relative w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
					<svg class="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
				</div>
			</div>
			<p class="text-base font-semibold text-white mb-1">Welcome back!</p>
			<p class="text-sm text-neutral-500">Loading your dashboard...</p>
		</div>
	</div>
{/if}

<div class="w-full max-w-lg space-y-8">
	<!-- Modern Header Section -->
	<div class="text-center space-y-4">
		<div class="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary-500/20">
			<span class="text-2xl text-white font-bold">EM</span>
		</div>
		<h1 class="text-4xl font-bold text-white">
			Welcome back
		</h1>
		<p class="text-lg text-neutral-400">
			Sign in to your EarnMaze account
		</p>
	</div>

	<!-- Modern Form Card -->
	<div class="card">
		<form onsubmit={handleFormSubmit} class="space-y-6">
			{#if authStore.state.error}
				<div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-3">
					<CircleX class="w-5 h-5 flex-shrink-0" />
					<span class="font-medium">{authStore.state.error}</span>
				</div>
			{/if}

			<!-- Email Field -->
			<div class="space-y-2">
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

			<!-- Password Field -->
			<div class="space-y-2">
				<label for="password" class="label">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="input"
					placeholder="Enter your password"
				/>
			</div>

			<!-- Remember Me & Forgot Password -->
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<input
						id="remember-me"
						type="checkbox"
						class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50"
					/>
					<label for="remember-me" class="ml-2 block text-sm text-neutral-400">
						Remember me
					</label>
				</div>

				<div>
					<a
						href="/forgot-password"
						class="link text-sm"
					>
						<span>Forgot password?</span>
						</a>
					</div>
				</div>

				<!-- Cloudflare Turnstile -->
				<div class="flex justify-center py-4">
					<Turnstile
						bind:this={turnstileRef}
						onVerify={handleTurnstileVerify}
						onError={handleTurnstileError}
						onExpire={handleTurnstileExpire}
						theme="dark"
						size="normal"
					/>
				</div>

				<!-- Submit Button -->
				<div class="pt-4">
					<button
						type="submit"
						disabled={isLoading || !email || !password || !turnstileToken}
						class="btn-primary w-full !py-4 !text-base"
					>
						<div class="flex items-center justify-center">
							{#if isLoading}
								<Loader class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
								Signing in...
							{:else}
								Sign in
							{/if}
						</div>
					</button>
			</div>
		</form>

		<!-- Register Link -->
		<div class="relative text-center pt-6">
			<div class="text-sm text-neutral-500">
				Don't have an account? <a href="/register" class="link">Sign up for free →</a>
			</div>
		</div>

		<!-- Legal Links Footer -->
		<div class="relative text-center pt-8 mt-8 border-t border-white/[0.06]">
			<div class="text-xs text-neutral-600 space-x-4">
				<a href="/privacy-policy" class="hover:text-primary-400 transition-colors">Privacy Policy</a>
				<span>•</span>
				<a href="/terms-of-service" class="hover:text-primary-400 transition-colors">Terms of Service</a>
			</div>
		</div>
	</div>
</div>
