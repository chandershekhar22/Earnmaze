<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';

	const games = [
		{
			icon: 'brain',
			title: 'Trivia Quiz',
			desc: 'Knowledge across 12+ categories',
			badges: [
				{ cls: 'easy', label: 'Easy' },
				{ cls: 'hot', label: 'Hot' }
			],
			players: '1.2K playing',
			reward: '+50 pts',
			cta: 'Play'
		},
		{
			icon: 'grid',
			title: 'Word Scramble',
			desc: 'Unscramble against the clock',
			badges: [
				{ cls: 'med', label: 'Medium' },
				{ cls: 'new', label: 'New' }
			],
			players: '856 playing',
			reward: '+75 pts',
			cta: 'Play'
		},
		{
			icon: 'target',
			title: 'Spin the Wheel',
			desc: 'Daily spin for bonus coins',
			badges: [{ cls: 'easy', label: 'Easy' }],
			players: '2.4K playing',
			reward: '+10–500 pts',
			cta: 'Spin'
		},
		{
			icon: 'coin',
			title: 'Scratch Card',
			desc: 'Scratch to reveal instant rewards',
			badges: [
				{ cls: 'easy', label: 'Easy' },
				{ cls: 'hot', label: 'Hot' }
			],
			players: '3.1K playing',
			reward: '+25–200 pts',
			cta: 'Scratch'
		},
		{
			icon: 'bolt',
			title: 'Quiz Sprint',
			desc: 'Match pairs for multipliers',
			badges: [{ cls: 'hard', label: 'Hard' }],
			players: '634 playing',
			reward: '+100 pts',
			cta: 'Play'
		},
		{
			icon: 'trophy',
			title: 'Daily Challenge',
			desc: 'New challenge every day',
			badges: [
				{ cls: 'med', label: 'Medium' },
				{ cls: 'new', label: 'New' }
			],
			players: '1.8K playing',
			reward: '+150 pts',
			cta: 'Accept'
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
				<span class="eyebrow acc"><span class="dot"></span>Play &amp; earn</span>
				<h2 class="h1 reveal" style="margin-top:18px">Casual games. Real rewards.</h2>
			</div>
			<p class="body-lg reveal d1">
				Trivia, scratchers, daily spins. Climb the leaderboard, claim the weekly bonus pool.
			</p>
		</div>

		<div class="bonus reveal">
			<div class="bonus-l">
				<span class="bonus-ico"><Icon name="gift" class="i-lg i" /></span>
				<div>
					<h4>Daily bonus resets in</h4>
					<p>Claim your free spin and bonus coins</p>
				</div>
			</div>
			<div class="timer">
				<span class="u">{h}</span><span class="s">:</span><span class="u">{m}</span><span class="s"
					>:</span
				><span class="u">{s}</span>
			</div>
			<a href="/register" class="btn btn-pri">Claim bonus</a>
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
				<h4>Top players this week</h4>
				<span>Resets Monday</span>
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
