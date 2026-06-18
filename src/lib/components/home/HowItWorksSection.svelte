<script lang="ts">
	import Icon from './Icon.svelte';

	const steps = [
		{
			n: '01 — SIGN UP',
			icon: 'spark',
			title: 'Create your account',
			body: "30 seconds. No credit card. Tell us your interests and we'll personalize your dashboard."
		},
		{
			n: '02 — EARN',
			icon: 'bolt',
			title: 'Earn every day',
			body: 'Surveys, quizzes, games, deals, and streaks. Each action stacks into points and a streak bonus.'
		},
		{
			n: '03 — CASH OUT',
			icon: 'wallet',
			title: 'Cash out from $10',
			body: 'PayPal or gift cards. Most payouts land within 24 hours. No fees, no hidden minimums.'
		}
	];
</script>

<!-- ============ HOW ============ -->
<section class="how" id="how">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>How it works</span>
				<h2 class="h1 reveal" style="margin-top:18px">Three moves. That's the whole thing.</h2>
			</div>
			<p class="body-lg reveal d1">
				No courses, no subscriptions, no funnels. Quick actions that put real points in your wallet
				— every single day.
			</p>
		</div>
		<div class="how-grid">
			{#each steps as step, i (step.title)}
				<div class="step reveal {i ? `d${i}` : ''}">
					<div class="step-n">{step.n}</div>
					<div class="step-ico"><Icon name={step.icon} class="i-lg i" /></div>
					<h3>{step.title}</h3>
					<p>{step.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
