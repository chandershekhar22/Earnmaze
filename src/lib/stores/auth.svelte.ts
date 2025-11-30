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
		Logger.auth.info('Login attempt started', { email: credentials.email });
		this.state = { ...this.state, isLoading: true, error: null };
		
		const requestId = API.logRequest('POST', '/api/auth/login');
		const startTime = performance.now();
		
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(credentials)
			});

			const data = await response.json();
			const duration = performance.now() - startTime;
			
			API.logResponse(requestId, response.status, duration, data);

			if (response.ok) {
				Security.logAuthAttempt('login', credentials.email, true);
			Logger.auth.info('Login successful', {
				userId: data.user.id,
				email: credentials.email,
				loginMethod: 'email'
			});
			this.state = { ...this.state, user: data.user, isLoading: false };
			toastStore.success('Welcome back!', `Successfully logged in as ${data.user.name || data.user.email}`);
			
			// Fetch user points after successful login
			pointsStore.fetchPoints();
			
			return { success: true };
		} else {
			Security.logAuthAttempt('login', credentials.email, false);
			Logger.auth.warn('Login failed', {
				email: credentials.email,
				error: data.error,
				statusCode: response.status
			});
			this.state = { ...this.state, error: data.error, isLoading: false };
			toastStore.error('Login Failed', data.error || 'Invalid email or password');
			return { success: false, error: data.error };
		}
	} catch (error) {
		const duration = performance.now() - startTime;
		const errorMessage = 'Network error. Please try again.';
		
		API.logError(requestId, error as Error, duration);
		Logger.auth.error('Login network error', {
			error: error instanceof Error ? error.message : 'Unknown error',
			email: credentials.email,
			duration: `${duration}ms`
		});
		
		this.state = { ...this.state, error: errorMessage, isLoading: false };
		toastStore.error('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
		return { success: false, error: errorMessage };
	}
}

async register(data: RegisterData) {
	Security.logAuthAttempt('register', data.email);
	Logger.auth.info('Registration attempt started', { email: data.email });
	this.state = { ...this.state, isLoading: true, error: null };		const requestId = API.logRequest('POST', '/api/auth/register');
		const startTime = performance.now();
		
		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			const result = await response.json();
			const duration = performance.now() - startTime;
			
			API.logResponse(requestId, response.status, duration, result);

			if (response.ok) {
				Security.logAuthAttempt('register', data.email, true);
				Logger.auth.info('Registration successful', {
					userId: result.user.id,
					email: data.email,
					name: data.name,
					registrationMethod: 'email'
				});
				this.state = { ...this.state, user: result.user, isLoading: false };
				toastStore.success('Account Created!', 'Welcome to EarnMaze! Your account has been created successfully.');
				
				// Fetch user points after successful registration
				pointsStore.fetchPoints();
				
				return { success: true };
			} else {
				Security.logAuthAttempt('register', data.email, false);
				Logger.auth.warn('Registration failed', {
					email: data.email,
					error: result.error,
					statusCode: response.status
				});
				this.state = { ...this.state, error: result.error, isLoading: false };
				toastStore.error('Registration Failed', result.error || 'Failed to create account. Please try again.');
				return { success: false, error: result.error };
			}
		} catch (error) {
			const duration = performance.now() - startTime;
			const errorMessage = 'Network error. Please try again.';
			
			API.logError(requestId, error as Error, duration);
			Logger.auth.error('Registration network error', {
				error: error instanceof Error ? error.message : 'Unknown error',
				email: data.email,
				duration: `${duration}ms`
			});
			
			this.state = { ...this.state, error: errorMessage, isLoading: false };
			toastStore.error('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
			return { success: false, error: errorMessage };
		}
	}

	async logout() {
		Security.logAuthAttempt('logout');
		Logger.auth.info('Logout attempt initiated');
		this.state = { ...this.state, isLoading: true };
		
		const requestId = API.logRequest('POST', '/api/auth/logout');
		const startTime = performance.now();
		
		try {
			const response = await fetch('/api/auth/logout', { method: 'POST' });
			const duration = performance.now() - startTime;
			
			API.logResponse(requestId, response.status, duration);
			Logger.auth.info('Logout completed successfully');
			toastStore.info('Logged Out', 'You have been successfully logged out.');
		} catch (error) {
			const duration = performance.now() - startTime;
			API.logError(requestId, error as Error, duration);
			Logger.auth.error('Logout error', {
				error: error instanceof Error ? error.message : 'Unknown error',
				duration: `${duration}ms`
			});
			toastStore.warning('Logout Issue', 'There was an issue logging out, but you have been signed out locally.');
		}
		
		this.state = { user: null, isLoading: false, error: null };
		// Reset points on logout
		pointsStore.reset();
	}

	async checkAuth() {
		Logger.auth.debug('Checking authentication status');
		this.state = { ...this.state, isLoading: true };
		
		const requestId = API.logRequest('GET', '/api/auth/me');
		const startTime = performance.now();
		
		try {
			const response = await fetch('/api/auth/me');
			const duration = performance.now() - startTime;
			
			API.logResponse(requestId, response.status, duration);
			
			if (response.ok) {
				const data = await response.json();
				if (data.user) {
					Logger.auth.info('Auth check successful', {
						userId: data.user.id,
						role: data.user.role
					});
					this.state = { ...this.state, user: data.user, isLoading: false };
				} else {
					Logger.auth.warn('Auth check returned null user');
					this.state = { ...this.state, user: null, isLoading: false };
				}
			} else {
				Logger.auth.info('Auth check failed - user not authenticated', {
					statusCode: response.status
				});
				this.state = { ...this.state, user: null, isLoading: false };
			}
		} catch (error) {
			const duration = performance.now() - startTime;
			API.logError(requestId, error as Error, duration);
			Logger.auth.error('Auth check network error', {
				error: error instanceof Error ? error.message : 'Unknown error',
				duration: `${duration}ms`
			});
			this.state = { ...this.state, user: null, isLoading: false };
		}
	}

	clearError() {
		Logger.auth.debug('Clearing auth error state');
		this.state = { ...this.state, error: null };
	}

	// Additional utility methods for enhanced logging
	logUserAction(action: string, userId: string, additionalData?: Record<string, unknown>) {
		Logger.auth.info(`User action: ${action}`, { userId, ...additionalData });
	}

	logPerformance(operation: string, duration: number, additionalData?: Record<string, unknown>) {
		Logger.performance.info(`Performance: ${operation}`, { duration: `${duration}ms`, ...additionalData });
	}
}

export const authStore = new AuthStore();
