<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	const names = [
		'Priya',
		'Marcus',
		'Sarah',
		'Alex',
		'Tamika',
		'Derek',
		'Alyssa',
		'James',
		'Lisa',
		'Ryan',
		'Emma',
		'Tom'
	];
	const acts = [
		'completed a survey · +$1.50',
		"finished today's quiz · +50 pts",
		'claimed a 7-day bonus · +100 pts',
		'cashed out $25 to PayPal',
		'won 200 coins in Trivia',
		'started a new streak',
		'reached Lvl 30',
		'earned 150 pts on Quiz Sprint',
		'unlocked Streak Shield'
	];

	type Toast = { id: number; name: string; act: string };
	let toasts = $state<Toast[]>([]);

	onMount(() => {
		let li = 0;
		let nextId = 0;
		let timer: number;

		const tick = () => {
			// Append the newest and keep at most three visible.
			toasts = [
				...toasts,
				{ id: nextId++, name: names[li % names.length], act: acts[li % acts.length] }
			].slice(-3);
			li++;
			timer = window.setTimeout(tick, 4500 + Math.random() * 2500);
		};

		timer = window.setTimeout(tick, 2500);
		return () => clearTimeout(timer);
	});
</script>

<div class="live">
	{#each toasts as t (t.id)}
		<div class="toast" out:fade={{ duration: 300 }}>
			<span class="td"></span><span><strong>{t.name}</strong> {t.act}</span>
		</div>
	{/each}
</div>
