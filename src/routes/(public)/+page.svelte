<script lang="ts">
	import { onMount } from 'svelte';

	let notifOpen = $state(false);
	let coinCount = $state(2480);

	// Smart survey widget state
	const surveyQs = [
		{ q: 'What matters most to you when choosing a streaming service?', opts: ['Content library size', 'Monthly price', 'Original shows & movies', 'User interface & recommendations'] },
		{ q: 'How many hours per week do you spend on your phone?', opts: ['Less than 2 hours', '2–4 hours', '4–6 hours', 'More than 6 hours'] },
		{ q: 'Which reward type do you prefer most?', opts: ['PayPal cash', 'Gift cards', 'Crypto', 'Store credit'] }
	];
	let sqIdx = $state(0);
	let swCompleted = $state(false);
	let swSelected = $state<number | null>(null);

	function openNotif() { notifOpen = true; }
	function closeNotif() { notifOpen = false; }

	function triggerCoinBurst() {
		const cc = document.createElement('div');
		cc.className = 'confetti-container';
		document.body.appendChild(cc);
		const colors = ['#00f080', '#00bbff', '#ffc53d', '#b44aff', '#ff6b2c'];
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

	function togFaq(e: MouseEvent) {
		const q = e.currentTarget as HTMLElement;
		const item = q.parentElement!;
		const wasOpen = item.classList.contains('open');
		document.querySelectorAll('.faq-item').forEach((x) => x.classList.remove('open'));
		if (!wasOpen) item.classList.add('open');
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
		if (el.classList.contains('correct')) return;
		document.querySelectorAll('.qm-opt').forEach((x) => x.classList.remove('selected'));
		el.classList.add('selected');
	}

	function copyRef(e: MouseEvent) {
		const btn = e.currentTarget as HTMLButtonElement;
		btn.textContent = 'Copied!';
		setTimeout(() => (btn.textContent = 'Copy'), 2000);
	}

	function switchNotifTab(e: MouseEvent) {
		document.querySelectorAll('.notif-tab').forEach((x) => x.classList.remove('active'));
		(e.currentTarget as HTMLElement).classList.add('active');
	}

	onMount(() => {
		const cleanupFns: Array<() => void> = [];

		// Particles
		const canvas = document.getElementById('particles') as HTMLCanvasElement | null;
		if (canvas) {
			const ctx = canvas.getContext('2d')!;
			let w = 0, h = 0;
			const pts: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
			const resize = () => { w = canvas.width = innerWidth; h = canvas.height = innerHeight; };
			resize();
			window.addEventListener('resize', resize);
			for (let i = 0; i < 60; i++) {
				pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.2 + 0.4, o: Math.random() * 0.2 + 0.08 });
			}
			let rafId = 0;
			const draw = () => {
				ctx.clearRect(0, 0, w, h);
				pts.forEach((p) => {
					p.x += p.vx; p.y += p.vy;
					if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
					if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(0,240,128,${p.o})`;
					ctx.fill();
				});
				for (let i = 0; i < pts.length; i++) {
					for (let j = i + 1; j < pts.length; j++) {
						const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
						const dist = Math.sqrt(dx * dx + dy * dy);
						if (dist < 100) {
							ctx.beginPath();
							ctx.moveTo(pts[i].x, pts[i].y);
							ctx.lineTo(pts[j].x, pts[j].y);
							ctx.strokeStyle = `rgba(0,240,128,${0.03 * (1 - dist / 100)})`;
							ctx.stroke();
						}
					}
				}
				rafId = requestAnimationFrame(draw);
			};
			draw();
			cleanupFns.push(() => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); });
		}

		// Nav scroll
		const nav = document.getElementById('nav');
		const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 50);
		window.addEventListener('scroll', onScroll);
		cleanupFns.push(() => window.removeEventListener('scroll', onScroll));

		// Reveal
		const rObs = new IntersectionObserver(
			(entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('vis'); }),
			{ threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
		);
		document.querySelectorAll('.r').forEach((el) => rObs.observe(el));
		cleanupFns.push(() => rObs.disconnect());

		// Counters
		const animC = (el: HTMLElement, t: number, pre = '', suf = '') => {
			let s = 0;
			const dur = 2000;
			const step = (ts: number) => {
				if (!s) s = ts;
				const p = Math.min((ts - s) / dur, 1);
				const v = Math.floor(p * t);
				el.textContent = pre + (v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(v >= 1e5 ? 0 : 1) + 'K' : v.toLocaleString()) + suf;
				if (p < 1) requestAnimationFrame(step);
			};
			requestAnimationFrame(step);
		};
		const cObs = new IntersectionObserver(
			(entries) => entries.forEach((n) => {
				const el = n.target as HTMLElement;
				if (n.isIntersecting && !el.dataset.done) {
					el.dataset.done = '1';
					const t = parseInt(el.dataset.count || '0');
					if (t) animC(el, t, el.dataset.prefix || '', el.dataset.suffix || '');
				}
			}),
			{ threshold: 0.5 }
		);
		document.querySelectorAll('[data-count]').forEach((el) => cObs.observe(el));
		cleanupFns.push(() => cObs.disconnect());

		// Calendar
		const g = document.getElementById('calGrid');
		if (g) {
			const p = [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 3, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0];
			for (let i = 0; i < 2; i++) {
				const d = document.createElement('div');
				d.className = 'cal-cell empty';
				g.appendChild(d);
			}
			for (let i = 0; i < 30; i++) {
				const d = document.createElement('div');
				d.className = 'cal-cell';
				if (p[i] === 1) { d.classList.add('done'); d.style.animationDelay = `${i * 0.04}s`; }
				else if (p[i] === 2) d.classList.add('bonus');
				else if (p[i] === 3) d.classList.add('today');
				g.appendChild(d);
			}
		}

		// Progress bar
		const progressBar = document.getElementById('progressBar');
		if (progressBar) {
			const pObs = new IntersectionObserver(
				(entries) => entries.forEach((n) => { if (n.isIntersecting) progressBar.classList.add('animated'); }),
				{ threshold: 0.5 }
			);
			pObs.observe(progressBar);
			cleanupFns.push(() => pObs.disconnect());
		}

		// Mini chart
		const mc = document.getElementById('miniChart');
		if (mc) {
			const vals = [35, 65, 45, 80, 55, 70, 90];
			vals.forEach((v, i) => {
				const b = document.createElement('div');
				b.className = 'mc-bar';
				b.style.height = '0';
				mc.appendChild(b);
				setTimeout(() => (b.style.height = v + '%'), 300 + i * 100);
			});
		}

		// Heatmap
		const hm = document.getElementById('heatmap');
		if (hm) {
			const levels = ['', 'l1', 'l2', 'l3', 'l4'];
			for (let i = 0; i < 48; i++) {
				const c = document.createElement('div');
				c.className = 'hm-cell ' + levels[Math.floor(Math.random() * 5)];
				hm.appendChild(c);
			}
		}

		// Live feed
		const feed = document.getElementById('liveFeed');
		let feedTimer: number | undefined;
		if (feed) {
			const names = ['Priya', 'Marcus', 'Sarah', 'Alex', 'Tamika', 'Derek', 'Alyssa', 'James', 'Lisa', 'Ryan'];
			const actions = ['completed a survey', 'finished the daily quiz', 'claimed a 7-day streak bonus', 'cashed out $25', 'won 200 coins in Trivia', 'started a new streak', 'reached Level 30', 'earned 150 pts from Quiz Sprint'];
			let idx = 0;
			const show = () => {
				if (feed.children.length >= 3) {
					(feed.firstChild as HTMLElement).style.animation = 'toastOut .4s forwards';
					setTimeout(() => feed.firstChild?.remove(), 400);
				}
				const t = document.createElement('div');
				t.className = 'live-toast';
				t.innerHTML = `<span class="lt-dot"></span><span><span class="lt-name">${names[idx % names.length]}</span> ${actions[idx % actions.length]}</span>`;
				feed.appendChild(t);
				idx++;
				feedTimer = window.setTimeout(show, 4000 + Math.random() * 3000);
			};
			feedTimer = window.setTimeout(show, 3000);
		}
		cleanupFns.push(() => { if (feedTimer) clearTimeout(feedTimer); });

		// Daily bonus timer
		let total = 4 * 3600 + 32 * 60 + 17;
		const tmH = document.getElementById('tmH');
		const tmM = document.getElementById('tmM');
		const tmS = document.getElementById('tmS');
		const tick = () => {
			if (total <= 0) return;
			total--;
			const h = Math.floor(total / 3600);
			const m = Math.floor((total % 3600) / 60);
			const s = total % 60;
			if (tmH) tmH.textContent = String(h).padStart(2, '0');
			if (tmM) tmM.textContent = String(m).padStart(2, '0');
			if (tmS) tmS.textContent = String(s).padStart(2, '0');
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
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>
	*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
	:root{
		--bg:#0b1020;--bg2:#10172b;--bg3:#121c33;--bg4:#18243f;
		--sf1:rgba(255,255,255,.03);--sf2:rgba(255,255,255,.06);--sf3:rgba(255,255,255,.09);
		--gl:rgba(255,255,255,.04);--gl-b:rgba(255,255,255,.07);
		--t1:#f5f5fa;--t2:#8888a0;--t3:#5c5c72;
		--green:#35d39a;--gg:rgba(53,211,154,.16);
		--blue:#56a8ff;--bg-b:rgba(86,168,255,.14);
		--orange:#ff8a3d;--og:rgba(255,138,61,.14);
		--purple:#8f7cff;--pg:rgba(143,124,255,.14);
		--pink:#ff5f8f;--yellow:#ffd166;--red:#ff5d73;
		--grad:linear-gradient(135deg,#35d39a,#56a8ff,#8f7cff);
		--grad2:linear-gradient(135deg,#ff8a3d,#ff5f8f);
		--grad3:linear-gradient(135deg,#35d39a,#56a8ff);
		--grad-game:linear-gradient(135deg,#0f1730,#101b34,#0d2025);
		--s1:4px;--s2:8px;--s3:12px;--s4:16px;--s5:20px;--s6:24px;--s7:32px;--s8:48px;--s9:64px;--s10:80px;--s11:120px;
		--r1:8px;--r2:12px;--r3:16px;--r4:20px;--r5:60px;
		--sh1:0 2px 8px rgba(0,0,0,.2);--sh2:0 8px 32px rgba(0,0,0,.3);--sh3:0 24px 64px rgba(0,0,0,.4);--sh4:0 40px 100px rgba(0,0,0,.5);
		--f:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;
		--ease:cubic-bezier(.16,1,.3,1);--ease2:cubic-bezier(.4,0,.2,1);
	}
	html{scroll-behavior:smooth;font-size:16px}
	body{background:var(--bg);color:var(--t1);font-family:var(--f);overflow-x:hidden;line-height:1.65;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
	a{text-decoration:none;color:inherit}
	button{font-family:var(--f);cursor:pointer;border:none;background:none}
	::selection{background:var(--green);color:#000}
	img{display:block;max-width:100%}
	@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
	.container{max-width:1200px;margin:0 auto;padding:0 var(--s6);position:relative;z-index:2}
	.grad-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
	.section-label{font-family:var(--mono);font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:var(--green);margin-bottom:14px;display:flex;align-items:center;gap:10px}
	.section-label::before{content:'';width:24px;height:2px;background:var(--green);border-radius:2px}
	.section-title{font-size:clamp(2rem,5vw,3.2rem);font-weight:800;letter-spacing:-1.5px;line-height:1.08}
	.section-sub{font-size:1.05rem;color:var(--t2);max-width:540px;margin-top:14px;line-height:1.7}
	.btn{display:inline-flex;align-items:center;gap:10px;padding:14px 32px;font-family:var(--f);font-weight:700;font-size:.92rem;border-radius:var(--r5);cursor:pointer;transition:all .3s var(--ease);border:none;position:relative;overflow:hidden;letter-spacing:-.2px}
	.btn-g{background:var(--green);color:#060b08}
	.btn-g:hover{box-shadow:0 0 0 4px var(--gg),0 12px 40px var(--gg);transform:translateY(-3px)}
	.btn-g::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);transform:translateX(-100%);transition:transform .5s}
	.btn-g:hover::after{transform:translateX(100%)}
	.btn-o{background:transparent;border:2px solid rgba(255,255,255,.15);color:var(--t1)}
	.btn-o:hover{border-color:rgba(255,255,255,.35);background:rgba(255,255,255,.05);transform:translateY(-3px)}
	.btn-p{background:var(--purple);color:#fff}
	.btn-p:hover{box-shadow:0 0 0 4px var(--pg),0 12px 40px var(--pg);transform:translateY(-3px)}
	.btn-or{background:var(--orange);color:#fff}
	.btn-or:hover{box-shadow:0 0 0 4px var(--og),0 12px 40px var(--og);transform:translateY(-3px)}
	#particles{position:fixed;inset:0;z-index:0;pointer-events:none}
	nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:14px 0;transition:all .4s var(--ease)}
	nav.scrolled{background:rgba(6,6,11,.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.06);padding:10px 0}
	nav .container{display:flex;align-items:center;justify-content:space-between}
	.logo{display:flex;align-items:center;gap:11px;font-weight:800;font-size:1.3rem;letter-spacing:-.6px}
	.logo-mark{width:40px;height:40px;background:var(--grad);border-radius:12px;display:grid;place-items:center;position:relative}
	.logo-mark::after{content:'';position:absolute;inset:2px;background:var(--bg);border-radius:10px}
	.logo-mark svg{width:20px;height:20px;position:relative;z-index:1;fill:none;stroke:var(--green);stroke-width:2.5;stroke-linecap:round}
	.nav-links{display:flex;align-items:center;gap:28px}
	.nav-links a{font-size:.85rem;font-weight:500;color:var(--t2);transition:color .25s;position:relative}
	.nav-links a:hover{color:var(--t1)}
	.nav-links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--green);transition:width .3s var(--ease)}
	.nav-links a:hover::after{width:100%}
	.nav-right{display:flex;gap:8px;align-items:center}
	.nav-right .btn{padding:9px 20px;font-size:.8rem}
	.nav-coins{display:flex;align-items:center;gap:6px;padding:7px 14px;background:var(--sf2);border:1px solid var(--gl-b);border-radius:var(--r5);font-family:var(--mono);font-size:.78rem;font-weight:700;color:var(--yellow);cursor:pointer;transition:all .25s}
	.nav-coins:hover{background:var(--sf3);border-color:rgba(255,197,61,.2)}
	.nav-coins .coin-icon{font-size:1rem}
	.nav-bell{width:38px;height:38px;border-radius:10px;background:var(--sf2);border:1px solid var(--gl-b);display:grid;place-items:center;cursor:pointer;transition:all .25s;position:relative;font-size:1rem}
	.nav-bell:hover{background:var(--sf3)}
	.nav-bell .bell-dot{position:absolute;top:6px;right:6px;width:8px;height:8px;background:var(--red);border-radius:50%;border:2px solid var(--bg)}
	.notif-drawer{position:fixed;top:0;right:-420px;width:400px;height:100vh;background:var(--bg2);border-left:1px solid var(--gl-b);z-index:2000;transition:right .4s var(--ease);overflow-y:auto;padding:0}
	.notif-drawer.open{right:0}
	.notif-drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1999;opacity:0;pointer-events:none;transition:opacity .3s}
	.notif-drawer-overlay.open{opacity:1;pointer-events:auto}
	.notif-header{padding:var(--s6);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--gl-b);position:sticky;top:0;background:var(--bg2);z-index:1}
	.notif-header h3{font-size:1rem;font-weight:700}
	.notif-close{width:32px;height:32px;border-radius:var(--r1);background:var(--sf2);display:grid;place-items:center;cursor:pointer;color:var(--t2);transition:all .2s;font-size:1.1rem}
	.notif-close:hover{background:var(--sf3);color:var(--t1)}
	.notif-tabs{display:flex;gap:6px;padding:var(--s4) var(--s6);border-bottom:1px solid rgba(255,255,255,.04)}
	.notif-tab{padding:6px 14px;border-radius:var(--r5);font-size:.75rem;font-weight:600;color:var(--t3);background:var(--sf1);cursor:pointer;transition:all .2s}
	.notif-tab.active{background:var(--green);color:#000}
	.notif-tab:hover:not(.active){background:var(--sf2);color:var(--t2)}
	.notif-list{padding:var(--s3) var(--s6)}
	.notif-item{display:flex;gap:12px;padding:var(--s3) 0;border-bottom:1px solid rgba(255,255,255,.03);align-items:flex-start}
	.notif-item.unread{position:relative}
	.notif-item.unread::before{content:'';position:absolute;left:-12px;top:50%;transform:translateY(-50%);width:6px;height:6px;background:var(--green);border-radius:50%}
	.ni-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-size:1rem;flex-shrink:0}
	.ni-icon.reward{background:rgba(255,197,61,.1);border:1px solid rgba(255,197,61,.15)}
	.ni-icon.survey{background:rgba(0,187,255,.1);border:1px solid rgba(0,187,255,.15)}
	.ni-icon.system{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
	.ni-icon.streak{background:rgba(0,240,128,.1);border:1px solid rgba(0,240,128,.15)}
	.ni-text{flex:1;min-width:0}
	.ni-text strong{display:block;font-size:.82rem;font-weight:600;margin-bottom:2px}
	.ni-text p{font-size:.75rem;color:var(--t3);line-height:1.5}
	.ni-time{font-size:.65rem;color:var(--t3);white-space:nowrap;margin-top:2px}
	.live-bar{position:fixed;bottom:var(--s6);left:var(--s6);z-index:900;display:flex;flex-direction:column;gap:8px;pointer-events:none}
	.live-toast{display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(10,10,18,.92);border:1px solid var(--gl-b);border-radius:var(--r2);backdrop-filter:blur(16px);font-size:.78rem;font-weight:500;color:var(--t2);box-shadow:var(--sh2);animation:toastIn .5s var(--ease) both;pointer-events:auto;max-width:320px}
	.live-toast .lt-dot{width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0;animation:pulse 2s infinite}
	.live-toast .lt-name{color:var(--t1);font-weight:600}
	@keyframes toastIn{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
	@keyframes toastOut{to{opacity:0;transform:translateX(-30px)}}
	@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
	.hero{padding:150px 0 100px;position:relative;overflow:hidden;min-height:100vh;display:flex;align-items:center}
	.hero-orb{position:absolute;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0}
	.hero-orb.o1{width:700px;height:700px;top:-200px;right:-200px;background:radial-gradient(circle,var(--gg),transparent 70%);animation:orbF 8s ease-in-out infinite}
	.hero-orb.o2{width:500px;height:500px;bottom:-100px;left:-150px;background:radial-gradient(circle,var(--bg-b),transparent 70%);animation:orbF 10s ease-in-out infinite 2s}
	.hero-orb.o3{width:400px;height:400px;top:40%;left:40%;background:radial-gradient(circle,var(--pg),transparent 70%);animation:orbF 12s ease-in-out infinite 4s}
	@keyframes orbF{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-20px) scale(1.1)}}
	.hero .container{display:grid;grid-template-columns:1.1fr .9fr;gap:60px;align-items:center}
	.hero-content{z-index:2}
	.hero-chip{display:inline-flex;align-items:center;gap:10px;padding:8px 18px 8px 10px;border-radius:var(--r5);border:1px solid var(--gl-b);background:var(--gl);font-size:.78rem;font-weight:600;color:var(--green);margin-bottom:24px;backdrop-filter:blur(12px);animation:fadeUp .7s var(--ease) both}
	.chip-dot{width:10px;height:10px;background:var(--green);border-radius:50%;position:relative}
	.chip-dot::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid var(--green);animation:ping 2s ease-out infinite}
	@keyframes ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(2);opacity:0}}
	@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
	.hero h1{font-size:clamp(2.8rem,5vw,4.4rem);font-weight:800;line-height:1.02;letter-spacing:-2.2px;margin-bottom:22px}
	.hero h1 .line{display:block;animation:fadeUp .8s var(--ease) both}
	.hero h1 .line:nth-child(2){animation-delay:.12s}
	.hero h1 .line:nth-child(3){animation-delay:.24s}
	.hero-underline{position:relative;display:inline-block}
	.hero-underline::after{content:'';position:absolute;bottom:2px;left:0;width:100%;height:6px;background:var(--grad);border-radius:4px;opacity:.4;animation:uPulse 3s ease-in-out infinite}
	@keyframes uPulse{0%,100%{opacity:.3;transform:scaleX(.9)}50%{opacity:.6;transform:scaleX(1)}}
	.hero-desc{font-size:1.12rem;color:var(--t2);line-height:1.75;margin-bottom:36px;max-width:480px;animation:fadeUp .8s var(--ease) .3s both}
	.hero-ctas{display:flex;gap:14px;flex-wrap:wrap;animation:fadeUp .8s var(--ease) .4s both}
	.hero-ticker{display:flex;gap:36px;margin-top:48px;padding-top:28px;border-top:1px solid rgba(255,255,255,.06);animation:fadeUp .8s var(--ease) .5s both}
	.tick-val{font-family:var(--mono);font-size:1.4rem;font-weight:700;letter-spacing:-1px}
	.tick-val.c-green{color:var(--green)}.tick-val.c-blue{color:var(--blue)}.tick-val.c-orange{color:var(--orange)}
	.tick-label{font-size:.76rem;color:var(--t3);margin-top:4px;font-weight:500}
	.phone-shell{background:linear-gradient(160deg,#1a1a28,#0d0d16);border-radius:36px;padding:12px;border:1.5px solid rgba(255,255,255,.1);box-shadow:var(--sh4),0 0 0 1px rgba(255,255,255,.04) inset;position:relative}
	.phone-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:90px;height:24px;background:var(--bg);border-radius:0 0 12px 12px;z-index:5}
	.phone-screen{background:var(--bg3);border-radius:26px;overflow:hidden;aspect-ratio:9/18;position:relative}
	.scr-status{height:30px;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;font-size:.5rem;font-weight:600;color:var(--t3)}
	.scr-header{padding:4px 14px 8px;display:flex;justify-content:space-between;align-items:center}
	.scr-greet{font-size:.55rem;color:var(--t2)}.scr-greet strong{display:block;font-size:.85rem;color:var(--t1);margin-top:1px}
	.scr-wallet{text-align:right}.scr-wallet small{font-size:.5rem;color:var(--t3);display:block}.scr-wallet .bal{font-family:var(--mono);font-size:.95rem;font-weight:700;color:var(--green)}
	.scr-streak{margin:4px 10px;background:linear-gradient(135deg,rgba(0,240,128,.1),rgba(0,187,255,.05));border:1px solid rgba(0,240,128,.18);border-radius:12px;padding:10px}
	.scr-streak-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
	.scr-streak-label{font-size:.55rem;font-weight:700;color:var(--green)}.scr-streak-num{font-family:var(--mono);font-size:1rem;font-weight:700}
	.scr-days{display:flex;gap:3px}
	.scr-day{width:22px;height:22px;border-radius:5px;display:grid;place-items:center;font-size:.45rem;font-weight:700;background:rgba(255,255,255,.06);color:var(--t3)}
	.scr-day.on{background:var(--green);color:#000}.scr-day.now{border:2px solid var(--green);background:transparent;color:var(--green)}
	.scr-section{padding:8px 12px 4px;font-size:.52rem;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px}
	.scr-quiz{margin:0 10px 4px;background:linear-gradient(135deg,rgba(180,74,255,.08),rgba(255,56,112,.04));border:1px solid rgba(180,74,255,.12);border-radius:10px;padding:8px;display:flex;align-items:center;gap:8px}
	.scr-quiz-icon{font-size:1rem}.scr-quiz-info .qt{font-size:.6rem;font-weight:700}.scr-quiz-info .qs{font-size:.5rem;color:var(--t3)}
	.scr-quiz-pts{margin-left:auto;font-family:var(--mono);font-size:.6rem;font-weight:700;color:var(--orange)}
	.scr-earn-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px 10px}
	.scr-earn-item{background:rgba(255,255,255,.04);border-radius:8px;padding:6px 2px;text-align:center}
	.scr-earn-item .ei{font-size:.95rem}.scr-earn-item .el{font-size:.45rem;font-weight:600;color:var(--t3)}
	.scr-offer{margin:3px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:8px;padding:6px 8px;display:flex;align-items:center;gap:6px}
	.scr-offer-logo{width:24px;height:24px;border-radius:6px;display:grid;place-items:center;font-size:.6rem;font-weight:700;flex-shrink:0}
	.scr-offer-info .ot{font-size:.55rem;font-weight:600}.scr-offer-info .os{font-size:.45rem;color:var(--t3)}
	.scr-offer-val{margin-left:auto;font-family:var(--mono);font-size:.55rem;font-weight:700;color:var(--green)}
	.hero-visual{position:relative;z-index:2;perspective:1200px}
	.phone-wrapper{position:relative;max-width:300px;margin:0 auto;animation:phoneF 6s ease-in-out infinite}
	@keyframes phoneF{0%,100%{transform:translateY(0) rotateY(-2deg)}50%{transform:translateY(-12px) rotateY(2deg)}}
	.hero-float{position:absolute;z-index:10;animation:floatB 5s ease-in-out infinite}
	.hero-float.f1{top:12%;right:-50px}.hero-float.f2{bottom:20%;left:-60px;animation-delay:1.5s}.hero-float.f3{top:55%;right:-45px;animation-delay:3s}
	@keyframes floatB{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
	.float-card{display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(10,10,18,.92);border:1px solid rgba(255,255,255,.1);border-radius:var(--r2);backdrop-filter:blur(16px);box-shadow:var(--sh2);white-space:nowrap;font-size:.75rem;font-weight:600}
	.float-card .fc-sub{font-size:.62rem;color:var(--t3)}.float-card .fc-val{font-family:var(--mono);font-size:.78rem;font-weight:700}
	.marquee-wrap{padding:40px 0;border-top:1px solid rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.04);overflow:hidden;position:relative;z-index:2}
	.marquee-label{text-align:center;font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:3px;color:var(--t3);margin-bottom:20px}
	.marquee-inner{display:flex;width:max-content;animation:mScroll 30s linear infinite}
	.marquee-item{padding:0 36px;font-size:1rem;font-weight:700;color:rgba(255,255,255,.1);white-space:nowrap;display:flex;align-items:center;gap:12px}
	.marquee-item .m-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.08)}
	@keyframes mScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
	.stats{padding:var(--s10) 0;position:relative;z-index:2}
	.stats .container{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
	.stat-card{text-align:center;padding:var(--s7) var(--s5);border-radius:var(--r4);background:var(--gl);border:1px solid var(--gl-b);backdrop-filter:blur(12px);transition:all .4s var(--ease)}
	.stat-card:hover{border-color:rgba(255,255,255,.12);transform:translateY(-4px);box-shadow:var(--sh2)}
	.stat-val{font-family:var(--mono);font-size:2.2rem;font-weight:700;letter-spacing:-2px}
	.stat-card:nth-child(1) .stat-val{color:var(--green)}.stat-card:nth-child(2) .stat-val{color:var(--blue)}
	.stat-card:nth-child(3) .stat-val{color:var(--orange)}.stat-card:nth-child(4) .stat-val{color:var(--purple)}
	.stat-desc{font-size:.82rem;color:var(--t2);margin-top:6px;font-weight:500}
	.how{padding:var(--s11) 0;position:relative;z-index:2}
	.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:var(--s9)}
	.step-card{padding:36px 28px;border-radius:var(--r4);background:var(--gl);border:1px solid var(--gl-b);backdrop-filter:blur(8px);position:relative;overflow:hidden;transition:all .4s var(--ease)}
	.step-card:hover{border-color:rgba(255,255,255,.14);transform:translateY(-6px);box-shadow:var(--sh3)}
	.step-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--grad);opacity:0;transition:opacity .3s}
	.step-card:hover::before{opacity:1}
	.step-num{font-family:var(--mono);font-size:3rem;font-weight:700;line-height:1;margin-bottom:18px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;opacity:.6}
	.step-card h3{font-size:1.15rem;font-weight:700;margin-bottom:10px}
	.step-card p{font-size:.85rem;color:var(--t2);line-height:1.7}
	.dash-preview{padding:var(--s11) 0;background:var(--bg2);position:relative;z-index:2;overflow:hidden}
	.dash-preview::before{content:'';position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:500px;background:radial-gradient(ellipse,var(--gg),transparent 70%);filter:blur(100px);pointer-events:none;opacity:.5}
	.dash-mock{margin-top:var(--s9);background:var(--bg);border:1px solid var(--gl-b);border-radius:var(--r4);overflow:hidden;box-shadow:var(--sh4);position:relative}
	.dash-titlebar{padding:14px 20px;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:8px}
	.dash-dot{width:10px;height:10px;border-radius:50%}
	.dash-dot.red{background:#ff5f57}.dash-dot.yel{background:#febc2e}.dash-dot.grn{background:#28c840}
	.dash-titlebar span{margin-left:auto;font-size:.7rem;color:var(--t3);font-weight:500}
	.dash-body{padding:var(--s6);display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
	.dash-widget{background:var(--sf1);border:1px solid var(--gl-b);border-radius:var(--r3);padding:var(--s5)}
	.dash-widget.wide{grid-column:span 2}
	.dw-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
	.dw-header h4{font-size:.82rem;font-weight:700}.dw-header span{font-size:.7rem;color:var(--t3)}
	.mini-chart{display:flex;align-items:flex-end;gap:4px;height:80px}
	.mc-bar{flex:1;border-radius:4px 4px 0 0;transition:height 1.5s var(--ease);background:var(--green);opacity:.7}
	.mc-bar:nth-child(even){background:var(--blue)}
	.mc-bar:nth-child(3n){background:var(--purple)}
	.mini-donut{width:80px;height:80px;border-radius:50%;background:conic-gradient(var(--green) 0% 42%,var(--blue) 42% 68%,var(--purple) 68% 85%,var(--sf2) 85% 100%);display:grid;place-items:center;margin:0 auto}
	.mini-donut .donut-center{width:50px;height:50px;border-radius:50%;background:var(--bg);display:grid;place-items:center;font-family:var(--mono);font-size:.9rem;font-weight:700}
	.dw-stats{display:flex;gap:16px;margin-top:12px}
	.dw-stat{flex:1;text-align:center}
	.dw-stat .ds-val{font-family:var(--mono);font-size:1.1rem;font-weight:700}
	.dw-stat .ds-label{font-size:.65rem;color:var(--t3);margin-top:2px}
	.mini-heatmap{display:grid;grid-template-columns:repeat(12,1fr);gap:3px}
	.hm-cell{aspect-ratio:1;border-radius:3px;background:var(--sf1)}
	.hm-cell.l1{background:rgba(0,240,128,.15)}.hm-cell.l2{background:rgba(0,240,128,.3)}.hm-cell.l3{background:rgba(0,240,128,.5)}.hm-cell.l4{background:rgba(0,240,128,.75)}
	.earn{padding:var(--s11) 0;position:relative;z-index:2;overflow:hidden}
	.earn::before{content:'';position:absolute;top:-200px;right:-200px;width:600px;height:600px;background:radial-gradient(circle,var(--pg),transparent 70%);filter:blur(80px);pointer-events:none}
	.earn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:var(--s9)}
	.earn-card{border-radius:var(--r4);background:var(--bg2);border:1px solid rgba(255,255,255,.06);overflow:hidden;transition:all .4s var(--ease);position:relative}
	.earn-card:hover{border-color:rgba(255,255,255,.12);transform:translateY(-6px);box-shadow:var(--sh3)}
	.earn-card-glow{position:absolute;top:0;left:0;right:0;height:100px;opacity:0;transition:opacity .4s;pointer-events:none}
	.earn-card:hover .earn-card-glow{opacity:1}
	.earn-card:nth-child(1) .earn-card-glow{background:radial-gradient(ellipse at 50% 0%,var(--gg),transparent 70%)}
	.earn-card:nth-child(2) .earn-card-glow{background:radial-gradient(ellipse at 50% 0%,var(--pg),transparent 70%)}
	.earn-card:nth-child(3) .earn-card-glow{background:radial-gradient(ellipse at 50% 0%,var(--bg-b),transparent 70%)}
	.earn-card:nth-child(4) .earn-card-glow{background:radial-gradient(ellipse at 50% 0%,var(--og),transparent 70%)}
	.earn-card:nth-child(5) .earn-card-glow{background:radial-gradient(ellipse at 50% 0%,rgba(255,56,112,.1),transparent 70%)}
	.earn-card:nth-child(6) .earn-card-glow{background:radial-gradient(ellipse at 50% 0%,rgba(255,197,61,.1),transparent 70%)}
	.earn-card-body{padding:32px 24px;position:relative;z-index:1}
	.earn-icon{width:56px;height:56px;border-radius:14px;display:grid;place-items:center;font-size:1.5rem;margin-bottom:18px}
	.earn-card:nth-child(1) .earn-icon{background:rgba(0,240,128,.08);border:1px solid rgba(0,240,128,.15)}
	.earn-card:nth-child(2) .earn-icon{background:rgba(180,74,255,.08);border:1px solid rgba(180,74,255,.15)}
	.earn-card:nth-child(3) .earn-icon{background:rgba(0,187,255,.08);border:1px solid rgba(0,187,255,.15)}
	.earn-card:nth-child(4) .earn-icon{background:rgba(255,107,44,.08);border:1px solid rgba(255,107,44,.15)}
	.earn-card:nth-child(5) .earn-icon{background:rgba(255,56,112,.08);border:1px solid rgba(255,56,112,.15)}
	.earn-card:nth-child(6) .earn-icon{background:rgba(255,197,61,.08);border:1px solid rgba(255,197,61,.15)}
	.earn-card h3{font-size:1.1rem;font-weight:700;margin-bottom:8px}.earn-card p{font-size:.82rem;color:var(--t2);line-height:1.65}
	.earn-tag{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:var(--r5);font-size:.68rem;font-weight:700;background:var(--sf2);color:var(--t2);margin-top:16px}
	.games{padding:var(--s11) 0;position:relative;z-index:2;overflow:hidden;background:var(--grad-game)}
	.games::before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");pointer-events:none}
	.games::after{content:'';position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:900px;height:500px;background:radial-gradient(ellipse,rgba(180,74,255,.08),transparent 60%);filter:blur(60px);pointer-events:none}
	.games .section-label{color:var(--purple)}
	.games .section-label::before{background:var(--purple)}
	.daily-bonus{margin-bottom:var(--s8);padding:20px 28px;border-radius:var(--r3);background:linear-gradient(135deg,rgba(255,107,44,.1),rgba(255,56,112,.08));border:1px solid rgba(255,107,44,.2);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
	.db-left{display:flex;align-items:center;gap:14px}
	.db-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,var(--orange),var(--pink));display:grid;place-items:center;font-size:1.4rem;flex-shrink:0}
	.db-text h4{font-size:1rem;font-weight:700}.db-text p{font-size:.8rem;color:var(--t2)}
	.db-timer{display:flex;gap:8px;align-items:center}
	.db-timer-unit{text-align:center;padding:8px 12px;background:rgba(0,0,0,.3);border-radius:var(--r1);min-width:48px}
	.db-timer-unit .tu-val{font-family:var(--mono);font-size:1.2rem;font-weight:700;color:var(--orange)}
	.db-timer-unit .tu-label{font-size:.55rem;color:var(--t3);text-transform:uppercase;letter-spacing:1px}
	.db-timer-sep{font-family:var(--mono);font-size:1.2rem;font-weight:700;color:var(--t3)}
	.game-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:var(--s8)}
	.game-card{border-radius:var(--r3);background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);overflow:hidden;transition:all .35s var(--ease);position:relative}
	.game-card:hover{border-color:rgba(255,255,255,.14);transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,.4)}
	.game-card-top{padding:24px 20px 16px;display:flex;gap:14px;align-items:flex-start}
	.gc-thumb{width:56px;height:56px;border-radius:14px;display:grid;place-items:center;font-size:1.6rem;flex-shrink:0;position:relative}
	.gc-thumb.t1{background:linear-gradient(135deg,#00f080,#00bbff)}.gc-thumb.t2{background:linear-gradient(135deg,#b44aff,#ff3870)}
	.gc-thumb.t3{background:linear-gradient(135deg,#ffc53d,#ff6b2c)}.gc-thumb.t4{background:linear-gradient(135deg,#00bbff,#b44aff)}
	.gc-thumb.t5{background:linear-gradient(135deg,#ff3870,#ff6b2c)}.gc-thumb.t6{background:linear-gradient(135deg,#00f080,#ffc53d)}
	.gc-info{flex:1;min-width:0}
	.gc-info h4{font-size:.95rem;font-weight:700;margin-bottom:3px}
	.gc-info p{font-size:.75rem;color:var(--t3);line-height:1.4}
	.gc-badges{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
	.gc-badge{padding:3px 10px;border-radius:var(--r5);font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
	.gc-badge.easy{background:rgba(0,240,128,.12);color:var(--green)}.gc-badge.medium{background:rgba(255,197,61,.12);color:var(--yellow)}
	.gc-badge.hard{background:rgba(255,68,85,.12);color:var(--red)}
	.gc-badge.hot{background:rgba(255,56,112,.2);color:var(--pink)}.gc-badge.new{background:rgba(0,187,255,.15);color:var(--blue)}
	.gc-coins{font-family:var(--mono);font-size:.72rem;font-weight:700;color:var(--yellow);display:flex;align-items:center;gap:4px}
	.game-card-bottom{padding:0 20px 20px;display:flex;justify-content:space-between;align-items:center}
	.gc-players{font-size:.7rem;color:var(--t3);display:flex;align-items:center;gap:4px}
	.gc-play{padding:8px 20px;border-radius:var(--r5);font-size:.75rem;font-weight:700;transition:all .25s var(--ease);cursor:pointer}
	.gc-play.gp-green{background:var(--green);color:#000}.gc-play.gp-purple{background:var(--purple);color:#fff}
	.gc-play.gp-orange{background:var(--orange);color:#fff}
	.gc-play:hover{transform:scale(1.05);box-shadow:0 4px 20px rgba(0,0,0,.3)}
	.leaderboard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:var(--r3);padding:var(--s6);max-width:480px;margin:0 auto}
	.lb-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--s5)}
	.lb-header h4{font-size:1rem;font-weight:700;display:flex;align-items:center;gap:8px}
	.lb-header span{font-size:.72rem;color:var(--t3)}
	.lb-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--r2);transition:all .3s;margin-bottom:4px}
	.lb-row:hover{background:rgba(255,255,255,.04)}
	.lb-row.gold{background:rgba(255,197,61,.06);border:1px solid rgba(255,197,61,.1)}
	.lb-rank{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-family:var(--mono);font-size:.75rem;font-weight:700;flex-shrink:0}
	.lb-rank.r1{background:linear-gradient(135deg,#ffc53d,#ff6b2c);color:#000}.lb-rank.r2{background:rgba(192,192,192,.2);color:#ccc}
	.lb-rank.r3{background:rgba(205,127,50,.15);color:#cd7f32}.lb-rank.rn{background:var(--sf1);color:var(--t3)}
	.lb-avatar{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-size:.7rem;font-weight:700;flex-shrink:0;color:#000}
	.lb-name{flex:1;font-size:.85rem;font-weight:600}.lb-name span{display:block;font-size:.65rem;color:var(--t3);font-weight:400}
	.lb-score{font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--yellow)}
	.streak-sec{padding:var(--s11) 0;position:relative;z-index:2;overflow:hidden}
	.streak-sec .container{display:grid;grid-template-columns:1fr 1fr;gap:var(--s10);align-items:center}
	.cal-wrap{background:var(--bg2);border:1px solid var(--gl-b);border-radius:var(--r4);padding:36px;position:relative;overflow:hidden}
	.cal-wrap::before{content:'';position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:radial-gradient(circle,var(--gg),transparent);border-radius:50%}
	.cal-month{font-size:.82rem;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px;position:relative}
	.cm-badge{font-family:var(--mono);font-size:.62rem;padding:3px 8px;border-radius:var(--r5);background:rgba(0,240,128,.1);color:var(--green);font-weight:700}
	.cal-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin:14px 0 8px}
	.cal-weekdays span{text-align:center;font-size:.55rem;font-weight:600;color:var(--t3);text-transform:uppercase}
	.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
	.cal-cell{aspect-ratio:1;border-radius:6px;display:grid;place-items:center;font-size:.65rem;font-weight:600;background:var(--sf1);color:var(--t3);transition:all .3s}
	.cal-cell.done{background:var(--green);color:#000;box-shadow:0 3px 12px var(--gg);animation:cPop .4s var(--ease) both}
	.cal-cell.done::after{content:'✓';font-size:.5rem;font-weight:800}
	.cal-cell.bonus{background:linear-gradient(135deg,var(--orange),var(--pink));color:#fff;box-shadow:0 3px 12px var(--og)}
	.cal-cell.bonus::after{content:'★';font-size:.5rem}
	.cal-cell.today{border:2px solid var(--green);background:transparent;color:var(--green);animation:tPulse 2.5s ease-in-out infinite}
	.cal-cell.empty{background:transparent}
	@keyframes cPop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}
	@keyframes tPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,240,128,.2)}50%{box-shadow:0 0 0 6px transparent}}
	.cal-legend{display:flex;gap:16px;margin-top:16px;font-size:.68rem;color:var(--t3)}.cal-legend span{display:flex;align-items:center;gap:5px}
	.legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
	.progress-wrap{margin-top:20px;padding:16px;background:var(--sf1);border-radius:var(--r2)}
	.progress-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:.8rem;font-weight:600}
	.progress-top .pv{font-family:var(--mono);color:var(--green)}
	.progress-track{height:8px;background:var(--sf2);border-radius:8px;overflow:hidden}
	.progress-fill{height:100%;background:var(--grad3);border-radius:8px;width:0;transition:width 2s var(--ease)}
	.progress-fill.animated{width:72%}
	.milestones{display:flex;gap:10px;margin-top:16px}
	.milestone{flex:1;padding:10px;border-radius:var(--r1);background:var(--sf1);border:1px solid rgba(255,255,255,.04);text-align:center;transition:all .3s}
	.milestone.active{border-color:var(--green);background:rgba(0,240,128,.06)}
	.milestone .ms-day{font-family:var(--mono);font-size:.82rem;font-weight:700}.milestone.active .ms-day{color:var(--green)}
	.milestone .ms-reward{font-size:.55rem;color:var(--t3);margin-top:2px}
	.streak-info .s-tag{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:var(--r5);background:rgba(255,107,44,.08);border:1px solid rgba(255,107,44,.15);color:var(--orange);font-size:.78rem;font-weight:700;margin-bottom:24px}
	.streak-info h2{font-size:clamp(2rem,4vw,2.6rem);font-weight:800;letter-spacing:-1.5px;line-height:1.1;margin-bottom:16px}
	.streak-info > p{font-size:.95rem;color:var(--t2);line-height:1.75;margin-bottom:28px}
	.feat-list{display:flex;flex-direction:column;gap:12px;margin-bottom:32px}
	.feat-item{display:flex;align-items:center;gap:12px;font-size:.88rem;font-weight:500}
	.feat-check{width:28px;height:28px;border-radius:var(--r1);background:var(--green);color:#000;display:grid;place-items:center;font-size:.75rem;font-weight:800;flex-shrink:0}
	.quiz-sec{padding:var(--s11) 0;background:var(--bg2);position:relative;z-index:2;overflow:hidden}
	.quiz-sec::before{content:'';position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:800px;height:400px;background:radial-gradient(ellipse,var(--pg),transparent 70%);pointer-events:none;filter:blur(40px)}
	.quiz-sec .container{display:grid;grid-template-columns:1fr 1fr;gap:var(--s10);align-items:center}
	.quiz-info .q-tag{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:var(--r5);background:rgba(180,74,255,.08);border:1px solid rgba(180,74,255,.15);color:var(--purple);font-size:.78rem;font-weight:700;margin-bottom:24px}
	.quiz-info h2{font-size:clamp(2rem,4vw,2.6rem);font-weight:800;letter-spacing:-1.5px;line-height:1.1;margin-bottom:16px}
	.quiz-info > p{font-size:.95rem;color:var(--t2);line-height:1.75;margin-bottom:28px}
	.quiz-cats{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}
	.q-cat{padding:7px 14px;border-radius:var(--r5);font-size:.72rem;font-weight:600;background:var(--sf1);border:1px solid rgba(255,255,255,.06);color:var(--t2);transition:all .25s;cursor:pointer}
	.q-cat:hover{border-color:rgba(255,255,255,.15);background:var(--sf2);color:var(--t1)}
	.quiz-mock{background:var(--bg);border:1px solid rgba(255,255,255,.08);border-radius:var(--r4);overflow:hidden;box-shadow:var(--sh3);transition:all .4s var(--ease)}
	.quiz-mock:hover{transform:translateY(-4px)}
	.qm-header{padding:20px 24px;background:linear-gradient(135deg,rgba(180,74,255,.1),rgba(0,187,255,.05));border-bottom:1px solid rgba(255,255,255,.06);position:relative;overflow:hidden}
	.qm-cat{font-size:.65rem;font-weight:700;color:var(--purple);text-transform:uppercase;letter-spacing:1.5px}
	.qm-title{font-size:1.05rem;font-weight:700;margin-top:4px}.qm-meta{display:flex;gap:16px;margin-top:8px;font-size:.72rem;color:var(--t2)}
	.qm-timer{height:4px;background:var(--sf2)}.qm-timer-fill{height:100%;width:60%;background:var(--grad);animation:tPulse2 3s ease-in-out infinite}
	@keyframes tPulse2{0%,100%{opacity:.8}50%{opacity:1}}
	.qm-body{padding:24px}
	.qm-question{font-size:.95rem;font-weight:600;margin-bottom:18px;line-height:1.5}
	.qm-question .q-num{font-family:var(--mono);color:var(--purple);font-size:.82rem}
	.qm-options{display:flex;flex-direction:column;gap:8px}
	.qm-opt{padding:12px 16px;border-radius:var(--r2);border:1.5px solid rgba(255,255,255,.08);background:var(--sf1);display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .25s;font-size:.85rem;font-weight:500}
	.qm-opt:hover{border-color:rgba(180,74,255,.3);background:rgba(180,74,255,.05)}
	.opt-l{width:28px;height:28px;border-radius:var(--r1);background:var(--sf2);display:grid;place-items:center;font-size:.72rem;font-weight:700;color:var(--t3);flex-shrink:0;transition:all .25s}
	.qm-opt:hover .opt-l{background:var(--purple);color:#fff}
	.qm-opt.correct{border-color:rgba(0,240,128,.4);background:rgba(0,240,128,.06)}
	.qm-opt.correct .opt-l{background:var(--green);color:#000}
	.qm-result{margin-top:16px;padding:14px 16px;border-radius:var(--r2);background:linear-gradient(135deg,rgba(0,240,128,.06),rgba(0,187,255,.04));border:1px solid rgba(0,240,128,.15);display:flex;align-items:center;gap:12px}
	.qm-result .r-icon{width:32px;height:32px;border-radius:8px;background:var(--green);color:#000;display:grid;place-items:center;font-size:.9rem;flex-shrink:0}
	.qm-result .r-text{font-size:.78rem;color:var(--t2);line-height:1.5}.qm-result .r-text strong{color:var(--t1);display:block;margin-bottom:1px}
	.qm-result .r-pts{margin-left:auto;font-family:var(--mono);font-weight:700;color:var(--green);font-size:.95rem}
	.survey-widget{padding:var(--s11) 0;position:relative;z-index:2;overflow:hidden}
	.survey-widget::before{content:'';position:absolute;bottom:-100px;right:-200px;width:500px;height:500px;background:radial-gradient(circle,var(--bg-b),transparent 70%);filter:blur(80px);pointer-events:none}
	.sw-container{max-width:700px;margin:var(--s8) auto 0}
	.sw-card{background:var(--bg2);border:1px solid var(--gl-b);border-radius:var(--r4);overflow:hidden}
	.sw-progress{height:4px;background:var(--sf2)}.sw-progress-fill{height:100%;background:var(--grad);transition:width .5s var(--ease)}
	.sw-body{padding:var(--s8) var(--s7)}
	.sw-step{font-family:var(--mono);font-size:.72rem;color:var(--blue);margin-bottom:12px}
	.sw-question{font-size:1.4rem;font-weight:700;margin-bottom:var(--s7);line-height:1.3;letter-spacing:-.5px}
	.sw-options{display:flex;flex-direction:column;gap:10px}
	.sw-opt{padding:16px 20px;border-radius:var(--r2);border:1.5px solid rgba(255,255,255,.08);background:var(--sf1);cursor:pointer;transition:all .25s;font-size:.92rem;font-weight:500;display:flex;align-items:center;gap:12px}
	.sw-opt:hover{border-color:rgba(0,187,255,.3);background:rgba(0,187,255,.05);transform:translateX(4px)}
	.sw-opt .sw-letter{width:32px;height:32px;border-radius:var(--r1);background:var(--sf2);display:grid;place-items:center;font-size:.8rem;font-weight:700;color:var(--t3);transition:all .2s;flex-shrink:0}
	.sw-opt:hover .sw-letter{background:var(--blue);color:#fff}
	.sw-opt.selected{border-color:var(--green);background:rgba(0,240,128,.05)}
	.sw-opt.selected .sw-letter{background:var(--green);color:#000}
	.sw-footer{padding:var(--s5) var(--s7);display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.04)}
	.sw-footer .sw-skip{font-size:.8rem;color:var(--t3);cursor:pointer;transition:color .2s}.sw-footer .sw-skip:hover{color:var(--t2)}
	.referral{padding:var(--s11) 0;background:var(--bg2);position:relative;z-index:2;overflow:hidden}
	.referral::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,var(--gg),transparent 50%);opacity:.3;pointer-events:none}
	.ref-card{margin-top:var(--s8);display:grid;grid-template-columns:1.2fr .8fr;gap:var(--s9);align-items:center}
	.ref-left h3{font-size:1.8rem;font-weight:800;letter-spacing:-1px;margin-bottom:12px;line-height:1.2}
	.ref-left p{font-size:.92rem;color:var(--t2);margin-bottom:var(--s6);line-height:1.7}
	.ref-link-box{display:flex;gap:8px;margin-bottom:var(--s6)}
	.ref-link-input{flex:1;padding:12px 16px;border-radius:var(--r2);background:var(--sf1);border:1px solid var(--gl-b);font-family:var(--mono);font-size:.78rem;color:var(--green);outline:none}
	.ref-link-input:focus{border-color:var(--green)}
	.ref-copy{padding:12px 20px;border-radius:var(--r2);background:var(--green);color:#000;font-weight:700;font-size:.8rem;cursor:pointer;transition:all .2s}
	.ref-copy:hover{box-shadow:0 4px 20px var(--gg)}
	.ref-share{display:flex;gap:8px}
	.ref-share-btn{padding:10px 18px;border-radius:var(--r2);background:var(--sf2);border:1px solid var(--gl-b);font-size:.78rem;font-weight:600;color:var(--t2);cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
	.ref-share-btn:hover{background:var(--sf3);color:var(--t1)}
	.ref-ladder{display:flex;flex-direction:column;gap:12px}
	.rl-tier{display:flex;align-items:center;gap:14px;padding:16px 20px;border-radius:var(--r3);background:var(--sf1);border:1px solid rgba(255,255,255,.05);transition:all .3s}
	.rl-tier.active{border-color:var(--green);background:rgba(0,240,128,.05)}
	.rl-tier.locked{opacity:.5}
	.rl-badge{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;font-size:1.2rem;flex-shrink:0}
	.rl-info{flex:1}.rl-info h5{font-size:.88rem;font-weight:700}.rl-info p{font-size:.72rem;color:var(--t3)}
	.rl-reward{font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--green)}
	.why{padding:var(--s11) 0;position:relative;z-index:2}
	.why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:var(--s9)}
	.why-card{padding:28px 24px;border-radius:var(--r4);background:var(--gl);border:1px solid var(--gl-b);backdrop-filter:blur(8px);transition:all .4s var(--ease);position:relative;overflow:hidden}
	.why-card:hover{border-color:rgba(255,255,255,.14);transform:translateY(-6px)}
	.why-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:var(--grad);transform:scaleX(0);transition:transform .4s var(--ease);transform-origin:left}
	.why-card:hover::after{transform:scaleX(1)}
	.why-icon{font-size:1.8rem;margin-bottom:16px}.why-card h3{font-size:1.05rem;font-weight:700;margin-bottom:8px}.why-card p{font-size:.82rem;color:var(--t2);line-height:1.65}
	.testi-card,.earn-card,.step-card,.stat-card,.quiz-mock,.cal-wrap,.leaderboard{box-shadow:0 18px 50px rgba(0,0,0,.22)}
	.reviews{padding:var(--s11) 0;background:var(--bg2);position:relative;z-index:2;overflow:hidden}
	.reviews-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:var(--s8);flex-wrap:wrap;gap:16px}
	.review-badge{display:flex;align-items:center;gap:10px;padding:10px 20px;background:var(--gl);border:1px solid var(--gl-b);border-radius:var(--r5);font-size:.85rem;font-weight:600;backdrop-filter:blur(8px)}
	.rb-stars{color:var(--yellow);letter-spacing:2px}
	.review-track-wrap{overflow:hidden;position:relative}
	.review-track-wrap::before,.review-track-wrap::after{content:'';position:absolute;top:0;bottom:0;width:80px;z-index:5;pointer-events:none}
	.review-track-wrap::before{left:0;background:linear-gradient(90deg,var(--bg2),transparent)}
	.review-track-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg2),transparent)}
	.review-track{display:flex;gap:16px;width:max-content}
	.review-track.t1{animation:rScroll 45s linear infinite}
	.review-track.t2{animation:rScroll 50s linear infinite reverse}
	@keyframes rScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
	.review-card{width:360px;flex-shrink:0;padding:24px;border-radius:var(--r4);background:var(--bg);border:1px solid rgba(255,255,255,.06)}
	.rc-top{display:flex;align-items:center;gap:10px;margin-bottom:12px}
	.rc-avatar{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-weight:700;font-size:.75rem;color:#000;flex-shrink:0}
	.rc-name{font-size:.85rem;font-weight:700}.rc-date{font-size:.68rem;color:var(--t3)}
	.rc-stars{margin-left:auto;color:var(--yellow);font-size:.72rem;letter-spacing:1px}
	.review-card p{font-size:.82rem;color:var(--t2);line-height:1.65}
	.rc-tag{display:inline-flex;padding:4px 10px;border-radius:var(--r5);font-size:.62rem;font-weight:700;margin-top:12px}
	.rc-tag.streak{background:rgba(255,107,44,.08);color:var(--orange)}.rc-tag.quiz{background:rgba(180,74,255,.08);color:var(--purple)}
	.rc-tag.survey{background:rgba(0,187,255,.08);color:var(--blue)}.rc-tag.game{background:rgba(0,240,128,.08);color:var(--green)}
	.faq{padding:var(--s11) 0;position:relative;z-index:2}
	.faq-list{max-width:760px;margin:var(--s8) auto 0;display:flex;flex-direction:column;gap:8px}
	.faq-item{border-radius:var(--r2);background:var(--gl);border:1px solid var(--gl-b);overflow:hidden;backdrop-filter:blur(8px);transition:all .3s}
	.faq-q{padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;font-weight:600;font-size:.92rem;transition:color .2s}
	.faq-q:hover{color:var(--green)}
	.faq-arrow{width:30px;height:30px;border-radius:var(--r1);background:var(--sf1);display:grid;place-items:center;flex-shrink:0;transition:all .35s var(--ease);font-size:.82rem;color:var(--t3)}
	.faq-item.open .faq-arrow{background:var(--green);color:#000;transform:rotate(45deg)}
	.faq-a{max-height:0;overflow:hidden;transition:max-height .4s var(--ease)}
	.faq-item.open .faq-a{max-height:280px}
	.faq-a-inner{padding:0 24px 20px;font-size:.85rem;color:var(--t2);line-height:1.75}
	.cta{padding:var(--s11) 0;position:relative;z-index:2;text-align:center;overflow:hidden}
	.cta::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,240,128,.06),transparent 60%);pointer-events:none}
	.cta h2{font-size:clamp(2.2rem,5vw,3.2rem);font-weight:900;letter-spacing:-2px;line-height:1.08;margin-bottom:16px;position:relative}
	.cta p{font-size:1rem;color:var(--t2);max-width:480px;margin:0 auto 36px;position:relative}
	.cta-trust{display:flex;justify-content:center;gap:28px;margin-top:36px;flex-wrap:wrap;position:relative}
	.cta-trust span{font-size:.8rem;color:var(--t3);display:flex;align-items:center;gap:6px;font-weight:500}
	footer.home-footer{padding:var(--s9) 0 var(--s6);border-top:1px solid rgba(255,255,255,.04);position:relative;z-index:2}
	.home-footer .foot-top{display:grid;grid-template-columns:2.5fr 1fr 1fr 1fr 1fr;gap:var(--s7);margin-bottom:var(--s8)}
	.foot-brand p{font-size:.82rem;color:var(--t2);margin-top:12px;line-height:1.65;max-width:280px}
	.foot-stores{display:flex;gap:8px;margin-top:16px}
	.store-btn{padding:8px 16px;border-radius:var(--r1);background:var(--sf1);border:1px solid rgba(255,255,255,.06);font-size:.7rem;font-weight:600;display:flex;align-items:center;gap:6px;transition:all .25s;color:var(--t2)}
	.store-btn:hover{background:var(--sf2);color:var(--t1)}
	.foot-col h4{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--t3);margin-bottom:16px}
	.foot-col a{display:block;font-size:.82rem;color:var(--t2);padding:4px 0;transition:color .25s}
	.foot-col a:hover{color:var(--t1)}
	.foot-newsletter{margin-top:var(--s5)}
	.foot-newsletter p{font-size:.78rem;color:var(--t3);margin-bottom:10px}
	.fn-form{display:flex;gap:6px}
	.fn-input{flex:1;padding:10px 14px;border-radius:var(--r1);background:var(--sf1);border:1px solid var(--gl-b);font-size:.8rem;color:var(--t1);font-family:var(--f);outline:none}
	.fn-input:focus{border-color:var(--green)}
	.fn-btn{padding:10px 18px;border-radius:var(--r1);background:var(--green);color:#000;font-weight:700;font-size:.75rem;cursor:pointer}
	.foot-trust{display:flex;gap:var(--s5);padding:var(--s5) 0;border-top:1px solid rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.04);margin-bottom:var(--s5);flex-wrap:wrap}
	.trust-badge{display:flex;align-items:center;gap:6px;font-size:.72rem;color:var(--t3);font-weight:500}
	.trust-badge .tb-icon{font-size:1rem}
	.foot-social{display:flex;gap:8px;margin-top:14px}
	.foot-social a{width:34px;height:34px;border-radius:var(--r1);background:var(--sf1);border:1px solid rgba(255,255,255,.06);display:grid;place-items:center;font-size:.9rem;transition:all .2s}
	.foot-social a:hover{background:var(--sf2);border-color:rgba(255,255,255,.12)}
	.foot-bottom{display:flex;justify-content:space-between;align-items:center;font-size:.75rem;color:var(--t3)}
	.foot-tagline{font-style:italic;color:var(--t3);font-size:.75rem}
	.confetti-container{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden}
	.confetti-piece{position:absolute;width:10px;height:10px;border-radius:2px;animation:confettiFall 1.5s var(--ease) forwards}
	@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg) scale(1);opacity:1}100%{transform:translateY(100vh) rotate(720deg) scale(0);opacity:0}}
	.r{opacity:0;transform:translateY(40px);transition:all .8s var(--ease)}
	.r.vis{opacity:1;transform:translateY(0)}
	.r.d1{transition-delay:.1s}.r.d2{transition-delay:.2s}.r.d3{transition-delay:.3s}
	.r.d4{transition-delay:.4s}.r.d5{transition-delay:.5s}
	@media(max-width:1024px){
		.hero .container{grid-template-columns:1fr;text-align:center}
		.hero-desc{margin:0 auto 36px}.hero-ctas{justify-content:center}.hero-ticker{justify-content:center}
		.hero-visual{max-width:280px;margin:40px auto 0}.hero-float{display:none}
		.stats .container{grid-template-columns:repeat(2,1fr)}
		.steps-grid,.earn-grid,.why-grid{grid-template-columns:1fr}
		.game-grid{grid-template-columns:repeat(2,1fr)}
		.streak-sec .container,.quiz-sec .container{grid-template-columns:1fr}
		.dash-body{grid-template-columns:1fr}.dash-widget.wide{grid-column:span 1}
		.ref-card{grid-template-columns:1fr}
		.home-footer .foot-top{grid-template-columns:1fr 1fr}
		.review-card{width:300px}
		.live-bar{display:none}
	}
	@media(max-width:640px){
		nav .nav-links{display:none}
		.nav-coins{display:none}
		.stats .container{grid-template-columns:1fr 1fr;gap:12px}
		.stat-card{padding:20px 14px}.stat-val{font-size:1.7rem}
		.game-grid{grid-template-columns:1fr}
		.cta h2{font-size:2rem}.cta-trust{gap:14px}
		.home-footer .foot-top{grid-template-columns:1fr}.foot-bottom{flex-direction:column;gap:8px;text-align:center}
		.notif-drawer{width:100%}
	}
	</style>`}
</svelte:head>

<canvas id="particles"></canvas>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="notif-drawer-overlay"
	class:open={notifOpen}
	onclick={closeNotif}
></div>

<aside class="notif-drawer" class:open={notifOpen}>
	<div class="notif-header">
		<h3>🔔 Notifications</h3>
		<button class="notif-close" onclick={closeNotif} aria-label="Close notifications">✕</button>
	</div>
	<div class="notif-tabs">
		<button class="notif-tab active" onclick={switchNotifTab}>All</button>
		<button class="notif-tab" onclick={switchNotifTab}>Rewards</button>
		<button class="notif-tab" onclick={switchNotifTab}>Polls</button>
		<button class="notif-tab" onclick={switchNotifTab}>System</button>
	</div>
	<div class="notif-list">
		<div class="notif-item unread"><div class="ni-icon reward">🪙</div><div class="ni-text"><strong>+250 Bonus Points!</strong><p>14-day streak milestone reached. Keep going!</p></div><div class="ni-time">2m ago</div></div>
		<div class="notif-item unread"><div class="ni-icon survey">📝</div><div class="ni-text"><strong>New Polls Available</strong><p>Brand perception survey — 3 min, +$1.50</p></div><div class="ni-time">18m ago</div></div>
		<div class="notif-item unread"><div class="ni-icon streak">🔥</div><div class="ni-text"><strong>Streak Shield Activated</strong><p>Your streak is protected for the next 24 hours.</p></div><div class="ni-time">1h ago</div></div>
		<div class="notif-item"><div class="ni-icon reward">🏆</div><div class="ni-text"><strong>Weekly Challenge Complete</strong><p>You earned 500 bonus points from the trivia tournament.</p></div><div class="ni-time">3h ago</div></div>
		<div class="notif-item"><div class="ni-icon system">⚙️</div><div class="ni-text"><strong>Payout Processed</strong><p>$25.00 sent to your PayPal. Check your email.</p></div><div class="ni-time">1d ago</div></div>
		<div class="notif-item"><div class="ni-icon survey">📊</div><div class="ni-text"><strong>Quiz Results</strong><p>You scored 4/5 on Science Trivia. +40 pts earned.</p></div><div class="ni-time">1d ago</div></div>
	</div>
</aside>

<nav id="nav">
	<div class="container">
		<a href="/" class="logo">
			<div class="logo-mark"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
			EarnMaze
		</a>
		<div class="nav-links">
			<a href="#how">How It Works</a>
			<a href="#earn">Ways to Earn</a>
			<a href="/games" data-sveltekit-reload>Play</a>
			<a href="/streaks" data-sveltekit-reload>Streaks</a>
			<a href="/quizzes" data-sveltekit-reload>Quizzes</a>
		</div>
		<div class="nav-right">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="nav-coins" onclick={triggerCoinBurst}><span class="coin-icon">🪙</span> <span>{coinCount.toLocaleString()}</span></div>
			<button class="nav-bell" onclick={openNotif} aria-label="Open notifications">🔔<span class="bell-dot"></span></button>
			<a href="/login" class="btn btn-o" style="padding:9px 18px;font-size:.78rem">Log In</a>
			<a href="/register" class="btn btn-g" style="padding:9px 20px;font-size:.78rem">Sign Up Free</a>
		</div>
	</div>
</nav>

<div class="live-bar" id="liveFeed"></div>

<section class="hero">
	<div class="hero-orb o1"></div><div class="hero-orb o2"></div><div class="hero-orb o3"></div>
	<div class="container">
		<div class="hero-content">
			<div class="hero-chip"><span class="chip-dot"></span> Streaks · Quizzes · Polls · Play · Real Cash</div>
			<h1>
				<span class="line">Every Day</span>
				<span class="line">You Show Up,</span>
				<span class="line">You <span class="hero-underline"><span class="grad-text">Get Paid.</span></span></span>
			</h1>
			<p class="hero-desc">Daily streaks, brain-boosting quizzes, paid surveys, games &amp; exclusive deals — all rewarding you with real, redeemable points straight to your wallet.</p>
			<div class="hero-ctas">
				<a href="/register" class="btn btn-g">Start Earning Today →</a>
				<a href="#how" class="btn btn-o">See How It Works</a>
			</div>
			<div class="hero-ticker">
				<div class="tick"><div class="tick-val c-green" data-count="4200000" data-suffix="+">0</div><div class="tick-label">Active Members</div></div>
				<div class="tick"><div class="tick-val c-blue" data-count="3100000" data-prefix="$" data-suffix="+">$0</div><div class="tick-label">Paid Last Month</div></div>
				<div class="tick"><div class="tick-val c-orange">24hr</div><div class="tick-label">Avg Payout</div></div>
			</div>
		</div>
		<div class="hero-visual">
			<div class="hero-float f1"><div class="float-card"><span>🔥</span><div><div class="fc-text" style="font-size:.75rem;font-weight:600">14-Day Streak!</div><div class="fc-sub">Multiplier unlocked</div></div><div class="fc-val" style="color:var(--green)">+250</div></div></div>
			<div class="hero-float f2"><div class="float-card"><span>🧠</span><div><div class="fc-text" style="font-size:.75rem;font-weight:600">Quiz Completed</div><div class="fc-sub">Geography Challenge</div></div><div class="fc-val" style="color:var(--purple)">+50</div></div></div>
			<div class="hero-float f3"><div class="float-card"><span>💸</span><div><div class="fc-text" style="font-size:.75rem;font-weight:600">Payout Sent</div><div class="fc-sub">PayPal · 22 hours</div></div><div class="fc-val" style="color:var(--green)">$42.80</div></div></div>
			<div class="phone-wrapper">
				<div class="phone-shell"><div class="phone-notch"></div>
					<div class="phone-screen">
						<div class="scr-status"><span>9:41</span><span>●●● WiFi 🔋</span></div>
						<div class="scr-header"><div class="scr-greet">Good morning 👋<strong>Sarah</strong></div><div class="scr-wallet"><small>Wallet Balance</small><div class="bal">$42.80</div></div></div>
						<div class="scr-streak"><div class="scr-streak-top"><div class="scr-streak-label">🔥 Daily Streak</div><div class="scr-streak-num">14</div></div><div class="scr-days"><div class="scr-day on">M</div><div class="scr-day on">T</div><div class="scr-day on">W</div><div class="scr-day on">T</div><div class="scr-day on">F</div><div class="scr-day on">S</div><div class="scr-day now">S</div></div></div>
						<div class="scr-section">🧠 Today's Quiz</div>
						<div class="scr-quiz"><div class="scr-quiz-icon">🌍</div><div class="scr-quiz-info"><div class="qt">World Geography</div><div class="qs">5 questions · 2 min</div></div><div class="scr-quiz-pts">+50 pts</div></div>
						<div class="scr-section">⚡ Quick Earn</div>
						<div class="scr-earn-grid"><div class="scr-earn-item"><div class="ei">📝</div><div class="el">Polls</div></div><div class="scr-earn-item"><div class="ei">🎮</div><div class="el">Play</div></div><div class="scr-earn-item"><div class="ei">🛍️</div><div class="el">Deals</div></div><div class="scr-earn-item"><div class="ei">🎯</div><div class="el">Deals</div></div></div>
						<div class="scr-section">🏷️ Top Deals</div>
						<div class="scr-offer"><div class="scr-offer-logo" style="background:rgba(0,240,128,.12);color:var(--green)">U</div><div class="scr-offer-info"><div class="ot">UberEats — First Order</div><div class="os">Complete first delivery order</div></div><div class="scr-offer-val">+$4.50</div></div>
						<div class="scr-offer"><div class="scr-offer-logo" style="background:rgba(180,74,255,.12);color:var(--purple)">T</div><div class="scr-offer-info"><div class="ot">TikTok — Create Account</div><div class="os">Sign up & watch 5 min</div></div><div class="scr-offer-val">+$2.00</div></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<div class="marquee-wrap">
	<div class="marquee-label">Trusted by millions · Featured in top publications</div>
	<div class="marquee-inner">
		<div class="marquee-item"><span class="m-dot"></span>Men's Journal</div>
		<div class="marquee-item"><span class="m-dot"></span>FinanceBuzz</div>
		<div class="marquee-item"><span class="m-dot"></span>The Penny Hoarder</div>
		<div class="marquee-item"><span class="m-dot"></span>Business Insider</div>
		<div class="marquee-item"><span class="m-dot"></span>Mashable</div>
		<div class="marquee-item"><span class="m-dot"></span>The Wall Street Journal</div>
		<div class="marquee-item"><span class="m-dot"></span>Forbes</div>
		<div class="marquee-item"><span class="m-dot"></span>TechCrunch</div>
		<div class="marquee-item"><span class="m-dot"></span>Men's Journal</div>
		<div class="marquee-item"><span class="m-dot"></span>FinanceBuzz</div>
		<div class="marquee-item"><span class="m-dot"></span>The Penny Hoarder</div>
		<div class="marquee-item"><span class="m-dot"></span>Business Insider</div>
		<div class="marquee-item"><span class="m-dot"></span>Mashable</div>
		<div class="marquee-item"><span class="m-dot"></span>The Wall Street Journal</div>
		<div class="marquee-item"><span class="m-dot"></span>Forbes</div>
		<div class="marquee-item"><span class="m-dot"></span>TechCrunch</div>
	</div>
</div>

<section class="stats">
	<div class="container">
		<div class="stat-card r"><div class="stat-val" data-count="4200000" data-suffix="+">0</div><div class="stat-desc">Members Earning Daily</div></div>
		<div class="stat-card r d1"><div class="stat-val" data-count="3100000" data-prefix="$" data-suffix="+">$0</div><div class="stat-desc">Paid Out Last Month</div></div>
		<div class="stat-card r d2"><div class="stat-val" data-count="850000" data-suffix="+">0</div><div class="stat-desc">Active Daily Streaks</div></div>
		<div class="stat-card r d3"><div class="stat-val">1–3 Days</div><div class="stat-desc">Average Payout Speed</div></div>
	</div>
</section>

<section class="how" id="how">
	<div class="container">
		<div class="section-label r">How It Works</div>
		<div class="section-title r">Three moves. <span class="grad-text">That's it.</span></div>
		<div class="section-sub r">No courses. No subscriptions. Just smart, quick actions that put points in your wallet every single day.</div>
		<div class="steps-grid">
			<div class="step-card r"><div class="step-num">01</div><h3>Create your free account</h3><p>30 seconds. No credit card. Tell us your interests and we'll personalize your earning dashboard.</p></div>
			<div class="step-card r d1"><div class="step-num">02</div><h3>Earn every single day</h3><p>Complete surveys, play games, crush daily quizzes, and build streaks. Every action earns redeemable points.</p></div>
			<div class="step-card r d2"><div class="step-num">03</div><h3>Cash out from $10</h3><p>Hit $10 and withdraw via PayPal or gift cards. Most payouts land within 1–3 business days.</p></div>
		</div>
	</div>
</section>

<section class="dash-preview" id="dashboard">
	<div class="container">
		<div class="section-label r">Dashboard Preview</div>
		<div class="section-title r">Your earnings, <span class="grad-text">at a glance.</span></div>
		<div class="section-sub r">A real-time view of your progress, earnings, streaks, and analytics — all in one place.</div>
		<div class="dash-mock r">
			<div class="dash-titlebar"><div class="dash-dot red"></div><div class="dash-dot yel"></div><div class="dash-dot grn"></div><span>dashboard.earnmaze.com</span></div>
			<div class="dash-body">
				<div class="dash-widget wide"><div class="dw-header"><h4>📈 Weekly Earnings</h4><span>Last 7 days</span></div><div class="mini-chart" id="miniChart"></div></div>
				<div class="dash-widget"><div class="dw-header"><h4>📊 Where rewards come from</h4><span>This month</span></div><div class="mini-donut"><div class="donut-center">68%</div></div><div class="dw-stats"><div class="dw-stat"><div class="ds-val" style="color:var(--green)">42%</div><div class="ds-label">Polls</div></div><div class="dw-stat"><div class="ds-val" style="color:var(--blue)">26%</div><div class="ds-label">Quizzes</div></div><div class="dw-stat"><div class="ds-val" style="color:var(--purple)">17%</div><div class="ds-label">Play</div></div></div></div>
				<div class="dash-widget"><div class="dw-header"><h4>🔥 Streak Heatmap</h4><span>April 2026</span></div><div class="mini-heatmap" id="heatmap"></div></div>
				<div class="dash-widget wide"><div class="dw-header"><h4>💰 Earnings Summary</h4><span>April 2026</span></div><div class="dw-stats"><div class="dw-stat"><div class="ds-val" style="color:var(--green)">$142.50</div><div class="ds-label">Total Earned</div></div><div class="dw-stat"><div class="ds-val" style="color:var(--blue)">47</div><div class="ds-label">Polls Done</div></div><div class="dw-stat"><div class="ds-val" style="color:var(--orange)">14</div><div class="ds-label">Day Streak</div></div><div class="dw-stat"><div class="ds-val" style="color:var(--purple)">23</div><div class="ds-label">Quizzes Aced</div></div></div></div>
			</div>
		</div>
	</div>
</section>

<section class="earn" id="earn">
	<div class="container">
		<div class="section-label r">Ways to Earn</div>
		<div class="section-title r">Six paths. <span class="grad-text">One wallet.</span></div>
		<div class="section-sub r">Mix and match however you like. Every action adds real points directly to your balance.</div>
		<div class="earn-grid">
			<a href="/streaks" data-sveltekit-reload class="earn-card r" style="display:block"><div class="earn-card-glow"></div><div class="earn-card-body"><div class="earn-icon">🔥</div><h3>Daily Streaks</h3><p>Show up daily, earn bonus multipliers. The longer your streak, the bigger your rewards.</p><div class="earn-tag">🏆 Up to 5x multiplier</div></div></a>
			<a href="/quizzes" data-sveltekit-reload class="earn-card r d1" style="display:block"><div class="earn-card-glow"></div><div class="earn-card-body"><div class="earn-icon">🧠</div><h3>Daily Quizzes</h3><p>Fun, bite-sized quizzes on trending topics — pop culture, science, history, sports.</p><div class="earn-tag">⚡ 50–200 pts per quiz</div></div></a>
			<a href="/artifacts" data-sveltekit-reload class="earn-card r d2" style="display:block"><div class="earn-card-glow"></div><div class="earn-card-body"><div class="earn-icon">✨</div><h3>Interactive Artifacts</h3><p>Hand-picked interactive experiences — explore, play with, and learn from curated data and lifestyle stories.</p><div class="earn-tag">🎨 Curated · Live</div></div></a>
			<a href="/games" data-sveltekit-reload class="earn-card r d3" style="display:block"><div class="earn-card-glow"></div><div class="earn-card-body"><div class="earn-icon">🎮</div><h3>Play & Earn</h3><p>Level up in mobile games and earn real rewards. Gaming meets earning.</p><div class="earn-tag">🕹️ Earn while you play</div></div></a>
			<a href="/exclusive-deals" data-sveltekit-reload class="earn-card r d4" style="display:block"><div class="earn-card-glow"></div><div class="earn-card-body"><div class="earn-icon">🛍️</div><h3>Exclusive Deals</h3><p>Cashback on everyday purchases and app sign-ups you'd already do.</p><div class="earn-tag">🔄 Instant cashback</div></div></a>
			<a href="/weekly-challenges" data-sveltekit-reload class="earn-card r d5" style="display:block"><div class="earn-card-glow"></div><div class="earn-card-body"><div class="earn-icon">🏅</div><h3>Weekly Challenges</h3><p>Limited-time challenges with bonus point pools and massive reward drops.</p><div class="earn-tag">🎯 Bonus reward pools</div></div></a>
		</div>
	</div>
</section>

<section class="streak-sec" id="streaks">
	<div class="container">
		<div class="cal-wrap r">
			<div class="cal-month">🔥 April 2026 <span class="cm-badge">14-Day Streak</span></div>
			<div class="cal-weekdays"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
			<div class="cal-grid" id="calGrid"></div>
			<div class="cal-legend"><span><span class="legend-dot" style="background:var(--green)"></span>Completed</span><span><span class="legend-dot" style="background:linear-gradient(135deg,var(--orange),var(--pink))"></span>Bonus Day</span><span><span class="legend-dot" style="border:2px solid var(--green);background:transparent"></span>Today</span></div>
			<div class="progress-wrap"><div class="progress-top"><span>Monthly Progress</span><span class="pv">72%</span></div><div class="progress-track"><div class="progress-fill" id="progressBar"></div></div></div>
			<div class="milestones"><div class="milestone active"><div class="ms-day">7 days</div><div class="ms-reward">+100 bonus</div></div><div class="milestone active"><div class="ms-day">14 days</div><div class="ms-reward">+250 bonus</div></div><div class="milestone"><div class="ms-day">21 days</div><div class="ms-reward">+500 bonus</div></div><div class="milestone"><div class="ms-day">30 days</div><div class="ms-reward">+1000 bonus</div></div></div>
		</div>
		<div class="streak-info r">
			<div class="s-tag">🔥 Streak System</div>
			<h2>Consistency is the <span class="grad-text">ultimate cheat code.</span></h2>
			<p>Build daily, weekly, and monthly streaks that multiply your earnings. The longer you stay consistent, the more you unlock.</p>
			<div class="feat-list">
				<div class="feat-item"><div class="feat-check">✓</div>Daily streaks with up to 5x multipliers</div>
				<div class="feat-item"><div class="feat-check">✓</div>Weekly milestone bonuses every 7 days</div>
				<div class="feat-item"><div class="feat-check">✓</div>Monthly challenges with massive reward pools</div>
				<div class="feat-item"><div class="feat-check">✓</div>Streak Shields to protect your progress</div>
			</div>
			<a href="/register" class="btn btn-g">Start Your First Streak →</a>
		</div>
	</div>
</section>

<section class="quiz-sec" id="quizzes">
	<div class="container">
		<div class="quiz-info r">
			<div class="q-tag">🧠 Today's Quizzes</div>
			<h2>Get smarter. <span style="color:var(--purple)">Get paid.</span></h2>
			<p>Fresh quizzes every day on topics you care about. Answer questions, earn instant points, expand your mind.</p>
			<div class="feat-list">
				<div class="feat-item"><div class="feat-check" style="background:var(--purple)">✓</div>New quizzes daily across 12+ categories</div>
				<div class="feat-item"><div class="feat-check" style="background:var(--purple)">✓</div>Earn 50–200 points per quiz</div>
				<div class="feat-item"><div class="feat-check" style="background:var(--purple)">✓</div>Weekly tournaments with leaderboards</div>
				<div class="feat-item"><div class="feat-check" style="background:var(--purple)">✓</div>Quiz streaks stack with daily streaks</div>
			</div>
			<a href="/register" class="btn btn-p">Take Today's Quiz →</a>
			<div class="quiz-cats"><span class="q-cat">🌍 Geography</span><span class="q-cat">🔬 Science</span><span class="q-cat">🏈 Sports</span><span class="q-cat">🎬 Movies</span><span class="q-cat">📚 History</span><span class="q-cat">💻 Tech</span><span class="q-cat">🎵 Music</span><span class="q-cat">🍕 Food</span></div>
		</div>
		<div class="quiz-mock r">
			<div class="qm-header"><div class="qm-cat">Today's Quiz · April 14</div><div class="qm-title">🌍 World Geography Challenge</div><div class="qm-meta"><span>📝 5 questions</span><span>⏱ ~2 min</span><span style="color:var(--green)">💰 +50 pts</span></div></div>
			<div class="qm-timer"><div class="qm-timer-fill"></div></div>
			<div class="qm-body">
				<div class="qm-question"><span class="q-num">Q3 of 5 ·</span> Which country has the most time zones?</div>
				<div class="qm-options">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="qm-opt" onclick={selectQuizOpt}><span class="opt-l">A</span>Russia</div>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="qm-opt" onclick={selectQuizOpt}><span class="opt-l">B</span>United States</div>
					<div class="qm-opt correct"><span class="opt-l">C</span>France</div>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="qm-opt" onclick={selectQuizOpt}><span class="opt-l">D</span>China</div>
				</div>
				<div class="qm-result"><div class="r-icon">✓</div><div class="r-text"><strong>Correct!</strong>France spans 12 time zones across its overseas territories.</div><div class="r-pts">+10</div></div>
			</div>
		</div>
	</div>
</section>

<section class="survey-widget" id="survey">
	<div class="container">
		<div style="text-align:center">
			<div class="section-label r" style="justify-content:center">Try It Now</div>
			<div class="section-title r">Experience an <span class="grad-text">EarnMaze survey.</span></div>
			<div class="section-sub r" style="margin:14px auto 0">See how smooth and rewarding our surveys feel. Try this quick one right here.</div>
		</div>
		<div class="sw-container">
			<div class="sw-card r">
				<div class="sw-progress"><div class="sw-progress-fill" style="width:{swCompleted ? 100 : ((sqIdx + 1) / surveyQs.length) * 100}%"></div></div>
				<div class="sw-body">
					{#if swCompleted}
						<div class="sw-step">Complete!</div>
						<div class="sw-question">🎉 Thanks! You earned +30 points.</div>
						<div style="text-align:center;padding:20px;color:var(--green);font-family:var(--mono);font-size:1.2rem;font-weight:700">+30 pts added to your wallet!</div>
					{:else}
						<div class="sw-step">Question {sqIdx + 1} of {surveyQs.length}</div>
						<div class="sw-question">{surveyQs[sqIdx].q}</div>
						<div class="sw-options">
							{#each surveyQs[sqIdx].opts as opt, i (i)}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div class="sw-opt" class:selected={swSelected === i} onclick={() => selectPoll(i)}>
									<span class="sw-letter">{String.fromCharCode(65 + i)}</span>{opt}
								</div>
							{/each}
						</div>
					{/if}
				</div>
				{#if !swCompleted}
					<div class="sw-footer">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<span class="sw-skip" onclick={nextPollsQ}>Skip →</span>
						<button class="btn btn-g" style="padding:10px 24px;font-size:.82rem" onclick={nextPollsQ}>Next →</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<section class="referral" id="referral">
	<div class="container">
		<div class="section-label r">Invite & Earn</div>
		<div class="section-title r">Share the love. <span class="grad-text">Earn together.</span></div>
		<div class="section-sub r">Invite friends and earn bonus points for every active referral. Climb tiers for bigger rewards.</div>
		<div class="ref-card">
			<div class="ref-left r">
				<h3>Your Personal Referral Link</h3>
				<p>Share with friends — you both earn 500 bonus points when they complete their first survey.</p>
				<div class="ref-link-box"><input class="ref-link-input" value="earnmaze.com/ref/sarah-m-4829" readonly /><button class="ref-copy" onclick={copyRef}>Copy</button></div>
				<div class="ref-share"><button class="ref-share-btn">💬 WhatsApp</button><button class="ref-share-btn">🐦 Twitter</button><button class="ref-share-btn">📧 Email</button></div>
			</div>
			<div class="ref-ladder r d1">
				<div class="rl-tier active"><div class="rl-badge" style="background:rgba(0,240,128,.12)">🌱</div><div class="rl-info"><h5>Starter — 1 referral</h5><p>First referral bonus unlocked</p></div><div class="rl-reward">+500 pts</div></div>
				<div class="rl-tier active"><div class="rl-badge" style="background:rgba(0,187,255,.12)">⭐</div><div class="rl-info"><h5>Rising — 5 referrals</h5><p>5x referral bonus + streak shield</p></div><div class="rl-reward">+3,000 pts</div></div>
				<div class="rl-tier"><div class="rl-badge" style="background:rgba(180,74,255,.12)">💎</div><div class="rl-info"><h5>Champion — 15 referrals</h5><p>Premium rewards + exclusive surveys</p></div><div class="rl-reward">+10,000 pts</div></div>
				<div class="rl-tier locked"><div class="rl-badge" style="background:rgba(255,197,61,.12)">👑</div><div class="rl-info"><h5>Legend — 50 referrals</h5><p>VIP status + 10x earning multiplier</p></div><div class="rl-reward">+50,000 pts</div></div>
			</div>
		</div>
	</div>
</section>

<section class="why">
	<div class="container">
		<div class="section-label r">Why EarnMaze</div>
		<div class="section-title r">Built different. <span class="grad-text">Pays better.</span></div>
		<div class="section-sub r">Not just another survey app. A daily engagement platform that rewards consistency.</div>
		<div class="why-grid">
			<div class="why-card r"><div class="why-icon">💸</div><h3>$10 Minimum Cashout</h3><p>No sky-high thresholds. Cash out via PayPal or gift cards at just ten dollars.</p></div>
			<div class="why-card r d1"><div class="why-icon">⚡</div><h3>1–3 Day Payouts</h3><p>Real money, delivered fast. Most withdrawals sent within a single business day.</p></div>
			<div class="why-card r d2"><div class="why-icon">🔥</div><h3>Streak Multipliers</h3><p>The more consistent you are, the more you earn. Up to 5x bonus multipliers.</p></div>
			<div class="why-card r d3"><div class="why-icon">🧠</div><h3>Learn While You Earn</h3><p>Daily quizzes mean you're growing knowledge — not just tapping mindlessly.</p></div>
			<div class="why-card r d4"><div class="why-icon">🛡️</div><h3>Data Protected</h3><p>Industry-standard encryption. We never sell your data. Privacy is non-negotiable.</p></div>
			<div class="why-card r d5"><div class="why-icon">🎯</div><h3>Personalized For You</h3><p>AI-matched surveys, quizzes tailored to interests, deals based on preferences.</p></div>
		</div>
	</div>
</section>

<section class="reviews">
	<div class="container">
		<div class="reviews-head">
			<div><div class="section-label r">What Members Say</div><div class="section-title r">Real people. Real rewards.</div></div>
			<div class="review-badge r"><span class="rb-stars">★★★★★</span> 4.7 · 3,200+ reviews</div>
		</div>
	</div>
	<div class="review-track-wrap" style="margin-bottom:16px">
		<div class="review-track t1">
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--green)">JM</div><div><div class="rc-name">Jessica M.</div><div class="rc-date">March 2026</div></div><div class="rc-stars">★★★★★</div></div><p>The streak system is addictive in the best way. 47-day streak and earning way more than any other survey app. $180 this month!</p><span class="rc-tag streak">🔥 Streaks</span></div>
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--blue)">DK</div><div><div class="rc-name">David K.</div><div class="rc-date">April 2026</div></div><div class="rc-stars">★★★★★</div></div><p>Love the daily quizzes. I look forward to opening the app every morning. Geography and science are my favorite — smarter AND paid.</p><span class="rc-tag quiz">🧠 Quizzes</span></div>
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--orange)">TR</div><div><div class="rc-name">Tamika R.</div><div class="rc-date">Feb 2026</div></div><div class="rc-stars">★★★★★</div></div><p>Way better than other reward apps. Polls + streaks + quizzes keep things fresh. First $50 gift card in just 2 weeks.</p><span class="rc-tag survey">📝 Polls</span></div>
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--purple)">MH</div><div><div class="rc-name">Marcus H.</div><div class="rc-date">March 2026</div></div><div class="rc-stars">★★★★★</div></div><p>Weekly challenges are insane. Trivia tournament had a 50K point pool. Placed 12th, got $25 in bonus. Community vibe is real.</p><span class="rc-tag game">🏅 Challenges</span></div>
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--yellow)">AP</div><div><div class="rc-name">Alyssa P.</div><div class="rc-date">April 2026</div></div><div class="rc-stars">★★★★★</div></div><p>Perfect for a stay-at-home mom. Quizzes during nap time, surveys after dinner. Streak Shield saved me twice. $320 total!</p><span class="rc-tag streak">🔥 Streaks</span></div>
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--green)">JM</div><div><div class="rc-name">Jessica M.</div><div class="rc-date">March 2026</div></div><div class="rc-stars">★★★★★</div></div><p>The streak system is addictive in the best way. 47-day streak and earning way more than any other survey app. $180 this month!</p><span class="rc-tag streak">🔥 Streaks</span></div>
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--blue)">DK</div><div><div class="rc-name">David K.</div><div class="rc-date">April 2026</div></div><div class="rc-stars">★★★★★</div></div><p>Love the daily quizzes. I look forward to opening the app every morning. Geography and science are my favorite — smarter AND paid.</p><span class="rc-tag quiz">🧠 Quizzes</span></div>
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--orange)">TR</div><div><div class="rc-name">Tamika R.</div><div class="rc-date">Feb 2026</div></div><div class="rc-stars">★★★★★</div></div><p>Way better than other reward apps. Polls + streaks + quizzes keep things fresh. First $50 gift card in just 2 weeks.</p><span class="rc-tag survey">📝 Polls</span></div>
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--purple)">MH</div><div><div class="rc-name">Marcus H.</div><div class="rc-date">March 2026</div></div><div class="rc-stars">★★★★★</div></div><p>Weekly challenges are insane. Trivia tournament had a 50K point pool. Placed 12th, got $25 in bonus. Community vibe is real.</p><span class="rc-tag game">🏅 Challenges</span></div>
			<div class="review-card"><div class="rc-top"><div class="rc-avatar" style="background:var(--yellow)">AP</div><div><div class="rc-name">Alyssa P.</div><div class="rc-date">April 2026</div></div><div class="rc-stars">★★★★★</div></div><p>Perfect for a stay-at-home mom. Quizzes during nap time, surveys after dinner. Streak Shield saved me twice. $320 total!</p><span class="rc-tag streak">🔥 Streaks</span></div>
		</div>
	</div>
