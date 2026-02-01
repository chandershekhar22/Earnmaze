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

	let showEmailModal = $state(false);
	let email = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let turnstileToken = $state<string | null>(null);
	let turnstileRef = $state<any>(null);
	
	let rewards = [
		{ name: 'PayPal Cash', icon: '💵', popular: true },
		{ name: 'Amazon Gift Cards', icon: '🛒', popular: true },
		{ name: 'Visa Prepaid', icon: '💳', popular: false },
		{ name: 'Starbucks', icon: '☕', popular: false },
		{ name: 'iTunes', icon: '🎵', popular: false },
		{ name: 'Google Play', icon: '🎮', popular: false },
		{ name: 'Target', icon: '🎯', popular: false },
		{ name: 'Walmart', icon: '🏪', popular: false }
	];

	// Track page visit on mount
	onMount(() => {
		markVisitStart();
		trackPageVisit();
	});

	function openEmailModal(e: Event) {
		e.preventDefault();
		
		// Track CTA click with location
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

		// Validate Turnstile token
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
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ 
					email,
					visitorId,
					sessionId,
					utmParams,
					timeToConvert,
					turnstileToken
				})
			});

			const data = await response.json();

			if (response.ok && data.success) {
				// Cookie is set by server (httpOnly)
				// Add new user parameter if this is a new registration
				let redirectUrl = data.redirectUrl || '/guest/dashboard';
				window.location.href = redirectUrl;
			} else {
				errorMessage = data.error || 'Something went wrong. Please try again.';
				isSubmitting = false;
				// Reset Turnstile on error
				turnstileRef?.reset();
				turnstileToken = null;
			}
		} catch (error) {
			errorMessage = 'Network error. Please try again.';
			isSubmitting = false;
			// Reset Turnstile on error
			turnstileRef?.reset();
			turnstileToken = null;
		}
	}
	
	function handleTurnstileVerify(token: string) {
		turnstileToken = token;
		errorMessage = '';
	}
	
	function handleTurnstileError() {
		turnstileToken = null;
	}
	
	function handleTurnstileExpire() {
		turnstileToken = null;
	}
</script>

<svelte:head>
	<title>Earn Rewards with Paid Surveys | EarnMaze - Get Rewarded for Your Opinion</title>
	<meta
		name="description"
		content="Join thousands earning points with paid surveys. Instant rewards, gift cards & PayPal cash. Sign up FREE today! No credit card required."
	/>
	<meta name="keywords" content="paid surveys, earn rewards online, survey points, earn from home, online surveys for rewards, get rewarded for opinions, survey rewards" />
	<meta property="og:title" content="Earn Rewards with Paid Surveys | EarnMaze" />
	<meta property="og:description" content="Get rewarded for sharing your opinions! Join members earning points with surveys. Instant rewards available." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://earnmaze.com/earn-money" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Earn Rewards with Paid Surveys | EarnMaze" />
	<meta name="twitter:description" content="Join thousands earning points with paid surveys. Instant rewards & gift cards. 100% Free!" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
	<link rel="canonical" href="https://earnmaze.com/earn-money" />
</svelte:head>

<!-- Hero Section -->
<section
	class="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 py-16 sm:py-20 md:py-24 lg:py-28"
	aria-labelledby="hero-heading"
