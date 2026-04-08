/**
 * Tests for centralised error handling (error-handler.ts)
 * Covers: error classes, handleError, successResponse, retryOperation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError, z } from 'zod';

// ---- Mock Logger and generateRayId for deterministic output ----
vi.mock('$lib/utils/app-logger', () => ({
	Logger: {
		root: {
			warn: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			debug: vi.fn(),
		},
	},
	generateRayId: vi.fn(() => 'test-ray-id-0001'),
}));

import {
	AppError,
	ValidationError,
	AuthError,
	NotFoundError,
	RateLimitError,
	ErrorCode,
	handleError,
	successResponse,
	retryOperation,
} from '$lib/server/error-handler';

// ==================== AppError ====================

describe('AppError', () => {
	it('stores code, message, and statusCode', () => {
		const err = new AppError(ErrorCode.NOT_FOUND, 'Thing not found', 404);
		expect(err.code).toBe(ErrorCode.NOT_FOUND);
		expect(err.message).toBe('Thing not found');
		expect(err.statusCode).toBe(404);
	});

	it('defaults statusCode to 500', () => {
		const err = new AppError(ErrorCode.INTERNAL_ERROR, 'Oops');
		expect(err.statusCode).toBe(500);
	});

	it('stores optional details', () => {
		const details = { field: 'email', issue: 'taken' };
		const err = new AppError(ErrorCode.CONFLICT, 'Conflict', 409, details);
		expect(err.details).toEqual(details);
	});

	it('is an instance of Error', () => {
		expect(new AppError(ErrorCode.INTERNAL_ERROR, 'test')).toBeInstanceOf(Error);
	});
});

// ==================== ValidationError ====================

describe('ValidationError', () => {
	it('sets code to VALIDATION_ERROR and statusCode to 400', () => {
		const err = new ValidationError('Bad input');
		expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
		expect(err.statusCode).toBe(400);
		expect(err.message).toBe('Bad input');
	});

	it('accepts optional details', () => {
		const err = new ValidationError('Bad input', [{ path: 'email', msg: 'required' }]);
		expect(err.details).toBeDefined();
	});

	it('is an instance of AppError', () => {
		expect(new ValidationError('x')).toBeInstanceOf(AppError);
	});
});

// ==================== AuthError ====================

describe('AuthError', () => {
	it('defaults to UNAUTHORIZED code and 401 status', () => {
		const err = new AuthError('Not logged in');
		expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
		expect(err.statusCode).toBe(401);
	});

	it('accepts a custom error code', () => {
		const err = new AuthError('Forbidden', ErrorCode.FORBIDDEN);
		expect(err.code).toBe(ErrorCode.FORBIDDEN);
	});
});

// ==================== NotFoundError ====================

describe('NotFoundError', () => {
	it('creates a 404 error with resource name', () => {
		const err = new NotFoundError('Survey');
		expect(err.statusCode).toBe(404);
		expect(err.message).toContain('Survey');
		expect(err.code).toBe(ErrorCode.NOT_FOUND);
	});

	it('uses "Resource" when no name is given', () => {
		const err = new NotFoundError();
		expect(err.message).toContain('Resource');
	});
});

// ==================== RateLimitError ====================

describe('RateLimitError', () => {
	it('creates a 429 error with retryAfter in details', () => {
		const err = new RateLimitError(60);
		expect(err.statusCode).toBe(429);
		expect(err.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
		expect(err.details).toEqual({ retryAfter: 60 });
	});
});

// ==================== handleError ====================

describe('handleError', () => {
	async function parseJson(response: Response) {
		return response.json();
	}

	it('returns correct status and body for AppError', async () => {
		const err = new NotFoundError('Panelist');
		const response = handleError(err);
		expect(response.status).toBe(404);
		const body = await parseJson(response);
		expect(body.success).toBe(false);
		expect(body.error).toBe(ErrorCode.NOT_FOUND);
		expect(body.message).toContain('Panelist');
		expect(body.correlationId).toBe('test-ray-id-0001');
	});

	it('returns 400 and VALIDATION_ERROR for a ZodError', async () => {
		let zodErr: ZodError;
		try {
			z.string().min(10).parse('short');
		} catch (e) {
			zodErr = e as ZodError;
		}
		const response = handleError(zodErr!);
		expect(response.status).toBe(400);
		const body = await parseJson(response);
		expect(body.success).toBe(false);
		expect(body.error).toBe(ErrorCode.VALIDATION_ERROR);
		expect(body.correlationId).toBe('test-ray-id-0001');
		expect(Array.isArray(body.details)).toBe(true);
	});

	it('returns 500 for an unknown Error', async () => {
		const response = handleError(new Error('Something blew up'));
		expect(response.status).toBe(500);
		const body = await parseJson(response);
		expect(body.success).toBe(false);
		expect(body.error).toBe(ErrorCode.INTERNAL_ERROR);
	});

	it('returns 500 for a non-Error thrown value', async () => {
		const response = handleError('string error');
		expect(response.status).toBe(500);
		const body = await parseJson(response);
		expect(body.success).toBe(false);
		expect(body.error).toBe(ErrorCode.INTERNAL_ERROR);
	});

	it('includes optional context in log (does not throw)', () => {
		expect(() => handleError(new AppError('TEST', 'test', 400), { userId: '123' })).not.toThrow();
	});

	it('includes details in response for AppError with details', async () => {
		const err = new ValidationError('field error', [{ path: 'name', msg: 'required' }]);
		const body = await parseJson(handleError(err));
		expect(body.details).toBeDefined();
	});

	it('does not include details key when AppError has no details', async () => {
		const err = new NotFoundError('Item');
		const body = await parseJson(handleError(err));
		expect(body.details).toBeUndefined();
	});

	it('includes a timestamp ISO string in the response', async () => {
		const body = await parseJson(handleError(new NotFoundError()));
		expect(typeof body.timestamp).toBe('string');
		expect(() => new Date(body.timestamp)).not.toThrow();
	});
});

// ==================== successResponse ====================

describe('successResponse', () => {
	it('returns success: true with data', () => {
		const result = successResponse({ id: '123', name: 'Alice' });
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ id: '123', name: 'Alice' });
	});

	it('does not include correlationId or timestamp by default', () => {
		const result = successResponse({ foo: 'bar' });
		expect(result.correlationId).toBeUndefined();
		expect(result.timestamp).toBeUndefined();
	});

	it('includes correlationId and timestamp when includeMetadata is true', () => {
		const result = successResponse({ foo: 'bar' }, true);
		expect(result.correlationId).toBe('test-ray-id-0001');
		expect(typeof result.timestamp).toBe('string');
	});

	it('works with null data', () => {
		const result = successResponse(null);
		expect(result.success).toBe(true);
		expect(result.data).toBeNull();
	});

	it('works with array data', () => {
		const result = successResponse([1, 2, 3]);
		expect(result.data).toEqual([1, 2, 3]);
	});
});

// ==================== retryOperation ====================

describe('retryOperation', () => {
	it('returns immediately on first-attempt success', async () => {
		const op = vi.fn().mockResolvedValue('ok');
		const result = await retryOperation(op);
		expect(result).toBe('ok');
		expect(op).toHaveBeenCalledTimes(1);
	});

	it('retries and eventually succeeds', async () => {
		const op = vi
			.fn()
			.mockRejectedValueOnce(new Error('transient'))
			.mockRejectedValueOnce(new Error('transient'))
			.mockResolvedValue('success');

		const result = await retryOperation(op, { maxRetries: 3, delayMs: 1 });
		expect(result).toBe('success');
		expect(op).toHaveBeenCalledTimes(3);
	});

	it('throws after exhausting maxRetries', async () => {
		const err = new Error('always fails');
		const op = vi.fn().mockRejectedValue(err);

		await expect(retryOperation(op, { maxRetries: 2, delayMs: 1 })).rejects.toThrow('always fails');
		expect(op).toHaveBeenCalledTimes(3); // initial + 2 retries
	});

	it('does not retry on non-transient AppError (statusCode < 500)', async () => {
		const appErr = new ValidationError('bad input');
		const op = vi.fn().mockRejectedValue(appErr);

		await expect(retryOperation(op, { maxRetries: 3, delayMs: 1 })).rejects.toThrow('bad input');
		// Should have been called only once — no retry for 4xx
		expect(op).toHaveBeenCalledTimes(1);
	});

	it('retries on 5xx AppError', async () => {
		const appErr = new AppError(ErrorCode.INTERNAL_ERROR, 'db down', 503);
		const op = vi
			.fn()
			.mockRejectedValueOnce(appErr)
			.mockResolvedValue('recovered');

		const result = await retryOperation(op, { maxRetries: 2, delayMs: 1 });
		expect(result).toBe('recovered');
		expect(op).toHaveBeenCalledTimes(2);
	});

	it('calls onRetry callback with attempt number and error', async () => {
		const onRetry = vi.fn();
		const op = vi
			.fn()
			.mockRejectedValueOnce(new Error('fail once'))
			.mockResolvedValue('done');

		await retryOperation(op, { maxRetries: 2, delayMs: 1, onRetry });
		expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
	});

	it('uses linear delay when exponentialBackoff is false', async () => {
		// We just verify it doesn't throw and completes
		const op = vi
			.fn()
			.mockRejectedValueOnce(new Error('fail'))
			.mockResolvedValue('ok');

		const result = await retryOperation(op, {
			maxRetries: 2,
			delayMs: 1,
			exponentialBackoff: false,
		});
		expect(result).toBe('ok');
	});
});
