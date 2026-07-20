<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	const reviews = [
		{
			av: 'JM',
			name: 'Jessica M.',
			date: 'March 2026',
			body: m.home_reviews_r1_body(),
			tag: m.home_reviews_tag_streaks()
		},
		{
			av: 'DK',
			name: 'David K.',
			date: 'April 2026',
			body: m.home_reviews_r2_body(),
			tag: m.home_nav_link_quizzes()
		},
		{
			av: 'TR',
			name: 'Tamika R.',
			date: 'Feb 2026',
			body: m.home_reviews_r3_body(),
			tag: m.nav_surveys()
		},
		{
			av: 'MH',
			name: 'Marcus H.',
			date: 'March 2026',
			body: m.home_reviews_r4_body(),
			tag: m.home_reviews_tag_challenges()
		},
		{
			av: 'AP',
			name: 'Alyssa P.',
			date: 'April 2026',
			body: m.home_reviews_r5_body(),
			tag: m.home_reviews_tag_streaks()
		}
	];
</script>

<!-- ============ REVIEWS ============ -->
<section class="rev">
	<div class="wrap">
		<div class="rev-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>{m.home_reviews_eyebrow()}</span>
				<h2 class="h1 reveal" style="margin-top:18px">{m.home_reviews_title()}</h2>
			</div>
			<div class="rev-badge reveal d1">
				<span class="rev-stars">★★★★★</span> {m.auth_login_trust_reviews()}
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