>
	<!-- Animated Background -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute w-full h-full opacity-20">
			<div class="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
			<div class="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
			<div class="absolute top-1/2 left-1/2 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-pink-300 rounded-full blur-3xl animate-pulse delay-500"></div>
		</div>
	</div>

	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<!-- Attention-Grabbing Badge -->
			<div
				class="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 bg-yellow-400 text-gray-900 rounded-full text-xs sm:text-sm font-bold mb-6 sm:mb-8 shadow-lg animate-bounce"
			>
				🔥 LIMITED TIME: Get 50 points Sign-Up Bonus!
			</div>

			<!-- Main Headline -->
			<h1 id="hero-heading" class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-5 md:mb-6 leading-tight px-2">
				Earn Points<br class="sm:hidden" />
				<span class="sm:hidden"> </span>Sharing Your Opinion!
			</h1>

			<!-- Subheadline -->
			<p class="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-4">
				No experience needed. Earn points instantly and redeem for rewards, gift cards, or cash.
			</p>

		<!-- CTA Buttons -->
		<div class="flex flex-col gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 md:mb-10 px-4">
			<button
				onclick={openEmailModal}
				class="group inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 md:px-10 md:py-5 bg-yellow-400 text-gray-900 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg md:text-xl hover:bg-yellow-300 active:bg-yellow-500 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl hover:shadow-yellow-400/50 touch-manipulation"
				aria-label="Start earning points now for free"
			>
				<span class="text-center">START EARNING NOW - IT'S FREE!</span>
				<span class="ml-2 group-hover:translate-x-1 transition-transform text-lg sm:text-xl" aria-hidden="true">→</span>
			</button>
		</div>			<!-- Trust Indicators -->
			<div class="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 text-white/80 px-4">
				<div class="flex items-center text-xs sm:text-sm md:text-base">
					<span class="text-green-300 mr-1.5 sm:mr-2 text-lg sm:text-xl">✓</span>
					<span>100% Free</span>
				</div>
				<div class="flex items-center text-xs sm:text-sm md:text-base">
					<span class="text-green-300 mr-1.5 sm:mr-2 text-lg sm:text-xl">✓</span>
					<span>Instant Points</span>
				</div>
				<div class="flex items-center text-xs sm:text-sm md:text-base">
					<span class="text-green-300 mr-1.5 sm:mr-2 text-lg sm:text-xl">✓</span>
					<span>No Credit Card</span>
				</div>
			</div>
		</div>

	</div>
</section>

