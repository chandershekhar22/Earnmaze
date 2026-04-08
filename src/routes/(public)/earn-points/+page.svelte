<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getVisitorId,
		getSessionId,
		getUtmParams,
		trackPageVisit,
		trackCtaClick,
		markVisitStart,
		getTimeToConvert
	} from '$lib/analytics';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { Check, ArrowRight, Sparkles, Shield, Zap } from '@lucide/svelte';

	let showEmailModal = $state(false);
	let email = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let turnstileToken = $state<string | null>(null);
	let turnstileRef = $state<any>(null);

	onMount(() => {
		markVisitStart();
		trackPageVisit();
	});

	function openEmailModal(e: Event) {
		e.preventDefault();
		const button = e.target as HTMLElement;
		const location = button.closest('section')?.querySelector('h1') ? 'hero' : 'final-cta';
		trackCtaClick(location);
		showEmailModal = true;
		errorMessage = '';
		email = '';
	}

	function closeEmailModal() {
		showEmailModal = false;
		errorMessage = '';
		email = '';
		turnstileToken = null;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!email || !email.includes('@')) {
			errorMessage = 'Please enter a valid email address';
			return;
		}
		if (!turnstileToken) {
			errorMessage = 'Please complete the verification';
			return;
		}

		isSubmitting = true;
		errorMessage = '';

		try {
			const visitorId = getVisitorId();
			const sessionId = getSessionId();
			const utmParams = getUtmParams();
			const timeToConvert = getTimeToConvert();

			const response = await fetch('/api/save-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, visitorId, sessionId, utmParams, timeToConvert, turnstileToken })
			});

			const data = await response.json();

			if (response.ok && data.success) {
				let redirectUrl = data.redirectUrl || '/guest/dashboard';
				window.location.href = redirectUrl;
			} else {
				errorMessage = data.error || 'Something went wrong. Please try again.';
				isSubmitting = false;
				turnstileRef?.reset();
				turnstileToken = null;
			}
		} catch (error) {
			errorMessage = 'Network error. Please try again.';
			isSubmitting = false;
			turnstileRef?.reset();
			turnstileToken = null;
		}
	}

	function handleTurnstileVerify(token: string) {
		turnstileToken = token;
		errorMessage = '';
	}
	function handleTurnstileError() { turnstileToken = null; }
	function handleTurnstileExpire() { turnstileToken = null; }
</script>

<svelte:head>
	<title>Earn Rewards with Paid Surveys | EarnMaze</title>
	<meta name="description" content="Join thousands earning gift cards with paid surveys. Sign up FREE today! No credit card required." />
	<meta name="keywords" content="paid surveys, earn rewards online, survey points, earn from home, online surveys for rewards, gift cards" />
	<meta property="og:title" content="Earn Rewards with Paid Surveys | EarnMaze" />
	<meta property="og:description" content="Get rewarded for sharing your opinions! Join members earning points with surveys. Gift cards available." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://earnmaze.com/earn-money" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Earn Rewards with Paid Surveys | EarnMaze" />
	<meta name="twitter:description" content="Join thousands earning points with paid surveys. Gift cards & rewards. 100% Free!" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
	<link rel="canonical" href="https://earnmaze.com/earn-money" />
</svelte:head>

<style>
	@keyframes blob-a { 0%,100% { transform:translate(0,0) scale(1) } 33% { transform:translate(20px,-12px) scale(1.06) } 66% { transform:translate(-8px,8px) scale(.97) } }
	@keyframes blob-b { 0%,100% { transform:translate(0,0) scale(1) } 50% { transform:translate(-12px,16px) scale(1.04) } }
	@keyframes rise { 0% { opacity:0; transform:translateY(20px) } 100% { opacity:1; transform:translateY(0) } }
	@keyframes pop { 0% { opacity:0; transform:scale(.85) } 60% { transform:scale(1.05) } 100% { opacity:1; transform:scale(1) } }
	@keyframes grad-x { 0% { background-position:0% 50% } 50% { background-position:100% 50% } 100% { background-position:0% 50% } }
	@keyframes glow { 0%,100% { opacity:.2 } 50% { opacity:.5 } }
	@keyframes modal-in { 0% { opacity:0; transform:scale(.95) translateY(8px) } 100% { opacity:1; transform:scale(1) translateY(0) } }

	.bl-a { animation:blob-a 9s ease-in-out infinite }
	.bl-b { animation:blob-b 11s ease-in-out infinite 1s }
	.rise-1 { animation:rise .6s ease-out .1s both }
	.rise-2 { animation:rise .6s ease-out .2s both }
	.rise-3 { animation:rise .6s ease-out .35s both }
	.rise-4 { animation:rise .5s ease-out .5s both }
	.pop-in { animation:pop .4s ease-out .15s both }
	.grad-x { background-size:200% 200%; animation:grad-x 5s ease infinite }
	.glow-p { animation:glow 4s ease-in-out infinite }
	.modal-in { animation:modal-in .3s ease-out both }
