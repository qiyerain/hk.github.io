## Requirements

### Requirement: Stable article identity
Every published Markdown article MUST contain a valid UUID `article_id` in Front Matter. Existing values MUST remain unchanged on subsequent builds.

#### Scenario: URL metadata changes
- Given an article already has `article_id`
- When its title, date, slug, or permalink changes
- Then the generated page and analytics payload continue using the original `article_id`.

### Requirement: Article-scoped analytics
Analytics events and page summaries MUST use `articleId` as the article key. Batch summaries MUST accept a list of article IDs and return each summary with its matching ID.

#### Scenario: Homepage statistics
- Given several cards with `data-analytics-article-id`
- When the homepage loads
- Then the browser makes one batch request and maps each response by `articleId`.
