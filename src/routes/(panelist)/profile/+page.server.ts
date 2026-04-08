import type { PageServerLoad } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { getPanelistProfile } from '$lib/db/repositories';

export const load: PageServerLoad = async (event) => {
	const authUser = await requirePanelist(event);

	const { userData, demographics, geography, professional, preferences } = await getPanelistProfile(authUser.id);

	return {
		profile: {
			name: userData?.name ?? '',
			email: userData?.email ?? '',
			emailVerified: userData?.emailVerified ?? false,
			demographics: {
				age: demographics?.dateOfBirth ?? '',
				gender: demographics?.gender ?? '',
				country: geography?.country ?? '',
				education: professional?.education ?? '',
				employment: professional?.employment ?? '',
				income: professional?.income ?? '',
			},
			preferences: {
				emailNotifications: preferences?.notificationOptIn ?? true,
				smsNotifications: (preferences?.notificationChannels as string[] | null)?.includes('sms') ?? false,
				surveyCategories: (preferences?.surveyTopicsInterest as string[]) ?? [],
			},
		},
	};
};
