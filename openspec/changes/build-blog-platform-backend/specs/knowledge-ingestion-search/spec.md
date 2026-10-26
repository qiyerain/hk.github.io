## ADDED Requirements

### Requirement: Sync and import source documents
The service SHALL accept authenticated Hexo synchronization and administrator uploads of Markdown, HTML and text-layer PDF files.

#### Scenario: Upload a supported file
- **WHEN** an administrator uploads a file with an allowed type and size
- **THEN** the service creates an import job, hashes the file and returns a preview summary

#### Scenario: Reject an unsupported file
- **WHEN** a client uploads an executable, oversized or unsupported file
- **THEN** the service rejects it with a validation error and creates no document

### Requirement: Preview and execute chunking
The service SHALL preview chunks before execution and SHALL store the selected strategy and source metadata.

#### Scenario: Confirm heading chunking
- **WHEN** an administrator previews and confirms a Markdown document with `heading` strategy
- **THEN** the service creates a stable article ID, ordered chunks and title-path metadata

#### Scenario: Retry failed extraction
- **WHEN** an import job fails during extraction or indexing
- **THEN** the administrator can inspect the error and retry without duplicating a successful document

### Requirement: Search with traceable results
The service SHALL return full-text or vector search results with article ID, title, canonical path, heading and snippet.

#### Scenario: Full-text search without embeddings
- **WHEN** no embedding provider is configured
- **THEN** full-text search remains available and does not return fabricated vector scores

#### Scenario: RAG citation
- **WHEN** a RAG answer is generated from retrieved chunks
- **THEN** the response includes citations that resolve to existing documents and source snippets
