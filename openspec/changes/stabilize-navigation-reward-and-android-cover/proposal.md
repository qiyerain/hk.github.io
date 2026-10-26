## Why

The current floating navigation can lose its center menu or be visually covered by post imagery while scrolling. The reward QR codes are also too close together and the newest Android-to-Mac article falls back to an unrelated anime cover, weakening usability and content coherence.

## What Changes

- Keep the complete primary navigation visible and above page media while scrolling in either direction.
- Constrain article and listing imagery beneath the navigation stacking layer.
- Give WeChat and Alipay reward codes scan-safe separation, crisp rendering, and responsive sizing.
- Generate and assign a content-derived hand-drawn cover for the Android-to-Mac scrcpy article.

## Capabilities

### New Capabilities

- `persistent-navigation-layer`: Primary navigation remains visible, readable, and above content media during scrolling.
- `scan-safe-reward-codes`: Reward QR codes have sufficient visual separation and retain scan clarity across desktop and mobile layouts.
- `article-specific-sketch-cover`: The Android-to-Mac article uses a hand-drawn cover derived from its actual workflow.

### Modified Capabilities

None.

## Impact

- Custom presentation rules in `source/custom/xiaoao-redesign.css`.
- Navigation state handling in `source/js/xiaoao-site.js` if CSS alone cannot neutralize theme scroll behavior.
- Reward assets and article front matter under `source/img/reward/` and `source/_posts/`.
- Generated Hexo output and desktop/mobile browser validation.
