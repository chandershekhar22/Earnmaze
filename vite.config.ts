import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
			urlPatterns: [
				// Public pages: locale prefix (default `en` is unprefixed for clean URLs).
				// Example: `/about` for English, `/es/about` for Spanish.
				// Non-base locales must be listed BEFORE the base, otherwise the
				// catch-all `/:path(.*)?` pattern claims `/es/about` as English
				// (path="es/about") and the prefix never gets stripped.
				{
					pattern: '/:path(.*)?',
					localized: [
						['es', '/es/:path(.*)?'],
						['fr', '/fr/:path(.*)?'],
						['pt', '/pt/:path(.*)?'],
						['ar', '/ar/:path(.*)?'],
						['en', '/:path(.*)?']
					]
				}
			],
			cookieName: 'em_locale'
		}),
		sveltekit()
	],
	server: {
		port: 3000,
		host: true,
		allowedHosts: ['localhost', 'delicate-guppy-ultimate.ngrok-free.app']
	},
	ssr: {
		noExternal: []
	},
	optimizeDeps: {
		exclude: ['$lib/db', '$lib/server']
	}
});
