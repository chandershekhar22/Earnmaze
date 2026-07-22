<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
	import { onMount } from 'svelte';
	import { X } from '@lucide/svelte';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	function getToastStyles(type: string): string {
		switch (type) {
			case 'success':
				return 'border-emerald-500/20 text-emerald-300';
			case 'error':
				return 'border-rose-500/20 text-rose-300';
			case 'warning':
				return 'border-amber-500/20 text-amber-300';
			case 'info':
			default:
				return 'border-primary-500/20 text-primary-300';
		}
	}

	function getIcon(type: string): string {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			case 'info':
			default:
				return 'ℹ';
		}
	}
</script>

{#if mounted}
	<div class="fixed top-20 end-4 z-[200] space-y-2 max-w-sm">
		{#each toastStore.toasts as toast (toast.id)}
			<div
				class="flex items-start p-4 rounded-xl border bg-surface-100/90 backdrop-blur-xl shadow-2xl shadow-black/20 animate-in {getToastStyles(toast.type)}"
				role="alert"
				aria-live="assertive"
			>
				<div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold me-3 {toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : toast.type === 'error' ? 'bg-rose-500/10 text-rose-400' : toast.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-primary-500/10 text-primary-400'}">
					{getIcon(toast.type)}
				</div>

				<div class="flex-1 min-w-0">
					<p class="text-sm font-semibold text-white">{toast.title}</p>
					{#if toast.message}
						<p class="text-sm opacity-80 mt-1">{toast.message}</p>
					{/if}

					{#if toast.action}
						<button
							onclick={() => {
								toast.action?.handler();
								toastStore.remove(toast.id);
							}}
							class="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-100 rounded px-1 py-0.5 {toast.type === 'success' ? 'focus:ring-emerald-500' : toast.type === 'error' ? 'focus:ring-rose-500' : toast.type === 'warning' ? 'focus:ring-amber-500' : 'focus:ring-primary-500'}"
						>
							{toast.action.label}
						</button>
					{/if}
				</div>

				<button
					onclick={() => toastStore.remove(toast.id)}
					class="flex-shrink-0 ms-3 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-100 focus:ring-neutral-500 text-neutral-500 hover:text-neutral-300"
					aria-label="Close notification"
				>
					<X class="w-3 h-3" />
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes slide-in-from-end-2 {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-in {
		animation: slide-in-from-end-2 0.3s ease-out;
	}
</style>
