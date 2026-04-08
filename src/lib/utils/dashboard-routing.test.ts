/**
 * Tests for dashboard routing utilities (dashboard-routing.ts)
 * Covers: getDashboardUrl, canAccessRoute, getRoleName
 */

import { describe, it, expect } from 'vitest';
import {
	getDashboardUrl,
	canAccessRoute,
	getRoleName,
} from '$lib/utils/dashboard-routing';

// ==================== getDashboardUrl ====================

describe('getDashboardUrl', () => {
	it('returns /admin/dashboard for admin', () => {
		expect(getDashboardUrl('admin')).toBe('/admin/dashboard');
	});

	it('returns /dashboard for panelist', () => {
		expect(getDashboardUrl('panelist')).toBe('/dashboard');
	});

	it('returns /client/dashboard for client', () => {
		expect(getDashboardUrl('client')).toBe('/client/dashboard');
	});

	it('returns /moderator/dashboard for moderator', () => {
		expect(getDashboardUrl('moderator')).toBe('/moderator/dashboard');
	});

	it('returns /dashboard for unknown user type', () => {
		expect(getDashboardUrl('unknown')).toBe('/dashboard');
		expect(getDashboardUrl('')).toBe('/dashboard');
	});
});

// ==================== canAccessRoute ====================

describe('canAccessRoute — admin (can access everything)', () => {
	it('can access /admin/dashboard', () => {
		expect(canAccessRoute('admin', '/admin/dashboard')).toBe(true);
	});

	it('can access /admin/users', () => {
		expect(canAccessRoute('admin', '/admin/users')).toBe(true);
	});

	it('can access /dashboard (panelist route)', () => {
		expect(canAccessRoute('admin', '/dashboard')).toBe(true);
	});

	it('can access /client/dashboard', () => {
		expect(canAccessRoute('admin', '/client/dashboard')).toBe(true);
	});

	it('can access /moderator/panel', () => {
		expect(canAccessRoute('admin', '/moderator/panel')).toBe(true);
	});

	it('can access /surveys', () => {
		expect(canAccessRoute('admin', '/surveys')).toBe(true);
	});
});

describe('canAccessRoute — panelist', () => {
	it('can access /dashboard', () => {
		expect(canAccessRoute('panelist', '/dashboard')).toBe(true);
	});

	it('can access /surveys', () => {
		expect(canAccessRoute('panelist', '/surveys')).toBe(true);
	});

	it('can access /profile', () => {
		expect(canAccessRoute('panelist', '/profile')).toBe(true);
	});

	it('can access /points', () => {
		expect(canAccessRoute('panelist', '/points')).toBe(true);
	});

	it('can access /history', () => {
		expect(canAccessRoute('panelist', '/history')).toBe(true);
	});

	it('can access /rewards', () => {
		expect(canAccessRoute('panelist', '/rewards')).toBe(true);
	});

	it('cannot access /admin routes', () => {
		expect(canAccessRoute('panelist', '/admin/dashboard')).toBe(false);
		expect(canAccessRoute('panelist', '/admin/users')).toBe(false);
	});

	it('cannot access /client routes', () => {
		expect(canAccessRoute('panelist', '/client/dashboard')).toBe(false);
	});

	it('cannot access /moderator routes', () => {
		expect(canAccessRoute('panelist', '/moderator/panel')).toBe(false);
	});
});

describe('canAccessRoute — client', () => {
	it('can access /client/dashboard', () => {
		expect(canAccessRoute('client', '/client/dashboard')).toBe(true);
	});

	it('can access /client/surveys', () => {
		expect(canAccessRoute('client', '/client/surveys')).toBe(true);
	});

	it('cannot access /admin routes', () => {
		expect(canAccessRoute('client', '/admin/dashboard')).toBe(false);
	});

	it('cannot access /moderator routes', () => {
		expect(canAccessRoute('client', '/moderator/panel')).toBe(false);
	});

	it('can access public / root route', () => {
		expect(canAccessRoute('client', '/')).toBe(true);
	});
});

describe('canAccessRoute — moderator', () => {
	it('can access /moderator/panel', () => {
		expect(canAccessRoute('moderator', '/moderator/panel')).toBe(true);
	});

	it('cannot access /admin routes', () => {
		expect(canAccessRoute('moderator', '/admin/dashboard')).toBe(false);
	});

	it('cannot access /client routes', () => {
		expect(canAccessRoute('moderator', '/client/dashboard')).toBe(false);
	});

	it('can access public routes', () => {
		expect(canAccessRoute('moderator', '/login')).toBe(true);
		expect(canAccessRoute('moderator', '/')).toBe(true);
	});
});

describe('canAccessRoute — public routes', () => {
	it('allows any user type to access /login', () => {
		for (const role of ['admin', 'panelist', 'client', 'moderator', 'unknown']) {
			expect(canAccessRoute(role, '/login')).toBe(true);
		}
	});

	it('allows any user type to access /', () => {
		for (const role of ['admin', 'panelist', 'client', 'moderator']) {
			expect(canAccessRoute(role, '/')).toBe(true);
		}
	});

	it('allows any user type to access /register', () => {
		for (const role of ['admin', 'panelist', 'client']) {
			expect(canAccessRoute(role, '/register')).toBe(true);
		}
	});
});

// ==================== getRoleName ====================

describe('getRoleName', () => {
	it('returns Administrator for admin', () => {
		expect(getRoleName('admin')).toBe('Administrator');
	});

	it('returns Panelist for panelist', () => {
		expect(getRoleName('panelist')).toBe('Panelist');
	});

	it('returns Client for client', () => {
		expect(getRoleName('client')).toBe('Client');
	});

	it('returns Moderator for moderator', () => {
		expect(getRoleName('moderator')).toBe('Moderator');
	});

	it('returns User for unknown type', () => {
		expect(getRoleName('unknown')).toBe('User');
		expect(getRoleName('')).toBe('User');
	});
});
