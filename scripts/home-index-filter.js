'use strict';

const pagination = require('hexo-pagination');

hexo.extend.generator.register('index', function(locals) {
  const config = this.config;
  const indexConfig = config.index_generator || {};
  const hiddenCategories = new Set(indexConfig.exclude_categories || []);
  const hiddenFlags = indexConfig.exclude_front_matter || ['hide_from_home'];

  const posts = locals.posts
    .filter(post => {
      const hasHiddenFlag = hiddenFlags.some(flag => post[flag] === true);
      const inHiddenCategory = post.categories && post.categories.data.some(category => hiddenCategories.has(category.name));
      return !hasHiddenFlag && !inHiddenCategory;
    })
    .sort(indexConfig.order_by || '-date');

  posts.data.sort((a, b) => (b.sticky || 0) - (a.sticky || 0));

  return pagination(indexConfig.path || '', posts, {
    perPage: indexConfig.per_page,
    layout: ['index', 'archive'],
    format: `${config.pagination_dir || 'page'}/%d/`,
    data: {
      __index: true
    }
  });
});
