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
				return 'bg-violet-100 text-violet-700';
			case 'panelist':
				return 'bg-blue-100 text-blue-700';
			default:
				return 'bg-neutral-100 text-neutral-700';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'bg-emerald-100 text-emerald-700';
			case 'in-progress':
				return 'bg-amber-100 text-amber-700';
			case 'abandoned':
				return 'bg-rose-100 text-rose-700';
			default:
				return 'bg-neutral-100 text-neutral-700';
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard - QSurvey Panel</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
		<p class="text-neutral-600 mt-2">System overview and statistics</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<!-- Total Users -->
		<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-600">Total Users</p>
					<p class="text-3xl font-bold text-neutral-900 mt-2">{data.stats.totalUsers}</p>
				</div>
				<div class="bg-blue-100 rounded-xl p-3">
					<svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
						/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-emerald-600 mt-2">
				+{data.stats.newUsersLast30Days} in last 30 days
			</p>
		</div>

		<!-- Total Panelists -->
		<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-600">Panelists</p>
					<p class="text-3xl font-bold text-neutral-900 mt-2">{data.stats.totalPanelists}</p>
				</div>
				<div class="bg-emerald-100 rounded-xl p-3">
					<svg class="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
						/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-neutral-500 mt-2">
				{((data.stats.totalPanelists / data.stats.totalUsers) * 100).toFixed(1)}% of users
			</p>
		</div>

		<!-- Survey Responses -->
		<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-600">Survey Responses</p>
					<p class="text-3xl font-bold text-neutral-900 mt-2">{data.stats.totalResponses}</p>
				</div>
				<div class="bg-violet-100 rounded-xl p-3">
					<svg class="w-6 h-6 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
						/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-neutral-500 mt-2">
				Avg {data.stats.totalPanelists > 0
					? (data.stats.totalResponses / data.stats.totalPanelists).toFixed(1)
					: '0'} per panelist
			</p>
		</div>

		<!-- Points Awarded -->
		<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-neutral-600">Points Awarded</p>
					<p class="text-3xl font-bold text-neutral-900 mt-2">
						{data.stats.totalPointsAwarded.toLocaleString()}
					</p>
				</div>
				<div class="bg-amber-100 rounded-xl p-3">
					<svg class="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
						/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-neutral-500 mt-2">
				Active sessions: {data.stats.activeSessions}
			</p>
		</div>
	</div>

	<!-- Email Conversions Stats -->
	<div
		class="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-8 text-white"
	>
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm font-medium text-white/80">Email Conversions</p>
				<p class="text-4xl font-bold mt-2">{data.stats.totalConversions}</p>
				<p class="text-sm text-white/80 mt-2">Visitors who submitted their email</p>
			</div>
			<div class="bg-white/20 rounded-xl p-4">
				<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
					/>
				</svg>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Recent Users -->
		<div class="bg-white rounded-xl shadow-sm border border-neutral-200">
			<div class="px-6 py-4 border-b border-neutral-200">
				<h2 class="text-lg font-semibold text-neutral-900">Recent Users</h2>
			</div>
			<div class="p-6">
				{#if data.recentUsers.length > 0}
					<div class="space-y-4">
						{#each data.recentUsers as user}
							<div class="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<p class="font-semibold text-neutral-900">{user.name}</p>
										<span
											class="px-2 py-1 text-xs font-medium rounded-full {getUserTypeColor(
												user.userType
											)}"
										>
											{user.userType}
										</span>
									</div>
									<p class="text-sm text-neutral-600 mt-1">{user.email}</p>
									<p class="text-xs text-neutral-500 mt-1">{formatDate(user.createdAt)}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-center text-neutral-500 py-8">No users yet</p>
				{/if}
			</div>
		</div>

		<!-- Recent Survey Responses -->
		<div class="bg-white rounded-xl shadow-sm border border-neutral-200">
			<div class="px-6 py-4 border-b border-neutral-200">
				<h2 class="text-lg font-semibold text-neutral-900">Recent Survey Responses</h2>
			</div>
			<div class="p-6">
				{#if data.recentResponses.length > 0}
					<div class="space-y-4">
						{#each data.recentResponses as response}
							<div class="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<p class="font-semibold text-neutral-900">Survey #{response.surveyId}</p>
										<span
											class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(
												response.status
											)}"
										>
											{response.status}
										</span>
									</div>
									<p class="text-sm text-neutral-600 mt-1">Panelist: {response.panelistId}</p>
									<p class="text-xs text-neutral-500 mt-1">
										{response.completedAt
											? `Completed: ${formatDate(response.completedAt)}`
											: `Started: ${formatDate(response.createdAt)}`}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-center text-neutral-500 py-8">No survey responses yet</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Recent Email Conversions -->
	<div class="mt-8 bg-white rounded-xl shadow-sm border border-neutral-200">
	<div class="px-6 py-4 border-b border-neutral-200">
		<h2 class="text-lg font-semibold text-neutral-900">Recent Email Conversions</h2>
	</div>
	<div class="p-6">
		{#if data.recentConversions && data.recentConversions.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-neutral-200">
					<thead>
						<tr>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
								>Email</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
								>Source</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
								>Time to Convert</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
								>Converted At</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-neutral-200">
						{#each data.recentConversions || [] as conversion}
							<tr class="hover:bg-neutral-50">
								<td class="px-4 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div
											class="flex-shrink-0 h-8 w-8 bg-violet-100 rounded-full flex items-center justify-center"
										>
											<svg class="h-4 w-4 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
												<path
													d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
												/>
											</svg>
										</div>
										<div class="ml-3">
											<p class="text-sm font-medium text-neutral-900">{conversion.email}</p>
											<p class="text-xs text-neutral-500">
												Visitor: {conversion.visitorId.substring(0, 12)}...
											</p>
										</div>
									</div>
								</td>
								<td class="px-4 py-4 whitespace-nowrap">
									{#if conversion.utmSource || conversion.utmMedium}
										<div class="text-sm text-neutral-900">
											{conversion.utmSource || 'Direct'}
											{conversion.utmMedium ? `/ ${conversion.utmMedium}` : ''}
										</div>
										{#if conversion.utmCampaign}
											<div class="text-xs text-neutral-500">{conversion.utmCampaign}</div>
										{/if}
									{:else}
										<span class="text-sm text-neutral-500">Direct</span>
									{/if}
								</td>
								<td class="px-4 py-4 whitespace-nowrap">
									{#if conversion.timeToConvertSeconds !== null}
										<span class="text-sm text-neutral-900">
											{Math.floor(conversion.timeToConvertSeconds / 60)}m {conversion.timeToConvertSeconds %
												60}s
										</span>
									{:else}
										<span class="text-sm text-neutral-500">N/A</span>
									{/if}
								</td>
								<td class="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">
									{formatDate(conversion.convertedAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-center text-neutral-500 py-8">No email conversions yet</p>
		{/if}
	</div>
</div>

<!-- Quick Actions -->
<div class="mt-8 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
	<h2 class="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<a
			href="/admin/users"
			class="flex items-center gap-3 p-4 border-2 border-neutral-200 rounded-xl hover:border-violet-500 hover:bg-violet-50 transition-colors"
		>
			<svg class="w-6 h-6 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
				/>
			</svg>
			<div>
				<p class="font-semibold text-neutral-900">Manage Users</p>
				<p class="text-sm text-neutral-600">View and manage all users</p>
			</div>
		</a>

		<a
			href="/admin/surveys"
			class="flex items-center gap-3 p-4 border-2 border-neutral-200 rounded-xl hover:border-violet-500 hover:bg-violet-50 transition-colors"
		>
			<svg class="w-6 h-6 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
				/>
			</svg>
			<div>
				<p class="font-semibold text-neutral-900">Manage Surveys</p>
				<p class="text-sm text-neutral-600">Create and manage surveys</p>
			</div>
		</a>

		<a
			href="/admin/analytics"
			class="flex items-center gap-3 p-4 border-2 border-neutral-200 rounded-xl hover:border-violet-500 hover:bg-violet-50 transition-colors"
		>
			<svg class="w-6 h-6 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
				/>
			</svg>
			<div>
				<p class="font-semibold text-neutral-900">View Analytics</p>
				<p class="text-sm text-neutral-600">Traffic and conversion data</p>
			</div>
		</a>

		<a
			href="/admin/settings"
			class="flex items-center gap-3 p-4 border-2 border-neutral-200 rounded-xl hover:border-violet-500 hover:bg-violet-50 transition-colors"
		>
			<svg class="w-6 h-6 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
				/>
			</svg>
			<div>
				<p class="font-semibold text-neutral-900">Settings</p>
				<p class="text-sm text-neutral-600">Configure landing page redirects</p>
			</div>
		</a>
	</div>
</div>
</div>
