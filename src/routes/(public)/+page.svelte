<script lang="ts">
	import { Check, CircleDollarSign, ShieldCheck, Sparkles, Zap, ArrowRight, Users, Gift, Clock } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	// Intersection Observer for scroll-triggered animations
	let sections: Record<string, boolean> = $state({ steps: false, features: false, cta: false });

	onMount(() => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(e => {
				if (e.isIntersecting) {
					const id = e.target.getAttribute('data-section');
					if (id) sections[id] = true;
				}
			});
		}, { threshold: 0.15 });

		document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>{m.home_meta_title()}</title>
	<meta name="description" content={m.home_meta_description()} />
</svelte:head>

<style>
	/* ── Blob movement ── */
	@keyframes blob-1 { 0%,100% { transform:translate(0,0) scale(1) rotate(0deg) } 33% { transform:translate(20px,-15px) scale(1.08) rotate(5deg) } 66% { transform:translate(-10px,10px) scale(.95) rotate(-3deg) } }
	@keyframes blob-2 { 0%,100% { transform:translate(0,0) scale(1) } 40% { transform:translate(-15px,20px) scale(1.05) } 80% { transform:translate(10px,-5px) scale(.97) } }
	@keyframes blob-3 { 0%,100% { transform:translate(0,0) rotate(0deg) } 50% { transform:translate(12px,12px) rotate(8deg) } }
	@keyframes blob-4 { 0%,100% { transform:translate(0,0) scale(1) } 50% { transform:translate(-8px,-10px) scale(1.1) } }

	/* ── Entrance animations ── */
	@keyframes rise       { 0% { opacity:0; transform:translateY(24px) } 100% { opacity:1; transform:translateY(0) } }
	@keyframes rise-scale { 0% { opacity:0; transform:translateY(16px) scale(.96) } 100% { opacity:1; transform:translateY(0) scale(1) } }
	@keyframes pop-in     { 0% { opacity:0; transform:scale(.8) } 60% { transform:scale(1.06) } 100% { opacity:1; transform:scale(1) } }
	@keyframes slide-up   { 0% { opacity:0; transform:translateY(32px) scale(.98) } 100% { opacity:1; transform:translateY(0) scale(1) } }
	@keyframes fade-in    { 0% { opacity:0 } 100% { opacity:1 } }

	/* ── Continuous effects ── */
	@keyframes grad-shift { 0% { background-position:0% 50% } 50% { background-position:100% 50% } 100% { background-position:0% 50% } }
	@keyframes glow-pulse { 0%,100% { opacity:.25; transform:scale(1) } 50% { opacity:.55; transform:scale(1.06) } }
	@keyframes shimmer    { 0% { background-position:-200% center } 100% { background-position:200% center } }
	@keyframes line-grow  { 0% { transform:scaleX(0) } 100% { transform:scaleX(1) } }
	@keyframes icon-bob   { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-3px) } }

	/* ── Blob classes ── */
	.bl-1 { animation:blob-1 9s ease-in-out infinite }
	.bl-2 { animation:blob-2 11s ease-in-out infinite 1s }
	.bl-3 { animation:blob-3 8s ease-in-out infinite 2s }
	.bl-4 { animation:blob-4 7s ease-in-out infinite .5s }

	/* ── Hero stagger ── */
	.hi-badge { animation:pop-in .5s ease-out .1s both }
	.hi-title { animation:rise .65s ease-out .2s both }
	.hi-sub   { animation:rise .6s ease-out .4s both }
	.hi-cta   { animation:rise-scale .6s ease-out .55s both }
	.hi-trust { animation:fade-in .5s ease-out .75s both }

	/* ── Section reveals (scroll-triggered via class) ── */
	.reveal     { opacity:0; transform:translateY(28px); transition:all .6s cubic-bezier(.22,1,.36,1) }
	.reveal.vis { opacity:1; transform:translateY(0) }
	.reveal-d1  { transition-delay:.1s }
	.reveal-d2  { transition-delay:.2s }
	.reveal-d3  { transition-delay:.3s }
	.reveal-d4  { transition-delay:.4s }

	/* ── Continuous ── */
	.grad-x   { background-size:200% 200%; animation:grad-shift 5s ease infinite }
	.glow     { animation:glow-pulse 4s ease-in-out infinite }
	.shimmer  { background-size:200% auto; animation:shimmer 3s linear infinite }
	.line-grow { animation:line-grow .8s ease-out both; transform-origin:left }
	.icon-bob { animation:icon-bob 3s ease-in-out infinite }

	/* ── Hover micro-interactions ── */
	.card-lift { transition:all .3s cubic-bezier(.22,1,.36,1) }
	.card-lift:hover { transform:translateY(-4px) }
	.card-lift:active { transform:translateY(-1px); transition-duration:.1s }

	/* ── Respect reduced-motion preferences ── */
	@media (prefers-reduced-motion: reduce) {
		.bl-1, .bl-2, .bl-3, .bl-4,
		.glow, .grad-x, .shimmer, .icon-bob,
		.line-grow {
			animation: none !important;
		}
		.hi-badge, .hi-title, .hi-sub, .hi-cta, .hi-trust {
			animation: none !important;
			opacity: 1 !important;
			transform: none !important;
		}
		.reveal {
			opacity: 1 !important;
			transform: none !important;
			transition: none !important;
		}
		.card-lift, .card-lift:hover, .card-lift:active {
			transition: none !important;
			transform: none !important;
		}
	}
