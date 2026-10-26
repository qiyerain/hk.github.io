## 1. Backend foundation

- [x] 1.1 Add PostgreSQL, Flyway, MyBatis XML, MapStruct, validation and Actuator dependencies; configure Java 26 profiles.
- [x] 1.2 Add Flyway baseline migration for analytics, knowledge, import, RAG and comment tables.
- [x] 1.3 Add shared API error model, request ID, CORS policy and health endpoints.

## 2. Analytics

- [x] 2.1 Implement page-view and reading-session event validation and idempotent persistence.
- [x] 2.2 Implement site, article and batch article summary queries.
- [x] 2.3 Add controller/service/mapper tests for valid reads, deduplication and unavailable data.

## 3. Knowledge ingestion and search

- [x] 3.1 Implement stable article ID and Hexo synchronization service using content hashes.
- [x] 3.2 Implement Markdown, sanitized HTML and text-layer PDF extraction adapters.
- [x] 3.3 Implement import job upload, preview, execute, status and cancellation endpoints with limits.
- [x] 3.4 Implement heading/fixed/page chunking and persist source metadata.
- [x] 3.5 Implement PostgreSQL full-text search and a vector search port with explicit provider-not-configured behavior.
- [x] 3.6 Implement RAG query response contracts with validated document citations.
- [x] 3.7 Add parser, chunker, sync and search tests using fixtures.

## 4. Comments

- [x] 4.1 Implement guest comment, reply, author-token edit/delete and moderation state transitions.
- [x] 4.2 Implement oldest/newest/hot ordering and idempotent reactions.
- [x] 4.3 Add Markdown sanitization, rate-limit hooks and comment API tests.

## 5. Delivery

- [x] 5.1 Add Dockerfile, Compose example, production configuration template and migration documentation.
- [x] 5.2 Add GitHub Actions Java 26 test, image build, GHCR push and SSH rollout workflow.
- [x] 5.3 Add deployment health check, rollback notes and Nginx proxy example without real credentials.

## 6. Blog integration and documentation

- [x] 6.1 Add the deployment tutorial article to the Hexo blog without real IPs, passwords or keys.
- [x] 6.2 Add the homepage batch analytics client contract and graceful API-failure behavior.
- [x] 6.3 Run backend tests, Hexo build and `npm run audit:repo`; write execution report.
- [x] 6.4 Expand the architecture document with Spring AI boundaries, complete table field dictionaries, Mermaid module flows and detailed Hexo Markdown synchronization steps.
