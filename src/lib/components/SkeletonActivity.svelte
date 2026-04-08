<div class="bg-surface-100 border border-white/[0.06] rounded-2xl animate-pulse">
	<div class="flex items-center justify-between px-5 pt-5 pb-3">
		<div class="h-5 bg-white/[0.06] rounded w-32"></div>
		<div class="h-4 bg-white/[0.06] rounded w-16"></div>
	</div>
	<div class="divide-y divide-white/[0.04]">
		{#each Array(4) as _}
			<div class="flex items-center gap-3 px-5 py-3.5">
				<div class="w-9 h-9 bg-white/[0.06] rounded-xl flex-shrink-0"></div>
				<div class="flex-1">
					<div class="h-4 bg-white/[0.06] rounded w-48 mb-1.5"></div>
					<div class="h-3 bg-white/[0.06] rounded w-20"></div>
				</div>
				<div class="h-5 bg-white/[0.06] rounded w-14"></div>
			</div>
		{/each}
	</div>
</div>
