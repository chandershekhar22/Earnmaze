<script lang="ts">
	import { Award, CirclePlus, CircleMinus, SlidersHorizontal, CheckCircle, AlertCircle } from '@lucide/svelte';

	let panelistId = $state('');
	let points = $state<number | null>(null);
	let type = $state<'bonus' | 'adjustment' | 'penalty'>('bonus');
	let description = $state('');

	let isSubmitting = $state(false);
	let feedback = $state<{ kind: 'success' | 'error'; message: string } | null>(null);

	let isFormValid = $derived(
		panelistId.trim().length > 0 &&
		points !== null &&
		points > 0 &&
		description.trim().length > 0
	);

	function getTypeIcon(t: string) {
		switch (t) {
			case 'bonus':
				return CirclePlus;
			case 'adjustment':
				return SlidersHorizontal;
			case 'penalty':
				return CircleMinus;
			default:
				return Award;
		}
	}

	let TypeIcon = $derived(getTypeIcon(type));

	async function handleSubmit() {
		if (!isFormValid || isSubmitting) return;

		isSubmitting = true;
		feedback = null;

		try {
			const response = await fetch('/api/admin/points', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					panelistId: panelistId.trim(),
					points: points!,
					type,
					description: description.trim()
				})
			});

			const result = await response.json();

			if (result.success) {
				const effectivePoints = type === 'penalty' ? -(points!) : points!;
				feedback = {
					kind: 'success',
					message: `Successfully assigned ${effectivePoints > 0 ? '+' : ''}${effectivePoints} points (${type}) to panelist.`
				};
				// Reset form
				panelistId = '';
				points = null;
				type = 'bonus';
				description = '';
			} else {
				feedback = {
					kind: 'error',
					message: result.message || 'Failed to assign points.'
				};
			}
		} catch {
			feedback = {
				kind: 'error',
				message: 'Network error. Please try again.'
			};
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Assign Points - Admin Panel</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white">Assign Points</h1>
		<p class="text-neutral-400 mt-2">Manually assign bonus, adjustment, or penalty points to a panelist</p>
	</div>

	<!-- Feedback message -->
	{#if feedback}
		<div
			class="mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 {feedback.kind === 'success'
				? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
				: 'border-rose-500/30 bg-rose-500/10 text-rose-400'}"
		>
			{#if feedback.kind === 'success'}
				<CheckCircle class="mt-0.5 h-5 w-5 shrink-0" />
			{:else}
				<AlertCircle class="mt-0.5 h-5 w-5 shrink-0" />
			{/if}
			<p class="text-sm">{feedback.message}</p>
		</div>
	{/if}

	<!-- Form Card -->
	<div class="card">
		<div class="flex items-center gap-3 mb-6">
			<div class="rounded-lg bg-primary-500/10 p-2">
				<Award class="h-6 w-6 text-primary-400" />
			</div>
			<div>
				<h2 class="text-lg font-semibold text-white">Point Assignment</h2>
				<p class="text-sm text-neutral-500">Fill in the details below to assign points</p>
			</div>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">
			<!-- Panelist ID -->
			<div>
				<label for="panelistId" class="label">Panelist ID</label>
				<input
					id="panelistId"
					type="text"
					bind:value={panelistId}
					placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
					class="input"
				/>
				<p class="mt-1 text-xs text-neutral-500">UUID of the target panelist</p>
			</div>

			<!-- Points + Type row -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<!-- Points -->
				<div>
					<label for="points" class="label">Points Amount</label>
					<input
						id="points"
						type="number"
						min="1"
						step="1"
						bind:value={points}
						placeholder="e.g. 100"
						class="input"
					/>
					{#if points !== null && points <= 0}
						<p class="mt-1 text-xs text-rose-400">Points must be greater than 0</p>
					{/if}
				</div>

				<!-- Type -->
				<div>
					<label for="type" class="label">Type</label>
					<div class="relative">
						<select
							id="type"
							bind:value={type}
							class="select"
						>
							<option value="bonus">Bonus (+)</option>
							<option value="adjustment">Adjustment (+/-)</option>
							<option value="penalty">Penalty (-)</option>
						</select>
					</div>
					<p class="mt-1 text-xs text-neutral-500">
						{#if type === 'penalty'}
							Points will be deducted from the panelist's balance
						{:else if type === 'adjustment'}
							Points will be added to the panelist's balance
						{:else}
							Bonus points will be added to the panelist's balance
						{/if}
					</p>
				</div>
			</div>

			<!-- Preview -->
			{#if points && points > 0}
				<div class="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-100 px-4 py-3">
					<TypeIcon class="h-5 w-5 {type === 'penalty' ? 'text-rose-400' : 'text-emerald-400'}" />
					<span class="text-sm text-neutral-300">
						This will
						<span class="font-medium {type === 'penalty' ? 'text-rose-400' : 'text-emerald-400'}">
							{type === 'penalty' ? 'deduct' : 'add'} {points} points
						</span>
						{type === 'penalty' ? 'from' : 'to'} the panelist's balance
					</span>
				</div>
			{/if}

			<!-- Description -->
			<div>
				<label for="description" class="label">Description</label>
				<textarea
					id="description"
					bind:value={description}
					rows={3}
					placeholder="Reason for assigning points..."
					class="input resize-none"
				></textarea>
				<p class="mt-1 text-xs text-neutral-500">{description.length}/255 characters</p>
			</div>

			<!-- Submit -->
			<div class="pt-2">
				<button
					type="submit"
					disabled={!isFormValid || isSubmitting}
					class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						Assigning Points...
					{:else}
						Assign Points
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
