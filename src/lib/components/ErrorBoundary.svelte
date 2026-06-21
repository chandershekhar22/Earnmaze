<script lang="ts">
	import { onMount } from 'svelte';
	import { Logger } from '$lib/utils/app-logger';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { Snippet } from 'svelte';
	import { AlertCircle } from '@lucide/svelte';

	let {
		fallback,
		showToast = true,
		logError = true,
		children,
		onerror = () => {},
		onretry = () => {}
	}: {
		fallback?: Snippet<[{ error: Error | null; errorId: string | null }]>;
		showToast?: boolean;
		logError?: boolean;
		children: Snippet;
		onerror?: (event: { error: Error; errorId: string; errorInfo?: any }) => void;
		onretry?: () => void;
	} = $props();

	let error = $state<Error | null>(null);
	let errorId = $state<string | null>(null);

	// Error boundary logic
	function handleError(err: Error, errorInfo?: any) {
		error = err;
		errorId = Date.now().toString();

		if (logError) {
			Logger.root.error({ context: 'errors', error: err.message, stack: err.stack, errorId, component: 'ErrorBoundary', errorInfo }, 'Component error caught by boundary');
		}

		if (showToast) {
			toastStore.error(
				'Something went wrong',
				'An unexpected error occurred. Please refresh the page.',
				{
					action: {
						label: 'Refresh',
						handler: () => window.location.reload()
					}
				}
			);
		}

		onerror({ error: err, errorId: errorId!, errorInfo });
	}

	// Global error handler for this component tree
	onMount(() => {
		const handleGlobalError = (event: ErrorEvent) => {
			handleError(event.error || new Error(event.message), {
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno
			});
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			handleError(new Error(`Unhandled promise rejection: ${event.reason}`), {
				reason: event.reason
			});
		};

		window.addEventListener('error', handleGlobalError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleGlobalError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});

	function retry() {
		error = null;
		errorId = null;
		onretry();
	}
</script>

{#if error}
	<!-- Error fallback UI -->
	<div class="min-h-[400px] flex items-center justify-center p-8">
		<div class="max-w-md w-full bg-surface-100 rounded-2xl border border-rose-500/20 p-6 text-center">
			<div class="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
				<AlertCircle class="w-8 h-8 text-rose-400" />
			</div>

			<h3 class="text-lg font-semibold text-white mb-2">Oops! Something went wrong</h3>
			<p class="text-neutral-400 mb-6">
				We encountered an unexpected error. This has been logged and our team has been notified.
			</p>

			{#if errorId}
				<div class="bg-surface-200 rounded-lg p-3 mb-4 text-start">
					<div class="text-xs text-neutral-500 mb-1">Error ID</div>
					<div class="font-mono text-sm text-neutral-300">{errorId}</div>
				</div>
			{/if}

			<div class="flex space-x-3 justify-center">
				<button
					onclick={retry}
					class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors font-medium"
				>
					Try Again
				</button>
				<button
					onclick={() => window.location.reload()}
					class="px-4 py-2 bg-surface-200 text-neutral-400 rounded-lg hover:bg-white/[0.03] transition-colors font-medium"
				>
					Refresh Page
				</button>
			</div>

			{#if fallback}
				<div class="mt-6 pt-6 border-t border-white/[0.06]">
					{@render fallback({ error, errorId })}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Normal content -->
	{@render children()}
{/if}
