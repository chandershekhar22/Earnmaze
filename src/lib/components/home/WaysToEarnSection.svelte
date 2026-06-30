<script lang="ts">
	import Icon from './Icon.svelte';

	// `tag` is split into pre/em/post so the highlighted fragment renders without {@html}.
	const earnCards = [
		{
			href: '/streaks',
			icon: 'flame',
			title: 'Daily Streaks',
			body: 'Show up daily, earn bonus multipliers. The longer your streak, the bigger your rewards.',
			tag: { pre: 'Up to ', em: '5×', post: ' multiplier' }
		},
		{
			href: '/quizzes',
			icon: 'brain',
			title: 'Daily Quizzes',
			body: 'Fun, bite-sized quizzes on trending topics — pop culture, science, history, sports.',
			tag: { pre: '', em: '50–200 pts', post: ' per quiz' }
		},
		{
			href: '/artifacts',
			icon: 'spark',
			title: 'Interactive Artifacts',
			body: 'Hand-picked interactive experiences — explore, play with, and learn from curated data and lifestyle stories.',
			tag: { pre: 'Curated · ', em: 'Live', post: '' }
		},
		{
			href: '/games',
			icon: 'game',
			title: 'Play & Earn',
			body: 'Level up in mobile games and earn real rewards. Gaming meets earning.',
			tag: { pre: 'Earn while you play', em: '', post: '' }
		},
		{
			href: '/paid-surveys',
			icon: 'doc',
			title: 'Paid Surveys',
			body: 'Share opinions with major brands. Quick 2–10 minute surveys matched to your profile.',
			tag: { pre: '', em: '$0.50–$5', post: ' per survey' }
		},
		{
			href: '/weekly-challenges',
			icon: 'trophy',
			title: 'Weekly Challenges',
			body: 'Limited-time challenges with bonus point pools and massive reward drops.',
			tag: { pre: 'Bonus reward pools', em: '', post: '' }
		}
	];
</script>

<!-- ============ WAYS TO EARN ============ -->
<section class="earn" id="earn">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>Ways to earn</span>
				<h2 class="h1 reveal" style="margin-top:18px">Six paths. One wallet.</h2>
			</div>
			<p class="body-lg reveal d1">
				Mix and match however you like. Every action adds real points directly to your balance — no
				point conversions, no expiring credits.
			</p>
		</div>
		<div class="earn-grid">
			{#each earnCards as card, i (card.href)}
				<a href={card.href} data-sveltekit-reload class="earn-card reveal {i ? `d${i}` : ''}">
					<div class="earn-ico"><Icon name={card.icon} class="i-lg i" /></div>
					<div class="earn-arrow"><Icon name="arrow" /></div>
					<h3>{card.title}</h3>
					<p>{card.body}</p>
					<span class="earn-tag"
						>{card.tag.pre}{#if card.tag.em}<em>{card.tag.em}</em>{/if}{card.tag.post}</span
					>
				</a>
			{/each}
		</div>
	</div>
</section>
