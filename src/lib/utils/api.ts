/**
 * CSRF-aware fetch wrapper for API calls.
 * Reads the csrf_token cookie and includes it as X-CSRF-Token header
 * on all state-changing requests (POST, PUT, PATCH, DELETE).
 */

function getCsrfToken(): string | null {
	const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
	return match ? decodeURIComponent(match[1]) : null;
}

export async function fetchApi(
	url: string,
	options: RequestInit = {}
): Promise<Response> {
	const method = (options.method || 'GET').toUpperCase();

	if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
		const csrfToken = getCsrfToken();
		if (csrfToken) {
			const headers = new Headers(options.headers);
			headers.set('X-CSRF-Token', csrfToken);
			options.headers = headers;
		}
	}

	return fetch(url, options);
}
