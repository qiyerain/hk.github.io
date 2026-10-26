## Approach

Use the supplied DOCX as the primary case study. Explain general cache principles separately from its project-specific Guava, Caffeine, Spring Cache, and in-memory instance choices. Host three selected source images through PicGo. Keep the interactive model deliberately small: an unbounded L1 instance, a 10-minute L2 configuration, and a versioned database row. Buttons advance the model and expose stale reads after a DB write.

The article loads its own CSS and `data-pjax` script. The script only initializes when the article's simulator exists and guards against duplicate initialization. The layout works without JavaScript as readable architecture and explanatory text remain in Markdown.

## Verification

Build Hexo, confirm article HTML and asset references, exercise all simulator controls on desktop and mobile, and run `npm run audit:repo`.

## Rollback

Remove the article, its CSS and JS, and the OpenSpec change. The uploaded images can remain unused in the image service.
