<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';

	const reasons = [
		{
			icon: 'wallet',
			title: m.home_why_r1_title(),
			body: m.home_why_r1_body()
		},
		{
			icon: 'clock',
			title: m.home_why_r2_title(),
			body: m.home_why_r2_body()
		},
		{
			icon: 'flame',
			title: m.home_why_r3_title(),
			body: m.home_why_r3_body()
		},
		{
			icon: 'brain',
			title: m.home_why_r4_title(),
			body: m.home_why_r4_body()
		},
		{
			icon: 'shield',
			title: m.home_why_r5_title(),
			body: m.home_why_r5_body()
		},
		{
			icon: 'target',
			title: m.home_why_r6_title(),
			body: m.home_why_r6_body()
		}
	];
</script>

<!-- ============ WHY ============ -->
<section class="why">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>{m.home_why_eyebrow()}</span>
				<h2 class="h1 reveal" style="margin-top:18px">{m.home_why_title()}</h2>
			</div>
			<p class="body-lg reveal d1">
				{m.home_why_lead()}
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
