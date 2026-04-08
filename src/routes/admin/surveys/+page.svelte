<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { Plus, ClipboardList, Check, CircleX, CircleCheck, Pencil, Trash, X, AlertTriangle, Eye, ChevronDown, ChevronUp, ExternalLink, Coins, Users, BarChart2 } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Search & Filter state
	let searchInput = $state('');
	let statusFilter = $state<PageData['filters']['status']>('all');
	let priorityFilter = $state<string>('all');

	$effect(() => {
		searchInput = data.filters.search;
		statusFilter = data.filters.status;
	});

	// Modal state
	let showModal = $state(false);
	let modalMode = $state<'create' | 'edit'>('create');
	let editingSurvey = $state<typeof data.surveys[0] | null>(null);

	// Form state
	let formTitle = $state('');
	let formDescription = $state('');
	let formPoints = $state(100);
	let formTerminatedPoints = $state(0);
	let formQuotaFullPoints = $state(0);
	let formLink = $state('');
	let formIsActive = $state(true);
	let formPriority = $state<'low' | 'medium' | 'high'>('medium');
	let isSubmitting = $state(false);
	let formError = $state('');

	// Expanded detail view
	let expandedSurvey = $state<string | null>(null);

	function toggleSurveyDetail(id: string) {
		expandedSurvey = expandedSurvey === id ? null : id;
	}

	// Delete confirmation
	let showDeleteModal = $state(false);
	let deletingSurvey = $state<typeof data.surveys[0] | null>(null);
	let isDeleting = $state(false);

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchInput) params.set('search', searchInput);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (priorityFilter !== 'all') params.set('priority', priorityFilter);
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
		formTerminatedPoints = 0;
		formQuotaFullPoints = 0;
		formLink = '';
		formIsActive = true;
		formPriority = 'medium';
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
		formTerminatedPoints = survey.terminatedPoints ?? 0;
		formQuotaFullPoints = survey.quotaFullPoints ?? 0;
		formLink = survey.link;
		formIsActive = survey.isActive;
		formPriority = survey.priority ?? 'medium';
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
				terminatedPoints: formTerminatedPoints,
				quotaFullPoints: formQuotaFullPoints,
				link: formLink,
				isActive: formIsActive,
				priority: formPriority
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
			? 'badge-success'
			: 'badge-neutral';
	}
</script>

