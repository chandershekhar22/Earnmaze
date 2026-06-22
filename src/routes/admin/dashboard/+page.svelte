<script lang="ts">
	import type { PageData } from './$types';
	import { User, Users, ClipboardList, Star, Mail, BarChart2, Settings, Coins, HelpCircle, Gift, ArrowRight, MessageSquareText, ArrowLeftRight, Globe, Share2, Sparkles, Flame, Brain, Trophy, Tag, Gamepad2 } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	function formatDate(dateString: string | Date | null) {
		if (!dateString) return 'N/A';
		const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function getUserTypeColor(userType: string) {
		switch (userType) {
			case 'admin': return 'badge-primary';
			case 'panelist': return 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20';
			default: return 'badge-neutral';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed': return 'badge-success';
			case 'started': return 'badge-primary';
			case 'terminated': return 'badge-warning';
			case 'disqualified': case 'quota_full': return 'badge-danger';
			default: return 'badge-neutral';
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard - EarnMaze</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-white">Dashboard</h1>
		<p class="text-sm text-neutral-500 mt-1">System overview</p>
	</div>

	<!-- Stats Grid — all clickable -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
		<a href="/admin/users" class="card group hover:border-blue-500/20 transition-all">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs font-bold text-neutral-500 uppercase tracking-widest">Users</p>
					<p class="text-2xl font-black text-white mt-1">{data.stats.totalUsers}</p>
					<p class="text-[10px] text-emerald-400 font-semibold mt-1">+{data.stats.newUsersLast30Days} last 30d</p>
				</div>
				<div class="p-2.5 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
					<User class="w-5 h-5 text-blue-400" />
				</div>
			</div>
		</a>

		<a href="/admin/users?type=panelist" class="card group hover:border-emerald-500/20 transition-all">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs font-bold text-neutral-500 uppercase tracking-widest">Panelists</p>
					<p class="text-2xl font-black text-white mt-1">{data.stats.totalPanelists}</p>
					<p class="text-[10px] text-neutral-600 mt-1">{data.stats.totalUsers > 0 ? ((data.stats.totalPanelists / data.stats.totalUsers) * 100).toFixed(0) : 0}% of users</p>
				</div>
				<div class="p-2.5 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
					<Users class="w-5 h-5 text-emerald-400" />
				</div>
			</div>
		</a>

		<a href="/admin/responses" class="card group hover:border-violet-500/20 transition-all">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs font-bold text-neutral-500 uppercase tracking-widest">Responses</p>
					<p class="text-2xl font-black text-white mt-1">{data.stats.totalResponses}</p>
					<p class="text-[10px] text-neutral-600 mt-1">
						Avg {data.stats.totalPanelists > 0 ? (data.stats.totalResponses / data.stats.totalPanelists).toFixed(1) : '0'}/user
					</p>
				</div>
				<div class="p-2.5 bg-violet-500/10 rounded-xl group-hover:scale-110 transition-transform">
					<ClipboardList class="w-5 h-5 text-violet-400" />
				</div>
			</div>
		</a>

		<a href="/admin/transactions" class="card group hover:border-amber-500/20 transition-all">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs font-bold text-neutral-500 uppercase tracking-widest">Points</p>
					<p class="text-2xl font-black text-white mt-1">{data.stats.totalPointsAwarded.toLocaleString()}</p>
					<p class="text-[10px] text-neutral-600 mt-1">{data.stats.activeSessions} active sessions</p>
				</div>
				<div class="p-2.5 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform">
					<Star class="w-5 h-5 text-amber-400" />
				</div>
			</div>
		</a>
	</div>

	<!-- Email Conversions Banner — clickable -->
	<a href="/admin/analytics" class="block bg-gradient-to-r from-violet-600/80 to-indigo-600/80 rounded-2xl p-5 mb-6 group hover:from-violet-600 hover:to-indigo-600 transition-all">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-xs font-bold text-white/60 uppercase tracking-widest">Email Conversions</p>
				<p class="text-3xl font-black text-white mt-1">{data.stats.totalConversions}</p>
				<p class="text-xs text-white/50 mt-1">Visitors who submitted email</p>
			</div>
			<div class="p-3 bg-white/15 rounded-xl group-hover:scale-110 transition-transform">
				<Mail class="w-6 h-6 text-white" />
			</div>
		</div>
	</a>

	<!-- Referral Stats -->
	<div class="card mb-6">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-2">
				<Share2 class="w-4 h-4 text-fuchsia-400" />
				<h2 class="text-sm font-bold text-white">Referral Program</h2>
			</div>
		</div>
		<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
			<div class="bg-surface-200 rounded-xl p-3">
				<div class="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total</div>
				<div class="text-xl font-black text-white mt-1">{data.stats.totalReferrals}</div>
			</div>
			<div class="bg-surface-200 rounded-xl p-3">
				<div class="text-[10px] font-bold text-amber-400/50 uppercase tracking-widest">Pending</div>
				<div class="text-xl font-black text-amber-400 mt-1">{data.stats.pendingReferrals}</div>
			</div>
			<div class="bg-surface-200 rounded-xl p-3">
				<div class="text-[10px] font-bold text-sky-400/50 uppercase tracking-widest">Qualified</div>
				<div class="text-xl font-black text-sky-400 mt-1">{data.stats.qualifiedReferrals}</div>
			</div>
			<div class="bg-surface-200 rounded-xl p-3">
				<div class="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest">Paid</div>
				<div class="text-xl font-black text-emerald-400 mt-1">{data.stats.paidReferrals}</div>
			</div>
			<div class="bg-surface-200 rounded-xl p-3">
				<div class="text-[10px] font-bold text-violet-400/50 uppercase tracking-widest">Bonus Paid</div>
				<div class="text-xl font-black text-violet-400 mt-1">{data.stats.referralBonusPaid.toLocaleString()}</div>
				<div class="text-[10px] text-neutral-600 mt-0.5">pts</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
		<!-- Recent Users — rows clickable -->
		<div class="card !p-0 overflow-hidden">
			<div class="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
				<h2 class="text-sm font-bold text-white">Recent Users</h2>
				<a href="/admin/users" class="text-[10px] font-bold text-primary-400 hover:text-primary-300 uppercase tracking-wider flex items-center gap-1 transition-colors">
					All <ArrowRight class="w-3 h-3 rtl:-scale-x-100" />
				</a>
			</div>
			{#if data.recentUsers.length > 0}
				<div class="divide-y divide-white/[0.04]">
					{#each data.recentUsers as user}
						<a href="/admin/users/{user.id}" class="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-sm font-semibold text-white truncate">{user.name || '--'}</span>
									<span class="badge {getUserTypeColor(user.userType)} text-[10px]">{user.userType}</span>
								</div>
								<p class="text-[10px] text-neutral-600 mt-0.5">{user.email}</p>
							</div>
							<span class="text-[10px] text-neutral-600 flex-shrink-0">{formatDate(user.createdAt)}</span>
						</a>
					{/each}
				</div>
			{:else}
				<p class="text-center text-neutral-600 py-8 text-sm">No users yet</p>
			{/if}
		</div>

		<!-- Recent Survey Responses — rows clickable -->
		<div class="card !p-0 overflow-hidden">
			<div class="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
				<h2 class="text-sm font-bold text-white">Recent Responses</h2>
				<a href="/admin/responses" class="text-[10px] font-bold text-primary-400 hover:text-primary-300 uppercase tracking-wider flex items-center gap-1 transition-colors">
					All <ArrowRight class="w-3 h-3 rtl:-scale-x-100" />
				</a>
			</div>
			{#if data.recentResponses.length > 0}
				<div class="divide-y divide-white/[0.04]">
					{#each data.recentResponses as response}
						<a href="/admin/users/{response.panelistId}" class="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-white">Survey {response.surveyId?.slice(0, 8)}...</span>
									<span class="badge {getStatusColor(response.status)} text-[10px]">{response.status}</span>
								</div>
								<p class="text-[10px] text-neutral-600 mt-0.5">
									{response.completedAt ? `Completed ${formatDate(response.completedAt)}` : `Started ${formatDate(response.createdAt)}`}
								</p>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<p class="text-center text-neutral-600 py-8 text-sm">No responses yet</p>
			{/if}
		</div>
	</div>

	<!-- Recent Conversions -->
	{#if data.recentConversions && data.recentConversions.length > 0}
		<div class="card !p-0 overflow-hidden mb-6">
			<div class="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
				<h2 class="text-sm font-bold text-white">Recent Conversions</h2>
				<a href="/admin/analytics" class="text-[10px] font-bold text-primary-400 hover:text-primary-300 uppercase tracking-wider flex items-center gap-1 transition-colors">
					All <ArrowRight class="w-3 h-3 rtl:-scale-x-100" />
				</a>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full">
					<thead><tr class="table-header">
						<th class="table-th">Email</th>
						<th class="table-th">Source</th>
						<th class="table-th">Time</th>
						<th class="table-th">Date</th>
					</tr></thead>
					<tbody>
						{#each data.recentConversions as c}
							<tr class="table-row">
								<td class="table-td text-sm text-white">{c.email}</td>
								<td class="table-td text-xs text-neutral-500">{c.utmSource || 'Direct'}{c.utmMedium ? ` / ${c.utmMedium}` : ''}</td>
								<td class="table-td text-xs text-neutral-500">
									{c.timeToConvertSeconds != null ? `${Math.floor(c.timeToConvertSeconds / 60)}m ${c.timeToConvertSeconds % 60}s` : '--'}
								</td>
								<td class="table-td text-xs text-neutral-600">{formatDate(c.convertedAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Quick Actions Grid -->
	<div>
		<h2 class="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Quick Actions</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2.5">
			{#each [
				{ href: '/admin/users', icon: User, label: 'Users', color: 'blue' },
				{ href: '/admin/surveys', icon: ClipboardList, label: 'Surveys', color: 'violet' },
				{ href: '/admin/responses', icon: MessageSquareText, label: 'Responses', color: 'emerald' },
				{ href: '/admin/rewards', icon: Gift, label: 'Rewards', color: 'pink' },
				{ href: '/admin/points', icon: Coins, label: 'Points', color: 'amber' },
				{ href: '/admin/transactions', icon: ArrowLeftRight, label: 'Transactions', color: 'cyan' },
				{ href: '/admin/support', icon: HelpCircle, label: 'Support', color: 'fuchsia' },
				{ href: '/admin/analytics', icon: BarChart2, label: 'Analytics', color: 'indigo' },
				{ href: '/admin/geo-settings', icon: Globe, label: 'Geo Settings', color: 'teal' },
				{ href: '/admin/artifacts', icon: Sparkles, label: 'Artifacts', color: 'green' },
				{ href: '/admin/games', icon: Gamepad2, label: 'Games', color: 'rose' },
				{ href: '/admin/uploads/streaks', icon: Flame, label: 'Streaks', color: 'orange' },
				{ href: '/admin/uploads/quizzes', icon: Brain, label: 'Quizzes', color: 'purple' },
				{ href: '/admin/uploads/weekly-challenges', icon: Trophy, label: 'Weekly Challenges', color: 'yellow' },
				{ href: '/admin/uploads/exclusive-deals', icon: Tag, label: 'Exclusive Deals', color: 'sky' },
				{ href: '/admin/settings', icon: Settings, label: 'Settings', color: 'neutral' },
			] as item}
				<a
					href={item.href}
					class="group flex items-center gap-3 p-3 bg-surface-100 border border-white/[0.06] rounded-xl hover:border-{item.color}-500/20 hover:bg-surface-200 transition-all"
				>
					<div class="p-2 bg-{item.color}-500/10 rounded-lg group-hover:scale-110 transition-transform">
						<item.icon class="w-4 h-4 text-{item.color}-400" />
					</div>
					<span class="text-sm font-semibold text-white">{item.label}</span>
				</a>
			{/each}
		</div>
	</div>
</div>
