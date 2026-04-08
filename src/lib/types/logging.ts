export type ClientLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ClientLogPayload {
	level: ClientLogLevel;
	message: string;
	data?: Record<string, unknown> | null;
	href?: string;
	sessionId?: string;
	userId?: string;
	file?: string;
	line?: number;
	column?: number;
}
