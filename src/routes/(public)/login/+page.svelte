<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
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
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
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
	<title>Sign In - EarnMaze</title>
	<meta
		name="description"
		content="Sign in to your EarnMaze account to access your dashboard and start earning rewards."
	/>
</svelte:head>

<div class="w-full max-w-lg space-y-8">
	<!-- Modern Header Section -->
	<div class="text-center space-y-4">
		<div class="w-16 h-16 bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
			<span class="text-2xl text-white font-bold">EM</span>
		</div>
		<h1 class="text-4xl font-bold text-neutral-900">
			Welcome back
		</h1>
		<p class="text-lg text-neutral-600">
			Sign in to your EarnMaze account
		</p>
	</div>

	<!-- Modern Form Card -->
	<div class="bg-white border border-neutral-200 rounded-3xl p-8 space-y-6">
		<form onsubmit={handleFormSubmit} class="space-y-6">
			{#if authStore.state.error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
					<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
					</svg>
					<span class="font-medium">{authStore.state.error}</span>
				</div>
			{/if}

			<!-- Email Field -->
			<div class="space-y-2">
				<label for="email" class="block text-sm font-medium text-neutral-700">Email address</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-neutral-900 placeholder-neutral-400"
					placeholder="you@example.com"
				/>
			</div>

			<!-- Password Field -->
			<div class="space-y-2">
				<label for="password" class="block text-sm font-medium text-neutral-700">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-neutral-900 placeholder-neutral-400"
					placeholder="Enter your password"
				/>
			</div>

			<!-- Remember Me & Forgot Password -->
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<input
						id="remember-me"
						type="checkbox"
						class="h-4 w-4 text-violet-600 focus:ring-violet-500 border-neutral-300 rounded"
					/>
					<label for="remember-me" class="ml-2 block text-sm text-neutral-700">
						Remember me
					</label>
				</div>

				<div>
					<a
						href="/forgot-password"
						class="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
					>
						<span
								>Forgot password?</span
							>
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
						theme="auto"
						size="normal"
					/>
				</div>

				<!-- Submit Button -->
				<div class="pt-4">
					<button
						type="submit"
						disabled={isLoading || !email || !password || !turnstileToken}
						class="group relative w-full overflow-hidden bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 transform hover:scale-[1.02] hover:shadow-3xl"
					>
						<div
							class="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
						></div>
						<div class="relative flex items-center justify-center">
							{#if isLoading}
								<svg
									class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Signing in...
							{:else}
								<span class="flex items-center">
									<span class="mr-2">✨</span>
									Sign in
								</span>
							{/if}
						</div>
					</button>
			</div>			
		</form>

		<!-- Register Link -->
		<div class="relative text-center pt-6">
			<div class="text-sm text-neutral-600">
				Don't have an account? <a href="/register" class="font-medium text-violet-600 hover:text-violet-700 transition-colors">Sign up for free →</a>
			</div>
		</div>

		<!-- Legal Links Footer -->
		<div class="relative text-center pt-8 mt-8 border-t border-neutral-200">
			<div class="text-xs text-neutral-500 space-x-4">
				<a href="/privacy-policy" class="hover:text-violet-600 transition-colors">Privacy Policy</a>
				<span>•</span>
				<a href="/terms-of-service" class="hover:text-violet-600 transition-colors">Terms of Service</a>
			</div>
		</div>
	</div>
</div>