</style>

<!-- ━━━ HERO ━━━ -->
<section class="relative overflow-hidden bg-surface pt-8 pb-16 md:pt-16 md:pb-28">
	<!-- Animated gradient blobs -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
		<div class="absolute -top-20 start-[8%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] bl-1"></div>
		<div class="absolute bottom-[-5%] end-[3%] w-[420px] h-[420px] bg-fuchsia-500/15 rounded-full blur-[100px] bl-2"></div>
		<div class="absolute top-[40%] start-[45%] w-[500px] h-[250px] bg-cyan-500/8 rounded-full blur-[100px] bl-3"></div>
		<div class="absolute top-[20%] end-[20%] w-[220px] h-[220px] bg-orange-500/10 rounded-full blur-[80px] bl-4"></div>
	</div>

	<div class="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
		<!-- Badge -->
		<div class="hi-badge">
			<span class="inline-flex items-center gap-1.5 px-4 py-2 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-full text-xs font-semibold text-neutral-300">
				<Sparkles class="w-3.5 h-3.5 text-amber-400 icon-bob" />
				{m.home_hero_badge()}
			</span>
		</div>

		<!-- Headline -->
		<h1 class="hi-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mt-6 mb-5 leading-[1.08] tracking-tight">
			{m.home_hero_title_line1()}<br />
			<span class="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent grad-x">{m.home_hero_title_line2()}</span>
		</h1>

		<!-- Subtitle -->
		<p class="hi-sub text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed">
			{m.home_hero_subtitle()}
		</p>

		<!-- CTA -->
		<div class="hi-cta flex flex-col sm:flex-row gap-3 justify-center mb-10">
			<a href={localizeHref('/register')} class="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base rounded-xl shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden">
				<span class="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
				<span class="relative flex items-center gap-2">
					{m.home_hero_cta_signup()}
					<ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 rtl:-scale-x-100" />
				</span>
			</a>
			<a href="#steps" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 font-semibold text-base rounded-xl hover:bg-white/[0.1] hover:text-white hover:border-white/[0.15] transition-all duration-200">
				{m.home_hero_cta_how_it_works()}
			</a>
		</div>

		<!-- Trust badges -->
		<div class="hi-trust flex flex-wrap justify-center gap-6 text-sm text-neutral-500">
			{#each [{ t: m.home_trust_free_to_join() }, { t: m.home_trust_fast_payouts() }, { t: m.home_trust_secure() }] as item}
				<span class="flex items-center gap-1.5 hover:text-neutral-300 transition-colors">
					<Check class="w-4 h-4 text-emerald-400" /> {item.t}
				</span>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ HOW IT WORKS ━━━ -->
<section id="steps" class="py-16 md:py-24 bg-surface scroll-mt-20" data-section="steps">
	<div class="max-w-5xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12 reveal {sections.steps ? 'vis' : ''}">
			<span class="text-[10px] font-bold text-primary-400 uppercase tracking-[0.2em]">{m.home_steps_label()}</span>
			<h2 class="text-3xl md:text-4xl font-black text-white mt-2 tracking-tight">
				{m.home_steps_title()}
			</h2>
		</div>

		<!-- Connecting line (desktop) -->
		<div class="hidden md:block relative mb-8">
			<div class="absolute top-1/2 start-[16%] end-[16%] h-px bg-gradient-to-r from-violet-500/20 via-emerald-500/20 to-amber-500/20 {sections.steps ? 'line-grow' : 'opacity-0'}" style="transition-delay:.4s"></div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
			{#each [
				{ num: '1', color: 'violet', icon: Users, title: m.home_step_1_title(), desc: m.home_step_1_desc() },
				{ num: '2', color: 'emerald', icon: CircleDollarSign, title: m.home_step_2_title(), desc: m.home_step_2_desc() },
				{ num: '3', color: 'amber', icon: Gift, title: m.home_step_3_title(), desc: m.home_step_3_desc() },
			] as step, i}
				<div class="relative group reveal reveal-d{i+1} {sections.steps ? 'vis' : ''} card-lift">
					<!-- Hover glow -->
					<div class="absolute -inset-px bg-gradient-to-b from-{step.color}-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
					<div class="relative bg-surface-100 border border-white/[0.06] rounded-2xl p-6 group-hover:border-{step.color}-500/20 transition-colors duration-300">
						<!-- Step number -->
						<div class="flex items-center gap-3 mb-4">
							<div class="w-10 h-10 rounded-xl bg-{step.color}-500/10 flex items-center justify-center text-lg font-black text-{step.color}-400 group-hover:scale-110 transition-transform duration-300">{step.num}</div>
							<div class="h-px flex-1 bg-gradient-to-r from-{step.color}-500/20 to-transparent"></div>
						</div>
						<!-- Icon -->
						<div class="p-2.5 bg-{step.color}-500/10 rounded-xl w-fit mb-4 group-hover:scale-105 transition-transform duration-300">
							<step.icon class="w-5 h-5 text-{step.color}-400" />
						</div>
						<h3 class="text-base font-bold text-white mb-2">{step.title}</h3>
						<p class="text-sm text-neutral-500 leading-relaxed">{step.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ FEATURES ━━━ -->
<section class="py-16 md:py-24 bg-surface-50" data-section="features">
	<div class="max-w-5xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12 reveal {sections.features ? 'vis' : ''}">
			<span class="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">{m.home_features_label()}</span>
			<h2 class="text-3xl md:text-4xl font-black text-white mt-2 tracking-tight">
				{m.home_features_title()}
			</h2>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{#each [
				{ icon: CircleDollarSign, color: 'violet', title: m.home_feature_payouts_title(), desc: m.home_feature_payouts_desc() },
				{ icon: Zap, color: 'emerald', title: m.home_feature_fast_title(), desc: m.home_feature_fast_desc() },
				{ icon: ShieldCheck, color: 'cyan', title: m.home_feature_smart_title(), desc: m.home_feature_smart_desc() },
				{ icon: Clock, color: 'amber', title: m.home_feature_quick_title(), desc: m.home_feature_quick_desc() },
			] as feat, i}
				<div class="group reveal reveal-d{i+1} {sections.features ? 'vis' : ''} card-lift bg-surface-100 border border-white/[0.06] rounded-2xl p-5 hover:border-{feat.color}-500/15">
					<div class="flex items-start gap-4">
						<div class="p-2.5 bg-{feat.color}-500/10 rounded-xl flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
							<feat.icon class="w-5 h-5 text-{feat.color}-400" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-white mb-1 group-hover:text-{feat.color}-300 transition-colors duration-200">{feat.title}</h3>
							<p class="text-sm text-neutral-500 leading-relaxed">{feat.desc}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ CTA ━━━ -->
