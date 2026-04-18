  // ── Hamburger
  const ham = document.getElementById('ham');
  const mob = document.getElementById('mob');
  let open = false;

  function toggleMenu(force) {
    open = force !== undefined ? force : !open;
    ham.classList.toggle('open', open);
    mob.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  ham.addEventListener('click', () => toggleMenu());
  document.querySelectorAll('.mob-link').forEach(l => l.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) toggleMenu(false); });

  // ── Nav scroll tint
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // ── Smooth scroll (robust: skips href="#", waits for menu-close transition
  //    so getBoundingClientRect doesn't read a stale position on mobile)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const hash = a.getAttribute('href');
    // Skip href="#" and other invalid selectors (the card anchors use "#")
    if (!hash || hash === '#' || hash.length < 2) return;
    let target;
    try { target = document.querySelector(hash); } catch (err) { return; }
    if (!target) return;

    a.addEventListener('click', e => {
      e.preventDefault();
      // If this tap was inside the mobile menu, wait one frame for
      // toggleMenu(false) to run + body unlock before computing scroll target
      const isMobLink = a.classList.contains('mob-link');
      const doScroll = () => {
        const navH = parseInt(getComputedStyle(document.documentElement)
                      .getPropertyValue('--nav-h')) || 68;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navH - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      };
      if (isMobLink) {
        // Menu close first, then scroll on next frame
        requestAnimationFrame(() => requestAnimationFrame(doScroll));
      } else {
        doScroll();
      }
    });
  });

  // ── Marquee duplicate
  const mt = document.getElementById('mtrack');
  mt.innerHTML += mt.innerHTML;

  // ── Scroll reveal
  const revealEls = document.querySelectorAll('.r');
  const ro = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('v'); ro.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
  revealEls.forEach(el => ro.observe(el));

  // ── Counter animation
  function countUp(el, target, suffix) {
    const duration = 1400;
    const start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.innerHTML = Math.round(ease * target) + '<sup>' + suffix + '</sup>';
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  const statsEl = document.querySelector('.hero-stats');
  let counted = false;
  const co = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !counted) {
      counted = true;
      document.querySelectorAll('.stat-num[data-target]').forEach(el => {
        countUp(el, +el.dataset.target, el.dataset.suffix);
      });
    }
  }, { threshold: 0.6 });
  if (statsEl) co.observe(statsEl);

  // ── Active nav link
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-links a:not(.btn-nav)');
  const ao = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { threshold: 0.45 });
  sections.forEach(s => ao.observe(s));

  // Form validation removed — form no longer in use

  // ── Parallax on hero glow
  const heroGlow = document.querySelector('.hero-glow');
  if (heroGlow) {
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight) {
        heroGlow.style.transform = `translateY(${window.scrollY * 0.25}px)`;
      }
    }, { passive: true });
  }

  // Hide scroll indicator once user starts scrolling
  const scrollHint = document.getElementById('scroll-hint');
  if (scrollHint) {
    window.addEventListener('scroll', () => {
      scrollHint.classList.toggle('hidden', window.scrollY > 60);
    }, { passive: true });
  }


  // ════════════════════════════════════════════════════════════
  //  FEATURE ENHANCEMENTS
  // ════════════════════════════════════════════════════════════

  const isFine    = window.matchMedia('(pointer: fine)').matches;
  const noMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── MAGNETIC BUTTONS ───────────────────────────────────
  if (isFine) {
    const PULL = 0.36, RADIUS = 88;
    document.querySelectorAll('.btn-primary, .btn-secondary, .nav-logo').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r  = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width  / 2);
        const dy = e.clientY - (r.top  + r.height / 2);
        if (Math.hypot(dx, dy) < RADIUS) {
          el.style.transform  = `translate(${dx * PULL}px, ${dy * PULL}px)`;
          el.style.transition = 'transform .08s ease';
        }
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform .55s cubic-bezier(.25,.46,.45,.94), background .2s, box-shadow .2s';
        el.style.transform  = '';
        setTimeout(() => { el.style.transition = ''; }, 560);
      });
    });
  }

  // ── 3. 3D CARD TILT + GLARE ───────────────────────────────
  if (isFine && !noMotion) {
    document.querySelectorAll('.card').forEach(card => {
      // Add glare overlay
      const glare = document.createElement('div');
      glare.className = 'card-glare';
      card.appendChild(glare);
      // Disable CSS hover transform so JS can own it
      card.classList.add('js-tilt');

      const MAX = 11;

      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;   // -0.5 → 0.5
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transition = 'transform .05s ease';
        card.style.transform  = `perspective(900px) rotateX(${-y * MAX}deg) rotateY(${x * MAX}deg) scale(1.03)`;
        card.style.boxShadow  = `${-x * 18}px ${-y * 18}px 55px rgba(0,0,0,.55)`;
        // Glare follows cursor
        glare.style.background = `radial-gradient(circle at ${(x+.5)*100}% ${(y+.5)*100}%, rgba(255,255,255,.15) 0%, transparent 55%)`;
        glare.style.opacity = '1';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .65s cubic-bezier(.25,.46,.45,.94), box-shadow .65s';
        card.style.transform  = '';
        card.style.boxShadow  = '';
        glare.style.opacity   = '0';
      });
    });
  }

  // ── 4. PROJECT MODAL ──────────────────────────────────────
  const PROJECTS = [
    {
      title: 'Enterprise Analytics <em>Dashboard</em>',
      company: 'Home Credit India · 2023',
      tags: ['UX Strategy', 'Product Design', 'Design System'],
      grad: 'g1',
      role: 'Lead Product Designer',
      team: '1 PM · 3 Engineers · 1 Researcher',
      timeline: '16 weeks',
      tldr: 'Rebuilt a legacy analytics dashboard into a modular, role-aware workspace, cutting task time by 40% and launching a 200+ component design system in parallel.',
      metrics: [
        { v: '40%',  l: 'Faster task completion' },
        { v: '200+', l: 'Design components'      },
        { v: '50K+', l: 'Active users'           },
      ],
      problem: 'The legacy dashboard was built in 2015 and had grown into an unmaintainable maze of features. Users were spending 3× longer than needed to extract insights, and the design team had no shared component system to work from.',
      research: [
        '24 contextual interviews across 3 user segments (analysts, managers, execs)',
        'Heuristic audit of 32 legacy screens against Nielsen\'s 10 usability principles',
        'Competitive teardown of 6 analytics tools including Tableau, Looker and Metabase',
        'Session-recording review of 400+ real user journeys to trace friction points',
      ],
      insights: [
        'Analysts lived in 3 specific screens ~90% of the time. The rest was noise on their daily path.',
        'Managers didn\'t need more data; they needed alerts when data *moved*.',
        'Power users had built private Excel workarounds because saved views weren\'t searchable.',
      ],
      approach: [
        'Split the product into "Explore" vs "Monitor" modes, mapped to the two dominant JTBDs',
        'Chose a token-first design system so engineering could migrate file-by-file with no big-bang rewrite',
        'Prototyped 3 navigation models and validated weekly in Maze (n=12 per round)',
        'Designed alerts as a standalone surface rather than bolting them onto the existing nav',
      ],
      outcomes: [
        '40% reduction in average task completion time',
        'NPS jumped from 22 → 61 within two quarters post-launch',
        'Design system adopted across 4 separate product teams',
        'New user onboarding time cut in half',
      ],
      learnings: 'The hardest part wasn\'t the design. It was convincing stakeholders to cut their "pet modules". I underestimated how political feature-reduction would be. Next time, I\'d bring execs into research readouts earlier so the hard decisions feel shared, not imposed.',
    },
    {
      title: 'E-Commerce Checkout <em>Redesign</em>',
      company: 'Retail Brand · 2022',
      tags: ['E-Commerce', 'Conversion Optimisation', 'A/B Testing'],
      grad: 'g3',
      role: 'Senior Product Designer',
      team: '1 PM · 4 Engineers · 1 Data Analyst',
      timeline: '6 weeks',
      tldr: 'Flattened a 4-step checkout into a single progressive page, lifting completion 28% and adding an estimated $2.4M in annualised revenue.',
      metrics: [
        { v: '28%', l: 'Lift in completion' },
        { v: '15%', l: 'Revenue uplift'     },
        { v: '6wk', l: 'Design to launch'   },
      ],
      problem: 'The checkout funnel had a 71% abandonment rate with users dropping off at address and payment steps. Every percentage-point of improvement represented millions in recovered revenue, making this one of the highest-stakes design problems I\'ve tackled.',
      research: [
        'Analysed 2,000+ FullStory session recordings to pinpoint exact drop-off triggers',
        'Ran an exit-intent survey capturing 1,200 responses from abandoners',
        'Audited the flow against Baymard Institute\'s 170 checkout UX guidelines',
        'Pulled 90-day funnel analytics segmented by mobile vs desktop',
      ],
      insights: [
        '62% of abandoners cited "too many steps". The real blocker was step 2 asking for info users didn\'t have on hand.',
        'Mobile users bounced 2.3× more than desktop at the address step due to keyboard-thrash.',
        'Returning customers were being forced through the full flow, a massive missed opportunity.',
      ],
      approach: [
        'Collapsed 4 steps into one progressive page with smart defaults and auto-fill',
        'Replaced generic "invalid" errors with specific, field-level inline copy',
        'Built a "resume later" SMS flow specifically for mobile abandoners',
        'A/B tested 4 variants against 50K users each over 3 weeks; let data pick the winner',
      ],
      outcomes: [
        '28% increase in checkout completion rate',
        '15% uplift in revenue attributed to the new flow',
        'Mobile checkout completion improved by 38%',
        'Checkout-related support tickets dropped by 45%',
      ],
      learnings: 'We almost shipped a variant with an animated progress bar that "felt right" in moderated testing. A/B data showed it *hurt* conversion by 1.2%. Gut and data disagreed; data won. A good reminder that usability testing and conversion testing answer very different questions.',
    },
    {
      title: 'B2B Project Management <em>Platform</em>',
      company: 'SaaS Startup · 2021',
      tags: ['SaaS', 'B2B Platform', 'Design System', '0 → 1'],
      grad: 'g4',
      role: 'Founding Designer',
      team: 'Solo → grew team to 4 designers',
      timeline: '18 months',
      tldr: 'Shaped a B2B project-management tool from zero to 10K paying teams and a $15M Series B. Built the product, brand, and design system from scratch.',
      metrics: [
        { v: '10K',  l: 'Paying teams'    },
        { v: '$15M', l: 'Series B raised' },
        { v: '0→1',  l: 'Full product build' },
      ],
      problem: 'The founders had a strong technical vision but no design direction. Joining as the founding designer, I shaped the product, brand, and design system from an empty Figma file, with everything to build and nothing to constrain it.',
      research: [
        '30 customer-discovery interviews with PMs using Jira, Asana and Monday',
        'Competitive teardown of 8 direct and 4 adjacent tools across feature and pricing dimensions',
        'Shadowed 6 teams for half-days to watch actual daily workflows, not the idealised ones',
        'Ran a "buy a feature" exercise with 40 beta users to prioritise the roadmap',
      ],
      insights: [
        'Teams didn\'t want "another Jira". They wanted the same flexibility without the setup tax.',
        'The #1 pain wasn\'t features; it was *onboarding other people onto the tool*.',
        'Most users touched only ~20% of features. The MVP could be aggressively slim if that 20% was flawless.',
      ],
      approach: [
        'Scoped the MVP to 4 object types (task · project · person · doc); ruthlessly cut everything else',
        'Designed the invite flow as the *core feature*, not a footer link',
        'Built the design system atomic-first so new surfaces didn\'t slow the team down later',
        'Partnered with marketing on the landing page so the product story was consistent end-to-end',
      ],
      outcomes: [
        'Product grew from 0 to 10,000 paying teams in 18 months',
        'Raised a $15M Series B with product design as a key differentiator',
        'Design system reduced UI build time by 60% for engineering',
        'Won "Product of the Day" on Product Hunt at launch',
      ],
      learnings: 'Being founding designer means wearing six hats, and I tried to wear them all at once for too long. I should have hired a second designer six months earlier; by the time I did, I was the bottleneck on everything. In early startups: first hire > first feature.',
    },
  ];

  const modal   = document.getElementById('modal');
  const mScrim  = document.getElementById('modal-scrim');
  const mClose  = document.getElementById('modal-close');
  const mImg    = document.getElementById('modal-img');
  const mTags   = document.getElementById('modal-tags');
  const mTitle  = document.getElementById('modal-title');
  const mCo     = document.getElementById('modal-co');
  const mMet    = document.getElementById('modal-metrics');
  const mBody   = document.getElementById('modal-body');

  function openModal(idx) {
    const p = PROJECTS[idx]; if (!p) return;

    mImg.innerHTML   = `<div class="card-img-inner ${p.grad}" style="width:100%;height:100%"></div>`;
    mTags.innerHTML  = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
    mTitle.innerHTML = p.title;
    mCo.textContent  = p.company;
    mMet.innerHTML   = p.metrics.map(m =>
      `<div><div class="m-val">${m.v}</div><div class="m-lbl">${m.l}</div></div>`
    ).join('');
    mBody.innerHTML  = `
      <div class="modal-meta mb-full">
        <div><span class="mm-lbl">Role</span><span class="mm-val">${p.role}</span></div>
        <div><span class="mm-lbl">Team</span><span class="mm-val">${p.team}</span></div>
        <div><span class="mm-lbl">Timeline</span><span class="mm-val">${p.timeline}</span></div>
      </div>

      <div class="modal-tldr mb-full">
        <span class="mm-lbl">TL;DR</span>
        <p>${p.tldr}</p>
      </div>

      <div class="mb-full">
        <div class="mb-title">01 · Context &amp; Problem</div>
        <div class="mb-text">${p.problem}</div>
      </div>

      <div>
        <div class="mb-title">02 · Research</div>
        <ul class="mb-list">${p.research.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>

      <div>
        <div class="mb-title">03 · Insights</div>
        <ul class="mb-list mb-insight-list">${p.insights.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>

      <div class="mb-full">
        <div class="mb-title">04 · Approach &amp; Decisions</div>
        <ul class="mb-list">${p.approach.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>

      <div class="modal-outcome">
        <div class="mb-title">05 · Outcomes</div>
        <div class="outcome-grid">
          ${p.outcomes.map(s => `<div style="display:flex;gap:.625rem;font-size:.9375rem;color:var(--text-secondary);line-height:1.65"><span style="color:var(--accent);flex-shrink:0">→</span>${s}</div>`).join('')}
        </div>
      </div>

      <div class="mb-full modal-reflection">
        <div class="mb-title">06 · Reflection</div>
        <div class="mb-text">${p.learnings}</div>
      </div>`;

    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => mClose.focus(), 120);
  }

  let lastFocused = null;

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  // Attach click to each card
  document.querySelectorAll('.card').forEach((card, i) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click',   e => { e.preventDefault(); lastFocused = card; openModal(i); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lastFocused = card; openModal(i); } });
  });

  mClose.addEventListener('click', closeModal);
  mScrim.addEventListener('click', closeModal);

  // Focus trap within modal
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !modal.classList.contains('open')) return;
    const focusables = modal.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // ── 6. GLITCH TITLE — pure CSS infinite animations on ::before/::after, no JS needed

  // ── 7. LIGHT / DARK THEME TOGGLE ─────────────────────────
  (function () {
    const html = document.documentElement;
    const btn  = document.getElementById('theme-toggle');
    if (!btn) return;

    const SUN  = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="2.93" y1="2.93" x2="4.34" y2="4.34"/><line x1="11.66" y1="11.66" x2="13.07" y2="13.07"/><line x1="2.93" y1="13.07" x2="4.34" y2="11.66"/><line x1="11.66" y1="4.34" x2="13.07" y2="2.93"/></svg>`;
    const MOON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 9A5.5 5.5 0 0 1 7 2.5c0-.2.01-.39.03-.58A5.75 5.75 0 1 0 14.08 9c-.19.01-.38.02-.58.02z"/></svg>`;

    // Safe localStorage wrapper — won't throw in file:// or strict privacy mode
    function getTheme() {
      try { return localStorage.getItem('gs-theme'); } catch (e) { return null; }
    }
    function saveTheme(t) {
      try { localStorage.setItem('gs-theme', t); } catch (e) { /* silent */ }
    }

    function applyTheme(theme) {
      html.setAttribute('data-theme', theme);
      btn.innerHTML = theme === 'dark' ? SUN : MOON;
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }

    // Initialise: saved → system preference → dark
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = getTheme() || (systemDark ? 'dark' : 'light');
    applyTheme(initial);

    btn.addEventListener('click', function () {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
      btn.style.transform = 'scale(0.8) rotate(30deg)';
      setTimeout(function () { btn.style.transform = ''; }, 220);
    });
  })();

  /* ── DS component bar animation ── */
  (function () {
    const bars = document.querySelectorAll('.ds-comp-bar[data-w]');
    if (!bars.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.dataset.w + '%';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    bars.forEach(b => obs.observe(b));
  })();


  // ── Back to top + mobile sticky CTA
  (() => {
    const btn    = document.getElementById('back-to-top');
    const ctaBar = document.getElementById('mobile-cta-bar');
    window.addEventListener('scroll', () => {
      const past = window.scrollY > 400;
      if (btn)    btn.classList.toggle('visible', past);
      if (ctaBar) ctaBar.classList.toggle('visible', past);
    }, { passive: true });
    if (btn) btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const card = document.getElementById('hero-card');
  if (!card) return;

  const inner = card.querySelector('.hero-card__inner');
  const holo  = card.querySelector('.hero-card__holo');
  const gloss = card.querySelector('.hero-card__gloss');

  let bounds, raf;

  function refreshBounds() { bounds = card.getBoundingClientRect(); }
  refreshBounds();
  window.addEventListener('resize', refreshBounds, { passive: true });

  card.addEventListener('mouseenter', refreshBounds);

  card.addEventListener('mousemove', function (e) {
    if (!bounds) return;
    const x  = (e.clientX - bounds.left) / bounds.width;   // 0–1 left→right
    const y  = (e.clientY - bounds.top)  / bounds.height;  // 0–1 top→bottom

    // Tilt: max ±18deg
    const rx = (y - 0.5) * -18;
    const ry = (x - 0.5) *  18;

    // Dynamic shadow offset (opposite to tilt)
    const sx = (x - 0.5) * -40;
    const sy = (y - 0.5) *  40;

    inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    card.style.setProperty('--mx',     `${x * 100}%`);
    card.style.setProperty('--my',     `${y * 100}%`);
    card.style.setProperty('--bgx',   `${x * 100}%`);
    card.style.setProperty('--bgy',   `${y * 100}%`);
    card.style.setProperty('--hue',   `${x * 360}`);
    card.style.setProperty('--angle', `${130 + ry}deg`);
    card.style.setProperty('--shadow-x', `${sx}px`);
    card.style.setProperty('--shadow-y', `${sy}px`);
  });

  card.addEventListener('mouseleave', function () {
    inner.style.transform = 'rotateX(0deg) rotateY(0deg)';
    card.style.removeProperty('--shadow-x');
    card.style.removeProperty('--shadow-y');
  });
})();

(function () {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const CELL = 80;           // grid cell size in px
  const FADE_DELAY = 500;    // ms before a lit cell starts fading
  const FADE_STEP  = 0.018;  // alpha decrease per frame
  const MAX_ALPHA  = 0.55;   // peak alpha for hover cells (stays readable on top of content)

  // Active cells: Map<"col,row", { alpha: number, litAt: number }>
  const cells = new Map();

  /* ── colour: use site accent rgb(196,112,78), adjust for theme ── */
  function accentRGBA(a) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return isLight
      ? `rgba(160,80,40,${a})`
      : `rgba(184,78,24,${a})`;
  }

  /* ── resize canvas to fill viewport ── */
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /* ── main animation loop ── */
  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.ceil(canvas.width  / CELL);
    const rows = Math.ceil(canvas.height / CELL);
    const now  = Date.now();

    /* permanent grid lines */
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.save();
    ctx.strokeStyle = accentRGBA(isLight ? 0.06 : 0.18);
    ctx.lineWidth   = isLight ? 0.5 : 0.75;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(canvas.width, r * CELL);
      ctx.stroke();
    }
    ctx.restore();

    /* glow on active cells */
    cells.forEach(function (cell, key) {
      /* start fading after FADE_DELAY ms */
      if (now - cell.litAt > FADE_DELAY) {
        cell.alpha -= FADE_STEP;
      }
      if (cell.alpha <= 0) {
        cells.delete(key);
        return;
      }
      var parts = key.split(',');
      var col   = parseInt(parts[0], 10);
      var row   = parseInt(parts[1], 10);
      var x = col * CELL;
      var y = row * CELL;
      var cx = x + CELL / 2;
      var cy = y + CELL / 2;

      /* radial gradient fill (very subtle inner glow) */
      var fill = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 0.72);
      fill.addColorStop(0, accentRGBA(cell.alpha * 0.12));
      fill.addColorStop(1, accentRGBA(0));
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, CELL, CELL);

      /* glowing border via radial gradient stroke */
      var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 0.9);
      grd.addColorStop(0, accentRGBA(cell.alpha * 0.7));
      grd.addColorStop(1, accentRGBA(0));
      ctx.strokeStyle = grd;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
    });
  }

  /* ── track mouse → light up hovered cell ── */
  window.addEventListener('mousemove', function (e) {
    var col = Math.floor(e.clientX / CELL);
    var row = Math.floor(e.clientY / CELL);
    var key = col + ',' + row;
    var existing = cells.get(key);
    if (existing) {
      existing.alpha = Math.min(existing.alpha + 0.15, MAX_ALPHA);
      existing.litAt = Date.now();
    } else {
      cells.set(key, { alpha: MAX_ALPHA, litAt: Date.now() });
    }
  });

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

