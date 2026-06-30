<script lang="ts">
	import { goto } from '$app/navigation';
	import { FileText, Gamepad2, ArrowRight, Check } from '@lucide/svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	let { data }: { data: { firstName: string; currentView: 'surveys' | 'discover' } } = $props();

	type Choice = 'surveys' | 'discover';
	let selected = $state<Choice>(data.currentView ?? 'surveys');
	let saving = $state(false);

	async function save(view: Choice, target: string) {
		if (saving) return;
		saving = true;
		try {
			const res = await fetch('/api/panelist/dashboard-view', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ view, onboarded: true }),
			});
			if (!res.ok) throw new Error('save failed');
			await goto(target);
		} catch {
			saving = false;
			toastStore.error('Something went wrong', 'Could not save your choice. Please try again.');
		}
	}

	function handleContinue() {
		save(selected, selected === 'discover' ? '/discover' : '/dashboard');
	}

	function skip() {
		// Skipping keeps the default surveys view but still completes onboarding
		// so the chooser does not reappear on every login.
		save('surveys', '/dashboard');
	}

	const cards = [
		{
			id: 'surveys' as Choice,
			icon: FileText,
			title: "Yes — I'm into surveys",
			desc: 'Share your opinion on brands and products. Steady points, the classic way to earn.',
			tags: ['Paid surveys', '5–20 min', 'Steady pts'],
		},
		{
			id: 'discover' as Choice,
			icon: Gamepad2,
			title: 'Not really — show me other ways',
			desc: 'Streaks, quizzes, games, deals and challenges. Earn while you play and explore.',
			tags: ['Quizzes', 'Games', 'Streaks'],
		},
	];
</script>

<svelte:head>
	<title>Personalize — EarnMaze</title>
</svelte:head>

<div class="min-h-screen bg-surface flex items-center justify-center px-5 py-12">
	<div class="w-full max-w-3xl mx-auto animate-fade-in">
		<!-- Step pill -->
		<div class="flex justify-center mb-7">
			<span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.1] bg-surface-50 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-400">
				<span class="relative flex h-[6px] w-[6px]">
					<span class="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-60"></span>
					<span class="relative rounded-full h-[6px] w-[6px] bg-primary-400"></span>
				</span>
				Step 1 of 1 · Personalize
			</span>
		</div>

		<!-- Heading -->
		<h1 class="text-center text-[clamp(28px,4.4vw,46px)] font-bold tracking-tight leading-[1.08] text-white mb-4">
			Welcome, <span class="text-primary-400">{data.firstName}</span>. How do you like to earn?
		</h1>
		<p class="text-center text-[15px] text-neutral-400 max-w-md mx-auto mb-10">
			We'll tailor your dashboard to match. You can always change this later in Profile.
		</p>

		<!-- Choice cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-9">
			{#each cards as card}
				{@const active = selected === card.id}
				<button
					type="button"
					onclick={() => (selected = card.id)}
					class="relative text-left rounded-2xl p-6 border transition-all duration-200
						{active
							? 'border-primary-400/60 bg-gradient-to-br from-primary-400/[0.1] to-surface-50/60 ring-1 ring-inset ring-primary-400/30'
							: 'border-white/[0.09] bg-surface-50/60 hover:border-white/20 hover:bg-surface-50'}"
				>
					<!-- radio -->
					<span class="absolute top-5 right-5 w-5 h-5 rounded-full grid place-items-center border transition-colors
						{active ? 'border-primary-400 bg-primary-400 text-surface' : 'border-white/25'}">
						{#if active}<Check class="w-3.5 h-3.5" />{/if}
					</span>

					<span class="w-11 h-11 rounded-[12px] grid place-items-center mb-5
						{active ? 'bg-primary-400/15 text-primary-400' : 'bg-white/[0.05] text-neutral-300'}">
						<card.icon class="w-[22px] h-[22px]" />
					</span>

					<h3 class="text-[18px] font-semibold text-white tracking-tight mb-2">{card.title}</h3>
					<p class="text-[13.5px] text-neutral-400 leading-relaxed mb-4">{card.desc}</p>

					<div class="flex flex-wrap gap-2">
						{#each card.tags as tag}
							<span class="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.07] font-mono text-[11px] text-neutral-400">{tag}</span>
						{/each}
					</div>
				</button>
			{/each}
		</div>

		<!-- Continue -->
		<div class="flex flex-col items-center gap-4">
			<button
				type="button"
				onclick={handleContinue}
				disabled={saving}
				class="btn-primary !px-8 !py-3.5 !text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
			>
				{saving ? 'Saving…' : 'Continue'}
				{#if !saving}<ArrowRight class="w-[18px] h-[18px]" />{/if}
			</button>
			<button
				type="button"
				onclick={skip}
				disabled={saving}
				class="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors disabled:opacity-60"
			>
				Skip for now
			</button>
		</div>
	</div>
</div>
