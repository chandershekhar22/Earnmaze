<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';

	let { open, onClose }: { open: boolean; onClose: () => void } = $props();

	const tabs = [m.home_notif_tab_all(), m.home_notif_tab_rewards(), m.home_notif_tab_polls(), m.home_notif_tab_system()];
	let activeTab = $state(tabs[0]);

	const items = [
		{
			icon: 'coin',
			title: m.home_notif_i1_title(),
			text: m.home_notif_i1_text(),
			time: '2m'
		},
		{
			icon: 'doc',
			title: m.home_notif_i2_title(),
			text: m.home_notif_i2_text(),
			time: '18m'
		},
		{
			icon: 'flame',
			title: m.home_notif_i3_title(),
			text: m.home_notif_i3_text(),
			time: '1h'
		},
		{
			icon: 'trophy',
			title: m.home_notif_i4_title(),
			text: m.home_notif_i4_text(),
			time: '3h'
		},
		{
			icon: 'wallet',
			title: m.home_notif_i5_title(),
			text: m.home_notif_i5_text(),
			time: '1d'
		},
		{
			icon: 'chart',
			title: m.home_notif_i6_title(),
			text: m.home_notif_i6_text(),
			time: '1d'
		}
	];
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onClose()} />

<button class="notif-overlay" class:open onclick={onClose} aria-label={m.home_notif_close()}
></button>

<aside class="notif-drawer" class:open>
	<div class="notif-header">
		<h3>{m.home_notif_title()}</h3>
		<button class="notif-close" onclick={onClose} aria-label={m.home_notif_close()}>
			<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				><path d="M6 6l12 12M18 6L6 18" /></svg
			>
		</button>
	</div>
	<div class="notif-tabs">
		{#each tabs as tab (tab)}
			<button class="notif-tab" class:active={activeTab === tab} onclick={() => (activeTab = tab)}
				>{tab}</button
			>
		{/each}
	</div>
	<div class="notif-list">
		{#each items as item (item.title)}
			<div class="notif-item">
				<div class="ni-icon"><Icon name={item.icon} /></div>
				<div class="ni-text">
					<strong>{item.title}</strong>
					<p>{item.text}</p>
				</div>
				<div class="ni-time">{item.time}</div>
			</div>
		{/each}
	</div>
</aside>
