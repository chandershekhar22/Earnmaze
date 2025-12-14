/**
 * Logger utility for EarnMaze Panel
 * Re-implemented on top of pino for structured, fast logging.
 */

import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
}

export type LogData = Record<string, unknown> | string | number | boolean | null | undefined;

export interface LogEntry {
	level: LogLevel;
	message: string;
	context?: string;
	data?: LogData;
	timestamp: Date;
	userId?: string;
}

const isDev = process.env.NODE_ENV !== 'production';

const baseOptions: LoggerOptions = {
	level: isDev ? 'debug' : 'info',
	transport: isDev
		? {
			target: 'pino-pretty',
			options: {
				colorize: true,
				singleLine: true,
				translateTime: 'SYS:standard'
			}
		}
		: undefined
};

function levelToPino(level?: LogLevel): pino.LevelWithSilent {
	if (level === LogLevel.DEBUG) return 'debug';
	if (level === LogLevel.WARN) return 'warn';
	if (level === LogLevel.ERROR) return 'error';
	return 'info';
}

class Logger {
	private logger: PinoLogger;

	constructor(context: string = 'App', logLevel: LogLevel = LogLevel.INFO) {
		this.logger = pino({
			...baseOptions,
			level: levelToPino(logLevel),
			base: { context }
		});
	}

	private normalize(data?: LogData): unknown {
		if (data === undefined) return undefined;
		if (data !== null && typeof data === 'object') return data;
		return { data };
	}

	debug(message: string, data?: LogData, userId?: string): void {
		this.logger.debug({ userId, data: this.normalize(data) }, message);
	}

	info(message: string, data?: LogData, userId?: string): void {
		this.logger.info({ userId, data: this.normalize(data) }, message);
	}

	warn(message: string, data?: LogData, userId?: string): void {
		this.logger.warn({ userId, data: this.normalize(data) }, message);
	}

	error(message: string, data?: LogData, userId?: string): void {
		this.logger.error({ userId, data: this.normalize(data) }, message);
	}

	authSuccess(action: string, userId: string, data?: LogData): void {
		const payload = this.normalize(data);
		this.info(`Auth Success: ${action}`, { userId, ...((payload as Record<string, unknown>) || {}) }, userId);
	}

	authFailure(action: string, error: string, data?: LogData): void {
		const payload = this.normalize(data);
		this.error(`Auth Failure: ${action}`, { error, ...((payload as Record<string, unknown>) || {}) });
	}

	authAttempt(action: string, email?: string): void {
		this.info(`Auth Attempt: ${action}`, { email: email ? this.maskEmail(email) : undefined });
	}

	private maskEmail(email: string): string {
		const [local, domain] = email.split('@');
		if (!domain) return '***';
		if (local.length <= 2) return `${local}***@${domain}`;
		return `${local.substring(0, 2)}***@${domain}`;
	}

	performance(operation: string, duration: number, data?: LogData): void {
		const payload = this.normalize(data) as Record<string, unknown> | undefined;
		this.info(`Performance: ${operation}`, { duration: `${duration}ms`, ...(payload || {}) });
	}

	userAction(action: string, userId: string, data?: LogData): void {
		const payload = this.normalize(data) as Record<string, unknown> | undefined;
		this.info(`User Action: ${action}`, { userId, ...(payload || {}) }, userId);
	}

	apiCall(method: string, endpoint: string, status: number, duration?: number): void {
		const level = status >= 400 ? 'error' : 'info';
		const meta = {
			status,
			duration: duration ? `${duration}ms` : undefined
		};
		(this.logger as any)[level]({ data: meta }, `API Call: ${method} ${endpoint}`);
	}
}

export const createLogger = (context: string, logLevel?: LogLevel): Logger => {
	return new Logger(context, logLevel);
};

export const authLogger = createLogger('Auth');
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('Database');
export const appLogger = createLogger('App');

export default Logger;
