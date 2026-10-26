## Why

The home hero and most current article cards show unrelated anime or generic photography. Readers cannot identify the subject from the image, and large remote PNG covers add avoidable loading delay.

## What Changes

- Replace the home hero and the current featured/latest article covers with small, article-specific technical diagrams.
- Publish these fixed SVG assets with the static site so the initial view does not depend on an external image host.
- Set informative cover alt text and preserve article-specific images on article and archive views.
- Give the lead image priority while keeping below-the-fold cards lazy loaded.

## Impact

Home theme configuration and template, nine article front matter files, and new assets under `source/img/covers/home/`. Existing unrelated article content and image archive entries remain intact.
