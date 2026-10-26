## ADDED Requirements

### Requirement: Distinct payment targets
The reward interface SHALL provide clear spatial separation between WeChat and Alipay codes.

#### Scenario: Desktop reward panel
- **WHEN** the reward panel opens on a desktop viewport
- **THEN** each payment code appears in its own labeled panel with a scan-safe gap

#### Scenario: Mobile reward panel
- **WHEN** the reward panel opens on a narrow mobile viewport
- **THEN** the payment codes remain separately labeled and do not overlap or touch

### Requirement: Undistorted QR rendering
The reward interface SHALL preserve payment image aspect ratio and sufficient rendered detail.

#### Scenario: QR image display
- **WHEN** either payment image is displayed
- **THEN** it uses contained scaling without square distortion, clipping, or low-resolution enlargement
