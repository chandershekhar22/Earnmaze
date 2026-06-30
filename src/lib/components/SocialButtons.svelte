<script lang="ts">
	import { onMount } from 'svelte';
	import { getAnonId } from '$lib/utils/anon-id';
	import { loadEngagementStats } from '$lib/utils/engagement';

	let {
		kind,
		id,
		title = '',
		shareUrl: shareUrlProp = '',
		likes = 0,
		shares = 0,
		liked = false,
		variant = 'card',
	} = $props<{
		kind: string;
		id: string;
		title?: string;
		/** Explicit URL to share. Defaults to /{kind}/{id} on the current origin. */
		shareUrl?: string;
		likes?: number;
		shares?: number;
		liked?: boolean;
		variant?: 'card' | 'bar';
	}>();

	// Local, optimistic state seeded from SSR counts.
	let likeCount = $state(likes);
	let shareCount = $state(shares);
	let isLiked = $state(liked);
	let busy = $state(false);
	let mutated = $state(false);
	let menuOpen = $state(false);
	let root: HTMLDivElement;

	// Hydrate this browser's `liked` flag (and freshest counts) after mount.
	onMount(() => {
		let alive = true;
		loadEngagementStats(kind).then((map) => {
			const s = map?.[id];
			// Don't clobber a like/share the user fired before hydration landed.
			if (alive && s && !mutated) {
				likeCount = s.likes;
				shareCount = s.shares;
				isLiked = s.liked;
			}
		});
		const onDoc = (e: MouseEvent) => {
			if (menuOpen && root && !root.contains(e.target as Node)) menuOpen = false;
		};
		document.addEventListener('click', onDoc);
		return () => {
			alive = false;
			document.removeEventListener('click', onDoc);
		};
	});

	function stop(e: Event) {
		// Cards may be wrapped in <a> or have their own click handler — keep
		// like/share clicks from navigating or opening the item.
		e.preventDefault();
		e.stopPropagation();
	}

	async function toggleLike(e: Event) {
		stop(e);
		if (busy) return;
		busy = true;
		mutated = true;
		const prevLiked = isLiked;
		isLiked = !isLiked;
		likeCount += isLiked ? 1 : -1;
		try {
			const res = await fetch(`/api/engagement/${kind}/${id}/like`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ anon_id: getAnonId() }),
			});
			if (!res.ok) throw new Error('like failed');
			const s = await res.json();
			likeCount = s.likes;
			isLiked = s.liked;
		} catch {
			isLiked = prevLiked;
			likeCount += prevLiked ? 1 : -1;
		} finally {
			busy = false;
		}
	}

	function resolvedUrl(): string {
		const origin = typeof location !== 'undefined' ? location.origin : '';
		if (shareUrlProp) {
			if (/^https?:\/\//.test(shareUrlProp)) return shareUrlProp;
			return origin + (shareUrlProp.startsWith('/') ? shareUrlProp : `/${shareUrlProp}`);
		}
		return `${origin}/${kind}/${id}`;
	}

	async function recordShare(channel: string) {
		mutated = true;
		shareCount += 1; // optimistic
		try {
			const res = await fetch(`/api/engagement/${kind}/${id}/share`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ anon_id: getAnonId(), channel }),
			});
			if (res.ok) {
				const s = await res.json();
				shareCount = s.shares;
			}
		} catch {
			/* count is best-effort */
		}
	}

	async function nativeOrMenu(e: Event) {
		stop(e);
		const url = resolvedUrl();
		if (typeof navigator !== 'undefined' && 'share' in navigator) {
			try {
				await (navigator as any).share({ title: title || 'EarnMaze', url });
				await recordShare('native');
				return;
			} catch {
				/* cancelled or unsupported — fall through to menu */
			}
		}
		menuOpen = !menuOpen;
	}

	async function copyLink(e: Event) {
		stop(e);
		menuOpen = false;
		try {
			await navigator.clipboard.writeText(resolvedUrl());
		} catch {
			/* clipboard may be blocked; still count the intent */
		}
		await recordShare('copy');
	}

	async function shareTo(channel: 'twitter' | 'whatsapp' | 'facebook', e: Event) {
		stop(e);
		menuOpen = false;
		const url = encodeURIComponent(resolvedUrl());
		const text = encodeURIComponent(
			title ? `Check out "${title}" on EarnMaze` : 'Check this out on EarnMaze',
		);
		const hrefs: Record<string, string> = {
			twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
			whatsapp: `https://wa.me/?text=${text}%20${url}`,
			facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
		};
		if (typeof window !== 'undefined') window.open(hrefs[channel], '_blank', 'noopener,noreferrer');
		await recordShare(channel);
	}

	function fmt(n: number): string {
		if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0) + 'k';
		return String(n);
	}
