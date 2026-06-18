<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	interface Props extends SVGAttributes<SVGSVGElement> {
		/** Sprite symbol id without the `i-` prefix (e.g. "arrow" → #i-arrow). */
		name: string;
		/** Defaults to the base icon size class; pass "" to opt out of sizing. */
		class?: string;
	}

	let { name, class: cls = 'i', ...rest }: Props = $props();
</script>

<svg class={cls} viewBox="0 0 24 24" {...rest}><use href="#i-{name}" /></svg>
