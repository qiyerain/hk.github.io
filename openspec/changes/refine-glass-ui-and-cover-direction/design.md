## Context

The Hexo site uses a customized AnZhiyu theme with visual overrides in `source/custom/xiaoao-redesign.css` and PJAX-aware behavior in `source/js/xiaoao-site.js`. Blur tokens already exist, but shared cards, navigation, and overlays use similar dark translucent surfaces. The reference experience gets its clarity from contextual state: an unobtrusive header over the first viewport and a compact floating glass bar after scrolling. The repository also has a content-aware cover policy, while 39 historically mapped posts still use generic technology or anime imagery and 20 current posts retain local generic covers.

## Goals / Non-Goals

**Goals:**

- Establish a restrained glass material with a refractive edge, backdrop tint, consistent shadow direction, and explicit interaction states.
- Make the home navigation transition from hero-integrated to a compact floating surface after scrolling while content pages remain readable immediately.
- Reuse the material only for navigation, menus, search, mobile sheets, and small floating controls.
- Make future cover direction article-specific and explicitly reject unrelated anime imagery.
- Produce a deterministic inventory for later per-article cover migration.

**Non-Goals:**

- Copy BongoCat branding, colors, layout, or assets.
- Replace the Hexo theme or introduce a motion/style dependency.
- Turn article bodies and every card into translucent glass.
- Generate or upload dozens of historical covers without individual topic extraction and visual review.

## Decisions

### Use a body state for contextual navigation

`xiaoao-site.js` will toggle a single class from scroll position and page context. CSS owns rendering. This follows the existing PJAX lifecycle and avoids duplicating style logic in JavaScript. A pure `:has()`/scroll-driven CSS alternative was rejected because browser support and scroll threshold control are less predictable.

### Build the material from layered CSS, not blur alone

The shared glass material combines translucent background tint, `backdrop-filter`, a subtle inner highlight, a low-contrast outer edge, and a hue-aware shadow. The home header is full-width and transparent at the top, then becomes an inset rounded bar when scrolled. Content pages use the inset bar immediately. Browsers without backdrop filtering receive an opaque surface through `@supports`.

### Limit glass to elevated controls

Article cards and prose containers remain opaque or unframed. Dropdowns, search, mobile navigation, TOC sheets, and floating action controls receive the shared material because elevation communicates their relationship to underlying content. This avoids the current all-glass visual monotony.

### Treat historical covers as a content migration

The policy will require a cover brief containing one primary topic and two to four visual anchors derived from article metadata/content. Anime is valid only when anime itself is the subject. The current cover inventory will be recorded as migration debt, but replacement images will be generated, reviewed, uploaded, and committed per article or coherent series rather than assigned in bulk.

## Risks / Trade-offs

- **Blur can increase GPU work on mobile** -> constrain the filtered area, reduce blur at narrow breakpoints, and disable animated transitions for reduced motion.
- **Existing theme selectors may override the material** -> place a focused refinement block at the end of the existing injected stylesheet and verify computed styles in the built site.
- **PJAX can leave stale scroll state** -> initialize on page load and PJAX completion, and use one replaceable scroll listener.
- **A stricter cover policy does not immediately repair old posts** -> publish an explicit inventory and keep migration separate so every replacement remains content-accurate and OSS-verified.

## Migration Plan

1. Add the glass state and focused CSS overrides, then verify home/content pages at desktop and mobile widths.
2. Update the cover constitution and add the historical cover inventory.
3. Build and audit the site.
4. In a later image migration, process posts individually or by series: derive brief, generate 16:9 sketch cover, review, upload through PicGo, update `cover` and `cover_alt`, then validate the URL.

Rollback consists of removing the final contextual-glass CSS block and scroll-state initializer, then reverting the policy wording and inventory. No content URL or dependency rollback is required.

## Open Questions

None for this scoped change. Historical image generation remains a separate, reviewable migration.
