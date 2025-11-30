/**
 * App-wide Logger Configuration
 * Centralized logging setup for the entire EarnMaze Panel application
 */

import { createLogger, LogLevel, type LogData } from './logger';
import { browser, dev } from '$app/environment';

// App-wide logging configuration
export const LOG_CONFIG = {
	// Log levels per environment
	development: {
		console: LogLevel.DEBUG,
		api: LogLevel.ERROR,
		file: LogLevel.INFO
	},
	production: {
		console: LogLevel.ERROR,
		api: LogLevel.WARN,
		file: LogLevel.INFO
	},
	// Feature flags
	enableConsoleLogging: dev || browser,
	enableApiLogging: true,
	enablePerformanceLogging: true,
	enableUserTracking: true,
	// Log retention
	maxLogEntries: 1000,
	logRetentionDays: 30
};

// Get current environment log level
const currentEnv = dev ? 'development' : 'production';
const logLevel = LOG_CONFIG[currentEnv].console;

// Core application loggers
export const AppLoggers = {
	// Authentication & Authorization
	auth: createLogger('Auth', logLevel),
	
	// API & Network
	api: createLogger('API', logLevel),
	network: createLogger('Network', logLevel),
	
	// Database & Storage
	database: createLogger('Database', logLevel),
	storage: createLogger('Storage', logLevel),
	
	// UI & Components
	ui: createLogger('UI', logLevel),
	components: createLogger('Components', logLevel),
	
	// Business Logic
	surveys: createLogger('Surveys', logLevel),
	respondents: createLogger('Respondents', logLevel),
	analytics: createLogger('Analytics', logLevel),
	rewards: createLogger('Rewards', logLevel),
	points: createLogger('Points', logLevel),
	
	// System & Performance
	performance: createLogger('Performance', logLevel),
	security: createLogger('Security', logLevel),
	system: createLogger('System', logLevel),
	
	// Error Handling
	errors: createLogger('Errors', LogLevel.ERROR),
	
	// General Application
	app: createLogger('App', logLevel)
};

// Global error handler with logging
export function setupGlobalErrorHandling() {
	if (!browser) return;

	// Unhandled promise rejections
	window.addEventListener('unhandledrejection', (event) => {
		AppLoggers.errors.error('Unhandled promise rejection', {
			reason: event.reason,
			promise: event.promise,
			url: window.location.href,
			userAgent: navigator.userAgent
		});
	});

	// Global JavaScript errors
	window.addEventListener('error', (event) => {
		AppLoggers.errors.error('Global JavaScript error', {
			message: event.message,
			filename: event.filename,
			line: event.lineno,
			column: event.colno,
			error: event.error?.stack,
			url: window.location.href
		});
	});

	// Resource loading errors
	window.addEventListener('error', (event) => {
		if (event.target !== window) {
			AppLoggers.errors.error('Resource loading error', {
				tagName: (event.target as Element)?.tagName,
				src: (event.target as HTMLImageElement)?.src || (event.target as HTMLScriptElement)?.src,
				url: window.location.href
			});
		}
	}, true);
}

// Performance monitoring utilities
export class PerformanceMonitor {
	private static observations = new Map<string, number>();

	static start(operation: string): string {
		const id = `${operation}_${Date.now()}_${Math.random()}`;
		this.observations.set(id, performance.now());
		AppLoggers.performance.debug(`Started: ${operation}`, { operationId: id });
		return id;
	}

	static end(operationId: string, additionalData?: LogData): void {
		const startTime = this.observations.get(operationId);
		if (!startTime) {
			AppLoggers.performance.warn('Performance measurement not found', { operationId });
			return;
		}

		const duration = performance.now() - startTime;
		const operation = operationId.split('_')[0];
		
		this.observations.delete(operationId);
		
        AppLoggers.performance.info(`Completed: ${operation}`, {
            operationId,
            duration: `${duration.toFixed(2)}ms`,
            ...(typeof additionalData === 'object' && additionalData !== null ? additionalData : { data: additionalData })
        });

		// Log slow operations
		if (duration > 1000) {
			AppLoggers.performance.warn(`Slow operation detected: ${operation}`, {
				duration: `${duration.toFixed(2)}ms`,
				threshold: '1000ms',
				 ...(typeof additionalData === 'object' && additionalData !== null ? additionalData : { data: additionalData })
			});
		}
	}

	static measure<T>(operation: string, fn: () => T | Promise<T>, additionalLogData?: LogData): T | Promise<T> {
		const operationId = this.start(operation);
        const additionalData = (typeof additionalLogData === 'object' && additionalLogData !== null) ? additionalLogData : { data: additionalLogData };

		try {
			const result = fn();
			
			if (result instanceof Promise) {
				return result
					.then((value) => {
						this.end(operationId, { success: true, ...additionalData });
						return value;
					})
					.catch((error) => {
						this.end(operationId, { success: false, error: error.message, ...additionalData });
						throw error;
					});
			} else {
				this.end(operationId, { success: true, ...additionalData });
				return result;
			}
		} catch (error) {
			this.end(operationId, { success: false, error: (error as Error).message, ...additionalData });
			throw error;
		}
	}
}

// User session tracking
export class SessionTracker {
	private static sessionId: string;
	private static userId?: string;

