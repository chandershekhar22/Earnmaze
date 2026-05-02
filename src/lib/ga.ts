import { env } from '$env/dynamic/public';

let loaded = false;

export function loadGA() {
	if (loaded || typeof window === 'undefined') return;
	const id = env.PUBLIC_GA_ID;
	if (!id) return;
	loaded = true;

	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
	document.head.appendChild(script);

	const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
	w.dataLayer = w.dataLayer || [];
	w.gtag = function (...args: unknown[]) {
		w.dataLayer.push(args);
	};
	w.gtag('js', new Date());
	w.gtag('config', id, { anonymize_ip: true });
}
