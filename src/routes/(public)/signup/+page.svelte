<script lang="ts">
	import { ArrowRight, Check, Gift, Coins, Zap, Shield, Star, Users, Sparkles } from '@lucide/svelte';
	import { page } from '$app/stores';

	// Forward all UTM params and ref code to the register page
	let registerUrl = $derived(() => {
		const params = new URLSearchParams();
		for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'ref']) {
			const val = $page.url.searchParams.get(key);
			if (val) params.set(key, val);
		}
		const qs = params.toString();
		return qs ? `/register?${qs}` : '/register';
	});
</script>

<svelte:head>
	<title>Join EarnMaze - Start Earning Gift Cards Today</title>
	<meta name="description" content="Sign up for EarnMaze and start earning gift cards by completing quick surveys. 100% free, instant rewards." />
	<meta property="og:title" content="Join EarnMaze - Earn Gift Cards for Free" />
	<meta property="og:description" content="Complete surveys, earn points, redeem gift cards. Join thousands of earners today." />
</svelte:head>

<style>
	@keyframes float-a { 0%,100% { transform:translate(0,0) scale(1) rotate(0) } 33% { transform:translate(18px,-12px) scale(1.06) rotate(3deg) } 66% { transform:translate(-8px,8px) scale(.96) rotate(-2deg) } }
	@keyframes float-b { 0%,100% { transform:translate(0,0) } 50% { transform:translate(-14px,18px) scale(1.04) } }
	@keyframes float-c { 0%,100% { transform:translate(0,0) } 50% { transform:translate(10px,6px) } }
	@keyframes rise { 0% { opacity:0; transform:translateY(20px) } 100% { opacity:1; transform:translateY(0) } }
	@keyframes pop { 0% { opacity:0; transform:scale(.85) } 60% { transform:scale(1.05) } 100% { opacity:1; transform:scale(1) } }
	@keyframes grad { 0% { background-position:0% 50% } 50% { background-position:100% 50% } 100% { background-position:0% 50% } }
	@keyframes pulse-glow { 0%,100% { opacity:.3 } 50% { opacity:.6 } }
	@keyframes card-in { 0% { opacity:0; transform:translateY(24px) scale(.97) } 100% { opacity:1; transform:translateY(0) scale(1) } }
	@keyframes counter { 0% { opacity:0; transform:translateY(8px) } 100% { opacity:1; transform:translateY(0) } }
	@keyframes check-pop { 0% { transform:scale(0) } 60% { transform:scale(1.2) } 100% { transform:scale(1) } }

	.fl-a { animation:float-a 9s ease-in-out infinite }
	.fl-b { animation:float-b 11s ease-in-out infinite 1s }
	.fl-c { animation:float-c 7s ease-in-out infinite 2s }
	.r-1 { animation:rise .6s ease-out .1s both }
	.r-2 { animation:rise .6s ease-out .2s both }
	.r-3 { animation:rise .6s ease-out .35s both }
	.r-4 { animation:rise .5s ease-out .5s both }
	.r-5 { animation:rise .5s ease-out .65s both }
	.pop-in { animation:pop .45s ease-out .15s both }
	.grad-x { background-size:200% 200%; animation:grad 5s ease infinite }
	.glow-p { animation:pulse-glow 4s ease-in-out infinite }
	.ci-1 { animation:card-in .5s ease-out .2s both }
	.ci-2 { animation:card-in .5s ease-out .3s both }
	.ci-3 { animation:card-in .5s ease-out .4s both }
	.ci-4 { animation:card-in .5s ease-out .5s both }
	.cnt { animation:counter .5s ease-out both }
	.chk { animation:check-pop .3s ease-out both }
</style>

