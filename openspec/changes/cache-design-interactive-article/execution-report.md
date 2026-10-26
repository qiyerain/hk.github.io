## Outcome

Published a local Hexo source article under `source/_posts/后端/缓存设计实战.md`. It explains the supplied DOCX's cache architecture, key and TTL choices, stale reads, memory limits, and node-local consistency. Three original diagrams were uploaded through PicGo and embedded in the post. The article includes a two-level cache simulator with read, DB update, L1 invalidation, full invalidation, time advance, and reset actions.

## Decisions and execution

- Used the supplied DOCX as the primary case study. Kept its configuration values explicitly project-specific and corrected unconditional claims about refresh being asynchronous or local caches being strongly consistent.
- Kept CSS and JS scoped to the article. The article script uses `data-pjax` so it initializes after theme navigation, and prevents duplicate listeners.
- Used the original diagrams rather than reconstructing project-specific architecture from memory. PicGo returned the three article-specific OSS URLs used in the post.

## Validation

- `npm run build` passed after the final CSS change. Hexo generated `public/2026/10/19/后端/缓存设计实战/index.html`.
- `node --check source/js/cache-design.js` and `git diff --check` passed.
- `npm run audit:repo` passed.
- Browser at 1280px and 390px: no page-level horizontal overflow; the simulator was usable on both sizes. On 390px, article tables scroll within the content width.
- Browser interaction: after initial read, a DB update left L1 stale; clearing only L1 exposed stale L2; clearing both caused a DB read of the new version. Advancing 11 minutes expired L2 while L1 stayed populated. A navigation from the home page through PJAX initialized the script.
- All three uploaded image URLs responded with HTTP 200 and `image/jpeg`; the in-view two-level diagram loaded in the browser.
- Follow-up cover: generated with `pfa-content-generate-image` using the `data-terminal` template at 1080x460. The manifest reports complete SVG text, no detected text-box overlap, and a successful PNG conversion. Visually reviewed the PNG, uploaded it through PicGo, and updated the article's cover metadata.

## Deviations and remaining work

No WeChat draft or site deployment was requested. The new article exists in the local repository and must go through the site's normal deployment process before it is public. The source diagrams are screenshots, so their smallest labels are better viewed enlarged on a phone.

## Rollback

Remove the article, `source/css/cache-design.css`, `source/js/cache-design.js`, and this OpenSpec change. Uploaded OSS files can be removed separately if no longer referenced.
