<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { CircleCheckBig, Loader2, ArrowRight } from '@lucide/svelte';

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

<div class="min-h-screen bg-surface flex items-center justify-center p-4">
	<div class="max-w-2xl w-full">
		<div class="bg-surface-100 rounded-2xl border border-white/[0.06] p-8 md:p-12 space-y-6">
			<!-- Header -->
			<div class="text-center space-y-2">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
					<CircleCheckBig class="w-8 h-8 text-emerald-400" />
				</div>
				<h1 class="text-3xl font-bold text-white">
					Get Ready!
				</h1>
				<p class="text-lg text-neutral-400">
					Your survey is about to begin
				</p>
			</div>

			<!-- Divider -->
			<div class="border-t border-white/[0.06]"></div>

			<!-- Survey Info -->
			<div class="bg-primary-500/10 rounded-xl p-6 space-y-4">
				<div class="space-y-2 text-sm text-primary-300">
					<p class="flex items-start gap-2">
						<span class="text-primary-400 font-bold mt-0.5">&#8226;</span>
						<span>Complete the survey honestly and carefully</span>
					</p>
					<p class="flex items-start gap-2">
						<span class="text-primary-400 font-bold mt-0.5">&#8226;</span>
						<span>You'll earn points upon successful completion</span>
					</p>
				</div>
			</div>

			<!-- Countdown -->
			<div class="text-center space-y-4">
				{#if !redirecting}
					<p class="text-neutral-400">
						Redirecting in <span class="text-2xl font-bold text-primary-400">{countdown}</span> seconds...
					</p>
					<div class="flex items-center justify-center gap-2">
					<Loader2 class="w-5 h-5 text-primary-500 animate-spin" />
						<span class="text-sm text-neutral-500">Preparing your survey session</span>
					</div>
				{:else}
					<p class="text-neutral-400 flex items-center justify-center gap-2">
						<Loader2 class="w-5 h-5 text-primary-500 animate-spin" />
						<span>Redirecting now...</span>
					</p>
				{/if}
			</div>

			<!-- Manual Redirect Button -->
			<div class="pt-4">
				<button
					onclick={redirectToSurvey}
					disabled={redirecting}
					class="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
				>
					{#if redirecting}
						<Loader2 class="w-5 h-5 animate-spin" />
						<span>Redirecting...</span>
					{:else}
						<span>Start Survey Now</span>
						<ArrowRight class="w-5 h-5" />
					{/if}
				</button>
			</div>

			<!-- Footer Note -->
			<p class="text-xs text-center text-neutral-600 pt-4">
				If you're not redirected automatically, click the button above to start the survey.
			</p>
		</div>
	</div>
</div>
