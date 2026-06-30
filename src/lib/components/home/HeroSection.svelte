<script lang="ts">
	import Icon from './Icon.svelte';

	const heroMeta = [
		{ value: '0', count: '4.2', suffix: 'M+', label: 'Active members' },
		{ value: '$0', count: '3.1', prefix: '$', suffix: 'M+', label: 'Paid out last month' },
		{ value: '24h', label: 'Avg payout time' }
	];
</script>

<!-- ============ HERO ============ -->
<section class="hero">
	<div class="wrap hero-grid">
		<div>
			<span class="hero-tag"
				><span class="hero-tag-chip">NEW</span> Weekly Trivia League — $5,000 pool</span
			>
			<h1 class="h-display">Show up daily.<br />Get paid <em>weekly.</em></h1>
			<p class="lead">
				EarnMaze pays you for the things you already do — quick surveys, daily quizzes, casual
				games, and brand offers. Real cash to PayPal or gift cards. From $10.
			</p>
			<div class="hero-ctas">
				<a href="/register" class="btn btn-pri btn-lg">Create free account <Icon name="arrow" /></a>
				<a href="#how" class="btn btn-sec btn-lg">How it works</a>
			</div>
			<div class="hero-meta">
				{#each heroMeta as m (m.label)}
					<div class="hero-meta-item">
						<div class="v" data-count={m.count} data-prefix={m.prefix} data-suffix={m.suffix}>
							{m.value}
						</div>
						<div class="l">{m.label}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="composition">
			<div class="cc cc-wallet">
				<div class="lab"><span class="live"></span> Wallet · this week</div>
				<div class="bal"><em>$</em>42.<em>80</em></div>
				<span class="delta">
					<svg
						class="i"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"><path d="M7 17L17 7M9 7h8v8" /></svg
					>
					+$18.40 this week
				</span>
				<svg class="cc-spark" viewBox="0 0 280 50" preserveAspectRatio="none">
					<defs
						><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"
							><stop offset="0" stop-color="#c7f463" stop-opacity=".35" /><stop
								offset="1"
								stop-color="#c7f463"
								stop-opacity="0"
							/></linearGradient
						></defs
					>
					<path
						d="M0,38 L40,32 L75,36 L110,24 L150,28 L185,16 L220,20 L260,8 L280,12"
						fill="none"
						stroke="#c7f463"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M0,38 L40,32 L75,36 L110,24 L150,28 L185,16 L220,20 L260,8 L280,12 L280,50 L0,50 Z"
						fill="url(#gf)"
					/>
					<circle cx="260" cy="8" r="3.5" fill="#c7f463" />
					<circle cx="260" cy="8" r="7" fill="#c7f463" opacity=".18" />
				</svg>
				<div class="cc-x">
					<span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span
						>S</span
					>
				</div>
			</div>

			<div class="cc cc-streak">
				<div class="h">
					<span class="l">Streak</span><span class="ico"><Icon name="flame" /></span>
				</div>
				<div class="ring-wrap">
					<svg width="120" height="120" viewBox="0 0 120 120">
						<circle
							cx="60"
							cy="60"
							r="48"
							fill="none"
							stroke="rgba(255,255,255,.08)"
							stroke-width="10"
						/>
						<circle
							cx="60"
							cy="60"
							r="48"
							fill="none"
							stroke="#c7f463"
							stroke-width="10"
							stroke-linecap="round"
							stroke-dasharray="140 302"
							stroke-dashoffset="0"
						/>
					</svg>
					<div class="c">
						<div class="n">14</div>
						<div class="u">days</div>
					</div>
				</div>
				<div class="mult">Multiplier <em>2.5×</em> active</div>
			</div>

			<div class="cc cc-quiz">
				<div class="l"><Icon name="brain" class="" /> Today's quiz</div>
				<div class="q">Which country has the most time zones?</div>
				<div class="opts">
					<div class="o"><span class="k">A</span>Russia</div>
					<div class="o right">
						<span class="k">B</span>France <Icon
							name="check"
							style="margin-left:auto;color:var(--acc)"
						/>
					</div>
				</div>
				<div class="reward">+50 pts</div>
			</div>

			<div class="cc cc-payout">
				<span class="ico"><Icon name="check" /></span>
				<div>
					<div class="t">Payout sent</div>
					<div class="s">PayPal · 22 hrs ago</div>
				</div>
				<span class="v">$25.00</span>
			</div>

			<div class="cc cc-pill">
				<span class="ico"><Icon name="bolt" /></span>
				<span class="t">Earned today</span>
				<span class="v">$3.20</span>
			</div>
		</div>
	</div>
</section>
