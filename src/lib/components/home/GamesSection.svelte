<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import * as i18n from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const games = [
		{
			icon: 'brain',
			title: i18n.home_games_g1_title(),
			desc: i18n.home_games_g1_desc(),
			badges: [
				{ cls: 'easy', label: i18n.home_games_badge_easy() },
				{ cls: 'hot', label: i18n.home_games_badge_hot() }
			],
			players: `1.2K ${i18n.home_games_playing_suffix()}`,
			reward: '+50 pts',
			cta: i18n.home_games_cta_play()
		},
		{
			icon: 'grid',
			title: i18n.home_games_g2_title(),
			desc: i18n.home_games_g2_desc(),
			badges: [
				{ cls: 'med', label: i18n.home_games_badge_medium() },
				{ cls: 'new', label: i18n.home_games_badge_new() }
			],
			players: `856 ${i18n.home_games_playing_suffix()}`,
			reward: '+75 pts',
			cta: i18n.home_games_cta_play()
		},
		{
			icon: 'target',
			title: i18n.home_games_g3_title(),
			desc: i18n.home_games_g3_desc(),
			badges: [{ cls: 'easy', label: i18n.home_games_badge_easy() }],
			players: `2.4K ${i18n.home_games_playing_suffix()}`,
			reward: '+10–500 pts',
			cta: i18n.home_games_cta_spin()
		},
		{
			icon: 'coin',
			title: i18n.home_games_g4_title(),
			desc: i18n.home_games_g4_desc(),
			badges: [
				{ cls: 'easy', label: i18n.home_games_badge_easy() },
				{ cls: 'hot', label: i18n.home_games_badge_hot() }
			],
			players: `3.1K ${i18n.home_games_playing_suffix()}`,
			reward: '+25–200 pts',
			cta: i18n.home_games_cta_scratch()
		},
		{
			icon: 'bolt',
			title: i18n.home_games_g5_title(),
			desc: i18n.home_games_g5_desc(),
			badges: [{ cls: 'hard', label: i18n.home_games_badge_hard() }],
			players: `634 ${i18n.home_games_playing_suffix()}`,
			reward: '+100 pts',
			cta: i18n.home_games_cta_play()
		},
		{
			icon: 'trophy',
			title: i18n.home_games_g6_title(),
			desc: i18n.home_games_g6_desc(),
			badges: [
				{ cls: 'med', label: i18n.home_games_badge_medium() },
				{ cls: 'new', label: i18n.home_games_badge_new() }
			],
			players: `1.8K ${i18n.home_games_playing_suffix()}`,
			reward: '+150 pts',
			cta: i18n.home_games_cta_accept()
		}
	];

	const leaderboard = [
		{
			rank: '01',
			av: 'AK',
			name: 'Alex K.',
			meta: 'Lvl 42 · 67-day streak',
			pts: '24,850',
			top: true
		},
		{ rank: '02', av: 'SR', name: 'Sarah R.', meta: 'Lvl 38 · 31-day streak', pts: '21,340' },
		{ rank: '03', av: 'MC', name: 'Marcus C.', meta: 'Lvl 35 · 22-day streak', pts: '19,720' },
		{ rank: '04', av: 'JP', name: 'Jessica P.', meta: 'Lvl 29 · 14-day streak', pts: '16,100' },
		{ rank: '05', av: 'DW', name: 'Derek W.', meta: 'Lvl 27 · 11-day streak', pts: '14,880' }
	];

	// Daily-bonus countdown (4h 32m 17s).
	let remaining = 4 * 3600 + 32 * 60 + 17;
	const pad = (n: number) => String(n).padStart(2, '0');
	let h = $state(pad(Math.floor(remaining / 3600)));
	let m = $state(pad(Math.floor((remaining % 3600) / 60)));
	let s = $state(pad(remaining % 60));

	onMount(() => {
		const id = setInterval(() => {
			if (remaining <= 0) return;
			remaining--;
			h = pad(Math.floor(remaining / 3600));
			m = pad(Math.floor((remaining % 3600) / 60));
			s = pad(remaining % 60);
		}, 1000);
		return () => clearInterval(id);
	});
</script>

<!-- ============ GAMES ============ -->
<section class="games" id="games">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>{i18n.home_games_eyebrow()}</span>
				<h2 class="h1 reveal" style="margin-top:18px">{i18n.home_games_title()}</h2>
			</div>
			<p class="body-lg reveal d1">
				{i18n.home_games_lead()}
			</p>
		</div>

		<div class="bonus reveal">
			<div class="bonus-l">
				<span class="bonus-ico"><Icon name="gift" class="i-lg i" /></span>
				<div>
					<h4>{i18n.home_games_bonus_title()}</h4>
					<p>{i18n.home_games_bonus_desc()}</p>
				</div>
			</div>
			<div class="timer">
				<span class="u">{h}</span><span class="s">:</span><span class="u">{m}</span><span class="s"
					>:</span
				><span class="u">{s}</span>
			</div>
			<a href={localizeHref('/register')} class="btn btn-pri">{i18n.home_games_bonus_cta()}</a>
		</div>

		<div class="game-grid">
			{#each games as game, i (game.title)}
				<div class="game reveal {i ? `d${i}` : ''}">
					<div class="game-top">
						<div class="game-thumb"><Icon name={game.icon} class="i-lg i" /></div>
						<div class="game-info">
							<h4>{game.title}</h4>
							<p>{game.desc}</p>
							<div class="game-badges">
								{#each game.badges as badge (badge.label)}<span class="badge {badge.cls}"
										>{badge.label}</span
									>{/each}
							</div>
						</div>
					</div>
					<div class="game-foot">
						<span class="pl">{game.players}</span><span class="rw">{game.reward}</span><button
							class="play-btn">{game.cta}</button
						>
					</div>
				</div>
			{/each}
		</div>

		<div class="leaderboard reveal">
			<div class="lb-h">
				<h4>{i18n.home_games_leaderboard_title()}</h4>
				<span>{i18n.home_games_leaderboard_resets()}</span>
			</div>
			{#each leaderboard as row (row.rank)}
				<div class="lb-row" class:top={row.top}>
					<div class="lb-rank">{row.rank}</div>
					<div class="lb-av">{row.av}</div>
					<div class="lb-info">
						<div class="n">{row.name}</div>
						<div class="m">{row.meta}</div>
					</div>
					<div class="lb-pts">{row.pts}</div>
				</div>
			{/each}
		</div>
	</div>
</section>
