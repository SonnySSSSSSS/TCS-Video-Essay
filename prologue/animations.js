(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─────────────────────────────────────────────
// STARS — populate #cStars with random circles
// ─────────────────────────────────────────────
function generateStars() {
  const ns = "http://www.w3.org/2000/svg";
  const group = document.querySelector("#cStars");
  const count = 82;

  // Pseudo-random seeded layout so it looks intentional
  const rx = [
    0.08, 0.76, 0.22, 0.91, 0.44, 0.13, 0.68, 0.37, 0.55, 0.82,
    0.29, 0.60, 0.05, 0.94, 0.48, 0.17, 0.73, 0.32, 0.87, 0.11,
    0.50, 0.65, 0.03, 0.78, 0.41, 0.56, 0.19, 0.84, 0.27, 0.70,
    0.39, 0.62, 0.14, 0.97, 0.25, 0.53, 0.08, 0.80, 0.35, 0.58,
    0.72, 0.16, 0.89, 0.43, 0.04, 0.67, 0.31, 0.76, 0.20, 0.93,
    0.47, 0.12, 0.85, 0.38, 0.61, 0.07, 0.74, 0.29, 0.52, 0.95,
    0.18, 0.83, 0.46, 0.09, 0.71, 0.34, 0.57, 0.23, 0.88, 0.41,
    0.64, 0.02, 0.79, 0.26, 0.51, 0.96, 0.15, 0.68, 0.33, 0.86,
    0.24, 0.59
  ];
  const ry = [
    0.14, 0.72, 0.38, 0.91, 0.05, 0.60, 0.27, 0.83, 0.46, 0.19,
    0.75, 0.32, 0.88, 0.11, 0.54, 0.69, 0.22, 0.97, 0.43, 0.07,
    0.81, 0.36, 0.63, 0.18, 0.52, 0.94, 0.29, 0.76, 0.41, 0.15,
    0.70, 0.58, 0.03, 0.87, 0.24, 0.50, 0.78, 0.12, 0.67, 0.34,
    0.92, 0.48, 0.09, 0.73, 0.26, 0.85, 0.39, 0.64, 0.17, 0.55,
    0.80, 0.31, 0.96, 0.42, 0.06, 0.71, 0.25, 0.58, 0.89, 0.13,
    0.44, 0.77, 0.20, 0.53, 0.98, 0.35, 0.62, 0.08, 0.47, 0.84,
    0.29, 0.66, 0.11, 0.90, 0.37, 0.74, 0.19, 0.56, 0.82, 0.23,
    0.68, 0.95
  ];

  for (let i = 0; i < count; i++) {
    const c = document.createElementNS(ns, "circle");
    const r = 0.35 + (rx[i] * 1.55);          // 0.35–1.9
    const op = 0.22 + (ry[i] * 0.68);         // 0.22–0.9
    c.setAttribute("cx", (rx[i] * 390).toFixed(1));
    c.setAttribute("cy", (ry[i] * 844).toFixed(1));
    c.setAttribute("r",  r.toFixed(2));
    c.setAttribute("fill", "white");
    c.setAttribute("opacity", op.toFixed(2));
    c.dataset.baseOp = op;
    group.appendChild(c);
  }
}

// Gentle twinkle (non-scroll, runs always)
function twinkleStars() {
  gsap.utils.toArray("#cStars circle").forEach((star, i) => {
    const base = parseFloat(star.dataset.baseOp);
    gsap.to(star, {
      opacity: Math.max(0.06, base - 0.38 + (i % 5) * 0.08),
      duration: 1.2 + (i % 7) * 0.45,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: (i % 13) * 0.22
    });
  });
}

// ─────────────────────────────────────────────
// STROKE DRAWING SETUP
// ─────────────────────────────────────────────
function setupStroke(paths) {
  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
}

// ─────────────────────────────────────────────
// STOP-MOTION JITTER (warm/parchment sections)
// ─────────────────────────────────────────────
function addJitter(turbEl, targets, intensity = 3.5) {
  const seeds = [9, 14, 7, 22, 11, 5, 18, 3, 16, 8, 25, 12, 2, 19, 6];
  let si = 0;
  return gsap.ticker.add(() => {
    si = (si + 1) % seeds.length;
    if (turbEl) turbEl.setAttribute("seed", seeds[si]);
    targets.forEach((el) => {
      gsap.set(el, {
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity,
        rotation: (Math.random() - 0.5) * 0.7
      });
    });
  });
}

// ─────────────────────────────────────────────
// NARRATION HELPER — fade a text block in then out
// within a scrubbed timeline (durations are % units)
// ─────────────────────────────────────────────
function narr(tl, id, inAt, outAt, inDur = 4, outDur = 4, riseY = 10) {
  const el = document.querySelector(id);
  if (!el) return;
  tl.fromTo(el,
    { opacity: 0, y: riseY },
    { opacity: 1, y: 0, duration: inDur, ease: "power1.out" },
    inAt
  ).to(el,
    { opacity: 0, duration: outDur, ease: "power1.in" },
    outAt
  );
}

// ─────────────────────────────────────────────
// STAGE 1 — COSMOS
// Total scroll: 600vh → timeline duration 100
// ─────────────────────────────────────────────
function setupCosmos() {
  const ctl = gsap.timeline({
    scrollTrigger: {
      trigger: "#cosmos-shell",
      start: "top top",
      end: "+=600%",
      scrub: 1.4,
      pin: "#cosmos-stage",
      anticipatePin: 1,
      invalidateOnRefresh: true
    },
    defaults: { ease: "sine.inOut" }
  });

  // 0–8 : singularity pulses into view with gravitational authority
  ctl
    .fromTo("#cSing",
      { scale: 0.2, transformOrigin: "50% 50%" },
      { scale: 1, duration: 7, ease: "power2.out" }, 0)
    .fromTo("#cSingHalo",
      { scale: 0, opacity: 0, transformOrigin: "50% 50%" },
      { scale: 1, opacity: 0.85, duration: 9, ease: "power1.out" }, 0);

  // narration: Śūnyatā (enters 0, exits 13–14)
  narr(ctl, "#n-sunyata", 0, 14, 6, 5);

  // 10–26 : eyelids open, stars revealed — separated for clarity
  ctl
    .to("#cUpperLid", { y: -520, duration: 18, ease: "power2.inOut" }, 10)
    .to("#cLowerLid", { y: 520,  duration: 18, ease: "power2.inOut" }, 10, "<")
    .to("#cStars",    { opacity: 1, duration: 12, ease: "power2.out" }, 10);

  narr(ctl, "#n-awareness", 15, 28, 5, 5);

  // 20–34 : nebulae bloom, singularity fades as eyes open (overlap for continuity)
  ctl
    .to("#cNebulaA", { opacity: 0.88, duration: 11, ease: "sine.inOut" }, 20)
    .to("#cNebulaB", { opacity: 0.70, duration: 11, ease: "sine.inOut" }, 23)
    .to("#cSingHalo", { opacity: 0, duration: 9, ease: "power2.in" }, 22)
    .to("#cSing",     { opacity: 0, duration: 7, ease: "power2.in" }, 25);

  narr(ctl, "#n-what-see", 28, 36, 4, 4);

  // 33–50 : galaxies form with purposeful fade-in
  ctl
    .to("#cGalaxy", { opacity: 1, duration: 12, ease: "power2.out" }, 33);

  narr(ctl, "#n-logos", 37, 52, 5, 6);

  // 46–60 : zoom rings expand — sense of acceleration through space
  ctl
    .to("#cZoomRings", { opacity: 0.7, duration: 5, ease: "power1.out" }, 46)
    .to("#cZoomRings", { scale: 5.5, opacity: 0, transformOrigin: "50% 50%", duration: 13, ease: "power2.in" }, 48)
    .to("#cGalaxy",    { scale: 3.8, opacity: 0.25, transformOrigin: "50% 50%", duration: 14, ease: "sine.inOut" }, 48, "<")
    .to("#cNebulaA",   { opacity: 0.18, scale: 0.55, transformOrigin: "50% 50%", duration: 12, ease: "sine.inOut" }, 48, "<");

  narr(ctl, "#n-kalpas", 52, 66, 5, 5);

  // 58–72 : Earth appears, cosmos fades with grace
  ctl
    .to("#cGalaxy",  { opacity: 0, duration: 8, ease: "power2.in" }, 58)
    .to("#cNebulaA", { opacity: 0, duration: 8, ease: "power2.in" }, 58, "<")
    .to("#cNebulaB", { opacity: 0, duration: 8, ease: "power2.in" }, 58, "<")
    .to("#cEarth",   { opacity: 1, duration: 10, ease: "power2.out" }, 58);

  narr(ctl, "#n-blue-planet", 65, 76, 5, 5);

  // 68–80 : Vietnam geography reveals itself
  ctl.to("#cGeo", { opacity: 1, duration: 8, ease: "power2.out" }, 70)
     .to("#cHueLabel", { opacity: 1, duration: 4, ease: "power2.out" }, 75);

  narr(ctl, "#n-hue", 76, 86, 4, 5);

  // 80–100 : cosmic eyelids close, warmth enters, TCS eyes emerge
  ctl
    .to("#cUpperLid", { y: 0, duration: 9, ease: "power2.inOut" }, 82)
    .to("#cLowerLid", { y: 0, duration: 9, ease: "power2.inOut" }, 82, "<")
    .to("#cEarth",    { opacity: 0, duration: 7, ease: "power2.in" }, 82)
    .to("#cGeo",      { opacity: 0, duration: 7, ease: "power2.in" }, 82, "<")
    .to("#cStars",    { opacity: 0.12, duration: 10, ease: "sine.inOut" }, 82)
    // background transitions to warm parchment with intention
    .to("#cBg",       { attr: { fill: "#f5f1e8" }, duration: 12, ease: "sine.inOut" }, 84)
    .to("#cWarmVig",  { opacity: 1, duration: 10, ease: "power2.out" }, 84)
    // lids re-open to reveal TCS human eyes — moment of mirror
    .to("#cUpperLid", { y: -520, duration: 10, ease: "power2.out" }, 88)
    .to("#cLowerLid", { y: 520,  duration: 10, ease: "power2.out" }, 88, "<")
    .to("#cHumanEyes",{ opacity: 1, duration: 8, ease: "power2.out" }, 90)
    .to("#cStars",    { opacity: 0, duration: 8, ease: "power2.in" }, 90);

  narr(ctl, "#n-born", 90, 102, 5, 5);
}

// ─────────────────────────────────────────────
// STAGE 2 — TCS EYES + CAROUSEL
//
// PASS 1 (t=8–50): 6 life-image icons scroll right→left below the eyes.
//   Eyes track each item via iris cx attribute animation.
//   Items exit off-screen left; no strawberries yet.
//
// PASS 2 (t=62–96): Carousel resets off-screen right.
//   Same items now revealed as strawberries and scroll through again.
//   Eyes track again.
//
// Iris tracking uses attr.cx so there are zero CSS-transform conflicts
// with the SVG filter on #eFace.
// Total scroll: 320vh → duration 100
// ─────────────────────────────────────────────
function setupEyes() {
  const icons = gsap.utils.toArray(".eIcon");
  const sbs   = gsap.utils.toArray(".eSb");

  // Push carousel off-screen immediately (before ScrollTrigger activates)
  // so icons don't flash at x=0 on page load
  gsap.set("#eCarousel", { x: 440 });

  const etl = gsap.timeline({
    scrollTrigger: {
      trigger: "#eyes-shell",
      start: "top top",
      end: "+=320%",
      scrub: 1.2,
      pin: "#eyes-stage",
      anticipatePin: 1,
      invalidateOnRefresh: true
    },
    defaults: { ease: "sine.inOut" }
  });

  // ── Geometry ──────────────────────────────────────────────────────────
  const SPACING = 120;   // px between icons in local carousel space
  const START_X = 440;   // carousel x that puts first item just off-screen right
  const END_X   = -700;  // carousel x that puts last item just off-screen left
  const TOTAL   = START_X - END_X;  // 1140

  // Iris base cx values and max tracking range
  const L_BASE = 120, R_BASE = 268;
  const I_MAX  = 10;  // max iris shift (px)

  // ── Face: always visible during this stage (instant fade-in at start) ──
  etl.fromTo("#eFace", { opacity: 0 }, { opacity: 1, duration: 1, ease: "none" }, 0);

  narr(etl, "#n-saw-sb", 3, 20, 4, 4);

  // ── PASS 1: icons (t=8..50, duration=42) ─────────────────────────────
  const P1 = 8, P1D = 42;

  // Keep carousel off-screen right from t=0; fromTo drives pass 1 from t=8
  etl.set("#eCarousel", { x: START_X }, 0);
  etl.fromTo("#eCarousel",
    { x: START_X }, { x: END_X, duration: P1D, ease: "none" },
    P1);

  // When each icon crosses screen centre (carousel x = 195 − i×SPACING)
  const ct1 = icons.map((_, i) =>
    P1 + (START_X - (195 - i * SPACING)) / TOTAL * P1D
  );
  // ≈ [17.0, 21.4, 25.7, 30.1, 34.5, 38.8]

  // Iris tracking: right-to-centre-to-left sweep for each item
  ct1.forEach((ct, i) => {
    // Approach: iris sweeps toward centre
    etl.to("#eLeftIris",  { attr: { cx: L_BASE        }, duration: 2.5, ease: "power1.out" }, ct - 2.5);
    etl.to("#eRightIris", { attr: { cx: R_BASE        }, duration: 2.5, ease: "power1.out" }, ct - 2.5);
    // Follow: iris trails item left
    etl.to("#eLeftIris",  { attr: { cx: L_BASE-I_MAX  }, duration: 2,   ease: "power1.in"  }, ct + 0.5);
    etl.to("#eRightIris", { attr: { cx: R_BASE-I_MAX  }, duration: 2,   ease: "power1.in"  }, ct + 0.5);
    // Snap right ready for next item (skip on last)
    if (i < icons.length - 1) {
      etl.to("#eLeftIris",  { attr: { cx: L_BASE+I_MAX }, duration: 1.5, ease: "power2.out" }, ct + 2.5);
      etl.to("#eRightIris", { attr: { cx: R_BASE+I_MAX }, duration: 1.5, ease: "power2.out" }, ct + 2.5);
    }
  });

  // ── Narration between passes ──────────────────────────────────────────
  narr(etl, "#n-not-just", 50, 66, 4, 5);

  // ── PASS 2: icons morph into strawberries (t=62..96, duration=34) ──────
  const P2 = 62, P2D = 34;

  // Reset state: icons visible, strawberries hidden, iris primed right
  etl.set(icons,         { opacity: 1 }, P2);
  etl.set(sbs,           { opacity: 0 }, P2);
  etl.set("#eLeftIris",  { attr: { cx: L_BASE + I_MAX } }, P2);
  etl.set("#eRightIris", { attr: { cx: R_BASE + I_MAX } }, P2);

  // fromTo "from" value re-positions carousel to START_X at pass-2 start (scrub-safe)
  etl.fromTo("#eCarousel",
    { x: START_X }, { x: END_X, duration: P2D, ease: "none" },
    P2);

  const ct2 = icons.map((_, i) =>
    P2 + (START_X - (195 - i * SPACING)) / TOTAL * P2D
  );

  // Iris tracking + morph: each icon fades out and its strawberry fades in
  // shortly AFTER it passes the face centre
  ct2.forEach((ct, i) => {
    // Iris tracking (same pattern as pass 1)
    etl.to("#eLeftIris",  { attr: { cx: L_BASE        }, duration: 2.5, ease: "power1.out" }, ct - 2.5);
    etl.to("#eRightIris", { attr: { cx: R_BASE        }, duration: 2.5, ease: "power1.out" }, ct - 2.5);
    etl.to("#eLeftIris",  { attr: { cx: L_BASE-I_MAX  }, duration: 2,   ease: "power1.in"  }, ct + 0.5);
    etl.to("#eRightIris", { attr: { cx: R_BASE-I_MAX  }, duration: 2,   ease: "power1.in"  }, ct + 0.5);
    if (i < icons.length - 1) {
      etl.to("#eLeftIris",  { attr: { cx: L_BASE+I_MAX }, duration: 1.5, ease: "power2.out" }, ct + 2.5);
      etl.to("#eRightIris", { attr: { cx: R_BASE+I_MAX }, duration: 1.5, ease: "power2.out" }, ct + 2.5);
    }
    // Morph: icon fades out, strawberry blooms in — triggered after crossing centre
    const morphAt = ct + 1.5;
    etl.to(icons[i], { opacity: 0, duration: 2.5, ease: "power2.in"  }, morphAt);
    etl.fromTo(sbs[i],
      { opacity: 0 },
      { opacity: 1, duration: 3,   ease: "power2.out" },
      morphAt + 1
    );
  });

  // ── Final narration ───────────────────────────────────────────────────
  narr(etl, "#n-why", 90, 104, 4, 5);
}

// ─────────────────────────────────────────────
// STAGE 3 — ZEN PARABLE
// Total scroll: 400vh → duration 100
// ─────────────────────────────────────────────
function setupParable() {
  const ptl = gsap.timeline({
    scrollTrigger: {
      trigger: "#parable-shell",
      start: "top top",
      end: "+=400%",
      scrub: 1.2,
      pin: "#parable-stage",
      anticipatePin: 1,
      invalidateOnRefresh: true
    },
    defaults: { ease: "sine.inOut" }
  });

  narr(ptl, "#n-parable-intro", 0, 16, 5, 5);

  // 8–28 : man running + tiger chasing (with buildup)
  ptl
    .to("#pManRun",     { opacity: 1, duration: 6, ease: "power2.out" }, 8)
    .to("#pTigerChase", { opacity: 1, duration: 6, ease: "power2.out" }, 11);

  narr(ptl, "#n-parable-tiger", 14, 30, 5, 5);

  // 24–40 : vine appears + man transitions (clear staging)
  ptl
    .to("#pVine",       { opacity: 1, duration: 6, ease: "power2.out" }, 24)
    .to("#pManRun",     { opacity: 0, duration: 4, ease: "power2.in" }, 26)
    .to("#pTigerChase", { opacity: 0, duration: 4, ease: "power2.in" }, 26, "<")
    .to("#pManHang",    { opacity: 1, duration: 5, ease: "power2.out" }, 28)
    .to("#pTigerAbove", { opacity: 1, duration: 5, ease: "power2.out" }, 30);

  narr(ptl, "#n-parable-vine", 26, 44, 5, 5);

  // 38–54 : tiger below + mice appear (predator/prey rhythm)
  ptl
    .to("#pTigerBelow", { opacity: 1, duration: 6, ease: "power2.out" }, 38)
    .to("#pMice",       { opacity: 1, duration: 6, ease: "power2.out" }, 42);

  narr(ptl, "#n-parable-mice", 40, 60, 5, 6);

  // 52–68 : strawberry appears (relief moment)
  ptl.to("#pStrawberry", { opacity: 1, duration: 7, ease: "power3.out" }, 52);

  narr(ptl, "#n-parable-berry", 56, 74, 5, 6);

  // 68–90 : close-up tasting (intimate focus)
  ptl
    .to("#pTasting", { opacity: 1, duration: 10, ease: "power2.out" }, 68);

  narr(ptl, "#n-parable-sweet", 74, 104, 5, 7);

  // 88–100 : close-up holds, then fade out (bridge prep)
  ptl.to("#pTasting", { opacity: 0.88, duration: 12, ease: "sine.inOut" }, 88);
}

// ─────────────────────────────────────────────
// STAGE 4 — BRIDGE
// Total scroll: 250vh → duration 100
// ─────────────────────────────────────────────
function setupBridge() {
  const tears  = gsap.utils.toArray(".bTear");
  const rivers = gsap.utils.toArray(".bRiver");

  setupStroke(tears);
  setupStroke(rivers);

  const btl = gsap.timeline({
    scrollTrigger: {
      trigger: "#bridge-shell",
      start: "top top",
      end: "+=250%",
      scrub: 1.2,
      pin: "#bridge-stage",
      anticipatePin: 1,
      invalidateOnRefresh: true
    },
    defaults: { ease: "sine.inOut" }
  });

  // 0–12 : flash images (memory/grief flicker)
  btl
    .to("#bFlash", { opacity: 1, duration: 1.2, ease: "power1.out" }, 0)
    .to("#bFlash", { opacity: 0, duration: 2.5, ease: "power1.in" }, 3)
    .to("#bFlash", { opacity: 0.85, duration: 1, ease: "power1.out" }, 7)
    .to("#bFlash", { opacity: 0, duration: 3, ease: "power1.in" }, 9);

  narr(btl, "#n-tcs-way", 0, 22, 6, 5);

  // 16–26 : pupils fill with tears (emotional swell)
  btl
    .to("#bLeftPupil, #bRightPupil",
      { scaleY: 1.2, scaleX: 1.08, transformOrigin: "50% 50%", duration: 7, ease: "power2.inOut" }, 16);

  narr(btl, "#n-tigers", 24, 54, 5, 6);

  // 26–50 : tears draw with grace (staggered to create flow)
  btl.to("#bTearLayer", { opacity: 0.96, duration: 5, ease: "power1.out" }, 26);
  tears.forEach((t, i) => {
    btl.to(t, { strokeDashoffset: 0, duration: 16, ease: "power2.inOut" }, 26 + i * 1.8);
  });

  // 48–64 : pool forms (resolve before rivers take focus)
  btl.fromTo("#bPoolGroup",
    { scale: 0.08, opacity: 0, transformOrigin: "50% 50%" },
    { scale: 1, opacity: 1, duration: 12, ease: "elastic.out" }, 48);

  narr(btl, "#n-art-born", 52, 85, 5, 7);

  // 58–76 : eye system recedes gracefully (tears fade shortly after)
  btl
    .to("#bEyeSystem",  { y: -90, scale: 0.72, opacity: 0.15, transformOrigin: "50% 50%", duration: 18, ease: "power2.in" }, 58)
    .to("#bTearLayer",  { opacity: 0.22, duration: 14, ease: "sine.inOut" }, 62);

  // 66–105 : rivers draw (flow with momentum, staggered for narrative arc)
  btl.to("#bRiverLayer", { opacity: 1, y: 0, duration: 9, ease: "power2.out" }, 66);
  rivers.forEach((r, i) => {
    btl.to(r, { strokeDashoffset: 0, duration: 24, ease: "power2.inOut" }, 68 + i * 2.6);
  });

  // River narration 1: "From his grief – rivers." (fires as rivers start drawing)
  narr(btl, "#n-river-born", 72, 90, 5, 6);

  // River narration 2: Five song titles (fires as later rivers draw in)
  narr(btl, "#n-song-titles", 84, 102, 5, 6);

  // 95–105 : pool scales up (final crescendo matching scene-1 transition)
  btl.to("#bPoolGroup",
    { scale: 3.4, transformOrigin: "50% 50%", duration: 11, ease: "power2.out" }, 93);
}

// ─────────────────────────────────────────────
// STAGE 5 — TWO RIVERS
// Two river clusters draw in from top; labels & narration introduce
// the Love / Death duality in Trịnh Công Sơn's music.
// Total scroll: 300vh → duration 100
// ─────────────────────────────────────────────
function setupRivers() {
  const rRivers = gsap.utils.toArray(".rRiver");
  setupStroke(rRivers);

  const rtl = gsap.timeline({
    scrollTrigger: {
      trigger: "#rivers-shell",
      start: "top top",
      end: "+=300%",
      scrub: 1.2,
      pin: "#rivers-stage",
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onLeave: () => {
        if (window.Scene2 && typeof window.Scene2.activate === 'function') {
          window.Scene2.activate();
        }
      }
    },
    defaults: { ease: "sine.inOut" }
  });

  // 0–8 : both river groups fade in simultaneously
  rtl
    .fromTo("#rRiverLeft",  { opacity: 0 }, { opacity: 1, duration: 5, ease: "power2.out" }, 0)
    .fromTo("#rRiverRight", { opacity: 0 }, { opacity: 1, duration: 5, ease: "power2.out" }, 2);

  // 0–36 : paths draw from top to bottom (4 paths, slight stagger)
  rRivers.forEach((r, i) => {
    rtl.to(r, { strokeDashoffset: 0, duration: 30, ease: "power2.inOut" }, i * 2);
  });

  // 4–24 : first beat — "Two rivers."
  narr(rtl, "#n-two-rivers", 4, 24, 4, 4);

  // 34–56 : river labels appear (love left, death right)
  rtl
    .to("#rl-love",  { opacity: 1, duration: 7, ease: "power2.out" }, 34)
    .to("#rl-death", { opacity: 1, duration: 7, ease: "power2.out" }, 37);

  // 38–62 : second beat — names the rivers
  narr(rtl, "#n-rivers-named", 38, 62, 5, 5);

  // 65–90 : labels fade — third beat — the unifying truth
  rtl
    .to("#rl-love",  { opacity: 0, duration: 5, ease: "power1.in" }, 64)
    .to("#rl-death", { opacity: 0, duration: 5, ease: "power1.in" }, 64);

  narr(rtl, "#n-rivers-same", 66, 96, 5, 6);
}

// ─────────────────────────────────────────────
// WARM-SECTION JITTER (eyes + bridge)
// ─────────────────────────────────────────────
function setupJitter() {
  gsap.ticker.fps(12);

  addJitter(
    document.querySelector("#eBrushTurb"),
    [document.querySelector("#eFace")],
    3.5
  );
  addJitter(
    document.querySelector("#bBrushTurb"),
    [document.querySelector("#bEyeSystem")],
    3.5
  );
  addJitter(
    document.querySelector("#pBrushTurb"),
    [],   // parable has enough static filter distortion
    0
  );
  addJitter(
    document.querySelector("#rBrushTurb"),
    [],   // rivers: jitter the filter seed for hand-drawn feel, no element shift
    0
  );
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
function init() {
  generateStars();

  if (prefersReducedMotion) {
    // Static fallback: show everything at final state
    gsap.set([
      "#cStars", "#cNebulaA", "#cNebulaB", "#cGalaxy",
      "#cEarth", "#cGeo", "#cHueLabel", "#cHumanEyes"
    ], { opacity: 1 });
    gsap.set(["#cUpperLid", "#cLowerLid"], { display: "none" });
    gsap.set(".eIcon", { opacity: 1 });
    gsap.set(".bTear",  { strokeDashoffset: 0 });
    gsap.set(".bRiver", { strokeDashoffset: 0 });
    gsap.set(".rRiver", { strokeDashoffset: 0 });
    gsap.set(["#rRiverLeft", "#rRiverRight", "#rl-love", "#rl-death"], { opacity: 1 });
    gsap.set([
      "#bTearLayer", "#bPoolGroup", "#bRiverLayer",
      "#n-sunyata", "#n-awareness", "#n-logos", "#n-born",
      "#n-saw-sb", "#n-why", "#n-tigers", "#n-art-born",
      "#n-river-born", "#n-song-titles"
    ], { opacity: 1 });
    return;
  }

  twinkleStars();
  setupJitter();
  setupCosmos();
  setupEyes();
  setupParable();
  setupBridge();
  setupRivers();
}

  window.addEventListener("load", init);
})();
