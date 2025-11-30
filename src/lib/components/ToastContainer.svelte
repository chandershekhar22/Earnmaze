<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
	import { onMount } from 'svelte';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	function getToastStyles(type: string): string {
		switch (type) {
			case 'success':
				return 'bg-green-50 border-green-200 text-green-800';
			case 'error':
				return 'bg-red-50 border-red-200 text-red-800';
			case 'warning':
				return 'bg-yellow-50 border-yellow-200 text-yellow-800';
			case 'info':
			default:
				return 'bg-blue-50 border-blue-200 text-blue-800';
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
	<div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
		{#each toastStore.toasts as toast (toast.id)}
			<div
				class="flex items-start p-4 rounded-lg border shadow-lg backdrop-blur-sm bg-white/95 animate-in slide-in-from-right-2 fade-in duration-300 {getToastStyles(toast.type)}"
				role="alert"
				aria-live="assertive"
			>
				<div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 {toast.type === 'success' ? 'bg-green-100 text-green-600' : toast.type === 'error' ? 'bg-red-100 text-red-600' : toast.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}">
					{getIcon(toast.type)}
				</div>

				<div class="flex-1 min-w-0">
					<p class="text-sm font-semibold">{toast.title}</p>
					{#if toast.message}
						<p class="text-sm opacity-90 mt-1">{toast.message}</p>
					{/if}

					{#if toast.action}
						<button
							onclick={() => {
								toast.action?.handler();
								toastStore.remove(toast.id);
							}}
							class="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded px-1 py-0.5 {toast.type === 'success' ? 'focus:ring-green-500' : toast.type === 'error' ? 'focus:ring-red-500' : toast.type === 'warning' ? 'focus:ring-yellow-500' : 'focus:ring-blue-500'}"
						>
							{toast.action.label}
						</button>
					{/if}
				</div>

				<button
					onclick={() => toastStore.remove(toast.id)}
					class="flex-shrink-0 ml-3 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
					aria-label="Close notification"
				>
					<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
					</svg>
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes slide-in-from-right-2 {
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
		animation: slide-in-from-right-2 0.3s ease-out;
	}
</style>