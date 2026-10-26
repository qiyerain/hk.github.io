## ADDED Requirements

### Requirement: Build a normalized content brief

The skill SHALL normalize an image request into title, summary, category, intent, channel, aspect, items, and source URLs before choosing a template.

#### Scenario: GitHub weekly brief

- **WHEN** the input contains a verified GitHub weekly project list with language, use, and weekly stars
- **THEN** the normalized brief preserves those fields and marks each item with an icon key or an explicit fallback

#### Scenario: Minimal blog image brief

- **WHEN** the input only contains an article title and a short summary
- **THEN** the skill creates a brief with inferred intent and the configured default aspect without inventing metrics or source claims

### Requirement: Route content to a visual template

The skill SHALL select a template by explicit override, category, intent, keyword match, and default fallback in that order, and SHALL record the route reasons.

#### Scenario: Explicit template override

- **WHEN** the caller provides a valid template id
- **THEN** the selected template is that id even if another template scores higher by keywords

#### Scenario: GitHub tool explainer

- **WHEN** the content includes GitHub, Agent, code, architecture, or tool-review signals
- **THEN** the router selects a technology-compatible template and records the matching signals

#### Scenario: Unknown topic

- **WHEN** no category, intent, or keyword matches a template
- **THEN** the router selects the configured default and records `default fallback`

### Requirement: Render exact copy and deterministic icons

The skill SHALL add project names, numbers, labels, and other supplied copy through deterministic HTML/SVG rendering, and SHALL use inline SVG icons from the icon catalog or an explicit generic fallback.

#### Scenario: Project list with known icon keys

- **WHEN** a brief contains AnyPS5, engineering Skills, video rendering, or diagram projects
- **THEN** each item receives its mapped icon and the rendered image contains the supplied project text without relying on image-model text generation

#### Scenario: Unknown icon key

- **WHEN** an item has no matching icon key
- **THEN** the renderer uses `generic-spark`, records `icon_fallback: true`, and continues without blocking the entire image

### Requirement: Apply PFA brand identity

Every generated image SHALL include a small lowercase `pfa` source signature within the safe margin and SHALL keep user-requested CTA text separate from that signature.

#### Scenario: Brand signature present

- **WHEN** the renderer completes a PNG/SVG output
- **THEN** both source SVG and rendered text checks contain lowercase `pfa`

### Requirement: Produce portable artifacts and manifest

The skill SHALL output a standalone SVG source, a PNG at the requested canvas, and a JSON manifest containing template, route reasons, icon mapping, source URLs, hashes, validation results, and upload status.

#### Scenario: Local generation succeeds

- **WHEN** `rsvg-convert` is available and the SVG is valid
- **THEN** the PNG has the requested dimensions and the manifest marks generation and validation as passed

#### Scenario: Upload is unavailable

- **WHEN** PicGo is unreachable
- **THEN** the manifest keeps `oss_url` null, records the concrete error and retry command, and does not fabricate a URL or call a publish API

### Requirement: Preserve content and publishing boundaries

The skill SHALL avoid modifying source article正文 or publishing to blog, WeChat, or Douyin unless a separate request explicitly authorizes that action.

#### Scenario: Validation run for a weekly article

- **WHEN** the user asks to validate the skill using the current GitHub weekly content
- **THEN** the skill reads the article/state as source input and writes isolated cache artifacts only
