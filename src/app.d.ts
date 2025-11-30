

declare global {
	namespace App {
		interface Locals {
			user?: typeof user.$inferSelect | null;
			session?: {
				id: string;
				userId: string;
				expiresAt: Date;
			} | null;
		}
	}
}

export {};