<!-- Rewards Showcase -->
<section class="py-10 sm:py-12 md:py-16 lg:py-20 bg-white" aria-labelledby="rewards-heading">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-8 sm:mb-10 md:mb-12">
			<h2 id="rewards-heading" class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 mb-2 sm:mb-3 px-4">
				Choose Your <span class="text-violet-600">Reward</span>
			</h2>
			<p class="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto px-4">
				Redeem your points for cash or gift cards from top brands
			</p>
		</div>

		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8" role="list">
			{#each rewards as reward}
				<div class="relative group" role="listitem">
					{#if reward.popular}
						<div class="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full shadow-lg z-10 animate-pulse" aria-label="Popular reward">
							HOT
						</div>
					{/if}
					<div class="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-neutral-50 to-white rounded-lg sm:rounded-xl border-2 border-neutral-200 hover:border-violet-400 hover:shadow-xl active:shadow-md transition-all duration-300 text-center transform hover:-translate-y-1 active:-translate-y-0.5 touch-manipulation">
						<div class="text-2xl sm:text-3xl md:text-4xl mb-1.5 sm:mb-2" aria-hidden="true">{reward.icon}</div>
						<div class="text-[10px] sm:text-xs md:text-sm font-bold text-neutral-700 leading-tight">{reward.name}</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="text-center px-4">
			<p class="text-xs sm:text-sm md:text-base text-neutral-600 font-semibold">+ 50 More Reward Options!</p>
		</div>
	</div>
</section>

<!-- Final CTA Section -->
<section class="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden" aria-labelledby="cta-heading">
	<!-- Gradient Background -->
	<div class="absolute inset-0 bg-gradient-to-br from-violet-700 via-violet-600 to-amber-500" aria-hidden="true"></div>
	
	<!-- Pattern Overlay -->
	<div class="absolute inset-0 opacity-10" aria-hidden="true">
		<div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.4&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
	</div>

	<div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<!-- Urgency Badge -->
		<div class="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold mb-5 sm:mb-6 md:mb-8 shadow-xl animate-bounce text-xs sm:text-sm" role="status">
			<span aria-hidden="true" class="text-lg sm:text-xl">⚡</span>
			<span>Limited: Get 50 Bonus Points NOW!</span>
		</div>

		<!-- Headline -->
		<h2 id="cta-heading" class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 md:mb-6 leading-tight px-2">
			Don't Let This Opportunity Slip Away
		</h2>
		
		<p class="text-base sm:text-lg md:text-xl text-yellow-100 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-4">
			Join <strong class="text-yellow-300">147,892 people</strong> earning points daily
		</p>

	<!-- CTA Button -->
	<button 
		onclick={openEmailModal}
		class="inline-flex items-center gap-2 sm:gap-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 rounded-lg sm:rounded-xl text-base sm:text-lg md:text-xl font-black shadow-2xl hover:shadow-yellow-400/50 transition-all duration-300 hover:scale-105 active:scale-95 border-3 sm:border-4 border-yellow-500 touch-manipulation"
		aria-label="Sign up now to start earning points for free"
	>
		<span aria-hidden="true" class="text-xl sm:text-2xl md:text-3xl">🚀</span>
		<span>Start Earning Now - FREE!</span>
	</button>		<!-- Trust Badges -->
		<div class="mt-8 sm:mt-10 md:mt-12 flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 text-white/90 px-4" role="list">
			<div class="flex items-center gap-1.5 sm:gap-2" role="listitem">
				<span aria-hidden="true" class="text-base sm:text-lg md:text-xl">🔒</span>
				<span class="text-[10px] sm:text-xs md:text-sm font-semibold">SSL Secured</span>
			</div>
			<div class="flex items-center gap-1.5 sm:gap-2" role="listitem">
				<span aria-hidden="true" class="text-base sm:text-lg md:text-xl">🔐</span>
				<span class="text-[10px] sm:text-xs md:text-sm font-semibold">Privacy Protected</span>
			</div>
			<div class="flex items-center gap-1.5 sm:gap-2" role="listitem">
				<span aria-hidden="true" class="text-base sm:text-lg md:text-xl">💯</span>
				<span class="text-[10px] sm:text-xs md:text-sm font-semibold">100% Free</span>
			</div>
		</div>

		<!-- Extra Reassurance -->
		<p class="mt-5 sm:mt-6 md:mt-8 text-[10px] sm:text-xs md:text-sm text-yellow-100/80 px-4">
			No credit card • Cancel anytime • Data protected
		</p>
	</div>
</section>

<!-- Email Modal -->
{#if showEmailModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
			class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform transition-all relative"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Close Button -->
			<button
				onclick={closeEmailModal}
				class="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
				aria-label="Close modal"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<!-- Modal Content -->
			<div class="text-center mb-6">
				<div class="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
					<svg class="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
					</svg>
				</div>
				<h3 id="modal-title" class="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
					Get Started Now!
				</h3>
				<p class="text-sm sm:text-base text-neutral-600">
					Enter your email to claim your earnings
				</p>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="email-input" class="sr-only">Email address</label>
					<input
						id="email-input"
						type="email"
						bind:value={email}
						placeholder="Enter your email address"
						required
						disabled={isSubmitting}
						class="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-base disabled:bg-neutral-100 disabled:cursor-not-allowed"
					/>
				</div>

				{#if errorMessage}
					<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm" role="alert">
						{errorMessage}
					</div>
				{/if}

				<!-- Cloudflare Turnstile -->
				<div class="flex justify-center py-2">
					<Turnstile
						bind:this={turnstileRef}
						onVerify={handleTurnstileVerify}
						onError={handleTurnstileError}
						onExpire={handleTurnstileExpire}
						theme="auto"
						size="normal"
					/>
				</div>

				<button
					type="submit"
					disabled={isSubmitting || !turnstileToken}
					class="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if isSubmitting}
						<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span>Processing...</span>
					{:else}
						<span>Continue →</span>
					{/if}
				</button>
			</form>

			<p class="mt-4 text-xs text-center text-neutral-500">
				By continuing, you agree to our Terms of Service and Privacy Policy
			</p>
		</div>
	</div>
{/if}
