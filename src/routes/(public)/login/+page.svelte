<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { Loader, CircleX } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let isRedirecting = $state(false);
	let turnstileToken = $state<string | null>(null);
	let needsInteraction = $state(false);
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

	async function waitForToken(): Promise<string | null> {
		if (turnstileToken) return turnstileToken;
		const start = Date.now();
		while (!turnstileToken) {
			// Recompute each tick: if interaction kicks in mid-wait, extend the deadline
			const timeoutMs = needsInteraction ? 60000 : 8000;
			if (Date.now() - start >= timeoutMs) break;
			await new Promise((r) => setTimeout(r, 100));
		}
		return turnstileToken;
	}

	async function handleSubmit() {
		if (!email || !password) return;

		isLoading = true;
		const token = await waitForToken();
		if (!token) {
			isLoading = false;
			authStore.state.error = needsInteraction
				? m.auth_security_check_msg()
				: m.auth_verification_timeout();
			return;
		}

		const result = await authStore.login({ email, password, turnstileToken: token });
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
		needsInteraction = false;
	}

	function handleTurnstileError() {
		turnstileToken = null;
	}

	function handleTurnstileExpire() {
		turnstileToken = null;
	}

	function handleBeforeInteractive() {
		needsInteraction = true;
	}
</script>

<svelte:head>
	<title>{m.auth_login_meta_title()}</title>
	<meta name="description" content={m.auth_login_meta_description()} />
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
			<p class="text-base font-semibold text-white mb-1">{m.auth_login_redirect_title()}</p>
			<p class="text-sm text-neutral-500">{m.auth_login_redirect_subtitle()}</p>
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
			{m.auth_login_heading()}
		</h1>
		<p class="text-lg text-neutral-400">
			{m.auth_login_subheading()}
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
				<label for="email" class="label">{m.common_email()}</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="input"
					placeholder={m.auth_email_placeholder()}
				/>
			</div>

			<!-- Password Field -->
			<div class="space-y-2">
				<label for="password" class="label">{m.common_password()}</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="input"
					placeholder={m.auth_password_placeholder_login()}
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
					<label for="remember-me" class="ms-2 block text-sm text-neutral-400">
						{m.auth_remember_me()}
					</label>
				</div>

				<div>
					<a
						href={localizeHref('/forgot-password')}
						class="link text-sm"
					>
						<span>{m.auth_forgot_link()}</span>
						</a>
					</div>
				</div>

				<!-- Cloudflare Turnstile -->
				<div class="flex flex-col items-center gap-2 py-4">
					{#if needsInteraction}
						<p class="text-sm text-amber-400">{m.auth_security_check_msg()}</p>
					{/if}
					<Turnstile
						bind:this={turnstileRef}
						onVerify={handleTurnstileVerify}
						onError={handleTurnstileError}
						onExpire={handleTurnstileExpire}
						onBeforeInteractive={handleBeforeInteractive}
						theme="dark"
						size="normal"
					/>
				</div>

				<!-- Submit Button -->
				<div class="pt-4">
					<button
						type="submit"
						disabled={isLoading || !email || !password}
						class="btn-primary w-full !py-4 !text-base"
					>
						<div class="flex items-center justify-center">
							{#if isLoading}
								<Loader class="animate-spin -ms-1 me-3 h-5 w-5 text-white" />
								{m.auth_login_button_loading()}
							{:else}
								{m.common_signin()}
							{/if}
						</div>
					</button>
			</div>
		</form>

		<!-- Register Link -->
		<div class="relative text-center pt-6">
			<div class="text-sm text-neutral-500">
				{m.auth_no_account()} <a href={localizeHref('/register')} class="link">{m.auth_signup_free_link()}</a>
			</div>
		</div>

		<!-- Legal Links Footer -->
		<div class="relative text-center pt-8 mt-8 border-t border-white/[0.06]">
			<div class="text-xs text-neutral-600 space-x-4">
				<a href={localizeHref('/privacy-policy')} class="hover:text-primary-400 transition-colors">{m.footer_privacy()}</a>
				<span>•</span>
				<a href={localizeHref('/terms-of-service')} class="hover:text-primary-400 transition-colors">{m.footer_terms()}</a>
			</div>
		</div>
	</div>
</div>
