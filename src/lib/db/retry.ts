import { Logger } from '$lib/utils/app-logger';

export interface RetryOptions {
	maxAttempts?: number;
	initialDelayMs?: number;
	backoffMultiplier?: number;
	maxDelayMs?: number;
}

/**
 * Retry wrapper for database operations with exponential backoff
 * Handles transient connection failures gracefully
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	operation: string,
	options: RetryOptions = {}
): Promise<T> {
	const {
		maxAttempts = 3,
		initialDelayMs = 100,
		backoffMultiplier = 2,
		maxDelayMs = 5000,
	} = options;

	let lastError: Error | undefined;
	let delayMs = initialDelayMs;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Check if error is retriable
			const isRetriable = isRetriableError(lastError);

			if (!isRetriable || attempt === maxAttempts) {
				Logger.root.error(
					{
						context: 'database',
						operation,
						attempt,
						maxAttempts,
						retriable: isRetriable,
						error: lastError.message,
					},
					`Database operation failed: ${operation}`
				);
				throw lastError;
			}

			// Log retry attempt
			Logger.root.warn(
				{
					context: 'database',
					operation,
					attempt,
					nextRetryMs: delayMs,
					error: lastError.message,
				},
				`Retrying database operation: ${operation}`
			);

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delayMs));
			delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
		}
	}

	throw lastError || new Error(`Database operation failed after ${maxAttempts} attempts: ${operation}`);
}

/**
 * Determine if an error is retriable (transient vs permanent)
 */
function isRetriableError(error: Error): boolean {
	const message = error.message.toLowerCase();

	// Connection-related errors (retriable)
	if (
		message.includes('connection') ||
		message.includes('timeout') ||
		message.includes('connect') ||
		message.includes('network') ||
		message.includes('econnrefused') ||
		message.includes('econnreset') ||
		message.includes('pool')
	) {
		return true;
	}

	// PostgreSQL error codes that are transient
	if (error instanceof Error && 'code' in error) {
		const code = (error as any).code;
		// Connection errors
		if (['08000', '08003', '08006', '57P03', '40P01', '40001'].includes(code)) {
			return true;
		}
	}

	return false;
}