</section>

<section class="cta">
	<div class="container">
		<div class="r">
			<h2>Stop scrolling.<br /><span class="grad-text">Start earning.</span></h2>
			<p>Join 4.2 million+ members earning real money through streaks, quizzes, surveys, games, and deals — every single day.</p>
			<a href="/register" class="btn btn-g" style="font-size:1rem;padding:18px 44px">Create Your Free Account →</a>
			<div class="cta-trust"><span>🔒 No credit card needed</span><span>⚡ Cash out from $10</span><span>🔥 Start earning in 60 seconds</span></div>
		</div>
	</div>
</section>

<footer class="home-footer">
	<div class="container">
		<div class="foot-top">
			<div class="foot-brand">
				<div class="logo"><div class="logo-mark"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>EarnMaze</div>
				<p>Turning everyday moments into real rewards. Streaks, quizzes, surveys, games, and deals — all in one wallet.</p>
				<div class="foot-stores"><a href="/" class="store-btn">🍎 App Store</a><a href="/" class="store-btn">▶ Google Play</a></div>
				<div class="foot-social"><a href="/" aria-label="X">𝕏</a><a href="/" aria-label="Facebook">📘</a><a href="/" aria-label="Instagram">📸</a><a href="/" aria-label="YouTube">📺</a><a href="/" aria-label="LinkedIn">💼</a></div>
			</div>
			<div class="foot-col"><h4>Earn</h4><a href="/streaks" data-sveltekit-reload>Daily Streaks</a><a href="/quizzes" data-sveltekit-reload>Quizzes</a><a href="/artifacts" data-sveltekit-reload>Artifacts</a><a href="/games" data-sveltekit-reload>Play</a><a href="/exclusive-deals" data-sveltekit-reload>Deals</a><a href="/weekly-challenges" data-sveltekit-reload>Challenges</a></div>
			<div class="foot-col"><h4>Learn</h4><a href="#how">How It Works</a><a href="/about">About</a><a href="#streaks">Streak Tips</a><a href="#quizzes">Quiz Categories</a><a href="/about">Blog</a></div>
			<div class="foot-col"><h4>Company</h4><a href="/about">About Us</a><a href="/about">Help Center</a><a href="/privacy-policy">Privacy Policy</a><a href="/terms-of-service">Terms of Service</a><a href="/about">Contact</a></div>
			<div class="foot-col"><h4>Stay Updated</h4>
				<div class="foot-newsletter"><p>Get tips, new features & earning hacks.</p><div class="fn-form"><input class="fn-input" placeholder="you@email.com" /><button class="fn-btn">Subscribe</button></div></div>
			</div>
		</div>
		<div class="foot-trust">
			<div class="trust-badge"><span class="tb-icon">🔒</span>256-bit SSL Encryption</div>
			<div class="trust-badge"><span class="tb-icon">🛡️</span>GDPR Compliant</div>
			<div class="trust-badge"><span class="tb-icon">✅</span>SOC 2 Type II</div>
			<div class="trust-badge"><span class="tb-icon">🏛️</span>US-Based Company</div>
		</div>
		<div class="foot-bottom">
			<span>© 2026 EarnMaze. All rights reserved.</span>
			<span class="foot-tagline">"Give your free time a raise."</span>
			<span>🇺🇸 Available in the United States</span>
		</div>
	</div>
</footer>
