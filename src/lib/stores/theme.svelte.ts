import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

class ThemeStore {
	current = $state<Theme>('system');

	initialize() {
		if (browser) {
			const savedTheme = localStorage.getItem('theme') as Theme;
			if (savedTheme) {
				this.current = savedTheme;
				this.applyTheme(savedTheme);
			} else {
				// Check system preference
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				const systemTheme = prefersDark ? 'dark' : 'light';
				this.current = 'system';
				this.applyTheme(systemTheme);
			}
		}
	}

	setTheme(theme: Theme) {
		if (browser) {
			localStorage.setItem('theme', theme);
			this.current = theme;
			this.applyTheme(theme);
		}
	}

	toggle() {
		const currentTheme = this.getAppliedTheme(); // Get the actual applied theme
		const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
		if (browser) {
			localStorage.setItem('theme', newTheme);
			this.applyTheme(newTheme);
		}
		this.current = newTheme;
	}

	applyTheme(theme: Theme) {
		if (!browser) return;

		const root = document.documentElement;

		if (theme === 'dark') {
			root.classList.add('dark');
		} else if (theme === 'light') {
			root.classList.remove('dark');
		} else {
			// system
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (prefersDark) {
				root.classList.add('dark');
			} else {
				root.classList.remove('dark');
			}
		}
	}

	// Get the actual applied theme (resolves 'system' to 'light' or 'dark')
	getAppliedTheme(): 'light' | 'dark' {
		if (!browser) return 'light';

		const theme = localStorage.getItem('theme') as Theme || 'system';
		if (theme === 'system') {
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		return theme;
	}
}

export const themeStore = new ThemeStore();