/**
 * 分类目录同步脚本
 * 功能：检查文章的 categories 字段与物理目录是否匹配，不匹配则自动移动文件
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  postsDir: path.join(__dirname, '../source/_posts'),
  categories: ['后端', '前端', '运维', '其他'], // 支持的分类列表
  dryRun: false, // true = 只检查不移动，false = 实际移动
};

/**
 * 解析 Markdown 文件的 Front Matter
 */
function parseFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return { frontMatter: {}, content: content, rawFrontMatter: '' };
  }

  const frontMatterStr = match[1];
  const frontMatter = {};
  const lines = frontMatterStr.split('\n');
  let currentKey = null;
  let currentValue = [];

  // 解析 YAML Front Matter
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIndex = line.indexOf(':');

    if (colonIndex > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
      // 保存上一个 key 的值
      if (currentKey !== null) {
        frontMatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
        currentValue = [];
      }

      currentKey = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // 处理行内列表格式 [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        frontMatter[currentKey] = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
        currentKey = null;
      } else if (value) {
        currentValue = [value];
      } else {
        currentValue = [];
      }
    } else if (line.trim().startsWith('-') && currentKey !== null) {
      // 处理多行列表格式
      const item = line.trim().slice(1).trim().replace(/['"]/g, '');
      currentValue.push(item);
    }
  }

  // 保存最后一个 key
  if (currentKey !== null) {
    frontMatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
  }

  return {
    frontMatter,
    content: content.slice(match[0].length),
    rawFrontMatter: match[0]
  };
}

/**
 * 获取文章的分类
 */
function getCategory(frontMatter) {
  const categories = frontMatter.categories;

  if (!categories) {
    return null;
  }

  // 如果是数组，取第一个元素
  if (Array.isArray(categories) && categories.length > 0) {
    return categories[0];
  }

  // 如果是字符串
  if (typeof categories === 'string') {
    return categories;
  }

  return null;
}

/**
 * 递归获取所有 Markdown 文件
 */
function getAllMarkdownFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath, baseDir));
    } else if (item.endsWith('.md')) {
      files.push({
        path: fullPath,
        relativePath: path.relative(baseDir, fullPath),
        dir: path.dirname(path.relative(baseDir, fullPath))
      });
    }
  }

  return files;
}

/**
 * 同步分类目录
 */
function syncCategories() {
  console.log('🔍 开始检查分类目录...\n');

  const files = getAllMarkdownFiles(config.postsDir);
  const movedFiles = [];
  const updatedFiles = [];
  const errors = [];

  for (const file of files) {
    try {
      const { frontMatter, content, rawFrontMatter } = parseFrontMatter(file.path);
      const category = getCategory(frontMatter);

      // 从目录名推断分类
      const dirCategory = file.dir !== '.' ? file.dir : null;

      // 确定期望的目录
      let expectedDir = '.';
      let expectedCategory = category;

      // 如果文章有分类字段，使用它来确定目录
      if (category && config.categories.includes(category)) {
        expectedDir = category;
      }
      // 如果文章没有分类字段但在分类目录中，更新 Front Matter
      else if (!category && dirCategory && config.categories.includes(dirCategory)) {
        expectedCategory = dirCategory;
        expectedDir = dirCategory;

        // 更新 Front Matter
        if (!config.dryRun) {
          const updated = updateFrontMatter(file.path, frontMatter, dirCategory, content, rawFrontMatter);
          if (updated) {
            updatedFiles.push(file.path);
            console.log(`📝 ${file.relativePath}`);
            console.log(`   ✅ 添加分类: ${dirCategory}`);
            console.log('');
          }
        }
      }

      // 当前目录
      const currentDir = file.dir === '.' ? '.' : file.dir;

      // 检查是否需要移动（仅当有明确的分类且与当前目录不匹配时）
      if (category && config.categories.includes(category) && currentDir !== expectedDir) {
        const fileName = path.basename(file.path);
        const newPath = expectedDir === '.'
          ? path.join(config.postsDir, fileName)
          : path.join(config.postsDir, expectedDir, fileName);

        console.log(`📝 ${file.relativePath}`);
        console.log(`   当前目录: ${currentDir === '.' ? '根目录' : currentDir}`);
        console.log(`   期望目录: ${expectedDir === '.' ? '根目录' : expectedDir}`);
        console.log(`   分类字段: ${category}`);

        if (!config.dryRun) {
          // 确保目标目录存在
          const targetDir = path.dirname(newPath);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
            console.log(`   ✅ 创建目录: ${targetDir}`);
          }

          // 移动文件
          fs.renameSync(file.path, newPath);
          console.log(`   ✅ 已移动到: ${newPath}`);
          movedFiles.push({ from: file.path, to: newPath });
        }

        console.log('');
      }
    } catch (err) {
      errors.push({ file: file.path, error: err.message });
    }
  }

  // 输出统计
  console.log('============================');
  console.log(`📊 检查完成`);
  console.log(`   总文件数: ${files.length}`);

  if (config.dryRun) {
    console.log(`   需要移动: ${movedFiles.length} 个文件 (dry-run 模式)`);
  } else {
    console.log(`   已移动: ${movedFiles.length} 个文件`);
    console.log(`   已更新 Front Matter: ${updatedFiles.length} 个文件`);
  }

  if (errors.length > 0) {
    console.log(`   错误: ${errors.length} 个`);
    errors.forEach(e => console.log(`   - ${e.file}: ${e.error}`));
  }

  return { movedFiles, updatedFiles, errors };
}

/**
 * 更新 Front Matter，添加分类字段
 */
function updateFrontMatter(filePath, frontMatter, category, bodyContent, rawFrontMatter) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 如果已经有 categories 字段，不需要更新
  if (frontMatter.categories && frontMatter.categories.length > 0) {
    return false;
  }

  // 找到 Front Matter 的结束位置
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return false;

  const frontMatterLines = match[1].split('\n');

  // 在 date 字段后添加 categories
  const dateIndex = frontMatterLines.findIndex(line => line.startsWith('date:'));
  const insertIndex = dateIndex >= 0 ? dateIndex + 1 : frontMatterLines.length;
  frontMatterLines.splice(insertIndex, 0, `categories:`, `  - ${category}`);

  // 重新组装文件内容
  const newContent = '---\n' + frontMatterLines.join('\n') + '\n---' + bodyContent;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  return true;
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--dry-run')) {
    config.dryRun = true;
    console.log('⚠️  Dry-run 模式：只检查不移动文件\n');
  }

  const { errors } = syncCategories();
  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { syncCategories };
