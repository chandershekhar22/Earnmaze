<script lang="ts">
	import { Mail, LifeBuoy, MessageSquare, Shield, KeyRound, UserPlus, ChevronDown } from '@lucide/svelte';
	import type { PageData } from './$types';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const SUPPORT_EMAIL = 'support@earnmaze.com';
	const PRIVACY_EMAIL = 'privacy@earnmaze.com';

	let { data }: { data: PageData } = $props();
	let faqs = $derived(data.faqs ?? []);

	// Open the first FAQ by default; null means all collapsed.
	let openId = $state<string | null>(null);
	$effect(() => {
		if (openId === null && faqs.length > 0) openId = faqs[0].id;
	});
	function toggle(id: string) {
		openId = openId === id ? null : id;
	}
</script>

<svelte:head>
	<title>{m.help_meta_title()}</title>
	<meta name="description" content={m.help_meta_description()} />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
	<div class="text-center mb-12">
		<div class="w-16 h-16 bg-primary-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
			<LifeBuoy class="w-8 h-8 text-primary-400" />
		</div>
		<h1 class="text-4xl font-bold text-white mb-3">{m.help_heading()}</h1>
		<p class="text-xl text-neutral-400 max-w-2xl mx-auto">
			{m.help_subheading()}
		</p>
	</div>

	<div class="grid md:grid-cols-2 gap-6 mb-12">
		<a
			href="mailto:{SUPPORT_EMAIL}"
			class="card hover:border-primary-500/40 transition-colors group"
		>
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 bg-primary-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
					<Mail class="w-6 h-6 text-primary-400" />
				</div>
				<div>
					<h3 class="text-lg font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">
						{m.help_email_title()}
					</h3>
					<p class="text-sm text-neutral-400 mb-2">
						{m.help_email_desc()}
					</p>
					<p class="text-sm text-primary-400 font-medium">{SUPPORT_EMAIL}</p>
				</div>
			</div>
		</a>

		<a href={localizeHref('/support')} class="card hover:border-primary-500/40 transition-colors group">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
					<MessageSquare class="w-6 h-6 text-emerald-400" />
				</div>
				<div>
					<h3 class="text-lg font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">
						{m.help_tickets_title()}
					</h3>
					<p class="text-sm text-neutral-400 mb-2">
						{m.help_tickets_desc()}
					</p>
					<p class="text-sm text-emerald-400 font-medium">{m.help_tickets_cta()}</p>
				</div>
			</div>
		</a>
	</div>

	<div class="grid md:grid-cols-3 gap-4 mb-12">
		<a href="mailto:{PRIVACY_EMAIL}" class="flex items-center gap-3 p-4 rounded-xl bg-surface-100 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
			<Shield class="w-5 h-5 text-violet-400 flex-shrink-0" />
			<div>
				<div class="text-sm font-semibold text-white">{m.help_quick_privacy()}</div>
				<div class="text-xs text-neutral-500">{PRIVACY_EMAIL}</div>
			</div>
		</a>
		<a href={localizeHref('/forgot-password')} class="flex items-center gap-3 p-4 rounded-xl bg-surface-100 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
			<KeyRound class="w-5 h-5 text-amber-400 flex-shrink-0" />
			<div>
				<div class="text-sm font-semibold text-white">{m.help_quick_locked_title()}</div>
				<div class="text-xs text-neutral-500">{m.help_quick_locked_desc()}</div>
			</div>
		</a>
		<a href={localizeHref('/register')} class="flex items-center gap-3 p-4 rounded-xl bg-surface-100 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
			<UserPlus class="w-5 h-5 text-primary-400 flex-shrink-0" />
			<div>
				<div class="text-sm font-semibold text-white">{m.help_quick_new_title()}</div>
				<div class="text-xs text-neutral-500">{m.help_quick_new_desc()}</div>
			</div>
		</a>
	</div>

	{#if faqs.length > 0}
		<div class="card">
			<h2 class="text-2xl font-bold text-white mb-6">{m.help_faq_heading()}</h2>
			<div class="divide-y divide-white/[0.06]">
				{#each faqs as faq (faq.id)}
					<div class="py-4 first:pt-0 last:pb-0">
						<button
							type="button"
							onclick={() => toggle(faq.id)}
							class="w-full flex items-center justify-between gap-4 text-start"
							aria-expanded={openId === faq.id}
						>
							<span class="text-base font-semibold text-white">{faq.question}</span>
							<ChevronDown
								class="w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform {openId === faq.id ? 'rotate-180' : ''}"
							/>
						</button>
						{#if openId === faq.id}
							<div class="mt-3 text-sm text-neutral-400 leading-relaxed faq-content">{@html faq.answer}</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="text-center mt-12">
		<p class="text-neutral-400 mb-4">{m.help_not_found()}</p>
		<a href="mailto:{SUPPORT_EMAIL}" class="btn-primary !px-8 !py-3 !text-lg inline-flex items-center gap-2">
			<Mail class="w-5 h-5" />
			{m.help_email_title()}
		</a>
	</div>
</div>

<style>
	:global(.faq-content h3) { font-size: 0.875rem; font-weight: 700; color: white; margin: 0.5rem 0; }
	:global(.faq-content ul), :global(.faq-content ol) { padding-inline-start: 1.5rem; margin: 0.25rem 0; }
	:global(.faq-content li) { margin: 0.15rem 0; }
	:global(.faq-content a) { color: rgb(167 139 250); text-decoration: underline; }
	:global(.faq-content strong) { color: white; }
	:global(.faq-content p) { margin: 0.25rem 0; }
</style>