</style>

<!-- ━━━ HERO ━━━ -->
<section class="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 md:pt-20 md:pb-32" aria-labelledby="hero-heading">
	<!-- Gradient bg -->
	<div class="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 grad-x"></div>

	<!-- Animated blobs -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
		<div class="absolute -top-20 left-[5%] w-[450px] h-[450px] bg-white/10 rounded-full blur-[100px] bl-a"></div>
		<div class="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[90px] bl-b"></div>
		<div class="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-cyan-400/8 rounded-full blur-[80px] bl-a" style="animation-delay:3s"></div>
	</div>

	<div class="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<!-- Badge -->
		<div class="pop-in">
			<span class="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 text-neutral-900 rounded-full text-xs sm:text-sm font-black shadow-lg shadow-amber-500/30">
				<Sparkles class="w-3.5 h-3.5" />
				100 Bonus Points on Sign-Up!
			</span>
		</div>

		<!-- Headline -->
		<h1 id="hero-heading" class="rise-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mt-6 mb-4 leading-[1.1] tracking-tight">
			Earn Points by<br />
			<span class="text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text">Sharing Your Opinion</span>
		</h1>

		<!-- Subtitle -->
		<p class="rise-2 text-sm sm:text-base md:text-lg text-white/80 max-w-xl mx-auto mb-8 leading-relaxed font-medium">
			No experience needed. Complete quick surveys, earn points instantly, and redeem gift cards from your favorite brands.
		</p>

		<!-- CTA -->
		<div class="rise-3 mb-8">
			<button
				onclick={openEmailModal}
				class="group inline-flex items-center justify-center gap-2 px-8 py-4 sm:px-10 sm:py-5 bg-white text-violet-700 font-black text-base sm:text-lg rounded-xl shadow-2xl shadow-black/20 hover:bg-neutral-100 hover:-translate-y-0.5 hover:shadow-3xl active:translate-y-0 transition-all duration-200 touch-manipulation"
				aria-label="Start earning points now for free"
			>
				Start Earning Now — It's Free
				<ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
			</button>
		</div>
	</div>
</section>

