<script lang="ts">
	import { Globe } from '@lucide/svelte';
	import { cookieName, getLocale, localizeUrl, locales } from '$lib/paraglide/runtime';
	import { Logger } from '$lib/utils/app-logger';

	type Variant = 'public' | 'panelist';
	type Placement = 'top' | 'bottom';
	let { variant = 'public', placement = 'bottom' }: { variant?: Variant; placement?: Placement } = $props();

	// Display labels for each locale. Native names so users in any language
	// can identify their own.
	const labels: Record<string, string> = {
		en: 'English',
		es: 'Español',
		fr: 'Français',
		pt: 'Português',
		ar: 'العربية'
	};

	let open = $state(false);
	let saving = $state(false);
	const current = $derived(getLocale());

	function close() {
		open = false;
	}

	async function pick(target: string) {
		if (target === current) {
			close();
			return;
		}

		// For panelist (logged-in) pages: persist preference to the user's
		// account so it follows them across devices.
		if (variant === 'panelist') {
			saving = true;
			try {
				const res = await fetch('/api/panelist/locale', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ locale: target })
				});
				if (!res.ok) throw new Error('Failed to save language preference');
			} catch (err) {
				Logger.root.warn({ context: 'i18n', error: err }, 'Could not persist locale');
			} finally {
				saving = false;
			}
		}

		close();

		// We deliberately don't use Paraglide's setLocale() here because it
		// navigates with `location.href = ...` which pushes a new history
		// entry — clicking Back would return to the old-locale URL.
		// Instead: set the cookie ourselves, compute the localized URL, and
		// `replace()` so the language change is invisible to history.
		document.cookie = `${cookieName}=${target}; path=/; max-age=${60 * 60 * 24 * 365}`;
		const target_url = localizeUrl(window.location.href, { locale: target as any }).href;
		window.location.replace(target_url);
	}
</script>

<div class="relative inline-block">
	<button
		type="button"
		onclick={() => (open = !open)}
		disabled={saving}
		class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04] disabled:opacity-50"
		aria-haspopup="listbox"
		aria-expanded={open}
	>
		<Globe class="w-4 h-4" />
		<span>{labels[current] ?? current}</span>
	</button>

	{#if open}
		<!-- backdrop to close on outside click -->
		<button
			type="button"
			class="fixed inset-0 z-40 cursor-default"
			aria-label="Close language menu"
			onclick={close}
		></button>

		<ul
			role="listbox"
			class="absolute end-0 z-50 min-w-[180px] bg-surface-100 border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden {placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}"
		>
			{#each locales as l}
				<li>
					<button
						type="button"
						role="option"
						aria-selected={l === current}
						onclick={() => pick(l)}
						class="w-full text-start px-4 py-2 text-sm transition-colors {l === current
							? 'bg-primary-500/10 text-primary-300'
							: 'text-neutral-300 hover:bg-white/[0.04]'}"
					>
						{labels[l] ?? l}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
