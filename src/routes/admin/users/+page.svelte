<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { User, Users, ClipboardList, Check } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let searchInput = $state('');
	let userTypeFilter = $state<PageData['filters']['userType']>('all');

	$effect(() => {
		searchInput = data.filters.search;
		userTypeFilter = data.filters.userType;
	});

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchInput) params.set('search', searchInput);
		if (userTypeFilter !== 'all') params.set('type', userTypeFilter);
		goto(`/admin/users?${params.toString()}`);
	}

	function handleFilterChange() {
		handleSearch();
	}

	function formatDate(dateString: string | Date | null) {
		if (!dateString) return 'Never';
		const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getUserTypeColor(userType: string) {
		switch (userType) {
			case 'admin':
				return 'badge-primary';
			case 'panelist':
				return 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20';
			default:
				return 'badge-neutral';
		}
	}

	function getStatusColor(isActive: boolean) {
		return isActive ? 'badge-success' : 'badge-danger';
	}
</script>

<svelte:head>
	<title>Manage Users - Admin Panel</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white">User Management</h1>
		<p class="text-neutral-400 mt-2">Manage all users in the system</p>
	</div>

	<!-- Filters -->
	<div class="card mb-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Search -->
			<div class="md:col-span-2">
				<label for="search" class="label">
					Search Users
				</label>
				<div class="flex gap-2">
					<input
						id="search"
						type="text"
						bind:value={searchInput}
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
						placeholder="Search by name or email..."
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

			<!-- User Type Filter -->
			<div>
				<label for="userType" class="label">
					User Type
				</label>
				<select
					id="userType"
					bind:value={userTypeFilter}
					onchange={handleFilterChange}
					class="select"
				>
					<option value="all">All Users</option>
					<option value="panelist">Panelists</option>
					<option value="admin">Admins</option>
				</select>
			</div>
		</div>

		{#if data.filters.search || data.filters.userType !== 'all'}
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
				{#if data.filters.userType !== 'all'}
					<span class="badge-primary">
						Type: {data.filters.userType}
						<button
							onclick={() => {
								userTypeFilter = 'all';
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

	<!-- Stats Summary -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Total Users</p>
					<p class="text-2xl font-bold text-white mt-1">{data.pagination.total}</p>
				</div>
				<div class="stat-icon bg-blue-500/10">
					<User class="w-7 h-7 text-blue-400" />
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Current Page</p>
					<p class="text-2xl font-bold text-white mt-1">
						{data.pagination.page} / {data.pagination.totalPages}
					</p>
				</div>
				<div class="stat-icon bg-violet-500/10">
					<ClipboardList class="w-7 h-7 text-violet-400" />
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-400">Showing</p>
					<p class="text-2xl font-bold text-white mt-1">{data.users.length} users</p>
				</div>
				<div class="stat-icon bg-emerald-500/10">
					<Check class="w-7 h-7 text-emerald-400" />
				</div>
			</div>
		</div>
	</div>

	<!-- Users Table -->
	<div class="card !p-0 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead class="table-header">
					<tr>
						<th class="table-th">User</th>
						<th class="table-th">Type</th>
						<th class="table-th">Status</th>
						<th class="table-th">Points</th>
						<th class="table-th">Joined</th>
						<th class="table-th">Last Login</th>
						<th class="table-th text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if data.users.length > 0}
						{#each data.users as user}
							<tr class="table-row">
								<td class="table-td whitespace-nowrap">
									<div>
										<div class="font-medium text-white">{user.name}</div>
										<div class="text-sm text-neutral-500">{user.email}</div>
										<div class="text-xs text-neutral-600 font-mono">{user.id.slice(0, 8)}</div>
									</div>
								</td>
								<td class="table-td whitespace-nowrap">
									<span class="px-2 py-1 text-xs font-medium rounded-full {getUserTypeColor(user.userType)}">
										{user.userType}
									</span>
								</td>
								<td class="table-td whitespace-nowrap">
									<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(user.isActive)}">
										{user.isActive ? 'Active' : 'Inactive'}
									</span>
									{#if user.emailVerified}
										<span class="ml-1 text-emerald-400" title="Email verified">&#10003;</span>
									{/if}
								</td>
								<td class="table-td whitespace-nowrap">
									{#if user.panelistStats}
										<div>
											<div class="font-medium text-white">{((user.panelistStats.currentPoints) || 0).toLocaleString()}</div>
											<div class="text-xs text-neutral-500">
												{(user.panelistStats.currentPoints || 0).toLocaleString()} available
											</div>
										</div>
									{:else}
										<span class="text-neutral-600">N/A</span>
									{/if}
								</td>
								<td class="table-td whitespace-nowrap">
									{formatDate(user.createdAt)}
								</td>
								<td class="table-td whitespace-nowrap">
									{formatDate(user.lastLoginAt)}
								</td>
								<td class="table-td whitespace-nowrap text-right text-sm font-medium">
									<a
										href="/admin/users/{user.id}"
										class="text-primary-400 hover:text-primary-300 mr-3"
										title="View full profile"
									>
										View
									</a>
									<button
										class="text-rose-400 hover:text-rose-300"
										title="Deactivate user"
									>
										{user.isActive ? 'Deactivate' : 'Activate'}
									</button>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-neutral-500">
								<Users class="mx-auto h-12 w-12 text-neutral-600" />
								<p class="mt-4 text-lg font-medium text-neutral-400">No users found</p>
								<p class="mt-2">Try adjusting your search or filter criteria</p>
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
					({data.pagination.total} total users)
				</div>
				<div class="flex gap-2">
					{#if data.pagination.page > 1}
						<a
							href="/admin/users?page={data.pagination.page - 1}{data.filters.search ? `&search=${data.filters.search}` : ''}{data.filters.userType !== 'all' ? `&type=${data.filters.userType}` : ''}"
							class="btn-secondary text-sm"
						>
							Previous
						</a>
					{/if}
					{#if data.pagination.page < data.pagination.totalPages}
						<a
							href="/admin/users?page={data.pagination.page + 1}{data.filters.search ? `&search=${data.filters.search}` : ''}{data.filters.userType !== 'all' ? `&type=${data.filters.userType}` : ''}"
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
