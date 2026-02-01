/**
 * Database Transaction Helpers and Optimizations
 * Connection pooling, transactions, and caching
 */

import { db } from '$lib/db';
import { Logger } from '$lib/utils/app-logger';

// ==================== Transaction Wrapper ====================

/**
 * Execute operation within a database transaction
 */
export async function withTransaction<T>(
	operation: (tx: typeof db) => Promise<T>,
	options?: {
		onError?: (error: any) => void;
		maxRetries?: number;
	}
): Promise<T> {
	const { onError, maxRetries = 0 } = options || {};
	let attempts = 0;

	while (attempts <= maxRetries) {
		try {
			// Drizzle ORM transaction
			const result = await db.transaction(async (tx) => {
				return await operation(tx as any);
			});

			return result;
		} catch (error) {
			attempts++;

			if (onError) {
				onError(error);
			}

			// Check if error is retriable (deadlock, serialization failure)
			const isRetriable = 
				error instanceof Error &&
				(error.message.includes('deadlock') ||
				 error.message.includes('serialization') ||
				 error.message.includes('could not serialize'));

			if (isRetriable && attempts <= maxRetries) {
				const delay = Math.min(100 * Math.pow(2, attempts), 1000);
				Logger.root.warn(
					{ context: 'database', attempt: attempts, maxRetries, delay },
					'Retrying transaction after retriable error'
				);
				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}

			Logger.root.error(
				{ context: 'database', error: error instanceof Error ? error.message : String(error) },
				'Transaction failed'
			);
			throw error;
		}
	}

	throw new Error('Transaction failed after max retries');
}

// ==================== Query Result Caching ====================

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

class QueryCache {
	private cache = new Map<string, CacheEntry<any>>();
	private stats = {
		hits: 0,
		misses: 0,
		sets: 0
	};

	/**
	 * Get cached result
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		
		if (!entry) {
			this.stats.misses++;
			return null;
		}

		// Check if expired
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			this.stats.misses++;
			return null;
		}

		this.stats.hits++;
		return entry.data;
	}

	/**
	 * Set cache entry
	 */
	set<T>(key: string, data: T, ttlMs: number = 60000): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: ttlMs
		});
		this.stats.sets++;
	}

	/**
	 * Invalidate cache entry
	 */
	invalidate(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * Invalidate by pattern
	 */
	invalidatePattern(pattern: string): void {
		const regex = new RegExp(pattern);
		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Clear all cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get cache statistics
	 */
	getStats() {
		const total = this.stats.hits + this.stats.misses;
		return {
			...this.stats,
			size: this.cache.size,
			hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
		};
	}
}

export const queryCache = new QueryCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	let cleaned = 0;

	for (const [key, entry] of queryCache['cache'].entries()) {
		if (now - entry.timestamp > entry.ttl) {
			queryCache.invalidate(key);
			cleaned++;
		}
	}

	if (cleaned > 0) {
		Logger.root.debug(
			{ context: 'database', cleaned },
			'Cleaned expired cache entries'
		);
	}
}, 5 * 60 * 1000);

/**
 * Execute query with caching
 */
export async function cachedQuery<T>(
	key: string,
	query: () => Promise<T>,
	ttlMs: number = 60000
): Promise<T> {
	// Check cache
	const cached = queryCache.get<T>(key);
	if (cached !== null) {
		return cached;
	}

	// Execute query
	const result = await query();

	// Cache result
	queryCache.set(key, result, ttlMs);

	return result;
}

// ==================== Database Indexes ====================

/**
 * Database index recommendations (execute these in migrations)
 */
export const INDEX_RECOMMENDATIONS = `
-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_user_type ON "user"(user_type);
CREATE INDEX IF NOT EXISTS idx_user_is_active ON "user"(is_active);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "user"(created_at);

-- Session table indexes
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"(user_id);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON "session"(expires_at);

-- Survey transaction indexes
CREATE INDEX IF NOT EXISTS idx_survey_transaction_user_id ON survey_transaction(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_transaction_survey_id ON survey_transaction(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_transaction_status ON survey_transaction(status);
CREATE INDEX IF NOT EXISTS idx_survey_transaction_started_at ON survey_transaction(started_at);
CREATE INDEX IF NOT EXISTS idx_survey_transaction_completed_at ON survey_transaction(completed_at);

-- Panelist points indexes
CREATE INDEX IF NOT EXISTS idx_panelist_point_panelist_id ON panelist_point(panelist_id);

-- Points transactions indexes
CREATE INDEX IF NOT EXISTS idx_points_transactions_panelist_id ON points_transactions(panelist_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);

-- Guest sessions indexes
CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_email ON guest_sessions(email);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires_at ON guest_sessions(expires_at);

-- Guest upgrade verifications indexes
CREATE INDEX IF NOT EXISTS idx_guest_upgrade_verifications_email ON guest_upgrade_verifications(email);
CREATE INDEX IF NOT EXISTS idx_guest_upgrade_verifications_token ON guest_upgrade_verifications(upgrade_token);
CREATE INDEX IF NOT EXISTS idx_guest_upgrade_verifications_otp_expires ON guest_upgrade_verifications(otp_expires_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_page_visits_visitor_id ON page_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_cta_clicks_visitor_id ON cta_clicks(visitor_id);
CREATE INDEX IF NOT EXISTS idx_cta_clicks_session_id ON cta_clicks(session_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_survey_transaction_user_status ON survey_transaction(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_type_active ON "user"(user_type, is_active);
`;

// ==================== Connection Pool Configuration ====================

/**
 * Database connection pool configuration
 * Add to DATABASE_URL: ?pool_timeout=10&connection_limit=10
 * 
 * Recommended settings:
 * - connection_limit: 10-20 for most applications
 * - pool_timeout: 10 seconds
 * - statement_timeout: 30 seconds
 * - idle_in_transaction_session_timeout: 60 seconds
 */
export const POOL_CONFIG = {
	max: 20, // Maximum number of connections
	min: 2, // Minimum number of connections
	idleTimeoutMillis: 30000, // 30 seconds
	connectionTimeoutMillis: 10000 // 10 seconds
};

// ==================== Query Performance Monitoring ====================

/**
 * Monitor slow queries
 */
export async function monitorQuery<T>(
	queryName: string,
	query: () => Promise<T>,
	slowThresholdMs: number = 1000
): Promise<T> {
	const start = Date.now();

	try {
		const result = await query();
		const duration = Date.now() - start;

		if (duration > slowThresholdMs) {
			Logger.root.warn(
				{ context: 'database', queryName, duration },
				'Slow query detected'
			);
		} else {
			Logger.root.debug(
				{ context: 'database', queryName, duration },
				'Query executed'
			);
		}

		return result;
	} catch (error) {
		const duration = Date.now() - start;
		Logger.root.error(
			{ context: 'database', queryName, duration, error: error instanceof Error ? error.message : String(error) },
			'Query failed'
		);
		throw error;
	}
}