<section class="relative py-16 md:py-24 overflow-hidden" data-section="cta">
	<!-- Animated gradient background -->
	<div class="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 grad-x"></div>
	<!-- Floating glow orbs -->
	<div class="absolute inset-0 pointer-events-none" aria-hidden="true">
		<div class="absolute top-[10%] start-[12%] w-44 h-44 bg-white/5 rounded-full blur-2xl glow"></div>
		<div class="absolute bottom-[10%] end-[8%] w-36 h-36 bg-white/5 rounded-full blur-2xl glow" style="animation-delay:2s"></div>
		<div class="absolute top-[50%] start-[60%] w-24 h-24 bg-cyan-400/5 rounded-full blur-xl glow" style="animation-delay:1s"></div>
	</div>

	<div class="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
		<div class="reveal {sections.cta ? 'vis' : ''}">
			<span class="inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-xs font-semibold text-white mb-6">
				<Zap class="w-3.5 h-3.5" />
				{m.home_cta_badge()}
			</span>
		</div>

		<h2 class="reveal reveal-d1 {sections.cta ? 'vis' : ''} text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
			{m.home_cta_title_prefix()}<br />
			<span class="text-transparent bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text">{m.home_cta_title_emphasis()}</span>
		</h2>

		<p class="reveal reveal-d2 {sections.cta ? 'vis' : ''} text-base text-white/70 mb-8 max-w-lg mx-auto leading-relaxed">
			{m.home_cta_subtitle()}
		</p>

		<div class="reveal reveal-d3 {sections.cta ? 'vis' : ''} flex flex-col sm:flex-row gap-3 justify-center">
			<a href={localizeHref('/register')} class="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold text-base rounded-xl shadow-2xl shadow-black/20 hover:shadow-3xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200 overflow-hidden">
				<span class="absolute inset-0 bg-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
				<span class="relative flex items-center gap-2">
					{m.home_cta_signup()}
					<ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 rtl:-scale-x-100" />
				</span>
			</a>
			<a href={localizeHref('/login')} class="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold text-base rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-200">
				{m.common_signin()}
			</a>
		</div>
	</div>
</section>
