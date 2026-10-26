## Context

AnZhiyu moves `.menus_items` out of view when downward scrolling removes `nav-visible`; the custom glass navigation fixes the outer `#nav` but does not neutralize that inner transform. Some content images can also paint above the navigation because the fixed navigation lacks a consistently dominant stacking layer. Reward codes currently render as adjacent 130px squares even though their source payment screenshots are portrait images.

## Goals / Non-Goals

**Goals:**

- Keep the full navigation visible and above media at all scroll positions.
- Preserve the existing contextual glass appearance.
- Make both payment codes distinct, sharp, and responsive.
- Replace one unrelated fallback cover with a content-specific sketch asset.

**Non-Goals:**

- Redesign the overall theme or navigation information architecture.
- Replace every historical anime cover in this change.
- Modify AnZhiyu's vendored source behavior.

## Decisions

1. Override theme behavior in the final custom stylesheet. The fixed `#nav` receives an explicit high stacking order and the inner menu transform remains neutral in both scroll directions. This avoids editing theme code while preserving its scroll progress behavior.
2. Establish containment for post/listing media using local positioning, overflow clipping, and lower stacking levels. The navigation remains the only elevated global layer in normal browsing.
3. Render reward items as separated white QR panels with responsive gaps and `object-fit: contain`. The source images remain untouched because they have ample native resolution; avoiding forced square distortion addresses the apparent blur.
4. Generate a 16:9 editorial hand-drawn cover from the article's scrcpy workflow anchors, upload it through the repository PicGo flow, and store the resulting URL in article front matter.

## Risks / Trade-offs

- [A high navigation z-index could cover dialogs] -> Keep search, sidebar, and reward overlay layers above the navigation where needed.
- [Portrait payment screenshots consume more vertical space] -> Bound the rendered panel responsively while preserving the full code and quiet zone.
- [Generated cover could include inaccurate UI or text] -> Use symbolic device/cable/window anchors, request no text or logos, and visually inspect before upload.

## Migration Plan

Deploy the custom CSS, article front matter, and hosted cover together. Roll back by reverting those changes; no content schema or dependency migration is required.

## Open Questions

None.
