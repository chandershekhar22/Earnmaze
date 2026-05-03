<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { Logger, Features } from '$lib/utils/app-logger';
	import type { GuestUpgradeStartResponse, GuestUpgradeVerifyResponse } from '$lib/types/guest-session';
	import { AlertTriangle, Check } from '@lucide/svelte';

	// Step tracking
	let currentStep = $state<1 | 2 | 3>(1);

	// Step 1: Send OTP
	let turnstileToken = $state('');
	let needsInteraction = $state(false);
	let turnstileRef = $state<{ reset: () => void } | null>(null);

	async function waitForToken(): Promise<string | null> {
		if (turnstileToken) return turnstileToken;
		const start = Date.now();
		while (!turnstileToken) {
			const timeoutMs = needsInteraction ? 60000 : 8000;
			if (Date.now() - start >= timeoutMs) break;
			await new Promise((r) => setTimeout(r, 100));
		}
		return turnstileToken || null;
	}

	function handleBeforeInteractive() {
		needsInteraction = true;
	}
	let otpExpiresAt = $state<string | null>(null);

	// Step 2: Verify OTP
	let otp = $state('');
	let upgradeToken = $state('');
	let upgradeTokenExpiresAt = $state<string | null>(null);
	let otpAttempts = $state(0);
	let resendCountdown = $state(60);
	let resendInterval: ReturnType<typeof setInterval> | null = null;

	// Step 3: Set password
	let password = $state('');
	// Required acknowledgements at upgrade — same as register form.
	let ageVerified = $state(false);
	let tosAccepted = $state(false);
	let privacyAccepted = $state(false);
	// Optional marketing opt-in (UNCHECKED by default).
	let marketingConsent = $state(false);
	let confirmPassword = $state('');

	// Common
	let isLoading = $state(false);
	let error = $state('');
	let mounted = $state(false);
	let guestEmail = $state('');
	let isPasswordAlreadySet = $state(false);
	let showPasswordSetWarning = $state(false);

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
					// Check if password is already set for this email
					await checkPasswordStatus(result.data.email);
				}
			}
			// If no session exists (401), that's OK - guest can still upgrade from this page
		} catch (err) {
			Logger.root.debug({ context: 'errors', error: err }, 'No active guest session - allowing upgrade from form');
		}
	}

	async function checkPasswordStatus(email: string) {
		try {
			const response = await fetch('/api/guest/upgrade/check-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success && result.data) {
					isPasswordAlreadySet = result.data.hasPassword;
					if (isPasswordAlreadySet) {
						showPasswordSetWarning = true;
						Logger.root.info({ context: 'security', email }, 'User already has password set');
					}
				}
			}
		} catch (err) {
			Logger.root.error({ context: 'errors', error: err }, 'Failed to check password status');
		}
	}

	function handleTurnstileVerify(token: string) {
		turnstileToken = token;
		needsInteraction = false;
		error = '';
	}

	// Step 1: Send OTP
	async function handleSendOtp() {
		isLoading = true;
		error = '';

		const token = await waitForToken();
		if (!token) {
			isLoading = false;
			error = needsInteraction
				? 'Please complete the security check below.'
				: 'Verification timed out. Please refresh and try again.';
			return;
		}

		Logger.root.info({ context: 'security' }, 'Sending OTP for guest upgrade');

		try {
			const response = await fetch('/api/guest/upgrade/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ turnstileToken: token }),
			});

			const result = (await response.json()) as GuestUpgradeStartResponse;

			if (result.success && result.data) {
				Logger.root.info({ context: 'security' }, 'OTP sent successfully');
				Features.trackUserAction('guest-upgrade-otp-sent', 'guest-upgrade');
				otpExpiresAt = result.data.expiresAt;
				currentStep = 2;
				error = '';
				// Token consumed by Cloudflare; reset widget so resend can get a fresh one
				turnstileRef?.reset();
				turnstileToken = '';
				// Set rate limit timer
				resendCountdown = 60;

				// Clear existing interval if any
				if (resendInterval) clearInterval(resendInterval);

				// Countdown timer
				resendInterval = setInterval(() => {
					resendCountdown--;
					if (resendCountdown <= 0) {
						if (resendInterval) clearInterval(resendInterval);
						resendInterval = null;
					}
				}, 1000);
			} else {
				error = result.message || 'Failed to send verification code';
				Logger.root.warn({ context: 'security', error: result.error }, 'Failed to send OTP');
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			Logger.root.error({ context: 'errors', error: err }, 'Send OTP error');
		} finally {
			isLoading = false;
		}
	}

	// Step 2: Verify OTP
	async function handleVerifyOtp() {
		if (!otp || otp.length !== 6) {
			error = 'Please enter a valid 6-digit code';
			return;
		}

		isLoading = true;
		error = '';
		Logger.root.info({ context: 'security' }, 'Verifying OTP');

		try {
			const response = await fetch('/api/guest/upgrade/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ otp }),
			});

			const result = (await response.json()) as GuestUpgradeVerifyResponse;

			if (result.success && result.data) {
				Logger.root.info({ context: 'security' }, 'OTP verified successfully');
				Features.trackUserAction('guest-upgrade-otp-verified', 'guest-upgrade');
				upgradeToken = result.data.upgradeToken;
				upgradeTokenExpiresAt = result.data.expiresAt;
				currentStep = 3;
				error = '';
			} else {
				otpAttempts++;
				error = result.message || 'Invalid verification code';
				Logger.root.warn({ context: 'security', error: result.error }, 'OTP verification failed');
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			Logger.root.error({ context: 'errors', error: err }, 'Verify OTP error');
		} finally {
			isLoading = false;
		}
	}

	// Resend OTP with rate limiting (1 minute between resends)
	async function handleResendOtp() {
		// Only check rate limiting on client side after initial click
		if (resendCountdown > 0) {
			error = `Please wait ${resendCountdown}s before requesting another code`;
			return;
		}

		isLoading = true;
		error = '';

		const token = await waitForToken();
		if (!token) {
			isLoading = false;
			error = needsInteraction
				? 'Please complete the security check below.'
				: 'Verification timed out. Please refresh and try again.';
			return;
		}

		Logger.root.info({ context: 'security' }, 'Resending OTP for guest upgrade');

		try {
			const response = await fetch('/api/guest/upgrade/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ turnstileToken: token }),
			});

			const result = (await response.json()) as GuestUpgradeStartResponse;

			if (result.success && result.data) {
				Logger.root.info({ context: 'security' }, 'OTP resent successfully');
				Features.trackUserAction('guest-upgrade-otp-resent', 'guest-upgrade');
				otpExpiresAt = result.data.expiresAt;
				otp = '';
				otpAttempts = 0;
				error = '';

				// Token consumed; reset widget so the next resend gets a fresh token
				turnstileRef?.reset();
				turnstileToken = '';

				// Set rate limit timer
				resendCountdown = 60;

				// Clear existing interval if any
				if (resendInterval) clearInterval(resendInterval);

				// Countdown timer
				resendInterval = setInterval(() => {
					resendCountdown--;
					if (resendCountdown <= 0) {
						if (resendInterval) clearInterval(resendInterval);
						resendInterval = null;
					}
				}, 1000);
			} else if (result.error === 'RATE_LIMITED') {
				// Backend rate limiting - set countdown based on response
				error = result.message || 'Please wait before requesting another code';
				resendCountdown = 60;

				if (resendInterval) clearInterval(resendInterval);
				resendInterval = setInterval(() => {
					resendCountdown--;
					if (resendCountdown <= 0) {
						if (resendInterval) clearInterval(resendInterval);
						resendInterval = null;
					}
				}, 1000);
			} else {
				error = result.message || 'Failed to resend verification code';
				Logger.root.warn({ context: 'security', error: result.error }, 'Failed to resend OTP');
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			Logger.root.error({ context: 'errors', error: err }, 'Resend OTP error');
		} finally {
			isLoading = false;
		}
	}

	// Step 3: Set password
	async function handleSetPassword() {
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

		if (!ageVerified || !tosAccepted || !privacyAccepted) {
			error = 'Please confirm age and accept the Terms and Privacy Policy';
			return;
		}

		isLoading = true;
		error = '';
		Logger.root.info({ context: 'security' }, 'Setting password and finalizing upgrade');

		try {
			const response = await fetch('/api/guest/upgrade/set-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					upgradeToken,
					password,
					ageVerified: true,
					tosAccepted: true,
					privacyAccepted: true,
					marketingConsent,
				}),
			});

			const result = await response.json();

			if (result.success) {
				Logger.root.info({ context: 'security' }, 'Guest account upgraded successfully');
				Features.trackUserAction('guest-upgrade-success', 'guest-upgrade');

				// Update auth store with upgraded user data
				if (result.user) {
					authStore.state = {
						...authStore.state,
						user: result.user,
						isLoading: false,
						error: null
					};
				}

				// Redirect to surveys dashboard
				goto('/surveys');
			} else {
				error = result.message || 'Failed to create account';
				Logger.root.warn({ context: 'security', error: result.error }, 'Set password failed');
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			Logger.root.error({ context: 'errors', error: err }, 'Set password error');
		} finally {
			isLoading = false;
		}
	}

	function handleBack() {
		if (currentStep === 2) {
			currentStep = 1;
			otp = '';
			error = '';
		} else if (currentStep === 3) {
			currentStep = 2;
			password = '';
			confirmPassword = '';
			error = '';
		} else {
			goto('/guest/dashboard');
		}
	}

	function handleCancel() {
		goto('/guest/dashboard');
	}

	// Check if OTP has expired
	function isOtpExpired(): boolean {
		if (!otpExpiresAt) return false;
		return new Date(otpExpiresAt) < new Date();
	}

	// Check if upgrade token has expired
	function isUpgradeTokenExpired(): boolean {
		if (!upgradeTokenExpiresAt) return false;
		return new Date(upgradeTokenExpiresAt) < new Date();
	}
