<script lang="ts">
	import { onMount } from 'svelte';

	let notifOpen = $state(false);
	let coinCount = $state(2480);

	// Smart survey widget state
	const surveyQs = [
		{ q: 'What matters most when choosing a streaming service?', opts: ['Content library size', 'Monthly price', 'Original shows & movies', 'UI & recommendations'] },
		{ q: 'How many hours per week do you spend on your phone?', opts: ['Less than 2', '2 to 4', '4 to 6', 'More than 6'] },
		{ q: 'Which reward type do you prefer most?', opts: ['PayPal cash', 'Gift cards', 'Crypto', 'Store credit'] }
	];
	let sqIdx = $state(0);
	let swCompleted = $state(false);
	let swSelected = $state<number | null>(null);

	let faqOpen = $state<number>(0);

	function openNotif() { notifOpen = true; }
	function closeNotif() { notifOpen = false; }

	function triggerCoinBurst() {
		const cc = document.createElement('div');
		cc.className = 'confetti-container';
		document.body.appendChild(cc);
		const colors = ['#c7f463', '#7ab8ff', '#ffb74a', '#b48cff', '#7eddb5'];
		for (let i = 0; i < 20; i++) {
			const p = document.createElement('div');
			p.className = 'confetti-piece';
			p.style.left = Math.random() * 100 + '%';
			p.style.background = colors[Math.floor(Math.random() * colors.length)];
			p.style.animationDelay = Math.random() * 0.5 + 's';
			p.style.width = Math.random() * 8 + 4 + 'px';
			p.style.height = Math.random() * 8 + 4 + 'px';
			cc.appendChild(p);
		}
		setTimeout(() => cc.remove(), 2000);
		coinCount += Math.floor(Math.random() * 50 + 10);
	}

	function toggleFaq(i: number) {
		faqOpen = faqOpen === i ? -1 : i;
	}

	function selectPoll(i: number) {
		swSelected = i;
	}

	function nextPollsQ() {
		if (sqIdx >= surveyQs.length - 1) {
			swCompleted = true;
			sqIdx = surveyQs.length;
			return;
		}
		sqIdx++;
		swSelected = null;
	}

	function selectQuizOpt(e: MouseEvent) {
		const el = e.currentTarget as HTMLElement;
		if (el.classList.contains('right')) return;
		el.classList.add('wrong');
		setTimeout(() => el.classList.remove('wrong'), 900);
	}

	function copyRef(e: MouseEvent) {
		const btn = e.currentTarget as HTMLButtonElement;
		const input = document.getElementById('refLink') as HTMLInputElement | null;
		if (input && navigator.clipboard) navigator.clipboard.writeText(input.value);
		btn.textContent = 'Copied';
		setTimeout(() => (btn.textContent = 'Copy'), 1800);
	}

	function switchNotifTab(e: MouseEvent) {
		document.querySelectorAll('.notif-tab').forEach((x) => x.classList.remove('active'));
		(e.currentTarget as HTMLElement).classList.add('active');
	}

	onMount(() => {
		const cleanupFns: Array<() => void> = [];

		// Nav scroll
		const nav = document.getElementById('nav');
		const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 40);
		window.addEventListener('scroll', onScroll);
		cleanupFns.push(() => window.removeEventListener('scroll', onScroll));

		// Reveal
		const rObs = new IntersectionObserver(
			(entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
			{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
		);
		document.querySelectorAll('.reveal').forEach((el) => rObs.observe(el));
		cleanupFns.push(() => rObs.disconnect());

		// Counters
		const fmt = (v: number, s: string) => {
			if (s && s.endsWith('M+')) return v.toFixed(1) + 'M+';
			if (s && s.endsWith('K+')) return Math.round(v) + 'K+';
			return Math.round(v).toLocaleString();
		};
		const cObs = new IntersectionObserver(
			(entries) => entries.forEach((n) => {
				const el = n.target as HTMLElement;
				if (!n.isIntersecting || el.dataset.done) return;
				el.dataset.done = '1';
				const t = parseFloat(el.dataset.count || '0');
				const s = el.dataset.suffix || '';
				const p = el.dataset.prefix || '';
				let st: number | null = null;
				const d = 1800;
				const step = (ts: number) => {
					if (!st) st = ts;
					const k = Math.min((ts - st) / d, 1);
					const v = t * (1 - Math.pow(1 - k, 3));
					el.textContent = p + fmt(v, s);
					if (k < 1) requestAnimationFrame(step);
				};
				requestAnimationFrame(step);
			}),
			{ threshold: 0.4 }
		);
		document.querySelectorAll('[data-count]').forEach((el) => cObs.observe(el));
		cleanupFns.push(() => cObs.disconnect());

		// Chart bars
		const chart = document.getElementById('chart');
		if (chart) {
			const vals = [40, 62, 48, 75, 55, 82, 95];
			vals.forEach((v, i) => {
				const b = document.createElement('div');
				b.className = 'bar' + (i < 3 ? ' muted' : '');
				b.style.height = '0';
				chart.appendChild(b);
				setTimeout(() => (b.style.height = v + '%'), 300 + i * 90);
			});
		}

		// Heatmap
		const heat = document.getElementById('heat');
		if (heat) {
			const lv = ['', 'l1', 'l2', 'l3', 'l4'];
			for (let i = 0; i < 13 * 4; i++) {
				const d = document.createElement('div');
				d.className = 'hc ' + lv[Math.floor(Math.random() * 5)];
				heat.appendChild(d);
			}
		}

		// Calendar
		const g = document.getElementById('calGrid');
		if (g) {
			const p = [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 3, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0];
			for (let i = 0; i < 2; i++) {
				const d = document.createElement('div');
				d.className = 'cd empty';
				g.appendChild(d);
			}
			for (let i = 0; i < 30; i++) {
				const d = document.createElement('div');
				d.className = 'cd';
				d.textContent = String(i + 1);
				if (p[i] === 1) d.classList.add('on');
				else if (p[i] === 2) d.classList.add('bonus');
				else if (p[i] === 3) d.classList.add('today');
				g.appendChild(d);
			}
		}

		// Live toasts
		const liveEl = document.getElementById('live');
		let toastTimer: number | undefined;
		if (liveEl) {
			const names = ['Priya', 'Marcus', 'Sarah', 'Alex', 'Tamika', 'Derek', 'Alyssa', 'James', 'Lisa', 'Ryan', 'Emma', 'Tom'];
			const acts = ['completed a survey · +$1.50', "finished today's quiz · +50 pts", 'claimed a 7-day bonus · +100 pts', 'cashed out $25 to PayPal', 'won 200 coins in Trivia', 'started a new streak', 'reached Lvl 30', 'earned 150 pts on Quiz Sprint', 'unlocked Streak Shield'];
			let li = 0;
			const toast = () => {
				if (liveEl.children.length >= 3) {
					const f = liveEl.firstChild as HTMLElement | null;
					if (f) {
						f.style.opacity = '0';
						setTimeout(() => f.remove(), 300);
					}
				}
				const t = document.createElement('div');
				t.className = 'toast';
				t.innerHTML = `<span class="td"></span><span><strong>${names[li % names.length]}</strong> ${acts[li % acts.length]}</span>`;
				liveEl.appendChild(t);
				li++;
				toastTimer = window.setTimeout(toast, 4500 + Math.random() * 2500);
			};
			toastTimer = window.setTimeout(toast, 2500);
		}
		cleanupFns.push(() => { if (toastTimer) clearTimeout(toastTimer); });

		// Daily bonus timer
		let total = 4 * 3600 + 32 * 60 + 17;
		const tH = document.getElementById('tH');
		const tM = document.getElementById('tM');
		const tS = document.getElementById('tS');
		const tick = () => {
			if (total <= 0) return;
			total--;
			const h = Math.floor(total / 3600);
			const m = Math.floor((total % 3600) / 60);
			const s = total % 60;
			if (tH) tH.textContent = String(h).padStart(2, '0');
			if (tM) tM.textContent = String(m).padStart(2, '0');
			if (tS) tS.textContent = String(s).padStart(2, '0');
		};
		const timerId = window.setInterval(tick, 1000);
		cleanupFns.push(() => clearInterval(timerId));

		return () => cleanupFns.forEach((fn) => fn());
	});
</script>

<svelte:head>
	<title>EarnMaze — Earn Rewards for Your Opinions</title>
	<meta name="description" content="Daily streaks, brain-boosting quizzes, paid surveys, games & exclusive deals — all rewarding you with real, redeemable points." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>
	*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
	:root{
		--bg:#0a0c10; --bg2:#0e1117; --bg3:#141821; --line:rgba(255,255,255,.07); --line2:rgba(255,255,255,.12);
		--t1:#f1f2f5; --t2:#9aa0ad; --t3:#5e6471;
		--acc:#c7f463; --acc-d:#9bd136; --acc-soft:rgba(199,244,99,.12); --acc-text:#0a0c10;
		--warn:#ffb74a; --pos:#7eddb5; --bad:#ff7a8a; --info:#7ab8ff;
		--r1:8px; --r2:12px; --r3:16px; --r4:22px; --r5:999px;
		--f:'Inter',system-ui,-apple-system,sans-serif; --mono:'JetBrains Mono',ui-monospace,monospace;
		--ease:cubic-bezier(.2,.7,.2,1);
		--max:1200px;
	}
	html{scroll-behavior:smooth;background:var(--bg)}
	body{background:var(--bg);color:var(--t1);font-family:var(--f);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
	a{color:inherit;text-decoration:none}
	button{font:inherit;cursor:pointer;border:0;background:0}
	img{display:block;max-width:100%}
	::selection{background:var(--acc);color:#000}
	@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

	.wrap{max-width:var(--max);margin:0 auto;padding:0 28px;position:relative}
	.eyebrow{font-family:var(--mono);font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.18em;color:var(--t2)}
	.eyebrow.acc{color:var(--acc-d)}
	.eyebrow .dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--acc);margin-right:8px;vertical-align:middle;box-shadow:0 0 0 3px var(--acc-soft)}
	.h-display{font-size:clamp(40px,6.2vw,76px);font-weight:600;letter-spacing:-.035em;line-height:.98}
	.h1{font-size:clamp(34px,4.5vw,56px);font-weight:600;letter-spacing:-.025em;line-height:1.04}
	.h2{font-size:clamp(26px,3vw,36px);font-weight:600;letter-spacing:-.02em;line-height:1.1}
	.body-lg{font-size:18px;color:var(--t2);line-height:1.55;max-width:54ch}
	.body-md{font-size:15px;color:var(--t2);line-height:1.6}
	.muted{color:var(--t2)}.tertiary{color:var(--t3)}
	.mono{font-family:var(--mono)}

	.i{width:18px;height:18px;display:inline-block;vertical-align:middle;flex-shrink:0}
	.i-lg{width:24px;height:24px}
	.i-xl{width:28px;height:28px}

	.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:var(--r5);font-weight:600;font-size:14px;transition:all .2s var(--ease);white-space:nowrap;letter-spacing:-.005em}
	.btn-pri{background:var(--acc);color:var(--acc-text)}
	.btn-pri:hover{background:var(--acc-d);transform:translateY(-1px)}
	.btn-sec{background:transparent;color:var(--t1);border:1px solid var(--line2)}
	.btn-sec:hover{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.03)}
	.btn-ghost{padding:8px 14px;color:var(--t2);font-size:13px}
	.btn-ghost:hover{color:var(--t1)}
	.btn-lg{padding:15px 28px;font-size:15px}

	.divider{height:1px;background:var(--line)}

	nav{position:fixed;top:0;left:0;right:0;z-index:100;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);background:rgba(10,12,16,.7);border-bottom:1px solid transparent;transition:border-color .3s,background .3s}
	nav.scrolled{border-bottom-color:var(--line);background:rgba(10,12,16,.85)}
	.nav-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0}
	.brand{display:flex;align-items:center;gap:10px;font-weight:600;font-size:17px;letter-spacing:-.02em}
	.brand-mark{width:28px;height:28px;border-radius:8px;background:var(--acc);display:grid;place-items:center;color:var(--acc-text)}
	.nav-links{display:flex;align-items:center;gap:4px}
	.nav-links a{padding:8px 14px;color:var(--t2);font-size:14px;font-weight:500;border-radius:var(--r5);transition:color .2s}
	.nav-links a:hover{color:var(--t1)}
	.nav-actions{display:flex;align-items:center;gap:8px}
	.coin-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:var(--r5);font-family:var(--mono);font-size:13px;font-weight:600;color:var(--t1);cursor:pointer;transition:.2s}
	.coin-pill:hover{background:rgba(255,255,255,.06)}
	.coin-pill .dot{width:6px;height:6px;border-radius:50%;background:var(--acc)}
	.bell{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.04);border:1px solid var(--line);display:grid;place-items:center;color:var(--t2);position:relative;transition:.2s}
	.bell:hover{color:var(--t1);background:rgba(255,255,255,.06)}
	.bell .pip{position:absolute;top:7px;right:8px;width:7px;height:7px;border-radius:50%;background:var(--bad);border:2px solid var(--bg)}

	/* Notification drawer */
	.notif-drawer{position:fixed;top:0;right:-420px;width:400px;max-width:90vw;height:100vh;background:var(--bg2);border-left:1px solid var(--line);z-index:2000;transition:right .35s var(--ease);overflow-y:auto}
	.notif-drawer.open{right:0}
	.notif-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1999;opacity:0;pointer-events:none;transition:opacity .3s}
	.notif-overlay.open{opacity:1;pointer-events:auto}
	.notif-header{padding:22px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg2);z-index:1}
	.notif-header h3{font-size:15px;font-weight:600}
	.notif-close{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.04);display:grid;place-items:center;color:var(--t2);transition:.2s}
	.notif-close:hover{background:rgba(255,255,255,.08);color:var(--t1)}
	.notif-tabs{display:flex;gap:6px;padding:14px 24px;border-bottom:1px solid var(--line)}
	.notif-tab{padding:6px 14px;border-radius:var(--r5);font-size:12px;font-weight:500;color:var(--t3);background:rgba(255,255,255,.04);transition:.2s}
	.notif-tab.active{background:var(--acc);color:var(--acc-text)}
	.notif-tab:hover:not(.active){background:rgba(255,255,255,.08);color:var(--t2)}
	.notif-list{padding:8px 24px}
	.notif-item{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.04);align-items:flex-start}
	.ni-icon{width:36px;height:36px;border-radius:10px;background:var(--acc-soft);color:var(--acc-d);display:grid;place-items:center;flex-shrink:0}
	.ni-text{flex:1;min-width:0}
	.ni-text strong{display:block;font-size:13px;font-weight:600;margin-bottom:2px}
	.ni-text p{font-size:12px;color:var(--t3);line-height:1.5}
	.ni-time{font-size:11px;color:var(--t3);white-space:nowrap;font-family:var(--mono)}

	/* HERO */
	.hero{padding:140px 0 80px;position:relative;overflow:hidden}
	.hero::before{content:"";position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:1100px;height:600px;background:radial-gradient(closest-side,var(--acc-soft),transparent 70%);filter:blur(60px);pointer-events:none;opacity:.7}
	.hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:80px;align-items:center;position:relative;z-index:1}
	.hero-grid>*{min-width:0}
	.hero-tag{display:inline-flex;align-items:center;gap:10px;padding:6px 14px 6px 8px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:var(--r5);font-size:12px;color:var(--t2);margin-bottom:32px}
	.hero-tag-chip{padding:2px 8px;background:var(--acc-soft);border-radius:var(--r5);font-family:var(--mono);font-size:10px;font-weight:600;color:var(--acc-d);letter-spacing:.05em}
	.hero h1{margin-bottom:24px}
	.hero h1 em{font-style:normal;color:var(--acc)}
	.hero .lead{font-size:18px;color:var(--t2);max-width:480px;margin-bottom:36px}
	.hero-ctas{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:48px}
	.hero-meta{display:flex;gap:48px;padding-top:24px;border-top:1px solid var(--line)}
	.hero-meta-item .v{font-family:var(--mono);font-size:24px;font-weight:600;letter-spacing:-.02em;color:var(--t1)}
	.hero-meta-item .l{font-size:12px;color:var(--t3);margin-top:2px}

	.composition{position:relative;width:100%;aspect-ratio:1/1.05;max-width:520px;margin:0 auto;perspective:1600px}
	.cc{position:absolute;background:linear-gradient(180deg,rgba(28,32,42,.92),rgba(16,19,26,.92));border:1px solid var(--line2);border-radius:18px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 30px 80px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.05);transition:transform .4s var(--ease)}
	.cc:hover{transform:translateY(-4px)}
	.cc-wallet{top:6%;left:8%;width:62%;padding:24px 24px 22px;z-index:2;animation:floatA 7s ease-in-out infinite}
	.cc-wallet .lab{font-family:var(--mono);font-size:10px;color:var(--t3);letter-spacing:.14em;text-transform:uppercase;display:flex;align-items:center;gap:8px}
	.cc-wallet .lab .live{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 4px var(--acc-soft)}
	.cc-wallet .bal{font-family:var(--f);font-size:46px;font-weight:600;letter-spacing:-.04em;line-height:1;margin:14px 0 4px}
	.cc-wallet .bal em{font-style:normal;color:var(--t3);font-size:24px;font-weight:500;letter-spacing:-.02em}
	.cc-wallet .delta{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;color:var(--acc);background:var(--acc-soft);padding:4px 10px;border-radius:var(--r5)}
	.cc-spark{margin-top:14px;height:50px;width:100%;display:block}
	.cc-x{display:flex;justify-content:space-between;margin-top:6px;font-family:var(--mono);font-size:9px;color:var(--t3)}
	.cc-streak{top:38%;right:2%;width:46%;padding:20px;z-index:3;animation:floatB 7s ease-in-out infinite;animation-delay:1.5s;background:linear-gradient(160deg,var(--acc-soft),rgba(16,19,26,.92) 60%)}
	.cc-streak .h{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
	.cc-streak .h .l{font-family:var(--mono);font-size:10px;color:var(--t2);letter-spacing:.12em;text-transform:uppercase}
	.cc-streak .h .ico{width:24px;height:24px;border-radius:7px;background:var(--acc);color:var(--acc-text);display:grid;place-items:center}
	.ring-wrap{position:relative;width:120px;height:120px;margin:6px auto 8px}
	.ring-wrap svg{transform:rotate(-90deg)}
	.ring-wrap .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
	.ring-wrap .c .n{font-family:var(--f);font-size:32px;font-weight:600;letter-spacing:-.03em;line-height:1}
	.ring-wrap .c .u{font-family:var(--mono);font-size:9px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin-top:3px}
	.cc-streak .mult{text-align:center;padding-top:10px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--t2)}
	.cc-streak .mult em{font-style:normal;color:var(--acc);font-weight:600}
	.cc-quiz{bottom:8%;left:0;width:60%;padding:18px 20px;z-index:3;animation:floatA 7s ease-in-out infinite;animation-delay:3s}
	.cc-quiz .l{font-family:var(--mono);font-size:10px;color:var(--acc);letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:8px}
	.cc-quiz .l svg{width:14px;height:14px}
	.cc-quiz .q{font-size:13px;font-weight:600;letter-spacing:-.005em;line-height:1.35;margin-bottom:12px}
	.cc-quiz .opts{display:flex;flex-direction:column;gap:5px}
	.cc-quiz .o{font-size:11px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;color:var(--t2);display:flex;align-items:center;gap:8px}
	.cc-quiz .o .k{font-family:var(--mono);font-size:9px;color:var(--t3);width:14px}
	.cc-quiz .o.right{border-color:var(--acc);background:var(--acc-soft);color:var(--t1)}
	.cc-quiz .o.right .k{color:var(--acc)}
	.cc-quiz .reward{margin-top:10px;font-family:var(--mono);font-size:10px;color:var(--acc);text-align:right}
	.cc-payout{bottom:34%;right:-2%;width:230px;padding:12px 14px;display:flex;align-items:center;gap:10px;z-index:4;animation:floatB 6s ease-in-out infinite;animation-delay:.8s;border-radius:14px}
	.cc-payout .ico{width:32px;height:32px;border-radius:9px;background:var(--acc);color:var(--acc-text);display:grid;place-items:center;flex-shrink:0}
	.cc-payout .t{font-size:12px;font-weight:600}
	.cc-payout .s{font-family:var(--mono);font-size:10px;color:var(--t3);margin-top:1px}
	.cc-payout .v{margin-left:auto;font-family:var(--mono);font-size:13px;font-weight:600;color:var(--acc)}
	.cc-pill{top:0;right:12%;padding:10px 16px;display:flex;align-items:center;gap:10px;z-index:4;animation:floatA 6s ease-in-out infinite;animation-delay:2s;border-radius:var(--r5)}
	.cc-pill .ico{width:22px;height:22px;border-radius:50%;background:var(--acc-soft);color:var(--acc-d);display:grid;place-items:center}
	.cc-pill .t{font-size:11px;color:var(--t2)}
	.cc-pill .v{font-family:var(--mono);font-size:13px;font-weight:600;color:var(--t1)}
	.composition::before{content:"";position:absolute;inset:10% 10% 10% 10%;background:radial-gradient(closest-side,var(--acc-soft),transparent 70%);filter:blur(40px);z-index:0;opacity:.7;pointer-events:none}
	@keyframes floatA{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
	@keyframes floatB{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}

	.press{padding:48px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;position:relative}
	.press-l{text-align:center;font-family:var(--mono);font-size:11px;color:var(--t3);letter-spacing:.15em;margin-bottom:20px;text-transform:uppercase}
	.press-track{display:flex;width:max-content;animation:scroll 35s linear infinite;gap:64px;align-items:center}
	.press-track span{font-family:var(--f);font-size:18px;font-weight:600;color:var(--t3);letter-spacing:-.01em;white-space:nowrap}
	@keyframes scroll{to{transform:translateX(-50%)}}

	.stats{padding:96px 0}
	.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden}
	.stat{background:var(--bg);padding:32px 28px}
	.stat .v{font-family:var(--mono);font-size:36px;font-weight:600;letter-spacing:-.03em;color:var(--t1)}
	.stat .v em{font-style:normal;color:var(--acc)}
	.stat .l{font-size:13px;color:var(--t2);margin-top:6px}
	.stat .d{font-size:11px;color:var(--t3);margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}

	.how{padding:96px 0;position:relative}
	.section-head{margin-bottom:64px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:end}
	.section-head.center{grid-template-columns:1fr;text-align:center;max-width:680px;margin-left:auto;margin-right:auto}
	.section-head .eyebrow{margin-bottom:18px;display:block}
	.section-head .lead{color:var(--t2);font-size:17px}
	.how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
	.step{padding:36px 28px;border:1px solid var(--line);border-radius:var(--r3);background:var(--bg2);position:relative;transition:.3s var(--ease)}
	.step:hover{border-color:var(--line2);transform:translateY(-2px)}
	.step-n{font-family:var(--mono);font-size:11px;color:var(--t3);margin-bottom:24px;letter-spacing:.1em}
	.step-ico{width:40px;height:40px;border-radius:10px;background:var(--acc-soft);color:var(--acc-d);display:grid;place-items:center;margin-bottom:20px}
	.step h3{font-size:20px;font-weight:600;letter-spacing:-.015em;margin-bottom:8px}
	.step p{font-size:14px;color:var(--t2);line-height:1.6}

	.earn{padding:96px 0;background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
	.earn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden}
	.earn-card{background:var(--bg2);padding:36px 28px;transition:.35s var(--ease);position:relative;display:block;color:inherit;z-index:0;overflow:hidden}
	.earn-card::before{content:"";position:absolute;left:0;top:0;width:100%;height:2px;background:linear-gradient(90deg,var(--acc),var(--acc-d) 45%,transparent);transform:scaleX(0);transform-origin:left;transition:transform .45s var(--ease)}
	.earn-card::after{content:"";position:absolute;inset:0;background:radial-gradient(440px circle at 50% -8%,var(--acc-soft),transparent 62%);opacity:0;transition:opacity .35s var(--ease);pointer-events:none}
	.earn-card:hover{background:var(--bg3);z-index:1}
	.earn-card:hover::before{transform:scaleX(1)}
	.earn-card:hover::after{opacity:1}
	.earn-ico{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--t1);display:grid;place-items:center;margin-bottom:20px;transition:.35s var(--ease)}
	.earn-card:hover .earn-ico{background:var(--acc-soft);border-color:rgba(199,244,99,.35);color:var(--acc);transform:translateY(-3px)}
	.earn-card h3{font-size:19px;font-weight:600;letter-spacing:-.015em;margin-bottom:8px;transition:color .3s var(--ease)}
	.earn-card:hover h3{color:var(--acc)}
	.earn-card p{font-size:14px;color:var(--t2);margin-bottom:20px;line-height:1.6}
	.earn-tag{display:inline-block;padding:5px 11px;border-radius:var(--r5);background:rgba(255,255,255,.04);border:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--t2);transition:.35s var(--ease)}
	.earn-tag em{font-style:normal;color:var(--acc)}
	.earn-card:hover .earn-tag{border-color:rgba(199,244,99,.3);background:var(--acc-soft);color:var(--t1)}
	.earn-arrow{position:absolute;top:34px;right:28px;width:30px;height:30px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;color:var(--t3);opacity:0;transform:translate(-8px,8px) scale(.92);transition:.4s var(--ease)}
	.earn-card:hover .earn-arrow{opacity:1;transform:translate(0,0) scale(1);color:var(--acc);border-color:rgba(199,244,99,.35)}

	.dash{padding:96px 0}
	.dash-frame{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r4);overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.4)}
	.dash-bar{display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.02)}
	.dash-bar .ddot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.1)}
	.dash-bar .url{margin-left:14px;font-family:var(--mono);font-size:12px;color:var(--t3)}
	.dash-body{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:1px;background:var(--line)}
	.dw{background:var(--bg2);padding:26px 24px}
	.dw-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px}
	.dw-h h4{font-size:13px;font-weight:600;color:var(--t1)}
	.dw-h span{font-size:11px;color:var(--t3);font-family:var(--mono)}
	.chart{display:flex;align-items:flex-end;gap:8px;height:140px}
	.bar{flex:1;background:linear-gradient(180deg,var(--acc) 0%,rgba(199,244,99,.3) 100%);border-radius:4px 4px 0 0;transition:height 1.2s var(--ease);min-height:4px}
	.bar.muted{background:linear-gradient(180deg,rgba(255,255,255,.18) 0%,rgba(255,255,255,.04) 100%)}
	.chart-x{display:flex;justify-content:space-between;margin-top:10px;font-family:var(--mono);font-size:10px;color:var(--t3)}
	.donut{position:relative;width:140px;height:140px;margin:0 auto}
	.donut svg{transform:rotate(-90deg)}
	.donut-c{position:absolute;inset:0;display:grid;place-items:center;font-family:var(--mono);font-size:22px;font-weight:600}
	.donut-legend{margin-top:18px;display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--t2)}
	.donut-legend .row{display:flex;justify-content:space-between;align-items:center}
	.donut-legend .row span:first-child{display:flex;align-items:center;gap:8px}
	.donut-legend .d{width:8px;height:8px;border-radius:2px}
	.heat{display:grid;grid-template-columns:repeat(13,1fr);gap:3px}
	.hc{aspect-ratio:1;border-radius:3px;background:rgba(255,255,255,.04)}
	.hc.l1{background:rgba(199,244,99,.18)}.hc.l2{background:rgba(199,244,99,.36)}
	.hc.l3{background:rgba(199,244,99,.6)}.hc.l4{background:rgba(199,244,99,.92)}
	.heat-foot{margin-top:14px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--t3);font-family:var(--mono)}
	.dash-body-2{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border-top:1px solid var(--line)}
	.dw-sm{background:var(--bg2);padding:22px 24px}
	.dw-sm .v{font-family:var(--mono);font-size:26px;font-weight:600;letter-spacing:-.02em}
	.dw-sm .v em{font-style:normal;color:var(--acc)}
	.dw-sm .l{font-size:12px;color:var(--t3);margin-top:4px}

	.games{padding:96px 0;background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
	.bonus{display:flex;align-items:center;justify-content:space-between;padding:22px 28px;border:1px solid var(--line);border-radius:var(--r3);background:var(--bg);margin-bottom:48px;gap:24px;flex-wrap:wrap}
	.bonus-l{display:flex;align-items:center;gap:16px}
	.bonus-ico{width:44px;height:44px;border-radius:12px;background:var(--acc-soft);color:var(--acc-d);display:grid;place-items:center}
	.bonus h4{font-size:16px;font-weight:600;letter-spacing:-.01em}
	.bonus p{font-size:13px;color:var(--t2);margin-top:2px}
	.timer{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:14px}
	.timer .u{padding:8px 10px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:8px;font-weight:600;min-width:42px;text-align:center}
	.timer .s{color:var(--t3)}

	.game-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:48px}
	.game{background:var(--bg);border:1px solid var(--line);border-radius:var(--r3);padding:24px;transition:.25s var(--ease)}
	.game:hover{border-color:var(--line2);transform:translateY(-2px)}
	.game-top{display:flex;align-items:flex-start;gap:14px;margin-bottom:20px}
	.game-thumb{width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line);display:grid;place-items:center;color:var(--t1);flex-shrink:0}
	.game-info{flex:1;min-width:0}
	.game-info h4{font-size:15px;font-weight:600;margin-bottom:2px}
	.game-info p{font-size:12px;color:var(--t2);line-height:1.5}
	.game-badges{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
	.badge{padding:3px 8px;border-radius:var(--r5);font-family:var(--mono);font-size:10px;font-weight:500;letter-spacing:.04em;text-transform:uppercase}
	.badge.easy{background:rgba(126,221,181,.1);color:var(--pos)}
	.badge.med{background:rgba(255,183,74,.1);color:var(--warn)}
	.badge.hard{background:rgba(255,122,138,.1);color:var(--bad)}
	.badge.new{background:rgba(122,184,255,.1);color:var(--info)}
	.badge.hot{background:var(--acc-soft);color:var(--acc-d)}
	.game-foot{display:flex;justify-content:space-between;align-items:center;padding-top:18px;border-top:1px solid var(--line)}
	.game-foot .pl{font-size:11px;color:var(--t3);font-family:var(--mono)}
	.game-foot .rw{font-family:var(--mono);font-size:13px;color:var(--acc);font-weight:600}
	.play-btn{font-size:12px;font-weight:600;color:var(--t1);padding:7px 14px;border-radius:var(--r5);background:rgba(255,255,255,.05);border:1px solid var(--line2);transition:.2s}
	.play-btn:hover{background:var(--acc);color:var(--acc-text);border-color:var(--acc)}

	.leaderboard{max-width:560px;margin:0 auto;background:var(--bg);border:1px solid var(--line);border-radius:var(--r3);padding:28px}
	.lb-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--line)}
	.lb-h h4{font-size:15px;font-weight:600;letter-spacing:-.01em}
	.lb-h span{font-family:var(--mono);font-size:11px;color:var(--t3)}
	.lb-row{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)}
	.lb-row:last-child{border:0}
	.lb-rank{font-family:var(--mono);font-size:13px;font-weight:600;width:24px;color:var(--t3)}
	.lb-row.top .lb-rank{color:var(--acc)}
	.lb-av{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.06);display:grid;place-items:center;font-family:var(--mono);font-size:11px;font-weight:600;color:var(--t1)}
	.lb-info{flex:1;min-width:0}
	.lb-info .n{font-size:14px;font-weight:600}
	.lb-info .m{font-size:11px;color:var(--t3);font-family:var(--mono);margin-top:1px}
	.lb-pts{font-family:var(--mono);font-size:14px;font-weight:600;color:var(--t1)}

	.streaks{padding:96px 0}
	.streaks-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:80px;align-items:start}
	.streaks-grid>*{min-width:0}
	.cal{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);padding:28px;max-width:100%}
	.cal-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px}
	.cal-h .m{font-size:14px;font-weight:600}
	.cal-h .b{font-family:var(--mono);font-size:11px;color:var(--acc);padding:4px 10px;border-radius:var(--r5);background:var(--acc-soft)}
	.cal-w{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;font-family:var(--mono);font-size:10px;color:var(--t3);text-transform:uppercase;text-align:center;margin-bottom:8px}
	.cal-g{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
	.cd{aspect-ratio:1;width:100%;max-width:54px;border-radius:8px;background:rgba(255,255,255,.04);display:grid;place-items:center;font-family:var(--mono);font-size:11px;color:var(--t3);font-weight:500;justify-self:center}
	.cd.on{background:var(--acc);color:var(--acc-text)}
	.cd.bonus{background:var(--warn);color:#0a0c10}
	.cd.today{background:transparent;border:1.5px solid var(--acc);color:var(--acc)}
	.cd.empty{background:transparent}
	.cal-leg{display:flex;gap:18px;margin-top:18px;font-size:11px;color:var(--t3)}
	.cal-leg span{display:flex;align-items:center;gap:6px}
	.cal-leg .d{width:8px;height:8px;border-radius:2px}
	.mil{margin-top:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
	.mil-i{padding:12px;border:1px solid var(--line);border-radius:10px;text-align:center}
	.mil-i.on{border-color:var(--acc);background:var(--acc-soft)}
	.mil-i .d{font-family:var(--mono);font-size:13px;font-weight:600;color:var(--t1)}
	.mil-i.on .d{color:var(--acc)}
	.mil-i .r{font-size:10px;color:var(--t3);margin-top:4px;font-family:var(--mono)}
	.streaks-info .eyebrow{margin-bottom:24px;display:block}
	.streaks-info h2{margin-bottom:18px}
	.streaks-info p{font-size:16px;color:var(--t2);margin-bottom:28px;max-width:480px}
	.feat{display:flex;flex-direction:column;gap:14px;margin-bottom:32px;max-width:480px}
	.feat-row{display:flex;align-items:flex-start;gap:14px;font-size:14px}
	.feat-c{width:24px;height:24px;border-radius:50%;background:var(--acc-soft);color:var(--acc-d);display:grid;place-items:center;flex-shrink:0;margin-top:1px}

	.quiz{padding:96px 0;background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
	.quiz-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:80px;align-items:center}
	.quiz-grid>*{min-width:0}
	.quiz-info .eyebrow{margin-bottom:24px;display:block}
	.quiz-info h2{margin-bottom:18px}
	.quiz-info p{font-size:16px;color:var(--t2);margin-bottom:28px;max-width:480px}
	.qcats{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
	.qcat{padding:7px 14px;border-radius:var(--r5);background:rgba(255,255,255,.04);border:1px solid var(--line);font-size:12px;color:var(--t2);transition:.2s}
	.qcat:hover{color:var(--t1);border-color:var(--line2)}
	.qmock{background:var(--bg);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden}
	.qm-h{padding:24px 28px;border-bottom:1px solid var(--line)}
	.qm-h .c{font-family:var(--mono);font-size:11px;color:var(--acc);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px}
	.qm-h .t{font-size:18px;font-weight:600;letter-spacing:-.01em}
	.qm-h .m{display:flex;gap:18px;margin-top:10px;font-family:var(--mono);font-size:11px;color:var(--t3)}
	.qm-h .m em{font-style:normal;color:var(--acc)}
	.qm-prog{height:2px;background:rgba(255,255,255,.06)}
	.qm-prog div{height:100%;width:60%;background:var(--acc);transition:width .5s var(--ease)}
	.qm-body{padding:28px}
	.qm-q{font-size:16px;font-weight:600;margin-bottom:18px;line-height:1.4}
	.qm-q em{font-style:normal;font-family:var(--mono);color:var(--acc);font-weight:500;font-size:12px;margin-right:8px}
	.qm-opts{display:flex;flex-direction:column;gap:8px}
	.qm-opt{padding:14px 16px;border:1px solid var(--line);border-radius:var(--r2);background:rgba(255,255,255,.02);display:flex;align-items:center;gap:14px;font-size:14px;cursor:pointer;transition:.2s}
	.qm-opt:hover{border-color:var(--line2);background:rgba(255,255,255,.04)}
	.qm-opt .l{width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,.04);display:grid;place-items:center;font-family:var(--mono);font-size:11px;font-weight:600;color:var(--t3);flex-shrink:0;transition:.2s}
	.qm-opt.right{border-color:var(--acc);background:var(--acc-soft)}
	.qm-opt.right .l{background:var(--acc);color:var(--acc-text)}
	.qm-opt.wrong{border-color:rgba(255,122,138,.4);background:rgba(255,122,138,.06)}
	.qm-opt.wrong .l{background:var(--bad);color:#fff}
	.qm-result{margin-top:16px;padding:14px 16px;border-radius:var(--r2);background:var(--acc-soft);border:1px solid rgba(199,244,99,.2);display:flex;align-items:center;gap:12px;font-size:13px;color:var(--t1)}
	.qm-result strong{display:block;margin-bottom:2px;color:var(--acc-d);font-size:12px;text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);font-weight:600}
	.qm-result .v{margin-left:auto;font-family:var(--mono);font-weight:600;color:var(--acc)}

	.survey{padding:96px 0}
	.survey-card{max-width:680px;margin:48px auto 0;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden}
	.sv-prog{height:2px;background:rgba(255,255,255,.06)}
	.sv-prog div{height:100%;background:var(--acc);transition:width .4s var(--ease)}
	.sv-body{padding:40px}
	.sv-step{font-family:var(--mono);font-size:11px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px}
	.sv-q{font-size:24px;font-weight:600;letter-spacing:-.015em;line-height:1.25;margin-bottom:28px}
	.sv-opts{display:flex;flex-direction:column;gap:10px}
	.sv-opt{padding:16px 20px;border:1px solid var(--line);border-radius:var(--r2);background:rgba(255,255,255,.02);display:flex;align-items:center;gap:14px;font-size:15px;cursor:pointer;transition:.2s}
	.sv-opt:hover{border-color:var(--line2);background:rgba(255,255,255,.04)}
	.sv-opt.sel{border-color:var(--acc);background:var(--acc-soft)}
	.sv-opt .l{width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,.05);display:grid;place-items:center;font-family:var(--mono);font-size:12px;font-weight:600;color:var(--t3);flex-shrink:0}
	.sv-opt.sel .l{background:var(--acc);color:var(--acc-text)}
	.sv-foot{padding:18px 40px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,.15)}
	.sv-foot .skip{font-size:13px;color:var(--t3);cursor:pointer}
	.sv-foot .skip:hover{color:var(--t2)}

	.refer{padding:96px 0;background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
	.refer-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:64px;align-items:center}
	.refer-grid>*{min-width:0}
	.refer h3{font-size:28px;font-weight:600;letter-spacing:-.02em;margin-bottom:14px;line-height:1.15}
	.refer .lead{font-size:15px;color:var(--t2);margin-bottom:28px;max-width:440px}
	.refer-link{display:flex;gap:8px;margin-bottom:16px;max-width:440px}
	.refer-link input{flex:1;padding:14px 18px;background:var(--bg);border:1px solid var(--line);border-radius:var(--r2);font-family:var(--mono);font-size:13px;color:var(--acc);outline:none}
	.refer-link input:focus{border-color:var(--line2)}
	.refer-link button{padding:0 22px;background:var(--acc);color:var(--acc-text);border-radius:var(--r2);font-weight:600;font-size:13px}
	.refer-share{display:flex;gap:8px}
	.rshare{padding:10px 18px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:var(--r5);font-size:12px;font-weight:500;color:var(--t2);display:flex;align-items:center;gap:6px;transition:.2s}
	.rshare:hover{color:var(--t1);border-color:var(--line2)}
	.ladder{display:flex;flex-direction:column;gap:8px}
	.tier{display:flex;align-items:center;gap:16px;padding:16px 18px;border:1px solid var(--line);border-radius:var(--r2);background:var(--bg);transition:.25s}
	.tier.on{border-color:var(--acc);background:var(--acc-soft)}
	.tier.lock{opacity:.5}
	.tier-n{font-family:var(--mono);font-size:11px;color:var(--t3);width:18px}
	.tier.on .tier-n{color:var(--acc)}
	.tier-i{font-size:14px;font-weight:600;flex:1}
	.tier-i span{display:block;font-size:11px;font-weight:400;color:var(--t3);margin-top:2px;font-family:var(--mono)}
	.tier-r{font-family:var(--mono);font-size:13px;font-weight:600;color:var(--acc)}
	.tier.lock .tier-r{color:var(--t3)}

	.why{padding:96px 0}
	.why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden}
	.why-card{background:var(--bg);padding:32px 28px;transition:.25s}
	.why-card:hover{background:var(--bg3)}
	.why-ico{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--t1);display:grid;place-items:center;margin-bottom:18px}
	.why-card h3{font-size:17px;font-weight:600;margin-bottom:8px;letter-spacing:-.01em}
	.why-card p{font-size:14px;color:var(--t2);line-height:1.6}

	.rev{padding:96px 0;background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden}
	.rev-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:48px;gap:24px;flex-wrap:wrap}
	.rev-badge{display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border:1px solid var(--line);border-radius:var(--r5);font-size:13px;color:var(--t2);background:var(--bg)}
	.rev-badge strong{color:var(--t1);font-weight:600}
	.rev-stars{color:var(--acc);letter-spacing:1px;font-size:12px}
	.rev-wrap{position:relative}
	.rev-wrap::before,.rev-wrap::after{content:"";position:absolute;top:0;bottom:0;width:80px;z-index:2;pointer-events:none}
	.rev-wrap::before{left:0;background:linear-gradient(90deg,var(--bg2),transparent)}
	.rev-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg2),transparent)}
	.rev-track{display:flex;gap:16px;width:max-content;animation:scroll 60s linear infinite}
	.rev-card{width:340px;flex-shrink:0;background:var(--bg);border:1px solid var(--line);border-radius:var(--r3);padding:24px}
	.rc-h{display:flex;align-items:center;gap:12px;margin-bottom:14px}
	.rc-av{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.06);display:grid;place-items:center;font-family:var(--mono);font-size:12px;font-weight:600}
	.rc-info .n{font-size:13px;font-weight:600}
	.rc-info .d{font-family:var(--mono);font-size:10px;color:var(--t3);margin-top:1px}
	.rc-st{margin-left:auto;color:var(--acc);font-size:11px;letter-spacing:.5px}
	.rc-body{font-size:14px;color:var(--t2);line-height:1.6;margin-bottom:14px}
	.rc-tag{display:inline-block;padding:4px 10px;border-radius:var(--r5);font-family:var(--mono);font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.04em;background:rgba(255,255,255,.04);color:var(--t2);border:1px solid var(--line)}

	.faq{padding:96px 0}
	.faq-list{max-width:760px;margin:48px auto 0;border-top:1px solid var(--line)}
	.faq-item{border-bottom:1px solid var(--line)}
	.faq-q{width:100%;text-align:left;display:flex;align-items:center;justify-content:space-between;padding:24px 0;font-size:17px;font-weight:600;letter-spacing:-.01em;color:var(--t1);gap:16px;transition:color .2s}
	.faq-q:hover{color:var(--acc)}
	.faq-icon{width:32px;height:32px;border-radius:50%;border:1px solid var(--line2);display:grid;place-items:center;color:var(--t2);transition:.3s;flex-shrink:0}
	.faq-item.open .faq-icon{background:var(--acc);color:var(--acc-text);border-color:var(--acc);transform:rotate(45deg)}
	.faq-a{max-height:0;overflow:hidden;transition:max-height .35s var(--ease)}
	.faq-item.open .faq-a{max-height:200px}
	.faq-a-in{padding:0 0 24px;font-size:15px;color:var(--t2);line-height:1.7;max-width:680px}

	.cta{padding:120px 0;text-align:center;position:relative;overflow:hidden}
	.cta::before{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:900px;height:500px;background:radial-gradient(closest-side,var(--acc-soft),transparent 70%);filter:blur(40px);pointer-events:none;opacity:.6}
	.cta-inner{position:relative}
	.cta h2{font-size:clamp(40px,5.5vw,64px);font-weight:600;letter-spacing:-.03em;line-height:1.02;margin-bottom:20px}
	.cta h2 em{font-style:normal;color:var(--acc)}
	.cta p{font-size:17px;color:var(--t2);max-width:520px;margin:0 auto 36px}
	.cta-trust{display:flex;justify-content:center;gap:32px;margin-top:36px;flex-wrap:wrap;font-family:var(--mono);font-size:12px;color:var(--t3)}
	.cta-trust span{display:flex;align-items:center;gap:6px}
	.cta-trust .i{color:var(--acc)}

	footer.home-footer{padding:80px 0 32px;border-top:1px solid var(--line)}
	.foot-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1.4fr;gap:40px;margin-bottom:64px}
	.foot-brand p{font-size:14px;color:var(--t2);margin-top:14px;max-width:280px;line-height:1.6}
	.foot-stores{display:flex;gap:8px;margin-top:20px}
	.fs{padding:10px 16px;border:1px solid var(--line);border-radius:var(--r2);font-size:12px;color:var(--t2);display:flex;align-items:center;gap:8px;transition:.2s}
	.fs:hover{border-color:var(--line2);color:var(--t1)}
	.foot-col h5{font-family:var(--mono);font-size:11px;color:var(--t3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px}
	.foot-col a{display:block;font-size:14px;color:var(--t2);padding:5px 0;transition:.2s}
	.foot-col a:hover{color:var(--t1)}
	.foot-news p{font-size:13px;color:var(--t2);margin-bottom:14px;line-height:1.5}
	.news-form{display:flex;gap:6px}
	.news-form input{flex:1;padding:11px 14px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:var(--r2);font-size:13px;color:var(--t1);outline:none;font-family:var(--f)}
	.news-form input:focus{border-color:var(--line2)}
	.news-form button{padding:0 18px;background:var(--acc);color:var(--acc-text);border-radius:var(--r2);font-weight:600;font-size:13px}
	.foot-trust{display:flex;flex-wrap:wrap;gap:32px;padding:24px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:24px;font-family:var(--mono);font-size:11px;color:var(--t3);letter-spacing:.04em}
	.foot-trust span{display:flex;align-items:center;gap:8px}
	.foot-trust .i{color:var(--t2)}
	.foot-bot{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:11px;color:var(--t3);flex-wrap:wrap;gap:14px}
	.foot-social{display:flex;gap:6px;margin-top:18px}
	.foot-social a{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid var(--line);display:grid;place-items:center;color:var(--t2);transition:.2s}
	.foot-social a:hover{color:var(--t1);border-color:var(--line2)}

	.live{position:fixed;bottom:24px;left:24px;z-index:50;display:flex;flex-direction:column;gap:8px;pointer-events:none}
	.toast{display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(20,24,33,.95);border:1px solid var(--line2);border-radius:var(--r5);backdrop-filter:blur(16px);font-size:12px;color:var(--t2);box-shadow:0 12px 32px rgba(0,0,0,.4);animation:toastIn .4s var(--ease);max-width:340px;transition:opacity .3s}
	.toast strong{color:var(--t1);font-weight:600}
	.toast .td{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 10px var(--acc)}
	@keyframes toastIn{from{opacity:0;transform:translateX(-30px)}}

	.reveal{opacity:0;transform:translateY(20px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
	.reveal.in{opacity:1;transform:none}
	.d1{transition-delay:.05s}.d2{transition-delay:.1s}.d3{transition-delay:.15s}.d4{transition-delay:.2s}.d5{transition-delay:.25s}

	.confetti-container{position:fixed;inset:0;pointer-events:none;z-index:3000;overflow:hidden}
	.confetti-piece{position:absolute;top:60px;border-radius:2px;animation:cfFall 1.6s ease-out forwards}
	@keyframes cfFall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(80vh) rotate(720deg);opacity:0}}

	@media(max-width:980px){
		.hero{padding:120px 0 64px}
		.hero-grid{grid-template-columns:1fr;gap:64px;text-align:left}
		.composition{max-width:440px}
		.nav-links{display:none}
		.coin-pill{display:none}
		.stats-grid{grid-template-columns:repeat(2,1fr)}
		.how-grid,.earn-grid,.why-grid{grid-template-columns:1fr}
		.game-grid{grid-template-columns:1fr 1fr}
		.dash-body{grid-template-columns:1fr}
		.dash-body-2{grid-template-columns:1fr 1fr}
		.streaks-grid,.quiz-grid,.refer-grid{grid-template-columns:1fr;gap:48px}
		.section-head{grid-template-columns:1fr;gap:16px}
		.foot-top{grid-template-columns:1fr 1fr}
		.live{display:none}
	}
	@media(max-width:560px){
		.hero{padding:100px 0 48px}
		.wrap{padding:0 20px}
		.game-grid{grid-template-columns:1fr}
		.stats-grid{grid-template-columns:1fr}
		.dash-body-2{grid-template-columns:1fr}
		.foot-top{grid-template-columns:1fr}
		.hero-meta{flex-wrap:wrap;gap:20px}
	}
	</style>`}
</svelte:head>

<!-- Icons SVG sprite -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
	<defs>
		<symbol id="i-bolt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.09 12.97a.5.5 0 0 0 .41.8H11l-1 8.23a.5.5 0 0 0 .9.34L19.91 11.03a.5.5 0 0 0-.41-.8H13l1-8.23a.5.5 0 0 0-1-0Z"/></symbol>
		<symbol id="i-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c2 4 6 5.5 6 11a6 6 0 1 1-12 0c0-3 1.5-5 3-6 0 3 1 4 3 4-1-4 0-7 0-9Z"/></symbol>
		<symbol id="i-brain" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2a3 3 0 0 0-3 3v1A3 3 0 0 0 4 9v1a3 3 0 0 0 1 2.2 3 3 0 0 0 .5 4.3A3 3 0 0 0 9.5 19V2Z"/><path d="M14.5 2a3 3 0 0 1 3 3v1A3 3 0 0 1 20 9v1a3 3 0 0 1-1 2.2 3 3 0 0 1-.5 4.3 3 3 0 0 1-4 2.5V2Z"/></symbol>
		<symbol id="i-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></symbol>
		<symbol id="i-game" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M7 12h3M8.5 10.5v3M14 12h.01M17 12h.01M15.5 14h.01"/></symbol>
		<symbol id="i-bag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></symbol>
		<symbol id="i-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M17 6h2a2 2 0 0 1 2 2 4 4 0 0 1-4 4M7 6H5a2 2 0 0 0-2 2 4 4 0 0 0 4 4M9 18h6M10 22h4M12 15v3"/></symbol>
		<symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
		<symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></symbol>
		<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></symbol>
		<symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/></symbol>
		<symbol id="i-coin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"/></symbol>
		<symbol id="i-wallet" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H5a2 2 0 0 1 0-4h14v4ZM3 5v14a2 2 0 0 0 2 2h16V7H5a2 2 0 0 1-2-2Z"/><path d="M17 14h.01"/></symbol>
		<symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
		<symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v7c0 5 4 9 8 10 4-1 8-5 8-10V5z"/></symbol>
		<symbol id="i-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/></symbol>
		<symbol id="i-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M7 14l3-3 4 4 6-7"/></symbol>
		<symbol id="i-target" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></symbol>
		<symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></symbol>
		<symbol id="i-gift" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M7.5 8a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 1 1 0 5"/></symbol>
		<symbol id="i-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></symbol>
		<symbol id="i-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></symbol>
		<symbol id="i-star" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></symbol>
		<symbol id="i-x" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3.6l-7.8 8.9L22 21h-7.2l-5.6-7.4L2.7 21H-1l8.4-9.5L0 3h7.4l5 6.7L17.5 3z"/></symbol>
		<symbol id="i-ig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor"/></symbol>
		<symbol id="i-tt" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8a6 6 0 0 1-4-1.5V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V2h3a6 6 0 0 0 4 6Z"/></symbol>
	</defs>
</svg>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="notif-overlay" class:open={notifOpen} onclick={closeNotif}></div>

<aside class="notif-drawer" class:open={notifOpen}>
	<div class="notif-header">
		<h3>Notifications</h3>
		<button class="notif-close" onclick={closeNotif} aria-label="Close notifications">
			<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
		</button>
	</div>
	<div class="notif-tabs">
		<button class="notif-tab active" onclick={switchNotifTab}>All</button>
		<button class="notif-tab" onclick={switchNotifTab}>Rewards</button>
		<button class="notif-tab" onclick={switchNotifTab}>Polls</button>
		<button class="notif-tab" onclick={switchNotifTab}>System</button>
	</div>
	<div class="notif-list">
		<div class="notif-item"><div class="ni-icon"><svg class="i" viewBox="0 0 24 24"><use href="#i-coin"/></svg></div><div class="ni-text"><strong>+250 Bonus Points</strong><p>14-day streak milestone reached. Keep going!</p></div><div class="ni-time">2m</div></div>
		<div class="notif-item"><div class="ni-icon"><svg class="i" viewBox="0 0 24 24"><use href="#i-doc"/></svg></div><div class="ni-text"><strong>New Polls Available</strong><p>Brand perception survey — 3 min, +$1.50</p></div><div class="ni-time">18m</div></div>
		<div class="notif-item"><div class="ni-icon"><svg class="i" viewBox="0 0 24 24"><use href="#i-flame"/></svg></div><div class="ni-text"><strong>Streak Shield Activated</strong><p>Your streak is protected for the next 24 hours.</p></div><div class="ni-time">1h</div></div>
		<div class="notif-item"><div class="ni-icon"><svg class="i" viewBox="0 0 24 24"><use href="#i-trophy"/></svg></div><div class="ni-text"><strong>Weekly Challenge Complete</strong><p>You earned 500 bonus points from the trivia tournament.</p></div><div class="ni-time">3h</div></div>
		<div class="notif-item"><div class="ni-icon"><svg class="i" viewBox="0 0 24 24"><use href="#i-wallet"/></svg></div><div class="ni-text"><strong>Payout Processed</strong><p>$25.00 sent to your PayPal. Check your email.</p></div><div class="ni-time">1d</div></div>
		<div class="notif-item"><div class="ni-icon"><svg class="i" viewBox="0 0 24 24"><use href="#i-chart"/></svg></div><div class="ni-text"><strong>Quiz Results</strong><p>You scored 4/5 on Science Trivia. +40 pts earned.</p></div><div class="ni-time">1d</div></div>
	</div>
</aside>

<nav id="nav">
	<div class="wrap nav-row">
		<a href="/" class="brand">
			<span class="brand-mark">
				<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.09 12.97a.5.5 0 0 0 .41.8H11l-1 8.23a.5.5 0 0 0 .9.34L19.91 11.03a.5.5 0 0 0-.41-.8H13l1-8.23a.5.5 0 0 0-1-0Z"/></svg>
			</span>
			EarnMaze
		</a>
		<div class="nav-links">
			<a href="#how">How it works</a>
			<a href="#earn">Earn</a>
			<a href="/games" data-sveltekit-reload>Play</a>
			<a href="/streaks" data-sveltekit-reload>Streaks</a>
			<a href="/quizzes" data-sveltekit-reload>Quizzes</a>
			<a href="#faq">FAQ</a>
		</div>
		<div class="nav-actions">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span class="coin-pill" onclick={triggerCoinBurst}>
				<span class="dot"></span>
				<span>{coinCount.toLocaleString()}</span> pts
			</span>
			<button class="bell" aria-label="Notifications" onclick={openNotif}>
				<svg class="i" viewBox="0 0 24 24"><use href="#i-bell"/></svg>
				<span class="pip"></span>
			</button>
			<a href="/login" class="btn-ghost">Log in</a>
			<a href="/register" class="btn btn-pri">Get started</a>
		</div>
	</div>
</nav>

<!-- ============ HERO ============ -->
<section class="hero">
	<div class="wrap hero-grid">
		<div>
			<span class="hero-tag"><span class="hero-tag-chip">NEW</span> Weekly Trivia League — $5,000 pool</span>
			<h1 class="h-display">Show up daily.<br>Get paid <em>weekly.</em></h1>
			<p class="lead">EarnMaze pays you for the things you already do — quick surveys, daily quizzes, casual games, and brand offers. Real cash to PayPal or gift cards. From $10.</p>
			<div class="hero-ctas">
				<a href="/register" class="btn btn-pri btn-lg">Create free account <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>
				<a href="#how" class="btn btn-sec btn-lg">How it works</a>
			</div>
			<div class="hero-meta">
				<div class="hero-meta-item"><div class="v" data-count="4.2" data-suffix="M+">0</div><div class="l">Active members</div></div>
				<div class="hero-meta-item"><div class="v" data-count="3.1" data-prefix="$" data-suffix="M+">$0</div><div class="l">Paid out last month</div></div>
				<div class="hero-meta-item"><div class="v">24h</div><div class="l">Avg payout time</div></div>
			</div>
		</div>

		<div class="composition">
			<div class="cc cc-wallet">
				<div class="lab"><span class="live"></span> Wallet · this week</div>
				<div class="bal"><em>$</em>42.<em>80</em></div>
				<span class="delta">
					<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
					+$18.40 this week
				</span>
				<svg class="cc-spark" viewBox="0 0 280 50" preserveAspectRatio="none">
					<defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7f463" stop-opacity=".35"/><stop offset="1" stop-color="#c7f463" stop-opacity="0"/></linearGradient></defs>
					<path d="M0,38 L40,32 L75,36 L110,24 L150,28 L185,16 L220,20 L260,8 L280,12" fill="none" stroke="#c7f463" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M0,38 L40,32 L75,36 L110,24 L150,28 L185,16 L220,20 L260,8 L280,12 L280,50 L0,50 Z" fill="url(#gf)"/>
					<circle cx="260" cy="8" r="3.5" fill="#c7f463"/>
					<circle cx="260" cy="8" r="7" fill="#c7f463" opacity=".18"/>
				</svg>
				<div class="cc-x"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
			</div>

			<div class="cc cc-streak">
				<div class="h"><span class="l">Streak</span><span class="ico"><svg class="i" viewBox="0 0 24 24"><use href="#i-flame"/></svg></span></div>
				<div class="ring-wrap">
					<svg width="120" height="120" viewBox="0 0 120 120">
						<circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"/>
						<circle cx="60" cy="60" r="48" fill="none" stroke="#c7f463" stroke-width="10" stroke-linecap="round" stroke-dasharray="140 302" stroke-dashoffset="0"/>
					</svg>
					<div class="c"><div class="n">14</div><div class="u">days</div></div>
				</div>
				<div class="mult">Multiplier <em>2.5×</em> active</div>
			</div>

			<div class="cc cc-quiz">
				<div class="l"><svg viewBox="0 0 24 24"><use href="#i-brain"/></svg> Today's quiz</div>
				<div class="q">Which country has the most time zones?</div>
				<div class="opts">
					<div class="o"><span class="k">A</span>Russia</div>
					<div class="o right"><span class="k">B</span>France <svg class="i" viewBox="0 0 24 24" style="margin-left:auto;color:var(--acc)"><use href="#i-check"/></svg></div>
				</div>
				<div class="reward">+50 pts</div>
			</div>

			<div class="cc cc-payout">
				<span class="ico"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></span>
				<div><div class="t">Payout sent</div><div class="s">PayPal · 22 hrs ago</div></div>
				<span class="v">$25.00</span>
			</div>

			<div class="cc cc-pill">
				<span class="ico"><svg class="i" viewBox="0 0 24 24"><use href="#i-bolt"/></svg></span>
				<span class="t">Earned today</span>
				<span class="v">$3.20</span>
			</div>
		</div>
	</div>
</section>

<!-- ============ PRESS ============ -->
<section class="press">
	<div class="press-l">As seen in</div>
	<div class="press-track">
		<span>Forbes</span><span>Business Insider</span><span>The Wall Street Journal</span><span>TechCrunch</span><span>FinanceBuzz</span><span>Mashable</span><span>The Penny Hoarder</span><span>Men's Journal</span>
		<span>Forbes</span><span>Business Insider</span><span>The Wall Street Journal</span><span>TechCrunch</span><span>FinanceBuzz</span><span>Mashable</span><span>The Penny Hoarder</span><span>Men's Journal</span>
	</div>
</section>

<!-- ============ STATS ============ -->
<section class="stats">
	<div class="wrap">
		<div class="stats-grid">
			<div class="stat reveal"><div class="v" data-count="4.2" data-suffix="M+">0</div><div class="l">Members earning daily</div><div class="d">Across all 50 US states</div></div>
			<div class="stat reveal d1"><div class="v"><em>$</em><span data-count="3.1" data-suffix="M+">0</span></div><div class="l">Paid out last month</div><div class="d">PayPal &amp; gift cards</div></div>
			<div class="stat reveal d2"><div class="v" data-count="850" data-suffix="K+">0</div><div class="l">Active daily streaks</div><div class="d">14-day average length</div></div>
			<div class="stat reveal d3"><div class="v">24<em>h</em></div><div class="l">Average payout time</div><div class="d">From $10 minimum</div></div>
		</div>
	</div>
</section>

<!-- ============ HOW ============ -->
<section class="how" id="how">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>How it works</span>
				<h2 class="h1 reveal" style="margin-top:18px">Three moves. That's the whole thing.</h2>
			</div>
			<p class="body-lg reveal d1">No courses, no subscriptions, no funnels. Quick actions that put real points in your wallet — every single day.</p>
		</div>
		<div class="how-grid">
			<div class="step reveal">
				<div class="step-n">01 — SIGN UP</div>
				<div class="step-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-spark"/></svg></div>
				<h3>Create your account</h3>
				<p>30 seconds. No credit card. Tell us your interests and we'll personalize your dashboard.</p>
			</div>
			<div class="step reveal d1">
				<div class="step-n">02 — EARN</div>
				<div class="step-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-bolt"/></svg></div>
				<h3>Earn every day</h3>
				<p>Surveys, quizzes, games, deals, and streaks. Each action stacks into points and a streak bonus.</p>
			</div>
			<div class="step reveal d2">
				<div class="step-n">03 — CASH OUT</div>
				<div class="step-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-wallet"/></svg></div>
				<h3>Cash out from $10</h3>
				<p>PayPal or gift cards. Most payouts land within 24 hours. No fees, no hidden minimums.</p>
			</div>
		</div>
	</div>
</section>

<!-- ============ WAYS TO EARN ============ -->
<section class="earn" id="earn">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>Ways to earn</span>
				<h2 class="h1 reveal" style="margin-top:18px">Six paths. One wallet.</h2>
			</div>
			<p class="body-lg reveal d1">Mix and match however you like. Every action adds real points directly to your balance — no point conversions, no expiring credits.</p>
		</div>
		<div class="earn-grid">
			<a href="/streaks" data-sveltekit-reload class="earn-card reveal">
				<div class="earn-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-flame"/></svg></div>
				<div class="earn-arrow"><svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></div>
				<h3>Daily Streaks</h3>
				<p>Show up daily, earn bonus multipliers. The longer your streak, the bigger your rewards.</p>
				<span class="earn-tag">Up to <em>5×</em> multiplier</span>
			</a>
			<a href="/quizzes" data-sveltekit-reload class="earn-card reveal d1">
				<div class="earn-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-brain"/></svg></div>
				<div class="earn-arrow"><svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></div>
				<h3>Daily Quizzes</h3>
				<p>Fun, bite-sized quizzes on trending topics — pop culture, science, history, sports.</p>
				<span class="earn-tag"><em>50–200 pts</em> per quiz</span>
			</a>
			<a href="/artifacts" data-sveltekit-reload class="earn-card reveal d2">
				<div class="earn-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-spark"/></svg></div>
				<div class="earn-arrow"><svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></div>
				<h3>Interactive Artifacts</h3>
				<p>Hand-picked interactive experiences — explore, play with, and learn from curated data and lifestyle stories.</p>
				<span class="earn-tag">Curated · <em>Live</em></span>
			</a>
			<a href="/games" data-sveltekit-reload class="earn-card reveal d3">
				<div class="earn-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-game"/></svg></div>
				<div class="earn-arrow"><svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></div>
				<h3>Play &amp; Earn</h3>
				<p>Level up in mobile games and earn real rewards. Gaming meets earning.</p>
				<span class="earn-tag">Earn while you play</span>
			</a>
			<a href="/exclusive-deals" data-sveltekit-reload class="earn-card reveal d4">
				<div class="earn-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-bag"/></svg></div>
				<div class="earn-arrow"><svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></div>
				<h3>Exclusive Deals</h3>
				<p>Cashback on everyday purchases and app sign-ups you'd already do.</p>
				<span class="earn-tag">Instant cashback</span>
			</a>
			<a href="/weekly-challenges" data-sveltekit-reload class="earn-card reveal d5">
				<div class="earn-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-trophy"/></svg></div>
				<div class="earn-arrow"><svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></div>
				<h3>Weekly Challenges</h3>
				<p>Limited-time challenges with bonus point pools and massive reward drops.</p>
				<span class="earn-tag">Bonus reward pools</span>
			</a>
		</div>
	</div>
</section>

<!-- ============ DASHBOARD ============ -->
<section class="dash" id="dashboard">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>Dashboard</span>
				<h2 class="h1 reveal" style="margin-top:18px">Your earnings, at a glance.</h2>
			</div>
			<p class="body-lg reveal d1">A real-time view of progress, streaks, and where your rewards come from. One screen, no noise.</p>
		</div>
		<div class="dash-frame reveal">
			<div class="dash-bar">
				<span class="ddot"></span><span class="ddot"></span><span class="ddot"></span>
				<span class="url">dashboard.earnmaze.com</span>
			</div>
			<div class="dash-body">
				<div class="dw">
					<div class="dw-h"><h4>Weekly earnings</h4><span>Last 7 days</span></div>
					<div class="chart" id="chart"></div>
					<div class="chart-x"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
				</div>
				<div class="dw">
					<div class="dw-h"><h4>Reward sources</h4><span>This month</span></div>
					<div class="donut">
						<svg width="140" height="140" viewBox="0 0 140 140">
							<circle cx="70" cy="70" r="56" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="16"/>
							<circle cx="70" cy="70" r="56" fill="none" stroke="#c7f463" stroke-width="16" stroke-dasharray="148 352" stroke-dashoffset="0"/>
							<circle cx="70" cy="70" r="56" fill="none" stroke="#7ab8ff" stroke-width="16" stroke-dasharray="91 352" stroke-dashoffset="-148"/>
							<circle cx="70" cy="70" r="56" fill="none" stroke="#ffb74a" stroke-width="16" stroke-dasharray="60 352" stroke-dashoffset="-239"/>
						</svg>
						<div class="donut-c">68%</div>
					</div>
					<div class="donut-legend">
						<div class="row"><span><span class="d" style="background:var(--acc)"></span>Surveys</span><span class="mono">42%</span></div>
						<div class="row"><span><span class="d" style="background:#7ab8ff"></span>Quizzes</span><span class="mono">26%</span></div>
						<div class="row"><span><span class="d" style="background:#ffb74a"></span>Play &amp; deals</span><span class="mono">17%</span></div>
					</div>
				</div>
				<div class="dw">
					<div class="dw-h"><h4>Streak heatmap</h4><span>Apr 2026</span></div>
					<div class="heat" id="heat"></div>
					<div class="heat-foot"><span>Less</span><span style="display:flex;gap:3px"><span class="hc l1" style="width:10px;height:10px"></span><span class="hc l2" style="width:10px;height:10px"></span><span class="hc l3" style="width:10px;height:10px"></span><span class="hc l4" style="width:10px;height:10px"></span></span><span>More</span></div>
				</div>
			</div>
			<div class="dash-body-2">
				<div class="dw-sm"><div class="v"><em>$</em>142.50</div><div class="l">Total earned</div></div>
				<div class="dw-sm"><div class="v">47</div><div class="l">Surveys done</div></div>
				<div class="dw-sm"><div class="v">14</div><div class="l">Current streak</div></div>
				<div class="dw-sm"><div class="v">23</div><div class="l">Quizzes aced</div></div>
			</div>
		</div>
	</div>
</section>

<!-- ============ GAMES ============ -->
<section class="games" id="games">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>Play &amp; earn</span>
				<h2 class="h1 reveal" style="margin-top:18px">Casual games. Real rewards.</h2>
			</div>
			<p class="body-lg reveal d1">Trivia, scratchers, daily spins. Climb the leaderboard, claim the weekly bonus pool.</p>
		</div>

		<div class="bonus reveal">
			<div class="bonus-l">
				<span class="bonus-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-gift"/></svg></span>
				<div><h4>Daily bonus resets in</h4><p>Claim your free spin and bonus coins</p></div>
			</div>
			<div class="timer"><span class="u" id="tH">04</span><span class="s">:</span><span class="u" id="tM">32</span><span class="s">:</span><span class="u" id="tS">17</span></div>
			<a href="/register" class="btn btn-pri">Claim bonus</a>
		</div>

		<div class="game-grid">
			<div class="game reveal">
				<div class="game-top">
					<div class="game-thumb"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-brain"/></svg></div>
					<div class="game-info"><h4>Trivia Quiz</h4><p>Knowledge across 12+ categories</p><div class="game-badges"><span class="badge easy">Easy</span><span class="badge hot">Hot</span></div></div>
				</div>
				<div class="game-foot"><span class="pl">1.2K playing</span><span class="rw">+50 pts</span><button class="play-btn">Play</button></div>
			</div>
			<div class="game reveal d1">
				<div class="game-top">
					<div class="game-thumb"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-grid"/></svg></div>
					<div class="game-info"><h4>Word Scramble</h4><p>Unscramble against the clock</p><div class="game-badges"><span class="badge med">Medium</span><span class="badge new">New</span></div></div>
				</div>
				<div class="game-foot"><span class="pl">856 playing</span><span class="rw">+75 pts</span><button class="play-btn">Play</button></div>
			</div>
			<div class="game reveal d2">
				<div class="game-top">
					<div class="game-thumb"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-target"/></svg></div>
					<div class="game-info"><h4>Spin the Wheel</h4><p>Daily spin for bonus coins</p><div class="game-badges"><span class="badge easy">Easy</span></div></div>
				</div>
				<div class="game-foot"><span class="pl">2.4K playing</span><span class="rw">+10–500 pts</span><button class="play-btn">Spin</button></div>
			</div>
			<div class="game reveal d3">
				<div class="game-top">
					<div class="game-thumb"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-coin"/></svg></div>
					<div class="game-info"><h4>Scratch Card</h4><p>Scratch to reveal instant rewards</p><div class="game-badges"><span class="badge easy">Easy</span><span class="badge hot">Hot</span></div></div>
				</div>
				<div class="game-foot"><span class="pl">3.1K playing</span><span class="rw">+25–200 pts</span><button class="play-btn">Scratch</button></div>
			</div>
			<div class="game reveal d4">
				<div class="game-top">
					<div class="game-thumb"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-bolt"/></svg></div>
					<div class="game-info"><h4>Quiz Sprint</h4><p>Match pairs for multipliers</p><div class="game-badges"><span class="badge hard">Hard</span></div></div>
				</div>
				<div class="game-foot"><span class="pl">634 playing</span><span class="rw">+100 pts</span><button class="play-btn">Play</button></div>
			</div>
			<div class="game reveal d5">
				<div class="game-top">
					<div class="game-thumb"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-trophy"/></svg></div>
					<div class="game-info"><h4>Daily Challenge</h4><p>New challenge every day</p><div class="game-badges"><span class="badge med">Medium</span><span class="badge new">New</span></div></div>
				</div>
				<div class="game-foot"><span class="pl">1.8K playing</span><span class="rw">+150 pts</span><button class="play-btn">Accept</button></div>
			</div>
		</div>

		<div class="leaderboard reveal">
			<div class="lb-h"><h4>Top players this week</h4><span>Resets Monday</span></div>
			<div class="lb-row top"><div class="lb-rank">01</div><div class="lb-av">AK</div><div class="lb-info"><div class="n">Alex K.</div><div class="m">Lvl 42 · 67-day streak</div></div><div class="lb-pts">24,850</div></div>
			<div class="lb-row"><div class="lb-rank">02</div><div class="lb-av">SR</div><div class="lb-info"><div class="n">Sarah R.</div><div class="m">Lvl 38 · 31-day streak</div></div><div class="lb-pts">21,340</div></div>
			<div class="lb-row"><div class="lb-rank">03</div><div class="lb-av">MC</div><div class="lb-info"><div class="n">Marcus C.</div><div class="m">Lvl 35 · 22-day streak</div></div><div class="lb-pts">19,720</div></div>
			<div class="lb-row"><div class="lb-rank">04</div><div class="lb-av">JP</div><div class="lb-info"><div class="n">Jessica P.</div><div class="m">Lvl 29 · 14-day streak</div></div><div class="lb-pts">16,100</div></div>
			<div class="lb-row"><div class="lb-rank">05</div><div class="lb-av">DW</div><div class="lb-info"><div class="n">Derek W.</div><div class="m">Lvl 27 · 11-day streak</div></div><div class="lb-pts">14,880</div></div>
		</div>
	</div>
</section>

<!-- ============ STREAKS ============ -->
<section class="streaks" id="streaks">
	<div class="wrap streaks-grid">
		<div class="cal reveal">
			<div class="cal-h"><div class="m">April 2026</div><div class="b">14-day streak</div></div>
			<div class="cal-w"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
			<div class="cal-g" id="calGrid"></div>
			<div class="cal-leg">
				<span><span class="d" style="background:var(--acc)"></span>Completed</span>
				<span><span class="d" style="background:var(--warn)"></span>Bonus day</span>
				<span><span class="d" style="border:1.5px solid var(--acc);background:transparent"></span>Today</span>
			</div>
			<div class="mil">
				<div class="mil-i on"><div class="d">7d</div><div class="r">+100</div></div>
				<div class="mil-i on"><div class="d">14d</div><div class="r">+250</div></div>
				<div class="mil-i"><div class="d">21d</div><div class="r">+500</div></div>
				<div class="mil-i"><div class="d">30d</div><div class="r">+1,000</div></div>
			</div>
		</div>
		<div class="streaks-info reveal d1">
			<span class="eyebrow acc"><span class="dot"></span>Streak system</span>
			<h2 class="h1">Consistency is the multiplier.</h2>
			<p>Build daily and weekly streaks that compound your earnings. Hit milestones, unlock bonus pools, protect your run with shields.</p>
			<div class="feat">
				<div class="feat-row"><span class="feat-c"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></span><div>Daily streaks with up to <strong>5× multipliers</strong></div></div>
				<div class="feat-row"><span class="feat-c"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></span><div>Weekly milestone bonuses every 7 days</div></div>
				<div class="feat-row"><span class="feat-c"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></span><div>Monthly challenges with massive reward pools</div></div>
				<div class="feat-row"><span class="feat-c"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></span><div>Streak Shields protect your progress when life happens</div></div>
			</div>
			<a href="/register" class="btn btn-pri">Start your first streak <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>
		</div>
	</div>
</section>

<!-- ============ QUIZZES ============ -->
<section class="quiz" id="quizzes">
	<div class="wrap quiz-grid">
		<div class="quiz-info reveal">
			<span class="eyebrow acc"><span class="dot"></span>Today's quizzes</span>
			<h2 class="h1">Get smarter. Get paid.</h2>
			<p>Fresh quizzes every day across topics you actually care about. Answer questions, earn instant points, expand your mind.</p>
			<div class="feat">
				<div class="feat-row"><span class="feat-c"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></span><div>New quizzes daily across 12+ categories</div></div>
				<div class="feat-row"><span class="feat-c"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></span><div>Earn 50–200 pts per quiz, with streak bonuses</div></div>
				<div class="feat-row"><span class="feat-c"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></span><div>Weekly tournaments with leaderboards</div></div>
			</div>
			<a href="/register" class="btn btn-pri">Take today's quiz <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>
			<div class="qcats">
				<span class="qcat">Geography</span><span class="qcat">Science</span><span class="qcat">Sports</span><span class="qcat">Movies</span><span class="qcat">History</span><span class="qcat">Tech</span><span class="qcat">Music</span><span class="qcat">Food</span>
			</div>
		</div>
		<div class="qmock reveal d1">
			<div class="qm-h">
				<div class="c">Quiz · April 14</div>
				<div class="t">World Geography Challenge</div>
				<div class="m"><span>5 questions</span><span>~2 min</span><span><em>+50 pts</em></span></div>
			</div>
			<div class="qm-prog"><div></div></div>
			<div class="qm-body">
				<div class="qm-q"><em>Q3 of 5</em>Which country has the most time zones?</div>
				<div class="qm-opts">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="qm-opt" onclick={selectQuizOpt}><span class="l">A</span>Russia</div>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="qm-opt" onclick={selectQuizOpt}><span class="l">B</span>United States</div>
					<div class="qm-opt right"><span class="l">C</span>France</div>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="qm-opt" onclick={selectQuizOpt}><span class="l">D</span>China</div>
				</div>
				<div class="qm-result"><svg class="i-lg i" viewBox="0 0 24 24" style="color:var(--acc)"><use href="#i-check"/></svg><div><strong>Correct</strong>France spans 12 time zones across its overseas territories.</div><span class="v">+10</span></div>
			</div>
		</div>
	</div>
</section>

<!-- ============ SURVEY DEMO ============ -->
<section class="survey" id="survey">
	<div class="wrap">
		<div class="section-head center">
			<span class="eyebrow acc" style="justify-self:center;display:inline-block"><span class="dot"></span>Try it now</span>
			<h2 class="h1 reveal" style="margin-top:18px">Experience an EarnMaze survey.</h2>
			<p class="body-lg reveal d1" style="margin:14px auto 0">See how quick and clean it actually feels. Three questions, real answers.</p>
		</div>
		<div class="survey-card reveal">
			<div class="sv-prog"><div style="width:{swCompleted ? 100 : ((sqIdx + 1) / surveyQs.length) * 100}%"></div></div>
			<div class="sv-body">
				{#if swCompleted}
					<div class="sv-step">Complete</div>
					<div class="sv-q">Thanks — you earned 30 points.</div>
					<div style="padding:24px;text-align:center;font-family:var(--mono);font-size:14px;color:var(--acc)">+30 pts added to your wallet</div>
				{:else}
					<div class="sv-step">Question {sqIdx + 1} of {surveyQs.length}</div>
					<div class="sv-q">{surveyQs[sqIdx].q}</div>
					<div class="sv-opts">
						{#each surveyQs[sqIdx].opts as opt, i (i)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="sv-opt" class:sel={swSelected === i} onclick={() => selectPoll(i)}>
								<span class="l">{String.fromCharCode(65 + i)}</span>{opt}
							</div>
						{/each}
					</div>
				{/if}
			</div>
			{#if !swCompleted}
				<div class="sv-foot">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<span class="skip" onclick={nextPollsQ}>Skip</span>
					<button class="btn btn-pri" onclick={nextPollsQ}>Next <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></button>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- ============ REFERRAL ============ -->
<section class="refer" id="refer">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>Invite &amp; earn</span>
				<h2 class="h1 reveal" style="margin-top:18px">Share EarnMaze. Earn together.</h2>
			</div>
			<p class="body-lg reveal d1">Invite friends and earn bonus points for every active referral. Climb tiers for bigger rewards.</p>
		</div>
		<div class="refer-grid">
			<div class="reveal">
				<h3>Your personal referral link</h3>
				<p class="lead">You both earn 500 bonus points when they complete their first survey. No cap.</p>
				<div class="refer-link">
					<input value="earnmaze.com/r/sarah-m-4829" readonly id="refLink" />
					<button onclick={copyRef}>Copy</button>
				</div>
				<div class="refer-share">
					<button class="rshare"><svg class="i" viewBox="0 0 24 24"><use href="#i-x"/></svg> X</button>
					<button class="rshare"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16l-8-4-8 4Z"/></svg> Save</button>
					<button class="rshare"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7l8 6 8-6M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7M4 7l2-2h12l2 2"/></svg> Email</button>
				</div>
			</div>
			<div class="ladder reveal d1">
				<div class="tier on"><div class="tier-n">01</div><div class="tier-i">Starter<span>1 referral</span></div><div class="tier-r">+500 pts</div></div>
				<div class="tier on"><div class="tier-n">02</div><div class="tier-i">Rising<span>5 referrals · streak shield</span></div><div class="tier-r">+3,000 pts</div></div>
				<div class="tier"><div class="tier-n">03</div><div class="tier-i">Champion<span>15 referrals · premium surveys</span></div><div class="tier-r">+10,000 pts</div></div>
				<div class="tier lock"><div class="tier-n">04</div><div class="tier-i">Legend<span>50 referrals · VIP, 10× multiplier</span></div><div class="tier-r">+50,000 pts</div></div>
			</div>
		</div>
	</div>
</section>

<!-- ============ WHY ============ -->
<section class="why">
	<div class="wrap">
		<div class="section-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>Why EarnMaze</span>
				<h2 class="h1 reveal" style="margin-top:18px">Built different. Pays better.</h2>
			</div>
			<p class="body-lg reveal d1">A daily engagement platform — not another survey wall. We reward consistency, not click-volume.</p>
		</div>
		<div class="why-grid">
			<div class="why-card reveal"><div class="why-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-wallet"/></svg></div><h3>$10 minimum cashout</h3><p>No sky-high thresholds. Withdraw to PayPal or gift cards starting at ten dollars.</p></div>
			<div class="why-card reveal d1"><div class="why-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-clock"/></svg></div><h3>24-hour payouts</h3><p>Most withdrawals processed within a single business day. No 4-week holds.</p></div>
			<div class="why-card reveal d2"><div class="why-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-flame"/></svg></div><h3>Streak multipliers</h3><p>The more consistent you are, the more you earn. Up to 5× bonus multipliers.</p></div>
			<div class="why-card reveal d3"><div class="why-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-brain"/></svg></div><h3>Learn while you earn</h3><p>Daily quizzes mean you're growing knowledge — not tapping mindlessly.</p></div>
			<div class="why-card reveal d4"><div class="why-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-shield"/></svg></div><h3>Data protected</h3><p>Industry-standard encryption. We never sell your data. Privacy is non-negotiable.</p></div>
			<div class="why-card reveal d5"><div class="why-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-target"/></svg></div><h3>Personalized for you</h3><p>AI-matched surveys, quizzes tuned to interests, deals based on what you actually buy.</p></div>
		</div>
	</div>
</section>

<!-- ============ REVIEWS ============ -->
<section class="rev">
	<div class="wrap">
		<div class="rev-head">
			<div>
				<span class="eyebrow acc"><span class="dot"></span>What members say</span>
				<h2 class="h1 reveal" style="margin-top:18px">Real people. Real rewards.</h2>
			</div>
			<div class="rev-badge reveal d1"><span class="rev-stars">★★★★★</span> <strong>4.7</strong> · 3,200+ reviews</div>
		</div>
	</div>
	<div class="rev-wrap">
		<div class="rev-track">
			<div class="rev-card"><div class="rc-h"><div class="rc-av">JM</div><div class="rc-info"><div class="n">Jessica M.</div><div class="d">March 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">The streak system is addictive in the best way. 47 days in and earning way more than any other rewards app — $180 this month.</div><span class="rc-tag">Streaks</span></div>
			<div class="rev-card"><div class="rc-h"><div class="rc-av">DK</div><div class="rc-info"><div class="n">David K.</div><div class="d">April 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">Love the daily quizzes. I look forward to opening the app every morning. Geography and science are my favorite — smarter and paid.</div><span class="rc-tag">Quizzes</span></div>
			<div class="rev-card"><div class="rc-h"><div class="rc-av">TR</div><div class="rc-info"><div class="n">Tamika R.</div><div class="d">Feb 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">Way better than other reward apps. Surveys + streaks + quizzes keep things fresh. First $50 gift card in just two weeks.</div><span class="rc-tag">Surveys</span></div>
			<div class="rev-card"><div class="rc-h"><div class="rc-av">MH</div><div class="rc-info"><div class="n">Marcus H.</div><div class="d">March 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">Weekly trivia tournament had a 50K pool. Placed 12th, got $25 in bonus. The community vibe is real.</div><span class="rc-tag">Challenges</span></div>
			<div class="rev-card"><div class="rc-h"><div class="rc-av">AP</div><div class="rc-info"><div class="n">Alyssa P.</div><div class="d">April 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">Perfect for a stay-at-home mom. Quizzes during nap time, surveys after dinner. Streak Shield saved me twice. $320 total so far.</div><span class="rc-tag">Streaks</span></div>
			<div class="rev-card"><div class="rc-h"><div class="rc-av">JM</div><div class="rc-info"><div class="n">Jessica M.</div><div class="d">March 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">The streak system is addictive in the best way. 47 days in and earning way more than any other rewards app — $180 this month.</div><span class="rc-tag">Streaks</span></div>
			<div class="rev-card"><div class="rc-h"><div class="rc-av">DK</div><div class="rc-info"><div class="n">David K.</div><div class="d">April 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">Love the daily quizzes. I look forward to opening the app every morning. Geography and science are my favorite — smarter and paid.</div><span class="rc-tag">Quizzes</span></div>
			<div class="rev-card"><div class="rc-h"><div class="rc-av">TR</div><div class="rc-info"><div class="n">Tamika R.</div><div class="d">Feb 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">Way better than other reward apps. Surveys + streaks + quizzes keep things fresh. First $50 gift card in just two weeks.</div><span class="rc-tag">Surveys</span></div>
			<div class="rev-card"><div class="rc-h"><div class="rc-av">MH</div><div class="rc-info"><div class="n">Marcus H.</div><div class="d">March 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">Weekly trivia tournament had a 50K pool. Placed 12th, got $25 in bonus. The community vibe is real.</div><span class="rc-tag">Challenges</span></div>
			<div class="rev-card"><div class="rc-h"><div class="rc-av">AP</div><div class="rc-info"><div class="n">Alyssa P.</div><div class="d">April 2026</div></div><div class="rc-st">★★★★★</div></div><div class="rc-body">Perfect for a stay-at-home mom. Quizzes during nap time, surveys after dinner. Streak Shield saved me twice. $320 total so far.</div><span class="rc-tag">Streaks</span></div>
		</div>
	</div>
</section>

<!-- ============ FAQ ============ -->
<section class="faq" id="faq">
	<div class="wrap">
		<div class="section-head center">
			<span class="eyebrow acc" style="justify-self:center"><span class="dot"></span>FAQ</span>
			<h2 class="h1 reveal" style="margin-top:18px">Common questions, straight answers.</h2>
		</div>
		<div class="faq-list">
			{#each [
				{ q: 'How do streaks work?', a: 'Complete at least one earning action per day to build your streak. Multipliers start at 1× and climb to 5× by day 30. Streak Shields protect your progress if you miss a day.' },
				{ q: 'What kind of quizzes are available?', a: 'Fresh quizzes daily across 12+ categories including pop culture, science, geography, sports, history, and tech. Each takes 1–3 minutes and earns 50–200 points.' },
				{ q: 'How fast can I cash out?', a: 'Request a payout once your wallet hits $10. Choose PayPal or gift cards. Most payments processed within 24 hours.' },
				{ q: 'Is EarnMaze really free?', a: '100% free. No subscription, no credit card, no hidden costs. Brand partnerships fund the rewards.' },
				{ q: 'What games can I play?', a: 'Trivia Quiz, Word Scramble, Spin the Wheel, Scratch Cards, Quiz Sprint, and Daily Challenges. New games added regularly with seasonal events.' },
				{ q: 'Is my data safe?', a: 'We use industry-standard encryption and never sell personal data. Every payout is human-reviewed for fraud prevention.' }
			] as item, i (i)}
				<div class="faq-item" class:open={faqOpen === i}>
					<button class="faq-q" onclick={() => toggleFaq(i)}>{item.q}
						<span class="faq-icon"><svg class="i" viewBox="0 0 24 24"><use href="#i-plus"/></svg></span>
					</button>
					<div class="faq-a"><div class="faq-a-in">{item.a}</div></div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ============ CTA ============ -->
<section class="cta" id="cta">
	<div class="wrap cta-inner">
		<h2 class="reveal">Stop scrolling.<br>Start <em>earning.</em></h2>
		<p class="reveal d1">Join 4.2 million US members getting paid for streaks, quizzes, surveys, games, and deals — every single day.</p>
		<a href="/register" class="btn btn-pri btn-lg reveal d2">Create your free account <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>
		<div class="cta-trust reveal d3">
			<span><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg> No credit card</span>
			<span><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg> Cash out from $10</span>
			<span><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg> 60-second signup</span>
		</div>
	</div>
</section>

<!-- ============ FOOTER ============ -->
<footer class="home-footer">
	<div class="wrap">
		<div class="foot-top">
			<div class="foot-brand">
				<a href="/" class="brand">
					<span class="brand-mark">
						<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.09 12.97a.5.5 0 0 0 .41.8H11l-1 8.23a.5.5 0 0 0 .9.34L19.91 11.03a.5.5 0 0 0-.41-.8H13l1-8.23a.5.5 0 0 0-1-0Z"/></svg>
					</span>
					EarnMaze
				</a>
				<p>Turning everyday moments into real rewards. Streaks, quizzes, surveys, games, and deals — all in one wallet.</p>
				<div class="foot-stores">
					<a href="/" class="fs">App Store</a>
					<a href="/" class="fs">Google Play</a>
				</div>
				<div class="foot-social">
					<a href="/" aria-label="X"><svg class="i" viewBox="0 0 24 24"><use href="#i-x"/></svg></a>
					<a href="/" aria-label="Instagram"><svg class="i" viewBox="0 0 24 24"><use href="#i-ig"/></svg></a>
					<a href="/" aria-label="TikTok"><svg class="i" viewBox="0 0 24 24"><use href="#i-tt"/></svg></a>
				</div>
			</div>
			<div class="foot-col"><h5>Earn</h5><a href="/streaks" data-sveltekit-reload>Daily streaks</a><a href="/quizzes" data-sveltekit-reload>Quizzes</a><a href="/artifacts" data-sveltekit-reload>Artifacts</a><a href="/games" data-sveltekit-reload>Play</a><a href="/exclusive-deals" data-sveltekit-reload>Deals</a><a href="/weekly-challenges" data-sveltekit-reload>Challenges</a></div>
			<div class="foot-col"><h5>Learn</h5><a href="#how">How it works</a><a href="/about">About</a><a href="#streaks">Streak tips</a><a href="#quizzes">Quiz categories</a></div>
			<div class="foot-col"><h5>Company</h5><a href="/about">About</a><a href="/help">Help</a><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a></div>
			<div class="foot-news">
				<h5>Stay updated</h5>
				<p>Tips, new features, and earning hacks. Twice a month, never more.</p>
				<form class="news-form" onsubmit={(e) => { e.preventDefault(); (e.currentTarget.querySelector('button') as HTMLButtonElement).textContent = '✓ Subscribed'; }}>
					<input type="email" placeholder="you@email.com" required />
					<button type="submit">Subscribe</button>
				</form>
			</div>
		</div>
		<div class="foot-trust">
			<span><svg class="i" viewBox="0 0 24 24"><use href="#i-lock"/></svg> 256-bit SSL</span>
			<span><svg class="i" viewBox="0 0 24 24"><use href="#i-shield"/></svg> SOC 2 Type II</span>
			<span><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg> GDPR / CCPA</span>
			<span><svg class="i" viewBox="0 0 24 24"><use href="#i-globe"/></svg> US-based</span>
		</div>
		<div class="foot-bot">
			<span>© 2026 EarnMaze, Inc.</span>
			<span style="font-style:italic">Give your free time a raise.</span>
			<span>Available in the United States</span>
		</div>
	</div>
</footer>

<div class="live" id="live"></div>
