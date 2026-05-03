<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { AlertTriangle, Loader, UserPlus, Check, X } from '@lucide/svelte';

	// Read tracking params from URL
	let referralCode = $derived($page.url.searchParams.get('ref') || undefined);
	let utmSource = $derived($page.url.searchParams.get('utm_source') || undefined);
	let utmMedium = $derived($page.url.searchParams.get('utm_medium') || undefined);
	let utmCampaign = $derived($page.url.searchParams.get('utm_campaign') || undefined);

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let isLoading = $state(false);
	let turnstileToken = $state<string | null>(null);
	let needsInteraction = $state(false);
	let turnstileRef: any;

	// Required acknowledgements (must all be true to enable submit).
	let ageVerified = $state(false);
	let tosAccepted = $state(false);
	let privacyAccepted = $state(false);
	// Optional opt-in (default OFF for GDPR/CAN-SPAM compliance).
	let marketingConsent = $state(false);

	let canSubmit = $derived(
		!!email &&
			!!password &&
			!!confirmPassword &&
			!passwordMismatch &&
			ageVerified &&
			tosAccepted &&
			privacyAccepted
	);

	let passwordMismatch = $derived(password !== confirmPassword && confirmPassword.length > 0);
	let passwordTouched = $derived(password.length > 0);

	let pwRules = $derived([
		{ label: 'At least 8 characters', met: password.length >= 8 },
		{ label: 'One uppercase letter', met: /[A-Z]/.test(password) },
		{ label: 'One lowercase letter', met: /[a-z]/.test(password) },
		{ label: 'One number', met: /[0-9]/.test(password) },
	]);
	let allRulesMet = $derived(pwRules.every(r => r.met));

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

	async function waitForToken(): Promise<string | null> {
		if (turnstileToken) return turnstileToken;
		const start = Date.now();
		while (!turnstileToken) {
			const timeoutMs = needsInteraction ? 60000 : 8000;
			if (Date.now() - start >= timeoutMs) break;
			await new Promise((r) => setTimeout(r, 100));
		}
		return turnstileToken;
	}

	async function handleSubmit() {
		if (!email || !password || !confirmPassword || passwordMismatch) return;
		if (!ageVerified || !tosAccepted || !privacyAccepted) return;

		isLoading = true;
		const token = await waitForToken();
		if (!token) {
			isLoading = false;
			authStore.state.error = needsInteraction
				? 'Please complete the security check below.'
				: 'Verification timed out. Please refresh and try again.';
			return;
		}

		const result = await authStore.register({
			email,
			password,
			name: name || undefined,
			turnstileToken: token,
			referralCode,
			utmSource,
			utmMedium,
			utmCampaign,
			registrationSource: utmSource ? 'ad-campaign' : 'registration-page',
			ageVerified: true,
			tosAccepted: true,
			privacyAccepted: true,
			marketingConsent,
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
		needsInteraction = false;
	}

	function handleTurnstileError() {
		turnstileToken = null;
	}

	function handleBeforeInteractive() {
		needsInteraction = true;
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
		<div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary-500/20 mb-6">
			<UserPlus class="w-7 h-7 text-white" />
		</div>
		<h1 class="text-2xl font-bold text-white">Create your account</h1>
		<p class="text-neutral-500 mt-2">Join EarnMaze and start earning rewards</p>
	</div>

	<!-- Form Card -->
	<div class="card">
		<form onsubmit={handleFormSubmit} class="space-y-5">
			{#if authStore.state.error}
				<div class="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-scale-in">
					<div class="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
						<AlertTriangle class="w-4 h-4 text-rose-400" />
					</div>
					<span class="text-sm font-medium text-rose-400">{authStore.state.error}</span>
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
					Full name <span class="text-neutral-600 font-normal">(optional)</span>
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
					class="input {passwordTouched && !allRulesMet ? 'border-amber-500/30 focus:border-amber-500/50 focus:ring-amber-500/20' : passwordTouched && allRulesMet ? 'border-emerald-500/30 focus:border-emerald-500/50 focus:ring-emerald-500/20' : ''}"
					placeholder="Create a strong password"
				/>
				{#if passwordTouched}
					<div class="mt-2.5 space-y-1.5">
						{#each pwRules as rule}
							<div class="flex items-center gap-2 text-xs transition-all duration-200">
								{#if rule.met}
									<div class="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
										<Check class="w-2.5 h-2.5 text-emerald-400" />
									</div>
									<span class="text-emerald-400 font-medium">{rule.label}</span>
								{:else}
									<div class="w-4 h-4 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
										<X class="w-2.5 h-2.5 text-neutral-600" />
									</div>
									<span class="text-neutral-500">{rule.label}</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
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
					<p class="text-xs text-rose-400 font-medium mt-1.5 flex items-center gap-1">
						<AlertTriangle class="w-3.5 h-3.5" />
						Passwords do not match
					</p>
				{/if}
			</div>

			<!-- Required acknowledgements -->
			<div class="p-4 bg-surface-200 rounded-xl space-y-3">
				<label class="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={ageVerified}
						required
						class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50"
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
						class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50"
					/>
					<span class="text-sm text-neutral-400 leading-relaxed">
						I agree to the
						<a href="/terms-of-service" class="link" target="_blank" rel="noopener">
							Terms of Service
						</a>.
					</span>
				</label>
				<label class="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={privacyAccepted}
						required
						class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50"
					/>
					<span class="text-sm text-neutral-400 leading-relaxed">
						I agree to the
						<a href="/privacy-policy" class="link" target="_blank" rel="noopener">
							Privacy Policy
						</a>.
					</span>
				</label>
			</div>

			<!-- Optional marketing opt-in (UNCHECKED by default per GDPR / DPDP) -->
			<div class="p-4 bg-surface-200 rounded-xl">
				<label class="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={marketingConsent}
						class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50"
					/>
					<span class="text-sm text-neutral-400 leading-relaxed">
						Send me product updates and offers from EarnMaze. You can opt out
						any time.
					</span>
				</label>
			</div>

			<!-- Cloudflare Turnstile -->
			<div class="flex flex-col items-center gap-2">
				{#if needsInteraction}
					<p class="text-sm text-amber-400">Please complete the security check below.</p>
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
			<button
				type="submit"
				disabled={isLoading || !canSubmit}
				class="btn-primary w-full"
			>
				{#if isLoading}
					<Loader class="w-4 h-4 animate-spin" />
					Creating account...
				{:else}
					<UserPlus class="w-4 h-4" />
					Create account
				{/if}
			</button>
		</form>

		<!-- Sign In Link -->
		<div class="mt-6 pt-6 border-t border-white/[0.06]">
			<p class="text-center text-sm text-neutral-500">
				Already have an account?
				<a href="/login" class="link ml-1">Sign in here →</a>
			</p>
		</div>

		<!-- Legal Links Footer -->
		<div class="relative text-center pt-4 mt-4">
			<div class="text-xs text-neutral-600 space-x-4">
				<a href="/privacy-policy" class="hover:text-primary-400 transition-colors">Privacy Policy</a>
				<span>•</span>
				<a href="/terms-of-service" class="hover:text-primary-400 transition-colors">Terms of Service</a>
			</div>
		</div>
	</div>
</div>
