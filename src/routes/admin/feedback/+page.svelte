<script lang="ts">
	import type { PageData } from './$types';
	import { ArrowLeft, ArrowRight, MessageCircle } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const ratingEmoji = ['😞', '😕', '😐', '🙂', '😍'];

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Feedback - Admin</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-white">Feedback</h1>
			<p class="text-sm text-neutral-500 mt-1">{data.pagination.total} total submissions</p>
		</div>
	</div>

	<!-- Table -->
	<div class="card !p-0 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="table-header">
						<th class="table-th">Rating</th>
						<th class="table-th">Sender</th>
						<th class="table-th">Topic</th>
						<th class="table-th">Message</th>
						<th class="table-th">Date</th>
					</tr>
				</thead>
				<tbody>
					{#each data.feedback as f}
						<tr class="table-row">
							<td class="table-td">
								{#if f.rating}
									<span class="text-xl" title="{f.rating} / 5">{ratingEmoji[f.rating - 1]}</span>
								{:else}
									<span class="text-neutral-600 text-sm">--</span>
								{/if}
							</td>
							<td class="table-td">
								{#if f.userId}
									<div class="text-sm text-white">{f.userName || '--'}</div>
									<div class="text-[10px] text-neutral-600">{f.userEmail}</div>
								{:else}
									<span class="badge bg-white/5 text-neutral-400 ring-1 ring-white/10">Guest</span>
									{#if f.email}
										<div class="text-[10px] text-neutral-600 mt-1">{f.email}</div>
									{/if}
								{/if}
							</td>
							<td class="table-td">
								{#if f.topic}
									<span class="badge bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/20">{f.topic}</span>
								{:else}
									<span class="text-neutral-600 text-sm">--</span>
								{/if}
							</td>
							<td class="table-td text-sm text-neutral-300 max-w-[320px] truncate" title={f.message}>
								{f.message || '--'}
							</td>
							<td class="table-td text-xs text-neutral-500 whitespace-nowrap">
								{formatDate(f.createdAt)}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-6 py-16 text-center text-neutral-500">
								<MessageCircle class="w-10 h-10 mx-auto mb-3 text-neutral-700" />
								<p class="font-medium text-neutral-400">No feedback yet</p>
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
						<a href="/admin/feedback?page={data.pagination.page - 1}" class="btn-secondary !text-xs">
							<ArrowLeft class="w-3.5 h-3.5 rtl:-scale-x-100" /> Prev
						</a>
					{/if}
					{#if data.pagination.page < data.pagination.totalPages}
						<a href="/admin/feedback?page={data.pagination.page + 1}" class="btn-secondary !text-xs">
							Next <ArrowRight class="w-3.5 h-3.5 rtl:-scale-x-100" />
						</a>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
