## 1. Skill structure and routing

- [x] 1.1 Create `.codex/skills/pfa-content-generate-image/` with SKILL.md, references, scripts, assets, and evals directories.
- [x] 1.2 Write pushy frontmatter and workflow instructions covering cover, knowledge card, architecture diagram, ranking, and blog inline-image triggers.
- [x] 1.3 Add a template catalog and deterministic routing script with explicit override, category, intent, keyword, and fallback behavior.

## 2. Icon and brand system

- [x] 2.1 Add inline SVG icon definitions for the initial project/knowledge icon keys and a generic fallback.
- [x] 2.2 Add brand/reference rules for lowercase `pfa`, safe margins, text slots, and channel-specific CTA placement.
- [x] 2.3 Add a manifest schema/example documenting icon fallback, source URLs, hashes, validation, and upload status.

## 3. Deterministic renderer

- [x] 3.1 Implement a renderer that accepts a normalized brief, chooses a template, inserts exact copy and inline SVG icons, and emits standalone SVG.
- [x] 3.2 Add PNG conversion and validation for dimensions, required text, brand mark, safe margin, and JSON output.
- [x] 3.3 Keep PicGo upload optional and failure-safe: record null URL, error, and retry command without publishing.

## 4. Real validation and skill tests

- [x] 4.1 Add 2–3 realistic skill eval prompts covering a GitHub weekly ranking, a technical architecture article, and a non-technical knowledge card.
- [x] 4.2 Run the skill against the verified 2026-10-16 GitHub weekly input and produce isolated SVG/PNG/manifest artifacts.
- [x] 4.3 Visually inspect the generated output for icon distinctiveness, text legibility, overlap, clipping, `pfa` signature, and mobile readability.
- [x] 4.4 Run `npm run audit:repo` and record exact validation commands/results in execution-report.md.
