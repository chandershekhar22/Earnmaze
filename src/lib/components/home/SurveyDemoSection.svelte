<script lang="ts">
	import Icon from './Icon.svelte';

	const surveyQs = [
		{
			q: 'What matters most when choosing a streaming service?',
			opts: [
				'Content library size',
				'Monthly price',
				'Original shows & movies',
				'UI & recommendations'
			]
		},
		{
			q: 'How many hours per week do you spend on your phone?',
			opts: ['Less than 2', '2 to 4', '4 to 6', 'More than 6']
		},
		{
			q: 'Which reward type do you prefer most?',
			opts: ['PayPal cash', 'Gift cards', 'Crypto', 'Store credit']
		}
	];

	let sqIdx = $state(0);
	let swCompleted = $state(false);
	let swSelected = $state<number | null>(null);

	function selectPoll(i: number) {
		swSelected = i;
	}

	function nextPollsQ() {
		if (sqIdx >= surveyQs.length - 1) {
			swCompleted = true;
			sqIdx = surveyQs.length;
			return;
		}
		sqIdx++;
		swSelected = null;
	}
</script>

<!-- ============ SURVEY DEMO ============ -->
<section class="survey" id="survey">
	<div class="wrap">
		<div class="section-head center">
			<span class="eyebrow acc" style="justify-self:center;display:inline-block"
				><span class="dot"></span>Try it now</span
			>
			<h2 class="h1 reveal" style="margin-top:18px">Experience an EarnMaze survey.</h2>
			<p class="body-lg reveal d1" style="margin:14px auto 0">
				See how quick and clean it actually feels. Three questions, real answers.
			</p>
		</div>
		<div class="survey-card reveal">
			<div class="sv-prog">
				<div style="width:{swCompleted ? 100 : ((sqIdx + 1) / surveyQs.length) * 100}%"></div>
			</div>
			<div class="sv-body">
				{#if swCompleted}
					<div class="sv-step">Complete</div>
					<div class="sv-q">Thanks — you earned 30 points.</div>
					<div
						style="padding:24px;text-align:center;font-family:var(--mono);font-size:14px;color:var(--acc)"
					>
						+30 pts added to your wallet
					</div>
				{:else}
					<div class="sv-step">Question {sqIdx + 1} of {surveyQs.length}</div>
					<div class="sv-q">{surveyQs[sqIdx].q}</div>
					<div class="sv-opts">
						{#each surveyQs[sqIdx].opts as opt, i (i)}
							<button
								type="button"
								class="sv-opt"
								class:sel={swSelected === i}
								onclick={() => selectPoll(i)}
							>
								<span class="l">{String.fromCharCode(65 + i)}</span>{opt}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			{#if !swCompleted}
				<div class="sv-foot">
					<button type="button" class="skip" onclick={nextPollsQ}>Skip</button>
					<button class="btn btn-pri" onclick={nextPollsQ}>Next <Icon name="arrow" /></button>
				</div>
			{/if}
		</div>
	</div>
</section>
