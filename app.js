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
      document.querySelectorAll('.stat-num[data-target]').forEach((el, i) => {
        setTimeout(() => countUp(el, +el.dataset.target, el.dataset.suffix), i * 140);
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
      title: 'GMA Loan Journey <em>Usability Study</em>',
      company: 'Home Credit India · 2023',
      tags: ['UX Research', 'Fintech', 'Mobile'],
      grad: 'g1',
      role: 'Product/UX Designer',
      team: '1 UX Researcher · 1 PM · India Design Team',
      timeline: 'Moderated study · 5 sessions',
      tldr: 'Led end-to-end moderated usability testing on the GMA mobile app loan journey — uncovering 13 critical friction points across 5 tasks — driving targeted redesigns aimed at a 10% improvement in journey completion.',
      metrics: [
        { v: '13',  l: 'Critical friction points'  },
        { v: '5/5', l: 'Users confused by product wording' },
        { v: '10%', l: 'Target journey completion uplift'  },
      ],
      problem: 'The GMA app\'s loan journey — from Playstore download to DDM setup — had never been tested with real users. Internal teams assumed the flow was self-explanatory, but field data suggested high drop-off and long completion times. The India Design Team ran a full moderated usability study to find exactly where users were failing and why.',
      research: [
        '5 moderated usability sessions with participants aged 25–30, mix of loan-aware and first-time applicants',
        '5 core tasks per session: download GMA from Playstore, create account, apply for ₹90K personal loan, set up DDM, find running loan details',
        'Rainbow Chart Analysis to categorise and tally observed behaviours across all participants',
        'Session recordings reviewed alongside live observation notes and post-task qualitative feedback',
      ],
      insights: [
        'Playstore failure (5/5): Every single user downloaded the old CAPP app — GMA\'s name and icon weren\'t distinct enough to differentiate it from the legacy app.',
        'Product naming barrier (5/5): "Select loan product" and "Flexi Loan" terminology was understood by zero participants — financial jargon created an immediate comprehension wall.',
        'KYC path confusion (5/5): All users chose "Offline KYC" assuming the online card option was a section heading, not a clickable action — a labelling failure with serious compliance risk.',
        'DDM end date blocker (5/5): Every user was confused by an end date defaulting to "2099" — they questioned whether it was a system error and hesitated to complete the setup.',
        'PIN setup failure (4/5): Hidden PIN criteria only appeared on the first failed attempt — users had no way to know the rules before trying.',
        'Home screen blindness: Key loan CTAs were invisible in the visual noise of popups and banners — the primary conversion path went unseen.',
      ],
      approach: [
        'Recommended Playstore listing update with clear GMA vs CAPP differentiation — distinct icon, name, and description',
        'Replaced "Select loan product" with plain-language copy; Flexi Loan explanation simplified to a single-sentence benefit statement',
        'Redesigned KYC selection UI — Online option made visually primary (card); Offline option demoted to secondary text link',
        'Changed DDM end date default to the actual loan end date; added tooltip explaining the field',
        'Surfaced PIN criteria inline at input rather than revealing on first failure only',
        'Restructured home screen hierarchy to eliminate popup-driven blindness around the primary loan CTA',
      ],
      outcomes: [
        'Identified and documented 13 actionable friction points across the full GMA loan journey',
        'All critical findings accepted by PM and engineering for prioritisation in the next sprint',
        'Redesign targets a 10% improvement in journey completion rate and time-to-complete',
        'Research output became the baseline usability benchmark for the GMA loan team',
        'Rainbow Chart analysis framework adopted as the standard template for future moderated studies at Home Credit India',
      ],
      learnings: 'The biggest revelation was how many "obvious" UX failures had gone unnoticed by the internal team. Nobody had ever watched a real user try to download the app — and when they did, every single user got it wrong. Five moderated sessions surfaced issues that months of internal review had missed entirely. The ROI on shifting from assumption to observation was immediate.',
      link: 'https://medium.com/design-bootcamp/practical-guide-to-user-research-qualitative-56f3dfa5bf23',
      image: 'GMA.webp',
      imageAlt: 'Home Credit GMA Loan Journey — app screens on yellow background',
      visual: `<div class="mb-visual-label">Loan Journey · Pain Point Map</div>
        <div class="mb-journey-steps">
          <div class="mb-journey-step mb-j-critical" style="--i:0">
            <div class="mb-j-stage">Playstore</div>
            <div class="mb-j-bar"><span style="width:100%"></span></div>
            <div class="mb-j-stat">5 / 5</div>
            <div class="mb-j-note">Downloaded wrong app (CAPP instead of GMA)</div>
          </div>
          <div class="mb-journey-step mb-j-high" style="--i:1">
            <div class="mb-j-stage">Onboarding</div>
            <div class="mb-j-bar"><span style="width:80%"></span></div>
            <div class="mb-j-stat">4 / 5</div>
            <div class="mb-j-note">Tapped Skip instead of Login</div>
          </div>
          <div class="mb-journey-step mb-j-high" style="--i:2">
            <div class="mb-j-stage">PIN Setup</div>
            <div class="mb-j-bar"><span style="width:80%"></span></div>
            <div class="mb-j-stat">4 / 5</div>
            <div class="mb-j-note">Hidden PIN criteria blocked completion</div>
          </div>
          <div class="mb-journey-step mb-j-critical" style="--i:3">
            <div class="mb-j-stage">Loan Product</div>
            <div class="mb-j-bar"><span style="width:100%"></span></div>
            <div class="mb-j-stat">5 / 5</div>
            <div class="mb-j-note">"Select loan product" &amp; Flexi Loan — zero comprehension</div>
          </div>
          <div class="mb-journey-step mb-j-critical" style="--i:4">
            <div class="mb-j-stage">Address KYC</div>
            <div class="mb-j-bar"><span style="width:100%"></span></div>
            <div class="mb-j-stat">5 / 5</div>
            <div class="mb-j-note">Online KYC card mistaken for a section heading</div>
          </div>
          <div class="mb-journey-step mb-j-high" style="--i:5">
            <div class="mb-j-stage">VAS / Safe Pay</div>
            <div class="mb-j-bar"><span style="width:80%"></span></div>
            <div class="mb-j-stat">4 / 5</div>
            <div class="mb-j-note">Feature not understood, users hesitated to continue</div>
          </div>
          <div class="mb-journey-step mb-j-critical" style="--i:6">
            <div class="mb-j-stage">DDM Setup</div>
            <div class="mb-j-bar"><span style="width:100%"></span></div>
            <div class="mb-j-stat">5 / 5</div>
            <div class="mb-j-note">End date "2099" looked like a system error</div>
          </div>
        </div>`,
    },
    {
      title: 'Roles &amp; <em>Permissions</em>',
      company: 'BuildSupply · 2019',
      tags: ['B2B SaaS', 'UX Research', 'Information Architecture'],
      grad: 'g3',
      role: 'Product/UX Designer',
      team: '1 PM · 2 Engineers · 1 Customer-success Lead',
      timeline: '2 months',
      tldr: 'Rebuilt the access-control system for a construction-lifecycle SaaS: introduced a 3-tier permission hierarchy (global / project / user) and connected role creation with permission assignment in a single flow.',
      metrics: [
        { v: '3',    l: 'Permission tiers'       },
        { v: '1',    l: 'Unified role+perm flow' },
        { v: '∞',    l: 'Org structures supported' },
      ],
      problem: 'The legacy system forced every customer into the same flat role model. Two users with the same role couldn\'t hold different permissions, role creation was disconnected from permission assignment, and the flow couldn\'t represent real construction org hierarchies that span clerks, project managers, and board members.',
      research: [
        'Stakeholder interviews across 4 customer segments with very different org structures',
        'Teardown of role & permission patterns in Jira, Asana, Slack, and AWS IAM',
        'Audited the existing flow against 6 live customer tenants to map real edge cases',
        'Co-design sessions with customer-success to capture support-ticket themes',
      ],
      insights: [
        'The real unit of access isn\'t a role — it\'s a (role × scope) pair. A manager on Project A may be a viewer on Project B.',
        'Admins wanted to *start from* a role template and then tweak individual permissions, not rebuild from scratch.',
        'Department-level segregation mattered as much as project-level — missing that was the root of most permission bugs.',
      ],
      approach: [
        'Designed a 3-tier hierarchy: global roles → project-scoped overrides → per-user exceptions',
        'Unified role creation and permission assignment into a single, card-based layout',
        'Added department segregation and a filter/search layer so large tenants stayed usable at scale',
        'Prototyped in Figma and validated with 3 customer admins before engineering handoff',
      ],
      outcomes: [
        'Shipped a flexible model that scaled across every customer\'s org structure',
        'Role setup time dropped sharply — admins could clone-and-tweak instead of rebuilding',
        'Eliminated the entire class of "users stuck with wrong permissions" support tickets',
        'Pattern was reused as the foundation for later B2B admin surfaces at BuildSupply',
      ],
      learnings: 'Access control is deceptively hard: it looks like a form, but it\'s really a data model. Getting the model right (role × scope × user) was 80% of the work — the UI practically fell out once that was clean. I now always model the object graph before opening Figma.',
      image: 'case-study-roles.png',
      imageAlt: 'BuildSupply Roles & Permissions UI — project roles, all users, admin permissions and activity log screens',
      link: 'https://medium.com/design-bootcamp/roles-permissions-9c3319583150',
      visual: `<div class="mb-visual-label">Permission Hierarchy</div>
        <div class="mb-hierarchy">
          <div class="mb-hier-node mb-hier-top">
            <div class="mb-hier-icon">⬡</div>
            <div class="mb-hier-content">
              <div class="mb-hier-tier">Tier 1 · Global</div>
              <div class="mb-hier-name">Organisation Role</div>
              <div class="mb-hier-desc">Admin · Manager · Viewer — applies across all projects</div>
            </div>
          </div>
          <div class="mb-hier-arrow">
            <svg width="2" height="32" viewBox="0 0 2 32"><line x1="1" y1="0" x2="1" y2="28" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M-3 26l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span>inherits down</span>
          </div>
          <div class="mb-hier-node mb-hier-mid">
            <div class="mb-hier-icon">◈</div>
            <div class="mb-hier-content">
              <div class="mb-hier-tier">Tier 2 · Project</div>
              <div class="mb-hier-name">Project-scoped Override</div>
              <div class="mb-hier-desc">Same user, different permissions per project</div>
            </div>
          </div>
          <div class="mb-hier-arrow">
            <svg width="2" height="32" viewBox="0 0 2 32"><line x1="1" y1="0" x2="1" y2="28" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M-3 26l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span>inherits down</span>
          </div>
          <div class="mb-hier-node mb-hier-bot">
            <div class="mb-hier-icon">◎</div>
            <div class="mb-hier-content">
              <div class="mb-hier-tier">Tier 3 · User</div>
              <div class="mb-hier-name">Per-user Exception</div>
              <div class="mb-hier-desc">Fine-grained control without affecting others in the same role</div>
            </div>
          </div>
        </div>`,
    },
    {
      title: 'Application Form <em>Redesign</em>',
      company: 'Home Credit India · 2024',
      tags: ['UX Research', 'Fintech', 'Multi-market'],
      grad: 'g4',
      role: 'Product/UX Designer',
      team: 'India · Indonesia · Philippines · Vietnam design teams',
      timeline: 'Multi-country study',
      tldr: 'Led a 4-country moderated usability study comparing old vs. new loan application form flows. The new direct-entry form cut completion time by 50% and miss-click rate by 59% in India, and became the globally recommended approach.',
      metrics: [
        { v: '50%',  l: 'Faster in India'       },
        { v: '59%',  l: 'Fewer miss-clicks (IN)' },
        { v: '4',    l: 'Markets tested'         },
      ],
      problem: 'The existing application form used an accordion-style flow that forced users to navigate back and forth, causing high drop-off rates. Home Credit operated across multiple markets, each with different user behaviours — a single study needed to validate whether a new direct-entry flow would work globally, and who should make the final design call.',
      research: [
        'Moderated usability testing across India, Indonesia, Philippines, and Vietnam',
        '10–20 participants per country, age 25–45, mix of male & female, prospect and existing customers',
        'Maze testing to measure miss-click rate and task completion time for both form versions',
        'Qualitative interviews capturing ease-of-use, confidence, and understanding of progress indicators',
      ],
      insights: [
        'India: New form required fewer taps, less chance of drop-offs — users found required info visible upfront and easy to edit.',
        'Indonesia & India strongly preferred the new version (80% and 64% respectively); Philippines was neutral (50/50); Vietnam leaned new but noted both had merits.',
        'Progress bar preference split by market: India users strongly preferred the familiar linear "Step 1 of 4" pattern; Vietnam preferred circular. No universal winner — India design team recommendation carried.',
      ],
      approach: [
        'Designed two prototypes: old accordion-style vs. new direct-entry form with upfront information page',
        'Coordinated research execution across 4 country teams with a shared methodology and Maze test setup',
        'India team led synthesis, consolidated findings from all 4 country reports into a single actionable summary',
        'Proposed adding an information page before data capture — showing required fields upfront — to reduce back-and-forth across all markets',
      ],
      outcomes: [
        'India: Completion time dropped from 70.8s → 35s (50% faster)',
        'India: Miss-click rate fell from 12.70% → 5.25% (59% improvement)',
        'New direct-entry form recommended globally as the preferred approach',
        'All 4 country teams aligned on adding a pre-form information page to further reduce drop-offs',
        'India design team decision: linear progress bar with enhanced thickness for familiarity and visibility',
      ],
      learnings: 'Multi-market research rarely gives clean consensus — and that\'s the point. When data is divided (as it was with the progress bar), the team closest to their users should own the call. Framing the India team as the decision-maker, rather than waiting for global consensus, unblocked the project and produced a better outcome for our users.',
      image: 'case-study-app-form.png',

      imageAlt: 'Old vs New application form preference comparison across Philippines, Indonesia, India, and Vietnam',
      visual: `<div class="mb-visual-label">New Form Preference by Country</div>
        <div class="mb-country-chart">
          <div class="mb-country-row">
            <span class="mb-country-flag">🇮🇳</span>
            <span class="mb-country-name">India</span>
            <div class="mb-country-bar-wrap">
              <div class="mb-country-bar" style="width:64%"><span>64%</span></div>
            </div>
          </div>
          <div class="mb-country-row">
            <span class="mb-country-flag">🇮🇩</span>
            <span class="mb-country-name">Indonesia</span>
            <div class="mb-country-bar-wrap">
              <div class="mb-country-bar" style="width:80%"><span>80%</span></div>
            </div>
          </div>
          <div class="mb-country-row">
            <span class="mb-country-flag">🇵🇭</span>
            <span class="mb-country-name">Philippines</span>
            <div class="mb-country-bar-wrap">
              <div class="mb-country-bar" style="width:50%"><span>50%</span></div>
            </div>
          </div>
          <div class="mb-country-row">
            <span class="mb-country-flag">🇻🇳</span>
            <span class="mb-country-name">Vietnam</span>
            <div class="mb-country-bar-wrap">
              <div class="mb-country-bar" style="width:55%"><span>~55%</span></div>
            </div>
          </div>
        </div>
        <div class="mb-visual-label" style="margin-top:1.5rem">Completion Time: India (Old vs New)</div>
        <div class="mb-compare-row">
          <div class="mb-compare-item mb-compare-old">
            <div class="mb-compare-val">70.8s</div>
            <div class="mb-compare-lbl">Old form</div>
          </div>
          <svg width="32" height="20" viewBox="0 0 32 20" fill="none" aria-hidden="true"><path d="M2 10h28M22 4l8 6-8 6" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="mb-compare-item mb-compare-new">
            <div class="mb-compare-val">35s</div>
            <div class="mb-compare-lbl">New form · 50% faster</div>
          </div>
        </div>`,
    },
    // ── CASE STUDY 4 ──────────────────────────────────────────────
    {
      title: 'EMI Calculator <em>Optimisation</em>',
      company: 'Home Credit India · 2025',
      tags: ['UX Design', 'Fintech', 'Mobile'],
      grad: 'g2',
      role: 'Product/UX Designer',
      team: 'Product, Legal & Compliance',
      timeline: 'Aug – Nov 2025',
      tldr: 'Redesigned Home Credit India\'s EMI Calculator to eliminate drop-off and boost loan conversions. Through heuristic evaluation, a telesales call centre visit, and moderated A/B testing with 6 users, the final design drove an estimated ₹496M+ annual revenue increase.',
      metrics: [
        { v: '₹496M+', l: 'Est. Annual Revenue' },
        { v: '+3%',    l: 'CTR Increase'        },
        { v: '+5%',    l: 'VAS Adoption'        },
      ],
      problem: 'Home Credit India was losing a significant chunk of users on the first few steps of its EMI Calculator flow. With 18 million customers — mostly self-employed, Tier 3 & 4 city users — and ₹7.2 billion in annual loan disbursals, even a small drop-off carried massive revenue implications. The business KPI was clear: increase CTR by 3% and Value Added Services (VAS) adoption by 5%.',
      process: [
        'Analysed drop-off data (avg score: 46.17) to map exactly where users abandoned the flow',
        'Ran heuristic evaluation against 8 Nielsen heuristics — surfaced 6 critical violations including inconsistent terminology ("EMI" vs "Monthly Instalment") and low VAS visibility',
        'Visited the Telesales Call Centre to hear how agents converted hesitant users — key insight: reframing cost as "₹9/day" instead of a monthly lump sum dramatically reduced hesitation',
        'Designed two variants — Variant A (preset EMI-tenure combos to reduce choice overload) and Variant B (tenure selection separated from EMI calculation for clearer decisions)',
        'Ran moderated usability testing with 6 users; task: apply for a ₹1,20,000 loan for 18 months',
        '6/6 users preferred Variant B — selecting tenure felt easier with EMI and tenure linked; Variant A\'s slider dominated attention and distracted from the loan amount',
        'Iterated to final design: simplified VAS copy with checkmarks as trust cues, moved offer validity date near the EMI figure for contextual relevance, added a gentle nudge when VAS was skipped',
      ],
      outcome: [
        'Estimated ₹496M+ annual revenue increase attributed to UX improvements',
        'CTR increased by 3% — primary KPI hit',
        'VAS adoption improved by 5% — secondary KPI hit',
        'Eliminated "EMI" vs "Monthly Instalment" confusion by standardising terminology across the flow',
        'VAS retained per compliance/legal requirement but repositioned as a trust element rather than a friction point',
      ],
      learnings: 'The biggest unlock wasn\'t from user testing — it was the telesales call centre visit. Agents were converting hesitant users by reframing the cost as "just ₹9/day" rather than a monthly figure. That single insight, brought into the digital experience, had an outsized impact on VAS adoption. Sometimes the best UX research happens away from a screen.',
      image: null,
      imageAlt: 'EMI Calculator redesign — before and after screens',
      visual: `<div class="mb-visual-label">A/B Variant Testing · 6 Users</div>
        <div class="mb-emi-variants">
          <div class="mb-emi-var mb-emi-var--a">
            <div class="mb-emi-var-badge">Variant A</div>
            <div class="mb-emi-var-title">Preset EMI combinations</div>
            <div class="mb-emi-var-desc">Reduced choice overload by surfacing fixed EMI–tenure options</div>
            <div class="mb-emi-var-result mb-emi-var-result--reject">0 / 6 preferred</div>
          </div>
          <div class="mb-emi-var mb-emi-var--b">
            <div class="mb-emi-var-badge mb-emi-var-badge--winner">Variant B ✓</div>
            <div class="mb-emi-var-title">Separated tenure selection</div>
            <div class="mb-emi-var-desc">Improved decision clarity by decoupling tenure from EMI calculation</div>
            <div class="mb-emi-var-result mb-emi-var-result--win">6 / 6 preferred</div>
          </div>
        </div>
        <div class="mb-visual-label" style="margin-top:1.75rem">Key Design Decisions</div>
        <div class="mb-emi-decisions">
          <div class="mb-emi-decision">
            <div class="mb-emi-dec-ico">💡</div>
            <div class="mb-emi-dec-body">
              <div class="mb-emi-dec-title">Price reframing</div>
              <div class="mb-emi-dec-sub">"₹9/day only" — insight from telesales agents who used this framing to reduce VAS hesitation</div>
            </div>
          </div>
          <div class="mb-emi-decision">
            <div class="mb-emi-dec-ico">✅</div>
            <div class="mb-emi-dec-body">
              <div class="mb-emi-dec-title">Trust cues on VAS</div>
              <div class="mb-emi-dec-sub">Checkmarks + simplified copy replaced dense legal text; moved checkboxes right for better scannability</div>
            </div>
          </div>
          <div class="mb-emi-decision">
            <div class="mb-emi-dec-ico">⏰</div>
            <div class="mb-emi-dec-body">
              <div class="mb-emi-dec-title">Contextual urgency</div>
              <div class="mb-emi-dec-sub">Offer validity date moved adjacent to the EMI figure — making the deadline feel relevant, not alarming</div>
            </div>
          </div>
        </div>`,
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

    mImg.innerHTML   = p.image
      ? `<div class="card-img-inner card-img-photo" style="height:100%"><img src="${p.image}" alt="${p.imageAlt || ''}" style="width:100%;height:100%;object-fit:contain;object-position:center;border-radius:10px;"></div>`
      : `<div class="card-img-inner ${p.grad}" style="width:100%;height:100%"></div>`;
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

      ${p.visual ? `<div class="mb-full mb-visual">${p.visual}</div>` : ''}

      <div class="mb-full">
        <div class="mb-title">01 · Context &amp; Problem</div>
        <div class="mb-text">${p.problem}</div>
      </div>

      <div class="mb-full">
        <div class="mb-title">02 · Research</div>
        <div class="mb-steps">
          ${p.research.map((s, i) => `
            <div class="mb-step">
              <div class="mb-step-track">
                <div class="mb-step-n">${String(i + 1).padStart(2, '0')}</div>
                ${i < p.research.length - 1 ? '<div class="mb-step-line"></div>' : ''}
              </div>
              <div class="mb-step-text">${s}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="mb-full">
        <div class="mb-title">03 · Insights</div>
        <div class="mb-insight-cards">
          ${p.insights.map(s => `
            <div class="mb-insight-card">
              <svg class="mb-insight-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="6" r="3.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M6 11h4M6.5 13h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <p>${s}</p>
            </div>`).join('')}
        </div>
      </div>

      <div class="mb-full">
        <div class="mb-title">04 · Approach &amp; Decisions</div>
        <div class="mb-flow">
          ${p.approach.map((s, i) => `
            <div class="mb-flow-step">
              <div class="mb-flow-track">
                <div class="mb-flow-n">${i + 1}</div>
                ${i < p.approach.length - 1 ? '<div class="mb-flow-line"></div>' : ''}
              </div>
              <div class="mb-flow-text">${s}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="modal-outcome mb-full">
        <div class="mb-title">05 · Outcomes</div>
        <div class="mb-outcome-grid">
          ${p.outcomes.map(s => `
            <div class="mb-outcome-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" class="mb-outcome-check">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.3"/>
                <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>${s}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="mb-full modal-reflection">
        <div class="mb-title">06 · Reflection</div>
        <div class="mb-text">${p.learnings}</div>
      </div>

      ${p.link ? `<div class="mb-full" style="padding-top:.5rem">
        <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="modal-read-link">
          Read full case study on Medium
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 11L11 2M11 2H5M11 2V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </a>
      </div>` : ''}`;

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

/* ─── NAV RESUME — hide while hero is visible ─── */
(function () {
  const heroSection = document.getElementById('home');
  const resumeLi    = document.getElementById('nav-resume-li');
  if (!heroSection || !resumeLi) return;

  function updateResumeVisibility() {
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    // Hide Resume link while any part of hero is still on screen
    resumeLi.classList.toggle('hidden', heroBottom > 0);
  }

  updateResumeVisibility();
  window.addEventListener('scroll', updateResumeVisibility, { passive: true });
})();
