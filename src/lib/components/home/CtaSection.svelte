<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const trust = [m.home_cta2_trust1(), m.home_cta2_trust2(), m.home_cta2_trust3()];
</script>

<!-- ============ CTA ============ -->
<section class="cta" id="cta">
	<div class="wrap cta-inner">
		<h2 class="reveal">{m.home_cta2_title_stop()}<br /><em>{m.home_cta2_title_start()}</em></h2>
		<p class="reveal d1">
			{m.home_cta2_lead()}
		</p>
		<a href={localizeHref('/register')} class="btn btn-pri btn-lg reveal d2"
			>{m.home_cta2_cta()} <Icon name="arrow" /></a
		>
		<div class="cta-trust reveal d3">
			{#each trust as item, i (i)}
				<span><Icon name="check" /> {item}</span>
			{/each}
		</div>
	</div>
</section>
