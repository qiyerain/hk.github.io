# Requirements

- Full synchronization MUST enumerate all tracked Markdown posts.
- Incremental synchronization MUST submit added/modified existing posts and avoid attempting to read deleted paths.
- Every request MUST obey backend document-count and character bounds.
- The client MUST preserve stable article IDs, relative source paths, metadata and content hashes.
- The client MUST report accepted batch IDs and MUST NOT claim embedding completion.
- Deletion propagation is not implemented by this change; full is a non-destructive upsert.
