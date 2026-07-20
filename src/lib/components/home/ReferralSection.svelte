<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';

	const refLink = 'earnmaze.com/r/sarah-m-4829';

	const tiers = [
		{ n: '01', title: m.home_refer_tier1_title(), sub: m.home_refer_tier1_sub(), reward: m.home_refer_tier1_reward(), cls: 'on' },
		{
			n: '02',
			title: m.home_refer_tier2_title(),
			sub: m.home_refer_tier2_sub(),
			reward: m.home_refer_tier2_reward(),
			cls: 'on'
		},
		{
			n: '03',
			title: m.home_refer_tier3_title(),
			sub: m.home_refer_tier3_sub(),
			reward: m.home_refer_tier3_reward(),
			cls: ''
		},
		{
			n: '04',
			title: m.home_refer_tier4_title(),
			sub: m.home_refer_tier4_sub(),
			reward: m.home_refer_tier4_reward(),
			cls: 'lock'
		}
	];

	let copyLabel = $state(m.home_refer_copy());

	function copyRef() {
		if (navigator.clipboard) navigator.clipboard.writeText(refLink);
		copyLabel = m.home_refer_copied();
		setTimeout(() => (copyLabel = m.home_refer_copy()), 1800);
	}
</script>

<!-- ============ REFERRAL ============ -->
<section class="refer" id="refer">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>{m.home_refer_eyebrow()}</span>
				<h2 class="h1 reveal" style="margin-top:18px">{m.home_refer_title()}</h2>
			</div>
			<p class="body-lg reveal d1">
				{m.home_refer_lead()}
			</p>
		</div>
		<div class="refer-grid">
			<div class="reveal">
				<h3>{m.home_refer_link_heading()}</h3>
				<p class="lead">
					{m.home_refer_link_desc()}
				</p>
				<div class="refer-link">
					<input value={refLink} readonly aria-label={m.home_refer_link_aria()} />
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
						> {m.home_refer_share_save()}</button
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
						> {m.home_refer_share_email()}</button
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
