<script lang="ts">
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let showPassword = $state(false);
	let isLoading = $state(false);
	let isRedirecting = $state(false);
	let turnstileToken = $state<string | null>(null);
	let turnstileRef: any;

	let redirectUrl = $derived($page.url.searchParams.get('redirect'));

	onMount(() => {
		authStore.clearError();

		if (!authStore.state.isLoading && authStore.state.user) {
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
			window.location.href = targetUrl;
		}
	});

	$effect(() => {
		if (authStore.state.user && !authStore.state.isLoading) {
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
			window.location.href = targetUrl;
		}
	});

	function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		handleSubmit();
	}

	async function handleSubmit() {
		if (!email || !password) return;

		if (!turnstileToken) {
			authStore.state.error = 'Please complete the CAPTCHA verification';
			return;
		}

		isLoading = true;
		const result = await authStore.login({ email, password, turnstileToken });
		isLoading = false;

		if (result.success && authStore.state.user) {
			isRedirecting = true;
			const targetUrl = redirectUrl || getDashboardUrl(authStore.state.user.userType);
			window.location.href = targetUrl;
			return;
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
	<title>Sign In — EarnMaze</title>
	<meta name="description" content="Sign in to your EarnMaze account to access your dashboard and start earning rewards." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
</svelte:head>

<!--
  Injected in the component body (not <svelte:head>): {@html} styles inside
  <svelte:head> are unreliably retained across SvelteKit navigation / hover
  preload. As a body-level component-owned node, Svelte manages it reliably.
-->
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
		--f:'Inter','Inter Fallback',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;
		--ease:cubic-bezier(.16,1,.3,1);
	}
	html{font-size:16px}
	body{background:var(--bg);color:var(--t1);font-family:var(--f);overflow-x:hidden;line-height:1.6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;min-height:100vh}
	a{text-decoration:none;color:inherit}
	button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
	::selection{background:var(--lime);color:#000}

	.lg-shell{position:relative;min-height:100vh;overflow:hidden}
	.lg-bg{position:absolute;inset:0;pointer-events:none;z-index:0}
	.lg-bg::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 75% 50%,rgba(191,243,69,.045),transparent 60%),radial-gradient(ellipse 60% 40% at 20% 30%,rgba(124,58,237,.04),transparent 60%)}
	.lg-bg::after{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(ellipse 80% 60% at 50% 50%,#000 30%,transparent 80%);-webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 50%,#000 30%,transparent 80%)}

	.lg-nav{position:relative;z-index:5;padding:22px 0}
	.lg-nav-row{max-width:1340px;margin:0 auto;padding:0 36px;display:flex;align-items:center;justify-content:space-between;gap:24px}
	.lg-logo{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:1.05rem;letter-spacing:-.4px}
	.lg-logo-mark{width:32px;height:32px;border-radius:9px;background:var(--lime);display:grid;place-items:center;box-shadow:0 4px 24px rgba(191,243,69,.25)}
	.lg-logo-mark svg{width:16px;height:16px;fill:#0a0c0f}
	.lg-nav-alt{font-size:.9rem;color:var(--t2);display:inline-flex;align-items:center;gap:8px}
	.lg-nav-alt a{color:var(--lime);font-weight:700;transition:color .15s}
	.lg-nav-alt a:hover{color:#d2ff66}

	.lg-grid{position:relative;z-index:1;max-width:1340px;margin:0 auto;padding:48px 36px 80px;display:grid;grid-template-columns:1.05fr 1fr;gap:60px;align-items:start}

	.lg-hero{padding-top:48px;position:relative}
	.lg-chip{display:inline-flex;align-items:center;gap:10px;padding:8px 16px;border-radius:var(--r-full);border:1px solid var(--lime-line);background:rgba(191,243,69,.05);font-size:.7rem;font-weight:700;letter-spacing:.18em;color:var(--lime);text-transform:uppercase;margin-bottom:40px}
	.lg-chip-dot{width:7px;height:7px;border-radius:50%;background:var(--lime);box-shadow:0 0 12px var(--lime);position:relative}
	.lg-chip-dot::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:1.5px solid var(--lime);animation:lgPing 2.2s ease-out infinite}
	@keyframes lgPing{0%{transform:scale(.6);opacity:.8}100%{transform:scale(2);opacity:0}}
	.lg-h1{font-size:clamp(2.6rem,5.4vw,4.6rem);font-weight:800;line-height:1.02;letter-spacing:-2.6px;margin-bottom:28px;color:#fff}
	.lg-h1 .grad{background:var(--grad-headline);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:inline-block}
	.lg-sub{font-size:1.02rem;color:var(--t2);max-width:480px;margin-bottom:44px;line-height:1.7}

	.lg-trust{display:flex;flex-wrap:wrap;gap:12px;max-width:520px}
	.lg-pill{display:inline-flex;align-items:center;gap:9px;padding:11px 18px;border-radius:var(--r-full);background:rgba(255,255,255,.02);border:1px solid var(--line);font-size:.85rem;font-weight:600;color:var(--t1);transition:all .2s var(--ease)}
	.lg-pill:hover{border-color:var(--line-2);background:rgba(255,255,255,.04)}
	.lg-pill svg{width:14px;height:14px;stroke:var(--lime);stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
	.lg-pill .lg-stars{display:inline-flex;gap:1px;color:var(--lime)}
	.lg-pill .lg-stars svg{stroke:none;fill:currentColor}

	.lg-card{position:relative;background:linear-gradient(180deg,#0e1217 0%,#0a0d11 100%);border:1px solid var(--line);border-radius:var(--r-2xl);padding:44px 40px;box-shadow:0 30px 80px -30px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.02) inset;animation:lgFade .6s var(--ease) both}
	@keyframes lgFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
	.lg-card-title{font-size:1.9rem;font-weight:800;letter-spacing:-1.1px;color:#fff;margin-bottom:8px}
	.lg-card-sub{font-size:.96rem;color:var(--t2);margin-bottom:34px}

	.lg-form{display:flex;flex-direction:column;gap:20px}
	.lg-field{display:flex;flex-direction:column;gap:9px}
	.lg-label{display:flex;align-items:center;justify-content:space-between;font-size:.84rem;font-weight:600;color:var(--t1)}
	.lg-label .lg-link{font-size:.78rem;color:var(--lime);font-weight:700;transition:color .15s}
	.lg-label .lg-link:hover{color:#d2ff66}
	.lg-input-wrap{position:relative;display:flex;align-items:center}
	.lg-input-icon{position:absolute;left:14px;color:var(--t3);display:grid;place-items:center;pointer-events:none}
	.lg-input-icon svg{width:16px;height:16px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}
	.lg-input{width:100%;padding:15px 16px 15px 42px;border-radius:var(--r-md);background:var(--sf);border:1px solid var(--line);font-family:inherit;font-size:.95rem;color:var(--t1);outline:none;transition:all .2s var(--ease)}
	.lg-input::placeholder{color:var(--t4)}
	.lg-input:hover{border-color:var(--line-2)}
	.lg-input:focus{border-color:var(--lime-line);background:rgba(191,243,69,.025);box-shadow:0 0 0 4px rgba(191,243,69,.07)}
	.lg-eye{position:absolute;right:12px;width:28px;height:28px;border-radius:6px;color:var(--t3);display:grid;place-items:center;transition:color .2s,background .2s}
	.lg-eye:hover{color:var(--t1);background:var(--sf-2)}
	.lg-eye svg{width:16px;height:16px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}

	.lg-remember{display:inline-flex;align-items:center;gap:10px;font-size:.88rem;color:var(--t1);cursor:pointer;user-select:none;padding:4px 0}
	.lg-remember input{width:16px;height:16px;accent-color:var(--lime);cursor:pointer}

	.lg-turnstile{display:flex;justify-content:center;padding:2px 0}
	.lg-submit{position:relative;width:100%;margin-top:4px;padding:17px 24px;border-radius:var(--r-md);background:var(--lime);color:#0a0c0f;font-weight:800;font-size:1rem;letter-spacing:-.1px;display:inline-flex;align-items:center;justify-content:center;gap:10px;transition:all .25s var(--ease);overflow:hidden}
	.lg-submit::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);transform:translateX(-100%);transition:transform .55s}
	.lg-submit:hover:not(:disabled)::after{transform:translateX(100%)}
	.lg-submit:hover:not(:disabled){background:#cdff5c;box-shadow:0 0 0 4px rgba(191,243,69,.18),0 14px 40px -10px rgba(191,243,69,.4);transform:translateY(-1px)}
	.lg-submit:disabled{opacity:.45;cursor:not-allowed}
	.lg-submit svg{width:16px;height:16px;stroke:currentColor;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}
	.lg-spin{width:16px;height:16px;border:2.5px solid rgba(10,12,15,.25);border-top-color:#0a0c0f;border-radius:50%;animation:lgSpin .7s linear infinite}
	@keyframes lgSpin{to{transform:rotate(360deg)}}
	.lg-err{display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,107,129,.08);border:1px solid rgba(255,107,129,.22);border-radius:var(--r-md);font-size:.85rem;color:#ff8096;font-weight:500;animation:lgFade .3s var(--ease) both}
	.lg-err-icon{width:22px;height:22px;border-radius:6px;background:rgba(255,107,129,.18);display:grid;place-items:center;flex-shrink:0;font-weight:800;font-size:.75rem}
	.lg-alt{text-align:center;margin-top:24px;font-size:.92rem;color:var(--t2)}
	.lg-alt a{color:var(--lime);font-weight:700;margin-left:4px}
	.lg-alt a:hover{color:#d2ff66}

	.lg-redir{position:fixed;inset:0;z-index:100;background:var(--bg);display:grid;place-items:center;animation:lgFadeIn .3s var(--ease) both}
	@keyframes lgFadeIn{from{opacity:0}to{opacity:1}}
	.lg-redir-inner{text-align:center}
	.lg-redir-mark{width:56px;height:56px;border-radius:16px;background:var(--lime);display:grid;place-items:center;margin:0 auto 18px;box-shadow:0 20px 60px rgba(191,243,69,.3)}
	.lg-redir-mark .inner-sp{width:24px;height:24px;border:3px solid rgba(10,12,15,.25);border-top-color:#0a0c0f;border-radius:50%;animation:lgSpin .8s linear infinite}
	.lg-redir h3{font-size:1.1rem;font-weight:700;margin-bottom:4px;color:#fff}
	.lg-redir p{font-size:.9rem;color:var(--t2)}

	@media(max-width:1024px){
		.lg-grid{grid-template-columns:1fr;gap:48px;padding:32px 24px 80px}
		.lg-hero{padding-top:8px;text-align:center}
		.lg-chip,.lg-h1,.lg-sub,.lg-trust{margin-left:auto;margin-right:auto}
		.lg-trust{justify-content:center}
	}
	@media(max-width:640px){
		.lg-nav-row{padding:0 18px}
		.lg-nav-alt{font-size:.82rem}
		.lg-grid{padding:24px 18px 60px}
		.lg-card{padding:32px 22px;border-radius:18px}
		.lg-card-title{font-size:1.55rem}
	}
	@media(max-width:480px){
		.lg-nav-alt span{display:none}
	}
	</style>`}

{#if isRedirecting}
	<div class="lg-redir">
		<div class="lg-redir-inner">
			<div class="lg-redir-mark"><div class="inner-sp"></div></div>
			<h3>Welcome back!</h3>
			<p>Loading your dashboard…</p>
		</div>
	</div>
{/if}

<div class="lg-shell">
	<div class="lg-bg"></div>

	<nav class="lg-nav">
		<div class="lg-nav-row">
			<a href="/" class="lg-logo">
				<span class="lg-logo-mark"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"/></svg></span>
				Earnmaze
			</a>
			<div class="lg-nav-alt">
				<span>New to Earnmaze?</span>
				<a href="/register{redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}">Create account →</a>
			</div>
		</div>
	</nav>

	<div class="lg-grid">
		<section class="lg-hero">
			<div class="lg-chip"><span class="lg-chip-dot"></span> 14-day streak active</div>
			<h1 class="lg-h1">Show up. <span class="grad">Get paid.</span></h1>
			<p class="lg-sub">Sign back into your Earnmaze wallet and keep your streak alive. Every day you skip resets the multiplier.</p>

			<div class="lg-trust">
				<span class="lg-pill">
					<span class="lg-stars" aria-hidden="true">
						{#each [1,2,3,4,5] as _}
							<svg viewBox="0 0 24 24" width="12" height="12"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
						{/each}
					</span>
					4.7 · 3,200+ reviews
				</span>
				<span class="lg-pill">
					<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
					Bank-grade encryption
				</span>
				<span class="lg-pill">
					<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
					Payouts in 24h
				</span>
				<span class="lg-pill">
					<svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
					$3.1M paid last month
				</span>
			</div>
		</section>

		<section class="lg-main">
			<div class="lg-card">
				<div class="lg-card-title">Sign in</div>
				<div class="lg-card-sub">Welcome back. Let's keep that streak.</div>

				<form onsubmit={handleFormSubmit} class="lg-form">
					{#if authStore.state.error}
						<div class="lg-err">
							<div class="lg-err-icon">!</div>
							<span>{authStore.state.error}</span>
						</div>
					{/if}

					<div class="lg-field">
						<label class="lg-label" for="email">Email address</label>
						<div class="lg-input-wrap">
							<span class="lg-input-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
							<input
								id="email"
								type="email"
								bind:value={email}
								required
								class="lg-input"
								placeholder="you@example.com"
								autocomplete="email"
							/>
						</div>
					</div>

					<div class="lg-field">
						<label class="lg-label" for="password">
							Password
							<a href="/forgot-password" class="lg-link">Forgot password?</a>
						</label>
						<div class="lg-input-wrap">
							<span class="lg-input-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								required
								class="lg-input"
								placeholder="Enter your password"
								autocomplete="current-password"
							/>
							<button type="button" class="lg-eye" aria-label="Toggle password visibility" onclick={() => (showPassword = !showPassword)}>
								{#if showPassword}
									<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
								{:else}
									<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
								{/if}
							</button>
						</div>
					</div>

					<label class="lg-remember">
						<input type="checkbox" bind:checked={rememberMe} />
						Remember me for 30 days
					</label>

					<div class="lg-turnstile">
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
						disabled={isLoading || !email || !password || !turnstileToken}
						class="lg-submit"
					>
						{#if isLoading}
							<span class="lg-spin"></span> Signing in…
						{:else}
							Sign in
							<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
						{/if}
					</button>
				</form>

				<div class="lg-alt">
					Don't have an account?<a href="/register{redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}">Sign up for free →</a>
				</div>
			</div>
		</section>
	</div>
</div>
