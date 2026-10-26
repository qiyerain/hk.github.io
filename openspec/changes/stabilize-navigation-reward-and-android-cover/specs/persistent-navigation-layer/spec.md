## ADDED Requirements

### Requirement: Persistent primary navigation
The site SHALL keep the complete primary navigation visible while users scroll upward or downward on desktop layouts.

#### Scenario: Downward scroll
- **WHEN** a desktop user scrolls beyond the page header
- **THEN** the primary navigation links remain visible and usable

#### Scenario: Upward scroll
- **WHEN** a desktop user scrolls back toward the page header
- **THEN** the same primary navigation links remain visible without layout displacement

### Requirement: Navigation stays above content media
The site SHALL paint the fixed navigation above article and listing images.

#### Scenario: Image reaches viewport top
- **WHEN** a cover or article image scrolls beneath the navigation region
- **THEN** the image is clipped below or visually occluded by the navigation surface and never paints above it
