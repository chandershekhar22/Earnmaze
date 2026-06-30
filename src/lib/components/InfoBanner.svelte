<script lang="ts">
	import { Info, X } from '@lucide/svelte';
	import { browser } from '$app/environment';

	let { id, message, color = 'primary' }: { id: string; message: string; color?: 'primary' | 'amber' | 'emerald' } = $props();

	let dismissed = $state(false);

	// Check localStorage on mount
	$effect(() => {
		if (browser) {
			dismissed = localStorage.getItem(`info-${id}`) === '1';
		}
	});

	function dismiss() {
		dismissed = true;
		if (browser) localStorage.setItem(`info-${id}`, '1');
	}

	const colors = {
		primary: { wrap: 'bg-primary-400/[0.05] border-primary-400/15', ico: 'text-primary-500' },
		amber:   { wrap: 'bg-amber-500/[0.05] border-amber-500/15',     ico: 'text-amber-400' },
		emerald: { wrap: 'bg-emerald-500/[0.05] border-emerald-500/15', ico: 'text-emerald-400' },
	};
	let c = $derived(colors[color]);
</script>

{#if !dismissed}
	<div class="flex items-start gap-3 px-4 py-3 rounded-xl border text-[13.5px] leading-relaxed text-neutral-400 animate-fade-in {c.wrap}">
		<Info class="w-[18px] h-[18px] flex-shrink-0 mt-0.5 {c.ico}" />
		<span class="flex-1">{message}</span>
		<button onclick={dismiss} class="text-neutral-500 hover:text-white transition-colors flex-shrink-0" aria-label="Dismiss">
			<X class="w-4 h-4" />
		</button>
	</div>
{/if}
