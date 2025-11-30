<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(dateString: string | Date | null) {
		if (!dateString) return 'N/A';
		const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
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

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-700';
			case 'in-progress':
				return 'bg-yellow-100 text-yellow-700';
			case 'abandoned':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard - QSurvey Panel</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
		<p class="text-gray-600 mt-2">System overview and statistics</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<!-- Total Users -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Users</p>
					<p class="text-3xl font-bold text-gray-900 mt-2">{data.stats.totalUsers}</p>
				</div>
				<div class="bg-blue-100 rounded-full p-3">
					<svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-green-600 mt-2">
				+{data.stats.newUsersLast30Days} in last 30 days
			</p>
		</div>

		<!-- Total Panelists -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Panelists</p>
					<p class="text-3xl font-bold text-gray-900 mt-2">{data.stats.totalPanelists}</p>
				</div>
				<div class="bg-green-100 rounded-full p-3">
					<svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-gray-500 mt-2">
				{((data.stats.totalPanelists / data.stats.totalUsers) * 100).toFixed(1)}% of users
			</p>
		</div>

		<!-- Survey Responses -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Survey Responses</p>
					<p class="text-3xl font-bold text-gray-900 mt-2">{data.stats.totalResponses}</p>
				</div>
				<div class="bg-purple-100 rounded-full p-3">
					<svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-gray-500 mt-2">
				Avg {data.stats.totalPanelists > 0 ? (data.stats.totalResponses / data.stats.totalPanelists).toFixed(1) : '0'} per panelist
			</p>
		</div>

		<!-- Points Awarded -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Points Awarded</p>
					<p class="text-3xl font-bold text-gray-900 mt-2">{data.stats.totalPointsAwarded.toLocaleString()}</p>
				</div>
				<div class="bg-yellow-100 rounded-full p-3">
					<svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-gray-500 mt-2">
				Active sessions: {data.stats.activeSessions}
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Recent Users -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Recent Users</h2>
			</div>
			<div class="p-6">
				{#if data.recentUsers.length > 0}
					<div class="space-y-4">
						{#each data.recentUsers as user}
							<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<p class="font-semibold text-gray-900">{user.name}</p>
										<span class="px-2 py-1 text-xs font-medium rounded-full {getUserTypeColor(user.userType)}">
											{user.userType}
										</span>
									</div>
									<p class="text-sm text-gray-600 mt-1">{user.email}</p>
									<p class="text-xs text-gray-500 mt-1">{formatDate(user.createdAt)}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-center text-gray-500 py-8">No users yet</p>
				{/if}
			</div>
		</div>

		<!-- Recent Survey Responses -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Recent Survey Responses</h2>
			</div>
			<div class="p-6">
				{#if data.recentResponses.length > 0}
					<div class="space-y-4">
						{#each data.recentResponses as response}
							<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<p class="font-semibold text-gray-900">Survey #{response.surveyId}</p>
										<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(response.status)}">
											{response.status}
										</span>
									</div>
									<p class="text-sm text-gray-600 mt-1">Panelist: {response.panelistId}</p>
									<p class="text-xs text-gray-500 mt-1">
										{response.completedAt ? `Completed: ${formatDate(response.completedAt)}` : `Started: ${formatDate(response.createdAt)}`}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-center text-gray-500 py-8">No survey responses yet</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<a
				href="/admin/users"
				class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
			>
				<svg class="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
				</svg>
				<div>
					<p class="font-semibold text-gray-900">Manage Users</p>
					<p class="text-sm text-gray-600">View and manage all users</p>
				</div>
			</a>

			<a
				href="/admin/surveys"
				class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
			>
				<svg class="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
					<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
				</svg>
				<div>
					<p class="font-semibold text-gray-900">Manage Surveys</p>
					<p class="text-sm text-gray-600">Create and manage surveys</p>
				</div>
			</a>

			<a
				href="/admin/analytics"
				class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
			>
				<svg class="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
					<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
				</svg>
				<div>
					<p class="font-semibold text-gray-900">View Analytics</p>
					<p class="text-sm text-gray-600">Traffic and conversion data</p>
				</div>
			</a>
		</div>
	</div>
</div>