<svelte:head>
	<title>Manage Surveys - Admin Panel</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold text-white">Survey Management</h1>
			<p class="text-neutral-400 mt-2">Create, edit and manage surveys for panelists</p>
		</div>
		<button
			onclick={openCreateModal}
			class="btn-primary mt-4 sm:mt-0"
		>
			<Plus class="w-5 h-5" />
			Add Survey
		</button>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Total Surveys</p>
					<p class="text-2xl font-bold text-white mt-1">{data.stats.totalSurveys}</p>
				</div>
				<div class="stat-icon bg-violet-500/10">
					<ClipboardList class="w-7 h-7 text-violet-400" />
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Active Surveys</p>
					<p class="text-2xl font-bold text-emerald-400 mt-1">{data.stats.activeSurveys}</p>
				</div>
				<div class="stat-icon bg-emerald-500/10">
					<Check class="w-7 h-7 text-emerald-400" />
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Inactive Surveys</p>
					<p class="text-2xl font-bold text-neutral-500 mt-1">{data.stats.inactiveSurveys}</p>
				</div>
				<div class="stat-icon bg-white/5">
					<CircleX class="w-7 h-7 text-neutral-500" />
				</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="card mb-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Search -->
			<div class="md:col-span-2">
				<label for="search" class="label">
					Search Surveys
				</label>
				<div class="flex gap-2">
					<input
						id="search"
						type="text"
						bind:value={searchInput}
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
						placeholder="Search by title or description..."
						class="input flex-1"
					/>
					<button
						onclick={handleSearch}
						class="btn-primary"
					>
						Search
					</button>
				</div>
			</div>

			<!-- Status Filter -->
			<div>
				<label for="status" class="label">
					Status
				</label>
				<select
					id="status"
					bind:value={statusFilter}
					onchange={handleFilterChange}
					class="select"
				>
					<option value="all">All Surveys</option>
					<option value="active">Active Only</option>
					<option value="inactive">Inactive Only</option>
				</select>
			</div>

			<!-- Priority Filter -->
			<div>
				<label for="priority-filter" class="label">
					Priority
				</label>
				<select
					id="priority-filter"
					bind:value={priorityFilter}
					onchange={handleFilterChange}
					class="select"
				>
					<option value="all">All Priorities</option>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
				</select>
			</div>
		</div>

		{#if data.filters.search || data.filters.status !== 'all'}
			<div class="mt-4 flex items-center gap-2">
				<span class="text-sm text-neutral-500">Active filters:</span>
				{#if data.filters.search}
					<span class="badge-primary">
						Search: {data.filters.search}
						<button
							onclick={() => {
								searchInput = '';
								handleSearch();
							}}
							class="hover:text-primary-300 ml-1"
						>
							&times;
						</button>
					</span>
				{/if}
				{#if data.filters.status !== 'all'}
					<span class="badge-primary">
						Status: {data.filters.status}
						<button
							onclick={() => {
								statusFilter = 'all';
								handleFilterChange();
							}}
							class="hover:text-primary-300 ml-1"
						>
							&times;
						</button>
					</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Surveys Table -->
	<div class="card !p-0 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead class="table-header">
					<tr>
						<th class="table-th">Survey</th>
						<th class="table-th">Points</th>
						<th class="table-th">Priority</th>
						<th class="table-th">Status</th>
						<th class="table-th">Completions</th>
						<th class="table-th">Created</th>
						<th class="table-th text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if data.surveys.length > 0}
						{#each data.surveys as survey}
							<tr class="table-row cursor-pointer" onclick={() => toggleSurveyDetail(survey.id)}>
								<td class="table-td">
									<div class="max-w-xs">
										<div class="font-medium text-white truncate">{survey.title}</div>
										{#if survey.description}
											<div class="text-sm text-neutral-500 truncate">{survey.description}</div>
										{/if}
									</div>
								</td>
								<td class="table-td whitespace-nowrap">
									<span class="badge-warning font-semibold">{survey.points} pts</span>
								</td>
								<td class="table-td whitespace-nowrap">
									{#if survey.priority === 'high'}
										<span class="px-2 py-1 text-[10px] font-bold rounded-full bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20">High</span>
									{:else if survey.priority === 'medium'}
										<span class="px-2 py-1 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20">Medium</span>
									{:else}
										<span class="px-2 py-1 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20">Low</span>
									{/if}
								</td>
								<td class="table-td whitespace-nowrap">
									<span class="badge {getStatusColor(survey.isActive)}">{survey.isActive ? 'Active' : 'Inactive'}</span>
								</td>
								<td class="table-td whitespace-nowrap">
									<span class="font-medium text-white">{survey.totalCompleted}</span>
									<span class="text-neutral-600">/ {survey.totalStarted}</span>
								</td>
								<td class="table-td whitespace-nowrap text-neutral-500">{formatDate(survey.createdAt)}</td>
								<td class="table-td whitespace-nowrap text-right text-sm font-medium">
									<div class="flex items-center justify-end gap-1.5">
										<button onclick={(e) => { e.stopPropagation(); toggleSurveyDetail(survey.id); }} class="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors" title="View details">
											{#if expandedSurvey === survey.id}<ChevronUp class="w-4 h-4" />{:else}<Eye class="w-4 h-4" />{/if}
										</button>
										<button onclick={(e) => { e.stopPropagation(); openEditModal(survey); }} class="p-1.5 rounded-lg text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 transition-colors" title="Edit">
											<Pencil class="w-4 h-4" />
										</button>
										<button onclick={(e) => { e.stopPropagation(); toggleSurveyStatus(survey); }} class="p-1.5 rounded-lg {survey.isActive ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'} transition-colors" title={survey.isActive ? 'Deactivate' : 'Activate'}>
											{#if survey.isActive}<CircleX class="w-4 h-4" />{:else}<CircleCheck class="w-4 h-4" />{/if}
										</button>
										<button onclick={(e) => { e.stopPropagation(); openDeleteModal(survey); }} class="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete">
											<Trash class="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>

							<!-- Expanded Detail Row -->
							{#if expandedSurvey === survey.id}
								<tr>
									<td colspan="6" class="px-0 py-0">
										<div class="bg-surface-50 border-y border-white/[0.04] px-6 py-5 animate-fade-in">
											<!-- Detail Grid -->
											<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
												<div class="bg-surface-100 rounded-xl p-3 border border-white/[0.06]">
													<div class="flex items-center gap-2 mb-1.5">
														<Coins class="w-3.5 h-3.5 text-emerald-400" />
														<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Completed Pts</span>
													</div>
													<div class="text-lg font-black text-white">{survey.points}</div>
												</div>
												<div class="bg-surface-100 rounded-xl p-3 border border-white/[0.06]">
													<div class="flex items-center gap-2 mb-1.5">
														<Coins class="w-3.5 h-3.5 text-amber-400" />
														<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Terminated Pts</span>
													</div>
													<div class="text-lg font-black text-white">{survey.terminatedPoints ?? 0}</div>
												</div>
												<div class="bg-surface-100 rounded-xl p-3 border border-white/[0.06]">
													<div class="flex items-center gap-2 mb-1.5">
														<Coins class="w-3.5 h-3.5 text-sky-400" />
														<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Quota Full Pts</span>
													</div>
													<div class="text-lg font-black text-white">{survey.quotaFullPoints ?? 0}</div>
												</div>
												<div class="bg-surface-100 rounded-xl p-3 border border-white/[0.06]">
													<div class="flex items-center gap-2 mb-1.5">
														<BarChart2 class="w-3.5 h-3.5 text-violet-400" />
														<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Completion Rate</span>
													</div>
													<div class="text-lg font-black text-white">
														{survey.totalStarted > 0 ? ((survey.totalCompleted / survey.totalStarted) * 100).toFixed(0) : 0}%
													</div>
												</div>
											</div>

											<!-- Info Rows -->
											<div class="space-y-3">
												{#if survey.description}
													<div>
														<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Description</span>
														<p class="text-sm text-neutral-300 mt-1">{survey.description}</p>
													</div>
												{/if}

												<div>
													<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Survey Link</span>
													<a href={survey.link} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 mt-1 transition-colors">
														{survey.link}
														<ExternalLink class="w-3.5 h-3.5 flex-shrink-0" />
													</a>
												</div>

												<div class="flex items-center gap-6">
													<div>
														<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Survey ID</span>
														<p class="text-xs text-neutral-400 font-mono mt-1">{survey.id}</p>
													</div>
													<div>
														<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Created</span>
														<p class="text-xs text-neutral-400 mt-1">{formatDate(survey.createdAt)}</p>
													</div>
													<div>
														<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Status</span>
														<p class="mt-1"><span class="badge {getStatusColor(survey.isActive)}">{survey.isActive ? 'Active' : 'Inactive'}</span></p>
													</div>
												</div>
											</div>

											<!-- Actions row -->
											<div class="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
												<a href="/admin/responses?survey={survey.id}" class="btn-secondary !text-xs !py-2">
													<Users class="w-3.5 h-3.5" /> View Responses
												</a>
												<button onclick={() => openEditModal(survey)} class="btn-secondary !text-xs !py-2">
													<Pencil class="w-3.5 h-3.5" /> Edit
												</button>
												<button onclick={() => { navigator.clipboard.writeText(survey.id); }} class="btn-ghost !text-xs !py-2">
													Copy ID
												</button>
											</div>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					{:else}
						<tr>
							<td colspan="6" class="px-6 py-12 text-center text-neutral-500">
								<ClipboardList class="mx-auto h-12 w-12 text-neutral-600" />
								<p class="mt-4 text-lg font-medium text-neutral-400">No surveys found</p>
								<p class="mt-2">Create your first survey or adjust your filters</p>
								<button
									onclick={openCreateModal}
									class="btn-primary mt-4"
								>
									<Plus class="w-5 h-5" />
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
			<div class="bg-surface-50 px-6 py-4 flex items-center justify-between border-t border-white/[0.06]">
				<div class="text-sm text-neutral-400">
					Showing page {data.pagination.page} of {data.pagination.totalPages}
					({data.pagination.total} total surveys)
				</div>
				<div class="flex gap-2">
					{#if data.pagination.page > 1}
						<a
							href="/admin/surveys?page={data.pagination.page - 1}{data.filters.search ? `&search=${data.filters.search}` : ''}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}"
							class="btn-secondary text-sm"
						>
							Previous
						</a>
					{/if}
					{#if data.pagination.page < data.pagination.totalPages}
						<a
							href="/admin/surveys?page={data.pagination.page + 1}{data.filters.search ? `&search=${data.filters.search}` : ''}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}"
							class="btn-secondary text-sm"
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
				class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
				onclick={closeModal}
				aria-label="Close create or edit survey modal"
			></button>

			<!-- Modal -->
			<div class="relative bg-surface-100 rounded-2xl border border-white/[0.06] shadow-xl w-full max-w-lg p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-white">
						{modalMode === 'create' ? 'Create New Survey' : 'Edit Survey'}
					</h2>
					<button
						type="button"
						onclick={closeModal}
						class="text-neutral-500 hover:text-neutral-300"
						aria-label="Close create or edit survey"
					>
						<X class="w-6 h-6" />
					</button>
				</div>

				{#if formError}
					<div class="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
						{formError}
					</div>
				{/if}

				<form onsubmit={handleSubmit}>
					<div class="space-y-4">
						<!-- Title -->
						<div>
							<label for="title" class="label">
								Title <span class="text-rose-400">*</span>
							</label>
							<input
								id="title"
								type="text"
								bind:value={formTitle}
								required
								placeholder="Enter survey title"
								class="input"
							/>
						</div>

						<!-- Description -->
						<div>
							<label for="description" class="label">
								Description
							</label>
							<textarea
								id="description"
								bind:value={formDescription}
								rows="3"
								placeholder="Optional description"
								class="input resize-none"
							></textarea>
						</div>

						<!-- Points -->
						<div>
							<label for="points" class="label">
								Points <span class="text-rose-400">*</span>
							</label>
							<input
								id="points"
								type="number"
								bind:value={formPoints}
								required
								min="1"
								placeholder="100"
								class="input"
							/>
						</div>

						<!-- Terminated / Quota Full Points -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="terminatedPoints" class="label">
									Terminated Points
								</label>
								<input
									id="terminatedPoints"
									type="number"
									bind:value={formTerminatedPoints}
									min="0"
									placeholder="0"
									class="input"
								/>
							</div>
							<div>
								<label for="quotaFullPoints" class="label">
									Quota Full Points
								</label>
								<input
									id="quotaFullPoints"
									type="number"
									bind:value={formQuotaFullPoints}
									min="0"
									placeholder="0"
									class="input"
								/>
							</div>
						</div>

						<!-- Link -->
						<div>
							<label for="link" class="label">
								Survey Link <span class="text-rose-400">*</span>
							</label>
							<input
								id="link"
								type="url"
								bind:value={formLink}
								required
								placeholder="https://..."
								class="input"
							/>
						</div>

						<!-- Priority -->
						<div>
							<label for="priority" class="label">Priority</label>
							<select id="priority" bind:value={formPriority} class="select">
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>

						<!-- Active Status -->
						<div class="flex items-center gap-3">
							<input
								id="isActive"
								type="checkbox"
								bind:checked={formIsActive}
								class="w-4 h-4 text-primary-600 bg-surface-50 border-white/[0.06] rounded focus:ring-primary-500"
							/>
							<label for="isActive" class="text-sm font-medium text-neutral-300">
								Active (visible to panelists)
							</label>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
						<button
							type="button"
							onclick={closeModal}
							class="btn-ghost"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							class="btn-primary"
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
				class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
				onclick={closeDeleteModal}
				aria-label="Close delete confirmation"
			></button>

			<!-- Modal -->
			<div class="relative bg-surface-100 rounded-2xl border border-white/[0.06] shadow-xl w-full max-w-md p-6">
				<div class="flex items-center gap-4 mb-4">
					<div class="flex-shrink-0 w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center">
						<AlertTriangle class="w-6 h-6 text-rose-400" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-white">Delete Survey</h3>
						<p class="text-sm text-neutral-500">This action cannot be undone.</p>
					</div>
				</div>

				<p class="text-neutral-400 mb-6">
					Are you sure you want to delete <strong class="text-white">{deletingSurvey.title}</strong>?
					All associated data will be preserved but the survey will no longer be available.
				</p>

				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={closeDeleteModal}
						class="btn-ghost"
						aria-label="Cancel deleting survey"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmDelete}
						disabled={isDeleting}
						class="btn-danger"
						aria-label="Confirm deleting survey"
					>
						{isDeleting ? 'Deleting...' : 'Delete Survey'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
