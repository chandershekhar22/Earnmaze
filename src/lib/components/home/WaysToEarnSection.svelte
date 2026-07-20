<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	// `tag` is split into pre/em/post so the highlighted fragment renders without {@html}.
	const earnCards = [
		{
			href: '/streaks',
			icon: 'flame',
			title: m.home_earn_card1_title(),
			body: m.home_earn_card1_body(),
			tag: { pre: m.home_earn_card1_tag_pre(), em: m.home_earn_card1_tag_em(), post: m.home_earn_card1_tag_post() }
		},
		{
			href: '/quizzes',
			icon: 'brain',
			title: m.home_earn_card2_title(),
			body: m.home_earn_card2_body(),
			tag: { pre: '', em: m.home_earn_card2_tag_em(), post: m.home_earn_card2_tag_post() }
		},
		{
			href: '/artifacts',
			icon: 'spark',
			title: m.home_earn_card3_title(),
			body: m.home_earn_card3_body(),
			tag: { pre: m.home_earn_card3_tag_pre(), em: m.home_earn_card3_tag_em(), post: '' }
		},
		{
			href: '/games',
			icon: 'game',
			title: m.home_earn_card4_title(),
			body: m.home_earn_card4_body(),
			tag: { pre: m.home_earn_card4_tag_pre(), em: '', post: '' }
		},
		{
			href: '/paid-surveys',
			icon: 'doc',
			title: m.home_earn_card5_title(),
			body: m.home_earn_card5_body(),
			tag: { pre: '', em: m.home_earn_card5_tag_em(), post: m.home_earn_card5_tag_post() }
		},
		{
			href: '/weekly-challenges',
			icon: 'trophy',
			title: m.home_earn_card6_title(),
			body: m.home_earn_card6_body(),
			tag: { pre: m.home_earn_card6_tag_pre(), em: '', post: '' }
		}
	];
</script>

<!-- ============ WAYS TO EARN ============ -->
<section class="earn" id="earn">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>{m.home_earn_eyebrow()}</span>
				<h2 class="h1 reveal" style="margin-top:18px">{m.home_earn_title()}</h2>
			</div>
			<p class="body-lg reveal d1">
				{m.home_earn_lead()}
			</p>
		</div>
		<div class="earn-grid">
			{#each earnCards as card, i (card.href)}
				<a href={localizeHref(card.href)} data-sveltekit-reload class="earn-card reveal {i ? `d${i}` : ''}">
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
