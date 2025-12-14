<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// Search & Filter state
	let searchInput = $state(data.filters.search);
	let statusFilter = $state(data.filters.status);

	// Modal state
	let showModal = $state(false);
	let modalMode = $state<'create' | 'edit'>('create');
	let editingSurvey = $state<typeof data.surveys[0] | null>(null);

	// Form state
	let formTitle = $state('');
	let formDescription = $state('');
	let formPoints = $state(100);
	let formLink = $state('');
	let formIsActive = $state(true);
	let isSubmitting = $state(false);
	let formError = $state('');

	// Delete confirmation
	let showDeleteModal = $state(false);
	let deletingSurvey = $state<typeof data.surveys[0] | null>(null);
	let isDeleting = $state(false);

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchInput) params.set('search', searchInput);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		goto(`/admin/surveys?${params.toString()}`);
	}

	function handleFilterChange() {
		handleSearch();
	}

	function openCreateModal() {
		modalMode = 'create';
		formTitle = '';
		formDescription = '';
		formPoints = 100;
		formLink = '';
		formIsActive = true;
		formError = '';
		editingSurvey = null;
		showModal = true;
	}

	function openEditModal(survey: typeof data.surveys[0]) {
		modalMode = 'edit';
		editingSurvey = survey;
		formTitle = survey.title;
		formDescription = survey.description || '';
		formPoints = survey.points;
		formLink = survey.link;
		formIsActive = survey.isActive;
		formError = '';
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingSurvey = null;
		formError = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isSubmitting = true;
		formError = '';

		try {
			const payload = {
				title: formTitle,
				description: formDescription || null,
				points: formPoints,
				link: formLink,
				isActive: formIsActive
			};

			const url = modalMode === 'create' 
				? '/api/admin/surveys' 
				: `/api/admin/surveys/${editingSurvey?.id}`;
			
			const method = modalMode === 'create' ? 'POST' : 'PATCH';

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = await res.json();

			if (!res.ok || !result.success) {
				formError = result.message || 'Failed to save survey';
				return;
			}

			closeModal();
			await invalidateAll();
		} catch (error) {
			formError = 'An error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	async function toggleSurveyStatus(survey: typeof data.surveys[0]) {
		try {
			const res = await fetch(`/api/admin/surveys/${survey.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !survey.isActive })
			});

			if (res.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to toggle survey status:', error);
		}
	}

	function openDeleteModal(survey: typeof data.surveys[0]) {
		deletingSurvey = survey;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		deletingSurvey = null;
	}

	async function confirmDelete() {
		if (!deletingSurvey) return;
		isDeleting = true;

		try {
			const res = await fetch(`/api/admin/surveys/${deletingSurvey.id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				closeDeleteModal();
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to delete survey:', error);
		} finally {
			isDeleting = false;
		}
	}

	function formatDate(dateString: string | Date | null) {
		if (!dateString) return 'N/A';
		const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getStatusColor(isActive: boolean) {
		return isActive 
			? 'bg-green-100 text-green-700' 
			: 'bg-neutral-100 text-neutral-600';
	}
</script>

<svelte:head>
	<title>Manage Surveys - Admin Panel</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold text-neutral-900">Survey Management</h1>
			<p class="text-neutral-600 mt-2">Create, edit and manage surveys for panelists</p>
		</div>
		<button
			onclick={openCreateModal}
			class="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Survey
		</button>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
		<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-600">Total Surveys</p>
					<p class="text-2xl font-bold text-neutral-900 mt-1">{data.stats.totalSurveys}</p>
				</div>
				<div class="bg-violet-100 rounded-full p-3">
					<svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-600">Active Surveys</p>
					<p class="text-2xl font-bold text-green-600 mt-1">{data.stats.activeSurveys}</p>
				</div>
				<div class="bg-green-100 rounded-full p-3">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-600">Inactive Surveys</p>
					<p class="text-2xl font-bold text-neutral-500 mt-1">{data.stats.inactiveSurveys}</p>
				</div>
				<div class="bg-neutral-100 rounded-full p-3">
					<svg class="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Search -->
			<div class="md:col-span-2">
				<label for="search" class="block text-sm font-medium text-neutral-700 mb-2">
					Search Surveys
				</label>
				<div class="flex gap-2">
					<input
						id="search"
						type="text"
						bind:value={searchInput}
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
						placeholder="Search by title or description..."
						class="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
					/>
					<button
						onclick={handleSearch}
						class="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
					>
						Search
					</button>
				</div>
			</div>

			<!-- Status Filter -->
			<div>
				<label for="status" class="block text-sm font-medium text-neutral-700 mb-2">
					Status
				</label>
				<select
					id="status"
					bind:value={statusFilter}
					onchange={handleFilterChange}
					class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
				>
					<option value="all">All Surveys</option>
					<option value="active">Active Only</option>
					<option value="inactive">Inactive Only</option>
				</select>
			</div>
		</div>

		{#if data.filters.search || data.filters.status !== 'all'}
			<div class="mt-4 flex items-center gap-2">
				<span class="text-sm text-neutral-600">Active filters:</span>
				{#if data.filters.search}
					<span class="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
						Search: {data.filters.search}
						<button
							onclick={() => {
								searchInput = '';
								handleSearch();
							}}
							class="hover:text-violet-900"
						>
							×
						</button>
					</span>
				{/if}
				{#if data.filters.status !== 'all'}
					<span class="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
						Status: {data.filters.status}
						<button
							onclick={() => {
								statusFilter = 'all';
								handleFilterChange();
							}}
							class="hover:text-violet-900"
						>
							×
						</button>
					</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Surveys Table -->
	<div class="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-neutral-200">
				<thead class="bg-neutral-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
							Survey
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
							Points
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
							Completions
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
							Created
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-neutral-200">
					{#if data.surveys.length > 0}
						{#each data.surveys as survey}
							<tr class="hover:bg-neutral-50">
								<td class="px-6 py-4">
									<div class="max-w-xs">
										<div class="font-medium text-neutral-900 truncate">{survey.title}</div>
										{#if survey.description}
											<div class="text-sm text-neutral-500 truncate">{survey.description}</div>
										{/if}
										<a 
											href={survey.link} 
											target="_blank" 
											rel="noopener noreferrer"
											class="text-xs text-violet-600 hover:text-violet-800 truncate block mt-1"
										>
											{survey.link}
										</a>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 font-semibold text-sm">
										{survey.points} pts
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(survey.isActive)}">
										{survey.isActive ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
									<div>
										<span class="font-medium">{survey.totalCompleted}</span>
										<span class="text-neutral-500">/ {survey.totalStarted} started</span>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
									{formatDate(survey.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<div class="flex items-center justify-end gap-2">
										<button
											onclick={() => openEditModal(survey)}
											class="text-violet-600 hover:text-violet-900 p-1"
											title="Edit survey"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>
										<button
											onclick={() => toggleSurveyStatus(survey)}
											class="{survey.isActive ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'} p-1"
											title={survey.isActive ? 'Deactivate' : 'Activate'}
										>
											{#if survey.isActive}
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											{:else}
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											{/if}
										</button>
										<button
											onclick={() => openDeleteModal(survey)}
											class="text-red-600 hover:text-red-900 p-1"
											title="Delete survey"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="6" class="px-6 py-12 text-center text-neutral-500">
								<svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
								</svg>
								<p class="mt-4 text-lg font-medium">No surveys found</p>
								<p class="mt-2">Create your first survey or adjust your filters</p>
								<button
									onclick={openCreateModal}
									class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
									Add Survey
								</button>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.pagination.totalPages > 1}
			<div class="bg-neutral-50 px-6 py-4 flex items-center justify-between border-t border-neutral-200">
				<div class="text-sm text-neutral-700">
					Showing page {data.pagination.page} of {data.pagination.totalPages}
					({data.pagination.total} total surveys)
				</div>
				<div class="flex gap-2">
					{#if data.pagination.page > 1}
						<a
							href="/admin/surveys?page={data.pagination.page - 1}{data.filters.search ? `&search=${data.filters.search}` : ''}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}"
							class="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
						>
							Previous
						</a>
					{/if}
					{#if data.pagination.page < data.pagination.totalPages}
						<a
							href="/admin/surveys?page={data.pagination.page + 1}{data.filters.search ? `&search=${data.filters.search}` : ''}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}"
							class="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
						>
							Next
						</a>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
		<div class="flex min-h-full items-center justify-center p-4">
			<!-- Backdrop -->
			<button 
				type="button"
				class="fixed inset-0 bg-black/50 transition-opacity" 
				onclick={closeModal}
				aria-label="Close create or edit survey modal"
			></button>

			<!-- Modal -->
			<div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-neutral-900">
						{modalMode === 'create' ? 'Create New Survey' : 'Edit Survey'}
					</h2>
					<button 
						type="button"
						onclick={closeModal}
						class="text-neutral-400 hover:text-neutral-600"
						aria-label="Close create or edit survey"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if formError}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
						{formError}
					</div>
				{/if}

				<form onsubmit={handleSubmit}>
					<div class="space-y-4">
						<!-- Title -->
						<div>
							<label for="title" class="block text-sm font-medium text-neutral-700 mb-1">
								Title <span class="text-red-500">*</span>
							</label>
							<input
								id="title"
								type="text"
								bind:value={formTitle}
								required
								placeholder="Enter survey title"
								class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
							/>
						</div>

						<!-- Description -->
						<div>
							<label for="description" class="block text-sm font-medium text-neutral-700 mb-1">
								Description
							</label>
							<textarea
								id="description"
								bind:value={formDescription}
								rows="3"
								placeholder="Optional description"
								class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
							></textarea>
						</div>

						<!-- Points -->
						<div>
							<label for="points" class="block text-sm font-medium text-neutral-700 mb-1">
								Points <span class="text-red-500">*</span>
							</label>
							<input
								id="points"
								type="number"
								bind:value={formPoints}
								required
								min="1"
								placeholder="100"
								class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
							/>
						</div>

						<!-- Link -->
						<div>
							<label for="link" class="block text-sm font-medium text-neutral-700 mb-1">
								Survey Link <span class="text-red-500">*</span>
							</label>
							<input
								id="link"
								type="url"
								bind:value={formLink}
								required
								placeholder="https://..."
								class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
							/>
						</div>

						<!-- Active Status -->
						<div class="flex items-center gap-3">
							<input
								id="isActive"
								type="checkbox"
								bind:checked={formIsActive}
								class="w-4 h-4 text-violet-600 border-neutral-300 rounded focus:ring-violet-500"
							/>
							<label for="isActive" class="text-sm font-medium text-neutral-700">
								Active (visible to panelists)
							</label>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200">
						<button
							type="button"
							onclick={closeModal}
							class="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							class="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Saving...' : (modalMode === 'create' ? 'Create Survey' : 'Save Changes')}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && deletingSurvey}
	<div class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
		<div class="flex min-h-full items-center justify-center p-4">
			<!-- Backdrop -->
			<button 
				type="button"
				class="fixed inset-0 bg-black/50 transition-opacity" 
				onclick={closeDeleteModal}
				aria-label="Close delete confirmation"
			></button>

			<!-- Modal -->
			<div class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
				<div class="flex items-center gap-4 mb-4">
					<div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
						<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-neutral-900">Delete Survey</h3>
						<p class="text-sm text-neutral-500">This action cannot be undone.</p>
					</div>
				</div>

				<p class="text-neutral-700 mb-6">
					Are you sure you want to delete <strong>{deletingSurvey.title}</strong>? 
					All associated data will be preserved but the survey will no longer be available.
				</p>

				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={closeDeleteModal}
						class="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
						aria-label="Cancel deleting survey"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmDelete}
						disabled={isDeleting}
						class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Confirm deleting survey"
					>
						{isDeleting ? 'Deleting...' : 'Delete Survey'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
