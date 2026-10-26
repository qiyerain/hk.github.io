'use strict';

const searchGenerator = require('../node_modules/hexo-generator-searchdb/lib/xml_generator');
const archiveGenerator = require('../node_modules/hexo-generator-archive/lib/generator');

const TREND_CATEGORY = 'GitHub周周趋势';

function categories(post) {
  if (!post.categories) return [];
  const values = post.categories.toArray ? post.categories.toArray() : post.categories.data || [];
  return values.map(category => category.name);
}

function isTrend(post) {
  return categories(post).includes(TREND_CATEGORY);
}

function isFeatured(post) {
  return post.hide_from_home !== true && !isTrend(post);
}

hexo.extend.generator.register('archive', function (locals) {
  return archiveGenerator.call(this, { ...locals, posts: locals.posts.filter(isFeatured) });
});

hexo.extend.generator.register('xml', function (locals) {
  return searchGenerator.call(this, {
    ...locals,
    posts: locals.posts.filter(isFeatured)
  });
});

hexo.extend.generator.register('rss', async function (locals) {
  const limit = this.config.feed.limit || 10;
  const featured = locals.posts.filter(isFeatured).sort('-date').toArray().slice(0, limit);
  const trends = locals.posts.filter(isTrend).sort('-date').toArray().slice(0, limit);
  const template = `${this.base_dir}tools/templates/rss.ejs`;

  const render = (title, description, posts) => this.render.render({ path: template }, {
    title,
    description,
    siteUrl: this.config.url,
    language: this.config.language,
    buildDate: (posts[0] ? posts[0].date.toDate() : new Date()).toUTCString(),
    posts: posts.map(post => ({
      title: post.title,
      permalink: post.permalink,
      date: post.date.toDate().toUTCString(),
      content: String(post.content || '').replace(/]]>/g, ']]]]><![CDATA[>'),
      tags: post.tags && post.tags.toArray ? post.tags.toArray() : []
    }))
  });

  const [featuredXml, trendsXml] = await Promise.all([
    render(`${this.config.title} · 原创文章`, '技术、工具与成长主题的原创文章更新。', featured),
    render('GitHub趋势', '每周 GitHub 开源项目与工程趋势归档。', trends)
  ]);

  return [
    { path: 'rss.xml', data: featuredXml },
    { path: 'github-trends/rss.xml', data: trendsXml }
  ];
});
