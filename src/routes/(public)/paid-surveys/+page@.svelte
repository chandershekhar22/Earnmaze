<script lang="ts">
  import { onMount } from 'svelte';

  let { data } = $props<{ data: {
    surveys: { id: string; title: string; description: string | null; points: number; thumbnailUrl: string | null; isTodaySurvey: boolean | null; priority: string | null; createdAt: string }[];
    todaySurveyId: string | null;
  }}>();

  const surveys = $derived(data.surveys);
  const todaySurvey = $derived(data.todaySurveyId ? surveys.find(s => s.id === data.todaySurveyId) ?? null : null);

  let searchQ = $state('');
  let filtered = $derived(
    searchQ.trim()
      ? surveys.filter(s => (s.title + ' ' + (s.description ?? '')).toLowerCase().includes(searchQ.toLowerCase()))
      : surveys
  );

  let countdown = $state('--:--:--');
  function updateCountdown() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const s = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const x = String(s % 60).padStart(2, '0');
    countdown = `${h}:${m}:${x}`;
  }

  onMount(() => {
    const nav = document.getElementById('nav');
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    const io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px' }
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => { window.removeEventListener('scroll', onScroll); io.disconnect(); clearInterval(timer); };
  });
</script>

<svelte:head>
  <title>Paid Surveys — EarnMaze</title>
  <meta name="description" content="Share opinions with major brands and earn $0.50–$5 per survey. Quick 2–10 minute surveys matched to your profile." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
