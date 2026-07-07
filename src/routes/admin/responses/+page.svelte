<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import {
		ClipboardList, ArrowLeft, ArrowRight, CircleCheckBig, CircleX,
		Clock, Zap, AlertTriangle, ExternalLink, User, ChevronDown, ChevronUp, Coins, Link, Eye
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let statusFilter = $state(data.filters.status);
	let surveyFilter = $state(data.filters.survey);
	let expandedId = $state<number | null>(null);

	function applyFilters() {
		const params = new URLSearchParams();
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (surveyFilter !== 'all') params.set('survey', surveyFilter);
		goto(`/admin/responses?${params.toString()}`);
	}

	function formatDate(d: string | null) {
		if (!d) return '--';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function duration(start: string, end: string | null) {
		if (!end) return '--';
		const ms = new Date(end).getTime() - new Date(start).getTime();
		const min = Math.floor(ms / 60000);
		if (min < 1) return '<1m';
		return `${min}m`;
	}

	function getStatusStyle(status: string) {
		switch (status) {
			case 'completed': return { class: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20', icon: CircleCheckBig };
			case 'started': return { class: 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/20', icon: Clock };
			case 'terminated': return { class: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20', icon: Zap };
			case 'quota_full': return { class: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/20', icon: AlertTriangle };
			case 'disqualified': return { class: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20', icon: CircleX };
			default: return { class: 'bg-white/5 text-neutral-400 ring-1 ring-white/10', icon: Clock };
		}
	}
</script>

<svelte:head>
	<title>Survey Responses - Admin</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-white">Survey Responses</h1>
			<p class="text-sm text-neutral-500 mt-1">{data.pagination.total} total responses</p>
		</div>

		<!-- Filters -->
		<div class="flex items-center gap-2 flex-wrap">
			<select bind:value={statusFilter} onchange={applyFilters} class="select !py-2 !text-xs !w-auto">
				<option value="all">All Status ({data.statusCounts.all ?? 0})</option>
				<option value="completed">Completed ({data.statusCounts.completed ?? 0})</option>
				<option value="started">Started ({data.statusCounts.started ?? 0})</option>
				<option value="terminated">Terminated ({data.statusCounts.terminated ?? 0})</option>
				<option value="quota_full">Quota Full ({data.statusCounts.quota_full ?? 0})</option>
				<option value="disqualified">Disqualified ({data.statusCounts.disqualified ?? 0})</option>
			</select>
			<select bind:value={surveyFilter} onchange={applyFilters} class="select !py-2 !text-xs !w-auto max-w-[200px]">
				<option value="all">All Surveys</option>
				{#each data.surveys as s}
					<option value={s.id}>{s.title?.slice(0, 40) || s.id.slice(0, 8)}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Status Summary -->
	<div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
		{#each [
			{ key: 'completed', label: 'Completed', color: 'emerald' },
			{ key: 'started', label: 'Started', color: 'violet' },
			{ key: 'terminated', label: 'Terminated', color: 'amber' },
			{ key: 'quota_full', label: 'Quota Full', color: 'sky' },
			{ key: 'disqualified', label: 'Disqualified', color: 'rose' },
		] as item}
			<button
				onclick={() => { statusFilter = statusFilter === item.key ? 'all' : item.key; applyFilters(); }}
				class="bg-surface-100 border rounded-xl p-3 text-center transition-all {statusFilter === item.key ? `border-${item.color}-500/30 ring-1 ring-${item.color}-500/20` : 'border-white/[0.06] hover:border-white/[0.1]'}"
			>
				<div class="text-lg font-black text-{item.color}-400">{data.statusCounts[item.key] ?? 0}</div>
				<div class="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5">{item.label}</div>
			</button>
		{/each}
	</div>

	<!-- Table -->
	<div class="card !p-0 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="table-header">
						<th class="table-th">Panelist</th>
						<th class="table-th">Survey</th>
						<th class="table-th">Status</th>
						<th class="table-th text-end">Points</th>
						<th class="table-th">Duration</th>
						<th class="table-th">Started</th>
						<th class="table-th">Completed</th>
						<th class="table-th"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.responses as r}
						{@const ss = getStatusStyle(r.status)}
						<tr class="table-row cursor-pointer hover:bg-white/[0.02]" onclick={() => expandedId = expandedId === r.id ? null : r.id}>
							<td class="table-td">
								<a href="/admin/users/{r.panelistId}" onclick={(e) => e.stopPropagation()} class="hover:text-primary-400 transition-colors">
									<div class="text-sm font-medium text-white">{r.panelistName || '--'}</div>
									<div class="text-[10px] text-neutral-600">{r.panelistEmail}</div>
								</a>
							</td>
							<td class="table-td">
								<div class="text-sm text-neutral-300 max-w-[180px] truncate">{r.surveyTitle || '--'}</div>
								<div class="text-[10px] text-neutral-700">{r.surveyPoints ?? 0} pts</div>
							</td>
							<td class="table-td">
								<span class="badge {ss.class} text-[10px]">
									<ss.icon class="w-3 h-3" />
									{r.status.replace('_', ' ')}
								</span>
							</td>
							<td class="table-td text-end">
								{#if r.awardedPoints && r.awardedPoints > 0}
									<span class="font-bold text-emerald-400">+{r.awardedPoints}</span>
								{:else}
									<span class="text-neutral-600">0</span>
								{/if}
							</td>
							<td class="table-td text-sm text-neutral-500">{duration(r.startedAt, r.completedAt)}</td>
							<td class="table-td text-xs text-neutral-500 whitespace-nowrap">{formatDate(r.startedAt)}</td>
							<td class="table-td text-xs text-neutral-500 whitespace-nowrap">{formatDate(r.completedAt)}</td>
							<td class="table-td text-neutral-600">
								{#if expandedId === r.id}<ChevronUp class="w-3.5 h-3.5" />{:else}<ChevronDown class="w-3.5 h-3.5" />{/if}
							</td>
						</tr>

						<!-- Expanded Detail -->
						{#if expandedId === r.id}
							<tr>
								<td colspan="8" class="px-0 py-0">
									<div class="bg-surface-50 border-y border-white/[0.04] px-6 py-5 animate-fade-in">
										<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
											<!-- Survey Details -->
											<div class="bg-surface-100 rounded-xl p-3 border border-white/[0.06]">
												<div class="flex items-center gap-1.5 mb-1">
													<ClipboardList class="w-3 h-3 text-violet-400" />
													<span class="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Survey</span>
												</div>
												<div class="text-sm font-semibold text-white truncate">{r.surveyTitle || '--'}</div>
												<div class="text-[10px] text-neutral-600 mt-0.5">
													{r.surveyIsActive ? 'Active' : 'Inactive'}
												</div>
											</div>

											<!-- Points Config -->
											<div class="bg-surface-100 rounded-xl p-3 border border-white/[0.06]">
												<div class="flex items-center gap-1.5 mb-1">
													<Coins class="w-3 h-3 text-emerald-400" />
													<span class="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Points Config</span>
												</div>
												<div class="text-xs text-neutral-300 space-y-0.5">
													<div>Complete: <span class="font-bold text-white">{r.surveyPoints}</span></div>
													<div>Terminated: <span class="font-bold text-white">{r.surveyTerminatedPoints ?? 0}</span></div>
													<div>Quota Full: <span class="font-bold text-white">{r.surveyQuotaFullPoints ?? 0}</span></div>
												</div>
											</div>

											<!-- Response Details -->
											<div class="bg-surface-100 rounded-xl p-3 border border-white/[0.06]">
												<div class="flex items-center gap-1.5 mb-1">
													<Clock class="w-3 h-3 text-amber-400" />
													<span class="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Response</span>
												</div>
												<div class="text-xs text-neutral-300 space-y-0.5">
													<div>Status: <span class="font-bold text-white">{r.status.replace('_', ' ')}</span></div>
													<div>Awarded: <span class="font-bold {(r.awardedPoints ?? 0) > 0 ? 'text-emerald-400' : 'text-neutral-500'}">{r.awardedPoints ?? 0} pts</span></div>
													<div>Duration: <span class="font-bold text-white">{duration(r.startedAt, r.completedAt)}</span></div>
												</div>
											</div>

											<!-- Panelist -->
											<div class="bg-surface-100 rounded-xl p-3 border border-white/[0.06]">
												<div class="flex items-center gap-1.5 mb-1">
													<User class="w-3 h-3 text-primary-400" />
													<span class="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Panelist</span>
												</div>
												<div class="text-sm font-semibold text-white truncate">{r.panelistName || '--'}</div>
												<div class="text-[10px] text-neutral-600 truncate">{r.panelistEmail}</div>
											</div>
										</div>

										<!-- Description -->
										{#if r.surveyDescription}
											<div class="mb-4">
												<span class="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Survey Description</span>
												<p class="text-sm text-neutral-400 mt-1 leading-relaxed">{r.surveyDescription}</p>
											</div>
										{/if}

										<!-- IDs & Links -->
										<div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-neutral-600">
											<span>Transaction ID: <span class="font-mono text-neutral-400">{r.id}</span></span>
											<span>Survey ID: <span class="font-mono text-neutral-400">{r.surveyId?.slice(0, 12)}...</span></span>
											{#if r.respondentId}
												<span>Respondent: <span class="font-mono text-neutral-400">{r.respondentId}</span></span>
											{/if}
										</div>

										<!-- Action links -->
										<div class="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
											<a href="/admin/users/{r.panelistId}" class="btn-secondary !text-xs !py-1.5" onclick={(e) => e.stopPropagation()}>
												<User class="w-3 h-3" /> View Panelist
											</a>
											<a href="/admin/surveys" class="btn-secondary !text-xs !py-1.5" onclick={(e) => e.stopPropagation()}>
												<Eye class="w-3 h-3" /> Manage Survey
											</a>
											{#if r.surveyLink}
												<a href={r.surveyLink} target="_blank" rel="noopener noreferrer" class="btn-ghost !text-xs !py-1.5" onclick={(e) => e.stopPropagation()}>
													<ExternalLink class="w-3 h-3" /> Survey Link
												</a>
											{/if}
										</div>
									</div>
								</td>
							</tr>
						{/if}
					{:else}
						<tr>
							<td colspan="8" class="px-6 py-16 text-center">
								<ClipboardList class="w-10 h-10 text-neutral-700 mx-auto mb-3" />
								<p class="font-medium text-neutral-400">No responses found</p>
								<p class="text-xs text-neutral-600 mt-1">Try adjusting your filters</p>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.pagination.totalPages > 1}
			<div class="bg-surface-50 px-6 py-4 flex items-center justify-between border-t border-white/[0.06]">
				<div class="text-sm text-neutral-500">
					Page {data.pagination.page} of {data.pagination.totalPages}
				</div>
				<div class="flex gap-2">
					{#if data.pagination.page > 1}
						<a
							href="/admin/responses?page={data.pagination.page - 1}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}{data.filters.survey !== 'all' ? `&survey=${data.filters.survey}` : ''}"
							class="btn-secondary !text-xs"
						>
							<ArrowLeft class="w-3.5 h-3.5 rtl:-scale-x-100" /> Prev
						</a>
					{/if}
					{#if data.pagination.page < data.pagination.totalPages}
						<a
							href="/admin/responses?page={data.pagination.page + 1}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}{data.filters.survey !== 'all' ? `&survey=${data.filters.survey}` : ''}"
							class="btn-secondary !text-xs"
						>
							Next <ArrowRight class="w-3.5 h-3.5 rtl:-scale-x-100" />
						</a>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
