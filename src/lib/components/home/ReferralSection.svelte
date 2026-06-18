<script lang="ts">
	import Icon from './Icon.svelte';

	const refLink = 'earnmaze.com/r/sarah-m-4829';

	const tiers = [
		{ n: '01', title: 'Starter', sub: '1 referral', reward: '+500 pts', cls: 'on' },
		{
			n: '02',
			title: 'Rising',
			sub: '5 referrals · streak shield',
			reward: '+3,000 pts',
			cls: 'on'
		},
		{
			n: '03',
			title: 'Champion',
			sub: '15 referrals · premium surveys',
			reward: '+10,000 pts',
			cls: ''
		},
		{
			n: '04',
			title: 'Legend',
			sub: '50 referrals · VIP, 10× multiplier',
			reward: '+50,000 pts',
			cls: 'lock'
		}
	];

	let copyLabel = $state('Copy');

	function copyRef() {
		if (navigator.clipboard) navigator.clipboard.writeText(refLink);
		copyLabel = 'Copied';
		setTimeout(() => (copyLabel = 'Copy'), 1800);
	}
</script>

<!-- ============ REFERRAL ============ -->
<section class="refer" id="refer">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>Invite &amp; earn</span>
				<h2 class="h1 reveal" style="margin-top:18px">Share EarnMaze. Earn together.</h2>
			</div>
			<p class="body-lg reveal d1">
				Invite friends and earn bonus points for every active referral. Climb tiers for bigger
				rewards.
			</p>
		</div>
		<div class="refer-grid">
			<div class="reveal">
				<h3>Your personal referral link</h3>
				<p class="lead">
					You both earn 500 bonus points when they complete their first survey. No cap.
				</p>
				<div class="refer-link">
					<input value={refLink} readonly aria-label="Your referral link" />
					<button onclick={copyRef}>{copyLabel}</button>
				</div>
				<div class="refer-share">
					<button class="rshare"><Icon name="x" /> X</button>
					<button class="rshare"
						><svg
							class="i"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16l-8-4-8 4Z" /></svg
						> Save</button
					>
					<button class="rshare"
						><svg
							class="i"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path d="M4 7l8 6 8-6M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7M4 7l2-2h12l2 2" /></svg
						> Email</button
					>
				</div>
			</div>
			<div class="ladder reveal d1">
				{#each tiers as tier (tier.n)}
					<div class="tier {tier.cls}">
						<div class="tier-n">{tier.n}</div>
						<div class="tier-i">{tier.title}<span>{tier.sub}</span></div>
						<div class="tier-r">{tier.reward}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
