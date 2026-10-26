## Why

The blog already uses blur in many places, but it applies the same dark glass treatment too broadly and lacks the transparent-to-floating navigation transition that gives the reference site depth and clarity. Historical post covers also predate the repository's content-aware cover policy, so unrelated anime and generic technology images still obscure article identity.

## What Changes

- Give the global navigation a context-sensitive treatment: visually quiet over the home hero, then a floating, refractive glass surface after scrolling and on content pages.
- Apply the same restrained glass edge, highlight, and interaction language to menus, search, mobile navigation, and other high-frequency floating controls without turning article content into glass panels.
- Preserve readable fallbacks for browsers without backdrop filtering and for reduced-motion users.
- Tighten the cover policy so every new cover is derived from the article title, description, outline, and key concepts; technical and general-interest posts may not use unrelated anime imagery as a fallback.
- Record historical cover replacement as a deliberate per-article migration instead of bulk random reassignment.

## Capabilities

### New Capabilities

- `contextual-glass-surfaces`: Navigation and floating overlays use state-aware, accessible glass materials with responsive and compatibility fallbacks.
- `content-derived-cover-direction`: New and migrated covers communicate article-specific themes through hand-drawn note visuals and reject unrelated anime or generic stock imagery.

### Modified Capabilities

None.

## Impact

- Updates the existing injected stylesheet and site interaction script; no framework or dependency changes.
- Updates repository cover guidance and adds a historical migration inventory/contract.
- Affects shared navigation, search, menus, floating controls, and future cover production, so desktop/mobile visual verification and content/repository audits are required.
