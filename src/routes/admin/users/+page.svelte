<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let searchInput = $state(data.filters.search);
	let userTypeFilter = $state(data.filters.userType);

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
				return 'bg-purple-100 text-purple-700';
			case 'panelist':
				return 'bg-blue-100 text-blue-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function getStatusColor(isActive: boolean) {
		return isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
	}
</script>

<svelte:head>
	<title>Manage Users - Admin Panel</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">User Management</h1>
		<p class="text-gray-600 mt-2">Manage all users in the system</p>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Search -->
			<div class="md:col-span-2">
				<label for="search" class="block text-sm font-medium text-gray-700 mb-2">
					Search Users
				</label>
				<div class="flex gap-2">
					<input
						id="search"
						type="text"
						bind:value={searchInput}
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
						placeholder="Search by name or email..."
						class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					/>
					<button
						onclick={handleSearch}
						class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
					>
						Search
					</button>
				</div>
			</div>

			<!-- User Type Filter -->
			<div>
				<label for="userType" class="block text-sm font-medium text-gray-700 mb-2">
					User Type
				</label>
				<select
					id="userType"
					bind:value={userTypeFilter}
					onchange={handleFilterChange}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				>
					<option value="all">All Users</option>
					<option value="panelist">Panelists</option>
					<option value="admin">Admins</option>
				</select>
			</div>
		</div>

		{#if data.filters.search || data.filters.userType !== 'all'}
			<div class="mt-4 flex items-center gap-2">
				<span class="text-sm text-gray-600">Active filters:</span>
				{#if data.filters.search}
					<span class="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
						Search: {data.filters.search}
						<button
							onclick={() => {
								searchInput = '';
								handleSearch();
							}}
							class="hover:text-primary-900"
						>
							×
						</button>
					</span>
				{/if}
				{#if data.filters.userType !== 'all'}
					<span class="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
						Type: {data.filters.userType}
						<button
							onclick={() => {
								userTypeFilter = 'all';
								handleFilterChange();
							}}
							class="hover:text-primary-900"
						>
							×
						</button>
					</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Stats Summary -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Users</p>
					<p class="text-2xl font-bold text-gray-900 mt-1">{data.pagination.total}</p>
				</div>
				<div class="bg-blue-100 rounded-full p-3">
					<svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Current Page</p>
					<p class="text-2xl font-bold text-gray-900 mt-1">
						{data.pagination.page} / {data.pagination.totalPages}
					</p>
				</div>
				<div class="bg-purple-100 rounded-full p-3">
					<svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Showing</p>
					<p class="text-2xl font-bold text-gray-900 mt-1">{data.users.length} users</p>
				</div>
				<div class="bg-green-100 rounded-full p-3">
					<svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Users Table -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							User
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Type
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Points
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Joined
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Last Login
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#if data.users.length > 0}
						{#each data.users as user}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div>
										<div class="font-medium text-gray-900">{user.name}</div>
										<div class="text-sm text-gray-500">{user.email}</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="px-2 py-1 text-xs font-medium rounded-full {getUserTypeColor(user.userType)}">
										{user.userType}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(user.isActive)}">
										{user.isActive ? 'Active' : 'Inactive'}
									</span>
									{#if user.emailVerified}
										<span class="ml-1 text-green-600" title="Email verified">✓</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{#if user.panelistStats}
										<div>
											<div class="font-medium">{((user.panelistStats.currentPoints + user.panelistStats.pendingPoints) || 0).toLocaleString()}</div>
											<div class="text-xs text-gray-500">
												{(user.panelistStats.currentPoints || 0).toLocaleString()} available
											</div>
										</div>
									{:else}
										<span class="text-gray-400">N/A</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(user.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(user.lastLoginAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<button
										class="text-primary-600 hover:text-primary-900 mr-3"
										title="View details"
									>
										View
									</button>
									<button
										class="text-red-600 hover:text-red-900"
										title="Deactivate user"
									>
										{user.isActive ? 'Deactivate' : 'Activate'}
									</button>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-gray-500">
								<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
								<p class="mt-4 text-lg font-medium">No users found</p>
								<p class="mt-2">Try adjusting your search or filter criteria</p>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.pagination.totalPages > 1}
			<div class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
				<div class="text-sm text-gray-700">
					Showing page {data.pagination.page} of {data.pagination.totalPages}
					({data.pagination.total} total users)
				</div>
				<div class="flex gap-2">
					{#if data.pagination.page > 1}
						<a
							href="/admin/users?page={data.pagination.page - 1}{data.filters.search ? `&search=${data.filters.search}` : ''}{data.filters.userType !== 'all' ? `&type=${data.filters.userType}` : ''}"
							class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Previous
						</a>
					{/if}
					{#if data.pagination.page < data.pagination.totalPages}
						<a
							href="/admin/users?page={data.pagination.page + 1}{data.filters.search ? `&search=${data.filters.search}` : ''}{data.filters.userType !== 'all' ? `&type=${data.filters.userType}` : ''}"
							class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Next
						</a>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
