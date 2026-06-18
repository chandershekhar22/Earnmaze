<script lang="ts">
	import Icon from './Icon.svelte';

	const trust = ['No credit card', 'Cash out from $10', '60-second signup'];
</script>

<!-- ============ CTA ============ -->
<section class="cta" id="cta">
	<div class="wrap cta-inner">
		<h2 class="reveal">Stop scrolling.<br />Start <em>earning.</em></h2>
		<p class="reveal d1">
			Join 4.2 million US members getting paid for streaks, quizzes, surveys, games, and deals —
			every single day.
		</p>
		<a href="/register" class="btn btn-pri btn-lg reveal d2"
			>Create your free account <Icon name="arrow" /></a
		>
		<div class="cta-trust reveal d3">
			{#each trust as item (item)}
				<span><Icon name="check" /> {item}</span>
			{/each}
		</div>
	</div>
</section>
