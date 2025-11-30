/**
 * Logger utility for EarnMaze Panel
 * Provides structured logging with different log levels and contexts
 */

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

class Logger {
	private logLevel: LogLevel;
	private context: string;
	private isDevelopment: boolean;

	constructor(context: string = 'App', logLevel: LogLevel = LogLevel.INFO) {
		this.context = context;
		this.logLevel = logLevel;
		this.isDevelopment = process.env.NODE_ENV === 'development' || typeof window !== 'undefined';
	}

	private shouldLog(level: LogLevel): boolean {
		return level >= this.logLevel;
	}

	private formatMessage(level: LogLevel, message: string, data?: LogData): string {
		const timestamp = new Date().toISOString();
		const levelName = LogLevel[level];
		const dataStr = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '';
		return `[${timestamp}] ${levelName} [${this.context}]: ${message}${dataStr}`;
	}

	private log(level: LogLevel, message: string, data?: LogData, userId?: string): void {
		if (!this.shouldLog(level)) return;

		const logEntry: LogEntry = {
			level,
			message,
			context: this.context,
			data,
			timestamp: new Date(),
			userId
		};

		const formattedMessage = this.formatMessage(level, message, data);

		// Console logging for development
		if (this.isDevelopment) {
			switch (level) {
				case LogLevel.DEBUG:
					console.debug(formattedMessage);
					break;
				case LogLevel.INFO:
					console.info(formattedMessage);
					break;
				case LogLevel.WARN:
					console.warn(formattedMessage);
					break;
				case LogLevel.ERROR:
					console.error(formattedMessage);
					break;
			}
		}

		// In production, you might want to send logs to a service
		if (!this.isDevelopment && level >= LogLevel.ERROR) {
			this.sendToLoggingService(logEntry);
		}
	}

	private async sendToLoggingService(logEntry: LogEntry): Promise<void> {
		try {
			// This is where you'd send logs to your logging service
			// Example: Sentry, LogRocket, DataDog, etc.
			await fetch('/api/logs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(logEntry)
			});
		} catch (error) {
			console.error('Failed to send log to service:', error);
		}
	}

	debug(message: string, data?: LogData, userId?: string): void {
		this.log(LogLevel.DEBUG, message, data, userId);
	}

	info(message: string, data?: LogData, userId?: string): void {
		this.log(LogLevel.INFO, message, data, userId);
	}

	warn(message: string, data?: LogData, userId?: string): void {
		this.log(LogLevel.WARN, message, data, userId);
	}

	error(message: string, data?: LogData, userId?: string): void {
		this.log(LogLevel.ERROR, message, data, userId);
	}

	// Authentication specific logging methods
	authSuccess(action: string, userId: string, data?: LogData): void {
		const logData = typeof data === 'object' && data !== null ? { userId, ...data } : { userId, data };
		this.info(`Auth Success: ${action}`, logData, userId);
	}

	authFailure(action: string, error: string, data?: LogData): void {
		const logData = typeof data === 'object' && data !== null ? { error, ...data } : { error, data };
		this.error(`Auth Failure: ${action}`, logData);
	}

	authAttempt(action: string, email?: string): void {
		this.info(`Auth Attempt: ${action}`, { email: email ? this.maskEmail(email) : undefined });
	}

	private maskEmail(email: string): string {
		const [local, domain] = email.split('@');
		if (local.length <= 2) return `${local}***@${domain}`;
		return `${local.substring(0, 2)}***@${domain}`;
	}

	// Performance logging
	performance(operation: string, duration: number, data?: LogData): void {
		const logData = typeof data === 'object' && data !== null ? { duration: `${duration}ms`, ...data } : { duration: `${duration}ms`, data };
		this.info(`Performance: ${operation}`, logData);
	}

	// User action logging
	userAction(action: string, userId: string, data?: LogData): void {
		const logData = typeof data === 'object' && data !== null ? { userId, ...data } : { userId, data };
		this.info(`User Action: ${action}`, logData, userId);
	}

	// API call logging
	apiCall(method: string, endpoint: string, status: number, duration?: number): void {
		const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
		this.log(level, `API Call: ${method} ${endpoint}`, { 
			status, 
			duration: duration ? `${duration}ms` : undefined 
		});
	}
}

// Create logger instances for different contexts
export const createLogger = (context: string, logLevel?: LogLevel): Logger => {
	return new Logger(context, logLevel);
};

// Pre-configured loggers for common use cases
export const authLogger = createLogger('Auth');
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('Database');
export const appLogger = createLogger('App');

// Default export
export default Logger;
