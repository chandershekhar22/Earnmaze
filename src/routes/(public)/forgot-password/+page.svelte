<script lang="ts">
	import { Logger } from '$lib/utils/app-logger';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { CircleCheck, KeyRound } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

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
			error = m.auth_forgot_email_required();
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
				error = result.message || m.auth_forgot_request_failed();
				Logger.root.warn({ context: 'security', email, error: result.error }, 'Forgot password request failed');
			}
		} catch (err) {
			error = m.auth_generic_error();
			Logger.root.error({ context: 'errors', error: err }, 'Forgot password error');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.auth_forgot_meta_title()}</title>
	<meta name="description" content={m.auth_forgot_meta_description()} />
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
		<h1 class="text-4xl font-bold text-white mb-2">{m.auth_forgot_heading()}</h1>
		<p class="text-neutral-400">
			{m.auth_forgot_subheading()}
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
					<div class="ms-3">
						<h3 class="text-sm font-medium text-emerald-400">{m.auth_forgot_sent_title()}</h3>
						<p class="text-sm text-emerald-400/80 mt-1">
							{m.auth_forgot_sent_body()}
						</p>
					</div>
				</div>
			</div>

			<div class="space-y-3">
				<p class="text-sm text-neutral-500 text-center">
					{m.auth_forgot_didnt_receive()}
				</p>
				<a
					href={localizeHref('/login')}
					class="btn-primary w-full block text-center"
				>
					{m.auth_back_to_login()}
				</a>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<label for="email" class="label">
						{m.auth_email_address_label()}
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder={m.auth_forgot_email_placeholder()}
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
						{m.common_back()}
					</button>
					<button
						type="submit"
						disabled={isLoading || !email}
						class="btn-primary flex-1"
					>
						{isLoading ? m.auth_forgot_sending() : m.auth_forgot_send_button()}
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
