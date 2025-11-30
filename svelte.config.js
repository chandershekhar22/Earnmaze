import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	
	compilerOptions: {
		runes: true
	},

	kit: {
		// Using adapter-node for Node.js/Docker deployment
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			out: 'build',
			precompress: false,
			env: {
				host: 'HOST',
				port: 'PORT',
				path_base: 'BASE_PATH'
			}
		}),
		// CSRF protection
		csrf: {
			// List of trusted origins (in addition to the request origin)
			// Add your production domains here if needed
			// trustedOrigins: ['https://yourdomain.com']
		},
		alias: {
			'$lib': './src/lib',
			'$components': './src/lib/components',
			'$server': './src/lib/server',
			'$db': './src/lib/db',
			'$analytics': './src/lib/analytics',
			'$stores': './src/lib/stores',
			'$types': './src/lib/types',
			'$utils': './src/lib/utils',
			'$validation': './src/lib/validation'
		}
	}
};

export default config;
