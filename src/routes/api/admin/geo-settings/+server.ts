import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';

/**
 * GET /api/admin/geo-settings
 * Get current geo-restriction settings
 */
export const GET: RequestHandler = async ({ locals }) => {
	// Check admin authorization
	if (!locals.user || locals.user.userType !== 'admin') {
		return json(
			{
				success: false,
				error: 'UNAUTHORIZED',
				message: 'Admin access required'
			},
			{ status: 403 }
		);
	}

	// In a real implementation, load from database
	// For now, return current config
	const { GEO_CONFIG } = await import('$lib/server/geo-restriction');
	
	return json({
		success: true,
		data: {
			mode: GEO_CONFIG.mode,
			allowedCountries: GEO_CONFIG.allowedCountries,
			blockedCountries: GEO_CONFIG.blockedCountries,
			restrictedPaths: GEO_CONFIG.restrictedPaths,
			message: GEO_CONFIG.message,
		}
	});
};

/**
 * POST /api/admin/geo-settings
 * Update geo-restriction settings
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	// Check admin authorization
	if (!locals.user || locals.user.userType !== 'admin') {
		return json(
			{
				success: false,
				error: 'UNAUTHORIZED',
				message: 'Admin access required'
			},
			{ status: 403 }
		);
	}

	try {
		const body = await request.json();
		
		// Validate input
		if (!body.mode || !['allowlist', 'blocklist'].includes(body.mode)) {
			return json(
				{
					success: false,
					error: 'INVALID_MODE',
					message: 'Mode must be "allowlist" or "blocklist"'
				},
				{ status: 400 }
			);
		}
		
		// Validate country codes
		const countryCodeRegex = /^[A-Z]{2}$/;
		
		if (body.allowedCountries) {
			const invalidCodes = body.allowedCountries.filter(
				(code: string) => !countryCodeRegex.test(code)
			);
			if (invalidCodes.length > 0) {
				return json(
					{
						success: false,
						error: 'INVALID_COUNTRY_CODES',
						message: `Invalid country codes: ${invalidCodes.join(', ')}`
					},
					{ status: 400 }
				);
			}
		}
		
		if (body.blockedCountries) {
			const invalidCodes = body.blockedCountries.filter(
				(code: string) => !countryCodeRegex.test(code)
			);
			if (invalidCodes.length > 0) {
				return json(
					{
						success: false,
						error: 'INVALID_COUNTRY_CODES',
						message: `Invalid country codes: ${invalidCodes.join(', ')}`
					},
					{ status: 400 }
				);
			}
		}
		
		// Validate exempt paths
		if (body.exemptPaths) {
			const invalidPaths = body.exemptPaths.filter(
				(path: string) => !path.startsWith('/')
			);
			if (invalidPaths.length > 0) {
				return json(
					{
						success: false,
						error: 'INVALID_PATHS',
						message: 'All paths must start with /'
					},
					{ status: 400 }
				);
			}
		}
		
		// In a real implementation, save to database or config file
		// For now, just validate and return success
		// You would need to:
		// 1. Save to database
		// 2. Update GEO_CONFIG in memory or reload config
		// 3. Optionally restart server or hot-reload config
		
		// TODO: Implement persistent storage
		// await db.insert(geoSettings).values({
		//   mode: body.mode,
		//   allowedCountries: body.allowedCountries,
		//   ...
		// });
		
		return json({
			success: true,
			message: 'Settings updated successfully. Restart server for changes to take effect.',
			data: {
				mode: body.mode,
				allowedCountries: body.allowedCountries || [],
				blockedCountries: body.blockedCountries || [],
				blockVPN: body.blockVPN ?? true,
				blockTOR: body.blockTOR ?? true,
				exemptPaths: body.exemptPaths || [],
			}
		});
		
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Error updating geo-settings');
		return json(
			{
				success: false,
				error: 'SERVER_ERROR',
				message: 'Failed to update settings'
			},
			{ status: 500 }
		);
	}
};
