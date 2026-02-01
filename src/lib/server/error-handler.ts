/**
 * Centralized Error Handling
 * Standard error responses and correlation IDs
 */

import { json, type NumericRange } from '@sveltejs/kit';
import { Logger, generateRayId } from '$lib/utils/app-logger';
import { ZodError } from 'zod';

// ==================== Error Types ====================

export enum ErrorCode {
	// Auth errors (1000-1999)
	UNAUTHORIZED = 'UNAUTHORIZED',
	FORBIDDEN = 'FORBIDDEN',
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
	TOKEN_EXPIRED = 'TOKEN_EXPIRED',
	TOKEN_INVALID = 'TOKEN_INVALID',
	EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',

	// Validation errors (2000-2999)
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	INVALID_INPUT = 'INVALID_INPUT',
	MISSING_FIELD = 'MISSING_FIELD',
	INVALID_FORMAT = 'INVALID_FORMAT',

	// Resource errors (3000-3999)
	NOT_FOUND = 'NOT_FOUND',
	ALREADY_EXISTS = 'ALREADY_EXISTS',
	CONFLICT = 'CONFLICT',

	// Rate limiting (4000-4999)
	RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
	TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

	// Server errors (5000-5999)
	INTERNAL_ERROR = 'INTERNAL_ERROR',
	DATABASE_ERROR = 'DATABASE_ERROR',
	EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

	// Business logic errors (6000-6999)
	INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
	SURVEY_NOT_AVAILABLE = 'SURVEY_NOT_AVAILABLE',
	SURVEY_ALREADY_COMPLETED = 'SURVEY_ALREADY_COMPLETED'
}

export interface ErrorResponse {
	success: false;
	error: ErrorCode | string;
	message: string;
	correlationId: string;
	timestamp: string;
	details?: any;
}

export interface SuccessResponse<T = any> {
	success: true;
	data: T;
	correlationId?: string;
	timestamp?: string;
}

// ==================== Error Classes ====================

export class AppError extends Error {
	constructor(
		public code: ErrorCode | string,
		public message: string,
		public statusCode: NumericRange<400, 599> = 500,
		public details?: any
	) {
		super(message);
		this.name = 'AppError';
	}
}

export class ValidationError extends AppError {
	constructor(message: string, details?: any) {
		super(ErrorCode.VALIDATION_ERROR, message, 400, details);
		this.name = 'ValidationError';
	}
}

export class AuthError extends AppError {
	constructor(message: string, code: ErrorCode = ErrorCode.UNAUTHORIZED) {
		super(code, message, 401);
		this.name = 'AuthError';
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string = 'Resource') {
		super(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
		this.name = 'NotFoundError';
	}
}

export class RateLimitError extends AppError {
	constructor(retryAfter: number) {
		super(
			ErrorCode.RATE_LIMIT_EXCEEDED, 
			'Too many requests. Please try again later.',
			429,
			{ retryAfter }
		);
		this.name = 'RateLimitError';
	}
}

// ==================== Error Handler ====================

/**
 * Handle errors and return standardized JSON response
 */
export function handleError(
	error: unknown,
	context?: Record<string, any>
): Response {
	const correlationId = generateRayId();
	const timestamp = new Date().toISOString();

	// AppError - known application errors
	if (error instanceof AppError) {
		Logger.root.warn(
			{ 
				context: 'errors', 
				correlationId, 
				code: error.code, 
				...context 
			},
			error.message
		);

		const response: ErrorResponse = {
			success: false,
			error: error.code,
			message: error.message,
			correlationId,
			timestamp,
			...(error.details && { details: error.details })
		};

		return json(response, { status: error.statusCode });
	}

	// Zod validation errors
	if (error instanceof ZodError) {
		const errors = error.issues || [];
		const firstError = errors[0];
		const message = firstError?.message || 'Validation failed';

		Logger.root.warn(
			{ 
				context: 'errors', 
				correlationId, 
				validationErrors: errors, 
				...context 
			},
			'Validation error'
		);

		const response: ErrorResponse = {
			success: false,
			error: ErrorCode.VALIDATION_ERROR,
			message,
			correlationId,
			timestamp,
			details: errors
		};

		return json(response, { status: 400 });
	}

	// Unknown errors - log with full details
	Logger.root.error(
		{ 
			context: 'errors', 
			correlationId, 
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			...context 
		},
		'Unhandled error'
	);

	const response: ErrorResponse = {
		success: false,
		error: ErrorCode.INTERNAL_ERROR,
		message: 'An unexpected error occurred. Please try again later.',
		correlationId,
		timestamp
	};

	return json(response, { status: 500 });
}

/**
 * Create success response
 */
export function successResponse<T>(
	data: T,
	includeMetadata: boolean = false
): SuccessResponse<T> {
	if (includeMetadata) {
		return {
			success: true,
			data,
			correlationId: generateRayId(),
			timestamp: new Date().toISOString()
		};
	}
	return {
		success: true,
		data
	};
}

/**
 * Retry logic for transient errors
 */
export async function retryOperation<T>(
	operation: () => Promise<T>,
	options: {
		maxRetries?: number;
		delayMs?: number;
		exponentialBackoff?: boolean;
		onRetry?: (attempt: number, error: any) => void;
	} = {}
): Promise<T> {
	const {
		maxRetries = 3,
		delayMs = 1000,
		exponentialBackoff = true,
		onRetry
	} = options;

	let lastError: any;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			// Don't retry on non-transient errors
			if (error instanceof AppError && error.statusCode < 500) {
				throw error;
			}

			if (attempt < maxRetries) {
				const delay = exponentialBackoff 
					? delayMs * Math.pow(2, attempt)
					: delayMs;

				if (onRetry) {
					onRetry(attempt + 1, error);
				}

				Logger.root.warn(
					{ context: 'errors', attempt: attempt + 1, maxRetries, delay },
					'Retrying operation after error'
				);

				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError;
}
