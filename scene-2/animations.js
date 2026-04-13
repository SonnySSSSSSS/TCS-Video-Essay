// scene-2/animations.js
// Branching Rivers — state machine + GSAP animations

(function () {
  'use strict';

  let eventsBound = false;
  let isActivated = false;

// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  currentScreen: 's-intermission',
  completed:     new Set()   // completed path IDs
};

const PATH_META = {
  love:  { label: 'LOVE',                  viet: 'Tình Yêu'               },
  death: { label: 'DEATH & IMPERMANENCE',  viet: 'Cái Chết & Vô Thường'  }
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function setupStroke(paths) {
  paths.forEach(p => {
    try {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    } catch (e) { /* non-stroked element, skip */ }
  });
}

function showScreen(newId, onComplete, dir) {
  if (dir === undefined) dir = 0;
  if (state.currentScreen === newId) { if (onComplete) onComplete(); return; }

  const oldEl = document.getElementById(state.currentScreen);
  const newEl = document.getElementById(newId);

  // Reset scroll position on path screens before revealing
  const scrollMap = {
    's-love':        'love-scroll',
    's-death':        'death-scroll',
    's-convergence':  's-convergence'
  };
  const scrollId = scrollMap[newId];
  if (scrollId) {
    const el = document.getElementById(scrollId);
    if (el) el.scrollTop = 0;
  }

  // dir: +1 = descend into path (old exits up, new enters from below)
  //      -1 = rise back to river (old exits down, new enters from above)
  //       0 = pure crossfade
  const outY = dir * -22;
  const inY  = dir *  22;

  gsap.to(oldEl, {
    opacity: 0, y: outY, duration: 0.55, ease: 'power2.in',
    onComplete() {
      gsap.set(oldEl, { y: 0 });
      oldEl.classList.remove('active');
      state.currentScreen = newId;
      newEl.classList.add('active');
      gsap.fromTo(newEl,
        { opacity: 0, y: inY },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', onComplete: onComplete || null }
      );
    }
  });
}

function updateDots() {
  document.querySelectorAll('.progress-dot').forEach(dot => {
    if (state.completed.has(dot.dataset.path)) dot.classList.add('done');
  });
  if (state.completed.size === 1) {
    document.getElementById('progress-dots').classList.add('visible');
  }
}

// ─── FORK CHOICE REVEAL ─────────────────────────────────────────────────────
// Called after the intermission transitions to s-intro.
// Shows rivers, labels, and fork buttons immediately — no scrolling needed.
function showForkChoice() {
  gsap.set(['#iLeft', '#iRight', '#iSignL', '#iSignR'],
    { opacity: 1, clearProps: 'scale,y' });
  gsap.set('#intro-narr', { opacity: 1, clearProps: 'y' });
  gsap.fromTo('#intro-fork-btns',
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.9, delay: 0.4, ease: 'power2.out' }
  );
  document.getElementById('intro-fork-btns').classList.add('ready');
}

// ─── FORK 1 ──────────────────────────────────────────────────────────────────
function handleFork1(path) {
  showScreen('s-' + path, null, 1); // 1 = descend into the path
}

// ─── PATH COMPLETION ─────────────────────────────────────────────────────────
function completePath(path) {
  state.completed.add(path);
  updateDots();

  // Two-path model: love + death. Convergence fires once both are done.
  if (state.completed.has('love') && state.completed.has('death')) {
    showScreen('s-convergence', setupConvergence, -1);
  } else {
    setupFork2();
    showScreen('s-fork2', null, -1);
  }
}

// ─── INTERMISSION ────────────────────────────────────────────────────────────
// Spy Hunter scene: two parallel rivers flow past vegetation, then converge.
// Plays automatically after the prologue.
function runIntermission(onDone) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(['#intmParL', '#intmParR', '#intmMerged', '#intm-n1', '#intm-n2'], { opacity: 1 });
    setTimeout(onDone, 2000);
    return;
  }

  // Reset state
  gsap.set('#intmWorld', { y: 0 });
  gsap.set(['#intmParL', '#intmParR'], { x: 0, opacity: 1 });
  gsap.set('#intmMerged', { opacity: 0 });
  gsap.set(['#intm-n1', '#intm-n2'], { opacity: 0, y: 12 });

  // ─── Spy Hunter scroll: world moves up, creating forward-travel illusion ──
  const worldTween = gsap.to('#intmWorld', {
    y: -844,
    duration: 5,
    ease: 'none',
    repeat: -1
  });

  // Guard: only advance once, whichever timer fires first
  let advanced = false;
  const advance = () => {
    if (advanced) return;
    advanced = true;
    worldTween.kill();
    onDone();
  };

  // ─── Narration 1: "The rivers ran beside each other / for a while." ────────
  gsap.to('#intm-n1', { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 1.2 });
  gsap.to('#intm-n1', { opacity: 0,        duration: 1.0, ease: 'power2.in',  delay: 5.5 });

  // ─── Slow world scroll to a stop ─────────────────────────────────────────
  gsap.delayedCall(5.8, () => {
    gsap.to(worldTween, { timeScale: 0, duration: 1.5, ease: 'power3.out' });
  });

  // ─── Rivers converge toward centre ───────────────────────────────────────
  gsap.to('#intmParL', { x:  77, duration: 2.5, ease: 'power2.inOut', delay: 7.5 });
  gsap.to('#intmParR', { x: -77, duration: 2.5, ease: 'power2.inOut', delay: 7.5 });

  // ─── Merged river fades in, parallels fade out ────────────────────────────
  gsap.to('#intmMerged', { opacity: 1, duration: 2.0, ease: 'power2.out', delay: 9.0 });
  gsap.to(['#intmParL', '#intmParR'], { opacity: 0, duration: 1.2, ease: 'power2.in', delay: 9.2 });

  // ─── Narration 2: "They were always the same water." ─────────────────────
  gsap.to('#intm-n2', { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 9.8 });

  // ─── Fade out n2 and auto-advance to the next screen after 13 s ────────────
  gsap.to('#intm-n2', { opacity: 0, duration: 1.2, ease: 'power2.in', delay: 11.5 });
  gsap.delayedCall(13, advance);
  setTimeout(advance, 13500); // fallback if gsap.delayedCall is throttled
}

