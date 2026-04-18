# TCS Video Essay — Animation Upgrade Spec

## Overview

Phased plan to upgrade the animation stack of the TCS Video Essay app.
All changes preserve the existing artistic direction — hand-drawn,
stop-motion, scroll-driven narrative — while making it smoother,
more expressive, and more efficient.

**Current stack**: GSAP 3.12.5 + ScrollTrigger 3.12.5 (CDN), vanilla JS IIFEs, inline SVG, no build tools.

---

## Phase 0 — GSAP Upgrade (foundation for everything else)

> Zero visual changes. Unlocks all formerly-paid plugins for free.

### 0.1  Bump CDN versions from 3.12.5 → 3.15

**Files to edit** (4 HTML files, 6 `<script>` tags total):

| File | Lines |
| ------ | ------- |
| `index.html` | ~1860–1861 |
| `prologue/index.html` | ~853–854 |
| `scene-1/index.html` | ~177 (+ implicit ScrollTrigger) |
| `scene-2/index.html` | ~784–785 |

**Change** (same in each file):

```html
<!-- before -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>

<!-- after -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollTrigger.min.js"></script>
```

### 0.2  Smoke-test all three entry points

1. Open `/scene-1/index.html` — verify intro plays, scroll works, pool morphs, rivers draw.
2. Open `/index.html` — verify prologue cosmos → eyes → parable → bridge → rivers → scene-2 intermission → fork → convergence.
3. Open `/scene-2/index.html` — verify standalone scene-2.

### 0.3  Acceptance criteria

- All existing animations behave identically to the 3.12.5 baseline.
- No console errors.
- `gsap.version` returns `"3.15.x"` in dev console.

---

## Phase 1 — MorphSVGPlugin (pool morphing)

> Replace raw `attr: { d }` keyframe jumps with interpolated SVG morphing.

### 1.1  Add MorphSVGPlugin CDN

**All 4 HTML files** — add this line immediately *after* the ScrollTrigger script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/MorphSVGPlugin.min.js"></script>
```

### 1.2  Register the plugin

**`scene-1/animations.js`** line 4 — change:

```js
// before
gsap.registerPlugin(ScrollTrigger);

// after
gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);
```

### 1.3  Rewrite `animatePool()` in scene-1/animations.js

**Current** (~lines 71–96): Uses `gsap.to(scene.poolShape, { keyframes: ... attr: { d } })` — which snaps between 3 path strings without true interpolation.

**New implementation**:

```js
function animatePool() {
  const morphShapes = [
    "M -90 0 C -74 -35 -26 -50 0 -44 C 29 -48 72 -33 90 0 C 76 34 36 48 0 44 C -32 47 -75 35 -90 0 Z",
    "M -94 0 C -80 -30 -30 -56 0 -49 C 33 -55 80 -29 94 0 C 82 36 34 52 0 46 C -38 51 -82 33 -94 0 Z",
    "M -84 0 C -70 -38 -24 -44 0 -40 C 23 -44 68 -37 84 0 C 70 30 36 46 0 42 C -34 45 -70 30 -84 0 Z"
  ];

  // Chained morphSVG tweens for smooth interpolation between all shapes
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: "sine.inOut" } });
  tl.to(scene.poolShape, { morphSVG: morphShapes[1], duration: 2.4 })
    .to(scene.poolShape, { morphSVG: morphShapes[2], duration: 2.4 })
    .to(scene.poolShape, { morphSVG: morphShapes[0], duration: 2.4 });

  // Ripples unchanged
  gsap.to(scene.ripples, {
    scaleX: 1.07, scaleY: 1.12,
    duration: 2, repeat: -1, yoyo: true,
    transformOrigin: "50% 50%", stagger: 0.2, ease: "sine.inOut"
  });
}
```

### 1.4  Acceptance criteria

- Pool shape transitions are visually smooth — no frame-skip jumps between shapes.
- Looping morph cycle feels organic and water-like.
- Total morph period ≈7.2s preserved (3 × 2.4s).
- Ripple animation unaffected.

---

## Phase 2 — DrawSVGPlugin (stroke drawing)

> Replace manual `getTotalLength()` / `strokeDasharray` / `strokeDashoffset` with DrawSVGPlugin for cleaner code and better control (partial draws, direction, live-measured lengths).

### 2.1  Add DrawSVGPlugin CDN

**All 4 HTML files** — add after MorphSVGPlugin (or ScrollTrigger if Phase 1 not yet done):

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/DrawSVGPlugin.min.js"></script>
```

