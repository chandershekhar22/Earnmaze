/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Surfaces — dark with subtle blue tint
				surface: {
					DEFAULT: '#0a0a12',
					50: '#12121c',
					100: '#1a1a27',
					200: '#242433',
					300: '#2e2e3f',
					400: '#3b3b4f',
				},
				// Brand violet
				primary: {
					50: '#f5f3ff',
					100: '#ede9fe',
					200: '#ddd6fe',
					300: '#c4b5fd',
					400: '#a78bfa',
					500: '#8b5cf6',
					600: '#7c3aed',
					700: '#6d28d9',
					800: '#5b21b6',
					900: '#4c1d95',
					950: '#2e1065'
				},
				// Neutrals
				neutral: {
					50: '#fafafa',
					100: '#f5f5f5',
					200: '#e5e5e5',
					300: '#d4d4d4',
					400: '#a3a3a3',
					500: '#737373',
					600: '#525252',
					700: '#404040',
					800: '#262626',
					900: '#171717',
					950: '#0a0a0a'
				},
				// Semantic
				emerald: {
					50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
					400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
					800: '#065f46', 900: '#064e3b'
				},
				amber: {
					50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
					400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
					800: '#92400e', 900: '#78350f'
				},
				rose: {
					50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
					400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
					800: '#9f1239', 900: '#881337'
				}
			},
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
				mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
			},
			boxShadow: {
				'xs': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
				'sm': '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
				'md': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
				'lg': '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
				'xl': '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
				'glow': '0 0 20px -5px rgb(139 92 246 / 0.4)',
				'glow-sm': '0 0 10px -3px rgb(139 92 246 / 0.3)',
				'glow-emerald': '0 0 20px -5px rgb(16 185 129 / 0.4)',
				'glow-pink': '0 0 20px -5px rgb(236 72 153 / 0.4)',
				'glow-cyan': '0 0 20px -5px rgb(6 182 212 / 0.4)',
			},
			borderRadius: {
				'xl': '0.75rem',
				'2xl': '1rem',
				'3xl': '1.5rem',
				'4xl': '2rem'
			},
			animation: {
				'fade-in': 'fadeIn 0.4s ease-out',
				'slide-up': 'slideUp 0.4s ease-out',
				'scale-in': 'scaleIn 0.3s ease-out',
				'shimmer': 'shimmer 2s linear infinite',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { opacity: '0', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				scaleIn: {
					'0%': { opacity: '0', transform: 'scale(0.96)' },
					'100%': { opacity: '1', transform: 'scale(1)' },
				},
				shimmer: {
					'0%': { backgroundPosition: '-200% center' },
					'100%': { backgroundPosition: '200% center' },
				}
			}
		}
	},
	plugins: []
};