// ─── FORK 2 SETUP ────────────────────────────────────────────────────────────
// After completing one path, show the remaining path.
function setupFork2() {
  // Remaining path is whichever of love/death wasn't yet completed
  const remaining = state.completed.has('love') ? 'death' : 'love';
  const meta = PATH_META[remaining];

  // Update dynamic sign on the right of the fork SVG
  document.getElementById('f2LabelMain').textContent = meta.label;
  document.getElementById('f2LabelViet').textContent = meta.viet;

  // The 'other' button handles the remaining path; death btn is repurposed for death
  // We use fork2-other-btn for the remaining path regardless of which it is
  document.getElementById('fork2-other-label').textContent = meta.label;
  document.getElementById('fork2-other-viet').textContent  = meta.viet + ' →';
  document.getElementById('fork2-other-btn').dataset.path  = remaining;

  // Hide the death-btn since it's folded into fork2-other-btn when death is remaining
  const deathBtn = document.getElementById('fork2-death-btn');
  deathBtn.style.display = 'none';

  // Note
  document.getElementById('fork2-note').textContent = 'One stream remains.';
}

// ─── CONVERGENCE (scroll-driven) ─────────────────────────────────────────────
function setupConvergence() {
  const panel = document.getElementById('s-convergence');

  // ── Stop-motion jitter: cycle turbulence seed at ~10fps ──────────────────
  // Rapidly changing the seed makes displacements jump between configurations,
  // producing the hand-drawn cel-animation jitter feel.
  let _jSeed = 9;
  setInterval(() => {
    _jSeed = (_jSeed + Math.floor(Math.random() * 4) + 1) % 200;
    const t = document.getElementById('cvBrushTurb');
    if (t) t.setAttribute('seed', String(_jSeed));
  }, 100); // ~10fps

  // ── Displacement scale pulse: ink strokes breathe and ripple ─────────────
  gsap.to('#cvBrushDisp', {
    attr: { scale: 15 },
    duration: 1.6,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });
  // Stroke setup for smile lines
  setupStroke([
    ...document.querySelectorAll('#cvSmile, #cvSmileL, #cvSmileR'),
    ...document.querySelectorAll('#cvOverflowL path, #cvOverflowR path')
  ]);

  // Ensure smile + overflow groups start invisible
  gsap.set(['#cvSmile', '#cvSmileL', '#cvSmileR'], { opacity: 0 });

  // Build timeline — t axis 0–100 (seconds), driven via progress (0–1)
  // This lets us think in "percentage of scroll" naturally.
  const tl = gsap.timeline({ paused: true });

  tl
    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 1 (t 0–18): Y-junction appears — all three rivers converge
    // ══════════════════════════════════════════════════════════════════════════
    .fromTo('#cvRiversIn',
      { opacity: 0 },
      { opacity: 1, duration: 12, ease: 'power2.out' },
      0
    )
    .fromTo('#cvRiverUnited',
      { opacity: 0 },
      { opacity: 1, duration: 10, ease: 'power2.out' },
      8
    )
    // Long flow strands (Phase 2 only) — fill screen during camera travel, gone before dam
    .fromTo('#cvRiverFlow',
      { opacity: 0 },
      { opacity: 1, duration: 10, ease: 'power2.out' },
      8
    )

    // ── Narr 1: "All rivers meet." ────────────────────────────────────────
    .fromTo('#cv-n1',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 6, ease: 'power2.out' },
      14
    )
    .to('#cv-n1', { opacity: 0, duration: 4, ease: 'power2.in' }, 24)

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 2 (t 18–38): Camera follows river — Y-junction exits top
    //   cvWorld y: 0 → -420  (world shifts up; junction leaves; flowing river fills screen)
    //   cvRiversIn fades so the Y-shape disappears cleanly
    // ══════════════════════════════════════════════════════════════════════════
    .to('#cvRiversIn',
      { opacity: 0, duration: 10, ease: 'power2.in' },
      18
    )
    // Long flow strands fade out cleanly before the dam enters (t=40)
    .to('#cvRiverFlow',
      { opacity: 0, duration: 8, ease: 'power2.in' },
      30
    )
    .fromTo('#cvWorld',
      { y: 0 },
      { y: -420, duration: 20, ease: 'power1.inOut' },
      18
    )

    // ── Narr 2 (mid-pan): "Love. Impermanence. Death. The same water." ────
    .fromTo('#cv-n2',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 6, ease: 'power2.out' },
      26
    )
    .to('#cv-n2', { opacity: 0, duration: 5, ease: 'power2.in' }, 36)

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 3 (t 40–56): Dam enters from below — world drifts DOWN to y=+58
    //   Dam rim (SVG y=508) lands at screen-y 566 → lower third of viewport
    //   River still visibly flowing into it from above
    // ══════════════════════════════════════════════════════════════════════════
    .to('#cvWorld',
      { y: 58, duration: 16, ease: 'power2.out' },
      40
    )

    // ── Narr 3: "And what does it all press against?" ────────────────────
    .fromTo('#cv-n3',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 6, ease: 'power2.out' },
      54
    )
    .to('#cv-n3', { opacity: 0, duration: 5, ease: 'power2.in' }, 64)

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 4a (t 62–72): Smile reveals
    // ══════════════════════════════════════════════════════════════════════════
    .to('#cvSmileL',
      { strokeDashoffset: 0, opacity: 1, duration: 8, ease: 'power2.inOut' },
      62
    )
    .to('#cvSmileR',
      { strokeDashoffset: 0, opacity: 1, duration: 8, ease: 'power2.inOut' },
      64
    )
    .to('#cvSmile',
      { strokeDashoffset: 0, opacity: 1, duration: 10, ease: 'power2.inOut' },
      66
    )

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 4b (t 66–78): Water starts filling → camera recenters on dam+river
    //   world y: +58 → -80  (dam rim moves to screen-y ~428, mid-viewport)
    //   Happens simultaneously with fill starting so viewer watches it center
    // ══════════════════════════════════════════════════════════════════════════
    .to('#cvWorld',
      { y: -80, duration: 12, ease: 'power2.inOut' },
      66
    )

    // ── Water rises from below basin (y=602) up to brim (y=452) ─────────
    .fromTo('#cvWaterFill',
      { opacity: 0 },
      { opacity: 1, duration: 6, ease: 'power2.out' },
      66
    )
    .fromTo('#cvWaterRect',
      { attr: { y: 602 } },
      { attr: { y: 452 }, duration: 28, ease: 'power1.inOut' },
      66
    )
    .fromTo('#cvWaterSurface',
      { attr: { y1: 602, y2: 602 } },
      { attr: { y1: 452, y2: 452 }, duration: 28, ease: 'power1.inOut' },
      66
    )

    // ── Narr 4: "A smile." ────────────────────────────────────────────────
    .fromTo('#cv-n4',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 6, ease: 'power2.out' },
      76
    )
    .to('#cv-n4', { opacity: 0, duration: 5, ease: 'power2.in' }, 86)

    // ── Overflow starts — spills over both sides ──────────────────────────
    .to('#cvOverflowL', { opacity: 1, duration: 3, ease: 'power1.out' }, 82)
    .to('#cvOverflowR', { opacity: 1, duration: 3, ease: 'power1.out' }, 84)
    .to('#cvOverflowL path',
      { strokeDashoffset: 0, duration: 12, ease: 'power2.inOut', stagger: 0.8 },
      82
    )
    .to('#cvOverflowR path',
      { strokeDashoffset: 0, duration: 12, ease: 'power2.inOut', stagger: 0.8 },
      85
    )

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 5 (t 90–108): Follow the two overflow streams down
    //   world y: -80 → -260  (overflow mid-stream centers in viewport)
    // ══════════════════════════════════════════════════════════════════════════
    .to('#cvWorld',
      { y: -260, duration: 18, ease: 'power1.inOut' },
      90
    )

    // ── Narr 5: "How sweet it tasted." ───────────────────────────────────
    .fromTo('#cv-n5',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 7, ease: 'power2.out' },
      94
    )
    .to('#cv-n5', { opacity: 0, duration: 6, ease: 'power2.in' }, 104)

    // ── Final text: "Now you see. / What will you taste?" ────────────────
    .fromTo('#cv-final',
      { opacity: 0, y: 18, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 12, ease: 'power2.out' },
      106
    );

  // Drive timeline with the panel's own scroll
  panel.addEventListener('scroll', () => {
    const scrollable = panel.scrollHeight - panel.clientHeight;
    if (scrollable <= 0) return;
    const p = panel.scrollTop / scrollable;
    gsap.to(tl, { progress: p, duration: 0.4, ease: 'none', overwrite: 'auto' });
  });
}

