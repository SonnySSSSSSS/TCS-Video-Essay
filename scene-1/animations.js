(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin, DrawSVGPlugin, ScrollSmoother, SplitText);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scene = {
  svgRoot: document.querySelector("#sceneSvg"),
  eyeSystem: document.querySelector("#eyeSystem"),
  pupils: gsap.utils.toArray("#leftPupil, #rightPupil"),
  nosePaths: gsap.utils.toArray("#nose path"),
  tears: gsap.utils.toArray(".tear"),
  tearLayer: document.querySelector("#tearLayer"),
  poolPosition: document.querySelector("#poolPositionGroup"),
  poolScale: document.querySelector("#poolScaleGroup"),
  poolShape: document.querySelector("#poolShape"),
  ripples: gsap.utils.toArray(".ripple"),
  rivers: gsap.utils.toArray(".river"),
  riverLayer: document.querySelector("#riverLayer"),
  riverLabels: gsap.utils.toArray(".river-label")
};

function maybeAddPoolRoughOverlay() {
  if (!window.rough || !scene.svgRoot || !scene.poolScale) return;
  if (scene.poolScale.querySelector(".pool-rough-overlay")) return;

  const roughSvg = rough.svg(scene.svgRoot);
  const d = scene.poolShape.getAttribute("d");
  const node = roughSvg.path(d, {
    stroke: "#20160d",
    strokeWidth: 1.4,
    roughness: 1.1,
    bowing: 1.6,
    fill: "none"
  });
  node.classList.add("pool-rough-overlay");
  node.setAttribute("pointer-events", "none");
  node.setAttribute("opacity", "0.55");
  scene.poolScale.appendChild(node);
}

function addStopMotionJitter(targets, intensity = 3.5) {
  gsap.ticker.fps(12);

  // Boiling effect: cycle filter seeds each frame so displacement distortion
  // shifts slightly, making every frame look individually hand-drawn.
  const turbulence = document.querySelector("#brushstroke feTurbulence");
  const seeds = [9, 14, 7, 22, 11, 5, 18, 3, 16, 8, 25, 12, 2, 19, 6];
  let seedIndex = 0;

  gsap.ticker.add(() => {
    seedIndex = (seedIndex + 1) % seeds.length;
    if (turbulence) turbulence.setAttribute("seed", seeds[seedIndex]);

    targets.forEach((el) => {
      gsap.set(el, {
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity,
        rotation: (Math.random() - 0.5) * 0.7
      });
    });
  });
}

function runIntro() {
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  tl.from("#frames", { opacity: 0, duration: 0.75, ease: "power2.out" })
    .from("#eyes", { opacity: 0, y: 8, duration: 0.65, ease: "power2.out" }, "<0.2")
    .from("#lids", { opacity: 0, duration: 0.55, ease: "power2.out" }, "<0.1")
    .to(scene.nosePaths, { drawSVG: "100%", duration: 1.1, stagger: 0.12, ease: "power1.inOut" }, 1.4)
    .to(scene.pupils, { scaleY: 0.08, transformOrigin: "50% 50%", duration: 0.14, ease: "none" }, 2.5)
    .to(scene.pupils, { scaleY: 1, duration: 0.18, ease: "back.out" }, 2.64)
    .to(scene.pupils, { scaleY: 0.08, transformOrigin: "50% 50%", duration: 0.14, ease: "none" }, 4.2)
    .to(scene.pupils, { scaleY: 1, duration: 0.18, ease: "back.out" }, 4.34)
    .to(scene.tears, { drawSVG: "100%", duration: 2.8, stagger: 0.12, ease: "power1.inOut" }, 5.5)
    .to(scene.tears, { stroke: "#5f5a52", opacity: 0.8, duration: 1.4, ease: "sine.inOut" }, 8.3)
    .from(scene.poolScale, { scale: 0.1, opacity: 0, duration: 1.1, transformOrigin: "50% 50%", ease: "elastic.out" }, 9)
    .to(scene.poolScale, { scale: 1.02, duration: 0.8, transformOrigin: "50% 50%", ease: "sine.inOut" }, 10.1);
}

function animatePool() {
  const morphShapes = [
    "M -90 0 C -74 -35 -26 -50 0 -44 C 29 -48 72 -33 90 0 C 76 34 36 48 0 44 C -32 47 -75 35 -90 0 Z",
    "M -94 0 C -80 -30 -30 -56 0 -49 C 33 -55 80 -29 94 0 C 82 36 34 52 0 46 C -38 51 -82 33 -94 0 Z",
    "M -84 0 C -70 -38 -24 -44 0 -40 C 23 -44 68 -37 84 0 C 70 30 36 46 0 42 C -34 45 -70 30 -84 0 Z"
  ];

  const poolMorphTl = gsap.timeline({ repeat: -1, defaults: { ease: "sine.inOut" } });
  poolMorphTl
    .to(scene.poolShape, { morphSVG: morphShapes[1], duration: 2.4 })
    .to(scene.poolShape, { morphSVG: morphShapes[2], duration: 2.4 })
    .to(scene.poolShape, { morphSVG: morphShapes[0], duration: 2.4 });

  gsap.to(scene.ripples, {
    scaleX: 1.07,
    scaleY: 1.12,
    duration: 2,
    repeat: -1,
    yoyo: true,
    transformOrigin: "50% 50%",
    stagger: 0.2,
    ease: "sine.inOut"
  });
}

