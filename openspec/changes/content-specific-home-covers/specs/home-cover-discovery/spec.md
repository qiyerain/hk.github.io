## ADDED Requirements

### Requirement: Subject-specific homepage imagery
The homepage hero SHALL show the blog's technical subject, and each displayed article cover SHALL identify its article's subject or key mechanism without unrelated people or decorative stock imagery.

#### Scenario: Reader scans the homepage
- **WHEN** the homepage renders
- **THEN** the featured article and eight latest article images show distinct, subject-specific diagrams

### Requirement: Prompt static cover loading
Homepage cover assets SHALL load from the site's static origin with stable image dimensions. The lead image SHALL be prioritized, and recent article images SHALL be lazy loaded.

#### Scenario: Reader opens the homepage
- **WHEN** the page initially loads
- **THEN** the hero and lead image do not require the external image host, and below-the-fold article images do not compete for initial bandwidth
