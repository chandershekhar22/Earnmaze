<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Logger } from '$lib/utils/app-logger';
	import { onMount } from 'svelte';
	import { CircleCheck, KeyRound } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

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
			error = m.auth_reset_invalid_token();
			return;
		}

		if (!password || !confirmPassword) {
			error = m.auth_reset_fill_all();
			return;
		}

		if (password.length < 8) {
			error = m.auth_reset_password_min();
			return;
		}

		if (password !== confirmPassword) {
			error = m.auth_passwords_no_match();
			return;
		}

		if (data.requiresConsent && (!ageVerified || !tosAccepted || !privacyAccepted)) {
			error = m.auth_reset_consent_required();
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
				error = result.message || m.auth_reset_failed();
				Logger.root.warn({ context: 'security', error: result.error }, 'Password reset failed');
			}
		} catch (err) {
			error = m.auth_generic_error();
			Logger.root.error({ context: 'errors', error: err }, 'Password reset error');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.auth_reset_meta_title()}</title>
	<meta name="description" content={m.auth_reset_meta_description()} />
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
		<h1 class="text-4xl font-bold text-white mb-2">{m.auth_reset_heading()}</h1>
		<p class="text-neutral-400">
			{m.auth_reset_subheading()}
		</p>
	</div>

	<!-- Form Container -->
	<div class="card">
		{#if tokenInvalid}
			<div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
				<h3 class="text-sm font-medium text-rose-400 mb-2">{m.auth_reset_invalid_link_title()}</h3>
				<p class="text-sm text-rose-400/80 mb-4">
					{m.auth_reset_invalid_link_body()}
				</p>
				<div class="flex space-x-3">
					<a
						href={localizeHref('/login')}
						class="btn-secondary flex-1 text-center"
					>
						{m.auth_back_to_login()}
					</a>
					<a
						href={localizeHref('/forgot-password')}
						class="btn-primary flex-1 text-center"
					>
						{m.auth_reset_request_new_link()}
					</a>
				</div>
			</div>
		{:else if success}
			<div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
				<div class="flex items-start">
					<div class="flex-shrink-0">
						<CircleCheck class="h-5 w-5 text-emerald-400" />
					</div>
					<div class="ms-3">
						<h3 class="text-sm font-medium text-emerald-400">{m.auth_reset_success_title()}</h3>
						<p class="text-sm text-emerald-400/80 mt-1">
							{m.auth_reset_success_body()}
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
						{m.auth_new_password_label()}
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder={m.auth_new_password_placeholder()}
						required
						minlength="8"
						class="input"
						disabled={isLoading}
					/>
					<p class="text-xs text-neutral-600 mt-2">{m.auth_password_min_hint()}</p>
				</div>

				<div>
					<label for="confirmPassword" class="label">
						{m.auth_confirm_password_label()}
					</label>
					<input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder={m.auth_confirm_password_placeholder_reset()}
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
								{m.auth_consent_age()}
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
								{m.auth_consent_tos_prefix()}
								<a href={localizeHref('/terms-of-service')} class="link" target="_blank" rel="noopener">{m.footer_terms()}</a>.
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
								{m.auth_consent_privacy_prefix()}
								<a href={localizeHref('/privacy-policy')} class="link" target="_blank" rel="noopener">{m.footer_privacy()}</a>.
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
								{m.auth_consent_marketing()}
							</span>
						</label>
					</div>
				{/if}

				<div class="flex space-x-3">
					<a
						href={localizeHref('/login')}
						class="btn-secondary flex-1 text-center"
					>
						{m.common_back()}
					</a>
					<button
						type="submit"
						disabled={isLoading || !password || !confirmPassword || (data.requiresConsent && (!ageVerified || !tosAccepted || !privacyAccepted))}
						class="btn-primary flex-1"
					>
						{isLoading ? m.auth_resetting() : (data.requiresConsent ? m.auth_activate_account() : m.auth_reset_button())}
					</button>
				</div>
			</form>
		{/if}
	</div>

	<!-- Security Notice -->
	<div class="text-center text-xs text-neutral-600">
		<p>
			{m.auth_security_link_expiry_notice()}
		</p>
	</div>
</div>