function narrSplit(tl, id, inAt, outAt, inDur = 0.08, outDur = 0.08) {
  const el = document.querySelector(id);
  if (!el || typeof SplitText === "undefined") {
    narr(tl, id, inAt, outAt, inDur, outDur);
    return;
  }

  const split = new SplitText(el, { type: "words,chars" });
  tl.fromTo(split.chars,
    { opacity: 0, y: 8 },
    {
      opacity: 1,
      y: 0,
      duration: inDur,
      stagger: 0.008,
      ease: "power1.out"
    },
    inAt
  ).to(split.chars,
    {
      opacity: 0,
      duration: outDur,
      stagger: 0.005,
      ease: "power1.in"
    },
    outAt
  );
}

function attachNarrationAnnotations(tl) {
  if (!window.RoughNotation) return;

  const griefEl = document.querySelector("#s1-narr-grief");
  if (griefEl) {
    const griefNote = RoughNotation.annotate(griefEl, {
      type: "highlight",
      color: "rgba(212,169,106,0.28)",
      strokeWidth: 1.6,
      animationDuration: 600,
      padding: [3, 6, 3, 6]
    });
    tl.call(() => griefNote.show(), null, 0.13)
      .call(() => griefNote.hide(), null, 0.50);
  }
}

// ─── Narration helper — fade a text overlay in then out within a scrubbed timeline.
// inAt / outAt are timeline seconds; inDur / outDur control the crossfade speed.
function narr(tl, id, inAt, outAt, inDur = 0.08, outDur = 0.08, riseY = 10) {
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

function setupScroll() {
  const pinSelector = document.querySelector(".scene1-stage") ? ".scene1-stage" : ".stage";

  const scrollTl = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    scrollTrigger: {
      trigger: ".scene-1-shell",
      start: "top top",
      end: "+=480%",
      scrub: 1.2,
      pin: pinSelector,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  // Phase 1: eyes recede upward & fade, pool scales gracefully upward.
  scrollTl
    .fromTo(scene.eyeSystem, { y: 0, scale: 1, opacity: 1 }, { y: -170, scale: 0.72, opacity: 0.12, duration: 0.5, ease: "power2.in" }, 0)
    .fromTo(
      scene.poolScale,
      { scale: 1, transformOrigin: "50% 50%" },
      { scale: 3.2, duration: 0.6, transformOrigin: "50% 50%", ease: "power2.out" },
      0
    )
    // Phase 2: rivers enter with presence, fade tears slightly, scale pool to final size.
    .fromTo(scene.riverLayer, { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 0.5)
    .to(scene.tearLayer, { opacity: 0.18, duration: 0.45, ease: "sine.inOut" }, 0.55)
    .to(scene.poolScale, { scale: 3.8, duration: 0.65, ease: "power2.out" }, 0.5);

  gsap.set(scene.rivers, { drawSVG: "0%" });
  scene.rivers.forEach((river, index) => {
    scrollTl.to(
      river,
      { drawSVG: "100%", duration: 0.5, ease: "power2.inOut" },
      0.54 + index * 0.04
    );
  });

  // ── Chapter narration beats ──────────────────────────────────────────────
  // Grief: appears as pool dominates and eyes recede (early scroll 20–90vh)
  narrSplit(scrollTl, "#s1-narr-grief",  0.12, 0.46, 0.06, 0.06);

  // Rivers: appears as rivers start drawing and remain drawn (100–175vh)
  narr(scrollTl, "#s1-narr-rivers", 0.52, 1.10, 0.06, 0.06);

  // Song labels stagger in alongside each river drawing on
  scene.riverLabels.forEach((label, index) => {
    scrollTl.fromTo(
      label,
      { opacity: 0 },
      { opacity: 1, duration: 0.12, ease: "power1.out" },
      0.66 + index * 0.09
    );
  });

  // Source: long read window after all rivers and labels are visible (285–430vh)
  narrSplit(scrollTl, "#s1-narr-source", 1.55, 2.70, 0.15, 0.15);
  attachNarrationAnnotations(scrollTl);
}

function initializeScene() {
  gsap.set(scene.nosePaths, { drawSVG: "0%" });
  gsap.set(scene.tears, { drawSVG: "0%" });
  maybeAddPoolRoughOverlay();

  gsap.set(scene.poolScale, { transformOrigin: "50% 50%" });
  gsap.set(scene.riverLayer, { opacity: 0, y: 48 });

  if (!prefersReducedMotion) {
    if (document.querySelector("#smooth-wrapper") && document.querySelector("#smooth-content")) {
      ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.2,
        effects: true,
        smoothTouch: 0.1
      });
    }
    addStopMotionJitter([scene.eyeSystem, ...scene.tears], 3.5);
    runIntro();
    animatePool();
    setupScroll();
  } else {
    gsap.set(scene.nosePaths, { drawSVG: "100%" });
    gsap.set(scene.tears, { drawSVG: "100%" });
    gsap.set(scene.rivers, { drawSVG: "100%" });
    gsap.set(scene.riverLayer, { opacity: 1, y: 0 });
    gsap.set(scene.poolScale, { scale: 3.5 });
    gsap.set(scene.riverLabels, { opacity: 1 });
  }

  const enterRiversButton = document.getElementById("enter-rivers-btn");
  if (enterRiversButton) {
    enterRiversButton.addEventListener("click", () => {
      if (window.Scene2 && typeof window.Scene2.activate === "function") {
        window.Scene2.activate();
      }
    });
  }
}

  window.addEventListener("load", initializeScene);
})();
