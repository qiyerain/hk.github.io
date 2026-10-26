## 1. Project Governance

- [x] 1.1 Add the OpenSpec major-change and execution-report convention to AGENTS.md and CLAUDE.md
- [x] 1.2 Define root file placement rules and ignored temporary locations
- [x] 1.3 Move current design evidence and remove current disposable root artifacts
- [x] 1.4 Add and verify the automated repository hygiene audit

## 2. Homepage Reading Experience

- [x] 2.1 Replace the full-screen hero with a compact editorial masthead and focused navigation
- [x] 2.2 Add four knowledge paths and an original-only featured/recent article layout
- [x] 2.3 Add the desktop context rail and linear mobile reading order
- [x] 2.4 Standardize system typography, visible 16:9 covers, focal positions, and responsive behavior

## 3. Article TOC

- [x] 3.1 Update article TOC markup for desktop rail and accessible mobile sheet
- [x] 3.2 Replace IntersectionObserver tracking with deterministic requestAnimationFrame scroll tracking
- [x] 3.3 Implement offset-aware hash navigation, internal TOC scrolling, and layout recalculation
- [x] 3.4 Verify active state, keyboard behavior, focus return, PJAX, and boundary cases

## 4. Image Pipeline

- [x] 4.1 Add Sharp and implement validated cover and album WebP derivatives
- [x] 4.2 Add ignored upload queue storage and retry behavior
- [x] 4.3 Change daily image publication to update only successful, validated OSS items
- [x] 4.4 Extend content auditing for cover metadata, local publication paths, and placeholder/invalid URLs

## 5. Verification And Handoff

- [x] 5.1 Run build, repository/content audits, XML validation, and generated-output checks
- [x] 5.2 Run desktop and mobile browser QA for homepage, article TOC, navigation, and images
- [x] 5.3 Record performance measurements, known migration debt, and exact validation evidence
- [x] 5.4 Complete execution-report.md and leave the OpenSpec change ready for separate archival

## 6. Follow-up Visual And Album Refinement

- [x] 6.1 Replace the fragmented homepage heading with a compact image-led brand Hero and verify desktop/mobile navigation
- [x] 6.2 Widen and simplify the article reading surface and align the TOC indicator with the active row
- [x] 6.3 Diagnose historical album duplication and safely remove duplicate records and unreferenced files
- [x] 6.4 Add newest-first category pagination and cross-run source/hash deduplication to the album pipeline
- [x] 6.5 Re-run build, audit, multi-viewport, hash, focus, pagination, and generated-output verification
