<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';

	const steps = [
		{
			n: m.home_how_step1_n(),
			icon: 'spark',
			title: m.home_how_step1_title(),
			body: m.home_how_step1_body()
		},
		{
			n: m.home_how_step2_n(),
			icon: 'bolt',
			title: m.home_how_step2_title(),
			body: m.home_how_step2_body()
		},
		{
			n: m.home_how_step3_n(),
			icon: 'wallet',
			title: m.home_how_step3_title(),
			body: m.home_how_step3_body()
		}
	];
</script>

<!-- ============ HOW ============ -->
<section class="how" id="how">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>{m.home_nav_link_how()}</span>
				<h2 class="h1 reveal" style="margin-top:18px">{m.home_how_title()}</h2>
			</div>
			<p class="body-lg reveal d1">
				{m.home_how_lead()}
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
