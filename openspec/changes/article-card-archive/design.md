## Decisions

- `文章` is the only primary content navigation item. The archive page is the canonical chronological entry.
- Each archive page contains a responsive 3-column desktop / 1-column mobile grid of fixed-ratio cover cards. Cards show cover, date, directory/category, title, and a short description.
- Hexo's archive generator owns pagination and sorting (`-date`, 12 per page). Trend/hidden posts are excluded before pagination, and the template uses the paginated `page.posts` collection.
- `/dirs/` is a compact directory index linking to existing generated directory pages. It does not render article covers or nested topic cards.
- Existing local cover fallbacks under `source/img/covers` remain the failure path for missing remote media.

## Rollback

Revert the header, archive configuration, archive/dirs templates, styles, and OpenSpec files. Existing post URLs are unaffected.
