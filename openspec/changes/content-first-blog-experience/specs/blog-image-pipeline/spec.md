## ADDED Requirements

### Requirement: Validated image derivatives
The image pipeline SHALL validate input type and dimensions and SHALL create optimized WebP derivatives before upload.

#### Scenario: Cover processing
- **WHEN** a valid raster cover is processed
- **THEN** a 1600x900 WebP derivative is produced in the ignored pipeline cache

#### Scenario: Invalid input
- **WHEN** an input is not a supported image or cannot be decoded
- **THEN** it is rejected without changing published content

### Requirement: OSS publication gate
Published Markdown and album data SHALL only receive an image URL returned by PicGo that passes HTTPS and image-response validation.

#### Scenario: Successful upload
- **WHEN** PicGo returns a valid OSS image URL
- **THEN** that item's content reference may be updated

#### Scenario: Failed upload
- **WHEN** PicGo is unavailable or returns an invalid URL
- **THEN** no local path or invented URL is written to published content

### Requirement: Partial batch success
Each image in a batch SHALL be committed independently so successful items can publish while failed items remain pending.

#### Scenario: Mixed batch result
- **WHEN** some uploads succeed and others fail
- **THEN** only successful items update content and every failed item is added to the retry queue

### Requirement: Durable retry metadata
Failed items SHALL be recorded in an ignored local queue with source, license, hash, category, attempts, and last error.

#### Scenario: Retry succeeds
- **WHEN** a queued image later uploads and validates successfully
- **THEN** its content target is updated and the queue entry is removed

### Requirement: Publishable sources
Automated publication SHALL reject Pinterest references and sources without verified reusable licensing.

#### Scenario: Reference-only candidate
- **WHEN** a candidate originates from Pinterest or has no reusable license
- **THEN** it may be archived as a reference but cannot enter published content