</svelte:head>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html `<style>
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:#0a0c10;--bg2:#0e1117;--bg3:#141821;--line:rgba(255,255,255,.07);--line2:rgba(255,255,255,.12);
    --t1:#f1f2f5;--t2:#9aa0ad;--t3:#5e6471;
    --acc:#c7f463;--acc-d:#9bd136;--acc-soft:rgba(199,244,99,.12);--acc-text:#0a0c10;
    --warn:#ffb74a;--pos:#7eddb5;--bad:#ff7a8a;--info:#7ab8ff;--purple:#b48cff;
    --r1:8px;--r2:12px;--r3:16px;--r4:22px;--r5:999px;
    --f:'Inter','Inter Fallback',system-ui,-apple-system,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;
    --ease:cubic-bezier(.2,.7,.2,1);--max:1200px;
  }
  html{scroll-behavior:smooth;background:var(--bg)}
  body{background:var(--bg);color:var(--t1);font-family:var(--f);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  a{color:inherit;text-decoration:none}
  button{font:inherit;cursor:pointer;border:0;background:0;color:inherit}
  img{display:block;max-width:100%}
  ::selection{background:var(--acc);color:#000}
  @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

  .wrap{max-width:var(--max);margin:0 auto;padding:0 28px;position:relative}
  .i{width:18px;height:18px;display:inline-block;vertical-align:middle;flex-shrink:0}
  .i-lg{width:24px;height:24px}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:var(--r5);font-weight:600;font-size:14px;transition:all .2s var(--ease);white-space:nowrap}
  .btn-pri{background:var(--acc);color:var(--acc-text)}
  .btn-pri:hover{background:var(--acc-d);transform:translateY(-1px)}
  .btn-sec{background:transparent;color:var(--t1);border:1px solid var(--line2)}
  .btn-sec:hover{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.03)}
  .btn-ghost{padding:8px 14px;color:var(--t2);font-size:13px}
  .btn-ghost:hover{color:var(--t1)}

  nav{position:fixed;top:0;left:0;right:0;z-index:100;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);background:rgba(10,12,16,.7);border-bottom:1px solid transparent;transition:.3s}
  nav.scrolled{border-bottom-color:var(--line);background:rgba(10,12,16,.85)}
  .nav-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0}
  .brand{display:flex;align-items:center;gap:10px;font-weight:600;font-size:17px;letter-spacing:-.02em}
  .brand-mark{width:28px;height:28px;border-radius:8px;background:var(--acc);display:grid;place-items:center;color:var(--acc-text)}
  .nav-links{display:flex;align-items:center;gap:4px}
  .nav-links a{padding:8px 14px;color:var(--t2);font-size:14px;font-weight:500;border-radius:var(--r5);transition:.2s}
  .nav-links a:hover,.nav-links a.active{color:var(--t1)}
  .nav-links a.active::after{content:"";position:absolute;left:14px;right:14px;bottom:2px;height:2px;background:var(--acc);border-radius:2px}
  .nav-links a{position:relative}
  .nav-actions{display:flex;align-items:center;gap:8px}
  .coin-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:var(--r5);font-family:var(--mono);font-size:13px;font-weight:600}
  .coin-pill .dot{width:6px;height:6px;border-radius:50%;background:var(--acc)}
  .bell{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.04);border:1px solid var(--line);display:grid;place-items:center;color:var(--t2);transition:.2s}
  .bell:hover{color:var(--t1)}

  /* Hero */
  .q-hero{padding:116px 0 8px;position:relative;overflow:hidden}
  .q-hero::before{content:"";position:absolute;top:-220px;right:-160px;width:900px;height:760px;background:radial-gradient(closest-side,var(--acc-soft),transparent 70%);filter:blur(60px);pointer-events:none}
  .qh-grid{display:grid;grid-template-columns:1.15fr 0.85fr;gap:56px;align-items:center;position:relative;z-index:1}
  .qh-grid.solo{grid-template-columns:1fr;text-align:center}
  .qh-grid.solo .qh-col{max-width:640px;margin:0 auto}
  .qh-tag{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:11px;color:var(--acc-d);letter-spacing:.14em;text-transform:uppercase;margin-bottom:26px}
  .qh-tag .dot{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 4px var(--acc-soft);animation:pp 1.6s infinite}
  @keyframes pp{50%{opacity:.4}}
  .qh-grid h1{font-size:clamp(44px,6vw,84px);font-weight:700;letter-spacing:-.04em;line-height:.92;margin-bottom:22px}
  .qh-grid h1 em{font-style:normal;color:var(--acc)}
  .qh-grid .lead{font-size:17px;color:var(--t2);max-width:42ch;line-height:1.55;margin-bottom:32px}
  .qh-grid.solo .lead{margin-left:auto;margin-right:auto}

  /* Featured card */
  .feat{border:1px solid var(--line2);border-radius:var(--r4);background:var(--bg2);box-shadow:0 0 0 1px rgba(199,244,99,.05),0 24px 64px rgba(0,0,0,.45);overflow:hidden;position:relative;max-width:420px;margin-left:auto}
  .feat-top{display:flex;justify-content:space-between;align-items:center;padding:14px 16px}
  .feat-top .l{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--acc-d);display:inline-flex;align-items:center;gap:7px}
  .feat-top .l svg{width:14px;height:14px}
  .feat-top .clk{font-family:var(--mono);font-size:10.5px;color:var(--t3);letter-spacing:.06em;display:flex;align-items:center;gap:6px}
  .feat-top .clk b{color:var(--acc-d);font-weight:600}
  .feat-top .clk .d{width:5px;height:5px;border-radius:50%;background:var(--warn)}
  .feat-prev{margin:0 16px;border-radius:var(--r3);overflow:hidden;position:relative;aspect-ratio:16/9;background:#0c1018}
  .feat-prev img{width:100%;height:100%;object-fit:cover;display:block}
  .feat-prev .ph{position:absolute;inset:0;display:grid;place-items:center;color:var(--t3);font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-align:center;padding:0 24px}
  .feat-prev .live{position:absolute;top:10px;right:10px;font-family:var(--mono);font-size:9.5px;font-weight:600;color:var(--acc-d);background:rgba(8,10,14,.85);border:1px solid rgba(199,244,99,.25);padding:3px 8px;border-radius:var(--r5);display:flex;align-items:center;gap:5px}
  .feat-prev .live .d{width:5px;height:5px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 3px var(--acc-soft);animation:pp 1.5s infinite}
  .feat-prev .corner{position:absolute;width:16px;height:16px;border:2px solid rgba(199,244,99,.5)}
  .feat-prev .c1{top:8px;left:8px;border-right:0;border-bottom:0}
  .feat-prev .c2{bottom:8px;right:8px;border-left:0;border-top:0}
  .feat-info{padding:16px 16px 6px}
  .feat-info h2{font-size:22px;font-weight:700;letter-spacing:-.02em;margin-bottom:6px}
  .feat-info .sub{font-family:var(--mono);font-size:11px;color:var(--t3);letter-spacing:.02em}
  .feat-info .sub b{color:var(--t2);font-weight:600}
  .feat-foot{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 16px;margin-top:10px;border-top:1px solid var(--line)}
  .feat-foot .bonus{font-family:var(--f);font-size:24px;font-weight:600;color:var(--acc);letter-spacing:-.02em;line-height:1}
  .feat-foot .bonus span{font-size:10px;color:var(--t3);font-weight:500;letter-spacing:.1em;text-transform:uppercase;margin-left:6px}

  /* Stats */
  .stat-strip{padding:48px 0 8px}
  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  .stat-tile{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);padding:24px;position:relative;overflow:hidden}
  .stat-tile .ico{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--line);display:grid;place-items:center;margin-bottom:auto}
  .stat-tile.t1{border-color:rgba(199,244,99,.22);background:linear-gradient(160deg,rgba(199,244,99,.08),var(--bg2))}
  .stat-tile.t2{border-color:rgba(122,184,255,.22);background:linear-gradient(160deg,rgba(122,184,255,.08),var(--bg2))}
  .stat-tile.t3{border-color:rgba(255,183,74,.22);background:linear-gradient(160deg,rgba(255,183,74,.08),var(--bg2))}
  .stat-tile.t4{border-color:rgba(180,140,255,.22);background:linear-gradient(160deg,rgba(180,140,255,.08),var(--bg2))}
  .stat-tile.t1 .ico{color:var(--acc);background:rgba(199,244,99,.14);border-color:rgba(199,244,99,.22)}
  .stat-tile.t2 .ico{color:var(--info);background:rgba(122,184,255,.14);border-color:rgba(122,184,255,.22)}
  .stat-tile.t3 .ico{color:var(--warn);background:rgba(255,183,74,.14);border-color:rgba(255,183,74,.22)}
  .stat-tile.t4 .ico{color:var(--purple);background:rgba(180,140,255,.14);border-color:rgba(180,140,255,.22)}
  .stat-tile .ico svg{width:20px;height:20px}
  .stat-tile .v{font-family:var(--f);font-size:40px;font-weight:700;letter-spacing:-.03em;line-height:1;margin:18px 0 6px;color:#fff}
  .stat-tile .l{font-family:var(--mono);font-size:11px;color:var(--t2);text-transform:uppercase;letter-spacing:.12em}
  .stat-tile .d{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08);font-family:var(--mono);font-size:11px;color:var(--t2)}
  .stat-tile.t1 .d em{font-style:normal;color:var(--acc-d)}
  .stat-tile.t2 .d em{font-style:normal;color:var(--info)}
  .stat-tile.t3 .d em{font-style:normal;color:var(--warn)}
  .stat-tile.t4 .d em{font-style:normal;color:var(--purple)}
  .stat-tile .spark{position:absolute;top:24px;right:22px}

  /* Toolbar */
  .toolbar{padding:36px 0 24px}
  .tb-row{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
  .search{position:relative}
  .search input{width:280px;padding:10px 14px 10px 38px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:var(--r5);font-family:var(--f);font-size:13px;color:var(--t1);outline:none;transition:.2s}
  .search input::placeholder{color:var(--t3)}
  .search input:focus{border-color:var(--line2);background:rgba(255,255,255,.05)}
  .search .sico{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none}

  /* Survey grid */
  .gallery{padding:24px 0 96px}
  .q-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .qcard{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden;display:flex;flex-direction:column;transition:.3s var(--ease);position:relative;cursor:pointer}
  .qcard:hover{transform:translateY(-4px);border-color:var(--line2);box-shadow:0 24px 60px rgba(0,0,0,.42)}
  .qc-media{aspect-ratio:16/10;position:relative;overflow:hidden;background:#0c1018}
  .qc-media .thumb-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
  .qc-media .ph{position:absolute;inset:0;display:grid;place-items:center}
  .ph-inner{display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--t3)}
  .ph-icon{width:48px;height:48px;border-radius:14px;background:rgba(199,244,99,.08);border:1px solid rgba(199,244,99,.15);display:grid;place-items:center;color:var(--acc-d)}
  .ph-icon svg{width:22px;height:22px}
  .qc-pts{position:absolute;top:12px;right:12px;font-family:var(--mono);font-size:10.5px;font-weight:700;color:var(--acc-d);background:rgba(8,10,14,.65);border:1px solid rgba(199,244,99,.25);backdrop-filter:blur(8px);padding:4px 10px;border-radius:var(--r5);z-index:2}
  .qc-today{position:absolute;top:12px;left:12px;font-family:var(--mono);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#1a0e00;background:var(--warn);padding:4px 9px;border-radius:var(--r5);z-index:2}
  .qc-priority{position:absolute;bottom:12px;left:12px;font-family:var(--mono);font-size:9px;font-weight:700;padding:3px 8px;border-radius:var(--r5);text-transform:uppercase;letter-spacing:.08em;z-index:2}
  .qc-priority.hot{background:rgba(255,74,74,.2);border:1px solid rgba(255,74,74,.3);color:#ff7a7a}
  .qc-body{padding:18px;display:flex;flex-direction:column;flex:1;gap:8px}
  .qc-body h3{font-size:17px;font-weight:600;letter-spacing:-.012em;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .qc-body p{font-size:13.5px;color:var(--t2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .qc-foot{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-top:1px solid var(--line)}
  .qc-foot .pts{font-family:var(--mono);font-size:12px;color:var(--acc-d);font-weight:600;display:flex;align-items:center;gap:6px}
  .qc-foot .pts .d{width:5px;height:5px;border-radius:50%;background:var(--acc)}
  .qc-play{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:var(--acc);color:var(--acc-text);border-radius:var(--r5);font-size:12px;font-weight:600;transition:.2s}
  .qcard:hover .qc-play{gap:9px}
  .qc-play svg{width:13px;height:13px}

  .empty{grid-column:1/-1;text-align:center;padding:80px 24px;background:var(--bg2);border:1px dashed var(--line);border-radius:var(--r3)}
  .empty-ico{width:56px;height:56px;border-radius:14px;background:var(--acc-soft);color:var(--acc-d);display:grid;place-items:center;margin:0 auto 16px}
  .empty-t{font-size:18px;font-weight:600;margin-bottom:6px}
  .empty-s{font-size:14px;color:var(--t2)}

  .eyebrow{font-family:var(--mono);font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.18em;color:var(--t2);display:inline-flex;align-items:center;gap:8px;margin-bottom:18px}
  .eyebrow.acc{color:var(--acc-d)}
  .eyebrow .dot{width:5px;height:5px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}

  .cta{padding:96px 0 120px;text-align:center;position:relative;overflow:hidden;border-top:1px solid var(--line)}
  .cta::before{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:900px;height:500px;background:radial-gradient(closest-side,var(--acc-soft),transparent 70%);filter:blur(40px);pointer-events:none;opacity:.5}
  .cta-inner{position:relative}
  .cta h2{font-size:clamp(36px,5vw,56px);font-weight:600;letter-spacing:-.03em;line-height:1.05;margin-bottom:18px}
  .cta h2 em{font-style:normal;color:var(--acc)}
  .cta p{font-size:16px;color:var(--t2);max-width:480px;margin:0 auto 30px}
  .cta-ctas{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}

  .foot-mini{padding:32px 0;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--t3);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}

  .reveal{opacity:0;transform:translateY(20px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
  .reveal.in{opacity:1;transform:none}
  .d1{transition-delay:.05s}.d2{transition-delay:.1s}.d3{transition-delay:.15s}.d4{transition-delay:.2s}

  @media(max-width:1080px){.qh-grid{grid-template-columns:1fr;gap:36px}.stat-grid{grid-template-columns:1fr 1fr}.q-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:640px){.wrap{padding:0 20px}.q-grid{grid-template-columns:1fr}.search input{width:100%}.search{flex:1}.tb-row{flex-direction:column;align-items:stretch}}
  @media(max-width:980px){.nav-links,.coin-pill{display:none}}
</style>`}

