/* Style Pack loader
 * Resolves which Style Pack a page should render with:
 *
 *   1. <meta name="style-pack" content="X">    (per-post override)
 *   2. <body data-style-pack="X">              (explicit on body)
 *   3. window.__DEFAULT_STYLE_PACK             (site default)
 *   4. fallback: "A"
 *
 * Then sets <body data-style-pack="X"> and lazy-loads /custom/style-packs/pack-X.css.
 *
 * Per-post usage: add to front matter
 *   meta:
 *     - name: style-pack
 *       content: B
 *
 * Site-wide default: set in _config.anzhiyu.yml inject.head before this script
 *   <script>window.__DEFAULT_STYLE_PACK = "A"</script>
 */
(function () {
  var VALID = ["A", "B", "C", "D", "E", "F"];
  var pack = null;

  var meta = document.querySelector('meta[name="style-pack"]');
  if (meta && meta.content) pack = meta.content.trim().toUpperCase();

  if (!pack && document.body && document.body.dataset.stylePack) {
    pack = document.body.dataset.stylePack.trim().toUpperCase();
  }
  if (!pack && typeof window.__DEFAULT_STYLE_PACK === "string") {
    pack = window.__DEFAULT_STYLE_PACK.trim().toUpperCase();
  }
  if (!pack || VALID.indexOf(pack) === -1) pack = "A";

  document.body.setAttribute("data-style-pack", pack);

  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/custom/style-packs/pack-" + pack + ".css";
  link.setAttribute("data-style-pack-link", pack);
  document.head.appendChild(link);
})();