<!-- ━━━ HERO ━━━ -->
<section class="relative overflow-hidden pt-10 pb-20 md:pt-20 md:pb-32">
	<div class="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 grad-x"></div>

	<!-- Blobs -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
		<div class="absolute -top-20 left-[5%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] fl-a"></div>
		<div class="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[90px] fl-b"></div>
		<div class="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-cyan-400/8 rounded-full blur-[80px] fl-c"></div>
	</div>

	<div class="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<!-- Badge -->
		<div class="pop-in">
			<span class="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 text-neutral-900 rounded-full text-xs sm:text-sm font-black shadow-lg shadow-amber-500/30">
				<Sparkles class="w-3.5 h-3.5" />
				100 Bonus Points — Limited Time
			</span>
		</div>

		<!-- Headline -->
		<h1 class="r-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mt-8 mb-5 leading-[1.08] tracking-tight">
			Get Paid for<br />
			<span class="text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text">Your Opinions</span>
		</h1>

		<!-- Subtitle -->
		<p class="r-2 text-base sm:text-lg text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">
			Join EarnMaze — complete quick surveys, earn points, and redeem gift cards from brands you love. Completely free.
		</p>

		<!-- CTA -->
		<div class="r-3 flex flex-col sm:flex-row gap-3 justify-center mb-8">
			<a href={registerUrl()} class="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-violet-700 font-black text-lg rounded-xl shadow-2xl shadow-black/20 hover:bg-neutral-100 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
				Sign Up Free
				<ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
			</a>
		</div>

		<!-- Trust -->
		<div class="r-4 flex flex-wrap justify-center gap-5 text-sm text-white/70">
			<span class="flex items-center gap-1.5"><Check class="w-4 h-4 text-emerald-300" /> No credit card</span>
			<span class="flex items-center gap-1.5"><Check class="w-4 h-4 text-emerald-300" /> Takes 30 seconds</span>
			<span class="flex items-center gap-1.5"><Check class="w-4 h-4 text-emerald-300" /> Free forever</span>
		</div>

		<!-- Stat counters -->
		<div class="r-5 flex justify-center gap-8 mt-12">
			{#each [
				{ value: '10K+', label: 'Earners' },
				{ value: '500+', label: 'Surveys' },
				{ value: '4.8★', label: 'Rating' },
			] as stat, i}
				<div class="cnt" style="animation-delay: {0.7 + i * 0.1}s">
					<div class="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
					<div class="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-0.5">{stat.label}</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ WHY JOIN ━━━ -->
<section class="py-16 md:py-24 bg-surface">
	<div class="max-w-5xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<span class="text-[10px] font-bold text-fuchsia-400 uppercase tracking-[0.2em]">Why EarnMaze</span>
			<h2 class="text-3xl md:text-4xl font-black text-white mt-2 tracking-tight">Earning made simple</h2>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{#each [
				{ icon: Gift, color: 'violet', title: 'Gift cards from top brands', desc: 'Amazon, Starbucks, Target, and more. Redeem as soon as you earn enough.' },
				{ icon: Zap, color: 'emerald', title: 'Quick 5-min surveys', desc: "Most surveys take just a few minutes. Earn during your commute or lunch break." },
				{ icon: Shield, color: 'cyan', title: 'Your data is safe', desc: 'Bank-grade encryption. We never sell your personal information to anyone.' },
				{ icon: Coins, color: 'amber', title: 'No hidden fees', desc: 'Everything is free. Sign up, earn, redeem — no catches, no subscriptions.' },
			] as feat, i}
				<div class="ci-{i+1} group bg-surface-100 border border-white/[0.06] rounded-2xl p-5 hover:border-{feat.color}-500/20 hover:-translate-y-1 transition-all duration-300">
					<div class="flex items-start gap-4">
						<div class="p-2.5 bg-{feat.color}-500/10 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform">
							<feat.icon class="w-5 h-5 text-{feat.color}-400" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-white mb-1">{feat.title}</h3>
							<p class="text-sm text-neutral-500 leading-relaxed">{feat.desc}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ HOW IT WORKS ━━━ -->
