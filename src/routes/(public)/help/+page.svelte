<script lang="ts">
	import { Mail, LifeBuoy, MessageSquare, Shield, KeyRound, UserPlus, ChevronDown } from '@lucide/svelte';

	const SUPPORT_EMAIL = 'support@earnmaze.com';
	const PRIVACY_EMAIL = 'privacy@earnmaze.com';

	const faqs = [
		{
			q: 'How do I earn points on EarnMaze?',
			a: 'Sign up for a free account, complete your profile, and you will start receiving survey invitations that match your demographics. Each completed survey credits points to your account.'
		},
		{
			q: 'When and how do I get paid?',
			a: 'Once you reach the minimum redemption threshold, you can cash out via the rewards options shown on your dashboard (gift cards, vouchers, etc.). Payouts are typically processed within a few business days.'
		},
		{
			q: 'Why was I screened out of a survey?',
			a: 'Each study has specific demographic or behavioural quotas. If those slots are already full, or if your profile does not match the criteria, you will be screened out. This is normal and not a reflection of your account.'
		},
		{
			q: 'I did not receive points for a completed survey.',
			a: 'Survey credits can take up to 48 hours to appear. If a credit is still missing after that, contact us with the survey name and approximate completion time and we will investigate.'
		},
		{
			q: 'How do I delete my account?',
			a: 'You can request account deletion by emailing support@earnmaze.com from your registered address. We process deletion requests within 30 days, subject to legal retention requirements.'
		},
		{
			q: 'Is my personal data safe?',
			a: 'Yes. We never sell personal data to advertisers. See our Privacy Policy for details.'
		}
	];

	let openIndex = $state<number | null>(0);
	function toggle(i: number) {
		openIndex = openIndex === i ? null : i;
	}
</script>

<svelte:head>
	<title>Support - EarnMaze Panel</title>
	<meta
		name="description"
		content="Get help with your EarnMaze account, payouts, surveys, and privacy. Contact our support team or browse common questions."
	/>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
	<div class="text-center mb-12">
		<div class="w-16 h-16 bg-primary-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
			<LifeBuoy class="w-8 h-8 text-primary-400" />
		</div>
		<h1 class="text-4xl font-bold text-white mb-3">How can we help?</h1>
		<p class="text-xl text-neutral-400 max-w-2xl mx-auto">
			Browse common questions below, or reach out directly &mdash; we usually reply within one business day.
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
						Email support
					</h3>
					<p class="text-sm text-neutral-400 mb-2">
						Account, payouts, surveys, anything else.
					</p>
					<p class="text-sm text-primary-400 font-medium">{SUPPORT_EMAIL}</p>
				</div>
			</div>
		</a>

		<a href="/support" class="card hover:border-primary-500/40 transition-colors group">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
					<MessageSquare class="w-6 h-6 text-emerald-400" />
				</div>
				<div>
					<h3 class="text-lg font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">
						In-app tickets
					</h3>
					<p class="text-sm text-neutral-400 mb-2">
						Already have an account? Open a ticket from your dashboard for the fastest response.
					</p>
					<p class="text-sm text-emerald-400 font-medium">Open support &rarr;</p>
				</div>
			</div>
		</a>
	</div>

	<div class="grid md:grid-cols-3 gap-4 mb-12">
		<a href="mailto:{PRIVACY_EMAIL}" class="flex items-center gap-3 p-4 rounded-xl bg-surface-100 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
			<Shield class="w-5 h-5 text-violet-400 flex-shrink-0" />
			<div>
				<div class="text-sm font-semibold text-white">Privacy</div>
				<div class="text-xs text-neutral-500">{PRIVACY_EMAIL}</div>
			</div>
		</a>
		<a href="/forgot-password" class="flex items-center gap-3 p-4 rounded-xl bg-surface-100 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
			<KeyRound class="w-5 h-5 text-amber-400 flex-shrink-0" />
			<div>
				<div class="text-sm font-semibold text-white">Locked out?</div>
				<div class="text-xs text-neutral-500">Reset your password</div>
			</div>
		</a>
		<a href="/register" class="flex items-center gap-3 p-4 rounded-xl bg-surface-100 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
			<UserPlus class="w-5 h-5 text-primary-400 flex-shrink-0" />
			<div>
				<div class="text-sm font-semibold text-white">New here?</div>
				<div class="text-xs text-neutral-500">Create a free account</div>
			</div>
		</a>
	</div>

	<div class="card">
		<h2 class="text-2xl font-bold text-white mb-6">Frequently asked questions</h2>
		<div class="divide-y divide-white/[0.06]">
			{#each faqs as faq, i}
				<div class="py-4 first:pt-0 last:pb-0">
					<button
						type="button"
						onclick={() => toggle(i)}
						class="w-full flex items-center justify-between gap-4 text-left"
						aria-expanded={openIndex === i}
					>
						<span class="text-base font-semibold text-white">{faq.q}</span>
						<ChevronDown
							class="w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform {openIndex === i ? 'rotate-180' : ''}"
						/>
					</button>
					{#if openIndex === i}
						<p class="mt-3 text-sm text-neutral-400 leading-relaxed">{faq.a}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="text-center mt-12">
		<p class="text-neutral-400 mb-4">Did not find what you were looking for?</p>
		<a href="mailto:{SUPPORT_EMAIL}" class="btn-primary !px-8 !py-3 !text-lg inline-flex items-center gap-2">
			<Mail class="w-5 h-5" />
			Email support
		</a>
	</div>
</div>
