# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Major Changes and OpenSpec

**Large changes leave a durable implementation record. Small fixes stay lightweight.**

Create `openspec/changes/<kebab-case-name>/` before implementation when work includes any of the following:
- A new user-facing capability or cross-page redesign.
- A data format, content contract, dependency, deployment, or automation workflow change.
- A migration or a change whose verification spans multiple subsystems.

The change must contain the OpenSpec proposal, design, capability specs, and tasks. Before declaring it complete, add `execution-report.md` with:
- Outcome and implemented scope.
- Important decisions and execution process.
- Exact validation commands and results.
- Plan deviations, remaining work, preview details, and rollback guidance.

A local typo, isolated style correction, or clearly scoped bug fix may skip OpenSpec only when it does not change interfaces, data, dependencies, workflows, or cross-page behavior. When classification is unclear, treat it as a major change. Keep completed changes active until archival is explicitly requested.

## 6. Repository Hygiene

**Every artifact has an owner and a directory. Do not use the repository root as a scratch space.**

- Reusable shell and Node automation belongs in `scripts/`; Python automation belongs in `scripts_py/`; build and audit utilities belong in `tools/`.
- Design notes and historical design evidence belong in `docs/design/`.
- Logs, PIDs, downloads, retry queues, temporary screenshots, and other disposable output belong in ignored `.cache/` subdirectories or the system temporary directory.
- OpenSpec evidence belongs with its change. Do not leave `run_*.sh`, `*.log`, `*.bak`, `*.tmp`, `*.orig`, or `*.rej` files in the root or generated site.
- Run `npm run audit:repo` before completing repository work. Move reusable artifacts to their owned directory and delete disposable artifacts created by the task.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 7. GitHub Weekly Publishing

**A weekly issue is complete only when the article, visuals, collection, and WeChat draft are independently verified.**

- Use the canonical path `source/_posts/每周GitHub趋势/YYYY-MM-DD-GitHub趋势.md`, category `GitHub周周趋势`, `hide_from_home: true`, and per-post Style Pack A. After building, open both the article and `/github-trends/` in a browser and confirm the current title appears in the collection.
- Treat `npm run build` as a prerequisite, not visual proof. Use one desktop and one mobile browser check to verify a light readable article background, sufficient text contrast, loaded images, and natural image aspect ratios. Record computed background/text colors and rendered versus natural image dimensions.
- Never stretch one platform cover into another ratio. Generate the native 1600x900 blog cover, 1080x460 WeChat cover, and single 1080x1350 portrait summary separately. Platform covers stay out of the body; keep only infographics that add distinct conclusions.
- Compare recurring-series visuals with the previous issue before acceptance. A flow diagram must show a real sequence or relationship, and a matrix must have meaningful axes and project positions; labeled card lists do not qualify.
- Preserve GitHub Trending page order in TOP 5, but keep ranking methodology in a compact caption or source note instead of spending the opening on project counts or ranking disclaimers. The overview must immediately tell readers what changed, why it matters, and which project fits which goal. Deep-dive only projects with verifiable README, release, license, security, or operational evidence; add cost, maturity, risk, alternatives, and an explicit judgment.
- In WeChat HTML, every Markdown project link must become a clickable `<a href>` without exposing `[label](URL)` syntax. Validate nested bold links such as `**1. [owner/repo](URL)**`, reject visible raw URLs, and confirm TOP 5 numbers align consistently without list tags.
- Keep blog and WeChat outcomes independent. For WeChat, run readiness/config/token preflight first, keep the final HTML free of `ul` and `li`, use `draft/update` when a saved `media_id` exists, and verify the stored draft with `draft/get`. Never publish, mass-send, or send a preview without separate authorization.

---

## 8. Interactive Demos

**`source/demos/` holds mirrored copies of standalone HTML artifacts; the owning repository stays the source of truth.**

- Publish with `npm run sync:demos -- learn-harness=/path/to/dir other=/path/to/file.html`. A directory needs an `index.html`; a single `.html` file is published as `index.html`, so `/demos/<slug>/` always resolves.
- Never hand-edit a mirrored copy. `npm run audit:demos` recomputes each tree against the sha256 in `source/demos/manifest.json` and fails when a copy drifted from the last sync.
- `skip_render: demos/**` makes Hexo copy the trees verbatim instead of rendering them as posts. Keep those artifacts self-contained: relative assets only, no build step at deploy time.
- Link from an article with a preview screenshot plus the theme button (`div.btns` + `a.button`, `target="_blank"`). Do not iframe a full application into an article.
