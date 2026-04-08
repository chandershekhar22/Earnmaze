import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { createSurveyAdmin } from '$lib/db/repositories';
import { getAdminSurveys } from '$lib/db/repositories/survey.repository.server';
import { z } from 'zod';
import { Logger } from '$lib/utils/app-logger';

// Schema for creating/updating a survey
const surveySchema = z.object({
	title: z.string().min(1, 'Title is required').max(255),
	description: z.string().optional().nullable(),
	points: z.number().int().min(1, 'Points must be at least 1'),
	terminatedPoints: z.number().int().min(0).optional().default(0),
	quotaFullPoints: z.number().int().min(0).optional().default(0),
	link: z.string().url('Must be a valid URL'),
	isActive: z.boolean().optional().default(true),
	priority: z.enum(['low', 'medium', 'high']).optional().default('medium')
});

// GET - List all surveys (with optional filters)
export const GET: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	
	try {
		const page = parseInt(event.url.searchParams.get('page') || '1');
		const limit = parseInt(event.url.searchParams.get('limit') || '20');
		const search = event.url.searchParams.get('search') || '';
		const status = event.url.searchParams.get('status') || 'all';

		const surveys = await getAdminSurveys({ page, limit, search, status });
		return json({ success: true, data: surveys });
	} catch (error) {
		Logger.root.error(
			{ context: 'api', error, adminId: admin.id },
			'Failed to fetch surveys'
		);
		return json(
			{ success: false, error: 'FETCH_FAILED', message: 'Failed to fetch surveys' },
			{ status: 500 }
		);
	}
};

// POST - Create a new survey
export const POST: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	
	try {
		const body = await event.request.json();
		const validated = surveySchema.parse(body);

		const newSurvey = await createSurveyAdmin(
			{
				title: validated.title,
				description: validated.description || null,
				points: validated.points,
				link: validated.link,
				isActive: validated.isActive,
				priority: validated.priority,
			},
			admin.id
		);

		return json({ success: true, data: newSurvey }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const zodError = error as z.ZodError;
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: zodError.issues[0]?.message || 'Validation failed' },
				{ status: 400 }
			);
		}
		Logger.root.error({ context: 'admin', error, adminId: admin.id }, 'Failed to create survey');
		return json(
			{ success: false, error: 'CREATE_FAILED', message: 'Failed to create survey' },
			{ status: 500 }
		);
	}
};
