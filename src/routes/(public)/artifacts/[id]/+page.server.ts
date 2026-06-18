import type { PageServerLoad } from './$types';
import { readManifest } from '$lib/server/artifacts-store';
import { getItemStats } from '$lib/server/engagement-store';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const items = await readManifest();
	const artifact = items.find((a) => a.id === params.id);
	if (!artifact) throw error(404, 'Artifact not found');
	const stats = await getItemStats('artifacts', params.id);
	return { artifact, stats };
};
