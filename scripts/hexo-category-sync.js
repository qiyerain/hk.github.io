/**
 * Hexo 分类目录同步插件
 * 在 hexo generate 前自动同步文章分类与目录结构
 */

'use strict';

const { syncCategories } = require('./category-sync');

hexo.on('generateBefore', function() {
  try {
    hexo.log.info('🔄 同步分类目录...');
    const { errors } = syncCategories();
    if (errors.length > 0) {
      throw new Error(`分类目录同步失败: ${errors.length} 个错误`);
    }
    hexo.log.info('✅ 分类目录同步完成');
  } catch (err) {
    hexo.log.error('⚠️ 分类目录同步失败:', err.message);
    throw err;
  }
});