<section class="py-16 md:py-24 bg-surface-50">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<span class="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">3 easy steps</span>
			<h2 class="text-3xl md:text-4xl font-black text-white mt-2 tracking-tight">Start in under a minute</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#each [
				{ n: '1', color: 'violet', title: 'Create account', desc: 'Enter your email and set a password. Done in 30 seconds.', icon: Users },
				{ n: '2', color: 'fuchsia', title: 'Take surveys', desc: 'We match you with surveys that fit your profile. Quick and easy.', icon: Star },
				{ n: '3', color: 'amber', title: 'Get gift cards', desc: 'Redeem points for gift cards from your favorite brands.', icon: Gift },
			] as step}
				<div class="group bg-surface-100 border border-white/[0.06] rounded-2xl p-6 hover:border-{step.color}-500/20 transition-all duration-200 hover:-translate-y-1">
					<div class="w-10 h-10 rounded-xl bg-{step.color}-500/10 flex items-center justify-center text-lg font-black text-{step.color}-400 mb-4 group-hover:scale-110 transition-transform">{step.n}</div>
					<div class="p-2 bg-{step.color}-500/10 rounded-lg w-fit mb-3">
						<step.icon class="w-4 h-4 text-{step.color}-400" />
					</div>
					<h3 class="text-base font-bold text-white mb-1.5">{step.title}</h3>
					<p class="text-sm text-neutral-500 leading-relaxed">{step.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ WHAT YOU GET ━━━ -->
<section class="py-16 md:py-24 bg-surface">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<span class="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">Perks</span>
			<h2 class="text-3xl md:text-4xl font-black text-white mt-2 tracking-tight">What you get</h2>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each [
				'100 signup bonus points',
				'Gift cards from 20+ brands',
				'New surveys every day',
				'Instant point crediting',
				'Priority support',
				'No minimum payout',
			] as perk, i}
				<div class="flex items-center gap-3 bg-surface-100 border border-white/[0.06] rounded-xl px-4 py-3 chk" style="animation-delay: {0.1 + i * 0.08}s">
					<div class="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
						<Check class="w-3.5 h-3.5 text-emerald-400" />
					</div>
					<span class="text-sm font-medium text-white">{perk}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ TESTIMONIALS ━━━ -->
<section class="py-16 md:py-24 bg-surface-50">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<span class="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">Real users</span>
			<h2 class="text-3xl md:text-4xl font-black text-white mt-2 tracking-tight">People love EarnMaze</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#each [
				{ name: 'Sarah M.', text: "I've redeemed 3 Amazon gift cards already. The surveys are quick and actually interesting.", stars: 5 },
				{ name: 'James R.', text: 'Finally a survey site that actually pays. Got my first gift card within a week of signing up.', stars: 5 },
				{ name: 'Priya K.', text: 'Love doing these during my commute. Easy money for sharing my opinions.', stars: 4 },
			] as review}
				<div class="bg-surface-100 border border-white/[0.06] rounded-2xl p-5">
					<div class="flex items-center gap-0.5 mb-3">
						{#each Array(5) as _, i}
							<Star class="w-4 h-4 {i < review.stars ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'}" />
						{/each}
					</div>
					<p class="text-sm text-neutral-400 leading-relaxed mb-4">"{review.text}"</p>
					<div class="text-xs font-bold text-white">{review.name}</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ FINAL CTA ━━━ -->
<section class="relative py-16 md:py-24 overflow-hidden">
	<div class="absolute inset-0 bg-gradient-to-br from-indigo-700 via-violet-600 to-fuchsia-600 grad-x"></div>
	<div class="absolute inset-0 pointer-events-none" aria-hidden="true">
		<div class="absolute top-[10%] left-[10%] w-40 h-40 bg-white/5 rounded-full blur-2xl glow-p"></div>
		<div class="absolute bottom-[10%] right-[10%] w-32 h-32 bg-white/5 rounded-full blur-2xl glow-p" style="animation-delay:2s"></div>
	</div>

	<div class="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
		<h2 class="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
			Ready to earn<br />
			<span class="text-transparent bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text">free gift cards?</span>
		</h2>

		<p class="text-base text-white/70 mb-8 max-w-md mx-auto leading-relaxed">
			Join thousands earning rewards for their opinions. No cost, no catch — just free gift cards.
		</p>

		<a href={registerUrl()} class="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-violet-700 font-black text-lg rounded-xl shadow-2xl shadow-black/20 hover:bg-neutral-100 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
			Create Free Account
			<ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
		</a>

		<div class="mt-6 flex flex-wrap justify-center gap-5 text-xs text-white/50">
			<span class="flex items-center gap-1.5"><Shield class="w-3.5 h-3.5" /> SSL Secured</span>
			<span class="flex items-center gap-1.5"><Shield class="w-3.5 h-3.5" /> Privacy Protected</span>
			<span class="flex items-center gap-1.5"><Zap class="w-3.5 h-3.5" /> 100% Free</span>
		</div>
	</div>
</section>
