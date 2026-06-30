<script lang="ts">
  import { onMount } from 'svelte';
  import SocialButtons from '$lib/components/SocialButtons.svelte';

  let { data } = $props<{ data: { items: any[]; kind: string; kindLabel: string; kindSingular: string; accent: string; featured: any | null } }>();
  let activeFilter = $state('all');
  let searchQ = $state('');

  const ITEMS = $derived(data.items as any[]);

  // Per-kind hero/CTA copy — the visual structure is shared across all 5
  // sections, but wording needs to make sense for each (a quiz "plays",
  // a deal gets "claimed").
  const KIND_COPY: Record<string, {
    title1: string; title2: string; lead: string; browse: string;
    startCta: string; playCta: string; playingVerb: string; statNoun: string;
  }> = {
    quizzes: {
      title1: 'Learn fast.', title2: 'Earn faster.',
      lead: 'Bite-sized trivia across {n}+ categories. Answer, build a streak, cash out — no downloads, no nonsense.',
      browse: 'Browse all quizzes', startCta: 'Start quiz', playCta: 'Play', playingVerb: 'playing', statNoun: 'Quizzes available',
    },
    streaks: {
      title1: 'Show up daily.', title2: 'Get rewarded.',
      lead: 'Keep your streak alive across {n}+ daily check-ins and unlock bigger payouts the longer you stay consistent.',
      browse: 'Browse all streaks', startCta: 'Continue streak', playCta: 'View', playingVerb: 'active', statNoun: 'Streaks available',
    },
    'weekly-challenges': {
      title1: 'Take on the week.', title2: 'Win bigger.',
      lead: 'Fresh challenges across {n}+ categories every week — complete them for outsized point rewards.',
      browse: 'Browse all challenges', startCta: 'Start challenge', playCta: 'Join', playingVerb: 'joined', statNoun: 'Challenges available',
    },
    'exclusive-deals': {
      title1: 'Shop smart.', title2: 'Save more.',
      lead: 'Hand-picked deals and cashback offers across {n}+ categories — curated and updated regularly.',
      browse: 'Browse all deals', startCta: 'Get deal', playCta: 'Claim', playingVerb: 'claimed', statNoun: 'Deals available',
    },
    artifacts: {
      title1: 'Explore, play.', title2: 'Earn from it.',
      lead: 'Interactive experiences across {n}+ categories — explore, engage, and earn points for every one.',
      browse: 'Browse all artifacts', startCta: 'Open artifact', playCta: 'Open', playingVerb: 'exploring', statNoun: 'Artifacts available',
    },
  };
  const copy = $derived(KIND_COPY[data.kind] ?? KIND_COPY.quizzes);
  const categoryCount = $derived(new Set(ITEMS.map((a: any) => a.cat)).size || 1);

  // Deterministic decorative numbers (stable per item id, not real telemetry).
  function hashOf(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
  }
  function playingCount(id: string) {
    return 180 + (hashOf(id) % 2100);
  }
  function ratingOf(id: string) {
    return (4.4 + (hashOf(id) % 6) / 10).toFixed(1);
  }

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

  const FILTERS = $derived([
    { cat: 'all', label: 'All', count: ITEMS.length },
    { cat: 'trending', label: 'Trending', count: ITEMS.filter(a => a.tags?.includes('TRENDING')).length },
    { cat: 'new', label: 'New', count: ITEMS.filter(a => a.tags?.includes('NEW')).length },
    { cat: 'data', label: 'Data', count: ITEMS.filter(a => a.cat === 'data').length },
    { cat: 'lifestyle', label: 'Lifestyle', count: ITEMS.filter(a => a.cat === 'lifestyle').length },
  ]);

  let filtered = $derived.by(() => {
    let list = activeFilter === 'all' ? ITEMS :
      activeFilter === 'trending' ? ITEMS.filter(a => a.tags?.includes('TRENDING')) :
      activeFilter === 'new' ? ITEMS.filter(a => a.tags?.includes('NEW')) :
      ITEMS.filter(a => a.cat === activeFilter);
    const q = searchQ.trim().toLowerCase();
    if (q) list = list.filter(a => (a.title + ' ' + (a.desc || '')).toLowerCase().includes(q));
    return list;
  });

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
  <title>{data.kindLabel} — EarnMaze</title>
  <meta name="description" content="Curated interactive experiences inside EarnMaze." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Styles injected in body (not <svelte:head>) so SvelteKit nav/preload can't drop them. -->
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
  .h-display{font-size:clamp(40px,6.2vw,76px);font-weight:600;letter-spacing:-.035em;line-height:.98}
  .mono{font-family:var(--mono)}
  .i{width:18px;height:18px;display:inline-block;vertical-align:middle;flex-shrink:0}
  .i-lg{width:24px;height:24px}

  .btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:var(--r5);font-weight:600;font-size:14px;transition:all .2s var(--ease);white-space:nowrap;letter-spacing:-.005em}
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
  .nav-links a{padding:8px 14px;color:var(--t2);font-size:14px;font-weight:500;border-radius:var(--r5);transition:.2s;position:relative}
  .nav-links a:hover{color:var(--t1)}
  .nav-links a.active{color:var(--t1)}
  .nav-links a.active::after{content:"";position:absolute;left:14px;right:14px;bottom:2px;height:2px;background:var(--acc);border-radius:2px}
  .nav-actions{display:flex;align-items:center;gap:8px}
  .coin-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:var(--r5);font-family:var(--mono);font-size:13px;font-weight:600;color:var(--t1)}
  .coin-pill .dot{width:6px;height:6px;border-radius:50%;background:var(--acc)}
  .bell{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.04);border:1px solid var(--line);display:grid;place-items:center;color:var(--t2);position:relative;transition:.2s}
  .bell:hover{color:var(--t1)}
  .bell .pip{position:absolute;top:7px;right:8px;width:7px;height:7px;border-radius:50%;background:var(--bad);border:2px solid var(--bg)}

  .hero{padding:140px 0 60px;position:relative;overflow:hidden;text-align:center}
  .hero::before{content:"";position:absolute;top:-150px;left:50%;transform:translateX(-50%);width:1100px;height:560px;background:radial-gradient(closest-side,var(--acc-soft),transparent 70%);filter:blur(60px);pointer-events:none;opacity:.6}
  .hero-tag{display:inline-flex;align-items:center;gap:12px;padding:7px 16px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:var(--r5);font-family:var(--mono);font-size:11px;color:var(--t2);letter-spacing:.12em;text-transform:uppercase;margin-bottom:32px;position:relative;z-index:1}
  .hero-tag .dot{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 4px var(--acc-soft)}
  .hero-tag .sep{color:var(--t3)}
  .hero h1{margin-bottom:22px;position:relative;z-index:1;max-width:16ch;margin-left:auto;margin-right:auto}
  .hero h1 em{font-style:normal;color:var(--acc)}
  .hero .lead{font-size:18px;color:var(--t2);max-width:560px;margin:0 auto;position:relative;z-index:1}

  .toolbar{padding:36px 0 24px;position:relative;z-index:2}
  .tb-row{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
  .tabs{display:flex;align-items:center;gap:6px;padding:5px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:var(--r5);overflow:auto;max-width:100%}
  .tab{padding:8px 16px;border-radius:var(--r5);font-size:13px;font-weight:500;color:var(--t2);display:inline-flex;align-items:center;gap:8px;white-space:nowrap;transition:.2s}
  .tab:hover{color:var(--t1)}
  .tab.sel{background:var(--acc);color:var(--acc-text)}
  .tab .ct{font-family:var(--mono);font-size:10px;font-weight:600;padding:2px 6px;border-radius:var(--r5);background:rgba(255,255,255,.06);color:var(--t3)}
  .tab.sel .ct{background:rgba(10,12,16,.18);color:var(--acc-text)}
  .tb-right{display:flex;align-items:center;gap:10px}
  .search{position:relative}
  .search input{width:260px;padding:10px 14px 10px 38px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:var(--r5);font-family:var(--f);font-size:13px;color:var(--t1);outline:none;transition:.2s}
  .search input::placeholder{color:var(--t3)}
  .search input:focus{border-color:var(--line2);background:rgba(255,255,255,.05)}
  .search .sico{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none}

  .gallery{padding:24px 0 96px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .card{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden;display:flex;flex-direction:column;transition:.3s var(--ease);position:relative}
  .card:hover{transform:translateY(-3px);border-color:var(--line2);box-shadow:0 24px 60px rgba(0,0,0,.4)}
  .card-media{position:relative;aspect-ratio:16/10;overflow:hidden}
  .card-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(10,12,16,.4));pointer-events:none}
  .card-media .thumb-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
  .card-badges{position:absolute;top:14px;left:14px;right:14px;display:flex;justify-content:space-between;z-index:2}
  .cat{font-family:var(--mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;padding:5px 10px;border-radius:var(--r5);backdrop-filter:blur(10px);background:rgba(10,12,16,.5);border:1px solid rgba(255,255,255,.12);color:var(--t1)}
  .flags{display:flex;gap:6px;margin-left:auto}
  .flag{font-family:var(--mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;padding:5px 9px;border-radius:var(--r5);backdrop-filter:blur(10px)}
  .flag.trending{background:rgba(255,183,74,.15);border:1px solid rgba(255,183,74,.3);color:var(--warn)}
  .flag.new{background:rgba(122,184,255,.15);border:1px solid rgba(122,184,255,.3);color:var(--info)}
  .flag.hot{background:var(--acc-soft);border:1px solid rgba(199,244,99,.3);color:var(--acc-d)}

  .card-body{padding:22px 22px 18px;display:flex;flex-direction:column;flex:1;gap:8px;min-width:0}
  .card h3{font-size:18px;font-weight:600;letter-spacing:-.015em;line-height:1.25;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .card .desc{font-size:14px;color:var(--t2);line-height:1.55;flex:1;overflow-wrap:anywhere;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .card-foot{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-top:1px solid var(--line);background:rgba(0,0,0,.18);gap:10px;flex-wrap:wrap}
  .card-foot-l{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0}
  .card-meta{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:11px;color:var(--t3)}
  .open-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--acc);color:var(--acc-text);border-radius:var(--r5);font-size:12px;font-weight:600;transition:.2s}
  .open-btn:hover{background:var(--acc-d);gap:8px}

  /* Featured card variant disabled — all cards render uniformly */

  .art{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden}
  .art-data{background:radial-gradient(circle at 50% 50%,#15402a 0%,#0d2519 60%,#06120c 100%)}
  .bars{display:flex;align-items:flex-end;gap:10px;height:55%;width:55%}
  .bars .bar{flex:1;background:linear-gradient(180deg,var(--acc),rgba(199,244,99,.3));border-radius:6px 6px 0 0;transform-origin:bottom}
  .bars .bar:nth-child(1){height:30%}.bars .bar:nth-child(2){height:55%}.bars .bar:nth-child(3){height:75%}.bars .bar:nth-child(4){height:90%}.bars .bar:nth-child(5){height:100%}

  .art-fashion{background:radial-gradient(circle at 30% 30%,#5a2d8c 0%,#3d1d6a 50%,#1a0d2e 100%)}
  .fic{position:relative;width:72%;height:60%;display:flex;justify-content:center;align-items:center;gap:18px}
  .fc{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;color:#fff;font-size:22px;box-shadow:0 14px 30px rgba(0,0,0,.4),inset 0 -6px 12px rgba(0,0,0,.2),inset 0 2px 0 rgba(255,255,255,.25)}
  .fc:nth-child(1){background:linear-gradient(135deg,#ff5e7b,#c43356);transform:rotate(-6deg)}
  .fc:nth-child(2){background:linear-gradient(135deg,#5b8dff,#2a55c4);transform:translateY(-14px) rotate(3deg)}
  .fc:nth-child(3){background:linear-gradient(135deg,#b48cff,#7a55d9);transform:rotate(8deg)}

  .art-other{background:radial-gradient(circle at 40% 40%,#1c2a4a 0%,#101a30 55%,#070b18 100%)}
  .other-grid{display:flex;flex-direction:column;gap:12px;width:60%}
  .other-row{display:flex;align-items:center;gap:10px}
  .other-row .dot{width:10px;height:10px;border-radius:50%}
  .other-row .bar{flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.06);position:relative;overflow:hidden}
  .other-row .bar-fill{position:absolute;left:0;top:0;bottom:0;border-radius:4px}
  .other-row .pct{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--t2);min-width:42px;text-align:right}

  .empty{grid-column:1/-1;text-align:center;padding:80px 24px;background:var(--bg2);border:1px dashed var(--line);border-radius:var(--r3)}
  .empty-ico{width:56px;height:56px;border-radius:14px;background:var(--acc-soft);color:var(--acc-d);display:grid;place-items:center;margin:0 auto 16px}
  .empty-t{font-size:18px;font-weight:600;letter-spacing:-.01em;margin-bottom:6px}
  .empty-s{font-size:14px;color:var(--t2)}

  .cta{padding:96px 0 120px;text-align:center;position:relative;overflow:hidden;border-top:1px solid var(--line)}
  .cta::before{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:900px;height:500px;background:radial-gradient(closest-side,var(--acc-soft),transparent 70%);filter:blur(40px);pointer-events:none;opacity:.5}
  .cta-inner{position:relative}
  .cta h2{font-size:clamp(36px,5vw,56px);font-weight:600;letter-spacing:-.03em;line-height:1.05;margin-bottom:18px}
  .cta h2 em{font-style:normal;color:var(--acc)}
  .cta p{font-size:16px;color:var(--t2);max-width:480px;margin:0 auto 30px}
  .cta-ctas{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
  .eyebrow{font-family:var(--mono);font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.18em;color:var(--t2);display:inline-flex;align-items:center;gap:8px;margin-bottom:18px}
  .eyebrow.acc{color:var(--acc-d)}
  .eyebrow .dot{width:5px;height:5px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}

  .foot-mini{padding:32px 0;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--t3);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}

  .reveal{opacity:0;transform:translateY(20px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
  .reveal.in{opacity:1;transform:none}
  .d1{transition-delay:.05s}.d2{transition-delay:.1s}.d3{transition-delay:.15s}.d4{transition-delay:.2s}.d5{transition-delay:.25s}

  @media(max-width:980px){
    .grid{grid-template-columns:repeat(2,1fr)}
    .nav-links,.coin-pill{display:none}
    .hero{padding:120px 0 40px}
  }
  @media(max-width:640px){
    .wrap{padding:0 20px}
    .grid{grid-template-columns:1fr}
    .search input{width:100%}
    .search{flex:1}
    .tb-right{flex:1;width:100%}
  }

  /* ===== QUIZZES V2 HERO ===== */
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

  /* featured card */
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
  .feat-foot .bonus{font-family:var(--mono);font-size:24px;font-weight:600;color:var(--acc);letter-spacing:-.02em;line-height:1}
  .feat-foot .bonus span{font-size:10px;color:var(--t3);font-weight:500;letter-spacing:.1em;text-transform:uppercase;margin-left:6px}

  /* stat strip */
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
  .stat-tile .streakbars{display:flex;gap:4px;margin-top:14px}
  .stat-tile .streakbars i{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.08)}
  .stat-tile .streakbars i.on{background:var(--acc)}

  /* quiz card grid */
  .q-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .qcard{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden;display:flex;flex-direction:column;transition:.3s var(--ease);position:relative}
  .qcard:hover{transform:translateY(-4px);border-color:var(--line2);box-shadow:0 24px 60px rgba(0,0,0,.42)}
  .qc-media{aspect-ratio:16/10;position:relative;overflow:hidden}
  .qc-media .thumb-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
  .qc-playing{position:absolute;top:12px;left:12px;font-family:var(--mono);font-size:10.5px;font-weight:600;color:#fff;background:rgba(8,10,14,.5);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(8px);padding:4px 10px;border-radius:var(--r5);display:flex;align-items:center;gap:6px;z-index:2}
  .qc-playing .d{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 3px rgba(199,244,99,.25)}
  .qc-flag{position:absolute;top:12px;right:12px;font-family:var(--mono);font-size:9px;font-weight:700;padding:4px 9px;border-radius:var(--r5);text-transform:uppercase;letter-spacing:.08em;z-index:2}
  .qc-flag.hot{background:var(--warn);color:#1a0e00}
  .qc-flag.new{background:var(--info);color:#001020}
  .qc-body{padding:18px}
  .qc-titlerow{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:6px}
  .qc-titlerow h3{font-size:17px;font-weight:600;letter-spacing:-.012em}
  .qc-titlerow .rate{font-family:var(--mono);font-size:12px;color:var(--warn);display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
  .qc-body p{font-size:13.5px;color:var(--t2);line-height:1.5;min-height:38px}
  .qc-tags{display:flex;gap:6px;margin-top:14px;flex-wrap:wrap}
  .qc-tag{font-family:var(--mono);font-size:10px;color:var(--t3);padding:3px 9px;border:1px solid var(--line);border-radius:var(--r5);text-transform:uppercase;letter-spacing:.05em}
  .qc-foot{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-top:1px solid var(--line)}
  .qc-foot .pts{font-family:var(--mono);font-size:12px;color:var(--acc-d);font-weight:600;display:flex;align-items:center;gap:7px}
  .qc-foot .pts .d{width:5px;height:5px;border-radius:50%;background:var(--acc)}
  .qc-play{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:var(--acc);color:var(--acc-text);border-radius:var(--r5);font-size:12px;font-weight:600;transition:.2s}
  .qcard:hover .qc-play{gap:9px}
  .qc-play svg{width:13px;height:13px}

  @media(max-width:1080px){
    .qh-grid{grid-template-columns:1fr;gap:36px}
    .q-grid{grid-template-columns:1fr 1fr}
    .stat-grid{grid-template-columns:1fr 1fr}
  }
  @media(max-width:600px){
    .q-grid{grid-template-columns:1fr}
    .stat-grid{grid-template-columns:1fr}
  }
  </style>`}

<!--
  This standalone page injects its own GLOBAL stylesheet whose generic
  selectors (nav, .hero, .card, ...) collide with other routes' global CSS
  — notably the landing page's home.css. Preloading another route from here
  (e.g. hovering the logo, which points to "/") would inject that route's CSS
  and override this page's layout. Disabling preload on the whole page
  prevents that. display:contents keeps the wrapper layout-neutral.
-->
<div style="display:contents" data-sveltekit-preload-data="off" data-sveltekit-preload-code="off">
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-bolt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.09 12.97a.5.5 0 0 0 .41.8H11l-1 8.23a.5.5 0 0 0 .9.34L19.91 11.03a.5.5 0 0 0-.41-.8H13l1-8.23a.5.5 0 0 0-1-0Z"/></symbol>
    <symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
    <symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
    <symbol id="i-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/></symbol>
    <symbol id="i-bolt-f" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 11-13h-7l1-7Z"/></symbol>
    <symbol id="i-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></symbol>
    <symbol id="i-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></symbol>
    <symbol id="i-brain" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-3 3 3 3 0 0 0 2 2.8V14a3 3 0 0 0 4 2.8V19a2 2 0 0 0 3.6 1.2"/><path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 3 3 3 3 0 0 1-2 2.8V14a3 3 0 0 1-4 2.8V19a2 2 0 0 1-3.6 1.2"/></symbol>
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
      <a href="/streaks" data-sveltekit-reload class:active={data.kind === 'streaks'}>Streaks</a>
      <a href="/quizzes" data-sveltekit-reload class:active={data.kind === 'quizzes'}>Quizzes</a>
      <a href="/weekly-challenges" data-sveltekit-reload class:active={data.kind === 'weekly-challenges'}>Challenges</a>
      <a href="/exclusive-deals" data-sveltekit-reload class:active={data.kind === 'exclusive-deals'}>Deals</a>
      <a href="/artifacts" data-sveltekit-reload class:active={data.kind === 'artifacts'}>Artifacts</a>
    </div>
    <div class="nav-actions">
      <span class="coin-pill"><span class="dot"></span>2,480 pts</span>
      <button class="bell" aria-label="Notifications"><svg class="i" viewBox="0 0 24 24"><use href="#i-bell"/></svg><span class="pip"></span></button>
      <a href="/login" class="btn-ghost">Log in</a>
      <a href="/register" class="btn btn-pri">Sign up free</a>
    </div>
  </div>
</nav>

<section class="q-hero">
  <div class="wrap qh-grid" class:solo={!data.featured}>
    <div class="reveal qh-col">
      <div class="qh-tag"><span class="dot"></span>{data.kindLabel} · {ITEMS.length} live</div>
      <h1>{copy.title1}<br><em>{copy.title2}</em></h1>
      <p class="lead">{copy.lead.replace('{n}', String(categoryCount))}</p>
      <a href="#section-grid" class="btn btn-pri">{copy.browse} <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>
    </div>

    {#if data.featured}
      <div class="feat reveal d1">
        <div class="feat-top">
          <span class="l"><svg viewBox="0 0 24 24"><use href="#i-bolt-f"/></svg>Today's {data.kindSingular}</span>
          <span class="clk"><span class="d"></span>Resets in <b>{countdown}</b></span>
        </div>
        <div class="feat-prev">
          <span class="corner c1"></span><span class="corner c2"></span>
          <span class="live"><span class="d"></span>LIVE</span>
          {#if data.featured.thumb}
            <img src={data.featured.thumb} alt={data.featured.title} />
          {:else}
            <div class="ph">Thumbnail · uploaded at creation</div>
          {/if}
        </div>
        <div class="feat-info">
          <h2>{data.featured.title}</h2>
          <div class="sub">{new Date(data.featured.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · <b>admin-curated</b></div>
        </div>
        <div class="feat-foot">
          <div class="bonus">+250<span>pts max</span></div>
          <a href="/{data.kind}/{data.featured.id}" data-sveltekit-reload class="btn btn-pri">{copy.startCta} <svg class="i" viewBox="0 0 24 24"><use href="#i-play"/></svg></a>
        </div>
      </div>
    {/if}
  </div>
</section>

<section class="stat-strip">
  <div class="wrap stat-grid">
    <div class="stat-tile t1 reveal">
      <div class="ico"><svg viewBox="0 0 24 24"><use href="#i-brain"/></svg></div>
      <svg class="spark" width="56" height="28" viewBox="0 0 56 28" fill="none"><polyline points="0,22 10,18 20,20 30,12 40,14 56,4" stroke="var(--acc)" stroke-width="1.5"/></svg>
      <div class="v">{ITEMS.length}</div><div class="l">{copy.statNoun}</div>
      <div class="d"><em>Live</em> on the platform now</div>
    </div>
    <div class="stat-tile t2 reveal d1">
      <div class="ico"><svg viewBox="0 0 24 24"><use href="#i-coins"/></svg></div>
      <svg class="spark" width="56" height="28" viewBox="0 0 56 28" fill="none"><polyline points="0,24 12,20 24,22 36,12 48,14 56,8" stroke="var(--info)" stroke-width="1.5"/></svg>
      <div class="v">1,840</div><div class="l">Points earned today</div>
      <div class="d"><em>+340</em> in last hour</div>
    </div>
    <div class="stat-tile t3 reveal d2">
      <div class="ico"><svg viewBox="0 0 24 24"><use href="#i-fire"/></svg></div>
      <div class="v">7</div><div class="l">Day streak</div>
      <div class="streakbars"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></div>
    </div>
    <div class="stat-tile t4 reveal d3">
      <div class="ico"><svg viewBox="0 0 24 24"><use href="#i-trophy"/></svg></div>
      <div class="v">#842</div><div class="l">Weekly rank</div>
      <div class="d"><em>↑ 124</em> since yesterday</div>
    </div>
  </div>
</section>

<section class="toolbar">
  <div class="wrap tb-row">
    <div class="tabs">
      {#each FILTERS as f (f.cat)}
        <button class="tab" class:sel={activeFilter === f.cat} onclick={() => (activeFilter = f.cat)}>
          {f.label} <span class="ct">{f.count}</span>
        </button>
      {/each}
    </div>
    <div class="tb-right">
      <div class="search">
        <span class="sico"><svg class="i" viewBox="0 0 24 24"><use href="#i-search"/></svg></span>
        <input type="text" placeholder="Search…" bind:value={searchQ} />
      </div>
    </div>
  </div>
</section>

<section class="gallery" id="section-grid">
  <div class="wrap">
    <div class="q-grid">
      {#if filtered.length === 0}
        <div class="empty">
          <div class="empty-ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-spark"/></svg></div>
          <div class="empty-t">No items yet</div>
          <div class="empty-s">Curated experiences will appear here as soon as they're published.</div>
        </div>
      {:else}
        {#each filtered as a (a.id)}
          <article class="qcard reveal">
            <div class="qc-media">
              {#if a.thumb}
                <img class="thumb-img" src={a.thumb} alt={a.title} loading="lazy" />
              {:else}
                <div class="art {a.icon === 'chart' ? 'art-data' : a.icon === 'fashion' ? 'art-fashion' : 'art-other'}">
                  {#if a.icon === 'chart'}
                    <div class="bars"><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
                  {:else if a.icon === 'fashion'}
                    <div class="fic"><div class="fc">👗</div><div class="fc">👜</div><div class="fc">👟</div></div>
                  {:else}
                    <div class="other-grid">
                      <div class="other-row"><span class="dot" style="background:#7ab8ff"></span><span class="bar"><span class="bar-fill" style="width:75%;background:#7ab8ff"></span></span><span class="pct">+24%</span></div>
                      <div class="other-row"><span class="dot" style="background:#ff7a8a"></span><span class="bar"><span class="bar-fill" style="width:50%;background:#ff7a8a"></span></span><span class="pct">+12%</span></div>
                      <div class="other-row"><span class="dot" style="background:#c7f463"></span><span class="bar"><span class="bar-fill" style="width:88%;background:#c7f463"></span></span><span class="pct">+38%</span></div>
                    </div>
                  {/if}
                </div>
              {/if}
              <span class="qc-playing"><span class="d"></span>{playingCount(a.id)} {copy.playingVerb}</span>
              {#if (a.tags || []).includes('TRENDING')}
                <span class="qc-flag hot">Hot</span>
              {:else if (a.tags || []).includes('NEW')}
                <span class="qc-flag new">New</span>
              {/if}
            </div>
            <div class="qc-body">
              <div class="qc-titlerow">
                <h3>{a.title}</h3>
                <span class="rate"><svg viewBox="0 0 24 24" style="width:11px;height:11px"><use href="#i-star"/></svg>{ratingOf(a.id)}</span>
              </div>
              <p>{a.desc}</p>
              <div class="qc-tags">
                {#if a.cat}<span class="qc-tag">{a.cat}</span>{/if}
                <span class="qc-tag">{a.readTime}</span>
              </div>
            </div>
            <div class="qc-foot">
              <SocialButtons kind={data.kind} id={a.id} title={a.title} likes={a.likes} shares={a.shares} variant="card" />
              <a href="/{data.kind}/{a.id}" data-sveltekit-reload class="qc-play">{copy.playCta} <svg viewBox="0 0 24 24"><use href="#i-play"/></svg></a>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </div>
</section>

<section class="cta">
  <div class="wrap cta-inner">
    <span class="eyebrow acc reveal"><span class="dot"></span>Earn while you learn</span>
    <h2 class="reveal d1">Explore, engage, <em>earn.</em></h2>
    <p class="reveal d2">Every item you open earns points. New ones drop every week.</p>
    <div class="cta-ctas reveal d3">
      <a href="/" class="btn btn-pri" data-sveltekit-reload>Back to home <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>
      <a href="/#earn" class="btn btn-sec">View all categories</a>
    </div>
  </div>
</section>

<div class="foot-mini wrap">
  <span>© 2026 EarnMaze, Inc.</span>
  <span>Curated weekly · Fresh items every week</span>
  <span>US members only</span>
</div>
</div>
