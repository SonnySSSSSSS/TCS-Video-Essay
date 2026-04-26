/* ═══════════════════════════════════════════════════════
   TCS Painting Book — Animations
   GSAP ScrollTrigger for scroll-driven reveals
   ═══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── Reduced motion check ────────────────────────────
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Make everything visible immediately, no animations
    document.querySelectorAll(".animate-in").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.getElementById("siteHeader").style.opacity = "1";
    var hero = document.getElementById("heroImage");
    if (hero) {
      hero.style.opacity = "1";
      hero.style.transform = "none";
    }
    initNotes();
    return;
  }

  // ── Register GSAP plugins ──────────────────────────
  gsap.registerPlugin(ScrollTrigger);

  // ── Defaults ────────────────────────────────────────
  var EASE = "power2.inOut";
  var FADE_DURATION = 0.4;
  var SHIFT_Y = 20;

  // ── Page Load Sequence ──────────────────────────────
  var loadTL = gsap.timeline({ defaults: { ease: EASE } });

  // Header fade-in
  gsap.set("#siteHeader", { opacity: 0 });
  loadTL.to("#siteHeader", {
    opacity: 1,
    duration: 0.3,
    delay: 0.1,
  });

  // Hero image: fade + scale down from 1.08 → 1
  loadTL.to(
    "#heroImage",
    {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "power2.out",
    },
    0.2
  );

  // First section paragraphs: staggered fade-in
  var openingParagraphs = document.querySelectorAll("#opening .animate-in");
  loadTL.to(
    openingParagraphs,
    {
      opacity: 1,
      y: 0,
      duration: FADE_DURATION,
      stagger: 0.1,
    },
    0.35
  );

  // ── Scroll-triggered text blocks ────────────────────
  // All .animate-in elements NOT in the opening section
  var scrollElements = document.querySelectorAll(
    ".essay-section:not(#opening) .animate-in, .notes-heading.animate-in"
  );

  scrollElements.forEach(function (el) {
    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 82%",
        once: true,
      },
      opacity: 1,
      y: 0,
      duration: FADE_DURATION,
      ease: EASE,
    });
  });

  // ── Staggered paragraphs within sections ────────────
  var sections = document.querySelectorAll(
    ".essay-section:not(#opening)"
  );

  sections.forEach(function (section) {
    var items = section.querySelectorAll(".animate-in");
    if (items.length > 1) {
      ScrollTrigger.batch(items, {
        start: "top 82%",
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: FADE_DURATION,
            stagger: 0.1,
            ease: EASE,
            overwrite: true,
          });
        },
      });
    }
  });

  // ── Blockquote (TCS quote) — special treatment ──────
  var tcsQuote = document.getElementById("tcsQuote");
  if (tcsQuote) {
    gsap.to(tcsQuote, {
      scrollTrigger: {
        trigger: tcsQuote,
        start: "top 80%",
        once: true,
      },
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: EASE,
    });
    // Set initial scale for blockquote
    gsap.set(tcsQuote, { scale: 0.99 });
  }

  // ── Dissolving figure image — fade + zoom ───────────
  var dissolvingImage = document.getElementById("dissolvingImage");
  if (dissolvingImage) {
    gsap.set(dissolvingImage, { opacity: 0, scale: 0.95 });
    gsap.to(dissolvingImage, {
      scrollTrigger: {
        trigger: dissolvingImage,
        start: "top 80%",
        once: true,
      },
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: EASE,
    });
  }

  // ── Green woman image — slide from left ───────────────
  var greenWomanImage = document.getElementById("greenWomanImage");
  if (greenWomanImage) {
    gsap.set(greenWomanImage, { opacity: 0, x: -20 });
    gsap.to(greenWomanImage, {
      scrollTrigger: {
        trigger: greenWomanImage,
        start: "top 80%",
        once: true,
      },
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: EASE,
    });
  }

  // ── Self-portrait image — strongest entrance ────────
  var selfPortraitImg = document.getElementById("selfPortraitImage");
  if (selfPortraitImg) {
    gsap.set(selfPortraitImg, { opacity: 0, scale: 0.9 });
    gsap.to(selfPortraitImg, {
      scrollTrigger: {
        trigger: selfPortraitImg,
        start: "top 80%",
        once: true,
      },
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "power2.out",
    });
  }

  // ── Notes section ───────────────────────────────────
  initNotes();

  function initNotes() {
    var noteCards = document.querySelectorAll(".note-card");

    noteCards.forEach(function (card) {
      var toggle = card.querySelector(".note-toggle");

      toggle.addEventListener("click", function () {
        var isExpanded = card.classList.contains("expanded");

        // Toggle state
        card.classList.toggle("expanded");
        toggle.setAttribute("aria-expanded", String(!isExpanded));
      });
    });

    // Fade in note cards on scroll (only if motion is allowed)
    if (!prefersReducedMotion) {
      noteCards.forEach(function (card) {
        gsap.set(card, { opacity: 0, y: 10 });
        gsap.to(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            once: true,
          },
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: EASE,
        });
      });
    }
  }
})();
