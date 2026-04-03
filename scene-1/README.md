# Scene 1 - Eyes to Rivers

This scene is designed for a 390 x 844 mobile viewport and uses SVG + GSAP ScrollTrigger.

## Files

- `index.html` - Scene markup and SVG artwork
- `styles.css` - Mobile-first layout, texture, and animation styling
- `animations.js` - Intro sequence + scroll-driven parallax logic

## Bug Fixes Included

1. Scroll animation now scrubs smoothly across two phases using a single timeline with `ease: none`.
2. Pool centering fixed by separating translation and scaling into nested SVG groups.
3. Rivers are positioned from the pool and drawn/faded in during the second half of scroll.

## Notes

- Stop-motion feel is produced via 12fps ticker and subtle jitter.
- Replace placeholder paths and shapes with final traced art assets as needed.
