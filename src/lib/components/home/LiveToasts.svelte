<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import * as m from '$lib/paraglide/messages';

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
		m.home_toast_act1(),
		m.home_toast_act2(),
		m.home_toast_act3(),
		m.home_toast_act4(),
		m.home_toast_act5(),
		m.home_toast_act6(),
		m.home_toast_act7(),
		m.home_toast_act8(),
		m.home_toast_act9()
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
