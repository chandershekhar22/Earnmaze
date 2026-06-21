<script lang="ts">
	let { data } = $props<{ data: { item: any; kind: string; kindLabel: string } }>();
	const a = data.item;
</script>

<svelte:head>
	<title>{a.title} — EarnMaze {data.kindLabel}</title>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>
	*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
	html,body{width:100%;height:100%;overflow:hidden;background:#0a0c10;color:#f1f2f5;font-family:'Inter',system-ui,-apple-system,sans-serif}
	.viewer{position:fixed;inset:0;display:flex;flex-direction:column}
	.v-bar{padding:12px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(10,12,16,.85);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);flex-shrink:0;gap:12px}
	.v-l{display:flex;align-items:center;gap:12px;min-width:0}
	.v-back{padding:8px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:999px;font-size:13px;font-weight:600;color:#f1f2f5;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:.2s}
	.v-back:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.2)}
	.v-meta{min-width:0}
	.v-title{font-size:14px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
	.v-sub{font-size:11px;color:#9aa0ad;font-family:'JetBrains Mono',ui-monospace,monospace;margin-top:1px;letter-spacing:.1em;text-transform:uppercase}
	.v-tags{display:flex;gap:6px;flex-shrink:0}
	.v-tag{padding:5px 10px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-family:'JetBrains Mono',ui-monospace,monospace}
	.v-tag.data,.v-tag.lifestyle,.v-tag.other{background:rgba(10,12,16,.5);color:#f1f2f5;border:1px solid rgba(255,255,255,.12)}
	.v-tag.trending{background:rgba(255,183,74,.15);color:#ffb74a;border:1px solid rgba(255,183,74,.3)}
	.v-tag.new{background:rgba(122,184,255,.15);color:#7ab8ff;border:1px solid rgba(122,184,255,.3)}
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
