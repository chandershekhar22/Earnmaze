
<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	
	const PUBLIC_TURNSTILE_SITE_KEY = env.PUBLIC_TURNSTILE_SITE_KEY;
	
	// Props
	let {
		onVerify = () => {},
		onError = () => {},
		onExpire = () => {},
		theme = 'auto' as 'light' | 'dark' | 'auto',
		size = 'normal' as 'normal' | 'compact',
		action = '',
		cData = '',
		appearance = 'always' as 'always' | 'execute' | 'interaction-only',
	} = $props();
	
	let container: HTMLDivElement;
	let widgetId: string | undefined;
	let loaded = $state(false);
	let error = $state(false);
	
	// Load Turnstile script
	onMount(() => {
		if (!PUBLIC_TURNSTILE_SITE_KEY) {
			console.error('Turnstile site key not configured');
			error = true;
			return;
		}
		
		// Check if script already loaded
		if (window.turnstile) {
			renderWidget();
			return;
		}
		
		// Load Turnstile script
		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
		script.async = true;
		script.defer = true;
		
		script.onload = () => {
			loaded = true;
			renderWidget();
		};
		
		script.onerror = () => {
			console.error('Failed to load Turnstile script');
			error = true;
			onError();
		};
		
		document.head.appendChild(script);
		
		return () => {
			// Cleanup: remove widget
			if (widgetId && window.turnstile) {
				window.turnstile.remove(widgetId);
			}
		};
	});
	
	function renderWidget() {
		if (!window.turnstile || !container) return;
		
		widgetId = window.turnstile.render(container, {
			sitekey: PUBLIC_TURNSTILE_SITE_KEY,
			theme: theme,
			size: size,
			action: action,
			cData: cData,
			appearance: appearance,
			callback: (token: string) => {
				onVerify(token);
			},
			'error-callback': () => {
				error = true;
				onError();
			},
			'expired-callback': () => {
				onExpire();
			},
		});
	}
	
	// Public methods
	export function reset() {
		if (widgetId && window.turnstile) {
			window.turnstile.reset(widgetId);
			error = false;
		}
	}
	
	export function getResponse(): string | undefined {
		if (widgetId && window.turnstile) {
			return window.turnstile.getResponse(widgetId);
		}
		return undefined;
	}
</script>

<!-- Turnstile widget container -->
<div bind:this={container} class="turnstile-container"></div>

{#if error}
	<div class="text-red-600 text-sm mt-2">
		Failed to load CAPTCHA. Please refresh the page.
	</div>
{/if}

<style>
	.turnstile-container {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
	}
</style>

<svelte:options runes={true} />
