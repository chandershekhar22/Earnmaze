import type { PageServerLoad } from './$types';
import { getActiveFaqsLocalized } from '$lib/db/repositories';
import { getLocale } from '$lib/paraglide/runtime';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async () => {
	try {
		const faqs = await getActiveFaqsLocalized(getLocale());
		return { faqs };
	} catch (error) {
		Logger.root.error({ context: 'public', error }, 'Failed to load help FAQs');
		return { faqs: [] };
	}
};
