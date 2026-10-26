"use strict";

/**
 * 过滤掉自动化趋势类文章，用于首页、公众号精选等主入口。
 * 规则：
 * 1. front matter 中 hide_from_home: true 的文章
 * 2. 分类包含「GitHub周周趋势」的文章
 */
const TREND_CATEGORY = "GitHub周周趋势";

function categoryNames(post) {
  return post.categories && post.categories.data
    ? post.categories.data.map((category) => category.name)
    : [];
}

function isFeatured(post) {
  return post.hide_from_home !== true && !categoryNames(post).includes(TREND_CATEGORY);
}

hexo.extend.helper.register("featured_posts", function (posts, options = {}) {
  const { limit = 10 } = options;
  const filtered = posts.sort("-date").toArray().filter(isFeatured);

  return limit ? filtered.slice(0, limit) : filtered;
});

/**
 * 判断单篇文章是否属于趋势/隐藏类（用于模板内条件渲染）。
 */
hexo.extend.helper.register("is_featured_post", function (post) {
  return isFeatured(post);
});

hexo.extend.helper.register("trend_posts", function (posts, options = {}) {
  const { limit = 0 } = options;
  const filtered = posts
    .sort("-date")
    .toArray()
    .filter((post) => categoryNames(post).includes(TREND_CATEGORY));
  return limit ? filtered.slice(0, limit) : filtered;
});
