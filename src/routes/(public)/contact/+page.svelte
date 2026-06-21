<script lang="ts">
	import { Mail, LifeBuoy, Shield, Briefcase } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	const SUPPORT_EMAIL = 'support@earnmaze.com';
	const PRIVACY_EMAIL = 'privacy@earnmaze.com';
	const BUSINESS_EMAIL = 'business@earnmaze.com';
</script>

<svelte:head>
	<title>{m.contact_meta_title()}</title>
	<meta name="description" content={m.contact_meta_description()} />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
	<div class="text-center mb-12">
		<div class="w-16 h-16 bg-primary-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
			<Mail class="w-8 h-8 text-primary-400" />
		</div>
		<h1 class="text-4xl font-bold text-white mb-3">{m.contact_heading()}</h1>
		<p class="text-xl text-neutral-400 max-w-2xl mx-auto">{m.contact_subheading()}</p>
	</div>

	<div class="grid md:grid-cols-3 gap-6 mb-12">
		<a
			href="mailto:{SUPPORT_EMAIL}"
			class="card hover:border-primary-500/40 transition-colors group flex flex-col"
		>
			<div class="w-12 h-12 bg-primary-500/15 rounded-xl flex items-center justify-center mb-4">
				<LifeBuoy class="w-6 h-6 text-primary-400" />
			</div>
			<h3 class="text-lg font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">
				{m.contact_support_title()}
			</h3>
			<p class="text-sm text-neutral-400 mb-3 flex-1">
				{m.contact_support_desc()}
			</p>
			<p class="text-sm text-primary-400 font-medium break-all">{SUPPORT_EMAIL}</p>
		</a>

		<a
			href="mailto:{PRIVACY_EMAIL}"
			class="card hover:border-violet-500/40 transition-colors group flex flex-col"
		>
			<div class="w-12 h-12 bg-violet-500/15 rounded-xl flex items-center justify-center mb-4">
				<Shield class="w-6 h-6 text-violet-400" />
			</div>
			<h3 class="text-lg font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">
				{m.contact_privacy_title()}
			</h3>
			<p class="text-sm text-neutral-400 mb-3 flex-1">
				{m.contact_privacy_desc()}
			</p>
			<p class="text-sm text-violet-400 font-medium break-all">{PRIVACY_EMAIL}</p>
		</a>

		<a
			href="mailto:{BUSINESS_EMAIL}"
			class="card hover:border-emerald-500/40 transition-colors group flex flex-col"
		>
			<div class="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center mb-4">
				<Briefcase class="w-6 h-6 text-emerald-400" />
			</div>
			<h3 class="text-lg font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">
				{m.contact_business_title()}
			</h3>
			<p class="text-sm text-neutral-400 mb-3 flex-1">
				{m.contact_business_desc()}
			</p>
			<p class="text-sm text-emerald-400 font-medium break-all">{BUSINESS_EMAIL}</p>
		</a>
	</div>

	<div class="card bg-surface-100 text-center">
		<p class="text-sm text-neutral-400 leading-relaxed max-w-2xl mx-auto">
			{m.contact_response_time()}
		</p>
	</div>
</div>