</script>

<svelte:head>
	<title>Create Account - EarnMaze Panel</title>
	<meta name="description" content="Complete your registration to unlock all features" />
</svelte:head>

<div class="min-h-screen bg-surface flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		{#if !showPasswordSetWarning}
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-4xl font-bold text-white mb-2">Create Your Account</h1>
				<p class="text-neutral-400">
					{#if currentStep === 1}
						Verify your email to get started
					{:else if currentStep === 2}
						Enter the code we sent to your email
					{:else}
						Create a secure password
					{/if}
				</p>
			</div>

			<!-- Step Indicator -->
			<div class="flex justify-between items-center">
				<div class="flex-1 flex flex-col items-center">
					<div class={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors ${
						currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-surface-200 text-neutral-500'
					}`}>
						1
					</div>
					<p class="text-xs mt-2 text-neutral-500">Email</p>
				</div>
				<div class={`flex-1 h-1 mx-2 transition-colors ${currentStep >= 2 ? 'bg-primary-600' : 'bg-surface-200'}`}></div>
				<div class="flex-1 flex flex-col items-center">
					<div class={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors ${
						currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-surface-200 text-neutral-500'
					}`}>
						2
					</div>
					<p class="text-xs mt-2 text-neutral-500">Verify</p>
				</div>
				<div class={`flex-1 h-1 mx-2 transition-colors ${currentStep >= 3 ? 'bg-primary-600' : 'bg-surface-200'}`}></div>
				<div class="flex-1 flex flex-col items-center">
					<div class={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors ${
						currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-surface-200 text-neutral-500'
					}`}>
						3
					</div>
					<p class="text-xs mt-2 text-neutral-500">Password</p>
				</div>
			</div>

			<!-- Benefits Banner -->
			<div class="bg-gradient-to-r from-primary-600 to-violet-600 rounded-2xl p-6 text-white">
				<h3 class="font-bold text-lg mb-3">Full Account Benefits:</h3>
				<ul class="space-y-2 text-sm">
				<li class="flex items-start">
					<Check class="h-5 w-5 mr-2 flex-shrink-0" />
					Save and track all your points permanently
				</li>
				<li class="flex items-start">
					<Check class="h-5 w-5 mr-2 flex-shrink-0" />
					Redeem rewards and gift cards
				</li>
				<li class="flex items-start">
					<Check class="h-5 w-5 mr-2 flex-shrink-0" />
					Access complete survey history
				</li>
				<li class="flex items-start">
					<Check class="h-5 w-5 mr-2 flex-shrink-0" />
					Unlock tier rewards and bonuses
				</li>
			</ul>
		</div>
		{/if}

		<!-- Form Container -->
		<div class="bg-surface-100 rounded-2xl border border-white/[0.06] p-8">
			{#if showPasswordSetWarning}
				<div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							<AlertTriangle class="h-5 w-5 text-amber-400" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-amber-300">Account Already Exists</h3>
							<p class="text-sm text-amber-400/80 mt-1">
								An account with this email already has a password set. Please <a href="/login" class="underline font-semibold hover:text-amber-200">log in with your password</a> instead.
							</p>
						</div>
					</div>
				</div>

				<div class="flex space-x-3 mt-6">
					<button
						type="button"
						onclick={handleCancel}
						class="flex-1 bg-surface-200 text-neutral-400 py-3 px-4 rounded-lg font-semibold hover:bg-white/[0.03] transition-colors"
					>
						Back
					</button>
					<a
						href="/login"
						class="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-500 transition-colors text-center"
					>
						Go to Login
					</a>
				</div>
			{:else}
				{#if error}
					<div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
						<p class="text-sm text-rose-400">{error}</p>
					</div>
				{/if}

			<!-- Step 1: Send OTP -->
			{#if currentStep === 1}
				<div class="space-y-6">
					<div class="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 space-y-2">
						<p class="text-sm text-primary-300">
							We'll send a 6-digit verification code to <strong>{guestEmail}</strong>. Please check your inbox (and spam folder) for the code.
						</p>
						<p class="text-xs text-primary-400/60">
							This will also be the email where you receive your gift cards and account notifications.
						</p>
					</div>

					<div>
						<div class="flex flex-col items-center gap-2">
						{#if needsInteraction}
							<p class="text-sm text-amber-400">Please complete the security check below.</p>
						{/if}
						<Turnstile
							bind:this={turnstileRef}
							onVerify={handleTurnstileVerify}
							onBeforeInteractive={handleBeforeInteractive}
						/>
					</div>
					</div>

					<div class="flex space-x-3">
						<button
							type="button"
							onclick={handleCancel}
							disabled={isLoading || isPasswordAlreadySet}
							class="flex-1 bg-surface-200 text-neutral-400 py-3 px-4 rounded-lg font-semibold hover:bg-white/[0.03] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onclick={handleSendOtp}
							disabled={isLoading || isPasswordAlreadySet}
							class="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isLoading ? 'Sending...' : 'Send Code'}
						</button>
					</div>
				</div>
			{/if}

			<!-- Step 2: Verify OTP -->
			{#if currentStep === 2}
				<div class="space-y-6">
					<div>
						<label for="otp" class="block text-sm font-medium text-neutral-400 mb-2">
							Verification Code
						</label>
						<input
							id="otp"
							type="text"
							bind:value={otp}
							placeholder="000000"
							maxlength="6"
							inputmode="numeric"
							class="input w-full text-center text-2xl tracking-widest"
							disabled={isLoading || isOtpExpired()}
						/>
						<p class="text-xs text-neutral-500 mt-2">Enter the 6-digit code sent to your email</p>
					</div>

					{#if isOtpExpired()}
						<div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
							<p class="text-sm text-rose-400 mb-3">
								Your verification code has expired.
							</p>
							<button
								type="button"
								onclick={handleResendOtp}
								disabled={isLoading || resendCountdown > 0}
								class="w-full bg-rose-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isLoading ? 'Sending...' : resendCountdown > 0 ? `Resend Code (${resendCountdown}s)` : 'Resend Code'}
							</button>
						</div>
					{/if}

					{#if otpAttempts > 0 && otpAttempts < 5}
						<div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
							<p class="text-sm text-amber-400">
								Attempt {otpAttempts} of 5. Please check your code and try again.
							</p>
						</div>
					{/if}

					{#if otpAttempts >= 5}
						<div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
							<p class="text-sm text-amber-400 mb-3">
								Too many failed attempts. Request a new code to continue.
							</p>
							<button
								type="button"
								onclick={handleResendOtp}
								disabled={isLoading || resendCountdown > 0}
								class="w-full bg-amber-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isLoading ? 'Sending...' : resendCountdown > 0 ? `Request New Code (${resendCountdown}s)` : 'Request New Code'}
							</button>
						</div>
					{/if}

					<div class="flex space-x-3">
						<button
							type="button"
							onclick={handleBack}
							disabled={isLoading || isOtpExpired()}
							class="flex-1 bg-surface-200 text-neutral-400 py-3 px-4 rounded-lg font-semibold hover:bg-white/[0.03] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Back
						</button>
						<button
							type="button"
							onclick={handleVerifyOtp}
							disabled={isLoading || !otp || otp.length !== 6 || isOtpExpired() || otpAttempts >= 5}
							class="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isLoading ? 'Verifying...' : 'Verify Code'}
						</button>
					</div>

					{#if otpAttempts < 5}
						<div class="text-center">
							<button
								type="button"
								onclick={handleResendOtp}
								disabled={isLoading || resendCountdown > 0}
								class="text-primary-400 hover:text-primary-300 underline disabled:text-neutral-600"
							>
								{isLoading ? 'Sending...' : resendCountdown > 0 ? `Resend Code (${resendCountdown}s)` : 'Resend Code'}
							</button>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Step 3: Set Password -->
			{#if currentStep === 3}
				<div class="space-y-6">
					{#if isUpgradeTokenExpired()}
						<div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
							<p class="text-sm text-amber-400">
								Your session has expired. Please go back and start over.
							</p>
						</div>
					{/if}

					<div>
						<label for="password" class="block text-sm font-medium text-neutral-400 mb-2">
							Password
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							minlength="8"
							placeholder="At least 8 characters"
							class="input w-full"
							disabled={isLoading || isUpgradeTokenExpired()}
						/>
						<p class="text-xs text-neutral-500 mt-2">Must be at least 8 characters</p>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-neutral-400 mb-2">
							Confirm Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							required
							minlength="8"
							placeholder="Re-enter password"
							class="input w-full"
							disabled={isLoading || isUpgradeTokenExpired()}
						/>
					</div>

					<!-- Required acknowledgements -->
					<div class="p-4 bg-surface-200 rounded-xl space-y-3">
						<label class="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={ageVerified}
								required
								disabled={isLoading || isUpgradeTokenExpired()}
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
								disabled={isLoading || isUpgradeTokenExpired()}
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
								disabled={isLoading || isUpgradeTokenExpired()}
								class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50 flex-shrink-0"
							/>
							<span class="text-sm text-neutral-400 leading-relaxed">
								I agree to the
								<a href="/privacy-policy" class="link" target="_blank" rel="noopener">Privacy Policy</a>.
							</span>
						</label>
					</div>

					<!-- Optional marketing opt-in (UNCHECKED by default) -->
					<div class="p-4 bg-surface-200 rounded-xl">
						<label class="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={marketingConsent}
								disabled={isLoading || isUpgradeTokenExpired()}
								class="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50 flex-shrink-0"
							/>
							<span class="text-sm text-neutral-400 leading-relaxed">
								Send me product updates and offers from EarnMaze. You can opt
								out any time.
							</span>
						</label>
					</div>

					<div class="flex space-x-3">
						<button
							type="button"
							onclick={handleBack}
							disabled={isLoading || isUpgradeTokenExpired()}
							class="flex-1 bg-surface-200 text-neutral-400 py-3 px-4 rounded-lg font-semibold hover:bg-white/[0.03] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Back
						</button>
						<button
							type="button"
							onclick={handleSetPassword}
							disabled={isLoading || !password || !confirmPassword || !ageVerified || !tosAccepted || !privacyAccepted || isUpgradeTokenExpired()}
							class="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isLoading ? 'Creating Account...' : 'Create Account'}
						</button>
					</div>
				</div>
			{/if}
			{/if}
		</div>

		<!-- Security Notice -->
		<div class="text-center text-xs text-neutral-600">
			<p>
				By creating an account, you agree to our Terms of Service and Privacy Policy.
				Your guest session data will be transferred to your new account.
			</p>
		</div>
	</div>
</div>
