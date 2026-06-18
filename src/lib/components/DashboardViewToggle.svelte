<script lang="ts">
	import { goto } from '$app/navigation';
	import { ClipboardList, Compass } from '@lucide/svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	let { current }: { current: 'surveys' | 'discover' } = $props();

	let saving = $state(false);

	async function switchTo(view: 'surveys' | 'discover') {
		if (saving || view === current) return;
		saving = true;
		try {
			const res = await fetch('/api/panelist/dashboard-view', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ view, onboarded: true }),
			});
			if (!res.ok) throw new Error('failed');
			await goto(view === 'discover' ? '/discover' : '/dashboard');
		} catch {
			saving = false;
			toastStore.error('Could not switch view', 'Please try again.');
		}
	}
</script>

<div class="fixed bottom-5 right-5 z-30 flex items-center gap-2 px-2 py-2 rounded-2xl bg-surface-100/90 backdrop-blur-md border border-white/[0.1] shadow-2xl shadow-black/40">
	<span class="hidden sm:inline font-mono text-[10px] text-neutral-500 uppercase tracking-[0.14em] pl-1.5">View</span>
	<button
		type="button"
		onclick={() => switchTo('surveys')}
		disabled={saving}
		class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-medium transition-colors disabled:opacity-60
			{current === 'surveys' ? 'bg-violet-500/90 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'}"
	>
		<ClipboardList class="w-3.5 h-3.5" /> Survey
	</button>
	<button
		type="button"
		onclick={() => switchTo('discover')}
		disabled={saving}
		class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-medium transition-colors disabled:opacity-60
			{current === 'discover' ? 'bg-primary-400 text-surface' : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'}"
	>
		<Compass class="w-3.5 h-3.5" /> Discover
	</button>
</div>
