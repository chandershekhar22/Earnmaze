<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';

	const faqs = [
		{ q: m.home_faq_q1(), a: m.home_faq_a1() },
		{ q: m.home_faq_q2(), a: m.home_faq_a2() },
		{ q: m.home_faq_q3(), a: m.home_faq_a3() },
		{ q: m.home_faq_q4(), a: m.home_faq_a4() },
		{ q: m.home_faq_q5(), a: m.home_faq_a5() },
		{ q: m.home_faq_q6(), a: m.home_faq_a6() }
	];

	let faqOpen = $state<number>(0);

	function toggleFaq(i: number) {
		faqOpen = faqOpen === i ? -1 : i;
	}
</script>

<!-- ============ FAQ ============ -->
<section class="faq" id="faq">
	<div class="wrap">
		<div class="section-head center">
			<span class="eyebrow acc" style="justify-self:center"><span class="dot"></span>{m.home_nav_link_faq()}</span>
			<h2 class="h1 reveal" style="margin-top:18px">{m.home_faq_title()}</h2>
		</div>
		<div class="faq-list">
			{#each faqs as item, i (i)}
				<div class="faq-item" class:open={faqOpen === i}>
					<button class="faq-q" onclick={() => toggleFaq(i)}
						>{item.q}
						<span class="faq-icon"><Icon name="plus" /></span>
					</button>
					<div class="faq-a"><div class="faq-a-in">{item.a}</div></div>
				</div>
			{/each}
		</div>
	</div>
</section>