</script>

<div class="as as-{variant}" bind:this={root}>
	<button
		class="as-btn as-like"
		class:on={isLiked}
		onclick={toggleLike}
		disabled={busy}
		aria-pressed={isLiked}
		aria-label={isLiked ? 'Unlike' : 'Like'}
		title={isLiked ? 'Unlike' : 'Like'}
	>
		<svg class="as-ico" viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M12 21s-7.5-4.6-10-9.2C.7 9 1.6 5.6 4.7 4.6 6.8 3.9 9 4.8 12 7.7c3-2.9 5.2-3.8 7.3-3.1 3.1 1 4 4.4 2.7 7.2C19.5 16.4 12 21 12 21Z"
			/>
		</svg>
		<span class="as-n">{fmt(likeCount)}</span>
	</button>

	<div class="as-share-wrap">
		<button
			class="as-btn as-share"
			onclick={nativeOrMenu}
			aria-haspopup="menu"
			aria-expanded={menuOpen}
			aria-label="Share"
			title="Share"
		>
			<svg class="as-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
				<path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
			</svg>
			<span class="as-n">{fmt(shareCount)}</span>
		</button>

		{#if menuOpen}
			<div class="as-menu" role="menu">
				<button role="menuitem" onclick={copyLink}>Copy link</button>
				<button role="menuitem" onclick={(e) => shareTo('twitter', e)}>Share on X</button>
				<button role="menuitem" onclick={(e) => shareTo('whatsapp', e)}>WhatsApp</button>
				<button role="menuitem" onclick={(e) => shareTo('facebook', e)}>Facebook</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.as {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.as-share-wrap {
		position: relative;
	}
	.as-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: #9aa0ad;
		font: inherit;
		font-size: 12px;
		font-weight: 600;
		line-height: 1;
		cursor: pointer;
		transition: all 0.18s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.as-btn:hover {
		color: #f1f2f5;
		border-color: rgba(255, 255, 255, 0.22);
		background: rgba(255, 255, 255, 0.07);
	}
	.as-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.as-ico {
		width: 15px;
		height: 15px;
		display: block;
		fill: currentColor;
		flex-shrink: 0;
	}
	.as-share .as-ico {
		fill: none;
	}
	.as-n {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		min-width: 8px;
	}
	.as-like.on {
		color: #ff7a8a;
		border-color: rgba(255, 122, 138, 0.4);
		background: rgba(255, 122, 138, 0.12);
	}
	.as-like.on:hover {
		color: #ff7a8a;
	}
	.as-like.on .as-ico {
		animation: pop 0.28s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	@keyframes pop {
		0% {
			transform: scale(1);
		}
		45% {
			transform: scale(1.35);
		}
		100% {
			transform: scale(1);
		}
	}

	.as-menu {
		position: absolute;
		right: 0;
		bottom: calc(100% + 8px);
		z-index: 50;
		display: flex;
		flex-direction: column;
		min-width: 150px;
		padding: 6px;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: #141821;
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
	}
	.as-menu button {
		text-align: left;
		padding: 9px 12px;
		border-radius: 8px;
		border: 0;
		background: transparent;
		color: #f1f2f5;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}
	.as-menu button:hover {
		background: rgba(255, 255, 255, 0.07);
	}

	/* Viewer bar variant — slightly larger touch targets, menu drops down. */
	.as-bar .as-btn {
		padding: 8px 14px;
		font-size: 13px;
	}
	.as-bar .as-ico {
		width: 16px;
		height: 16px;
	}
	.as-bar .as-menu {
		bottom: auto;
		top: calc(100% + 8px);
	}
</style>
