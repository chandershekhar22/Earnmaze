<script lang="ts">
  let { data } = $props<{ data: { items: any[]; kind: string; kindLabel: string; accent: string } }>();
  let activeFilter = $state('all');

  const ITEMS = $derived(data.items as any[]);

  const FILTERS = $derived([
    { cat: 'all', label: 'All', count: ITEMS.length },
    { cat: 'trending', label: 'Trending', count: ITEMS.filter(a => a.tags?.includes('TRENDING')).length },
    { cat: 'new', label: 'New', count: ITEMS.filter(a => a.tags?.includes('NEW')).length },
    { cat: 'data', label: 'Data', count: ITEMS.filter(a => a.cat === 'data').length },
    { cat: 'lifestyle', label: 'Lifestyle', count: ITEMS.filter(a => a.cat === 'lifestyle').length },
  ]);

  let filtered = $derived(
    activeFilter === 'all' ? ITEMS :
    activeFilter === 'trending' ? ITEMS.filter(a => a.tags?.includes('TRENDING')) :
    activeFilter === 'new' ? ITEMS.filter(a => a.tags?.includes('NEW')) :
    ITEMS.filter(a => a.cat === activeFilter)
  );
</script>

<svelte:head>
  <title>{data.kindLabel} — EarnMaze</title>
  <meta name="description" content="Curated interactive experiences inside EarnMaze." />
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
    --orange:#ff8a3d;--og:rgba(255,138,61,.14);
    --purple:#8f7cff;--pg:rgba(143,124,255,.14);
    --pink:#ff5f8f;--yellow:#ffd166;--red:#ff5d73;
    --grad:linear-gradient(135deg,#35d39a,#56a8ff,#8f7cff);
    --grad-art:linear-gradient(135deg,#0f1730,#101b34,#0d2025);
    --r1:8px;--r2:12px;--r3:16px;--r4:20px;--r5:60px;
    --sh2:0 8px 32px rgba(0,0,0,.3);--sh3:0 24px 64px rgba(0,0,0,.4);
    --f:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;
    --ease:cubic-bezier(.16,1,.3,1);
  }
  html{font-size:16px;scroll-behavior:smooth}
  body{background:var(--bg);color:var(--t1);font-family:var(--f);overflow-x:hidden;line-height:1.65;-webkit-font-smoothing:antialiased;min-height:100vh}
  a{text-decoration:none;color:inherit}
  button{font-family:var(--f);cursor:pointer;border:none;background:none;color:inherit}
  ::selection{background:var(--green);color:#000}
  body::before{content:'';position:fixed;top:-200px;right:-200px;width:600px;height:600px;background:radial-gradient(circle,rgba(53,211,154,.08),transparent 70%);border-radius:50%;pointer-events:none;z-index:0}
  body::after{content:'';position:fixed;bottom:-300px;left:-200px;width:700px;height:700px;background:radial-gradient(circle,rgba(143,124,255,.07),transparent 70%);border-radius:50%;pointer-events:none;z-index:0}
  .container{max-width:1240px;margin:0 auto;padding:0 24px;position:relative;z-index:2}
  .grad-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .a-nav{position:sticky;top:0;z-index:100;padding:14px 0;background:rgba(6,6,11,.82);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.06)}
  .a-nav .container{display:flex;align-items:center;justify-content:space-between;gap:16px}
  .logo{display:flex;align-items:center;gap:11px;font-weight:800;font-size:1.25rem;letter-spacing:-.6px}
  .logo-mark{width:38px;height:38px;background:var(--grad);border-radius:11px;display:grid;place-items:center;position:relative;flex-shrink:0}
  .logo-mark::after{content:'';position:absolute;inset:2px;background:var(--bg);border-radius:9px}
  .logo-mark svg{width:19px;height:19px;position:relative;z-index:1;fill:none;stroke:var(--green);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  .nav-links{display:flex;align-items:center;gap:26px}
  .nav-links a{font-size:.85rem;font-weight:500;color:var(--t2);transition:color .25s;position:relative}
  .nav-links a:hover,.nav-links a.active{color:var(--t1)}
  .nav-links a.active::after{content:'';position:absolute;bottom:-6px;left:0;right:0;height:2px;background:var(--green);border-radius:2px}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;font-weight:700;font-size:.82rem;border-radius:var(--r5);cursor:pointer;transition:all .3s var(--ease);border:none;letter-spacing:-.2px;white-space:nowrap}
  .btn-p{background:var(--green);color:#060b08}
  .btn-p:hover{box-shadow:0 0 0 4px var(--gg);transform:translateY(-1px)}
  .hero{padding:80px 0 32px;text-align:center;position:relative}
  .hero-chip{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:var(--gl);border:1px solid var(--gl-b);border-radius:var(--r5);font-size:.72rem;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;backdrop-filter:blur(12px)}
  .hero-chip-dot{width:8px;height:8px;background:var(--green);border-radius:50%;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.2)}}
  .hero h1{font-size:clamp(2.4rem,5.5vw,4rem);font-weight:800;letter-spacing:-2px;line-height:1.05;margin-bottom:20px}
  .hero p{font-size:1.05rem;color:var(--t2);max-width:560px;margin:0 auto;line-height:1.7}
  .filters-wrap{padding:36px 0 16px}
  .filters{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .filter{padding:10px 20px;background:var(--sf2);border:1px solid var(--gl-b);border-radius:var(--r5);font-size:.84rem;font-weight:600;color:var(--t2);cursor:pointer;transition:all .25s;display:inline-flex;align-items:center;gap:8px}
  .filter:hover{color:var(--t1);background:var(--sf3)}
  .filter.active{background:var(--green);color:#060b08;border-color:var(--green)}
  .filter .count{font-family:var(--mono);font-size:.7rem;background:rgba(0,0,0,.2);padding:2px 8px;border-radius:10px;min-width:22px;text-align:center}
  .filter.active .count{background:rgba(0,0,0,.18)}
  .a-section{padding:24px 0 100px}
  .a-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  .a-card{background:var(--grad-art);border:1px solid var(--gl-b);border-radius:var(--r3);overflow:hidden;cursor:pointer;transition:all .4s var(--ease);position:relative;display:flex;flex-direction:column;animation:cardIn .5s var(--ease) backwards}
  .a-card:hover{transform:translateY(-6px);border-color:rgba(53,211,154,.3);box-shadow:var(--sh3)}
  @keyframes cardIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .a-card:nth-child(1){animation-delay:.05s}.a-card:nth-child(2){animation-delay:.1s}.a-card:nth-child(3){animation-delay:.15s}
  .a-thumb{height:200px;position:relative;overflow:hidden;display:grid;place-items:center;padding:16px}
  .a-thumb::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.08),transparent 50%);pointer-events:none}
  .a-thumb-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
  .a-tags{position:absolute;top:14px;left:14px;display:flex;gap:6px;z-index:2}
  .a-tags-r{position:absolute;top:14px;right:14px;display:flex;gap:6px;z-index:2}
  .tag{padding:4px 10px;border-radius:6px;font-size:.62rem;font-weight:800;letter-spacing:1.2px;backdrop-filter:blur(12px)}
  .tag.data{background:rgba(53,211,154,.22);color:#5fe2b0;border:1px solid rgba(53,211,154,.3)}
  .tag.lifestyle{background:rgba(143,124,255,.22);color:#b3a5ff;border:1px solid rgba(143,124,255,.3)}
  .tag.other{background:rgba(86,168,255,.22);color:#7eb8ff;border:1px solid rgba(86,168,255,.3)}
  .empty{grid-column:1/-1;text-align:center;padding:80px 20px;background:var(--gl);border:1px dashed var(--gl-b);border-radius:var(--r3)}
  .empty-emoji{font-size:48px;margin-bottom:14px;opacity:.6}
  .empty-title{font-size:1.1rem;font-weight:700;margin-bottom:6px}
  .empty-sub{font-size:.86rem;color:var(--t2)}
  .tag.trending{background:rgba(255,209,102,.22);color:#ffd166;border:1px solid rgba(255,209,102,.3)}
  .tag.new{background:rgba(86,168,255,.22);color:#7eb8ff;border:1px solid rgba(86,168,255,.3)}
  .a-icon{width:90px;height:90px;display:grid;place-items:center;z-index:1;filter:drop-shadow(0 8px 24px rgba(0,0,0,.3))}
  .icon-chart{display:flex;align-items:flex-end;gap:5px;height:64px}
  .icon-chart div{width:10px;background:#35d39a;border-radius:2px}
  .icon-chart div:nth-child(1){height:30%;background:#1ea878}
  .icon-chart div:nth-child(2){height:60%;background:#35d39a}
  .icon-chart div:nth-child(3){height:45%;background:#28b88a}
  .icon-chart div:nth-child(4){height:85%;background:#4fdfa5}
  .icon-chart div:nth-child(5){height:70%;background:#35d39a}
  .icon-fashion{display:flex;gap:8px}
  .icon-fashion div{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-size:18px}
  .icon-fashion div:nth-child(1){background:#ff5f8f}
  .icon-fashion div:nth-child(2){background:#56a8ff}
  .icon-fashion div:nth-child(3){background:#8f7cff}
  .icon-bars{display:flex;flex-direction:column;gap:10px;width:100%}
  .icon-bars-row{display:flex;align-items:center;gap:8px}
  .icon-bars-row .dot{width:10px;height:10px;border-radius:50%}
  .icon-bars-row .bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06);position:relative;overflow:hidden}
  .icon-bars-row .bar-fill{position:absolute;left:0;top:0;bottom:0;border-radius:3px}
  .icon-bars-row .pct{font-family:var(--mono);font-size:.65rem;font-weight:700;color:var(--t2)}
  .a-info{padding:22px;flex:1;display:flex;flex-direction:column}
  .a-title{font-size:1.08rem;font-weight:700;letter-spacing:-.3px;margin-bottom:8px}
  .a-desc{font-size:.86rem;color:var(--t2);line-height:1.55;margin-bottom:16px;flex:1}
  .a-meta{display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid var(--gl-b)}
  .a-read{display:flex;align-items:center;gap:6px;font-size:.78rem;color:var(--t2);font-family:var(--mono)}
  .a-read::before{content:'';width:6px;height:6px;background:var(--green);border-radius:50%}
  .a-open{background:var(--green);color:#060b08;padding:7px 16px;border-radius:var(--r5);font-size:.76rem;font-weight:700;display:inline-flex;align-items:center;gap:4px;transition:all .25s var(--ease);border:none;cursor:pointer}
  .a-open:hover{box-shadow:0 0 0 3px var(--gg);transform:translateY(-1px)}
  @media(max-width:1000px){.a-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:680px){
    .nav-links{display:none}
    .a-grid{grid-template-columns:1fr;gap:16px}
    .hero{padding:50px 0 20px}
    .a-thumb{height:170px}
  }
  </style>`}
</svelte:head>

<nav class="a-nav">
  <div class="container">
    <a href="/" class="logo">
      <span class="logo-mark"><svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg></span>
      EarnMaze
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/streaks" class:active={data.kind === 'streaks'}>Streaks</a>
      <a href="/quizzes" class:active={data.kind === 'quizzes'}>Quizzes</a>
      <a href="/weekly-challenges" class:active={data.kind === 'weekly-challenges'}>Challenges</a>
      <a href="/exclusive-deals" class:active={data.kind === 'exclusive-deals'}>Deals</a>
      <a href="/artifacts">Artifacts</a>
    </div>
    <a href="/register" class="btn btn-p">Sign Up Free</a>
  </div>
</nav>

<section class="hero">
  <div class="container">
    <div class="hero-chip"><span class="hero-chip-dot"></span> Curated · Interactive · Live</div>
    <h1><span class="grad-text">{data.kindLabel}</span></h1>
    <p>Hand-picked interactive experiences — explore, play with, and learn — right inside EarnMaze.</p>
  </div>
</section>

<div class="filters-wrap">
  <div class="container">
    <div class="filters">
      {#each FILTERS as f (f.cat)}
        <button class="filter" class:active={activeFilter === f.cat} onclick={() => (activeFilter = f.cat)}>
          {f.label} <span class="count">{f.count}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<section class="a-section">
  <div class="container">
    <div class="a-grid">
      {#if filtered.length === 0}
        <div class="empty">
          <div class="empty-emoji">✨</div>
          <div class="empty-title">No items yet</div>
          <div class="empty-sub">Curated experiences will appear here as soon as they're published.</div>
        </div>
      {:else}
        {#each filtered as a (a.id)}
          <a class="a-card" href="/{data.kind}/{a.id}" data-sveltekit-reload>
            <div class="a-thumb" style="background:{a.bg}">
              {#if a.thumb}
                <img class="a-thumb-img" src={a.thumb} alt={a.title} loading="lazy" />
              {/if}
              <div class="a-tags">
                <span class="tag {a.cat}">{a.cat?.toUpperCase()}</span>
              </div>
              <div class="a-tags-r">
                {#each (a.tags || []).filter(t => t === 'TRENDING' || t === 'NEW') as t}
                  <span class="tag {t.toLowerCase()}">{t}</span>
                {/each}
              </div>
              {#if !a.thumb}
                <div class="a-icon">
                  {#if a.icon === 'chart'}
                    <div class="icon-chart"><div></div><div></div><div></div><div></div><div></div></div>
                  {:else if a.icon === 'fashion'}
                    <div class="icon-fashion"><div>👗</div><div>👜</div><div>👟</div></div>
                  {:else}
                    <div class="icon-bars">
                      <div class="icon-bars-row"><span class="dot" style="background:#56a8ff"></span><span class="bar"><span class="bar-fill" style="width:75%;background:#56a8ff"></span></span><span class="pct">+24%</span></div>
                      <div class="icon-bars-row"><span class="dot" style="background:#ff5f8f"></span><span class="bar"><span class="bar-fill" style="width:50%;background:#ff5f8f"></span></span><span class="pct">+12%</span></div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
            <div class="a-info">
              <div class="a-title">{a.title}</div>
              <div class="a-desc">{a.desc}</div>
              <div class="a-meta">
                <div class="a-read">{a.readTime}</div>
                <span class="a-open">Open →</span>
              </div>
            </div>
          </a>
        {/each}
      {/if}
    </div>
  </div>
</section>
