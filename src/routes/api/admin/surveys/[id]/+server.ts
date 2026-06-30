import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { getSurveyById, updateSurveyAdmin, deleteSurveyAdmin } from '$lib/db/repositories';
import { z } from 'zod';
import { Logger } from '$lib/utils/app-logger';

// Schema for updating a survey
const updateSurveySchema = z.object({
	title: z.string().min(1, 'Title is required').max(255).optional(),
	description: z.string().optional().nullable(),
	points: z.number().int().min(1, 'Points must be at least 1').optional(),
	terminatedPoints: z.number().int().min(0).optional(),
	quotaFullPoints: z.number().int().min(0).optional(),
	link: z.string().url('Must be a valid URL').optional(),
	isActive: z.boolean().optional(),
	priority: z.enum(['low', 'medium', 'high']).optional(),
	thumbnailUrl: z.string().optional().nullable(),
	isTodaySurvey: z.boolean().optional()
});

// GET - Get a single survey by ID
export const GET: RequestHandler = async (event) => {
	await requireAdmin(event);
	const surveyId = event.params.id;

	if (!surveyId) {
		return json(
			{ success: false, error: 'INVALID_ID', message: 'Invalid survey ID' },
			{ status: 400 }
		);
	}

	try {
		const surveyData = await getSurveyById(surveyId);

		if (!surveyData) {
			return json(
				{ success: false, error: 'NOT_FOUND', message: 'Survey not found' },
				{ status: 404 }
			);
		}

		return json({ success: true, data: surveyData });
	} catch (error) {
		Logger.root.error(
			{ context: 'api', error, surveyId },
			'Failed to fetch survey'
		);
		return json(
			{ success: false, error: 'FETCH_FAILED', message: 'Failed to fetch survey' },
			{ status: 500 }
		);
	}
};

// PATCH - Update a survey
export const PATCH: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const surveyId = event.params.id;

	if (!surveyId) {
		return json(
			{ success: false, error: 'INVALID_ID', message: 'Invalid survey ID' },
			{ status: 400 }
		);
	}

	try {
		const body = await event.request.json();
		const validated = updateSurveySchema.parse(body);

		// Check if survey exists
		const existing = await getSurveyById(surveyId, 	true, false);

		if (!existing) {
			return json(
				{ success: false, error: 'NOT_FOUND', message: 'Survey not found' },
				{ status: 404 }
			);
		}

		const updated = await updateSurveyAdmin(surveyId, validated, admin.id);

		return json({ success: true, data: updated });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: error.issues[0].message },
				{ status: 400 }
			);
		}
		Logger.root.error(
			{ context: 'api', error, surveyId, adminId: admin.id },
			'Failed to update survey'
		);
		return json(
			{ success: false, error: 'UPDATE_FAILED', message: 'Failed to update survey' },
			{ status: 500 }
		);
	}
};

// DELETE - Soft delete a survey
export const DELETE: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const surveyId = event.params.id;

	if (!surveyId) {
		return json(
			{ success: false, error: 'INVALID_ID', message: 'Invalid survey ID' },
			{ status: 400 }
		);
	}

	try {
		// Check if survey exists
		const existing = await getSurveyById(surveyId);

		if (!existing) {
			return json(
				{ success: false, error: 'NOT_FOUND', message: 'Survey not found' },
				{ status: 404 }
			);
		}

		// Soft delete
		await deleteSurveyAdmin(surveyId, admin.id);

		return json({ success: true, message: 'Survey deleted successfully' });
	} catch (error) {
		Logger.root.error(
			{ context: 'api', error, surveyId, adminId: admin.id },
			'Failed to delete survey'
		);
		return json(
			{ success: false, error: 'DELETE_FAILED', message: 'Failed to delete survey' },
			{ status: 500 }
		);
	}
};
