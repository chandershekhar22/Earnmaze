import type { PageServerLoad } from './$types';
import { readManifest } from '$lib/server/artifacts-store';

export const load: PageServerLoad = async () => {
	const items = await readManifest();
	return { items };
};
