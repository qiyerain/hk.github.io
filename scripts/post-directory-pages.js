'use strict';

const pagination = require('hexo-pagination');

hexo.extend.generator.register('post-directory-pages', function (locals) {
  const perPage = this.config.per_page || 10;
  const paginationDir = this.config.pagination_dir || 'page';
  const directories = new Map();

  locals.posts.forEach(post => {
    const directory = getPostDirectory(post.source);
    if (!directory) return;

    const parts = directory.split('/');
    parts.forEach((name, index) => {
      const directoryPath = parts.slice(0, index + 1).join('/');
      if (!directories.has(directoryPath)) {
        directories.set(directoryPath, { name, path: directoryPath });
      }
    });
  });

  return Array.from(directories.values()).flatMap(directory => {
    const posts = locals.posts
      .filter(post => getPostDirectory(post.source) === directory.path)
      .sort('-date');

    return pagination(`directory/${directory.path}/`, posts, {
      perPage: posts.length ? perPage : 0,
      layout: ['index'],
      format: `${paginationDir}/%d/`,
      data: {
        type: 'post-directory',
        title: directory.name,
        top_img: false,
        postDirectoryName: directory.name,
        postDirectoryPath: directory.path
      }
    });
  });
});

function getPostDirectory(source) {
  const normalized = String(source || '').replace(/\\/g, '/');
  if (!normalized.startsWith('_posts/')) return '';

  const parts = normalized.replace(/^_posts\//, '').split('/').filter(Boolean);
  parts.pop();
  return parts.length ? parts.join('/') : '未分类';
}
