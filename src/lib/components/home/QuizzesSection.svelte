<script lang="ts">
	import Icon from './Icon.svelte';

	const features = [
		'New quizzes daily across 12+ categories',
		'Earn 50–200 pts per quiz, with streak bonuses',
		'Weekly tournaments with leaderboards'
	];

	const categories = [
		'Geography',
		'Science',
		'Sports',
		'Movies',
		'History',
		'Tech',
		'Music',
		'Food'
	];

	const options = [
		{ l: 'A', text: 'Russia' },
		{ l: 'B', text: 'United States' },
		{ l: 'C', text: 'France', correct: true },
		{ l: 'D', text: 'China' }
	];

	// Flash the picked wrong answer red briefly (the correct option is non-interactive).
	function selectQuizOpt(e: MouseEvent) {
		const el = e.currentTarget as HTMLElement;
		el.classList.add('wrong');
		setTimeout(() => el.classList.remove('wrong'), 900);
	}
</script>

<!-- ============ QUIZZES ============ -->
<section class="quiz" id="quizzes">
	<div class="wrap quiz-grid">
		<div class="quiz-info reveal">
			<span class="eyebrow acc"><span class="dot"></span>Today's quizzes</span>
			<h2 class="h1">Get smarter. Get paid.</h2>
			<p>
				Fresh quizzes every day across topics you actually care about. Answer questions, earn
				instant points, expand your mind.
			</p>
			<div class="feat">
				{#each features as f (f)}
					<div class="feat-row">
						<span class="feat-c"><Icon name="check" /></span>
						<div>{f}</div>
					</div>
				{/each}
			</div>
			<a href="/register" class="btn btn-pri">Take today's quiz <Icon name="arrow" /></a>
			<div class="qcats">
				{#each categories as cat (cat)}<span class="qcat">{cat}</span>{/each}
			</div>
		</div>
		<div class="qmock reveal d1">
			<div class="qm-h">
				<div class="c">Quiz · April 14</div>
				<div class="t">World Geography Challenge</div>
				<div class="m">
					<span>5 questions</span><span>~2 min</span><span><em>+50 pts</em></span>
				</div>
			</div>
			<div class="qm-prog"><div></div></div>
			<div class="qm-body">
				<div class="qm-q"><em>Q3 of 5</em>Which country has the most time zones?</div>
				<div class="qm-opts">
					{#each options as opt (opt.l)}
						{#if opt.correct}
							<div class="qm-opt right"><span class="l">{opt.l}</span>{opt.text}</div>
						{:else}
							<button type="button" class="qm-opt" onclick={selectQuizOpt}
								><span class="l">{opt.l}</span>{opt.text}</button
							>
						{/if}
					{/each}
				</div>
				<div class="qm-result">
					<Icon name="check" class="i-lg i" style="color:var(--acc)" />
					<div>
						<strong>Correct</strong>France spans 12 time zones across its overseas territories.
					</div>
					<span class="v">+10</span>
				</div>
			</div>
		</div>
	</div>
</section>
