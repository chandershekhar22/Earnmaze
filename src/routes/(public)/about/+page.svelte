<script lang="ts">
	import { Check, Lock, ShieldCheck, Star, Zap } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
</script>

<svelte:head>
	<title>{m.about_meta_title()}</title>
	<meta name="description" content={m.about_meta_description()} />
</svelte:head>

	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<h1 class="text-4xl font-bold text-white mb-4">{m.about_heading()}</h1>
		<p class="text-xl text-neutral-400 mb-12">
			{m.about_subheading()}
		</p>

	<div class="grid md:grid-cols-2 gap-12 items-center mb-16">
		<div>
			<h2 class="text-2xl font-bold text-white mb-4">{m.about_mission_title()}</h2>
			<p class="text-neutral-400 mb-4">
				{m.about_mission_para1()}
			</p>
			<p class="text-neutral-400">
				{m.about_mission_para2()}
			</p>
		</div>
		<div class="bg-surface-100 rounded-2xl border border-white/[0.06] p-8 text-center">
			<div class="w-16 h-16 bg-primary-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
				<ShieldCheck class="w-8 h-8 text-primary-400" />
			</div>
			<h3 class="text-xl font-semibold text-white mb-2">{m.about_quality_title()}</h3>
			<p class="text-neutral-400">{m.about_quality_desc()}</p>
		</div>
	</div>

	<div class="grid md:grid-cols-3 gap-8 mb-16">
		<div class="text-center">
			<div class="w-14 h-14 bg-primary-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
				<Lock class="w-7 h-7 text-primary-400" />
			</div>
			<h3 class="text-lg font-semibold text-white mb-2">{m.about_pillar_secure_title()}</h3>
			<p class="text-neutral-400">{m.about_pillar_secure_desc()}</p>
		</div>

		<div class="text-center">
			<div class="w-14 h-14 bg-emerald-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
				<Zap class="w-7 h-7 text-emerald-400" />
			</div>
			<h3 class="text-lg font-semibold text-white mb-2">{m.about_pillar_fast_title()}</h3>
			<p class="text-neutral-400">{m.about_pillar_fast_desc()}</p>
		</div>

		<div class="text-center">
			<div class="w-14 h-14 bg-amber-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
				<Star class="w-7 h-7 text-amber-400" />
			</div>
			<h3 class="text-lg font-semibold text-white mb-2">{m.about_pillar_user_title()}</h3>
			<p class="text-neutral-400">{m.about_pillar_user_desc()}</p>
		</div>
	</div>

	<div class="card">
		<h2 class="text-2xl font-bold text-white mb-6 text-center">{m.about_why_title()}</h2>
		<div class="grid md:grid-cols-2 gap-8">
			<div>
				<h3 class="text-lg font-semibold text-white mb-3">{m.about_why_researchers_title()}</h3>
				<ul class="space-y-2 text-neutral-400">
					<li class="flex items-center">
						<Check class="w-4 h-4 text-emerald-400 me-2 flex-shrink-0" />
						{m.about_why_researchers_b1()}
					</li>
					<li class="flex items-center">
						<Check class="w-4 h-4 text-emerald-400 me-2 flex-shrink-0" />
						{m.about_why_researchers_b2()}
					</li>
					<li class="flex items-center">
						<Check class="w-4 h-4 text-emerald-400 me-2 flex-shrink-0" />
						{m.about_why_researchers_b3()}
					</li>
					<li class="flex items-center">
						<Check class="w-4 h-4 text-emerald-400 me-2 flex-shrink-0" />
						{m.about_why_researchers_b4()}
					</li>
				</ul>
			</div>
			<div>
				<h3 class="text-lg font-semibold text-white mb-3">{m.about_why_respondents_title()}</h3>
				<ul class="space-y-2 text-neutral-400">
					<li class="flex items-center">
						<Check class="w-4 h-4 text-emerald-400 me-2 flex-shrink-0" />
						{m.about_why_respondents_b1()}
					</li>
					<li class="flex items-center">
						<Check class="w-4 h-4 text-emerald-400 me-2 flex-shrink-0" />
						{m.about_why_respondents_b2()}
					</li>
					<li class="flex items-center">
						<Check class="w-4 h-4 text-emerald-400 me-2 flex-shrink-0" />
						{m.about_why_respondents_b3()}
					</li>
					<li class="flex items-center">
						<Check class="w-4 h-4 text-emerald-400 me-2 flex-shrink-0" />
						{m.about_why_respondents_b4()}
					</li>
				</ul>
			</div>
		</div>
	</div>

	<div class="text-center mt-12">
		<h2 class="text-2xl font-bold text-white mb-4">{m.about_cta_title()}</h2>
		<p class="text-neutral-400 mb-6">{m.about_cta_subtitle()}</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a href={localizeHref('/register')} class="btn-primary !px-8 !py-3 !text-lg">
				{m.about_cta_signup()}
			</a>
			<a href={localizeHref('/contact')} class="btn-secondary !px-8 !py-3 !text-lg">
				{m.about_cta_contact()}
			</a>
		</div>
	</div>
</div>
