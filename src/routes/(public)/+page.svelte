<script lang="ts">

</script>

<svelte:head>
	<title>EarnMaze Panel - Professional Survey Platform</title>
	<meta
		name="description"
		content="Join EarnMaze to earn rewards by participating in surveys and research studies. Professional survey platform for researchers and respondents."
	/>
</svelte:head>

<!-- Hero Section -->
<section
	class="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 py-12 md:py-20"
>
	<!-- Background decorations -->
	<div class="absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-32 -right-24 md:-top-40 md:-right-32 w-64 h-64 md:w-80 md:h-80 bg-violet-200 rounded-full opacity-20 animate-pulse"
		></div>
		<div
			class="absolute -bottom-32 -left-24 md:-bottom-40 md:-left-32 w-64 h-64 md:w-80 md:h-80 bg-indigo-200 rounded-full opacity-20 animate-pulse"
		></div>
	</div>

	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<div
				class="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-violet-100 text-violet-800 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6"
			>
				<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
				</svg>
				Join 10,000+ happy earners worldwide
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4 md:mb-6 leading-tight px-4">
				Turn Your Opinions Into <br class="hidden sm:block" />
				<span class="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"
					>Real Rewards</span
				>
			</h1>
			<p class="text-base sm:text-lg md:text-xl text-neutral-600 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
				Join EarnMaze and get paid for sharing your thoughts. Complete surveys, earn points, and
				redeem exciting rewards from top brands.
			</p>
			<div class="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4">
				<a
					href="/register"
					class="group inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] md:hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
				>
					Start Earning Today
					<span class="ml-2 group-hover:translate-x-1 transition-transform">→</span>
				</a>
				<a
					href="/about"
					class="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-white text-neutral-700 rounded-lg md:rounded-xl font-semibold text-base md:text-lg border-2 border-neutral-200 hover:border-violet-300 hover:text-violet-600 active:scale-[0.98] transition-all duration-200 touch-manipulation"
				>
					Learn More
				</a>
			</div>

			<!-- Trust indicators -->
			<div class="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-xs md:text-sm text-neutral-500 px-4">
				<div class="flex items-center">
					<svg class="w-4 h-4 text-emerald-500 mr-1.5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>Instant payouts</span>
				</div>
				<div class="flex items-center">
					<svg class="w-4 h-4 text-emerald-500 mr-1.5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>100% secure</span>
				</div>
				<div class="flex items-center">
					<svg class="w-4 h-4 text-emerald-500 mr-1.5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span class="hidden sm:inline">No hidden fees</span>
					<span class="sm:hidden">Free to join</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="py-20 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
				Why Choose <span class="text-violet-600">EarnMaze?</span>
			</h2>
			<p class="text-lg text-neutral-600 max-w-2xl mx-auto">
				We've made earning rewards from surveys simple, rewarding, and fun.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<!-- Feature 1 -->
			<div class="group relative">
				<div
					class="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"
				></div>
				<div
					class="relative p-8 bg-white rounded-2xl border border-neutral-200 hover:border-violet-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
				>
					<div
						class="w-16 h-16 bg-gradient-to-r from-violet-100 to-violet-200 rounded-xl flex items-center justify-center mb-6"
					>
						<svg class="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-neutral-900 mb-4">High-Paying Surveys</h3>
					<p class="text-neutral-600 leading-relaxed">
						Earn more per survey with our premium partners. Get paid what your time is worth.
					</p>
				</div>
			</div>

			<!-- Feature 2 -->
			<div class="group relative">
				<div
					class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"
				></div>
				<div
					class="relative p-8 bg-white rounded-2xl border border-neutral-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
				>
					<div
						class="w-16 h-16 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center mb-6"
					>
						<svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-neutral-900 mb-4">Instant Payouts</h3>
					<p class="text-neutral-600 leading-relaxed">
						Cash out anytime with PayPal or gift cards. No waiting periods, no hassles.
					</p>
				</div>
			</div>

			<!-- Feature 3 -->
			<div class="group relative">
				<div
					class="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"
				></div>
				<div
					class="relative p-8 bg-white rounded-2xl border border-neutral-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
				>
					<div
						class="w-16 h-16 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mb-6"
					>
						<svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-neutral-900 mb-4">Perfect Matches</h3>
					<p class="text-neutral-600 leading-relaxed">
						Our smart algorithm finds surveys that match your profile for higher completion rates
						and better earnings.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section
	class="relative py-20 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 overflow-hidden"
>
	<!-- Background decorations -->
	<div class="absolute inset-0">
		<div class="absolute top-0 left-0 w-full h-full opacity-10">
			<div class="absolute top-20 left-20 w-32 h-32 bg-white rounded-full animate-pulse"></div>
			<div
				class="absolute bottom-20 right-20 w-24 h-24 bg-white rounded-full animate-pulse delay-1000"
			></div>
			<div
				class="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full animate-pulse delay-500"
			></div>
		</div>
	</div>

	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<div
			class="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6"
		>
			<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			Start your earning journey today
		</div>
		<h2 class="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
			Ready to Turn Your <br />
			<span class="text-transparent bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text"
				>Opinions Into Rewards?</span
			>
		</h2>
		<p class="text-xl text-violet-100 mb-10 max-w-2xl mx-auto leading-relaxed">
			Join thousands of people using EarnMaze to earn rewards for sharing their opinions. Start
			earning in minutes!
		</p>

		<!-- Enhanced CTA Buttons -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
			<a
				href="/register"
				class="group relative inline-flex items-center px-8 py-4 bg-white text-violet-600 rounded-xl font-semibold text-lg hover:bg-neutral-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
			>
				<span class="relative z-10">Create Free Account</span>
				<span class="ml-2 group-hover:translate-x-1 transition-transform">→</span>
			</a>
			<a
				href="/login"
				class="group inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-violet-600 transition-all duration-200"
			>
				Already a member? Sign In
			</a>
		</div>

		<!-- Trust badges -->
		<div class="flex flex-wrap justify-center items-center gap-6 text-sm text-violet-100">
			<div class="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
				<svg class="w-4 h-4 text-emerald-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>100% Free to join</span>
			</div>
			<div class="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
				<svg class="w-4 h-4 text-emerald-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>No spam ever</span>
			</div>
			<div class="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
				<svg class="w-4 h-4 text-emerald-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>Cancel anytime</span>
			</div>
		</div>
	</div>
</section>
