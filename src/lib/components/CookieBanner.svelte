<script lang="ts">
	import { cookieConsent } from '$lib/stores/cookie-consent.svelte';
	import { Cookie, X } from '@lucide/svelte';

	let showDetails = $state(false);
	// Local toggle state mirrors the store while the user fiddles with
	// "Manage preferences" — we only commit on Save.
	let analyticsToggle = $state(cookieConsent.analytics);

	function handleAcceptAll() {
		cookieConsent.acceptAll();
		showDetails = false;
	}

	function handleRejectAll() {
		cookieConsent.rejectAll();
		showDetails = false;
	}

	function handleSavePreferences() {
		cookieConsent.setAnalytics(analyticsToggle);
		showDetails = false;
	}

	function openDetails() {
		analyticsToggle = cookieConsent.analytics;
		showDetails = true;
	}
</script>

{#if cookieConsent.loaded && cookieConsent.needsConsent}
	<div
		class="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
		role="dialog"
		aria-label="Cookie preferences"
		aria-modal="false"
	>
		<div
			class="max-w-4xl mx-auto bg-surface-100 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
		>
			{#if !showDetails}
				<!-- Compact banner -->
				<div class="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
					<div class="flex items-start gap-3 flex-1">
						<div
							class="w-10 h-10 bg-primary-500/15 rounded-xl flex items-center justify-center flex-shrink-0"
						>
							<Cookie class="w-5 h-5 text-primary-400" />
						</div>
						<div class="text-sm text-neutral-300 leading-relaxed">
							We use cookies to keep the site running and (with your consent)
							to understand how it's used so we can improve it. Essential
							cookies are always on; analytics are optional.
							<a href="/privacy-policy" class="link" target="_blank" rel="noopener">
								Learn more
							</a>.
						</div>
					</div>
					<div class="flex flex-col sm:flex-row gap-2 flex-shrink-0">
						<button
							onclick={openDetails}
							class="btn-ghost text-sm whitespace-nowrap"
						>
							Manage
						</button>
						<button
							onclick={handleRejectAll}
							class="btn-secondary text-sm whitespace-nowrap"
						>
							Reject all
						</button>
						<button
							onclick={handleAcceptAll}
							class="btn-primary text-sm whitespace-nowrap"
						>
							Accept all
						</button>
					</div>
				</div>
			{:else}
				<!-- Detail / Manage view -->
				<div class="p-5 sm:p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-white">Cookie preferences</h2>
						<button
							onclick={() => (showDetails = false)}
							class="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
							aria-label="Close"
						>
							<X class="w-5 h-5" />
						</button>
					</div>

					<div class="space-y-3 mb-5">
						<!-- Essential — always on -->
						<div class="p-4 bg-surface-200 rounded-xl flex items-start gap-3">
							<div class="flex-1">
								<div class="text-sm font-semibold text-white mb-1">
									Essential <span class="text-xs text-neutral-500 font-normal">(always on)</span>
								</div>
								<p class="text-xs text-neutral-400 leading-relaxed">
									Session, security, and authentication cookies. These are
									required for the site to work and can't be disabled.
								</p>
							</div>
							<div
								class="mt-0.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold"
							>
								On
							</div>
						</div>

						<!-- Analytics — optional -->
						<label
							class="p-4 bg-surface-200 rounded-xl flex items-start gap-3 cursor-pointer"
						>
							<div class="flex-1">
								<div class="text-sm font-semibold text-white mb-1">Analytics</div>
								<p class="text-xs text-neutral-400 leading-relaxed">
									Microsoft Clarity and Google Analytics — anonymised usage
									data we use to understand which features people use and
									where they get stuck. No PII is sold or shared with
									third-party advertisers.
								</p>
							</div>
							<input
								type="checkbox"
								bind:checked={analyticsToggle}
								class="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded bg-surface-50 flex-shrink-0"
							/>
						</label>
					</div>

					<div class="flex flex-col sm:flex-row gap-2 justify-end">
						<button onclick={handleRejectAll} class="btn-ghost text-sm">
							Reject all
						</button>
						<button onclick={handleSavePreferences} class="btn-secondary text-sm">
							Save preferences
						</button>
						<button onclick={handleAcceptAll} class="btn-primary text-sm">
							Accept all
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
