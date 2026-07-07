<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import Icon from './Icon.svelte';

	let modalOpen = $state(false);
	let mode = $state<'signin' | 'signup'>('signin');
	let email = $state('');
	let password = $state('');
	let name = $state('');
	let agreedTerms = $state(false);
	let submitting = $state(false);
	let turnstileToken = $state<string | null>(null);
	let turnstileRef: { reset: () => void } | undefined = $state();
	let referralCode = $state('');
	let copyLabel = $state('Copy');

	// Whether the visitor is authenticated decides which modal view shows.
	let signedIn = $derived(!!authStore.state.user);

	let referralLink = $derived(
		referralCode && typeof window !== 'undefined'
			? `${window.location.origin}/register?ref=${referralCode}`
			: ''
	);

	let initials = $derived(deriveInitials(authStore.state.user?.name, authStore.state.user?.email));

	function deriveInitials(fullName?: string, mail?: string) {
		const src = (fullName || mail || '').trim();
		if (!src) return '?';
		const parts = src.split(/[\s@._-]+/).filter(Boolean);
		const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : src.slice(0, 2);
		return letters.toUpperCase();
	}

	async function openModal() {
		modalOpen = true;
		authStore.clearError();
		// Detect an existing session so returning members skip the auth gate.
		if (!authStore.state.user) await authStore.checkAuth();
		if (authStore.state.user && !referralCode) loadReferralCode();
	}

	function closeModal() {
		modalOpen = false;
	}

	function switchMode(next: 'signin' | 'signup') {
		mode = next;
		authStore.clearError();
	}

	async function loadReferralCode() {
		try {
			const res = await fetch('/api/panelist/referral');
			if (res.ok) {
				const data = await res.json();
				referralCode = data.referralCode ?? '';
			}
		} catch {
			// Non-fatal — the modal still works, the link field just stays empty.
		}
	}

	async function submitAuth(e: SubmitEvent) {
		e.preventDefault();
		if (submitting || !turnstileToken) return;
		if (mode === 'signup' && !agreedTerms) return;
		submitting = true;
		const result =
			mode === 'signin'
				? await authStore.login({ email, password, turnstileToken })
				: await authStore.register({
						email,
						password,
						name,
						turnstileToken,
						registrationSource: 'refer-earn-modal',
						ageVerified: true,
						tosAccepted: true,
						privacyAccepted: true
					});
		submitting = false;

		if (result.success) {
			password = '';
			await loadReferralCode();
		} else {
			// The token is single-use; reset it so the user can retry.
			turnstileRef?.reset();
			turnstileToken = null;
		}
	}

	async function signOut() {
		await authStore.logout();
		referralCode = '';
		turnstileToken = null;
	}

	function copyLink() {
		if (!referralLink || !navigator.clipboard) return;
		navigator.clipboard.writeText(referralLink);
		copyLabel = 'Copied';
		setTimeout(() => (copyLabel = 'Copy'), 1800);
	}

	function shareX() {
		if (!referralLink) return;
		const text = encodeURIComponent('Join me on Earnmaze and we both get paid 🎉');
		const url = encodeURIComponent(referralLink);
		window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener');
	}

	async function shareNative() {
		if (!referralLink) return;
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'Earnmaze',
					text: 'Join me on Earnmaze',
					url: referralLink
				});
				return;
			} catch {
				// cancelled or unsupported — fall back to copying
			}
		}
		copyLink();
	}
</script>

<svelte:window onkeydown={(e) => modalOpen && e.key === 'Escape' && closeModal()} />

<!-- Floating Refer & Earn button -->
<button class="re-fab" onclick={openModal} aria-label="Refer and earn">
	<span class="re-fab-ico"><Icon name="gift" class="i-lg i" /></span>
	<span class="re-fab-label">Refer<br />&amp; Earn</span>
</button>

