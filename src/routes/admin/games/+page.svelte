<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Gamepad2, Upload, Trash2, ExternalLink, Loader2, X, CheckCircle2, Image as ImageIcon, Star } from '@lucide/svelte';

	let { data } = $props<{ data: { items: any[] } }>();

	let title = $state('');
	let file = $state<File | null>(null);
	let dragOver = $state(false);
	let thumb = $state<File | null>(null);
	let thumbPreview = $state<string | null>(null);
	let thumbDragOver = $state(false);
	let uploading = $state(false);
	let err = $state<string | null>(null);
	let ok = $state<string | null>(null);

	const ALLOWED_THUMB = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

	function pickFile(e: Event) {
		const input = e.target as HTMLInputElement;
		file = input.files?.[0] ?? null;
	}
	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) file = f;
	}

	function setThumb(f: File | null | undefined) {
		if (thumbPreview) URL.revokeObjectURL(thumbPreview);
		if (!f) {
			thumb = null;
			thumbPreview = null;
			return;
		}
		if (!ALLOWED_THUMB.includes(f.type)) {
			err = 'Thumbnail must be PNG, JPG, WEBP, GIF or SVG';
			return;
		}
		if (f.size > 2 * 1024 * 1024) {
			err = 'Thumbnail too large (max 2 MB)';
			return;
		}
		err = null;
		thumb = f;
		thumbPreview = URL.createObjectURL(f);
	}
	function pickThumb(e: Event) {
		const input = e.target as HTMLInputElement;
		setThumb(input.files?.[0]);
	}
	function onThumbDrop(e: DragEvent) {
		e.preventDefault();
		thumbDragOver = false;
		setThumb(e.dataTransfer?.files?.[0]);
	}
	function clearThumb(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		setThumb(null);
	}

	async function submit(e: Event) {
		e.preventDefault();
		err = null;
		ok = null;
		if (!file) {
			err = 'Please choose an HTML file.';
			return;
		}
		const fd = new FormData();
		fd.append('title', title);
		fd.append('file', file);
		if (thumb) fd.append('thumb', thumb);

		uploading = true;
		try {
			const res = await fetch('/api/games', { method: 'POST', body: fd });
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				throw new Error(j.message || j.error || `Upload failed (${res.status})`);
			}
			ok = 'Game uploaded — now live in Today’s game on /games.';
			title = '';
			file = null;
			setThumb(null);
			await invalidateAll();
		} catch (e: any) {
			err = e.message || 'Upload failed';
		} finally {
			uploading = false;
		}
	}

	async function del(id: string) {
		if (!confirm('Delete this game? Players will no longer see it.')) return;
		const res = await fetch(`/api/games?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) await invalidateAll();
	}
</script>

<svelte:head>
	<title>Games - Admin - EarnMaze</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8 space-y-8">
	<div class="flex items-center gap-3">
		<div class="p-2 bg-rose-500/15 rounded-lg"><Gamepad2 class="w-5 h-5 text-rose-400" /></div>
		<div>
			<h1 class="text-xl font-bold text-white">Games</h1>
			<p class="text-xs text-neutral-400">Upload an HTML game. The most recent upload is featured in Today&rsquo;s game on /games.</p>
		</div>
	</div>

	<form onsubmit={submit} class="bg-surface-100 border border-white/[0.06] rounded-xl p-5 space-y-4">
		<h2 class="text-sm font-bold text-white">Upload new game</h2>

		{#if err}
			<div class="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
				<X class="w-4 h-4 mt-0.5 shrink-0" /><span>{err}</span>
			</div>
		{/if}
		{#if ok}
			<div class="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300">
				<CheckCircle2 class="w-4 h-4 mt-0.5 shrink-0" /><span>{ok}</span>
			</div>
		{/if}

		<label class="block">
			<span class="text-xs font-semibold text-neutral-400 mb-1.5 block">Game title</span>
			<input bind:value={title} required type="text" placeholder="Neon Snake"
				class="w-full px-3 py-2.5 bg-surface-200 border border-white/[0.08] rounded-lg text-sm text-white outline-none focus:border-rose-500/50" />
		</label>

		<div>
			<span class="text-xs font-semibold text-neutral-400 mb-1.5 block">Thumbnail image <span class="text-neutral-500 font-normal">(optional)</span></span>
			<label
				class="relative block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition
				{thumbDragOver ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 hover:border-white/20'}"
				ondragover={(e) => { e.preventDefault(); thumbDragOver = true; }}
				ondragleave={() => (thumbDragOver = false)}
				ondrop={onThumbDrop}
			>
				<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onchange={pickThumb} class="hidden" />
				{#if thumbPreview}
					<div class="flex items-center gap-3">
						<img src={thumbPreview} alt="Thumbnail preview" class="w-24 h-24 object-cover rounded-md border border-white/10" />
						<div class="flex-1 text-left min-w-0">
							<div class="text-sm text-white font-semibold truncate">{thumb?.name}</div>
							<div class="text-xs text-neutral-400">{Math.round((thumb?.size ?? 0) / 1024)} KB</div>
						</div>
						<button type="button" onclick={clearThumb}
							class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-xs text-red-300 rounded-md transition">
							<X class="w-3 h-3" /> Remove
						</button>
					</div>
				{:else}
					<ImageIcon class="w-7 h-7 text-neutral-400 mx-auto mb-2" />
					<div class="text-sm text-neutral-300">Drop a thumbnail image or click to browse</div>
					<div class="text-xs text-neutral-500 mt-1">PNG, JPG, WEBP, GIF, SVG &middot; max 2 MB &middot; used as the game cover</div>
				{/if}
			</label>
		</div>

		<div>
			<span class="text-xs font-semibold text-neutral-400 mb-1.5 block">HTML file</span>
			<label
				class="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
				{dragOver ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 hover:border-white/20'}"
				ondragover={(e) => { e.preventDefault(); dragOver = true; }}
				ondragleave={() => (dragOver = false)}
				ondrop={onDrop}
			>
				<input type="file" accept=".html,.htm,text/html" onchange={pickFile} class="hidden" />
				<Upload class="w-7 h-7 text-neutral-400 mx-auto mb-2" />
				{#if file}
					<div class="text-sm text-white font-semibold">{file.name}</div>
					<div class="text-xs text-neutral-400">{Math.round(file.size / 1024)} KB</div>
				{:else}
					<div class="text-sm text-neutral-300">Drop your .html file here or click to browse</div>
					<div class="text-xs text-neutral-500 mt-1">Single self-contained HTML, max 5 MB</div>
				{/if}
			</label>
		</div>

		<div class="flex justify-end">
			<button type="submit" disabled={uploading || !title || !file}
				class="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition">
				{#if uploading}<Loader2 class="w-4 h-4 animate-spin" /> Uploading&hellip;{:else}<Upload class="w-4 h-4" /> Upload game{/if}
			</button>
		</div>
	</form>

	<section>
		<h2 class="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
			Uploaded ({data.items.length})
		</h2>

		{#if data.items.length === 0}
			<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-8 text-center text-sm text-neutral-400">
				No games yet. Upload your first .html game above.
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				{#each data.items as g, i (g.id)}
					<div class="bg-surface-100 border rounded-xl p-4 flex flex-col gap-2 {i === 0 ? 'border-rose-500/30' : 'border-white/[0.06]'}">
						<div class="flex items-start justify-between gap-3">
							<div class="flex items-start gap-3 min-w-0">
								{#if g.thumb}
									<img src={g.thumb} alt="" class="w-12 h-12 object-cover rounded-md border border-white/10 shrink-0" />
								{:else}
									<div class="w-12 h-12 rounded-md border border-white/10 bg-surface-200 grid place-items-center shrink-0">
										<Gamepad2 class="w-5 h-5 text-neutral-500" />
									</div>
								{/if}
								<div class="min-w-0">
									<div class="text-sm font-bold text-white truncate">{g.title}</div>
									<div class="text-[11px] text-neutral-500 font-mono">{new Date(g.createdAt).toLocaleString()}</div>
								</div>
							</div>
							{#if i === 0}
								<span class="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 shrink-0">
									<Star class="w-3 h-3" /> Today&rsquo;s game
								</span>
							{/if}
						</div>
						<div class="flex items-center justify-end gap-1 pt-2 border-t border-white/[0.04]">
							<a href={g.file} target="_blank" rel="noopener"
								class="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-200 hover:bg-surface-300 text-xs text-white rounded-md transition">
								<ExternalLink class="w-3 h-3" /> Open
							</a>
							<button type="button" onclick={() => del(g.id)}
								class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-xs text-red-300 rounded-md transition">
								<Trash2 class="w-3 h-3" /> Delete
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
