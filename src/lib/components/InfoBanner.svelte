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
		primary: 'bg-primary-500/8 border-primary-500/15 text-primary-300',
		amber: 'bg-amber-500/8 border-amber-500/15 text-amber-300',
		emerald: 'bg-emerald-500/8 border-emerald-500/15 text-emerald-300',
	};
</script>

{#if !dismissed}
	<div class="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed {colors[color]} animate-fade-in">
		<Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-60" />
		<span class="flex-1">{message}</span>
		<button onclick={dismiss} class="p-0.5 opacity-40 hover:opacity-80 transition-opacity flex-shrink-0" aria-label="Dismiss">
			<X class="w-3 h-3" />
		</button>
	</div>
{/if}
