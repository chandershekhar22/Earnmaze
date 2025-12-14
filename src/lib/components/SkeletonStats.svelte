<!-- SkeletonStats.svelte -->
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
	{#each Array(4) as _}
		<div class="bg-white border border-neutral-200 rounded-2xl p-6 animate-pulse">
			<div class="flex items-center justify-between mb-4">
				<div class="p-2.5 bg-neutral-100 rounded-xl">
					<div class="w-5 h-5 bg-neutral-200 rounded"></div>
				</div>
			</div>
			<div class="h-3.5 bg-neutral-100 rounded w-24 mb-3"></div>
			<div class="h-8 bg-neutral-100 rounded w-20"></div>
		</div>
	{/each}
</div>