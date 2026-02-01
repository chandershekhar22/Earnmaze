

declare global {
	namespace App {
		interface Locals {
			user?: typeof user.$inferSelect | null;
			session?: {
				id: string;
				userId: string;
				expiresAt: Date;
			} | null;
			correlationId?: string;
			rateLimitHeaders?: {
				'X-RateLimit-Limit': string;
				'X-RateLimit-Remaining': string;
				'X-RateLimit-Reset': string;
			};
		}
	}
}

export {};
