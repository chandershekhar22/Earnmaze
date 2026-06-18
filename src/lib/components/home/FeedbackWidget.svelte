<script lang="ts">
	import Icon from './Icon.svelte';

	const ratings = ['😞', '😕', '😐', '🙂', '😍'];
	const topics = ['Payouts', 'Quizzes & games', 'Surveys', "Something's broken", 'Idea / request'];

	let open = $state(false);
	let rating = $state<number | null>(null);
	let topic = $state<string | null>(null);
	let message = $state('');
	let email = $state('');
	let submitting = $state(false);
	let sent = $state(false);

	function openModal() {
		open = true;
	}

	function closeModal() {
		open = false;
		// Reset after the close transition so the form resets out of view.
		setTimeout(() => {
			if (open) return;
			rating = null;
			topic = null;
			message = '';
			email = '';
			sent = false;
		}, 350);
	}

	async function submitFeedback(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		submitting = true;
		try {
			await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					rating: rating !== null ? rating + 1 : null,
					topic,
					message: message.trim(),
					email: email.trim() || null
				})
			});
			sent = true;
		} catch {
			// Still show the thank-you state — feedback should never feel broken.
			sent = true;
		} finally {
			submitting = false;
			if (sent) setTimeout(closeModal, 2000);
		}
	}
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && closeModal()} />

<!-- Feedback tab -->
<button class="fb-tab" onclick={openModal} aria-label="Send feedback">
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
		><path
			d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"
		/></svg
	>
	<span class="fb-tab-text">Feedback</span>
</button>

<!-- Feedback modal -->
<div class="fb-overlay" class:open>
	<button type="button" class="fb-backdrop" aria-label="Close feedback" onclick={closeModal}
	></button>
	<div class="fb-modal" role="dialog" aria-modal="true" aria-label="Send feedback">
		{#if sent}
			<div class="fb-success">
				<div class="fb-check">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg
					>
				</div>
				<h3>Thanks for the feedback!</h3>
				<p class="fb-sub">
					It just landed with our team. We appreciate you helping make Earnmaze better.
				</p>
			</div>
		{:else}
			<div class="fb-top">
				<div>
					<span class="eyebrow acc"><span class="dot"></span>Feedback</span>
					<h3>How's your experience?</h3>
					<p class="fb-sub">Tell us what's working and what we can do better.</p>
				</div>
				<button class="notif-close" onclick={closeModal} aria-label="Close feedback">
					<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
						><path d="M6 6l12 12M18 6L6 18" /></svg
					>
				</button>
			</div>
			<form onsubmit={submitFeedback}>
				<span class="fb-label">Your rating</span>
				<div class="fb-ratings">
					{#each ratings as emoji, i (i)}
						<button
							type="button"
							class="fb-rate"
							class:active={rating === i}
							onclick={() => (rating = i)}
							aria-label="Rating {i + 1} of 5">{emoji}</button
						>
					{/each}
				</div>

				<span class="fb-label">What's it about?</span>
				<div class="fb-chips">
					{#each topics as t (t)}
						<button
							type="button"
							class="fb-chip"
							class:active={topic === t}
							onclick={() => (topic = topic === t ? null : t)}>{t}</button
						>
					{/each}
				</div>

				<span class="fb-label">Your message</span>
				<textarea class="fb-field" bind:value={message} placeholder="Share the details..."
				></textarea>

				<span class="fb-label"
					>Email <span style="text-transform:none;letter-spacing:0"
						>(optional — if you'd like a reply)</span
					></span
				>
				<input type="email" class="fb-field" bind:value={email} placeholder="you@email.com" />

				<button type="submit" class="btn btn-pri btn-lg fb-submit" disabled={submitting}>
					{submitting ? 'Sending…' : 'Send feedback'}
					{#if !submitting}<Icon name="arrow" />{/if}
				</button>
				<p class="fb-note">We read every message. Usually reply within 24h.</p>
			</form>
		{/if}
	</div>
</div>
