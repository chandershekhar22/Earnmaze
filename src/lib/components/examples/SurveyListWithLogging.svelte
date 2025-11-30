<!--
  Example component demonstrating app-wide logger usage
  Shows how to integrate logging into your Svelte components
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Logger, Features, Perf, Session } from '$lib/utils/app-logger';

	// Component-specific logger
	const componentLogger = Logger.components;

	interface Survey {
		id: string;
		title: string;
		description: string;
		points: number;
		estimatedDuration: number;
	}

	let surveyData: Survey[] = [];
	let isLoading = false;
	let error: string | null = null;

	onMount(() => {
		componentLogger.info('SurveyList component mounted');
		Features.track('survey-list', 'view');
		loadSurveys();
	});

	onDestroy(() => {
		componentLogger.info('SurveyList component destroyed');
	});

	async function loadSurveys() {
		const operationId = Perf.start('load-surveys');
		isLoading = true;
		error = null;

		try {
			componentLogger.info('Loading surveys started');
			
			const response = await fetch('/api/surveys');
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			surveyData = await response.json();
			
			Perf.end(operationId, { 
				count: surveyData.length,
				success: true 
			});
			
			componentLogger.info('Surveys loaded successfully', { 
				count: surveyData.length 
			});
			
			Features.track('survey-list', 'loaded', { 
				surveyCount: surveyData.length 
			});

		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
			
			Perf.end(operationId, { 
				success: false, 
				error: error 
			});
			
			componentLogger.error('Failed to load surveys', { 
				error,
				sessionId: Session.getSessionId()
			});
			
			Features.track('survey-list', 'error', { 
				error: error 
			});
		} finally {
			isLoading = false;
		}
	}

	function handleSurveyClick(surveyId: string, surveyTitle: string) {
		componentLogger.info('Survey clicked', { 
			surveyId, 
			surveyTitle,
			userId: Session.getUserId()
		});
		
		Features.trackUserAction('survey-click', 'survey-list', {
			surveyId,
			surveyTitle
		});
	}
</script>

<div class="survey-list-container">
	<h2>Available Surveys</h2>
	
	{#if isLoading}
		<div class="loading">
			<p>Loading surveys...</p>
		</div>
	{:else if error}
		<div class="error">
			<p>Error: {error}</p>
			<button on:click={loadSurveys}>Retry</button>
		</div>
	{:else}
		<div class="survey-grid">
			{#each surveyData as survey (survey.id)}
				<div 
					class="survey-card"
					on:click={() => handleSurveyClick(survey.id, survey.title)}
					role="button"
					tabindex="0"
					on:keydown={(e) => e.key === 'Enter' && handleSurveyClick(survey.id, survey.title)}
				>
					<h3>{survey.title}</h3>
					<p>{survey.description}</p>
					<div class="survey-meta">
						<span class="points">{survey.points} points</span>
						<span class="duration">{survey.estimatedDuration} min</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.survey-list-container {
		padding: 1rem;
	}

	.survey-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.survey-card {
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.survey-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.survey-meta {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.points {
		color: #059669;
		font-weight: 600;
	}

	.loading, .error {
		text-align: center;
		padding: 2rem;
	}

	.error {
		color: #dc2626;
	}

	.error button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