### 2.2  Register the plugin

**All 3 animation files** — add `DrawSVGPlugin` to `gsap.registerPlugin(...)`.

### 2.3  Refactor scene-1/animations.js

#### a) Remove `setupStrokeDrawing()` function (lines 23–29)

Replace all calls to it with DrawSVG `set`:

```js
// before
setupStrokeDrawing(paths);

// after — DrawSVGPlugin handles measurement internally
gsap.set(paths, { drawSVG: "0%" });
```

#### b) Nose path drawing (line 60)

```js
// before
.to(scene.nosePaths, { strokeDashoffset: 0, ... })

// after
.to(scene.nosePaths, { drawSVG: "100%", ... })
```

#### c) Tear drawing (line 65)

```js
// before
.to(scene.tears, { strokeDashoffset: 0, ... })

// after
.to(scene.tears, { drawSVG: "100%", ... })
```

#### d) River drawing in `setupScroll()` (lines 141–152)

```js
// before
scene.rivers.forEach((river, index) => {
  const length = river.getTotalLength();
  river.style.strokeDasharray = `${length}`;
  river.style.strokeDashoffset = `${length}`;
  scrollTl.fromTo(river,
    { strokeDashoffset: length },
    { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" },
    0.54 + index * 0.04
  );
});

// after
gsap.set(scene.rivers, { drawSVG: "0%" });
scene.rivers.forEach((river, index) => {
  scrollTl.to(river,
    { drawSVG: "100%", duration: 0.5, ease: "power2.inOut" },
    0.54 + index * 0.04
  );
});
```

### 2.4  Refactor prologue/animations.js

#### a) Remove `setupStroke()` helper (lines 72–78)

#### b) Replace all usages (bridge tears, bridge rivers, two-rivers paths)

```js
// bridge tears (setupBridge, ~line 442)
gsap.set(tears, { drawSVG: "0%" });
tears.forEach((t, i) => {
  btl.to(t, { drawSVG: "100%", duration: 16, ease: "power2.inOut" }, 26 + i * 1.8);
});

// bridge rivers (~line 460)
gsap.set(rivers, { drawSVG: "0%" });
rivers.forEach((r, i) => {
  btl.to(r, { drawSVG: "100%", duration: 24, ease: "power2.inOut" }, 68 + i * 2.6);
});

// two-rivers (~line 509)
gsap.set(rRivers, { drawSVG: "0%" });
rRivers.forEach((r, i) => {
  rtl.to(r, { drawSVG: "100%", duration: 30, ease: "power2.inOut" }, i * 2);
});
```

#### c) Update reduced-motion fallbacks (~lines 676–678)

```js
gsap.set(".bTear",  { drawSVG: "100%" });
gsap.set(".bRiver", { drawSVG: "100%" });
gsap.set(".rRiver", { drawSVG: "100%" });
```

### 2.5  Refactor scene-2/animations.js

#### a) Replace `setupStroke()` (lines 24–30) — same pattern as above

#### b) Convergence smile lines (~line 227)

```js
gsap.set([
  ...document.querySelectorAll('#cvSmile, #cvSmileL, #cvSmileR'),
  ...document.querySelectorAll('#cvOverflowL path, #cvOverflowR path')
], { drawSVG: "0%" });
```

#### c) All `strokeDashoffset: 0` tweens in `setupConvergence()` become `drawSVG: "100%"`

### 2.6  Acceptance criteria

- `setupStrokeDrawing()` and `setupStroke()` helpers are deleted from all files.
- No manual `getTotalLength()`, `strokeDasharray`, or `strokeDashoffset` lines remain.
- All stroke animations render identically to before.
- Grep for `strokeDashoffset` across `*.js` returns zero results (except reduced-motion static sets, now also using drawSVG).

---

## Phase 3 — ScrollSmoother (smooth inertial scroll)

