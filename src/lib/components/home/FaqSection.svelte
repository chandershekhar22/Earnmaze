<script lang="ts">
	import Icon from './Icon.svelte';

	const faqs = [
		{
			q: 'How do streaks work?',
			a: 'Complete at least one earning action per day to build your streak. Multipliers start at 1× and climb to 5× by day 30. Streak Shields protect your progress if you miss a day.'
		},
		{
			q: 'What kind of quizzes are available?',
			a: 'Fresh quizzes daily across 12+ categories including pop culture, science, geography, sports, history, and tech. Each takes 1–3 minutes and earns 50–200 points.'
		},
		{
			q: 'How fast can I cash out?',
			a: 'Request a payout once your wallet hits $10. Choose PayPal or gift cards. Most payments processed within 24 hours.'
		},
		{
			q: 'Is EarnMaze really free?',
			a: '100% free. No subscription, no credit card, no hidden costs. Brand partnerships fund the rewards.'
		},
		{
			q: 'What games can I play?',
			a: 'Trivia Quiz, Word Scramble, Spin the Wheel, Scratch Cards, Quiz Sprint, and Daily Challenges. New games added regularly with seasonal events.'
		},
		{
			q: 'Is my data safe?',
			a: 'We use industry-standard encryption and never sell personal data. Every payout is human-reviewed for fraud prevention.'
		}
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
			<span class="eyebrow acc" style="justify-self:center"><span class="dot"></span>FAQ</span>
			<h2 class="h1 reveal" style="margin-top:18px">Common questions, straight answers.</h2>
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
