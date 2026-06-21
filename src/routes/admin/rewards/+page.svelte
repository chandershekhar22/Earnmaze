<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { Plus, Gift, Check, Star, Ban, Pencil, CircleX, CircleCheck, Trash, X, AlertTriangle } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const rewardTypes = [
		{ value: 'gift_card', label: 'Gift Card' },
		{ value: 'cash', label: 'Cash' },
		{ value: 'product', label: 'Product' },
		{ value: 'discount', label: 'Discount' },
		{ value: 'experience', label: 'Experience' }
	];

	// Search & Filter state (synced from server data via $effect)
	let searchInput = $state('');
	let statusFilter = $state('all');
	let typeFilter = $state('all');

	// Sync filter inputs when server data changes (navigation/pagination)
	$effect(() => {
		searchInput = data.filters.search;
		statusFilter = data.filters.status;
		typeFilter = data.filters.type;
	});

	// Modal state
	let showModal = $state(false);
	let modalMode = $state<'create' | 'edit'>('create');
	let editingReward = $state<(typeof data.rewards)[0] | null>(null);

	// Form state
	let formName = $state('');
	let formDescription = $state('');
	let formType = $state<string>('gift_card');
	let formProvider = $state('');
	let formCategory = $state('');
	let formPointsCost = $state(500);
	let formValue = $state('10.00');
	let formCurrency = $state('USD');
	let formStock = $state<number | null>(null);
	let formMaxPerUser = $state<number | null>(null);
	let formIsActive = $state(true);
	let formIsFeatured = $state(false);
	let formImage = $state('');
	let formTerms = $state('');
	let formExpiresAt = $state('');
	let isSubmitting = $state(false);
	let formError = $state('');

	// Delete confirmation
	let showDeleteModal = $state(false);
	let deletingReward = $state<(typeof data.rewards)[0] | null>(null);
	let isDeleting = $state(false);

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchInput) params.set('search', searchInput);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (typeFilter !== 'all') params.set('type', typeFilter);
		goto(`/admin/rewards?${params.toString()}`);
	}

	function handleFilterChange() {
		handleSearch();
	}

	function openCreateModal() {
		modalMode = 'create';
		formName = '';
		formDescription = '';
		formType = 'gift_card';
		formProvider = '';
		formCategory = '';
		formPointsCost = 500;
		formValue = '10.00';
		formCurrency = 'USD';
		formStock = null;
		formMaxPerUser = null;
		formIsActive = true;
		formIsFeatured = false;
		formImage = '';
		formTerms = '';
		formExpiresAt = '';
		formError = '';
		editingReward = null;
		showModal = true;
	}

	function openEditModal(reward: (typeof data.rewards)[0]) {
		modalMode = 'edit';
		editingReward = reward;
		formName = reward.name;
		formDescription = reward.description || '';
		formType = reward.type;
		formProvider = reward.provider || '';
		formCategory = reward.category || '';
		formPointsCost = reward.pointsCost;
		formValue = reward.value;
		formCurrency = reward.currency || 'USD';
		formStock = reward.stock;
		formMaxPerUser = reward.maxPerUser;
		formIsActive = reward.isActive ?? true;
		formIsFeatured = reward.isFeatured ?? false;
		formImage = reward.image || '';
		formTerms = reward.terms || '';
		formExpiresAt = reward.expiresAt
			? new Date(reward.expiresAt).toISOString().slice(0, 16)
			: '';
		formError = '';
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingReward = null;
		formError = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isSubmitting = true;
		formError = '';

		try {
			const payload: Record<string, unknown> = {
				name: formName,
				description: formDescription || null,
				type: formType,
				provider: formProvider || null,
				category: formCategory || null,
				pointsCost: formPointsCost,
				value: formValue,
				currency: formCurrency,
				stock: formStock,
				maxPerUser: formMaxPerUser,
				isActive: formIsActive,
				isFeatured: formIsFeatured,
				image: formImage || null,
				terms: formTerms || null,
				expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null
			};

			const url =
				modalMode === 'create'
					? '/api/admin/rewards'
					: `/api/admin/rewards/${editingReward?.id}`;

			const method = modalMode === 'create' ? 'POST' : 'PATCH';

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = await res.json();

			if (!res.ok || !result.success) {
				formError = result.message || 'Failed to save reward';
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

	async function toggleRewardStatus(reward: (typeof data.rewards)[0]) {
		try {
			const res = await fetch(`/api/admin/rewards/${reward.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !reward.isActive })
			});

			if (res.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to toggle reward status:', error);
		}
	}

	async function toggleFeatured(reward: (typeof data.rewards)[0]) {
		try {
			const res = await fetch(`/api/admin/rewards/${reward.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isFeatured: !reward.isFeatured })
			});

			if (res.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to toggle featured status:', error);
		}
	}

	function openDeleteModal(reward: (typeof data.rewards)[0]) {
		deletingReward = reward;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		deletingReward = null;
	}

	async function confirmDelete() {
		if (!deletingReward) return;
		isDeleting = true;

		try {
			const res = await fetch(`/api/admin/rewards/${deletingReward.id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				closeDeleteModal();
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to delete reward:', error);
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

	function formatCurrency(value: string | number, currency: string | null) {
		const num = typeof value === 'string' ? parseFloat(value) : value;
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency || 'USD'
		}).format(num);
	}

	function getStatusColor(isActive: boolean) {
		return isActive ? 'badge-success' : 'badge-neutral';
	}

	function getTypeLabel(type: string) {
		return rewardTypes.find((t) => t.value === type)?.label || type;
	}

	function getTypeColor(type: string) {
		const colors: Record<string, string> = {
			gift_card: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20',
			cash: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
			product: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20',
			discount: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
			experience: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20'
		};
		return colors[type] || 'badge-neutral';
	}
</script>

<svelte:head>
	<title>Manage Rewards - Admin Panel</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold text-white">Rewards Management</h1>
			<p class="text-neutral-400 mt-2">Create, edit and manage rewards for panelists</p>
		</div>
		<button
			onclick={openCreateModal}
			class="btn-primary mt-4 sm:mt-0"
		>
			<Plus class="w-5 h-5" />
			Add Reward
		</button>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Total Rewards</p>
					<p class="text-2xl font-bold text-white mt-1">{data.stats.totalRewards}</p>
				</div>
				<div class="stat-icon bg-violet-500/10">
					<Gift class="w-7 h-7 text-violet-400" />
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Active</p>
					<p class="text-2xl font-bold text-emerald-400 mt-1">{data.stats.activeRewards}</p>
				</div>
				<div class="stat-icon bg-emerald-500/10">
					<Check class="w-7 h-7 text-emerald-400" />
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Featured</p>
					<p class="text-2xl font-bold text-amber-400 mt-1">{data.stats.featuredRewards}</p>
				</div>
				<div class="stat-icon bg-amber-500/10">
					<Star class="w-7 h-7 text-amber-400" />
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Out of Stock</p>
					<p class="text-2xl font-bold text-rose-400 mt-1">{data.stats.outOfStock}</p>
				</div>
				<div class="stat-icon bg-rose-500/10">
					<Ban class="w-7 h-7 text-rose-400" />
				</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="card mb-6">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<!-- Search -->
			<div class="md:col-span-2">
				<label for="search" class="label">
					Search Rewards
				</label>
				<div class="flex gap-2">
					<input
						id="search"
						type="text"
						bind:value={searchInput}
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
						placeholder="Search by name, description or provider..."
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
					<option value="all">All Status</option>
					<option value="active">Active Only</option>
					<option value="inactive">Inactive Only</option>
				</select>
			</div>

			<!-- Type Filter -->
			<div>
				<label for="type" class="label">
					Type
				</label>
				<select
					id="type"
					bind:value={typeFilter}
					onchange={handleFilterChange}
					class="select"
				>
					<option value="all">All Types</option>
					{#each rewardTypes as rt}
						<option value={rt.value}>{rt.label}</option>
					{/each}
				</select>
			</div>
		</div>

		{#if data.filters.search || data.filters.status !== 'all' || data.filters.type !== 'all'}
			<div class="mt-4 flex items-center gap-2 flex-wrap">
				<span class="text-sm text-neutral-500">Active filters:</span>
				{#if data.filters.search}
					<span class="badge-primary">
						Search: {data.filters.search}
						<button
							onclick={() => {
								searchInput = '';
								handleSearch();
							}}
							class="hover:text-primary-300 ms-1"
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
							class="hover:text-primary-300 ms-1"
						>
							&times;
						</button>
					</span>
				{/if}
				{#if data.filters.type !== 'all'}
					<span class="badge-primary">
						Type: {getTypeLabel(data.filters.type)}
						<button
							onclick={() => {
								typeFilter = 'all';
								handleFilterChange();
							}}
							class="hover:text-primary-300 ms-1"
						>
							&times;
						</button>
					</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Rewards Table -->
	<div class="card !p-0 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead class="table-header">
					<tr>
						<th class="table-th">Reward</th>
						<th class="table-th">Type</th>
						<th class="table-th">Cost / Value</th>
						<th class="table-th">Stock</th>
						<th class="table-th">Redemptions</th>
						<th class="table-th">Status</th>
						<th class="table-th text-end">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if data.rewards.length > 0}
						{#each data.rewards as reward}
							<tr class="table-row">
								<td class="table-td">
									<div class="max-w-xs">
										<div class="flex items-center gap-2">
											<div class="font-medium text-white truncate">
												{reward.name}
											</div>
											{#if reward.isFeatured}
												<Star class="w-4 h-4 text-amber-400 flex-shrink-0 fill-current" />
											{/if}
										</div>
										{#if reward.provider}
											<div class="text-sm text-neutral-500">{reward.provider}</div>
										{/if}
										{#if reward.category}
											<div class="text-xs text-neutral-600 mt-0.5">
												{reward.category}
											</div>
										{/if}
									</div>
								</td>
								<td class="table-td whitespace-nowrap">
									<span
										class="px-2.5 py-1 text-xs font-medium rounded-full {getTypeColor(
											reward.type
										)}"
									>
										{getTypeLabel(reward.type)}
									</span>
								</td>
								<td class="table-td whitespace-nowrap">
									<div>
										<span class="badge-warning font-semibold">
											{reward.pointsCost} pts
										</span>
										<div class="text-xs text-neutral-500 mt-1">
											{formatCurrency(reward.value, reward.currency)}
										</div>
									</div>
								</td>
								<td class="table-td whitespace-nowrap text-sm">
									{#if reward.stock === null}
										<span class="text-neutral-500">Unlimited</span>
									{:else if reward.stock === 0}
										<span class="text-rose-400 font-medium">Out of stock</span>
									{:else}
										<span class="text-neutral-300">{reward.stock}</span>
									{/if}
								</td>
								<td class="table-td whitespace-nowrap">
									<div>
										<span class="font-medium text-white">{reward.totalRedemptions}</span>
										{#if reward.pendingRedemptions > 0}
											<span class="text-amber-400 text-xs ms-1"
												>({reward.pendingRedemptions} pending)</span
											>
										{/if}
									</div>
								</td>
								<td class="table-td whitespace-nowrap">
									<span
										class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(
											reward.isActive ?? true
										)}"
									>
										{reward.isActive ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td class="table-td whitespace-nowrap text-end text-sm font-medium">
									<div class="flex items-center justify-end gap-2">
										<button
											onclick={() => openEditModal(reward)}
											class="text-primary-400 hover:text-primary-300 p-1"
											title="Edit reward"
										>
											<Pencil class="w-5 h-5" />
										</button>
										<button
											onclick={() => toggleFeatured(reward)}
											class="{reward.isFeatured
												? 'text-amber-400 hover:text-amber-300'
												: 'text-neutral-600 hover:text-amber-400'} p-1"
											title={reward.isFeatured ? 'Remove featured' : 'Mark featured'}
										>
											<Star class="w-5 h-5 {reward.isFeatured ? 'fill-current' : ''}" />
										</button>
										<button
											onclick={() => toggleRewardStatus(reward)}
											class="{reward.isActive
												? 'text-amber-400 hover:text-amber-300'
												: 'text-emerald-400 hover:text-emerald-300'} p-1"
											title={reward.isActive ? 'Deactivate' : 'Activate'}
										>
											{#if reward.isActive}
												<CircleX class="w-5 h-5" />
											{:else}
												<CircleCheck class="w-5 h-5" />
											{/if}
										</button>
										<button
											onclick={() => openDeleteModal(reward)}
											class="text-rose-400 hover:text-rose-300 p-1"
											title="Delete reward"
										>
											<Trash class="w-5 h-5" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-neutral-500">
								<Gift class="mx-auto h-12 w-12 text-neutral-600" />
								<p class="mt-4 text-lg font-medium text-neutral-400">No rewards found</p>
								<p class="mt-2">Create your first reward or adjust your filters</p>
								<button
									onclick={openCreateModal}
									class="btn-primary mt-4"
								>
									<Plus class="w-5 h-5" />
									Add Reward
								</button>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.pagination.totalPages > 1}
			<div
				class="bg-surface-50 px-6 py-4 flex items-center justify-between border-t border-white/[0.06]"
			>
				<div class="text-sm text-neutral-400">
					Showing page {data.pagination.page} of {data.pagination.totalPages}
					({data.pagination.total} total rewards)
				</div>
				<div class="flex gap-2">
					{#if data.pagination.page > 1}
						<a
							href="/admin/rewards?page={data.pagination.page -
								1}{data.filters.search
								? `&search=${data.filters.search}`
								: ''}{data.filters.status !== 'all'
								? `&status=${data.filters.status}`
								: ''}{data.filters.type !== 'all'
								? `&type=${data.filters.type}`
								: ''}"
							class="btn-secondary text-sm"
						>
							Previous
						</a>
					{/if}
					{#if data.pagination.page < data.pagination.totalPages}
						<a
							href="/admin/rewards?page={data.pagination.page +
								1}{data.filters.search
								? `&search=${data.filters.search}`
								: ''}{data.filters.status !== 'all'
								? `&status=${data.filters.status}`
								: ''}{data.filters.type !== 'all'
								? `&type=${data.filters.type}`
								: ''}"
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
				aria-label="Close modal"
			></button>

			<!-- Modal -->
			<div class="relative bg-surface-100 rounded-2xl border border-white/[0.06] shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-white">
						{modalMode === 'create' ? 'Create New Reward' : 'Edit Reward'}
					</h2>
					<button
						type="button"
						onclick={closeModal}
						class="text-neutral-500 hover:text-neutral-300"
						aria-label="Close modal"
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
						<!-- Row: Name + Type -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="name" class="label">
									Name <span class="text-rose-400">*</span>
								</label>
								<input
									id="name"
									type="text"
									bind:value={formName}
									required
									placeholder="e.g. Amazon Gift Card"
									class="input"
								/>
							</div>

							<div>
								<label for="type" class="label">
									Type <span class="text-rose-400">*</span>
								</label>
								<select
									id="type"
									bind:value={formType}
									required
									class="select"
								>
									{#each rewardTypes as rt}
										<option value={rt.value}>{rt.label}</option>
									{/each}
								</select>
							</div>
						</div>

						<!-- Description -->
						<div>
							<label
								for="description"
								class="label"
							>
								Description
							</label>
							<textarea
								id="description"
								bind:value={formDescription}
								rows="2"
								placeholder="Optional description"
								class="input resize-none"
							></textarea>
						</div>

						<!-- Row: Provider + Category -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label
									for="provider"
									class="label"
								>
									Provider
								</label>
								<input
									id="provider"
									type="text"
									bind:value={formProvider}
									placeholder="e.g. Amazon, PayPal, Visa"
									class="input"
								/>
							</div>

							<div>
								<label
									for="category"
									class="label"
								>
									Category
								</label>
								<input
									id="category"
									type="text"
									bind:value={formCategory}
									placeholder="e.g. shopping, dining"
									class="input"
								/>
							</div>
						</div>

						<!-- Row: Points Cost + Value + Currency -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label
									for="pointsCost"
									class="label"
								>
									Points Cost <span class="text-rose-400">*</span>
								</label>
								<input
									id="pointsCost"
									type="number"
									bind:value={formPointsCost}
									required
									min="1"
									placeholder="500"
									class="input"
								/>
							</div>

							<div>
								<label for="value" class="label">
									Value <span class="text-rose-400">*</span>
								</label>
								<input
									id="value"
									type="text"
									bind:value={formValue}
									required
									placeholder="10.00"
									class="input"
								/>
							</div>

							<div>
								<label
									for="currency"
									class="label"
								>
									Currency
								</label>
								<input
									id="currency"
									type="text"
									bind:value={formCurrency}
									placeholder="USD"
									maxlength="10"
									class="input"
								/>
							</div>
						</div>

						<!-- Row: Stock + Max Per User -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="stock" class="label">
									Stock
								</label>
								<input
									id="stock"
									type="number"
									bind:value={formStock}
									min="0"
									placeholder="Leave empty for unlimited"
									class="input"
								/>
								<p class="text-xs text-neutral-500 mt-1">Leave empty for unlimited stock</p>
							</div>

							<div>
								<label
									for="maxPerUser"
									class="label"
								>
									Max Per User
								</label>
								<input
									id="maxPerUser"
									type="number"
									bind:value={formMaxPerUser}
									min="1"
									placeholder="Leave empty for no limit"
									class="input"
								/>
								<p class="text-xs text-neutral-500 mt-1">
									Leave empty for no per-user limit
								</p>
							</div>
						</div>

						<!-- Image URL -->
						<div>
							<label for="image" class="label">
								Image URL
							</label>
							<input
								id="image"
								type="url"
								bind:value={formImage}
								placeholder="https://..."
								class="input"
							/>
						</div>

						<!-- Terms -->
						<div>
							<label for="terms" class="label">
								Terms & Conditions
							</label>
							<textarea
								id="terms"
								bind:value={formTerms}
								rows="2"
								placeholder="Optional terms and conditions"
								class="input resize-none"
							></textarea>
						</div>

						<!-- Expires At -->
						<div>
							<label
								for="expiresAt"
								class="label"
							>
								Expires At
							</label>
							<input
								id="expiresAt"
								type="datetime-local"
								bind:value={formExpiresAt}
								class="input"
							/>
						</div>

						<!-- Toggles -->
						<div class="flex items-center gap-6">
							<div class="flex items-center gap-3">
								<input
									id="isActive"
									type="checkbox"
									bind:checked={formIsActive}
									class="w-4 h-4 text-primary-600 bg-surface-50 border-white/[0.06] rounded focus:ring-primary-500"
								/>
								<label for="isActive" class="text-sm font-medium text-neutral-300">
									Active
								</label>
							</div>
							<div class="flex items-center gap-3">
								<input
									id="isFeatured"
									type="checkbox"
									bind:checked={formIsFeatured}
									class="w-4 h-4 text-amber-600 bg-surface-50 border-white/[0.06] rounded focus:ring-amber-500"
								/>
								<label for="isFeatured" class="text-sm font-medium text-neutral-300">
									Featured
								</label>
							</div>
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
							{isSubmitting
								? 'Saving...'
								: modalMode === 'create'
									? 'Create Reward'
									: 'Save Changes'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && deletingReward}
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
					<div
						class="flex-shrink-0 w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center"
					>
						<AlertTriangle class="w-6 h-6 text-rose-400" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-white">Delete Reward</h3>
						<p class="text-sm text-neutral-500">This will deactivate the reward.</p>
					</div>
				</div>

				<p class="text-neutral-400 mb-6">
					Are you sure you want to delete <strong class="text-white">{deletingReward.name}</strong>?
					The reward will be deactivated and hidden from panelists, but existing redemptions
					will be preserved.
				</p>

				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={closeDeleteModal}
						class="btn-ghost"
						aria-label="Cancel"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmDelete}
						disabled={isDeleting}
						class="btn-danger"
						aria-label="Confirm delete"
					>
						{isDeleting ? 'Deleting...' : 'Delete Reward'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
