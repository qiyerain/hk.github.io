## Outcome

Navigation persistence, reward QR usability, and the Android-to-Mac article cover are implemented. The generated cover is uploaded to OSS, assigned in article front matter, and present in the generated article, homepage, and archive output.

## Implemented Scope

- Allowed the fixed page header to escape its original overflow clipping boundary.
- Kept all five primary desktop navigation links visible in both scroll directions.
- Raised the fixed glass navigation above homepage and article media.
- Rebuilt reward presentation as a centered desktop panel and viewport-centered mobile panel.
- Added 48px desktop separation and 30px stacked mobile separation between payment targets.
- Produced focused 650px and 760px square QR assets from the original high-resolution payment images.
- Generated and visually inspected a 1672x941 hand-drawn scrcpy workflow cover with the required phone, terminal, USB, and mirrored laptop composition.
- Uploaded the final no-logo cover through PicGo and added its URL and descriptive alternative text to `source/_posts/工具/安卓投屏mac.md`.

## Decisions and Process

- Custom overrides remain in `source/custom/xiaoao-redesign.css`; vendored AnZhiyu files were not modified.
- The original full payment images remain in place. New focused assets are additive and selected through `_config.anzhiyu.yml`.
- Browser tests used a temporary local Hexo server and the per-task `agent-browser` session.
- The native image tool was unavailable in the active custom-provider session, so the approved CLI fallback used the same CC Switch provider credentials without persisting them in the repository.
- The first generated candidate was rejected because it contained recognizable brand icons. A second prompt strengthened the no-logo constraint and produced the selected final image.

## Validation

- `node --check source/js/xiaoao-site.js` - passed.
- `git diff --check` - passed.
- `npx hexo clean && npx hexo generate` - passed, 316 files generated.
- `npm run audit:content` - passed with pre-existing inventory warnings.
- `npm run test:image-pipeline` - passed all transform, MIME, dedupe, retry, and success cases.
- `openspec validate stabilize-navigation-reward-and-android-cover` - passed.
- `npm run audit:repo` - failed only on the pre-existing root `.DS_Store` ownership violation.
- `npx hexo generate` - passed, 174 files generated after applying the cover.
- `npm run audit:content` - passed after applying the cover; invalid cover URLs and invalid positions both remain zero.
- `curl -I -L --fail https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/cover-android-mac-scrcpy-v2.png` - passed with HTTP 200 and `Content-Type: image/png`.
- Generated HTML contains the new cover URL in the article, homepage, and archive pages; listing views contain the descriptive `cover_alt` text.
- Final cover inspection confirmed clean required labels, a clear left-to-right workflow, no watermark, and no recognizable brand logo.
- Desktop browser at 1440x900, scrollY 1150: page header overflow `visible`, z-index `90`, navigation at y=12..72, menu transform `none`, all five links hit above page content.
- Mobile browser at 390x844: reward panel at x=25..365; both QR images rendered at 220x220 with a 30px vertical gap.

## Remaining Work

- The completed OpenSpec change remains active until archival is explicitly requested.

## Rollback

Revert the section 26 rules in `source/custom/xiaoao-redesign.css`, restore the two reward image paths in `_config.anzhiyu.yml`, remove the two focused QR assets, and clear the Android article's `cover` and `cover_alt` values. The uploaded OSS cover can then be removed through PicGo or OSS administration. No dependency or data migration is required.
