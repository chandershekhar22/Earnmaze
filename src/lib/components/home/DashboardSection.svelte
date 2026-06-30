<script lang="ts">
	import { onMount } from 'svelte';

	const donutLegend = [
		{ color: 'var(--acc)', label: 'Surveys', pct: '42%' },
		{ color: '#7ab8ff', label: 'Quizzes', pct: '26%' },
		{ color: '#ffb74a', label: 'Play & deals', pct: '17%' }
	];

	const summary = [
		{ prefix: '$', value: '142.50', label: 'Total earned' },
		{ value: '47', label: 'Surveys done' },
		{ value: '14', label: 'Current streak' },
		{ value: '23', label: 'Quizzes aced' }
	];

	// Weekly-earnings bars. Each grows from 0 to its target once mounted; the
	// per-bar transition-delay reproduces the original staggered reveal.
	const barValues = [40, 62, 48, 75, 55, 82, 95];
	let grown = $state(false);

	// Heatmap intensities are randomised client-side only (kept out of SSR so the
	// server and client markup can't disagree).
	const heatLevels = ['', 'l1', 'l2', 'l3', 'l4'];
	let heatCells = $state<string[]>([]);

	onMount(() => {
		heatCells = Array.from({ length: 13 * 4 }, () => heatLevels[Math.floor(Math.random() * 5)]);
		// Two frames so the 0-height state paints before the grow transition starts.
		requestAnimationFrame(() => requestAnimationFrame(() => (grown = true)));
	});
</script>

<!-- ============ DASHBOARD ============ -->
<section class="dash" id="dashboard">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>Dashboard</span>
				<h2 class="h1 reveal" style="margin-top:18px">Your earnings, at a glance.</h2>
			</div>
			<p class="body-lg reveal d1">
				A real-time view of progress, streaks, and where your rewards come from. One screen, no
				noise.
			</p>
		</div>
		<div class="dash-frame reveal">
			<div class="dash-bar">
				<span class="ddot"></span><span class="ddot"></span><span class="ddot"></span>
				<span class="url">dashboard.earnmaze.com</span>
			</div>
			<div class="dash-body">
				<div class="dw">
					<div class="dw-h">
						<h4>Weekly earnings</h4>
						<span>Last 7 days</span>
					</div>
					<div class="chart">
						{#each barValues as v, i (i)}
							<div
								class="bar"
								class:muted={i < 3}
								style="height:{grown ? v + '%' : '0'};transition-delay:{300 + i * 90}ms"
							></div>
						{/each}
					</div>
					<div class="chart-x">
						<span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span
						><span>S</span>
					</div>
				</div>
				<div class="dw">
					<div class="dw-h">
						<h4>Reward sources</h4>
						<span>This month</span>
					</div>
					<div class="donut">
						<svg width="140" height="140" viewBox="0 0 140 140">
							<circle
								cx="70"
								cy="70"
								r="56"
								fill="none"
								stroke="rgba(255,255,255,.05)"
								stroke-width="16"
							/>
							<circle
								cx="70"
								cy="70"
								r="56"
								fill="none"
								stroke="#c7f463"
								stroke-width="16"
								stroke-dasharray="148 352"
								stroke-dashoffset="0"
							/>
							<circle
								cx="70"
								cy="70"
								r="56"
								fill="none"
								stroke="#7ab8ff"
								stroke-width="16"
								stroke-dasharray="91 352"
								stroke-dashoffset="-148"
							/>
							<circle
								cx="70"
								cy="70"
								r="56"
								fill="none"
								stroke="#ffb74a"
								stroke-width="16"
								stroke-dasharray="60 352"
								stroke-dashoffset="-239"
							/>
						</svg>
						<div class="donut-c">68%</div>
					</div>
					<div class="donut-legend">
						{#each donutLegend as row (row.label)}
							<div class="row">
								<span><span class="d" style="background:{row.color}"></span>{row.label}</span><span
									class="mono">{row.pct}</span
								>
							</div>
						{/each}
					</div>
				</div>
				<div class="dw">
					<div class="dw-h">
						<h4>Streak heatmap</h4>
						<span>Apr 2026</span>
					</div>
					<div class="heat">
						{#each heatCells as lvl, i (i)}
							<div class="hc {lvl}"></div>
						{/each}
					</div>
					<div class="heat-foot">
						<span>Less</span><span style="display:flex;gap:3px"
							><span class="hc l1" style="width:10px;height:10px"></span><span
								class="hc l2"
								style="width:10px;height:10px"
							></span><span class="hc l3" style="width:10px;height:10px"></span><span
								class="hc l4"
								style="width:10px;height:10px"
							></span></span
						><span>More</span>
					</div>
				</div>
			</div>
			<div class="dash-body-2">
				{#each summary as s (s.label)}
					<div class="dw-sm">
						<div class="v">
							{#if s.prefix}<em>{s.prefix}</em>{/if}{s.value}
						</div>
						<div class="l">{s.label}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
