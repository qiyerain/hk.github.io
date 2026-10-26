## ADDED Requirements

### Requirement: Context-aware navigation material
The site SHALL render the home navigation as hero-integrated at the top of the page and SHALL transition it to an inset floating glass surface after the reader scrolls. Non-home content pages SHALL render the readable floating surface immediately.

#### Scenario: Home page starts at the hero
- **WHEN** the home page is loaded at the top of the document
- **THEN** the navigation remains visually integrated with the hero without an opaque full-width bar

#### Scenario: Reader scrolls the home page
- **WHEN** the home page scroll position passes the navigation threshold
- **THEN** the navigation becomes an inset rounded glass surface with backdrop blur, an edge highlight, and a subtle shadow

#### Scenario: Reader opens a content page
- **WHEN** a post, archive, category, tag, or other content page is loaded
- **THEN** the navigation is immediately presented on a readable floating surface

### Requirement: Restrained elevated glass surfaces
The site SHALL apply the shared glass material only to elevated navigation and overlay controls, while prose and ordinary article cards remain solid or unframed.

#### Scenario: Search or menu is opened
- **WHEN** the reader opens search, a desktop menu, a mobile navigation sheet, or the mobile table of contents
- **THEN** the elevated surface uses consistent tint, blur, edge highlight, shadow, and visible keyboard focus states

#### Scenario: Reader scans article content
- **WHEN** ordinary article cards or prose are displayed
- **THEN** those surfaces do not receive the same high-blur floating treatment solely for decoration

### Requirement: Glass compatibility and motion fallback
The site SHALL remain readable without backdrop-filter support and SHALL avoid nonessential navigation motion when reduced motion is requested.

#### Scenario: Backdrop filtering is unsupported
- **WHEN** the browser does not support backdrop filtering
- **THEN** elevated controls use an opaque fallback with sufficient text contrast

#### Scenario: Reduced motion is enabled
- **WHEN** the reader requests reduced motion
- **THEN** navigation state changes occur without animated translation or scaling

