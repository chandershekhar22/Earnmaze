import pino, { type Logger as PinoLogger, type LoggerOptions, multistream } from 'pino';
import { browser, dev } from '$app/environment';
import type { ClientLogLevel, ClientLogPayload } from '$types/logging';

export type LogData = Record<string, unknown> | string | number | boolean | null | undefined;

const isDev = dev;
const logLevel = browser ? 'error' : isDev ? 'debug' : 'info';
const transport = !browser && isDev
	? {
		target: 'pino-pretty',
		options: {
			colorize: true,
			singleLine: true,
			translateTime: 'SYS:standard'
		}
	}
	: undefined;

const enableRabbit = !browser && typeof process !== 'undefined' && Boolean(process.env.RABBITMQ_URL);
const rabbitQueue = !browser && typeof process !== 'undefined' ? (process.env.RABBITMQ_LOG_QUEUE || 'app-logs') : 'app-logs';

const baseOptions: LoggerOptions = {
	level: logLevel,
	base: { app: 'em-panel' },
	transport
};

// Lightweight RabbitMQ publisher (fire-and-forget). Only active server-side when RABBITMQ_URL is set.
let rabbitInit: Promise<any> | null = null;
let rabbitChannel: any = null;

const ensureRabbit = async () => {
	if (rabbitChannel) return rabbitChannel;
	if (!rabbitInit) {
		rabbitInit = (async () => {
			try {
				// Dynamic import to avoid bundling client-side
				// @ts-ignore optional dependency; runtime-only when configured
				const amqp = await import('amqplib');
				const connection = await amqp.connect((typeof process !== 'undefined' ? process.env.RABBITMQ_URL : '') as string);
				const channel = await connection.createChannel();
				await channel.assertQueue(rabbitQueue, { durable: true });
				rabbitChannel = channel;
				return channel;
			} catch (err) {
				console.error('RabbitMQ log transport init failed', err);
				rabbitChannel = null;
				return null;
			}
		})();
	}
	return rabbitInit;
};

const rabbitStream = {
	write: (msg: string) => {
		if (!enableRabbit) return;
		void ensureRabbit().then((channel) => {
			if (!channel) return;
			try {
				channel.sendToQueue(rabbitQueue, Buffer.from(msg), { persistent: true });
			} catch (err) {
				console.error('RabbitMQ log publish failed', err);
			}
		});
	}
};

const streams = browser
	? undefined
	: multistream([
		{ stream: process.stdout },
		...(enableRabbit ? [{ stream: rabbitStream }] : [])
	]);

// Backend logger (server-only transports)
const serverLogger = streams ? pino(baseOptions, streams) : pino(baseOptions);

// Frontend logger (console only, structured objects in browser) with remote posting
const sendClientLog = async (payload: ClientLogPayload) => {
	if (!browser || typeof fetch !== 'function') return;
	try {
		await fetch('/api/logs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	} catch (err) {
		// Swallow to avoid log loops
	}
};

const clientLogger = pino({
	level: logLevel,
	base: { app: 'em-panel', context: 'ui' },
	browser: { asObject: true }
});

if (browser) {
	(['info', 'warn', 'error'] as const).forEach((level) => {
		const original = (clientLogger as any)[level].bind(clientLogger);
		(clientLogger as any)[level] = (obj: any, msg?: string, ...rest: unknown[]) => {
			const message = typeof obj === 'string' && !msg ? obj : msg || '';
			const data = typeof obj === 'object' && obj !== null ? obj : undefined;
			void sendClientLog({
				level: level as ClientLogLevel,
				message: message || 'client-log',
				data: data as Record<string, unknown> | undefined,
				href: typeof window !== 'undefined' ? window.location.href : undefined
			});
			return original(obj, msg, ...rest);
		};
	});
}

// Export both; root resolves to environment-appropriate logger for existing call sites
export const Logger: { root: PinoLogger; server: PinoLogger; client: PinoLogger } = {
	root: browser ? clientLogger : serverLogger,
	server: serverLogger,
	client: clientLogger
};

// Generate a Cloudflare-style Ray ID (16 hex chars: 8 for timestamp seconds + 8 random)
export function generateRayId(): string {
	const timestampHex = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
	const randomHex = (() => {
		const length = 8;
		// Prefer crypto APIs when available (browser or Node)
		if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
			const bytes = new Uint8Array(length / 2);
			crypto.getRandomValues(bytes);
			return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
		}
		if (typeof crypto !== 'undefined') {
			const randomUUID = (crypto as { randomUUID?: () => string }).randomUUID;
			if (typeof randomUUID === 'function') {
				return randomUUID().replace(/-/g, '').slice(0, length);
			}
		}
		// Fallback to Math.random (less secure but acceptable for log correlation)
		return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
	})();
	return `${timestampHex}${randomHex}`;
}

// Create a child logger scoped to a user/session for consistent attribution
export function getUserLogger(userId?: string | null, sessionId?: string | null, data?: LogData): PinoLogger {
	const normalized = normalize(data);
	return Logger.root.child({
		context: 'user',
		userId: userId ?? undefined,
		sessionId: sessionId ?? undefined,
		...normalized
	});
}

