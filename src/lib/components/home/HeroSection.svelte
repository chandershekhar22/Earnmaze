<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const heroMeta = [
		{ value: '0', count: '4.2', suffix: 'M+', label: m.home_hero_stat_members() },
		{ value: '$0', count: '3.1', prefix: '$', suffix: 'M+', label: m.home_hero_stat_paid() },
		{ value: '24h', label: m.home_hero_stat_payout() }
	];
</script>

<!-- ============ HERO ============ -->
<section class="hero">
	<div class="wrap hero-grid">
		<div>
			<span class="hero-tag"
				><span class="hero-tag-chip">{m.home_hero_badge_new()}</span> {m.home_hero_badge_text()}</span
			>
			<h1 class="h-display">{m.home_hero_title_daily()}<br />{m.home_hero_title_get_paid()} <em>{m.home_hero_title_weekly()}</em></h1>
			<p class="lead">
				{m.home_hero_lead()}
			</p>
			<div class="hero-ctas">
				<a href={localizeHref('/register')} class="btn btn-pri btn-lg">{m.home_hero_cta_create()} <Icon name="arrow" /></a>
				<a href="#how" class="btn btn-sec btn-lg">{m.home_hero_cta_how_it_works()}</a>
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
				<div class="lab"><span class="live"></span> {m.home_hero_mock_wallet_label()}</div>
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
					{m.home_hero_mock_wallet_delta()}
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
					<span class="l">{m.home_hero_mock_streak_label()}</span><span class="ico"><Icon name="flame" /></span>
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
						<div class="u">{m.home_hero_mock_days()}</div>
					</div>
				</div>
				<div class="mult">{m.home_hero_mock_multiplier_prefix()} <em>2.5×</em> {m.home_hero_mock_multiplier_suffix()}</div>
			</div>

			<div class="cc cc-quiz">
				<div class="l"><Icon name="brain" class="" /> {m.home_hero_mock_quiz_label()}</div>
				<div class="q">{m.home_hero_mock_quiz_question()}</div>
				<div class="opts">
					<div class="o"><span class="k">A</span>{m.home_hero_mock_option_russia()}</div>
					<div class="o right">
						<span class="k">B</span>{m.home_hero_mock_option_france()} <Icon
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
					<div class="t">{m.home_hero_mock_payout_title()}</div>
					<div class="s">{m.home_hero_mock_payout_meta()}</div>
				</div>
				<span class="v">$25.00</span>
			</div>

			<div class="cc cc-pill">
				<span class="ico"><Icon name="bolt" /></span>
				<span class="t">{m.home_hero_mock_earned_today()}</span>
				<span class="v">$3.20</span>
			</div>
		</div>
	</div>
</section>
