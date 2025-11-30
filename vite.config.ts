import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		host: true,
		allowedHosts: [
			'localhost',
			'delicate-guppy-ultimate.ngrok-free.app'
		]
	},
	ssr: {
		noExternal: []
	},
	optimizeDeps: {
		exclude: ['$lib/db', '$lib/server']
	}
});
