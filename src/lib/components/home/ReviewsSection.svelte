<script lang="ts">
	const reviews = [
		{
			av: 'JM',
			name: 'Jessica M.',
			date: 'March 2026',
			body: 'The streak system is addictive in the best way. 47 days in and earning way more than any other rewards app — $180 this month.',
			tag: 'Streaks'
		},
		{
			av: 'DK',
			name: 'David K.',
			date: 'April 2026',
			body: 'Love the daily quizzes. I look forward to opening the app every morning. Geography and science are my favorite — smarter and paid.',
			tag: 'Quizzes'
		},
		{
			av: 'TR',
			name: 'Tamika R.',
			date: 'Feb 2026',
			body: 'Way better than other reward apps. Surveys + streaks + quizzes keep things fresh. First $50 gift card in just two weeks.',
			tag: 'Surveys'
		},
		{
			av: 'MH',
			name: 'Marcus H.',
			date: 'March 2026',
			body: 'Weekly trivia tournament had a 50K pool. Placed 12th, got $25 in bonus. The community vibe is real.',
			tag: 'Challenges'
		},
		{
			av: 'AP',
			name: 'Alyssa P.',
			date: 'April 2026',
			body: 'Perfect for a stay-at-home mom. Quizzes during nap time, surveys after dinner. Streak Shield saved me twice. $320 total so far.',
			tag: 'Streaks'
		}
	];
</script>

<!-- ============ REVIEWS ============ -->
<section class="rev">
	<div class="wrap">
		<div class="rev-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>What members say</span>
				<h2 class="h1 reveal" style="margin-top:18px">Real people. Real rewards.</h2>
			</div>
			<div class="rev-badge reveal d1">
				<span class="rev-stars">★★★★★</span> <strong>4.7</strong> · 3,200+ reviews
			</div>
		</div>
	</div>
	<div class="rev-wrap">
		<!-- Cards are duplicated so the marquee scroll loops seamlessly. -->
		<div class="rev-track">
			{#each [...reviews, ...reviews] as r, i (i)}
				<div class="rev-card">
					<div class="rc-h">
						<div class="rc-av">{r.av}</div>
						<div class="rc-info">
							<div class="n">{r.name}</div>
							<div class="d">{r.date}</div>
						</div>
						<div class="rc-st">★★★★★</div>
					</div>
					<div class="rc-body">{r.body}</div>
					<span class="rc-tag">{r.tag}</span>
				</div>
			{/each}
		</div>
	</div>
</section>
