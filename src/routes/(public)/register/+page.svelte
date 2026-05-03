<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';

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
	let turnstileToken = $state<string | null>(null);
	let turnstileRef: any;

	let passwordMismatch = $derived(password !== confirmPassword && confirmPassword.length > 0);
	let passwordTouched = $derived(password.length > 0);

	let pwRules = $derived([
		{ label: 'At least 8 characters', met: password.length >= 8 },
		{ label: 'One uppercase letter', met: /[A-Z]/.test(password) },
		{ label: 'One lowercase letter', met: /[a-z]/.test(password) },
		{ label: 'One number', met: /[0-9]/.test(password) }
	]);
	let allRulesMet = $derived(pwRules.every((r) => r.met));

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

	async function handleSubmit() {
		if (!email || !password || !confirmPassword || passwordMismatch || !agreedTerms) return;
		if (!turnstileToken) {
			authStore.state.error = 'Please complete the CAPTCHA verification';
			return;
		}

		isLoading = true;
		const result = await authStore.register({
			email,
			password,
			name: name || undefined,
			turnstileToken,
			referralCode,
			utmSource,
			utmMedium,
			utmCampaign,
			registrationSource: utmSource ? 'ad-campaign' : 'registration-page'
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

	function handleTurnstileVerify(token: string) { turnstileToken = token; }
	function handleTurnstileError() { turnstileToken = null; }
	function handleTurnstileExpire() { turnstileToken = null; }
</script>

<svelte:head>
	<title>Sign Up — EarnMaze</title>
	<meta name="description" content="Create your EarnMaze account and start earning rewards through daily streaks, quizzes, polls, games and deals." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>
	*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
	:root{
		--bg:#0b1020;--bg2:#10172b;--bg3:#121c33;
		--sf1:rgba(255,255,255,.03);--sf2:rgba(255,255,255,.06);--sf3:rgba(255,255,255,.09);
		--gl:rgba(255,255,255,.04);--gl-b:rgba(255,255,255,.07);
		--t1:#f5f5fa;--t2:#8888a0;--t3:#5c5c72;
		--green:#35d39a;--gg:rgba(53,211,154,.16);
		--blue:#56a8ff;--bg-b:rgba(86,168,255,.14);
		--purple:#8f7cff;--pg:rgba(143,124,255,.14);
		--yellow:#ffd166;--amber:#ffb84d;--red:#ff5d73;
		--grad:linear-gradient(135deg,#35d39a,#56a8ff,#8f7cff);
		--r1:8px;--r2:12px;--r3:16px;--r4:20px;--r5:60px;
		--sh1:0 2px 8px rgba(0,0,0,.2);--sh2:0 8px 32px rgba(0,0,0,.3);--sh3:0 24px 64px rgba(0,0,0,.4);
		--f:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;
		--ease:cubic-bezier(.16,1,.3,1);
	}
	html{font-size:16px}
	body{background:var(--bg);color:var(--t1);font-family:var(--f);overflow-x:hidden;line-height:1.65;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;min-height:100vh}
	a{text-decoration:none;color:inherit}
	button{font-family:var(--f);cursor:pointer;border:none;background:none}
	::selection{background:var(--green);color:#000}
	.auth-nav{position:fixed;top:0;left:0;right:0;z-index:50;padding:18px 0}
	.auth-nav .container{max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between}
	.auth-logo{display:flex;align-items:center;gap:11px;font-weight:800;font-size:1.2rem;letter-spacing:-.6px;color:var(--t1)}
	.auth-logo-mark{width:38px;height:38px;background:var(--grad);border-radius:11px;display:grid;place-items:center;position:relative}
	.auth-logo-mark::after{content:'';position:absolute;inset:2px;background:var(--bg);border-radius:9px}
	.auth-logo-mark svg{width:18px;height:18px;position:relative;z-index:1;fill:none;stroke:var(--green);stroke-width:2.5;stroke-linecap:round}
	.auth-back{font-size:.82rem;font-weight:500;color:var(--t2);transition:color .2s;display:inline-flex;align-items:center;gap:6px}
	.auth-back:hover{color:var(--t1)}
	.auth-shell{min-height:100vh;display:grid;grid-template-columns:1.05fr .95fr;position:relative;overflow:hidden}
	.auth-bg-orb{position:absolute;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0}
	.auth-bg-orb.o1{width:600px;height:600px;top:-180px;left:-150px;background:radial-gradient(circle,var(--gg),transparent 70%);animation:authOrb 9s ease-in-out infinite}
	.auth-bg-orb.o2{width:520px;height:520px;bottom:-150px;right:-140px;background:radial-gradient(circle,var(--pg),transparent 70%);animation:authOrb 11s ease-in-out infinite 2s}
	.auth-bg-orb.o3{width:380px;height:380px;top:30%;left:35%;background:radial-gradient(circle,var(--bg-b),transparent 70%);animation:authOrb 13s ease-in-out infinite 4s}
	@keyframes authOrb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-20px) scale(1.08)}}
	.auth-hero{position:relative;z-index:2;padding:140px 60px 80px;display:flex;flex-direction:column;justify-content:center}
	.auth-hero-chip{display:inline-flex;align-items:center;gap:10px;padding:8px 18px 8px 10px;border-radius:var(--r5);border:1px solid var(--gl-b);background:var(--gl);font-size:.78rem;font-weight:600;color:var(--green);margin-bottom:24px;backdrop-filter:blur(12px);width:fit-content}
	.auth-chip-dot{width:10px;height:10px;background:var(--green);border-radius:50%;position:relative}
	.auth-chip-dot::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid var(--green);animation:aPing 2s ease-out infinite}
	@keyframes aPing{0%{transform:scale(1);opacity:.7}100%{transform:scale(2);opacity:0}}
	.auth-hero h1{font-size:clamp(2.2rem,3.5vw,3.2rem);font-weight:800;line-height:1.05;letter-spacing:-1.8px;margin-bottom:20px}
	.grad-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
	.auth-hero p{font-size:1.05rem;color:var(--t2);line-height:1.7;margin-bottom:36px;max-width:440px}
	.auth-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:440px;margin-bottom:32px}
	.auth-stat{padding:16px;border-radius:var(--r3);background:var(--gl);border:1px solid var(--gl-b);backdrop-filter:blur(12px)}
	.auth-stat-v{font-family:var(--mono);font-size:1.2rem;font-weight:700;letter-spacing:-.8px}
	.auth-stat-v.c1{color:var(--green)}.auth-stat-v.c2{color:var(--blue)}.auth-stat-v.c3{color:var(--purple)}
	.auth-stat-l{font-size:.68rem;color:var(--t3);margin-top:2px;font-weight:500}
	.auth-feat{display:flex;flex-direction:column;gap:14px;max-width:440px}
	.auth-feat-item{display:flex;align-items:center;gap:12px;font-size:.88rem;font-weight:500;color:var(--t1)}
	.auth-feat-check{width:28px;height:28px;border-radius:var(--r1);background:rgba(53,211,154,.12);border:1px solid rgba(53,211,154,.25);color:var(--green);display:grid;place-items:center;font-size:.75rem;font-weight:800;flex-shrink:0}
	.auth-main{position:relative;z-index:2;padding:120px 60px 60px;display:flex;align-items:center;justify-content:center}
	.auth-card{width:100%;max-width:500px;background:rgba(16,23,43,.72);border:1px solid var(--gl-b);border-radius:var(--r4);padding:40px 36px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:var(--sh3);animation:fadeUp .7s var(--ease) both;position:relative;overflow:hidden}
	.auth-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--grad);opacity:.7}
	@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
	.auth-card-head{text-align:center;margin-bottom:28px}
	.auth-card-icon{width:56px;height:56px;background:var(--grad);border-radius:16px;display:grid;place-items:center;margin:0 auto 18px;position:relative;box-shadow:0 10px 40px var(--gg)}
	.auth-card-icon::after{content:'';position:absolute;inset:2px;background:var(--bg);border-radius:14px}
	.auth-card-icon svg{width:26px;height:26px;position:relative;z-index:1;fill:none;stroke:var(--green);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
	.auth-card-title{font-size:1.7rem;font-weight:800;letter-spacing:-1px;margin-bottom:6px}
	.auth-card-sub{font-size:.92rem;color:var(--t2)}
	.auth-form{display:flex;flex-direction:column;gap:16px}
	.auth-field{display:flex;flex-direction:column;gap:8px}
	.auth-field label{font-size:.78rem;font-weight:600;color:var(--t2);letter-spacing:.2px;display:flex;align-items:center;gap:6px}
	.auth-field label .opt{color:var(--t3);font-weight:500}
	.auth-input{width:100%;padding:13px 16px;border-radius:var(--r2);background:var(--sf1);border:1.5px solid var(--gl-b);font-family:var(--f);font-size:.92rem;color:var(--t1);outline:none;transition:all .25s var(--ease)}
	.auth-input::placeholder{color:var(--t3)}
	.auth-input:hover{border-color:rgba(255,255,255,.12)}
	.auth-input:focus{border-color:var(--green);background:rgba(53,211,154,.04);box-shadow:0 0 0 4px rgba(53,211,154,.08)}
	.auth-input.warn{border-color:rgba(255,184,77,.4)}
	.auth-input.warn:focus{border-color:var(--amber);box-shadow:0 0 0 4px rgba(255,184,77,.08)}
	.auth-input.good{border-color:rgba(53,211,154,.4)}
	.auth-input.bad{border-color:rgba(255,93,115,.5)}
	.auth-input.bad:focus{border-color:var(--red);box-shadow:0 0 0 4px rgba(255,93,115,.08)}
	.pw-rules{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin-top:6px}
	.pw-rule{display:flex;align-items:center;gap:7px;font-size:.74rem;font-weight:500;transition:color .2s}
	.pw-rule.met{color:var(--green)}
	.pw-rule.unmet{color:var(--t3)}
	.pw-dot{width:14px;height:14px;border-radius:4px;display:grid;place-items:center;font-size:.55rem;font-weight:800;flex-shrink:0;transition:all .2s}
	.pw-rule.met .pw-dot{background:rgba(53,211,154,.18);color:var(--green)}
	.pw-rule.unmet .pw-dot{background:var(--sf2);color:var(--t3)}
	.pw-mismatch{display:flex;align-items:center;gap:6px;font-size:.74rem;font-weight:500;color:#ff8096;margin-top:4px}
	.auth-terms{padding:14px 16px;border-radius:var(--r2);background:var(--sf1);border:1px solid var(--gl-b)}
	.auth-terms label{display:flex;align-items:flex-start;gap:10px;font-size:.82rem;color:var(--t2);line-height:1.55;cursor:pointer}
	.auth-terms input[type=checkbox]{margin-top:2px;width:16px;height:16px;accent-color:var(--green);cursor:pointer;flex-shrink:0}
	.auth-terms a{color:var(--green);font-weight:600;transition:color .2s}
	.auth-terms a:hover{color:#4ee3ae}
	.auth-turnstile{display:flex;justify-content:center;padding:4px 0}
	.auth-submit{width:100%;padding:14px 24px;border-radius:var(--r5);font-family:var(--f);font-weight:700;font-size:.92rem;letter-spacing:-.2px;background:var(--green);color:#060b08;cursor:pointer;transition:all .3s var(--ease);display:inline-flex;align-items:center;justify-content:center;gap:10px;position:relative;overflow:hidden}
	.auth-submit::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);transform:translateX(-100%);transition:transform .5s}
	.auth-submit:hover:not(:disabled)::after{transform:translateX(100%)}
	.auth-submit:hover:not(:disabled){box-shadow:0 0 0 4px var(--gg),0 12px 40px var(--gg);transform:translateY(-2px)}
	.auth-submit:disabled{opacity:.45;cursor:not-allowed}
	.auth-spin{width:16px;height:16px;border:2.5px solid rgba(6,11,8,.25);border-top-color:#060b08;border-radius:50%;animation:spin .7s linear infinite}
	@keyframes spin{to{transform:rotate(360deg)}}
	.auth-err{display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,93,115,.08);border:1px solid rgba(255,93,115,.22);border-radius:var(--r2);font-size:.85rem;color:#ff8096;font-weight:500;animation:fadeUp .3s var(--ease) both}
	.auth-err-icon{width:22px;height:22px;border-radius:6px;background:rgba(255,93,115,.18);display:grid;place-items:center;flex-shrink:0;font-size:.75rem;font-weight:800;color:#ff8096}
	.auth-alt{text-align:center;margin-top:24px;padding-top:22px;border-top:1px solid var(--gl-b);font-size:.88rem;color:var(--t2)}
	.auth-alt a{color:var(--green);font-weight:600;margin-left:4px;transition:color .2s}
	.auth-alt a:hover{color:#4ee3ae}
	.auth-legal{text-align:center;margin-top:14px;font-size:.72rem;color:var(--t3)}
	.auth-legal a{color:var(--t3);transition:color .2s;margin:0 6px}
	.auth-legal a:hover{color:var(--t2)}
	@media(max-width:900px){
		.auth-shell{grid-template-columns:1fr}
		.auth-hero{display:none}
		.auth-main{padding:100px 20px 40px}
	}
	@media(max-width:480px){
		.auth-card{padding:28px 22px;border-radius:18px}
		.auth-card-title{font-size:1.4rem}
		.pw-rules{grid-template-columns:1fr}
	}
	</style>`}
</svelte:head>

<nav class="auth-nav">
	<div class="container">
		<a href="/" class="auth-logo">
			<span class="auth-logo-mark"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>
			EarnMaze
		</a>
		<a href="/" class="auth-back">← Back to home</a>
	</div>
</nav>

<div class="auth-shell">
	<div class="auth-bg-orb o1"></div>
	<div class="auth-bg-orb o2"></div>
	<div class="auth-bg-orb o3"></div>

	<section class="auth-hero">
		<div class="auth-hero-chip"><span class="auth-chip-dot"></span> Free forever · No credit card</div>
		<h1>Join 4.2M+ members <span class="grad-text">earning daily.</span></h1>
		<p>Take 30 seconds to create your free account and pick up a 250-point welcome bonus. No subscription, no commitment.</p>
		<div class="auth-stats">
			<div class="auth-stat"><div class="auth-stat-v c1">$3.1M+</div><div class="auth-stat-l">Paid Last Month</div></div>
			<div class="auth-stat"><div class="auth-stat-v c2">850K+</div><div class="auth-stat-l">Daily Streaks</div></div>
			<div class="auth-stat"><div class="auth-stat-v c3">1–3 d</div><div class="auth-stat-l">Avg Payout</div></div>
		</div>
		<div class="auth-feat">
			<div class="auth-feat-item"><div class="auth-feat-check">✓</div>Cash out via PayPal or gift cards from just $10</div>
			<div class="auth-feat-item"><div class="auth-feat-check">✓</div>Streak multipliers stack up to 5×</div>
			<div class="auth-feat-item"><div class="auth-feat-check">✓</div>Data encrypted & never sold — privacy first</div>
		</div>
	</section>

	<section class="auth-main">
		<div class="auth-card">
			<div class="auth-card-head">
				<div class="auth-card-icon">
					<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
				</div>
				<div class="auth-card-title">Create your account</div>
				<div class="auth-card-sub">Join EarnMaze and start earning rewards</div>
			</div>

			<form onsubmit={handleFormSubmit} class="auth-form">
				{#if authStore.state.error}
					<div class="auth-err">
						<div class="auth-err-icon">!</div>
						<span>{authStore.state.error}</span>
					</div>
				{/if}

				<div class="auth-field">
					<label for="email">Email address</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="auth-input"
						placeholder="you@example.com"
						autocomplete="email"
					/>
				</div>

				<div class="auth-field">
					<label for="name">Full name <span class="opt">(optional)</span></label>
					<input
						id="name"
						type="text"
						bind:value={name}
						class="auth-input"
						placeholder="John Doe"
						autocomplete="name"
					/>
				</div>

				<div class="auth-field">
					<label for="password">Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						class="auth-input {passwordTouched ? (allRulesMet ? 'good' : 'warn') : ''}"
						placeholder="Create a strong password"
						autocomplete="new-password"
					/>
					{#if passwordTouched}
						<div class="pw-rules">
							{#each pwRules as rule (rule.label)}
								<div class="pw-rule {rule.met ? 'met' : 'unmet'}">
									<span class="pw-dot">{rule.met ? '✓' : '•'}</span>
									<span>{rule.label}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="auth-field">
					<label for="confirmPassword">Confirm password</label>
					<input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						required
						class="auth-input {passwordMismatch ? 'bad' : ''}"
						placeholder="Confirm your password"
						autocomplete="new-password"
					/>
					{#if passwordMismatch}
						<div class="pw-mismatch">⚠ Passwords do not match</div>
					{/if}
				</div>

				<div class="auth-terms">
					<label>
						<input type="checkbox" bind:checked={agreedTerms} required />
						<span>
							I agree to the
							<a href="/terms-of-service">Terms of Service</a>
							and
							<a href="/privacy-policy">Privacy Policy</a>
						</span>
					</label>
				</div>

				<div class="auth-turnstile">
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
					class="auth-submit"
				>
					{#if isLoading}
						<span class="auth-spin"></span> Creating account…
					{:else}
						Create account →
					{/if}
				</button>
			</form>

			<div class="auth-alt">
				Already have an account?<a href="/login{redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}">Sign in here →</a>
			</div>

			<div class="auth-legal">
				<a href="/privacy-policy">Privacy Policy</a>·<a href="/terms-of-service">Terms of Service</a>
			</div>
		</div>
	</section>
</div>