(function () {
  'use strict';

  function initTestimonials() {
    var stage   = document.getElementById('testi-stage');
    var tabs    = document.querySelectorAll('.testi-tab');
    var slides  = document.querySelectorAll('.testi-slide');
    var barEl   = document.getElementById('testi-progress-bar');
    var wrapEl  = document.getElementById('testi-progress');
    if (!stage || !tabs.length || !slides.length) return;

    var count       = slides.length;
    var active      = 0;
    var autoMs      = 6500;
    var startedAt   = 0;
    var rafId       = null;
    var paused      = false;

    function show(i) {
      active = (i + count) % count;
      slides.forEach(function (s, idx) {
        s.classList.toggle('is-active', idx === active);
      });
      tabs.forEach(function (t, idx) {
        var on = idx === active;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      resetTimer();
    }

    function tick(now) {
      if (paused) { rafId = requestAnimationFrame(tick); return; }
      if (!startedAt) startedAt = now;
      var elapsed = now - startedAt;
      var pct = Math.min(elapsed / autoMs, 1) * 100;
      if (barEl) barEl.style.width = pct + '%';
      if (elapsed >= autoMs) {
        show(active + 1);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    }
    function resetTimer() {
      startedAt = 0;
      if (barEl) barEl.style.width = '0%';
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    /* Tab clicks */
    tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () { show(idx); });
    });

    /* Prev/Next buttons */
    var prevBtn = document.getElementById('testi-prev');
    var nextBtn = document.getElementById('testi-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { show(active - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(active + 1); });

    /* Arrow-key nav when anything in the stage is focused */
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { show(active - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { show(active + 1); e.preventDefault(); }
    });

    /* Pause on hover / focus */
    function pause()  { paused = true;  if (wrapEl) wrapEl.classList.add('is-paused'); }
    function resume() { paused = false; if (wrapEl) wrapEl.classList.remove('is-paused'); }
    stage.addEventListener('mouseenter', pause);
    stage.addEventListener('mouseleave', resume);
    stage.addEventListener('focusin',    pause);
    stage.addEventListener('focusout',   resume);

    /* Respect reduced-motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (wrapEl) wrapEl.style.display = 'none';
      return; /* no auto-advance */
    }

    /* Start */
    rafId = requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonials);
  } else {
    initTestimonials();
  }
})();
