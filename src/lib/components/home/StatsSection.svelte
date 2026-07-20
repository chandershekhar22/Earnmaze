<script lang="ts">
	import * as m from '$lib/paraglide/messages';
</script>

<!--
	The four stat values have genuinely different inner structures (plain counter,
	$-prefixed counter, suffixed counter, and a static "24h"), so they stay as
	explicit markup rather than being forced into one loop.
-->
<!-- ============ STATS ============ -->
<section class="stats">
	<div class="wrap">
		<div class="stats-grid">
			<div class="stat reveal">
				<div class="v" data-count="4.2" data-suffix="M+">0</div>
				<div class="l">{m.home_stats_members_label()}</div>
				<div class="d">{m.home_stats_members_desc()}</div>
			</div>
			<div class="stat reveal d1">
				<div class="v"><em>$</em><span data-count="3.1" data-suffix="M+">0</span></div>
				<div class="l">{m.home_hero_stat_paid()}</div>
				<div class="d">{m.home_stats_paid_desc()}</div>
			</div>
			<div class="stat reveal d2">
				<div class="v" data-count="850" data-suffix="K+">0</div>
				<div class="l">{m.home_stats_streaks_label()}</div>
				<div class="d">{m.home_stats_streaks_desc()}</div>
			</div>
			<div class="stat reveal d3">
				<div class="v">24<em>h</em></div>
				<div class="l">{m.home_stats_payout_label()}</div>
				<div class="d">{m.home_stats_payout_desc()}</div>
			</div>
		</div>
	</div>
</section>
