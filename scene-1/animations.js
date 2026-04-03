gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scene = {
  eyeSystem: document.querySelector("#eyeSystem"),
  pupils: gsap.utils.toArray("#leftPupil, #rightPupil"),
  tears: gsap.utils.toArray(".tear"),
  tearLayer: document.querySelector("#tearLayer"),
  poolPosition: document.querySelector("#poolPositionGroup"),
  poolScale: document.querySelector("#poolScaleGroup"),
  poolShape: document.querySelector("#poolShape"),
  ripples: gsap.utils.toArray(".ripple"),
  rivers: gsap.utils.toArray(".river"),
  riverLayer: document.querySelector("#riverLayer")
};

function setupStrokeDrawing(paths) {
  paths.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
  });
}

function addStopMotionJitter(targets, intensity = 1.15) {
  gsap.ticker.fps(12);
  gsap.ticker.add(() => {
    targets.forEach((el) => {
      gsap.set(el, {
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity
      });
    });
  });
}

function runIntro() {
  const tl = gsap.timeline({ defaults: { ease: "power1.inOut" } });

  tl.from("#frames", { opacity: 0, duration: 0.75 })
    .from("#eyes", { opacity: 0, y: 8, duration: 0.65 }, "<0.2")
    .from("#lids", { opacity: 0, duration: 0.55 }, "<0.1")
    .to(scene.pupils, { scaleY: 0.08, transformOrigin: "50% 50%", duration: 0.14 }, 2.5)
    .to(scene.pupils, { scaleY: 1, duration: 0.18 }, 2.64)
    .to(scene.pupils, { scaleY: 0.08, duration: 0.14 }, 4.2)
    .to(scene.pupils, { scaleY: 1, duration: 0.18 }, 4.34)
    .to(scene.tears, { strokeDashoffset: 0, duration: 2.3, stagger: 0.08, ease: "none" }, 5.5)
    .to(scene.tears, { stroke: "#5f5a52", opacity: 0.8, duration: 1.2, ease: "none" }, 8)
    .from(scene.poolScale, { scale: 0.1, opacity: 0, duration: 0.9, transformOrigin: "50% 50%" }, 9);
}

function animatePool() {
  const morphShapes = [
    "M -90 0 C -74 -35 -26 -50 0 -44 C 29 -48 72 -33 90 0 C 76 34 36 48 0 44 C -32 47 -75 35 -90 0 Z",
    "M -94 0 C -80 -30 -30 -56 0 -49 C 33 -55 80 -29 94 0 C 82 36 34 52 0 46 C -38 51 -82 33 -94 0 Z",
    "M -84 0 C -70 -38 -24 -44 0 -40 C 23 -44 68 -37 84 0 C 70 30 36 46 0 42 C -34 45 -70 30 -84 0 Z"
  ];

  gsap.to(scene.poolShape, {
    keyframes: morphShapes.map((d) => ({ attr: { d } })),
    duration: 7.2,
    repeat: -1,
    ease: "sine.inOut"
  });

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

function setupScroll() {
  const scrollTl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".scene-1-shell",
      start: "top top",
      end: "+=190%",
      scrub: 1.2,
      pin: ".stage",
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  // Phase 1: eyes recede, pool approaches and scales toward center.
  scrollTl
    .fromTo(scene.eyeSystem, { y: 0, scale: 1, opacity: 1 }, { y: -170, scale: 0.72, opacity: 0.16, duration: 0.5 }, 0)
    .fromTo(scene.poolPosition, { y: 0 }, { y: -278, duration: 0.5 }, 0)
    .fromTo(
      scene.poolScale,
      { scale: 1, transformOrigin: "50% 50%" },
      { scale: 3.25, duration: 0.5, transformOrigin: "50% 50%" },
      0
    )
    // Phase 2: rivers draw and take over visual focus.
    .fromTo(scene.riverLayer, { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.5 }, 0.5)
    .to(scene.tearLayer, { opacity: 0.24, duration: 0.35 }, 0.55)
    .to(scene.poolScale, { scale: 3.7, duration: 0.5 }, 0.5);

  scene.rivers.forEach((river, index) => {
    const length = river.getTotalLength();
    river.style.strokeDasharray = `${length}`;
    river.style.strokeDashoffset = `${length}`;

    scrollTl.fromTo(
      river,
      { strokeDashoffset: length },
      { strokeDashoffset: 0, duration: 0.45 },
      0.54 + index * 0.03
    );
  });
}

function initializeScene() {
  setupStrokeDrawing(scene.tears);

  gsap.set(scene.poolScale, { transformOrigin: "50% 50%" });
  gsap.set(scene.riverLayer, { opacity: 0, y: 48 });

  if (!prefersReducedMotion) {
    addStopMotionJitter([scene.eyeSystem, scene.tearLayer], 1.1);
    runIntro();
    animatePool();
    setupScroll();
  } else {
    gsap.set(scene.tears, { strokeDashoffset: 0 });
    gsap.set(scene.riverLayer, { opacity: 1, y: 0 });
    gsap.set(scene.poolScale, { scale: 3.5 });
  }
}

window.addEventListener("load", initializeScene);
