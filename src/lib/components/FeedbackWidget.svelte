<script lang="ts">
	import { MessageCircle, X, Check, Send } from '@lucide/svelte';

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
<button
	type="button"
	onclick={openModal}
	aria-label="Send feedback"
	class="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2.5 px-3 py-5 bg-primary-400 text-surface font-semibold text-sm rounded-l-2xl shadow-2xl shadow-primary-500/30 transition-all hover:bg-primary-500 hover:pr-4"
>
	<MessageCircle class="w-[18px] h-[18px]" />
	<span class="[writing-mode:vertical-rl]">Feedback</span>
</button>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
		onclick={closeModal}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="bg-surface-100 rounded-2xl border border-white/[0.07] shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto animate-scale-in"
			role="dialog"
			aria-modal="true"
			aria-label="Send feedback"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			{#if sent}
				<div class="text-center py-6 px-2">
					<div class="w-[72px] h-[72px] rounded-full bg-primary-400/15 ring-8 ring-primary-400/5 flex items-center justify-center mx-auto mb-5">
						<Check class="w-8 h-8 text-primary-400" />
					</div>
					<h3 class="text-xl font-bold text-white mb-2">Thanks for the feedback!</h3>
					<p class="text-sm text-neutral-400 max-w-[34ch] mx-auto leading-relaxed">
						It just landed with our team. We appreciate you helping make EarnMaze better.
					</p>
				</div>
			{:else}
				<div class="flex items-start justify-between gap-4 mb-4">
					<div>
						<span class="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary-500">
							<span class="inline-block w-[5px] h-[5px] rounded-full bg-primary-400 mr-1.5 align-middle"
							></span>Feedback
						</span>
						<h3 class="text-lg font-bold text-white mt-2 mb-1">How's your experience?</h3>
						<p class="text-sm text-neutral-400">Tell us what's working and what we can do better.</p>
					</div>
					<button
						type="button"
						onclick={closeModal}
						aria-label="Close feedback"
						class="p-1.5 rounded-md text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
					>
						<X class="w-4.5 h-4.5" />
					</button>
				</div>
				<form onsubmit={submitFeedback}>
					<span class="block font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-neutral-500 mt-5 mb-2.5">
						Your rating
					</span>
					<div class="grid grid-cols-5 gap-2">
						{#each ratings as emoji, i (i)}
							<button
								type="button"
								onclick={() => (rating = i)}
								aria-label="Rating {i + 1} of 5"
								class="aspect-square rounded-xl text-2xl grid place-items-center border transition-all
									{rating === i
									? 'bg-primary-400/10 border-primary-400 grayscale-0 opacity-100 -translate-y-0.5'
									: 'bg-white/[0.03] border-white/[0.07] grayscale-[0.4] opacity-70 hover:bg-white/[0.06]'}"
							>
								{emoji}
							</button>
						{/each}
					</div>

					<span class="block font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-neutral-500 mt-5 mb-2.5">
						What's it about?
					</span>
					<div class="flex flex-wrap gap-2">
						{#each topics as t (t)}
							<button
								type="button"
								onclick={() => (topic = topic === t ? null : t)}
								class="px-3.5 py-2 rounded-full text-[13px] font-medium border transition-colors
									{topic === t
									? 'bg-primary-400 text-surface border-primary-400'
									: 'bg-white/[0.03] text-neutral-400 border-white/[0.07] hover:bg-white/[0.06] hover:text-white'}"
							>
								{t}
							</button>
						{/each}
					</div>

					<span class="block font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-neutral-500 mt-5 mb-2.5">
						Your message
					</span>
					<textarea
						bind:value={message}
						placeholder="Share the details..."
						class="input min-h-[100px] resize-y"
					></textarea>

					<span class="block font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-neutral-500 mt-5 mb-2.5">
						Email <span class="normal-case tracking-normal">(optional — if you'd like a reply)</span>
					</span>
					<input type="email" bind:value={email} placeholder="you@email.com" class="input" />

					<button type="submit" class="btn-primary w-full mt-5" disabled={submitting}>
						{submitting ? 'Sending…' : 'Send feedback'}
						{#if !submitting}<Send class="w-4 h-4" />{/if}
					</button>
					<p class="text-center text-xs text-neutral-500 mt-3.5">
						We read every message. Usually reply within 24h.
					</p>
				</form>
			{/if}
		</div>
	</div>
{/if}
