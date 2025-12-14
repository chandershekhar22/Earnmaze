import type { AuthState, LoginCredentials, RegisterData } from '$lib/types/auth';
import { Logger, API, Security } from '$lib/utils/app-logger';
import { toastStore } from './toast.svelte';
import { pointsStore } from './points.svelte';

class AuthStore {
	state = $state<AuthState>({
		user: null,
		isLoading: false,
		error: null
	});

	async login(credentials: LoginCredentials) {
		Security.logAuthAttempt('login', credentials.email);
		Logger.root.info({ context: 'auth', email: credentials.email }, 'Login attempt started');
		this.state = { ...this.state, isLoading: true, error: null };

		const requestId = API.request('POST', '/api/auth/login');
		const startTime = performance.now();

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(credentials)
			});

			const data = await response.json();
			const duration = performance.now() - startTime;

			API.response(requestId, response.status, duration, data);

			if (response.ok) {
				Security.logAuthAttempt('login', credentials.email, true);
				Logger.root.info({ context: 'auth', userId: data.user.id, email: credentials.email, loginMethod: 'email' }, 'Login successful');
				this.state = { ...this.state, user: data.user, isLoading: false };
				toastStore.success('Welcome back!', `Successfully logged in as ${data.user.name || data.user.email}`);

				pointsStore.fetchPoints();

				return { success: true };
			}

			Security.logAuthAttempt('login', credentials.email, false);
			Logger.root.warn({ context: 'auth', email: credentials.email, error: data.error, statusCode: response.status }, 'Login failed');
			this.state = { ...this.state, error: data.error, isLoading: false };
			toastStore.error('Login Failed', data.error || 'Invalid email or password');
			return { success: false, error: data.error };
		} catch (error) {
			const duration = performance.now() - startTime;
			const errorMessage = 'Network error. Please try again.';

			API.error(requestId, error as Error, duration);
			Logger.root.error({ context: 'errors', error: error instanceof Error ? error.message : 'Unknown error', email: credentials.email, duration: `${duration}ms` }, 'Login network error');

			this.state = { ...this.state, error: errorMessage, isLoading: false };
			toastStore.error('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
			return { success: false, error: errorMessage };
		}
	}

	async register(data: RegisterData) {
		Security.logAuthAttempt('register', data.email);
		Logger.root.info({ context: 'auth', email: data.email }, 'Registration attempt started');
		this.state = { ...this.state, isLoading: true, error: null };

		const requestId = API.request('POST', '/api/auth/register');
		const startTime = performance.now();

		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			const result = await response.json();
			const duration = performance.now() - startTime;

			API.response(requestId, response.status, duration, result);

			if (response.ok) {
				Security.logAuthAttempt('register', data.email, true);
				Logger.root.info({ context: 'auth', userId: result.user.id, email: data.email, name: data.name, registrationMethod: 'email' }, 'Registration successful');
				this.state = { ...this.state, user: result.user, isLoading: false };
				toastStore.success('Account Created!', 'Welcome to EarnMaze! Your account has been created successfully.');

				pointsStore.fetchPoints();

				return { success: true };
			}

			Security.logAuthAttempt('register', data.email, false);
			Logger.root.warn({ context: 'auth', email: data.email, error: result.error, statusCode: response.status }, 'Registration failed');
			this.state = { ...this.state, error: result.error, isLoading: false };
			toastStore.error('Registration Failed', result.error || 'Failed to create account. Please try again.');
			return { success: false, error: result.error };
		} catch (error) {
			const duration = performance.now() - startTime;
			const errorMessage = 'Network error. Please try again.';

			API.error(requestId, error as Error, duration);
			Logger.root.error({ context: 'errors', error: error instanceof Error ? error.message : 'Unknown error', email: data.email, duration: `${duration}ms` }, 'Registration network error');

			this.state = { ...this.state, error: errorMessage, isLoading: false };
			toastStore.error('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
			return { success: false, error: errorMessage };
		}
	}

	async logout() {
		Security.logAuthAttempt('logout');
		Logger.root.info({ context: 'auth' }, 'Logout attempt initiated');
		this.state = { ...this.state, isLoading: true };

		const requestId = API.request('POST', '/api/auth/logout');
		const startTime = performance.now();

		try {
			const response = await fetch('/api/auth/logout', { method: 'POST' });
			const result = await response.json().catch(() => ({}));
			const duration = performance.now() - startTime;

			API.response(requestId, response.status, duration, result);
			if (response.ok) {
				Logger.root.info({ context: 'auth' }, 'Logout completed successfully');
				toastStore.info('Logged Out', 'You have been successfully logged out.');
			} else {
				Logger.root.warn({ context: 'auth', status: response.status, error: result?.error }, 'Logout returned non-OK status');
				toastStore.warning('Logout Issue', 'There was an issue logging out, but you have been signed out locally.');
			}
		} catch (error) {
			const duration = performance.now() - startTime;
			API.error(requestId, error as Error, duration);
			Logger.root.error({ context: 'errors', error: error instanceof Error ? error.message : 'Unknown error', duration: `${duration}ms` }, 'Logout error');
			toastStore.warning('Logout Issue', 'There was an issue logging out, but you have been signed out locally.');
		}

		this.state = { user: null, isLoading: false, error: null };
		pointsStore.reset();
	}

	async checkAuth() {
		Logger.root.debug({ context: 'auth' }, 'Checking authentication status');
		this.state = { ...this.state, isLoading: true };

		const requestId = API.request('GET', '/api/auth/me');
		const startTime = performance.now();

		try {
			const response = await fetch('/api/auth/me');
			const duration = performance.now() - startTime;

			API.response(requestId, response.status, duration);

			if (response.ok) {
				const data = await response.json();
				if (data.user) {
					Logger.root.info({ context: 'auth', userId: data.user.id, role: data.user.role }, 'Auth check successful');
					this.state = { ...this.state, user: data.user, isLoading: false };
					return;
				}

				Logger.root.warn({ context: 'auth' }, 'Auth check returned null user');
				this.state = { ...this.state, user: null, isLoading: false };
				return;
			}

			Logger.root.info({ context: 'auth', statusCode: response.status }, 'Auth check failed - user not authenticated');
			this.state = { ...this.state, user: null, isLoading: false };
		} catch (error) {
			const duration = performance.now() - startTime;
			API.error(requestId, error as Error, duration);
			Logger.root.error({ context: 'errors', error: error instanceof Error ? error.message : 'Unknown error', duration: `${duration}ms` }, 'Auth check network error');
			this.state = { ...this.state, user: null, isLoading: false };
		}
	}

	clearError() {
		Logger.root.debug({ context: 'auth' }, 'Clearing auth error state');
		this.state = { ...this.state, error: null };
	}

	logUserAction(action: string, userId: string, additionalData?: Record<string, unknown>) {
		Logger.root.info({ context: 'auth', action, userId, ...additionalData }, 'User action');
	}

	logPerformance(operation: string, duration: number, additionalData?: Record<string, unknown>) {
		Logger.root.info({ context: 'performance', operation, durationMs: duration, ...additionalData }, 'Performance metric');
	}
}

export const authStore = new AuthStore();
