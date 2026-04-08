<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let { value = $bindable(''), placeholder = 'Write something...' }: { value?: string; placeholder?: string } = $props();

	let containerEl: HTMLDivElement;
	let quillInstance: any = null;
	let internalUpdate = false;
	let ready = $state(false);

	onMount(async () => {
		await import('quill/dist/quill.snow.css');
		const Quill = (await import('quill')).default;

		quillInstance = new Quill(containerEl, {
			theme: 'snow',
			placeholder,
			modules: {
				toolbar: [
					['bold', 'italic', 'underline'],
					[{ header: 3 }, { header: false }],
					[{ list: 'ordered' }, { list: 'bullet' }],
					['link'],
					['clean'],
				],
			},
		});

		if (value) {
			quillInstance.root.innerHTML = value;
		}

		quillInstance.on('text-change', () => {
			internalUpdate = true;
			const html = quillInstance.root.innerHTML;
			value = html === '<p><br></p>' ? '' : html;
			internalUpdate = false;
		});

		ready = true;
	});

	$effect(() => {
		if (quillInstance && !internalUpdate) {
			const current = quillInstance.root.innerHTML;
			if (value !== current) {
				quillInstance.root.innerHTML = value || '';
			}
		}
	});

	onDestroy(() => {
		quillInstance = null;
	});
</script>

<div class="quill-wrap" class:quill-ready={ready}>
	<div bind:this={containerEl}></div>
</div>

<style>
	/* Container */
	.quill-wrap {
		border-radius: 0.75rem;
		overflow: hidden;
		opacity: 0.5;
		transition: opacity 0.2s;
	}
	.quill-ready { opacity: 1; }

	/* Toolbar */
	.quill-wrap :global(.ql-toolbar.ql-snow) {
		border: 1px solid rgba(255,255,255,0.06);
		border-bottom: 1px solid rgba(255,255,255,0.04);
		background: #1e1e23;
		padding: 6px 8px;
		border-radius: 0.75rem 0.75rem 0 0;
	}
	/* Container */
	.quill-wrap :global(.ql-container.ql-snow) {
		border: 1px solid rgba(255,255,255,0.06);
		border-top: none;
		background: #18181b;
		border-radius: 0 0 0.75rem 0.75rem;
		font-family: inherit;
		font-size: 0.875rem;
		color: #d4d4d8;
	}
	/* Editor */
	.quill-wrap :global(.ql-editor) {
		min-height: 120px;
		max-height: 300px;
		overflow-y: auto;
		padding: 12px 16px;
		line-height: 1.6;
	}
	.quill-wrap :global(.ql-editor.ql-blank::before) {
		color: #525252;
		font-style: normal;
	}

	/* Toolbar icons — default */
	.quill-wrap :global(.ql-snow .ql-stroke) { stroke: #737373; }
	.quill-wrap :global(.ql-snow .ql-fill) { fill: #737373; }
	.quill-wrap :global(.ql-snow .ql-picker) { color: #737373; }
	.quill-wrap :global(.ql-snow .ql-picker-label::before) { color: #737373; }

	/* Toolbar icons — hover & active */
	.quill-wrap :global(.ql-snow button:hover .ql-stroke),
	.quill-wrap :global(.ql-snow button.ql-active .ql-stroke) { stroke: white; }
	.quill-wrap :global(.ql-snow button:hover .ql-fill),
	.quill-wrap :global(.ql-snow button.ql-active .ql-fill) { fill: white; }
	.quill-wrap :global(.ql-snow .ql-picker-label:hover::before),
	.quill-wrap :global(.ql-snow .ql-picker-label.ql-active::before) { color: white; }
	.quill-wrap :global(.ql-snow button:hover),
	.quill-wrap :global(.ql-snow button.ql-active) { color: white; }

	/* Dropdown */
	.quill-wrap :global(.ql-snow .ql-picker-options) {
		background: #1e1e23;
		border: 1px solid rgba(255,255,255,0.06);
		border-radius: 0.5rem;
		padding: 4px;
	}
	.quill-wrap :global(.ql-snow .ql-picker-item) { color: #a3a3a3; }
	.quill-wrap :global(.ql-snow .ql-picker-item:hover) { color: white; }

	/* Editor content */
	.quill-wrap :global(.ql-editor h3) { font-size: 1rem; font-weight: 700; color: white; margin: 0.5em 0; }
	.quill-wrap :global(.ql-editor a) { color: #a78bfa; text-decoration: underline; }
	.quill-wrap :global(.ql-editor strong) { color: white; font-weight: 600; }
	.quill-wrap :global(.ql-editor ul),
	.quill-wrap :global(.ql-editor ol) { padding-left: 1.5em; }

	/* Focus */
	.quill-wrap:focus-within :global(.ql-toolbar.ql-snow) {
		border-color: rgba(139,92,246,0.3);
	}
	.quill-wrap:focus-within :global(.ql-container.ql-snow) {
		border-color: rgba(139,92,246,0.3);
		box-shadow: 0 0 0 2px rgba(139,92,246,0.15);
	}

	/* Link tooltip */
	.quill-wrap :global(.ql-snow .ql-tooltip) {
		background: #1e1e23;
		border: 1px solid rgba(255,255,255,0.1);
		color: #d4d4d8;
		border-radius: 0.5rem;
		box-shadow: 0 8px 20px rgba(0,0,0,0.4);
		z-index: 10;
	}
	.quill-wrap :global(.ql-snow .ql-tooltip input[type=text]) {
		background: #18181b;
		border: 1px solid rgba(255,255,255,0.06);
		color: white;
		border-radius: 0.375rem;
	}
	.quill-wrap :global(.ql-snow .ql-tooltip a.ql-action::after),
	.quill-wrap :global(.ql-snow .ql-tooltip a.ql-remove::before) {
		color: #a78bfa;
	}
</style>
