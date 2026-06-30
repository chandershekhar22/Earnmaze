<script lang="ts">
	const pressLogos = [
		'Forbes',
		'Business Insider',
		'The Wall Street Journal',
		'TechCrunch',
		'FinanceBuzz',
		'Mashable',
		'The Penny Hoarder',
		"Men's Journal"
	];
</script>

<!-- ============ PRESS ============ -->
<section class="press">
	<div class="press-l">As seen in</div>
	<!-- Logos are duplicated so the marquee scroll loops seamlessly. -->
	<div class="press-track">
		{#each [...pressLogos, ...pressLogos] as logo, i (i)}
			<span>{logo}</span>
		{/each}
	</div>
</section>
