<!-- SkeletonActivity.svelte -->
<div class="bg-white border border-neutral-200 rounded-3xl p-8 animate-pulse">
	<div class="flex items-center justify-between mb-6">
		<div class="h-6 bg-neutral-100 rounded w-36"></div>
		<div class="h-5 bg-neutral-100 rounded w-20"></div>
	</div>

	<div class="space-y-3">
		{#each Array(3) as _}
			<div class="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl">
				<div class="p-2.5 bg-white border border-neutral-200 rounded-xl flex-shrink-0">
					<div class="w-5 h-5 bg-neutral-200 rounded"></div>
				</div>
				<div class="flex-1">
					<div class="h-4 bg-neutral-200 rounded w-48 mb-2"></div>
					<div class="h-3.5 bg-neutral-200 rounded w-24"></div>
				</div>
				<div class="h-7 bg-white border border-neutral-200 rounded-xl w-20"></div>
			</div>
		{/each}
	</div>
</div>