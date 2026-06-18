<script lang="ts">
	import Icon from './Icon.svelte';

	const reasons = [
		{
			icon: 'wallet',
			title: '$10 minimum cashout',
			body: 'No sky-high thresholds. Withdraw to PayPal or gift cards starting at ten dollars.'
		},
		{
			icon: 'clock',
			title: '24-hour payouts',
			body: 'Most withdrawals processed within a single business day. No 4-week holds.'
		},
		{
			icon: 'flame',
			title: 'Streak multipliers',
			body: 'The more consistent you are, the more you earn. Up to 5× bonus multipliers.'
		},
		{
			icon: 'brain',
			title: 'Learn while you earn',
			body: "Daily quizzes mean you're growing knowledge — not tapping mindlessly."
		},
		{
			icon: 'shield',
			title: 'Data protected',
			body: 'Industry-standard encryption. We never sell your data. Privacy is non-negotiable.'
		},
		{
			icon: 'target',
			title: 'Personalized for you',
			body: 'AI-matched surveys, quizzes tuned to interests, deals based on what you actually buy.'
		}
	];
</script>

<!-- ============ WHY ============ -->
<section class="why">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>Why EarnMaze</span>
				<h2 class="h1 reveal" style="margin-top:18px">Built different. Pays better.</h2>
			</div>
			<p class="body-lg reveal d1">
				A daily engagement platform — not another survey wall. We reward consistency, not
				click-volume.
			</p>
		</div>
		<div class="why-grid">
			{#each reasons as reason, i (reason.title)}
				<div class="why-card reveal {i ? `d${i}` : ''}">
					<div class="why-ico"><Icon name={reason.icon} class="i-lg i" /></div>
					<h3>{reason.title}</h3>
					<p>{reason.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
