"use strict";

const { escapeHTML } = require("hexo-util");

hexo.extend.helper.register("post_directory_nav", function (currentPage = {}) {
  const env = this;
  const posts = env.site && env.site.posts;
  if (!posts || !posts.length) return "";

  const root = createNode("root");
  const currentSource = normalizeSource(currentPage.source || "");
  const currentDirectory = normalizeSource(currentPage.postDirectoryPath || "").replace(/^\/+|\/+$/g, "");

  posts.forEach(post => {
    if (post.published === false || !post.source) return;

    const source = normalizeSource(post.source);
    if (!source.startsWith("_posts/")) return;

    const rel = source.replace(/^_posts\//, "");
    const parts = rel.split("/").filter(Boolean);
    const filename = parts.pop();
    if (!filename) return;

    const dirs = parts.length ? parts : ["未分类"];
    let node = root;
    dirs.forEach((dir, index) => {
      const directoryPath = dirs.slice(0, index + 1).join("/");
      if (!node.children.has(dir)) node.children.set(dir, createNode(dir, directoryPath));
      node = node.children.get(dir);
    });

    node.posts.push({
      title: post.title || filename.replace(/\.(md|markdown)$/i, ""),
      url: env.url_for(post.path || post.permalink || post.link || ""),
      source,
      active: source === currentSource,
      date: post.date ? post.date.valueOf() : 0
    });
  });

  annotate(root, currentDirectory);
  sortNode(root);

  const topNodes = Array.from(root.children.values());
  if (!topNodes.length) return "";

  return `
    <nav class="post-directory-nav" aria-label="文章导航">
      <div class="post-directory-nav__inner">
        <div class="post-directory-nav__headline">
          <i class="anzhiyufont anzhiyu-icon-box-archive"></i>
          <span>文章导航</span>
        </div>
        <div class="post-directory-tree">
          ${topNodes.map(node => renderNode(node, 0)).join("")}
        </div>
      </div>
    </nav>
  `;
});

function createNode(name, path = "") {
  return {
    name,
    path,
    children: new Map(),
    posts: [],
    count: 0,
    hasActive: false,
    selected: false
  };
}

function normalizeSource(source) {
  return String(source).replace(/\\/g, "/");
}

function annotate(node, currentDirectory) {
  node.count = node.posts.length;
  node.selected = Boolean(node.path && node.path === currentDirectory);
  let hasActive = node.posts.some(post => post.active);

  node.children.forEach(child => {
    annotate(child, currentDirectory);
    hasActive = hasActive || child.hasActive;
  });

  node.hasActive = hasActive || node.selected;
}

function sortNode(node) {
  node.children = new Map(
    Array.from(node.children.entries()).sort(([a], [b]) => a.localeCompare(b, "zh-CN"))
  );
  node.posts.sort((a, b) => b.date - a.date || a.title.localeCompare(b.title, "zh-CN"));
  node.children.forEach(sortNode);
}

function renderNode(node, level) {
  const childNodes = Array.from(node.children.values());
  const hasChildren = childNodes.length > 0 || node.posts.length > 0;
  const childrenHtml = [
    ...childNodes.map(child => renderNode(child, level + 1)),
    ...node.posts.map(post => renderPost(post, level + 1))
  ].join("");
  const directoryUrl = `/directory/${node.path.split("/").map(encodeURIComponent).join("/")}/`;

  return `
    <div class="post-dir-node post-dir-level-${level}${node.hasActive ? " is-active-branch" : ""}${node.selected ? " is-selected" : ""}" data-dir-node data-directory-path="${escapeHTML(node.path)}">
      <div class="post-dir-summary">
        ${hasChildren
          ? `<button class="post-dir-toggle" type="button" aria-expanded="false" aria-label="展开或收起 ${escapeHTML(node.name)}"></button>`
          : `<span class="post-dir-toggle-placeholder" aria-hidden="true"></span>`}
        <a class="post-dir-name" href="${directoryUrl}" data-post-directory-link${node.selected ? ' aria-current="page"' : ""}>${escapeHTML(node.name)}</a>
        <span class="post-dir-count">${node.count}</span>
      </div>
      <div class="post-dir-children" hidden>
        ${childrenHtml}
      </div>
    </div>
  `;
}

function renderPost(post, level) {
  return `
    <a class="post-dir-link post-dir-level-${level}${post.active ? " is-active" : ""}" href="${escapeHTML(post.url)}" title="${escapeHTML(post.title)}">
      <span>${escapeHTML(post.title)}</span>
    </a>
  `;
}
