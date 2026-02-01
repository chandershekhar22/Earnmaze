import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { db } from '$lib/db';
import { survey } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { Logger } from '$lib/utils/app-logger';

// Schema for creating/updating a survey
const surveySchema = z.object({
	title: z.string().min(1, 'Title is required').max(255),
	description: z.string().optional().nullable(),
	points: z.number().int().min(1, 'Points must be at least 1'),
	link: z.string().url('Must be a valid URL'),
	isActive: z.boolean().optional().default(true)
});

// GET - List all surveys (with optional filters)
export const GET: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	
	try {
		const surveys = await db
			.select()
			.from(survey)
			.where(eq(survey.isDeleted, false))
			.orderBy(sql`${survey.createdAt} DESC`);

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

		const [newSurvey] = await db
			.insert(survey)
			.values({
				title: validated.title,
				description: validated.description || null,
				points: validated.points,
				link: validated.link,
				isActive: validated.isActive,
				createdBy: admin.id
			})
			.returning();

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
