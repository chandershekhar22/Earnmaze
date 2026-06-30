<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	let referralCode = $derived($page.url.searchParams.get('ref') || undefined);
	let utmSource = $derived($page.url.searchParams.get('utm_source') || undefined);
	let utmMedium = $derived($page.url.searchParams.get('utm_medium') || undefined);
	let utmCampaign = $derived($page.url.searchParams.get('utm_campaign') || undefined);
	let redirectUrl = $derived($page.url.searchParams.get('redirect'));

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let agreedTerms = $state(false);
	let isLoading = $state(false);
	let showPassword = $state(false);
	let turnstileToken = $state<string | null>(null);
	let needsInteraction = $state(false);
	let turnstileRef: any;

	// Required acknowledgements (must all be true to enable submit).
	let ageVerified = $state(false);
	let tosAccepted = $state(false);
	let privacyAccepted = $state(false);
	// Optional opt-in (default OFF for GDPR/CAN-SPAM compliance).
	let marketingConsent = $state(false);


	let passwordMismatch = $derived(password !== confirmPassword && confirmPassword.length > 0);
	

	let pwScore = $derived(
		[password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /[0-9]/.test(password)]
			.filter(Boolean).length
	);
	let allRulesMet = $derived(pwScore === 4);

	onMount(() => {
		authStore.clearError();
		if (!authStore.state.isLoading && authStore.state.user) {
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		}
	});

	$effect(() => {
		if (authStore.state.user && !authStore.state.isLoading) {
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		}
	});

	function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		handleSubmit();
	}

	async function waitForToken(): Promise<string | null> {
		if (turnstileToken) return turnstileToken;
		const start = Date.now();
		while (!turnstileToken) {
			const timeoutMs = needsInteraction ? 60000 : 8000;
			if (Date.now() - start >= timeoutMs) break;
			await new Promise((r) => setTimeout(r, 100));
		}
		return turnstileToken;
	}

	async function handleSubmit() {
		if (!email || !password || !confirmPassword || passwordMismatch) return;
		// The page uses a single "agreedTerms" checkbox. Require that instead
		// of the unused individual flags so the form actually submits.
		if (!agreedTerms) return;

		isLoading = true;
		const token = await waitForToken();
		if (!token) {
			isLoading = false;
			authStore.state.error = needsInteraction
				? m.auth_security_check_msg()
				: m.auth_verification_timeout();
			return;
		}

		const result = await authStore.register({
			email,
			password,
			name: name || undefined,
			turnstileToken: token,
			referralCode,
			utmSource,
			utmMedium,
			utmCampaign,
			registrationSource: utmSource ? 'ad-campaign' : 'registration-page',
			ageVerified: true,
			tosAccepted: true,
			privacyAccepted: true,
			marketingConsent,
		});
		isLoading = false;

		if (result.success && authStore.state.user) {
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		} else {
			turnstileRef?.reset();
			turnstileToken = null;
		}
	}

	function handleTurnstileVerify(token: string) {
		turnstileToken = token;
		needsInteraction = false;
	}

	function handleTurnstileError() {
		turnstileToken = null;
	}

	function handleBeforeInteractive() {
		needsInteraction = true;
	}

	function handleTurnstileExpire() {
		turnstileToken = null;
	}
</script>

