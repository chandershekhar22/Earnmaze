<script lang="ts">
	import { goto } from '$app/navigation';
	import { ShieldCheck, Loader, AlertTriangle, ArrowLeft } from '@lucide/svelte';
	import { Logger } from '$lib/utils/app-logger';

	let { data }: { data: { nextUrl: string } } = $props();

	let isAccepting = $state(false);
	let error = $state('');

	async function accept() {
		isAccepting = true;
		error = '';
		try {
			const response = await fetch('/api/panelist/survey-consent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accepted: true }),
			});
			if (!response.ok) {
				const body = await response.json().catch(() => ({}));
				throw new Error(body?.message || 'Could not save consent');
			}
			goto(data.nextUrl);
		} catch (err) {
			Logger.root.warn({ context: 'consent', error: err }, 'Survey consent accept failed');
			error =
				err instanceof Error ? err.message : 'Could not save your choice. Please try again.';
			isAccepting = false;
		}
	}

	function decline() {
		// User declines — go back to dashboard. They can return any time.
		goto('/surveys');
	}
</script>

<svelte:head>
	<title>Survey participation consent - EarnMaze</title>
	<meta
		name="description"
		content="Before your first survey, please review how your demographic data is shared with survey providers."
	/>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<div class="card">
		<div class="flex items-start gap-4 mb-6">
			<div class="w-12 h-12 bg-primary-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
				<ShieldCheck class="w-6 h-6 text-primary-400" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-white mb-1">Before your first survey</h1>
				<p class="text-sm text-neutral-400">
					Quick review of how your data is used so you know what to expect.
				</p>
			</div>
		</div>

		<div class="space-y-5 text-sm text-neutral-300 leading-relaxed">
			<section>
				<h2 class="text-sm font-semibold text-white mb-2">What we share</h2>
				<p class="text-neutral-400">
					When you take a survey, we share a minimal demographic profile with the
					survey provider so they can match you with relevant studies. This may
					include: age range, gender, country, language, and (if you've added them
					to your profile) education, employment, and income brackets. Your
					answers to the survey itself are submitted directly to the provider.
				</p>
			</section>

			<section>
				<h2 class="text-sm font-semibold text-white mb-2">What we don't share</h2>
				<p class="text-neutral-400">
					Your email address, name, password, and account-level data stay on
					EarnMaze. Survey providers identify you only by an anonymous respondent
					ID — they cannot link your responses back to your real identity.
				</p>
			</section>

			<section>
				<h2 class="text-sm font-semibold text-white mb-2">Why this matters</h2>
				<p class="text-neutral-400">
					Sharing demographics is what makes surveys relevant and well-paid —
					providers pay more for matched respondents. Without this, you'd see far
					fewer opportunities.
				</p>
			</section>

			<section>
				<h2 class="text-sm font-semibold text-white mb-2">Your rights</h2>
				<p class="text-neutral-400">
					You can decline now and still use the rest of your account, but you
					won't be able to take surveys until you accept. You can withdraw consent
					any time by contacting <a href="/help" class="link">support</a> — note
					that data already shared with a provider for a completed survey can't
					be retroactively withdrawn from them, but they're contractually required
					to handle it under their own privacy terms.
				</p>
			</section>

			<section>
				<p class="text-xs text-neutral-500">
					This consent is required by data-protection law (GDPR Art. 6, India DPDP
					§7). The full list of survey providers and their privacy practices is in
					our
					<a href="/privacy-policy" class="link">Privacy Policy</a>.
				</p>
			</section>
		</div>

		{#if error}
			<div class="mt-5 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-start gap-3">
				<AlertTriangle class="w-5 h-5 flex-shrink-0" />
				<span class="text-sm">{error}</span>
			</div>
		{/if}

		<div class="flex flex-col sm:flex-row gap-3 mt-8">
			<button
				type="button"
				onclick={decline}
				disabled={isAccepting}
				class="btn-secondary flex-1 flex items-center justify-center gap-2"
			>
				<ArrowLeft class="w-4 h-4" />
				Not now
			</button>
			<button
				type="button"
				onclick={accept}
				disabled={isAccepting}
				class="btn-primary flex-1 flex items-center justify-center gap-2"
			>
				{#if isAccepting}
					<Loader class="w-4 h-4 animate-spin" />
					Saving…
				{:else}
					I understand and accept
				{/if}
			</button>
		</div>
	</div>
</div>
