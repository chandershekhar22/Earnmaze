<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';

	const ratings = ['😞', '😕', '😐', '🙂', '😍'];
	const topics = [
		m.home_fb_topic_payouts(),
		m.home_fb_topic_quizzes_games(),
		m.nav_surveys(),
		m.home_fb_topic_something_broken(),
		m.home_fb_topic_idea_request()
	];

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
<button class="fb-tab" onclick={openModal} aria-label={m.home_fb_send()}>
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
	<span class="fb-tab-text">{m.home_fb_tab_label()}</span>
</button>

<!-- Feedback modal -->
<div class="fb-overlay" class:open>
	<button type="button" class="fb-backdrop" aria-label={m.home_fb_close()} onclick={closeModal}
	></button>
	<div class="fb-modal" role="dialog" aria-modal="true" aria-label={m.home_fb_send()}>
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
				<h3>{m.home_fb_thanks_title()}</h3>
				<p class="fb-sub">
					{m.home_fb_thanks_body()}
				</p>
			</div>
		{:else}
			<div class="fb-top">
				<div>
					<span class="eyebrow acc"><span class="dot"></span>{m.home_fb_tab_label()}</span>
					<h3>{m.home_fb_heading()}</h3>
					<p class="fb-sub">{m.home_fb_subheading()}</p>
				</div>
				<button class="notif-close" onclick={closeModal} aria-label={m.home_fb_close()}>
					<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
						><path d="M6 6l12 12M18 6L6 18" /></svg
					>
				</button>
			</div>
			<form onsubmit={submitFeedback}>
				<span class="fb-label">{m.home_fb_your_rating()}</span>
				<div class="fb-ratings">
					{#each ratings as emoji, i (i)}
						<button
							type="button"
							class="fb-rate"
							class:active={rating === i}
							onclick={() => (rating = i)}
							aria-label={m.home_fb_rating_aria({ n: i + 1 })}>{emoji}</button
						>
					{/each}
				</div>

				<span class="fb-label">{m.home_fb_about_label()}</span>
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

				<span class="fb-label">{m.home_fb_message_label()}</span>
				<textarea class="fb-field" bind:value={message} placeholder={m.home_fb_message_placeholder()}
				></textarea>

				<span class="fb-label"
					>{m.home_fb_email_label()} <span style="text-transform:none;letter-spacing:0"
						>{m.home_fb_email_optional()}</span
					></span
				>
				<input type="email" class="fb-field" bind:value={email} placeholder={m.home_footer_news_placeholder()} />

				<button type="submit" class="btn btn-pri btn-lg fb-submit" disabled={submitting}>
					{submitting ? m.home_fb_sending() : m.home_fb_submit()}
					{#if !submitting}<Icon name="arrow" />{/if}
				</button>
				<p class="fb-note">{m.home_fb_note()}</p>
			</form>
		{/if}
	</div>
</div>