<svelte:head>
	<title>Sign Up — EarnMaze</title>
	<meta name="description" content="Create your EarnMaze account and start earning rewards through daily streaks, quizzes, polls, games and deals." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>
	*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
	:root{
		--bg:#07090c;--bg-2:#0c1014;--bg-card:#0e1217;
		--line:rgba(255,255,255,.07);--line-2:rgba(255,255,255,.11);
		--sf:rgba(255,255,255,.025);--sf-2:rgba(255,255,255,.05);
		--t1:#f1f3f5;--t2:#9aa1ac;--t3:#5f6671;--t4:#414751;
		--lime:#bff345;--lime-2:#a3e635;--lime-soft:rgba(191,243,69,.16);--lime-line:rgba(191,243,69,.32);
		--cyan:#67e8f9;--violet:#c4b5fd;--purple:#a78bfa;
		--danger:#ff6b81;
		--grad-headline:linear-gradient(90deg,#bff345 0%,#67e8f9 45%,#c4b5fd 100%);
		--r-sm:8px;--r-md:12px;--r-lg:16px;--r-xl:20px;--r-2xl:24px;--r-full:999px;
		--f:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;
		--ease:cubic-bezier(.16,1,.3,1);
	}
	html{font-size:16px}
	body{background:var(--bg);color:var(--t1);font-family:var(--f);overflow-x:hidden;line-height:1.6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;min-height:100vh}
	a{text-decoration:none;color:inherit}
	button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
	::selection{background:var(--lime);color:#000}

	.rg-shell{position:relative;min-height:100vh;overflow:hidden}
	.rg-bg{position:absolute;inset:0;pointer-events:none;z-index:0}
	.rg-bg::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 75% 50%,rgba(191,243,69,.045),transparent 60%),radial-gradient(ellipse 60% 40% at 20% 30%,rgba(124,58,237,.04),transparent 60%)}
	.rg-bg::after{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(ellipse 80% 60% at 50% 50%,#000 30%,transparent 80%);-webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 50%,#000 30%,transparent 80%)}

	.rg-nav{position:relative;z-index:5;padding:22px 0}
	.rg-nav-row{max-width:1340px;margin:0 auto;padding:0 36px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center}
	.rg-logo{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:1.05rem;letter-spacing:-.4px}
	.rg-logo-mark{width:32px;height:32px;border-radius:9px;background:var(--lime);display:grid;place-items:center;box-shadow:0 4px 24px rgba(191,243,69,.25)}
	.rg-logo-mark svg{width:16px;height:16px;fill:#0a0c0f}
	.rg-back{justify-self:center;display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:var(--r-full);border:1px solid var(--line);background:var(--sf);font-size:.7rem;font-weight:700;letter-spacing:.18em;color:var(--t2);text-transform:uppercase;transition:all .2s var(--ease)}
	.rg-back:hover{color:var(--t1);border-color:var(--line-2);background:var(--sf-2)}
	.rg-nav-spacer{justify-self:end}

	.rg-grid{position:relative;z-index:1;max-width:1340px;margin:0 auto;padding:32px 36px 90px;display:grid;grid-template-columns:1.05fr 1fr;gap:60px;align-items:start}

	.rg-hero{padding-top:24px;position:relative}
	.rg-chip{display:inline-flex;align-items:center;gap:10px;padding:8px 16px;border-radius:var(--r-full);border:1px solid var(--lime-line);background:rgba(191,243,69,.05);font-size:.7rem;font-weight:700;letter-spacing:.18em;color:var(--lime);text-transform:uppercase;margin-bottom:36px}
	.rg-chip-dot{width:7px;height:7px;border-radius:50%;background:var(--lime);box-shadow:0 0 12px var(--lime);position:relative}
	.rg-chip-dot::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:1.5px solid var(--lime);animation:rgPing 2.2s ease-out infinite;opacity:0}
	@keyframes rgPing{0%{transform:scale(.6);opacity:.8}100%{transform:scale(2);opacity:0}}
	.rg-h1{font-size:clamp(2.6rem,5vw,4.3rem);font-weight:800;line-height:1.02;letter-spacing:-2.4px;margin-bottom:28px;color:#fff}
	.rg-h1 .grad{background:var(--grad-headline);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:inline-block}
	.rg-sub{font-size:1.02rem;color:var(--t2);max-width:460px;margin-bottom:40px;line-height:1.7}
	.rg-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;max-width:520px;margin-bottom:38px}
	.rg-stat{padding:18px 18px 16px;border-radius:var(--r-lg);background:rgba(255,255,255,.025);border:1px solid var(--line);backdrop-filter:blur(6px)}
	.rg-stat-v{font-family:var(--mono);font-size:1.45rem;font-weight:700;letter-spacing:-1px;line-height:1.1}
	.rg-stat-v.c1{color:var(--lime)}
	.rg-stat-v.c2{color:var(--cyan)}
	.rg-stat-v.c3{color:var(--purple)}
	.rg-stat-l{margin-top:8px;font-size:.66rem;font-weight:700;letter-spacing:.2em;color:var(--t3);text-transform:uppercase}
	.rg-feat{display:flex;flex-direction:column;gap:14px;max-width:520px}
	.rg-feat-item{display:flex;align-items:center;gap:12px;font-size:.92rem;font-weight:500;color:var(--t1)}
	.rg-feat-check{width:22px;height:22px;border-radius:50%;background:rgba(191,243,69,.14);color:var(--lime);display:grid;place-items:center;flex-shrink:0}
	.rg-feat-check svg{width:12px;height:12px;stroke:currentColor;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}

	.rg-card{position:relative;background:linear-gradient(180deg,#0e1217 0%,#0a0d11 100%);border:1px solid var(--line);border-radius:var(--r-2xl);padding:42px 38px;box-shadow:0 30px 80px -30px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.02) inset;animation:rgFade .6s var(--ease) both}
	@keyframes rgFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
	.rg-card-icon{width:48px;height:48px;border-radius:var(--r-md);background:rgba(191,243,69,.13);border:1px solid var(--lime-line);display:grid;place-items:center;margin-bottom:24px}
	.rg-card-icon svg{width:22px;height:22px;stroke:var(--lime-2);stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}
	.rg-card-title{font-size:1.75rem;font-weight:800;letter-spacing:-1px;color:#fff;margin-bottom:10px}
	.rg-card-sub{font-size:.95rem;color:var(--t2);margin-bottom:32px}
	.rg-card-sub b{color:var(--lime);font-weight:700}

	.rg-form{display:flex;flex-direction:column;gap:18px}
	.rg-field{display:flex;flex-direction:column;gap:9px}
	.rg-label{display:flex;align-items:center;justify-content:space-between;font-size:.82rem;font-weight:600;color:var(--t1);letter-spacing:.1px}
	.rg-label .opt{font-size:.74rem;color:var(--t3);font-weight:500;margin-left:6px}
	.rg-label .hint{font-size:.72rem;color:var(--t3);font-weight:500}
	.rg-input-wrap{position:relative;display:flex;align-items:center}
	.rg-input-icon{position:absolute;left:14px;color:var(--t3);display:grid;place-items:center;pointer-events:none}
	.rg-input-icon svg{width:16px;height:16px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}
	.rg-input{width:100%;padding:14px 16px 14px 42px;border-radius:var(--r-md);background:var(--sf);border:1px solid var(--line);font-family:inherit;font-size:.93rem;color:var(--t1);outline:none;transition:all .2s var(--ease)}
	.rg-input::placeholder{color:var(--t4)}
	.rg-input:hover{border-color:var(--line-2)}
	.rg-input:focus{border-color:var(--lime-line);background:rgba(191,243,69,.025);box-shadow:0 0 0 4px rgba(191,243,69,.07)}
	.rg-input.warn{border-color:rgba(255,184,77,.45)}
	.rg-input.good{border-color:var(--lime-line)}
	.rg-input.bad{border-color:rgba(255,107,129,.5)}
	.rg-input.bad:focus{box-shadow:0 0 0 4px rgba(255,107,129,.08)}
	.rg-eye{position:absolute;right:12px;width:28px;height:28px;border-radius:6px;color:var(--t3);display:grid;place-items:center;transition:color .2s,background .2s}
	.rg-eye:hover{color:var(--t1);background:var(--sf-2)}
	.rg-eye svg{width:16px;height:16px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}

	.rg-meter{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}
	.rg-meter-seg{height:3px;border-radius:2px;background:var(--sf-2);transition:background .25s var(--ease)}
	.rg-meter-seg.on1{background:#ff6b81}
	.rg-meter-seg.on2{background:#ffb84d}
	.rg-meter-seg.on3{background:#67e8f9}
	.rg-meter-seg.on4{background:var(--lime)}
	.rg-mismatch{display:flex;align-items:center;gap:6px;font-size:.74rem;font-weight:500;color:#ff8096;margin-top:4px}

	.rg-ref{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:var(--r-md);background:rgba(167,139,250,.07);border:1px solid rgba(167,139,250,.22)}
	.rg-ref-icon{width:36px;height:36px;border-radius:10px;background:rgba(167,139,250,.16);display:grid;place-items:center;flex-shrink:0;color:var(--purple)}
	.rg-ref-icon svg{width:18px;height:18px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}
	.rg-ref-txt{font-size:.84rem;color:var(--t1);line-height:1.5}
	.rg-ref-txt b{color:var(--purple);font-weight:700}

	.rg-terms{display:flex;align-items:flex-start;gap:11px;padding:14px 16px;border-radius:var(--r-md);background:var(--sf);border:1px solid var(--line);cursor:pointer}
	.rg-terms input{margin-top:3px;width:16px;height:16px;accent-color:var(--lime);cursor:pointer;flex-shrink:0}
	.rg-terms-txt{font-size:.82rem;color:var(--t2);line-height:1.55}
	.rg-terms-txt a{color:var(--lime);font-weight:600;transition:color .15s}
	.rg-terms-txt a:hover{color:#d2ff66}

	.rg-turnstile{display:flex;justify-content:center;padding:2px 0}
	.rg-submit{position:relative;width:100%;margin-top:6px;padding:16px 24px;border-radius:var(--r-md);background:var(--lime);color:#0a0c0f;font-weight:800;font-size:.98rem;letter-spacing:-.1px;display:inline-flex;align-items:center;justify-content:center;gap:10px;transition:all .25s var(--ease);overflow:hidden}
	.rg-submit::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);transform:translateX(-100%);transition:transform .55s}
	.rg-submit:hover:not(:disabled)::after{transform:translateX(100%)}
	.rg-submit:hover:not(:disabled){background:#cdff5c;box-shadow:0 0 0 4px rgba(191,243,69,.18),0 14px 40px -10px rgba(191,243,69,.4);transform:translateY(-1px)}
	.rg-submit:disabled{opacity:.45;cursor:not-allowed}
	.rg-submit svg{width:16px;height:16px;stroke:currentColor;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}
	.rg-spin{width:16px;height:16px;border:2.5px solid rgba(10,12,15,.25);border-top-color:#0a0c0f;border-radius:50%;animation:rgSpin .7s linear infinite}
	@keyframes rgSpin{to{transform:rotate(360deg)}}
	.rg-err{display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,107,129,.08);border:1px solid rgba(255,107,129,.22);border-radius:var(--r-md);font-size:.85rem;color:#ff8096;font-weight:500;animation:rgFade .3s var(--ease) both}
	.rg-err-icon{width:22px;height:22px;border-radius:6px;background:rgba(255,107,129,.18);display:grid;place-items:center;flex-shrink:0;font-weight:800;font-size:.75rem}
	.rg-alt{text-align:center;margin-top:26px;font-size:.88rem;color:var(--t2)}
	.rg-alt a{color:var(--lime);font-weight:600;margin-left:4px}
	.rg-alt a:hover{color:#d2ff66}
	.rg-legal{display:flex;justify-content:center;gap:22px;margin-top:14px;font-size:.74rem;color:var(--t3);letter-spacing:.04em}
	.rg-legal a{transition:color .15s}
	.rg-legal a:hover{color:var(--t2)}

	.rg-footer{position:relative;z-index:1;max-width:1340px;margin:0 auto;padding:0 36px 24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;font-size:.78rem;color:var(--t3)}
	.rg-footer-rating{display:inline-flex;align-items:center;gap:10px}
	.rg-stars{display:inline-flex;gap:2px;color:var(--lime)}
	.rg-stars svg{width:13px;height:13px;fill:currentColor}
	.rg-footer-copy{justify-self:center;letter-spacing:.04em}
	.rg-footer-spacer{justify-self:end}

	@media(max-width:1024px){
		.rg-grid{grid-template-columns:1fr;gap:48px;padding:24px 24px 80px}
		.rg-hero{padding-top:8px;text-align:center;align-self:center}
		.rg-chip,.rg-h1,.rg-sub,.rg-stats,.rg-feat{margin-left:auto;margin-right:auto}
		.rg-feat{align-items:center}
		.rg-stats{max-width:560px}
	}
	@media(max-width:640px){
		.rg-nav-row{padding:0 18px}
		.rg-grid{padding:18px 18px 60px}
		.rg-card{padding:30px 22px;border-radius:18px}
		.rg-card-title{font-size:1.5rem}
		.rg-stats{grid-template-columns:1fr 1fr;gap:10px}
		.rg-stat-v{font-size:1.2rem}
		.rg-footer{grid-template-columns:1fr;text-align:center;padding-bottom:18px}
		.rg-footer-spacer{display:none}
		.rg-footer-rating{justify-self:center}
	}
	</style>`}
</svelte:head>

<div class="rg-shell">
	<div class="rg-bg"></div>

	<nav class="rg-nav">
		<div class="rg-nav-row">
			<a href="/" class="rg-logo">
				<span class="rg-logo-mark"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"/></svg></span>
				Earnmaze
			</a>
			<a href="/" class="rg-back">
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
				HOME
			</a>
			<span class="rg-nav-spacer"></span>
		</div>
	</nav>

	<div class="rg-grid">
		<section class="rg-hero">
			<div class="rg-chip"><span class="rg-chip-dot"></span> Free forever · No credit card</div>
			<h1 class="rg-h1">Join 4.2M+ members <span class="grad">earning daily.</span></h1>
			<p class="rg-sub">Take 30 seconds to create your free account and pick up a 250-point welcome bonus. No subscription. No commitment.</p>

			<div class="rg-stats">
				<div class="rg-stat"><div class="rg-stat-v c1">$3.1M+</div><div class="rg-stat-l">Paid Last Month</div></div>
				<div class="rg-stat"><div class="rg-stat-v c2">850K+</div><div class="rg-stat-l">Daily Streaks</div></div>
				<div class="rg-stat"><div class="rg-stat-v c3">1–3 d</div><div class="rg-stat-l">Avg Payout</div></div>
			</div>

			<div class="rg-feat">
				<div class="rg-feat-item">
					<span class="rg-feat-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
					Cash out via PayPal or gift cards from just $10
				</div>
				<div class="rg-feat-item">
					<span class="rg-feat-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
					Streak multipliers stack up to 5×
				</div>
				<div class="rg-feat-item">
					<span class="rg-feat-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
					Data encrypted &amp; never sold — privacy first
				</div>
			</div>
		</section>

		<section class="rg-main">
			<div class="rg-card">
				<div class="rg-card-icon">
					<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
				</div>
				<div class="rg-card-title">Create your account</div>
				<div class="rg-card-sub">Get a <b>250-point welcome bonus</b> on signup.</div>

				<form onsubmit={handleFormSubmit} class="rg-form">
					{#if authStore.state.error}
						<div class="rg-err">
							<div class="rg-err-icon">!</div>
							<span>{authStore.state.error}</span>
						</div>
					{/if}

					<div class="rg-field">
						<label class="rg-label" for="email">Email address</label>
						<div class="rg-input-wrap">
							<span class="rg-input-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
							<input
								id="email"
								type="email"
								bind:value={email}
								required
								class="rg-input"
								placeholder="you@example.com"
								autocomplete="email"
							/>
						</div>
					</div>

					<div class="rg-field">
						<label class="rg-label" for="name">Full name<span class="opt">optional</span></label>
						<div class="rg-input-wrap">
							<span class="rg-input-icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
							<input
								id="name"
								type="text"
								bind:value={name}
								class="rg-input"
								placeholder="John Doe"
								autocomplete="name"
							/>
						</div>
					</div>

					<div class="rg-field">
						<label class="rg-label" for="password">Password<span class="hint">8+ characters</span></label>
						<div class="rg-input-wrap">
							<span class="rg-input-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								required
								class="rg-input {password.length > 0 ? (allRulesMet ? 'good' : 'warn') : ''}"
								placeholder="Create a strong password"
								autocomplete="new-password"
							/>
							<button type="button" class="rg-eye" aria-label="Toggle password visibility" onclick={() => (showPassword = !showPassword)}>
								{#if showPassword}
									<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
								{:else}
									<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
								{/if}
							</button>
						</div>
						<div class="rg-meter" aria-hidden="true">
							{#each [1,2,3,4] as i}
								<div class="rg-meter-seg {pwScore >= i ? `on${pwScore}` : ''}"></div>
							{/each}
						</div>
					</div>

					<div class="rg-field">
						<label class="rg-label" for="confirmPassword">Confirm password</label>
						<div class="rg-input-wrap">
							<span class="rg-input-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
							<input
								id="confirmPassword"
								type="password"
								bind:value={confirmPassword}
								required
								class="rg-input {passwordMismatch ? 'bad' : ''}"
								placeholder="Confirm your password"
								autocomplete="new-password"
							/>
						</div>
						{#if passwordMismatch}
							<div class="rg-mismatch">⚠ Passwords do not match</div>
						{/if}
					</div>

					<div class="rg-ref">
						<div class="rg-ref-icon"><svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
						<div class="rg-ref-txt">
							{#if referralCode}
								Referral code <b>{referralCode}</b> applied — earn <b>+500 bonus pts</b> once you both reach $5.
							{:else}
								Have a referral code? <b>+500 bonus pts</b> when both of you earn first $5.
							{/if}
						</div>
					</div>

					<label class="rg-terms">
						<input type="checkbox" bind:checked={agreedTerms} required />
						<span class="rg-terms-txt">
							I agree to the <a href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>, and confirm I'm 18+ and a US resident.
						</span>
					</label>

					<div class="rg-turnstile">
						<Turnstile
							bind:this={turnstileRef}
							onVerify={handleTurnstileVerify}
							onError={handleTurnstileError}
							onExpire={handleTurnstileExpire}
							theme="dark"
							size="normal"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading || !email || !password || !confirmPassword || passwordMismatch || !agreedTerms || !turnstileToken}
						class="rg-submit"
					>
						{#if isLoading}
							<span class="rg-spin"></span> Creating account…
						{:else}
							Create account
							<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
						{/if}
					</button>
				</form>

				<div class="rg-alt">
					Already have an account?<a href="/login{redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}">Sign in here →</a>
				</div>
				<div class="rg-legal">
					<a href="/privacy-policy">Privacy Policy</a>
					<a href="/terms-of-service">Terms of Service</a>
				</div>
			</div>
		</section>
	</div>

	<footer class="rg-footer">
		<div class="rg-footer-rating">
			<span class="rg-stars" aria-hidden="true">
				{#each [1,2,3,4,5] as _}
					<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
				{/each}
			</span>
			<span>4.7 · 3,200+ reviews</span>
		</div>
		<div class="rg-footer-copy">© Earnmaze 2026</div>
		<span class="rg-footer-spacer"></span>
	</footer>
</div>
