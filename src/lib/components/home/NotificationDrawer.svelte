<script lang="ts">
	import Icon from './Icon.svelte';

	let { open, onClose }: { open: boolean; onClose: () => void } = $props();

	const tabs = ['All', 'Rewards', 'Polls', 'System'];
	let activeTab = $state('All');

	const items = [
		{
			icon: 'coin',
			title: '+250 Bonus Points',
			text: '14-day streak milestone reached. Keep going!',
			time: '2m'
		},
		{
			icon: 'doc',
			title: 'New Polls Available',
			text: 'Brand perception survey — 3 min, +$1.50',
			time: '18m'
		},
		{
			icon: 'flame',
			title: 'Streak Shield Activated',
			text: 'Your streak is protected for the next 24 hours.',
			time: '1h'
		},
		{
			icon: 'trophy',
			title: 'Weekly Challenge Complete',
			text: 'You earned 500 bonus points from the trivia tournament.',
			time: '3h'
		},
		{
			icon: 'wallet',
			title: 'Payout Processed',
			text: '$25.00 sent to your PayPal. Check your email.',
			time: '1d'
		},
		{
			icon: 'chart',
			title: 'Quiz Results',
			text: 'You scored 4/5 on Science Trivia. +40 pts earned.',
			time: '1d'
		}
	];
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onClose()} />

<button class="notif-overlay" class:open onclick={onClose} aria-label="Close notifications"
></button>

<aside class="notif-drawer" class:open>
	<div class="notif-header">
		<h3>Notifications</h3>
		<button class="notif-close" onclick={onClose} aria-label="Close notifications">
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
