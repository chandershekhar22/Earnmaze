<script lang="ts">
	let { data } = $props<{ data: { item: any; kind: string; kindLabel: string } }>();
	const a = data.item;
</script>

<svelte:head>
	<title>{a.title} — EarnMaze {data.kindLabel}</title>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>
	*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
	html,body{width:100%;height:100%;overflow:hidden;background:#0b1020;color:#f5f5fa;font-family:system-ui,sans-serif}
	.viewer{position:fixed;inset:0;display:flex;flex-direction:column}
	.v-bar{padding:12px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(6,6,11,.85);backdrop-filter:blur(18px);flex-shrink:0;gap:12px}
	.v-l{display:flex;align-items:center;gap:12px;min-width:0}
	.v-back{padding:8px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:30px;font-size:.78rem;font-weight:600;color:#f5f5fa;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:all .2s}
	.v-back:hover{background:rgba(255,255,255,.1)}
	.v-meta{min-width:0}
	.v-title{font-size:.95rem;font-weight:700;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
	.v-sub{font-size:.7rem;color:#8888a0;font-family:monospace;margin-top:1px;text-transform:uppercase;letter-spacing:1.5px}
	.v-tags{display:flex;gap:6px;flex-shrink:0}
	.v-tag{padding:4px 10px;border-radius:6px;font-size:.62rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
	.v-tag.data{background:rgba(53,211,154,.22);color:#5fe2b0;border:1px solid rgba(53,211,154,.3)}
	.v-tag.lifestyle{background:rgba(143,124,255,.22);color:#b3a5ff;border:1px solid rgba(143,124,255,.3)}
	.v-tag.other{background:rgba(86,168,255,.22);color:#7eb8ff;border:1px solid rgba(86,168,255,.3)}
	.v-tag.trending{background:rgba(255,209,102,.22);color:#ffd166;border:1px solid rgba(255,209,102,.3)}
	.v-tag.new{background:rgba(86,168,255,.22);color:#7eb8ff;border:1px solid rgba(86,168,255,.3)}
	iframe{flex:1;width:100%;border:0;background:#fff}
	@media(max-width:600px){.v-tags{display:none}.v-bar{padding:10px 14px}}
	</style>`}
</svelte:head>

<div class="viewer">
	<div class="v-bar">
		<div class="v-l">
			<a href="/{data.kind}" data-sveltekit-reload class="v-back">← Back</a>
			<div class="v-meta">
				<div class="v-title">{a.title}</div>
				<div class="v-sub">{a.readTime}</div>
			</div>
		</div>
		<div class="v-tags">
			<span class="v-tag {a.cat}">{a.cat?.toUpperCase()}</span>
			{#each (a.tags || []) as t}
				<span class="v-tag {String(t).toLowerCase()}">{t}</span>
			{/each}
		</div>
	</div>
	<iframe src={a.file} title={a.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
</div>
