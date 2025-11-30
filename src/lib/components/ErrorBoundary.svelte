<script lang="ts">
	import { onMount } from 'svelte';
	import { Logger } from '$lib/utils/app-logger';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { Snippet } from 'svelte';

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
			Logger.errors.error('Component error caught by boundary', {
				error: err.message,
				stack: err.stack,
				errorId,
				component: 'ErrorBoundary',
				errorInfo
			});
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
		<div class="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-6 text-center">
			<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
				</svg>
			</div>

			<h3 class="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
			<p class="text-gray-600 mb-6">
				We encountered an unexpected error. This has been logged and our team has been notified.
			</p>

			{#if errorId}
				<div class="bg-gray-50 rounded p-3 mb-4 text-left">
					<div class="text-xs text-gray-500 mb-1">Error ID</div>
					<div class="font-mono text-sm text-gray-800">{errorId}</div>
				</div>
			{/if}

			<div class="flex space-x-3 justify-center">
				<button
					onclick={retry}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
				>
					Try Again
				</button>
				<button
					onclick={() => window.location.reload()}
					class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
				>
					Refresh Page
				</button>
			</div>

			{#if fallback}
				<div class="mt-6 pt-6 border-t border-gray-200">
					{@render fallback({ error, errorId })}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Normal content -->
	{@render children()}
{/if}