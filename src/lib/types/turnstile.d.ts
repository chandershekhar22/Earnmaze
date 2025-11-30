// Cloudflare Turnstile TypeScript definitions

interface TurnstileOptions {
	sitekey: string;
	action?: string;
	cData?: string;
	callback?: (token: string) => void;
	'error-callback'?: () => void;
	'expired-callback'?: () => void;
	'timeout-callback'?: () => void;
	theme?: 'light' | 'dark' | 'auto';
	size?: 'normal' | 'compact';
	tabindex?: number;
	appearance?: 'always' | 'execute' | 'interaction-only';
	'response-field'?: boolean;
	'response-field-name'?: string;
	retry?: 'auto' | 'never';
	'retry-interval'?: number;
	language?: string;
}

interface Turnstile {
	render(container: string | HTMLElement, options: TurnstileOptions): string;
	reset(widgetId: string): void;
	remove(widgetId: string): void;
	getResponse(widgetId: string): string | undefined;
	execute(widgetId: string): void;
}

interface Window {
	turnstile?: Turnstile;
}
