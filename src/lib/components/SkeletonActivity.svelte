<!-- SkeletonActivity.svelte -->
<div class="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-xl animate-pulse">
	<div class="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50"></div>
	<div class="relative">
		<div class="flex items-center mb-8">
			<div class="w-10 h-10 bg-gray-200 rounded-xl mr-4"></div>
			<div>
				<div class="h-6 bg-gray-200 rounded w-32 mb-2"></div>
				<div class="h-4 bg-gray-200 rounded w-48"></div>
			</div>
		</div>

		<div class="space-y-4">
			{#each Array(3) as _}
				<div class="flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl">
					<div class="flex items-center">
						<div class="w-12 h-12 bg-gray-200 rounded-xl mr-4"></div>
						<div>
							<div class="h-5 bg-gray-200 rounded w-48 mb-1"></div>
							<div class="flex items-center">
								<div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
								<div class="h-4 bg-gray-200 rounded w-20"></div>
							</div>
						</div>
					</div>
					<div class="text-right">
						<div class="h-6 bg-gray-200 rounded w-20 mb-1"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>