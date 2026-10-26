const { articleId } = require('../tools/article-id-core');

hexo.extend.filter.register('before_post_render', (data) => {
  if (!data.article_id) {
    data.article_id = articleId({
      title: data.title,
      date: data.date
    });
  }
  return data;
});
