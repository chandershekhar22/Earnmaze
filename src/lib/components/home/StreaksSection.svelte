<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const milestones = [
		{ d: '7d', r: '+100', on: true },
		{ d: '14d', r: '+250', on: true },
		{ d: '21d', r: '+500', on: false },
		{ d: '30d', r: '+1,000', on: false }
	];

	// Only the first feature highlights a fragment, so split into pre/strong/post.
	const features = [
		{ pre: m.home_streaks_feat1_pre() + ' ', strong: m.home_streaks_feat1_strong(), post: '' },
		{ pre: m.home_streaks_feat2(), strong: '', post: '' },
		{ pre: m.home_streaks_feat3(), strong: '', post: '' },
		{ pre: m.home_streaks_feat4(), strong: '', post: '' }
	];

	// Calendar fill state per day: 0 = none, 1 = completed, 2 = bonus, 3 = today.
	// The month starts on a Wednesday, so two leading empty cells pad the grid.
	const streakPattern = [
		0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 3, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0
	];
	const dayClass = ['', 'on', 'bonus', 'today'];
	type CalCell = { empty: boolean; day: number; cls: string };
	const calCells: CalCell[] = [
		{ empty: true, day: 0, cls: '' },
		{ empty: true, day: 0, cls: '' },
		...streakPattern.map((code, i) => ({ empty: false, day: i + 1, cls: dayClass[code] }))
	];
</script>

<!-- ============ STREAKS ============ -->
<section class="streaks" id="streaks">
	<div class="wrap streaks-grid">
		<div class="cal reveal">
			<div class="cal-h">
				<div class="m">April 2026</div>
				<div class="b">{m.home_streaks_cal_badge()}</div>
			</div>
			<div class="cal-w">
				<span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span
					>S</span
				>
			</div>
			<div class="cal-g">
				{#each calCells as cell, i (i)}
					{#if cell.empty}
						<div class="cd empty"></div>
					{:else}
						<div class="cd {cell.cls}">{cell.day}</div>
					{/if}
				{/each}
			</div>
			<div class="cal-leg">
				<span><span class="d" style="background:var(--acc)"></span>{m.home_streaks_legend_completed()}</span>
				<span><span class="d" style="background:var(--warn)"></span>{m.home_streaks_legend_bonus()}</span>
				<span
					><span class="d" style="border:1.5px solid var(--acc);background:transparent"
					></span>{m.home_streaks_legend_today()}</span
				>
			</div>
			<div class="mil">
				{#each milestones as mi (mi.d)}
					<div class="mil-i" class:on={mi.on}>
						<div class="d">{mi.d}</div>
						<div class="r">{mi.r}</div>
					</div>
				{/each}
			</div>
		</div>
		<div class="streaks-info reveal d1">
			<span class="eyebrow acc"><span class="dot"></span>{m.home_streaks_eyebrow()}</span>
			<h2 class="h1">{m.home_streaks_title()}</h2>
			<p>
				{m.home_streaks_lead()}
			</p>
			<div class="feat">
				{#each features as f (f.pre)}
					<div class="feat-row">
						<span class="feat-c"><Icon name="check" /></span>
						<div>
							{f.pre}{#if f.strong}<strong>{f.strong}</strong>{/if}{f.post}
						</div>
					</div>
				{/each}
			</div>
			<a href={localizeHref('/register')} class="btn btn-pri">{m.home_streaks_cta()} <Icon name="arrow" /></a>
		</div>
	</div>
</section>
