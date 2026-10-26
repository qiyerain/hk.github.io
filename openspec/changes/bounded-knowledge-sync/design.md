# Design

Sequential requests contain at most 100 documents and 2,000,000 UTF-16 content characters, with each document limited to 200,000 characters. Fail on oversized individual articles. Detect added/modified Markdown using Git, exclude deleted files, and use a full tracked-file scan when incremental base history is unavailable. Source paths remain repository-relative. Include source commit timestamps so delayed older submissions cannot supersede newer article content. Backend replies acknowledge queued work; embeddings finish asynchronously.
