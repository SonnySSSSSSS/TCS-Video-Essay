# Design System — TCS Video Essay

A scrollytelling web essay about **Trinh Công Sơn** (1939–2001), the Vietnamese singer-songwriter whose grief became rivers. The visual language is drawn from Vietnamese lacquer painting (sơn mài), hand-drawn cel animation, and TCS's own ink self-portraits.

---

## Aesthetic Philosophy

**Do not make this look modern, clean, or digital.**

Every visual decision should feel like it was drawn by hand on aged paper, then filmed at 12 frames per second. The essay lives in the aesthetic world of ink, lacquer, and impermanence — not UI design systems, flat illustration, or contemporary web aesthetics.

The stop-motion "boiling" jitter on all SVG strokes is intentional and essential. It is achieved by cycling an SVG `feTurbulence` seed at 12fps. Never replace this with smooth, eased animation.

---

## Color Tokens

```css
/* Core */
--canvas:            #f5f1e8;   /* aged paper — the background of everything */
--ink:               #2c2416;   /* dark warm brown-black — primary stroke color */
--tear:              #1a1a1a;   /* near-black — tears and deep shadows */
--tear-faded:        #5f5a52;   /* warm gray — secondary text, faded strokes */

/* Narrative paths */
--love:              #c8804a;   /* terracotta orange — the Love river thread */
--death:             #3a3028;   /* near-black dark brown — the Death river thread */

/* Brown scale (intro/atmospheric) */
--intro-ink:         #24180f;   /* deepest brown — heavy ink moments */
--intro-brown:       #5b4127;   /* mid brown — structural elements */
--intro-brown-soft:  #9b7a52;   /* soft brown — supporting elements */
```

**SVG-specific palette (used inline in markup):**
- Canvas backgrounds: `#f5f1e8`, `#eae4d4`
- Primary ink strokes: `#2c2416`, `#0d0d0d`, `#1a1a1a`
- Warm vignette amber: `#d4a96a` → `#8c5e2a`
- Love river (warm): `#503020`
- Death river (cool): `#304858`
- Tree foliage: `#7a9854`, `#6a8844`
- Love path sky: `#e8d4b0`
- Death path sky: `#9a9078`
- Water fill: `#1a3550`
- Eye whites: `#e8e2d6`

**Never use:** white `#ffffff`, pure black `#000000`, any blue-tinted or cool-white background, purple gradients, or any color that reads as "modern UI."

---

## Typography

**Display / Narrative:** Cormorant Garamond
- All narration overlays, song titles, Vietnamese labels, lyric text, pull quotes
- Weights used: 400 (regular), 500 (medium), 700 (bold)
- Always italic for narration and emotional text
- Size range: `clamp(1.4rem, 5.8vw, 2.1rem)` for narration, `clamp(1.6rem, 6vw, 2.2rem)` for titles
- Letter spacing: `0.02em`
- Line height: 1.35–1.45

**UI / Metadata:** Space Grotesk
- Stop numbers, theme tags, years, button labels, navigation copy
- Fallback: `"Segoe UI", sans-serif`

**Pairing rule:** Cormorant carries all emotional weight. Space Grotesk is structural only. Never reverse this.

---

## Background System

Backgrounds are always multi-layer radial gradients — never flat fills:

```css
/* Standard canvas background */
background: radial-gradient(circle at 50% -10%, #fff9ef 0%, #f5f1e8 45%, #ece5d8 100%);

/* Stage overlays (subtle light and shadow atmosphere) */
radial-gradient(circle at 12% 20%, rgba(255,255,255,0.35), transparent 35%),
radial-gradient(circle at 85% 75%, rgba(44,36,22,0.09), transparent 32%)
```

There is always a warm vignette at the canvas edges, implemented as an SVG gradient overlay using amber-to-brown (`#d4a96a` → `#8c5e2a`).

---

## SVG Filter System

All strokes and shapes pass through displacement and turbulence filters that give them an organic, hand-drawn character:

| Filter ID      | Effect                                              | Scale  |
|----------------|-----------------------------------------------------|--------|
| `brushstroke`  | Heavy organic stroke wobble                         | 9      |
| `tearFlow`     | Gentle flowing distortion for liquid paths          | 2.5    |
| `paintTexture` | `feBlend mode="multiply"` aged-canvas grain on fills | —     |

**The boiling effect:** All filters have their `feTurbulence seed` value cycled at 12fps using `gsap.ticker` (Scene 1) or `setInterval(100ms)` (Scene 2). This creates the stop-motion hand-drawn cel animation feel. It must run on every animated SVG element.