// Child logger dedicated to errors with optional correlation/request IDs
export function getErrorLogger(correlationId?: string | null, data?: LogData): PinoLogger {
	const normalized = normalize(data);
	return Logger.root.child({ context: 'errors', correlationId: correlationId ?? undefined, ...normalized });
}

// Helpers
const normalize = (data?: LogData): Record<string, unknown> | undefined => {
	if (data === undefined) return undefined;
	if (data !== null && typeof data === 'object') return data as Record<string, unknown>;
	return { data };
};

// Performance helper
export class Perf {
	private static observations = new Map<string, number>();

	static start(operation: string): string {
		const id = `${operation}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		this.observations.set(id, (typeof performance !== 'undefined' ? performance.now() : Date.now()));
		Logger.root.debug({ context: 'performance', operationId: id }, `Started: ${operation}`);
		return id;
	}

	static end(operationId: string, data?: LogData): void {
		const start = this.observations.get(operationId);
		if (start === undefined) {
			Logger.root.warn({ context: 'performance', operationId }, 'Performance measurement not found');
			return;
		}
		const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
		const duration = now - start;
		this.observations.delete(operationId);

		Logger.root.info({ context: 'performance', operationId, durationMs: Number(duration.toFixed(2)), ...normalize(data) }, 'Completed');

		if (duration > 1000) {
			Logger.root.warn({ context: 'performance', operationId, durationMs: Number(duration.toFixed(2)), thresholdMs: 1000, ...normalize(data) }, 'Slow operation');
		}
	}

	static measure<T>(operation: string, fn: () => T | Promise<T>, data?: LogData): T | Promise<T> {
		const id = this.start(operation);
		const extra = normalize(data);
		try {
			const res = fn();
			if (res instanceof Promise) {
				return res
					.then((value) => {
						this.end(id, { success: true, ...extra });
						return value;
					})
					.catch((err) => {
						this.end(id, { success: false, error: err instanceof Error ? err.message : String(err), ...extra });
						throw err;
					});
			}
			this.end(id, { success: true, ...extra });
			return res;
		} catch (err) {
			this.end(id, { success: false, error: err instanceof Error ? err.message : String(err), ...extra });
			throw err;
		}
	}
}

// Feature tracking (lightweight)
export class Features {
	static trackPageView(path: string, data?: LogData): void {
		Logger.root.info({ context: 'app', path, ...normalize(data) }, 'Page view');
	}

	static trackUserAction(action: string, context?: string, data?: LogData): void {
		Logger.root.info({ context: 'app', action, area: context, ...normalize(data) }, 'User action');
	}
}

// Security logging
export class Security {
	private static mask(identifier?: string): string | undefined {
		if (!identifier) return undefined;
		if (identifier.includes('@')) {
			const [local, domain] = identifier.split('@');
			if (!domain) return '***';
			if (local.length <= 2) return `${local}***@${domain}`;
			return `${local.slice(0, 2)}***@${domain}`;
		}
		return identifier.length <= 6
			? `${identifier.slice(0, 2)}***`
			: `${identifier.slice(0, 3)}***${identifier.slice(-2)}`;
	}

	static logAuthAttempt(type: 'login' | 'register' | 'logout', identifier?: string, success?: boolean, details?: LogData): void {
		Logger.root.info({ context: 'security', type, identifier: this.mask(identifier), success, ...normalize(details) }, 'Auth attempt');
	}

	static logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', details?: LogData): void {
		const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
		(Logger.root as any)[level]({ context: 'security', event, severity, ...normalize(details) }, 'Security event');
	}
}

// Minimal global error hooks (browser only)
export function initializeAppLogging(): void {
	if (!browser) return;

	window.addEventListener('unhandledrejection', (event) => {
		Logger.root.error({ context: 'errors', reason: event.reason, promise: String(event.promise), href: window.location.href }, 'Unhandled promise rejection');
	});

	window.addEventListener('error', (event) => {
		Logger.root.error({ context: 'errors', message: event.message, filename: event.filename, line: event.lineno, column: event.colno, href: window.location.href }, 'Global error');
	});

	Logger.root.info({ context: 'app', environment: dev ? 'development' : 'production' }, 'Application logging initialized');
}

// Aliases for compatibility with existing imports
export const API = {
	request(method: string, url: string, data?: LogData): string {
		const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		Logger.root.info({ context: 'api', requestId, method, url, ...normalize(data) }, 'API request');
		return requestId;
	},

	response(requestId: string, status: number, durationMs: number, data?: LogData): void {
		const level = status >= 400 ? 'error' : 'info';
		(Logger.root as any)[level]({ context: 'api', requestId, status, durationMs, ...normalize(data) }, 'API response');
	},

	error(requestId: string, err: Error, durationMs: number): void {
		Logger.root.error({ context: 'api', requestId, error: err.message, stack: err.stack, durationMs }, 'API error');
	}
};

// Back-compat names (Logger, Perf, Features, Security already exported above)
export const Session = { initialize: () => {}, setUser: () => {} };
// User session tracking
