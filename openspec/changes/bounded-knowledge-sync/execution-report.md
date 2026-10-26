# Execution report

## Outcome

Implemented bounded sequential submissions in `tools/sync-knowledge.mjs`: at most 100 documents / 2,000,000 content characters per request, 200,000 per article, 60-second request timeout. Preserved article IDs, metadata and Git source timestamps; fixed absolute source paths and YAML Date handling. Incremental Git base failures safely fall back to full tracked-file upserts. Deleted files are not read or automatically unpublished. Existing deployment trigger remains unchanged.

Related backend work in `/Users/pengfanao/code/pfablog-admin` adds Spring AI 2.0.1 DashScope-compatible batch embedding, PostgreSQL leases, fenced writes, global concurrency/rate limits and Flyway V5. Default embedding model is text-embedding-v4 / 1536 dimensions. API acceptance does not mean embeddings have completed.

## Validation

- `node --check tools/sync-knowledge.mjs`: passed.
- `node --test tools/test-sync-knowledge.mjs`: 2 tests passed, covering 101-post batches and character-bound batches against a temporary local HTTP server and disposable Git repositories.
- `npm run audit:repo`: passed.
- Backend `TEST_PGVECTOR_URL=jdbc:postgresql://127.0.0.1:<disposable-port>/embedding_test ./mvnw test`: 31 tests passed, including PostgreSQL concurrency/lease fencing and local HTTP Spring AI client tests.
- `git diff --check`: passed in both repositories.

## Limits and rollback

No production deployment, database migration, full blog submission or paid model invocation was performed. There is no browser preview for this backend/script change. Enable the backend with DASHSCOPE_API_KEY and EMBEDDING_ENABLED=true after applying migrations; observe a small batch first. Article deletion propagation and RAG answer generation are outside this change.

The backend legacy synchronous endpoint now returns queued status. Source timestamps use the commit time of the article's last Git change; equal timestamps are resolved using server queue revisions. Keep unrelated existing local changes. Revert only this script/test/OpenSpec change to roll back the client; do not send unbounded batches to the new backend. Backend rollback requires explicit schema compatibility work, documented in its knowledge-embedding-pipeline.md.
