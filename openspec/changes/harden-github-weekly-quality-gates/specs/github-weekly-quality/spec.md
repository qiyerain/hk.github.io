## ADDED Requirements

### Requirement: Readable rendered article
Every GitHub weekly article SHALL use the series-readable style and SHALL be opened after build at desktop and mobile widths. The verification SHALL confirm a light article background, sufficient text contrast, and no incoherent overlap.

#### Scenario: Browser style state drifts
- **WHEN** the computed article background or text color differs from the readable series contract
- **THEN** the workflow blocks completion and fixes the post-specific style before publication

### Requirement: Native visual geometry
Platform covers and the portrait summary SHALL be generated at their native target dimensions. The workflow SHALL compare natural and rendered image aspect ratios and SHALL NOT accept a stretched or compressed image.

#### Scenario: A cover is reused at another ratio
- **WHEN** the rendered aspect ratio differs materially from the source image ratio
- **THEN** the workflow regenerates the target canvas instead of resizing the existing cover

### Requirement: Evidence-bearing analysis
The weekly article SHALL preserve Trending source order, keep ranking semantics in a compact caption or source note, and support each deep dive with verifiable operational evidence, risks, alternatives, and an explicit judgment. The opening overview SHALL prioritize reader decisions over project-count or ranking-method narration.

#### Scenario: A ranked project lacks evidence
- **WHEN** a project has insufficient documentation for a responsible deep dive
- **THEN** it remains a short ranked entry and a better-documented project receives the analysis slot

### Requirement: Clickable WeChat project links
Every Markdown project link in the WeChat HTML SHALL render as a clickable anchor without visible Markdown URL syntax. TOP 5 numbered paragraphs SHALL remain consistently aligned and SHALL NOT introduce `ul` or `li` elements.

#### Scenario: A project link is nested inside bold text
- **WHEN** the source contains `**1. [owner/repo](URL)**`
- **THEN** the renderer emits a strong element containing an anchor, exposes no `[label](URL)` text, and preserves the number at the paragraph start

### Requirement: Verified collection membership
Every weekly issue SHALL use category `GitHub周周趋势` and SHALL appear on the built `/github-trends/` page before the blog stage is complete.

#### Scenario: Taxonomy drifts
- **WHEN** the current title is absent from the rendered collection
- **THEN** the workflow blocks completion and corrects the category or collection generator contract

### Requirement: Compact browser evidence
Visual verification SHALL use bounded evidence: one screenshot plus one metrics query per viewport, and a title-presence check for the collection page.

#### Scenario: The build passes
- **WHEN** Hexo generation succeeds
- **THEN** the workflow performs the bounded browser checks without a full-page accessibility dump