	static initialize(): void {
		if (!browser) return;

		this.sessionId = this.generateSessionId();
		AppLoggers.system.info('Session initialized', {
			sessionId: this.sessionId,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href
		});

		// Track page visibility changes
		document.addEventListener('visibilitychange', () => {
			AppLoggers.ui.info('Page visibility changed', {
				sessionId: this.sessionId,
				hidden: document.hidden,
				visibilityState: document.visibilityState
			});
		});

		// Track page unload
		window.addEventListener('beforeunload', () => {
			AppLoggers.system.info('Session ending', {
				sessionId: this.sessionId,
				duration: Date.now() - parseInt(this.sessionId.split('_')[1])
			});
		});
	}

	static setUser(userId: string): void {
		this.userId = userId;
		AppLoggers.system.info('User session updated', {
			sessionId: this.sessionId,
			userId,
			timestamp: new Date().toISOString()
		});
	}

	static getSessionId(): string {
		return this.sessionId;
	}

	static getUserId(): string | undefined {
		return this.userId;
	}

	private static generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
	}
}

// API call interceptor with logging
export class ApiInterceptor {
	static logRequest(method: string, url: string, data?: LogData): string {
		const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
		
		AppLoggers.api.info(`API Request: ${method} ${url}`, {
			requestId,
			method,
			url,
			data: data ? JSON.stringify(data) : undefined,
			timestamp: new Date().toISOString(),
			sessionId: SessionTracker.getSessionId(),
			userId: SessionTracker.getUserId()
		});

		return requestId;
	}

	static logResponse(requestId: string, status: number, duration: number, data?: LogData): void {
		const logLevel = status >= 400 ? 'error' : 'info';
		
		AppLoggers.api[logLevel](`API Response: ${status}`, {
			requestId,
			status,
			duration: `${duration}ms`,
			data: data ? JSON.stringify(data) : undefined,
			success: status < 400,
			timestamp: new Date().toISOString()
		});
	}

	static logError(requestId: string, error: Error, duration: number): void {
		AppLoggers.api.error('API Error', {
			requestId,
			error: error.message,
			stack: error.stack,
			duration: `${duration}ms`,
			timestamp: new Date().toISOString()
		});
	}
}

// Feature usage tracking
export class FeatureTracker {
	static track(feature: string, action: string, additionalLogData?: LogData): void {
         const additionalData = (typeof additionalLogData === 'object' && additionalLogData !== null) ? additionalLogData : { data: additionalLogData };
		AppLoggers.analytics.info(`Feature: ${feature} - ${action}`, {
			feature,
			action,
			sessionId: SessionTracker.getSessionId(),
			userId: SessionTracker.getUserId(),
			timestamp: new Date().toISOString(),
			url: browser ? window.location.pathname : undefined,
			...additionalData
		});
	}

	static trackPageView(path: string): void {
		AppLoggers.analytics.info('Page view', {
			path,
			sessionId: SessionTracker.getSessionId(),
			userId: SessionTracker.getUserId(),
			timestamp: new Date().toISOString(),
			referrer: browser ? document.referrer : undefined
		});
	}

	static trackUserAction(action: string, context?: string, additionalLogData?: LogData): void {
         const additionalData = (typeof additionalLogData === 'object' && additionalLogData !== null) ? additionalLogData : { data: additionalLogData };
		AppLoggers.analytics.info(`User action: ${action}`, {
			action,
			context,
			sessionId: SessionTracker.getSessionId(),
			userId: SessionTracker.getUserId(),
			timestamp: new Date().toISOString(),
			...additionalData
		});
	}
}

// Security event logging
export class SecurityLogger {
	static logAuthAttempt(type: 'login' | 'register' | 'logout', email?: string, success?: boolean): void {
		AppLoggers.security.info(`Auth attempt: ${type}`, {
			type,
			email: email ? this.maskEmail(email) : undefined,
			success,
			sessionId: SessionTracker.getSessionId(),
			timestamp: new Date().toISOString(),
			ip: browser ? this.getClientIP() : undefined,
			userAgent: browser ? navigator.userAgent : undefined
		});
	}

	static logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', details?: LogData): void {
		const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
        const additionalData = (typeof details === 'object' && details !== null) ? details : { data: details };

		AppLoggers.security[logLevel](`Security event: ${event}`, {
			event,
			severity,
			sessionId: SessionTracker.getSessionId(),
			userId: SessionTracker.getUserId(),
			timestamp: new Date().toISOString(),
			...additionalData
		});
	}

	private static maskEmail(email: string): string {
		const [local, domain] = email.split('@');
		if (local.length <= 2) return `${local}***@${domain}`;
		return `${local.substring(0, 2)}***@${domain}`;
	}

	private static getClientIP(): string {
		// This would need to be implemented server-side
		return 'client-side';
	}
}

// Initialize app-wide logging
export function initializeAppLogging(): void {
	if (!browser) return;

	SessionTracker.initialize();
	setupGlobalErrorHandling();
	
	AppLoggers.app.info('Application logging initialized', {
		environment: dev ? 'development' : 'production',
		logLevel: LogLevel[logLevel],
		config: LOG_CONFIG,
		timestamp: new Date().toISOString()
	});
}

// Export everything for easy access
export {
	AppLoggers as Logger,
	PerformanceMonitor as Perf,
	SessionTracker as Session,
	ApiInterceptor as API,
	FeatureTracker as Features,
	SecurityLogger as Security
};
