<!-- SkeletonStats.svelte -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
	{#each Array(4) as _}
		<div class="group relative">
			<div class="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl blur opacity-25"></div>
			<div class="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 animate-pulse">
				<div class="flex items-start justify-between mb-4">
					<div class="p-3 bg-gray-200 rounded-xl">
						<div class="w-6 h-6 bg-gray-300 rounded"></div>
					</div>
					<div class="text-right">
						<div class="h-4 bg-gray-200 rounded w-16 mb-1"></div>
					</div>
				</div>
				<div class="h-4 bg-gray-200 rounded w-20 mb-1"></div>
				<div class="h-8 bg-gray-200 rounded w-16 mb-2"></div>
				<div class="flex items-center">
					<div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
					<div class="h-4 bg-gray-200 rounded w-24"></div>
				</div>
			</div>
		</div>
	{/each}
</div>