---

## Animation Principles

### Motion Engine
GSAP 3.15 with plugins: `DrawSVGPlugin`, `MorphSVGPlugin`, `ScrollTrigger`, `ScrollSmoother`, `SplitText`.

### Core Techniques

**DrawSVG draw-on** — the primary reveal technique. Paths start at `drawSVG: "0%"` and animate to `"100%"`. Used for tears, rivers, the smile arc, and overflow cascades. Speed should feel like ink being drawn by a brush — not mechanical.

**MorphSVG shape morphing** — used on the tear pool, cycling through 3 organic blob shapes on repeat with `yoyo: true`. Morph duration ~3s. The pool should never sit still.

**SplitText character reveals** — all narration text enters character-by-character. Stagger: `0.07s` per character. Direction: from bottom (`y: 8`), fading in.

**Scroll-driven timelines** — Scene 1 uses `ScrollTrigger` with `scrub: 1.2` over `600vh`. The scrub value is intentional — it creates a slight lag that makes the animation feel weighted and deliberate.

**Camera pan (world translation)** — there is no camera. "Camera movement" is simulated by translating the entire `#cvWorld` SVG group with `gsap.to`. Pan speed should be slow and cinematic.

**RoughNotation annotations** — used sparingly for key moments: a highlight on the word "grief" (Scene 1) and a box/bracket on the final text (Scene 2). These should feel like a pencil underlining text in a margin.

### Timing Guidelines
- Screen transitions: 0.55s out (`power2.in`) + 0.65s in (`power2.out`)
- River draw-on: 2–4s depending on path length
- Narration fade-in: 0.8s with `power2.out`
- Pool morph cycle: ~3s per shape
- Intermission cinematic: ~12s total auto-play sequence

### What to Avoid
- Bounce or spring easing — this is not playful UI
- Fast snappy transitions — everything should breathe
- Simultaneous reveals — stagger everything so the eye has somewhere to follow
- Smooth continuous animation where jitter/boil is expected

---

## Component Patterns

### Hut Cards (Scene 2 path screens)
Each card represents a TCS song stop. Structure:
- Small hand-drawn SVG vignette (scene-appropriate landscape or object)
- Stop number in Space Grotesk (e.g. "Stop I")
- Song title in Cormorant Garamond bold
- Location + year in Space Grotesk, muted brown
- Theme tag (e.g. "Young Love") in small caps
- Vietnamese lyrics block in Cormorant Garamond italic
- English translation in Cormorant Garamond regular, slightly smaller
- Essay prose in Space Grotesk, body size

Cards enter from below on scroll, no entrance animation beyond a simple opacity fade.

### Fork Buttons
Large touch targets, full-width within their container. Border in `--ink`. Hover: subtle lift (`translateY(-2px)`) + border darkens. No fill on default state — paper shows through.

### Progress Dots
Small dots indicating position within a path. Active dot fills with path color (`--love` or `--death`). CSS `transition` only — no GSAP.

### Caption Block
Positioned at `bottom: 5dvh`, centered. Background `#f5f1e8` with `backdrop-filter: blur(6px)`. Box shadow: `0 4px 20px rgba(44,36,22,0.10)`. Rounded `3px` — not sharp, not pill-shaped.

---

## Reduced Motion

Both scenes check `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- Scene 1: skips all animation entirely, shows final state
- Scene 2: jumps directly to static states, no transitions

Any new components must respect this pattern.

---

## Narrative Structure

```
Scene 1 (scroll prologue, 600vh)
  TCS's face → tears fall → pool forms → five rivers split
  Rivers named: Diễm Xưa, Như Cánh Vạc Bay, Biển Nhớ, Nối Vòng Tay Lớn, Một Cõi Đi Về

Scene 2 (state machine, 6 screens)
  Intro fork → Love path (3 stops) or Death path (3 stops)
  → Intermission (rivers run parallel, then merge)
  → Fork 2 (take the other path)
  → Convergence (rivers meet → dam → TCS's smile → overflow)
  Final text: "Now you see. / What will you taste?"
```

The two thematic colors are **always** love (`--love` terracotta) and death (`--death` near-black). They are not interchangeable. Love is warm. Death is dark.

---

## What This Project Is Not

- Not a portfolio site
- Not a music player
- Not a documentary with a standard video player
- Not a modern design showcase

It is a hand-drawn ink world that the reader moves through slowly, like turning the pages of an illustrated manuscript. Every design decision should serve that feeling.