<!-- ━━━ HOW IT WORKS ━━━ -->
<section class="py-14 sm:py-20 bg-surface">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-10">
			<span class="text-[10px] font-bold text-fuchsia-400 uppercase tracking-[0.2em]">How it works</span>
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-2 tracking-tight">Three simple steps</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#each [
				{ n: '1', title: 'Enter your email', desc: 'Create a free account in seconds. No credit card, no strings attached.', color: 'violet' },
				{ n: '2', title: 'Take quick surveys', desc: 'Answer fun questions matched to your interests. Most take just 5 minutes.', color: 'fuchsia' },
				{ n: '3', title: 'Redeem gift cards', desc: 'Exchange your points for gift cards from Amazon and more.', color: 'amber' },
			] as step}
				<div class="group bg-surface-100 border border-white/[0.06] rounded-2xl p-5 hover:border-{step.color}-500/20 transition-all duration-200 hover:-translate-y-1">
					<div class="w-9 h-9 rounded-xl bg-{step.color}-500/10 flex items-center justify-center text-base font-black text-{step.color}-400 mb-4 group-hover:scale-110 transition-transform">{step.n}</div>
					<h3 class="text-sm font-bold text-white mb-1.5">{step.title}</h3>
					<p class="text-sm text-neutral-500 leading-relaxed">{step.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ FINAL CTA ━━━ -->
<section class="relative py-14 sm:py-20 overflow-hidden" aria-labelledby="cta-heading">
	<div class="absolute inset-0 bg-gradient-to-br from-indigo-700 via-violet-600 to-fuchsia-600 grad-x"></div>
	<div class="absolute inset-0 pointer-events-none" aria-hidden="true">
		<div class="absolute top-[10%] left-[10%] w-40 h-40 bg-white/5 rounded-full blur-2xl glow-p"></div>
		<div class="absolute bottom-[10%] right-[10%] w-32 h-32 bg-white/5 rounded-full blur-2xl glow-p" style="animation-delay:2s"></div>
	</div>

	<div class="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
		<h2 id="cta-heading" class="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 leading-tight tracking-tight">
			Don't miss out on<br />
			<span class="text-transparent bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text">free gift cards</span>
		</h2>

		<p class="text-sm sm:text-base text-white/70 mb-8 max-w-md mx-auto leading-relaxed">
			Join thousands of people earning rewards for sharing their opinions. Takes less than a minute to start.
		</p>

		<button
			onclick={openEmailModal}
			class="group inline-flex items-center justify-center gap-2 px-8 py-4 sm:px-10 sm:py-5 bg-white text-violet-700 font-black text-base sm:text-lg rounded-xl shadow-2xl shadow-black/20 hover:bg-neutral-100 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 touch-manipulation"
			aria-label="Sign up now to start earning points for free"
		>
			Start Earning — It's Free
			<ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
		</button>

		<div class="mt-8 flex flex-wrap justify-center gap-5 text-xs sm:text-sm text-white/60">
			<span class="flex items-center gap-1.5"><Shield class="w-3.5 h-3.5" /> SSL Secured</span>
			<span class="flex items-center gap-1.5"><Shield class="w-3.5 h-3.5" /> Privacy Protected</span>
			<span class="flex items-center gap-1.5"><Zap class="w-3.5 h-3.5" /> 100% Free</span>
		</div>
	</div>
</section>

<!-- ━━━ EMAIL MODAL ━━━ -->
{#if showEmailModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
		onclick={closeEmailModal}
		onkeydown={(e) => e.key === 'Escape' && closeEmailModal()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="bg-surface-100 rounded-2xl border border-white/[0.06] shadow-2xl max-w-md w-full p-6 sm:p-8 relative modal-in"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<button
				onclick={closeEmailModal}
				class="absolute top-4 right-4 text-neutral-600 hover:text-white transition-colors"
				aria-label="Close modal"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<div class="text-center mb-6">
				<div class="w-12 h-12 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 rounded-xl flex items-center justify-center mx-auto mb-3">
					<Sparkles class="w-6 h-6 text-violet-400" />
				</div>
				<h3 id="modal-title" class="text-xl sm:text-2xl font-black text-white mb-1">Get Started</h3>
				<p class="text-sm text-neutral-500">Enter your email to claim your bonus points</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="email-input" class="sr-only">Email address</label>
					<input
						id="email-input"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						required
						disabled={isSubmitting}
						class="input disabled:opacity-50 disabled:cursor-not-allowed"
					/>
				</div>

				{#if errorMessage}
					<div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm" role="alert">
						{errorMessage}
					</div>
				{/if}

				<div class="flex justify-center py-1">
					<Turnstile
						bind:this={turnstileRef}
						onVerify={handleTurnstileVerify}
						onError={handleTurnstileError}
						onExpire={handleTurnstileExpire}
						theme="dark"
						size="normal"
					/>
				</div>

				<button
					type="submit"
					disabled={isSubmitting || !turnstileToken}
					class="btn-primary w-full !py-3.5 !text-base"
				>
					{#if isSubmitting}
						<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Processing...
					{:else}
						Continue
						<ArrowRight class="w-4 h-4" />
					{/if}
				</button>
			</form>

			<p class="mt-4 text-[10px] text-center text-neutral-600">
				By continuing, you agree to our Terms of Service and Privacy Policy
			</p>
		</div>
	</div>
{/if}
