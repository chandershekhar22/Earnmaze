import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { getPanelistProfile, updatePanelistProfile } from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';
import { profileUpdateSchema, validateInput } from '$lib/validation/api-schemas';

/**
 * GET /api/panelist/profile — fetch panelist profile data
 */
export const GET: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	try {
		// Fetch user, demographics, geography, professional, preferences in parallel
		const { userData, demographics, geography, professional, preferences } = await getPanelistProfile(authUser.id);

		return json({
			name: userData?.name ?? '',
			email: userData?.email ?? '',
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
				smsNotifications:
					(preferences?.notificationChannels as string[] | null)?.includes('sms') ?? false,
				surveyCategories: (preferences?.surveyTopicsInterest as string[]) ?? [],
			},
		});
	} catch (error) {
		Logger.root.error({ context: 'api', error, userId: authUser.id }, 'Profile fetch error');
		return json(
			{ success: false, error: 'PROFILE_FETCH_FAILED', message: 'Failed to fetch profile' },
			{ status: 500 }
		);
	}
};

/**
 * PUT /api/panelist/profile — update panelist profile
 */
export const PUT: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	let body: {
		name?: string;
		demographics?: {
			age?: string;
			gender?: string;
			country?: string;
			education?: string;
			employment?: string;
			income?: string;
		};
		preferences?: {
			emailNotifications?: boolean;
			smsNotifications?: boolean;
			surveyCategories?: string[];
		};
	};

	try {
		const raw = await event.request.json();
		const validation = await validateInput(profileUpdateSchema, raw);
		if (!validation.success) {
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: validation.error },
				{ status: 400 }
			);
		}
		body = validation.data;
	} catch {
		return json(
			{ success: false, error: 'INVALID_BODY', message: 'Invalid JSON body' },
			{ status: 400 }
		);
	}

	try {
		await updatePanelistProfile(authUser.id, body);

		return json({ success: true, message: 'Profile updated successfully' });
	} catch (error) {
		Logger.root.error({ context: 'api', error, userId: authUser.id }, 'Profile update error');
		return json(
			{ success: false, error: 'PROFILE_UPDATE_FAILED', message: 'Failed to update profile' },
			{ status: 500 }
		);
	}
};