> Add momentum-based smooth scrolling to the prologue and scene-1 scroll shells.
> Scene-2 does not use native scroll for its main UI (it's a state machine), but
> its convergence panel uses `panel.scrollTop` which must remain unaffected.

### 3.1  Add ScrollSmoother CDN

**`index.html`** and **`prologue/index.html`** and **`scene-1/index.html`** — add after ScrollTrigger:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollSmoother.min.js"></script>
```

**`scene-2/index.html`** — do NOT add (standalone scene-2 has no smooth-scroll shells).

### 3.2  Wrap existing markup

ScrollSmoother requires a `#smooth-wrapper > #smooth-content` structure.

**`index.html`** — wrap the prologue + scene-2 content:

```html
<body>
  <div id="smooth-wrapper">
    <div id="smooth-content">
      <!-- existing content: cosmos-shell, eyes-shell, parable-shell, etc. -->
      <!-- scene2-overlay stays OUTSIDE smooth-content (it's position:fixed) -->
    </div>
  </div>
  ...
</body>
```

**`scene-1/index.html`** — same wrapper around `<main>`.

**`prologue/index.html`** — same wrapper around main content.

### 3.3  Initialize ScrollSmoother

**`prologue/animations.js`** — in `init()`, before any `setup*()` calls:

```js
gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, ScrollSmoother);

const smoother = ScrollSmoother.create({
  wrapper: "#smooth-wrapper",
  content: "#smooth-content",
  smooth: 1.2,           // seconds of lag (1–2 feels cinematic)
  effects: true,          // enable data-speed/data-lag attrs
  smoothTouch: 0.1        // light touch smoothing; 0 = disabled on touch
});
```

**`scene-1/animations.js`** — same pattern.

### 3.4  Move scene-2 overlay outside smooth-content

The `#scene2-overlay` div is `position: fixed` and covers the viewport.
It must sit *outside* `#smooth-content` so ScrollSmoother doesn't transform it.
Move it to be a sibling of `#smooth-wrapper`.

### 3.5  Verify convergence panel scroll

`scene-2/animations.js` `setupConvergence()` drives a timeline via `panel.scrollTop / scrollable`.
Since the convergence panel (`#s-convergence`) uses its own inner `overflow-y: auto` scroll,
ScrollSmoother should not intercept it. Verify this explicitly.

### 3.6  Acceptance criteria

- Scrolling through prologue and scene-1 feels buttery with inertial decay.
- All ScrollTrigger pins and scrub timelines work identically.
- Scene-2 overlay appears and functions correctly.
- Convergence panel inner-scroll works.
- `prefers-reduced-motion` disables smooth scroll (ScrollSmoother respects this by default).
- No layout jumps or z-index issues.

### 3.7  Fallback plan

If ScrollSmoother creates issues with the complex pinning setup, replace with **Lenis**:

```html
<script src="https://unpkg.com/lenis@1.3.21/dist/lenis.min.js"></script>
```

```js
const lenis = new Lenis({ smooth: true, lerp: 0.08 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Lenis does NOT require wrapper divs, making it a lower-risk integration.

---

## Phase 4 — Rough.js (hand-drawn shapes)

> Augment select SVG elements with structurally hand-drawn paths generated by Rough.js.
> This adds authentic pencil/ink irregularity to shapes that currently rely solely
> on filter-based distortion.

### 4.1  Add Rough.js CDN

**`index.html`**, **`prologue/index.html`**, **`scene-1/index.html`**:

```html
<script src="https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.min.js"></script>
```

### 4.2  Target elements

| Element | File | Current look | Rough.js treatment |
| --------- | ------ | ------------- | ------------------- |
| Prologue stars (`#cStars circle`) | prologue/animations.js | Perfect circles | Replace `generateStars()` to use `rough.circle()` with `roughness: 0.8` |
| Pool outline (`#poolShape`) | scene-1 | Clean bezier + feTurbulence filter | Add rough overlay stroke around pool with `roughness: 1.2, bowing: 2` |
| Parable elements (`#pVine`, `#pStrawberry` outlines) | prologue/animations.js | Clean SVG + feTurbulence | Replace path outlines with rough equivalents |
| Bridge tear paths (`.bTear`) | prologue/animations.js | Smooth stroke-drawn paths | Redraw with `rough.path()` for pencil-sketch tears |

### 4.3  Implementation pattern for stars

```js
function generateStars() {
  const svg = document.querySelector("#cosmos-stage svg"); // or appropriate parent
  const rc = rough.svg(svg);
  const group = document.querySelector("#cStars");
  const count = 82;

  // Same rx/ry arrays as before...
  for (let i = 0; i < count; i++) {
    const cx = rx[i] * 390;
    const cy = ry[i] * 844;
    const r = 0.35 + (rx[i] * 1.55);
    const op = 0.22 + (ry[i] * 0.68);

    const node = rc.circle(cx, cy, r * 2, {
      fill: "white",
      fillStyle: "solid",
      stroke: "white",
      strokeWidth: 0.3,
      roughness: 0.6 + (i % 5) * 0.15
    });
    node.setAttribute("opacity", op.toFixed(2));
    node.dataset.baseOp = op;
    group.appendChild(node);
  }
}
```

### 4.4  Implementation notes

- Rough.js returns `<g>` elements containing `<path>` children. The existing `twinkleStars()` code queries `#cStars circle` — update selectors to `#cStars g` or `#cStars > *`.
- For the pool overlay, create a *separate* `<g>` layer on top of `#poolShape` with a rough-drawn duplicate. The smooth shape still morphs underneath; the rough overlay provides visual texture.
- Draw rough elements once at init time. Do not regenerate per frame — Rough.js path generation is not designed for 60fps.
- For animated elements, use Rough.js for the initial shape, then animate the resulting `<path>` `d` attribute using GSAP/MorphSVG normally.

### 4.5  Acceptance criteria

- Stars in the cosmos stage appear with irregular, pencil-sketched outlines instead of perfect circles.
- Pool has a visible hand-drawn stroke overlay that breathes alongside the morph.
- Parable elements feel more like ink illustrations than vector graphics.
- No performance degradation (rough paths generated once, not per-frame).
- The overall aesthetic remains cohesive with the feTurbulence jitter effect (both contribute to the hand-drawn feel via different mechanisms).

---

## Phase 5 — Rough Notation (text annotations)

> Add hand-drawn annotation animations to narration text elements for select
> high-impact moments. Used sparingly — not every narration, only key beats.

### 5.1  Add Rough Notation CDN

**`index.html`** and **`prologue/index.html`**:

```html
<script src="https://unpkg.com/rough-notation/lib/rough-notation.iife.js"></script>
```

### 5.2  Target narration elements

| Narration ID | Scene | Text | Annotation type |
| ------------- | ------- | ------ | ---------------- |
| `#n-sunyata` | Prologue cosmos | Śūnyatā | `circle` — hand-drawn circle appears around the word as it fades in |
| `#n-born` | Prologue cosmos | "...a boy was born in Huế" | `underline` — sketchy underline draws beneath "Huế" |
| `#s1-narr-grief` | Scene 1 | Grief narration | `highlight` — pale amber highlight sweeps across |
| `#cv-n4` | Scene 2 convergence | "A smile." | `box` — hand-drawn box frames the text |
| `#cv-final` | Scene 2 convergence | Final text | `bracket` — bracket appears on left side |

### 5.3  Integration with GSAP timelines

Rough Notation's `show()` is promise/callback-based; integrate with GSAP timeline `.call()`:

```js
function annotateOnScroll(tl, selector, config, atTime) {
  const el = document.querySelector(selector);
  if (!el) return;

  const annotation = RoughNotation.annotate(el, {
    ...config,
    animate: true,
    animationDuration: config.animationDuration || 800
  });

  tl.call(() => annotation.show(), null, atTime);
  // Hide when narration fades (optional)
  if (config.hideAt !== undefined) {
    tl.call(() => annotation.hide(), null, config.hideAt);
  }
}

// Example usage within setupCosmos():
annotateOnScroll(ctl, "#n-sunyata", {
  type: "circle",
  color: "rgba(255,255,255,0.5)",
  strokeWidth: 1.5,
  padding: 8
}, 2);
```

### 5.4  Styling considerations

- Annotation SVGs are injected as siblings. Set `pointer-events: none` and ensure
  they don't interfere with scroll-trigger hit areas.
- Match annotation colors to the scene palette:
  - Cosmos: white/soft blue (`rgba(255,255,255,0.5)`)
  - Warm sections: ink brown (`#5f5a52`) or love red (`#7A1B1B`)
  - Convergence: same ink tone as `--ink` CSS variable

### 5.5  Acceptance criteria

- Annotations appear precisely when their narration enters during scroll.
- Annotations are hand-drawn and match the overall ink aesthetic.
- No more than 5–6 annotated moments in the entire experience (restraint is key).
- `prefers-reduced-motion` skips annotation animations (use `animate: false`).

---

## Phase 6 — SplitText (text animation polish)

> Optional enhancement. Use GSAP's SplitText to reveal narration text character-by-character
> or word-by-word instead of simple opacity fades.

### 6.1  Add SplitText CDN

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/SplitText.min.js"></script>
```

### 6.2  Enhance the `narr()` helper

**`prologue/animations.js`** and **`scene-1/animations.js`** — create an augmented narration function:

```js
function narrSplit(tl, id, inAt, outAt, inDur = 4, outDur = 4) {
  const el = document.querySelector(id);
  if (!el) return;

  const split = new SplitText(el, { type: "words,chars" });

  tl.fromTo(split.chars,
    { opacity: 0, y: 8 },
    {
      opacity: 1, y: 0,
      duration: inDur,
      stagger: 0.03,
      ease: "power1.out"
    },
    inAt
  ).to(split.chars,
    { opacity: 0, duration: outDur, stagger: 0.02, ease: "power1.in" },
    outAt
  );
}
```

### 6.3  Target narrations

Apply `narrSplit()` selectively to key story beats:

- `#n-sunyata` — character reveal suits a single sacred word
- `#n-born` — word-by-word suits a biographical sentence
- `#cv-final` — word reveal for the closing message

Keep `narr()` for shorter, atmospheric text that benefits from simple fades.

### 6.4  Acceptance criteria

- Selected narrations reveal character-by-character with staggered timing.
- Text reflows correctly (SplitText wraps chars in `<span>` — verify no layout shift).
- Scrub-driven timelines stay smooth with staggered char animations.
- `prefers-reduced-motion` falls back to simple `narr()`.

---

## Implementation Order & Dependencies

```text
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5 ──► Phase 6
 GSAP       MorphSVG    DrawSVG    ScrollSmooth  Rough.js    Rough       SplitText
 upgrade    (pool)      (strokes)  (scroll feel) (shapes)    Notation    (text fx)
                                                             (text)
```

- **Phase 0 is required before all others** (3.15 unlocks plugins).
- **Phases 1–2** can be done in either order (independent).
- **Phase 3** should follow Phase 2 (DrawSVG must be stable before adding scroll transform layer).
- **Phases 4–6** are independent of each other and can be done in any order after Phase 0.
- **Phase 6** is optional — only implement if character-reveal adds to the artistic vision.

---

## Risk Assessment

| Risk | Mitigation |
| ------ | ----------- |
| GSAP 3.15 API breaking changes | 3.x is backwards-compatible; changelog review before upgrade |
| ScrollSmoother conflicts with pinned sections | Test incrementally; Lenis fallback available (Phase 3.7) |
| MorphSVGPlugin fails on pool paths (point mismatch) | All 3 pool shapes have identical topology (4 cubics + close); MorphSVG handles this natively |
| Rough.js `<g>` elements break star twinkle selectors | Update selectors from `circle` to `> *` |
| Rough Notation SVGs stack above content | Set `pointer-events: none` on annotation container |
| SplitText char `<span>`s break scroll-scrub text alignment | Test in scrubbed timeline; fallback to `narr()` for problem cases |
| Performance with all new libraries | Total added size: ~45kB gzipped (MorphSVG 3kB + DrawSVG 1kB + ScrollSmoother 5kB + Rough.js 9kB + Rough Notation 4kB + SplitText 3kB). Art-directed sites tolerate this. |

---

## Files Modified Per Phase

| Phase | HTML files | JS files | CSS files |
| ------- | ----------- | ---------- | ----------- |
| 0 | index.html, prologue/index.html, scene-1/index.html, scene-2/index.html | — | — |
| 1 | same 4 | scene-1/animations.js | — |
| 2 | same 4 | scene-1/animations.js, scene-2/animations.js, prologue/animations.js | — |
| 3 | index.html, prologue/index.html, scene-1/index.html | prologue/animations.js, scene-1/animations.js | index.html (wrapper divs) |
| 4 | index.html, prologue/index.html, scene-1/index.html | prologue/animations.js, scene-1/animations.js | — |
| 5 | index.html, prologue/index.html | prologue/animations.js, scene-2/animations.js | — |
| 6 | index.html, prologue/index.html, scene-1/index.html | prologue/animations.js, scene-1/animations.js | — |
