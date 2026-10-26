## ADDED Requirements

### Requirement: Article-derived cover brief
Every new or migrated post cover MUST be based on a brief derived from the article title, description, outline, important objects, and conclusion. The brief MUST identify one primary topic and two to four visual anchors.

#### Scenario: A cover is prepared
- **WHEN** a new article needs a cover or an existing cover is replaced
- **THEN** the recorded brief identifies the article topic and two to four article-specific visual anchors before image generation or selection begins

### Requirement: Informational sketch direction
New and migrated covers SHALL prefer a 16:9 hand-drawn note or editorial sketch that makes the topic recognizable, keeps labels concise and readable, preserves crop-safe whitespace, and avoids decorative imagery unrelated to the article.

#### Scenario: A technical article cover is generated
- **WHEN** the article explains a system, tool, workflow, or engineering concept
- **THEN** the cover visualizes its actual components, flow, comparison, or outcome rather than showing an unrelated character or generic server photograph

### Requirement: Subject-matched fallback only
Anime imagery MUST NOT be used as a fallback unless anime is itself a material subject of the article. Any non-generated fallback MUST be selected for direct semantic relevance and MUST retain provenance, license, rationale, alt text, and a verified OSS URL.

#### Scenario: Image generation is unavailable
- **WHEN** a generated sketch cannot be produced or approved
- **THEN** the selected fallback directly depicts the article subject and includes provenance, license, rationale, `cover_alt`, and a verified OSS URL

#### Scenario: A technical post has an anime candidate
- **WHEN** an anime image is considered for a post that is not about anime
- **THEN** the image is rejected rather than used as a decorative fallback

### Requirement: Reviewable historical migration
Historical covers SHALL be migrated per article or coherent article series, and front matter SHALL change only after the replacement passes topic, legibility, crop, and OSS checks.

#### Scenario: Historical covers are inventoried
- **WHEN** legacy covers are evaluated for replacement
- **THEN** the inventory distinguishes known anime/generic assets, records the affected posts, and does not mutate front matter by random reassignment