<!-- Modal -->
<div class="re-overlay" class:open={modalOpen}>
	<button type="button" class="re-backdrop" aria-label="Close" onclick={closeModal}></button>
	<div class="re-modal" role="dialog" aria-modal="true" aria-label="Refer and earn">
		<button class="re-close" onclick={closeModal} aria-label="Close">
			<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				><path d="M6 6l12 12M18 6L6 18" /></svg
			>
		</button>

		{#if signedIn}
			<!-- Invite view -->
			<span class="re-eyebrow"><span class="re-dot"></span>Your invite link</span>
			<h3 class="re-title">Share Earnmaze, get paid</h3>
			<p class="re-sub">Both of you earn when your friend joins and reaches their first payout.</p>

			<div class="re-account">
				<span class="re-avatar">{initials}</span>
				<div class="re-account-info">
					<strong>Signed in</strong>
					<span>{authStore.state.user?.email}</span>
				</div>
				<button type="button" class="re-signout" onclick={signOut}>Sign out</button>
			</div>

			<span class="re-label">Your referral link</span>
			<div class="re-link-row">
				<input class="re-link" value={referralLink} readonly aria-label="Your referral link" />
				<button type="button" class="re-copy" onclick={copyLink}>{copyLabel}</button>
			</div>

			<span class="re-label">Share via</span>
			<div class="re-share">
				<button type="button" class="re-share-btn" onclick={shareX}><Icon name="x" /> X</button>
				<button type="button" class="re-share-btn" onclick={shareNative}
					><Icon name="ig" /> Story</button
				>
				<button type="button" class="re-share-btn" onclick={shareNative}
					><Icon name="globe" /> Link</button
				>
			</div>

			<div class="re-reward">
				<span class="re-reward-ico"><Icon name="gift" class="i-lg i" /></span>
				<div>
					<strong>Earn 5,000 pts per friend</strong>
					<span>They get 1,000 pts to start. No limit on invites.</span>
				</div>
			</div>
		{:else}
			<!-- Auth gate view -->
			<span class="re-eyebrow"><span class="re-dot"></span>Invite &amp; earn</span>
			<h3 class="re-title">
				{mode === 'signin' ? 'Sign in to refer friends' : 'Sign up to refer friends'}
			</h3>
			<p class="re-sub">
				You'll need an account to send invites and collect your referral rewards.
			</p>

			<div class="re-tabs">
				<button
					type="button"
					class="re-tab"
					class:active={mode === 'signin'}
					onclick={() => switchMode('signin')}>Sign in</button
				>
				<button
					type="button"
					class="re-tab"
					class:active={mode === 'signup'}
					onclick={() => switchMode('signup')}>Sign up</button
				>
			</div>

			<form onsubmit={submitAuth}>
				{#if authStore.state.error}
					<div class="re-error">{authStore.state.error}</div>
				{/if}

				{#if mode === 'signup'}
					<span class="re-label">Name</span>
					<input
						class="re-field"
						type="text"
						bind:value={name}
						placeholder="Your name"
						autocomplete="name"
						aria-label="Name"
						required
					/>
				{/if}

				<span class="re-label">Email</span>
				<input
					class="re-field"
					type="email"
					bind:value={email}
					placeholder="you@email.com"
					autocomplete="email"
					aria-label="Email"
					required
				/>

				<span class="re-label">Password</span>
				<input
					class="re-field"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
					aria-label="Password"
					required
				/>

				{#if mode === 'signup'}
					<label class="re-consent">
						<input type="checkbox" bind:checked={agreedTerms} required />
						<span>
							I am 18 or older and agree to the
							<a href="/terms" target="_blank" rel="noopener">Terms</a> and
							<a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.
						</span>
					</label>
				{/if}

				<div class="re-turnstile">
					<Turnstile
						bind:this={turnstileRef}
						onVerify={(t: string) => (turnstileToken = t)}
						onError={() => (turnstileToken = null)}
						onExpire={() => (turnstileToken = null)}
						theme="dark"
						size="normal"
					/>
				</div>

				<button
					type="submit"
					class="re-submit"
					disabled={submitting ||
						!email ||
						!password ||
						!turnstileToken ||
						(mode === 'signup' && (!name || !agreedTerms))}
				>
					{submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
					{#if !submitting}<Icon name="arrow" />{/if}
				</button>
			</form>
			<p class="re-note">Free forever. No credit card. US members only.</p>
		{/if}
	</div>
</div>

<style>
	/* Floating action button — its own rewards identity, distinct from the lime UI */
	.re-fab {
		position: fixed;
		right: 24px;
		bottom: 24px;
		z-index: 1400;
		width: 92px;
		height: 92px;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		color: #fff;
		/* violet → magenta → amber */
		background: linear-gradient(145deg, #7c3aed 0%, #d61f9c 52%, #f59e0b 100%);
		box-shadow:
			0 14px 40px -8px rgba(214, 31, 156, 0.55),
			0 4px 18px -6px rgba(124, 58, 237, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.35);
		transition:
			transform 0.2s var(--ease),
			box-shadow 0.2s var(--ease);
	}
	/* Glossy inner highlight */
	.re-fab::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: radial-gradient(
			120% 80% at 50% 10%,
			rgba(255, 255, 255, 0.45),
			rgba(255, 255, 255, 0) 58%
		);
		pointer-events: none;
	}
	/* Magenta pulse ring */
	.re-fab::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		box-shadow: 0 0 0 0 rgba(214, 31, 156, 0.5);
		animation: rePulse 2.4s var(--ease) infinite;
		pointer-events: none;
	}
	@keyframes rePulse {
		0% {
			box-shadow: 0 0 0 0 rgba(214, 31, 156, 0.5);
		}
		70% {
			box-shadow: 0 0 0 18px rgba(214, 31, 156, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(214, 31, 156, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.re-fab::after {
			animation: none;
		}
	}
	.re-fab:hover {
		transform: translateY(-3px) scale(1.03);
		box-shadow:
			0 20px 50px -8px rgba(214, 31, 156, 0.7),
			0 6px 22px -6px rgba(124, 58, 237, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.35);
	}
	/* Keep icon + label crisp above the glossy highlight */
	.re-fab-ico {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		color: #fff;
	}
	.re-fab-label {
		position: relative;
		z-index: 1;
		font-size: 10px;
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-align: center;
	}
	@media (max-width: 560px) {
		.re-fab {
			width: 76px;
			height: 76px;
			right: 16px;
			bottom: 16px;
		}
	}

	/* Overlay + modal */
	.re-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(3px);
		-webkit-backdrop-filter: blur(3px);
		z-index: 2100;
		display: grid;
		place-items: center;
		padding: 20px;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s;
	}
	.re-overlay.open {
		opacity: 1;
		pointer-events: auto;
	}
	.re-backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background: transparent;
		border: 0;
		padding: 0;
		margin: 0;
		cursor: default;
	}
	.re-modal {
		position: relative;
		z-index: 1;
		width: 460px;
		max-width: 100%;
		max-height: 90vh;
		max-height: 90dvh;
		overflow-y: auto;
		background: var(--bg2);
		border: 1px solid var(--line);
		border-radius: var(--r4);
		padding: 28px;
		transform: scale(0.96) translateY(8px);
		transition: transform 0.3s var(--ease);
	}
	.re-overlay.open .re-modal {
		transform: scale(1) translateY(0);
	}
	.re-close {
		position: absolute;
		top: 22px;
		right: 22px;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.04);
		display: grid;
		place-items: center;
		color: var(--t2);
		transition: 0.2s;
	}
	.re-close:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--t1);
	}

	.re-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: var(--acc-d);
	}
	.re-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--acc);
		box-shadow: 0 0 0 3px var(--acc-soft);
	}
	.re-title {
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.02em;
		margin: 12px 0 6px;
	}
	.re-sub {
		font-size: 14px;
		color: var(--t2);
		line-height: 1.5;
		max-width: 36ch;
	}

	.re-label {
		display: block;
		font-family: var(--mono);
		font-size: 10.5px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: var(--t3);
		margin: 22px 0 10px;
	}

	/* Auth tabs */
	.re-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		padding: 5px;
		margin-top: 22px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--line);
		border-radius: var(--r2);
	}
	.re-tab {
		padding: 10px 14px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		color: var(--t2);
		transition: 0.2s;
	}
	.re-tab:hover:not(.active) {
		color: var(--t1);
	}
	.re-tab.active {
		background: var(--acc);
		color: var(--acc-text);
	}

	/* Form fields */
	.re-field {
		width: 100%;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--line);
		border-radius: var(--r2);
		padding: 13px 15px;
		color: var(--t1);
		font-family: var(--f);
		font-size: 14px;
		transition: border-color 0.2s;
	}
	.re-field::placeholder {
		color: var(--t3);
	}
	.re-field:focus {
		outline: none;
		border-color: var(--acc);
		background: rgba(255, 255, 255, 0.05);
	}
	.re-consent {
		display: flex;
		align-items: flex-start;
		gap: 9px;
		margin-top: 16px;
		font-size: 12.5px;
		line-height: 1.4;
		color: rgba(255, 255, 255, 0.7);
	}
	.re-consent input {
		margin-top: 2px;
		accent-color: #b06bff;
	}
	.re-consent a {
		color: #b06bff;
		text-decoration: underline;
	}
	.re-turnstile {
		display: flex;
		justify-content: center;
		margin-top: 18px;
		min-height: 65px;
	}
	.re-submit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		margin-top: 18px;
		padding: 15px 28px;
		border-radius: var(--r5);
		background: var(--acc);
		color: var(--acc-text);
		font-weight: 600;
		font-size: 15px;
		transition: background 0.2s var(--ease);
	}
	.re-submit:hover:not(:disabled) {
		background: var(--acc-d);
	}
	.re-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.re-note {
		text-align: center;
		font-size: 12px;
		color: var(--t3);
		margin-top: 14px;
	}
	.re-error {
		padding: 11px 14px;
		margin-bottom: 14px;
		background: rgba(255, 122, 138, 0.08);
		border: 1px solid rgba(255, 122, 138, 0.22);
		border-radius: var(--r2);
		font-size: 13px;
		color: var(--bad);
	}

	/* Invite view */
	.re-account {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 22px;
		padding: 14px 16px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--line);
		border-radius: var(--r2);
	}
	.re-avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--acc);
		color: var(--acc-text);
		display: grid;
		place-items: center;
		font-family: var(--mono);
		font-size: 13px;
		font-weight: 600;
		flex-shrink: 0;
	}
	.re-account-info {
		flex: 1;
		min-width: 0;
	}
	.re-account-info strong {
		display: block;
		font-size: 14px;
		font-weight: 600;
	}
	.re-account-info span {
		display: block;
		font-size: 12px;
		color: var(--t3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.re-signout {
		font-size: 13px;
		color: var(--t2);
		white-space: nowrap;
		transition: color 0.2s;
	}
	.re-signout:hover {
		color: var(--t1);
	}

	.re-link-row {
		display: flex;
		gap: 8px;
	}
	.re-link {
		flex: 1;
		min-width: 0;
		padding: 14px 16px;
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: var(--r2);
		font-family: var(--mono);
		font-size: 13px;
		color: var(--acc);
		outline: none;
	}
	.re-link:focus {
		border-color: var(--line2);
	}
	.re-copy {
		padding: 0 22px;
		background: var(--acc);
		color: var(--acc-text);
		border-radius: var(--r2);
		font-weight: 600;
		font-size: 13px;
	}
	.re-copy:hover {
		background: var(--acc-d);
	}

	.re-share {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.re-share-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		padding: 11px 12px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--line);
		border-radius: var(--r2);
		font-size: 13px;
		font-weight: 500;
		color: var(--t2);
		transition: 0.2s;
	}
	.re-share-btn:hover {
		color: var(--t1);
		border-color: var(--line2);
	}

	.re-reward {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 22px;
		padding: 16px 18px;
		background: var(--acc-soft);
		border: 1px solid rgba(199, 244, 99, 0.32);
		border-radius: var(--r2);
	}
	.re-reward-ico {
		width: 42px;
		height: 42px;
		border-radius: 11px;
		background: var(--acc);
		color: var(--acc-text);
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}
	.re-reward strong {
		display: block;
		font-size: 14px;
		font-weight: 600;
	}
	.re-reward span {
		display: block;
		font-size: 13px;
		color: var(--t2);
		margin-top: 2px;
	}
</style>