// ─── EVENT BINDING ────────────────────────────────────────────────────────────
function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  // Fork 1 — intro buttons
  document.querySelectorAll('.intro-fork-btn').forEach(btn => {
    btn.addEventListener('click', () => handleFork1(btn.dataset.path));
  });

  // Return buttons from each path
  document.getElementById('love-return-btn').addEventListener('click',
    () => completePath('love'));
  document.getElementById('death-return-btn').addEventListener('click',
    () => completePath('death'));

  // Fork 2 — only the 'other' btn is used (death-btn hidden by setupFork2)
  document.getElementById('fork2-other-btn').addEventListener('click', () => {
    const path = document.getElementById('fork2-other-btn').dataset.path;
    if (path && !state.completed.has(path)) showScreen('s-' + path, null, 1);
  });
}

function revealIntroWithoutMotion() {
  // Skip the intermission opener and jump straight to the fork screen
  document.getElementById('s-intermission').classList.remove('active');
  const introEl = document.getElementById('s-intro');
  introEl.classList.add('active');
  state.currentScreen = 's-intro';

  gsap.set(
    ['#intro-narr', '#intro-fork-btns', '#iLeft', '#iRight', '#iSignL', '#iSignR'],
    { opacity: 1, clearProps: 'transform' }
  );
  document.getElementById('intro-fork-btns').classList.add('ready');
}

function activate() {
  const overlay = document.getElementById('scene2-overlay');
  if (!overlay || isActivated) return;

  isActivated = true;
  bindEvents();

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(overlay, { opacity: 1 });
    revealIntroWithoutMotion();
    return;
  }

  gsap.fromTo(overlay, { opacity: 0 }, {
    opacity: 1,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete: () => runIntermission(() => showScreen('s-intro', showForkChoice, 0))
  });
}

bindEvents();

if (!document.getElementById('scene2-overlay')) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealIntroWithoutMotion();
  } else {
    runIntermission(() => showScreen('s-intro', showForkChoice, 0));
  }
}

window.Scene2 = { activate };
})();
