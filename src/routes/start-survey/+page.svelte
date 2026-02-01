<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let countdown = $state(5);
	let redirecting = $state(false);

	onMount(() => {
		const timer = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(timer);
				redirectToSurvey();
			}
		}, 1000);

		return () => clearInterval(timer);
	});

	function redirectToSurvey() {
		redirecting = true;
		window.location.href = data.surveyUrl;
	}
</script>

<svelte:head>
	<title>Starting Survey - EarnMaze</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
	<div class="max-w-2xl w-full">
		<div class="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-6">
			<!-- Header -->
			<div class="text-center space-y-2">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
					<!-- Check Circle Icon -->
					<svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-gray-900">
					Get Ready!
				</h1>
				<p class="text-lg text-gray-600">
					Your survey is about to begin
				</p>
			</div>

			<!-- Divider -->
			<div class="border-t border-gray-200"></div>

			<!-- Survey Info -->
			<div class="bg-indigo-50 rounded-xl p-6 space-y-4">
				<h2 class="text-xl font-semibold text-indigo-900">
					{data.surveyTitle}
				</h2>
				
				{#if data.email}
					<p class="text-sm text-indigo-700">
						<span class="font-medium">Email:</span> {data.email}
					</p>
				{/if}

				<div class="space-y-2 text-sm text-indigo-800">
					<p class="flex items-start gap-2">
						<span class="text-indigo-600 font-bold mt-0.5">•</span>
						<span>Complete the survey honestly and carefully</span>
					</p>
					<p class="flex items-start gap-2">
						<span class="text-indigo-600 font-bold mt-0.5">•</span>
						<span>You'll earn points upon successful completion</span>
					</p>
				</div>
			</div>

			<!-- Countdown -->
			<div class="text-center space-y-4">
				{#if !redirecting}
					<p class="text-gray-600">
						Redirecting in <span class="text-2xl font-bold text-indigo-600">{countdown}</span> seconds...
					</p>
					<div class="flex items-center justify-center gap-2">
						<!-- Spinner Icon -->
						<svg class="w-5 h-5 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span class="text-sm text-gray-500">Preparing your survey session</span>
					</div>
				{:else}
					<p class="text-gray-600 flex items-center justify-center gap-2">
						<!-- Spinner Icon -->
						<svg class="w-5 h-5 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span>Redirecting now...</span>
					</p>
				{/if}
			</div>

			<!-- Manual Redirect Button -->
			<div class="pt-4">
				<button
					onclick={redirectToSurvey}
					disabled={redirecting}
					class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
				>
					{#if redirecting}
						<!-- Spinner Icon -->
						<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span>Redirecting...</span>
					{:else}
						<span>Start Survey Now</span>
						<!-- Arrow Right Icon -->
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
						</svg>
					{/if}
				</button>
			</div>

			<!-- Footer Note -->
			<p class="text-xs text-center text-gray-500 pt-4">
				If you're not redirected automatically, click the button above to start the survey.
			</p>
		</div>
	</div>
</div>