<div style="display:contents" data-sveltekit-preload-data="off" data-sveltekit-preload-code="off">
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
    <symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>
    <symbol id="i-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></symbol>
    <symbol id="i-bolt-f" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 11-13h-7l1-7Z"/></symbol>
    <symbol id="i-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></symbol>
    <symbol id="i-coins" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="6"/><path d="M16.5 6A6 6 0 1 1 18 17.83M7 9h4M9 7v4"/></symbol>
    <symbol id="i-fire" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-3-.5 2-2 3-2 6a5 5 0 0 0 10 0c0-4-5-7-5-11Z"/></symbol>
    <symbol id="i-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 4h10v4a5 5 0 0 1-10 0V4ZM4 5h3v3a3 3 0 0 1-3-3ZM17 5h3a3 3 0 0 1-3 3V5ZM10 14h4l-1 4h-2l-1-4ZM8 20h8"/></symbol>
  </defs>
</svg>

<nav id="nav">
  <div class="wrap nav-row">
    <a href="/" class="brand" data-sveltekit-reload>
      <span class="brand-mark"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.09 12.97a.5.5 0 0 0 .41.8H11l-1 8.23a.5.5 0 0 0 .9.34L19.91 11.03a.5.5 0 0 0-.41-.8H13l1-8.23a.5.5 0 0 0-1-0Z"/></svg></span>
      EarnMaze
    </a>
    <div class="nav-links">
      <a href="/" data-sveltekit-reload>Home</a>
      <a href="/streaks" data-sveltekit-reload>Streaks</a>
      <a href="/quizzes" data-sveltekit-reload>Quizzes</a>
      <a href="/weekly-challenges" data-sveltekit-reload>Challenges</a>
      <a href="/paid-surveys" data-sveltekit-reload class="active">Surveys</a>
      <a href="/artifacts" data-sveltekit-reload>Artifacts</a>
    </div>
    <div class="nav-actions">
      <span class="coin-pill"><span class="dot"></span>2,480 pts</span>
      <button class="bell" aria-label="Notifications"><svg class="i" viewBox="0 0 24 24"><use href="#i-bell"/></svg></button>
      <a href="/login" class="btn-ghost">Log in</a>
      <a href="/register" class="btn btn-pri">Sign up free</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="q-hero">
  <div class="wrap qh-grid" class:solo={!todaySurvey}>
    <div class="reveal qh-col">
      <div class="qh-tag"><span class="dot"></span>Paid Surveys · {surveys.length} live</div>
      <h1>Share opinions.<br><em>Earn real cash.</em></h1>
      <p class="lead">Quick 2–10 minute surveys matched to your profile — from major brands paying $0.50–$5 per survey.</p>
      <a href="#section-grid" class="btn btn-pri">Browse all surveys <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>
    </div>

    {#if todaySurvey}
      <div class="feat reveal d1">
        <div class="feat-top">
          <span class="l"><svg viewBox="0 0 24 24"><use href="#i-bolt-f"/></svg>Today's Survey</span>
          <span class="clk"><span class="d"></span>Resets in <b>{countdown}</b></span>
        </div>
        <div class="feat-prev">
          <span class="corner c1"></span><span class="corner c2"></span>
          <span class="live"><span class="d"></span>LIVE</span>
          {#if todaySurvey.thumbnailUrl}
            <img src={todaySurvey.thumbnailUrl} alt={todaySurvey.title} />
          {:else}
            <div class="ph"><span style="color:var(--t3);font-family:var(--mono);font-size:10px">Survey thumbnail</span></div>
          {/if}
        </div>
        <div class="feat-info">
          <h2>{todaySurvey.title}</h2>
          <div class="sub">{new Date(todaySurvey.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · <b>admin-curated</b></div>
        </div>
        <div class="feat-foot">
          <div class="bonus">+{todaySurvey.points}<span>pts</span></div>
          <a href="/start-survey?surveyId={todaySurvey.id}" data-sveltekit-reload class="btn btn-pri">Start survey <svg class="i" viewBox="0 0 24 24"><use href="#i-play"/></svg></a>
        </div>
      </div>
    {/if}
  </div>
</section>

<!-- Stats -->
<section class="stat-strip">
  <div class="wrap stat-grid">
    <div class="stat-tile t1 reveal">
      <div class="ico"><svg viewBox="0 0 24 24"><use href="#i-doc"/></svg></div>
      <svg class="spark" width="56" height="28" viewBox="0 0 56 28" fill="none"><polyline points="0,22 10,18 20,20 30,12 40,14 56,4" stroke="var(--acc)" stroke-width="1.5"/></svg>
      <div class="v">{surveys.length}</div>
      <div class="l">Surveys available</div>
      <div class="d"><em>Live</em> on the platform now</div>
    </div>
    <div class="stat-tile t2 reveal d1">
      <div class="ico"><svg viewBox="0 0 24 24"><use href="#i-coins"/></svg></div>
      <svg class="spark" width="56" height="28" viewBox="0 0 56 28" fill="none"><polyline points="0,24 12,20 24,22 36,12 48,14 56,8" stroke="var(--info)" stroke-width="1.5"/></svg>
      <div class="v">1,840</div>
      <div class="l">Points earned today</div>
      <div class="d"><em>+340</em> in last hour</div>
    </div>
    <div class="stat-tile t3 reveal d2">
      <div class="ico"><svg viewBox="0 0 24 24"><use href="#i-fire"/></svg></div>
      <div class="v">7</div>
      <div class="l">Day streak</div>
    </div>
    <div class="stat-tile t4 reveal d3">
      <div class="ico"><svg viewBox="0 0 24 24"><use href="#i-trophy"/></svg></div>
      <div class="v">#842</div>
      <div class="l">Weekly rank</div>
    </div>
  </div>
</section>

<!-- Toolbar -->
<section class="toolbar">
  <div class="wrap tb-row">
    <span style="font-family:var(--mono);font-size:12px;color:var(--t3);letter-spacing:.08em;text-transform:uppercase">{filtered.length} surveys</span>
    <div class="search">
      <span class="sico"><svg class="i" viewBox="0 0 24 24"><use href="#i-search"/></svg></span>
      <input type="text" placeholder="Search surveys…" bind:value={searchQ} />
    </div>
  </div>
</section>

<!-- Grid -->
<section class="gallery" id="section-grid">
  <div class="wrap">
    <div class="q-grid">
      {#if filtered.length === 0}
        <div class="empty">
          <div class="empty-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-doc"/></svg></div>
          <div class="empty-t">{searchQ ? 'No surveys match your search' : 'No surveys available yet'}</div>
          <div class="empty-s">{searchQ ? 'Try a different search term.' : 'New surveys are added regularly — check back soon.'}</div>
        </div>
      {:else}
        {#each filtered as s (s.id)}
          <article class="qcard reveal">
            <div class="qc-media">
              {#if s.thumbnailUrl}
                <img class="thumb-img" src={s.thumbnailUrl} alt={s.title} loading="lazy" />
              {:else}
                <div class="ph">
                  <div class="ph-inner">
                    <div class="ph-icon"><svg viewBox="0 0 24 24"><use href="#i-doc"/></svg></div>
                    <span style="font-family:var(--mono);font-size:10px;color:var(--t3);letter-spacing:.08em">Survey</span>
                  </div>
                </div>
              {/if}
              <span class="qc-pts">+{s.points} pts</span>
              {#if s.isTodaySurvey}
                <span class="qc-today">⭐ Today's pick</span>
              {/if}
              {#if s.priority === 'high'}
                <span class="qc-priority hot">Hot</span>
              {/if}
            </div>
            <div class="qc-body">
              <h3>{s.title}</h3>
              {#if s.description}
                <p>{s.description}</p>
              {:else}
                <p style="color:var(--t3)">Share your opinion and earn points instantly.</p>
              {/if}
            </div>
            <div class="qc-foot">
              <span class="pts"><span class="d"></span>+{s.points} pts per completion</span>
              <a href="/start-survey?surveyId={s.id}" data-sveltekit-reload class="qc-play">Start <svg viewBox="0 0 24 24"><use href="#i-play"/></svg></a>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <div class="wrap cta-inner">
    <span class="eyebrow acc reveal"><span class="dot"></span>Earn while you share</span>
    <h2 class="reveal d1">Your opinion <em>pays.</em></h2>
    <p class="reveal d2">New surveys added weekly. Earn points redeemable for real rewards.</p>
    <div class="cta-ctas reveal d3">
      <a href="/" class="btn btn-pri" data-sveltekit-reload>Back to home <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>
      <a href="/register" class="btn btn-sec">Create free account</a>
    </div>
  </div>
</section>

<div class="foot-mini wrap">
  <span>© 2026 EarnMaze, Inc.</span>
  <span>Surveys updated regularly · New ones every week</span>
  <span>US members only</span>
</div>
</div>
