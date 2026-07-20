<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const features = [m.home_quiz_feat1(), m.home_quiz_feat2(), m.home_quiz_feat3()];

	const categories = [
		m.home_quiz_cat_geography(),
		m.home_quiz_cat_science(),
		m.home_quiz_cat_sports(),
		m.home_quiz_cat_movies(),
		m.home_quiz_cat_history(),
		m.home_quiz_cat_tech(),
		m.home_quiz_cat_music(),
		m.home_quiz_cat_food()
	];

	const options = [
		{ l: 'A', text: m.home_hero_mock_option_russia() },
		{ l: 'B', text: m.home_quiz_mock_option_us() },
		{ l: 'C', text: m.home_hero_mock_option_france(), correct: true },
		{ l: 'D', text: m.home_quiz_mock_option_china() }
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
			<span class="eyebrow acc"><span class="dot"></span>{m.home_quiz_eyebrow()}</span>
			<h2 class="h1">{m.home_quiz_title()}</h2>
			<p>
				{m.home_quiz_lead()}
			</p>
			<div class="feat">
				{#each features as f (f)}
					<div class="feat-row">
						<span class="feat-c"><Icon name="check" /></span>
						<div>{f}</div>
					</div>
				{/each}
			</div>
			<a href={localizeHref('/register')} class="btn btn-pri">{m.home_quiz_cta()} <Icon name="arrow" /></a>
			<div class="qcats">
				{#each categories as cat (cat)}<span class="qcat">{cat}</span>{/each}
			</div>
		</div>
		<div class="qmock reveal d1">
			<div class="qm-h">
				<div class="c">Quiz · April 14</div>
				<div class="t">{m.home_quiz_mock_title()}</div>
				<div class="m">
					<span>{m.home_quiz_mock_qcount()}</span><span>{m.home_quiz_mock_time()}</span><span><em>+50 pts</em></span>
				</div>
			</div>
			<div class="qm-prog"><div></div></div>
			<div class="qm-body">
				<div class="qm-q"><em>{m.home_quiz_mock_qof5()}</em>{m.home_hero_mock_quiz_question()}</div>
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
						<strong>{m.home_quiz_mock_correct()}</strong>{m.home_quiz_mock_explanation()}
					</div>
					<span class="v">+10</span>
				</div>
			</div>
		</div>
	</div>
</section>
