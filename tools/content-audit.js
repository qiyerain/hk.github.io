'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const frontMatter = require('hexo-front-matter');

const root = path.resolve(__dirname, '..');
const postsRoot = path.join(root, 'source', '_posts');
const imagesRoot = path.join(root, 'source', 'img');
const largeImageBytes = 2 * 1024 * 1024;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const posts = walk(postsRoot).filter(file => file.endsWith('.md'));
const placeholderAssetPattern = /https?:\/\/(?:[^/]+\.)?(?:example\.com|example\.org|example\.net)\b|your[-_.]?bucket|replace[-_.]?me/i;
const postContents = posts.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  return { file, content, data: frontMatter.parse(content) };
});
const missingDescriptions = posts.filter(file => {
  const data = frontMatter.parse(fs.readFileSync(file, 'utf8'));
  return !data.description && data.categories !== 'GitHub周周趋势' && !(data.categories || []).includes?.('GitHub周周趋势');
});
const postsWithPlaceholderAssets = postContents.filter(post => post.content.split(/\r?\n/).some(line => {
  const isMediaReference = /!\[[^\]]*\]\(|^(?:cover|top_img|wechat_cover):\s*/.test(line.trim());
  return isMediaReference && placeholderAssetPattern.test(line);
}));
const isTrend = data => data.categories === 'GitHub周周趋势' || (data.categories || []).includes?.('GitHub周周趋势');
const isLocalFallbackCover = cover => /^\/img\/covers\/cover-[1-8]\.webp$/i.test(cover);
const localCovers = postContents.filter(post => post.data.cover && !/^https:\/\//i.test(post.data.cover) && !isLocalFallbackCover(post.data.cover));
const invalidCoverUrls = postContents.filter(post => post.data.cover && (/^http:\/\//i.test(post.data.cover) || placeholderAssetPattern.test(post.data.cover)));
const missingCoverAlt = postContents.filter(post => post.data.cover && !post.data.cover_alt && !isTrend(post.data));
const invalidCoverPositions = postContents.filter(post => post.data.cover_position && !/^(?:left|center|right|top|bottom|\d{1,3}(?:\.\d+)?%)(?:\s+(?:left|center|right|top|bottom|\d{1,3}(?:\.\d+)?%))?$/.test(String(post.data.cover_position)));
const series = new Map();
postContents.filter(post => post.data.series).forEach(post => {
  if (!series.has(post.data.series)) series.set(post.data.series, []);
  series.get(post.data.series).push(post);
});
const seriesOrderIssues = [];
series.forEach((members, name) => {
  const orders = members.map(post => Number(post.data.series_order));
  const invalid = orders.some(order => !Number.isInteger(order) || order < 1);
  const duplicates = new Set(orders).size !== orders.length;
  if (invalid || duplicates) seriesOrderIssues.push({ name, members });
});
const albumFile = path.join(root, 'source', '_data', 'album.yml');
const albumPlaceholderCount = fs.existsSync(albumFile)
  ? (fs.readFileSync(albumFile, 'utf8').split(/\r?\n/).filter(line => placeholderAssetPattern.test(line)).length)
  : 0;

const imageFiles = walk(imagesRoot).filter(file => /\.(avif|gif|jpe?g|png|webp)$/i.test(file));
const largeImages = imageFiles.filter(file => fs.statSync(file).size > largeImageBytes);
const hashes = new Map();
imageFiles.forEach(file => {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (!hashes.has(hash)) hashes.set(hash, []);
  hashes.get(hash).push(file);
});
const duplicateGroups = Array.from(hashes.values()).filter(files => files.length > 1);

const relative = file => path.relative(root, file);
console.log(`Posts: ${posts.length}`);
console.log(`Original posts missing description: ${missingDescriptions.length}`);
missingDescriptions.slice(0, 10).forEach(file => console.log(`  - ${relative(file)}`));
if (missingDescriptions.length > 10) console.log(`  ... ${missingDescriptions.length - 10} more`);
console.log(`Published posts with placeholder assets: ${postsWithPlaceholderAssets.length}`);
postsWithPlaceholderAssets.slice(0, 10).forEach(post => console.log(`  - ${relative(post.file)}`));
if (postsWithPlaceholderAssets.length > 10) console.log(`  ... ${postsWithPlaceholderAssets.length - 10} more`);
console.log(`Album placeholder assets: ${albumPlaceholderCount}`);
console.log(`Local covers awaiting verified OSS migration: ${localCovers.length}`);
localCovers.slice(0, 10).forEach(post => console.log(`  - ${relative(post.file)}: ${post.data.cover}`));
if (localCovers.length > 10) console.log(`  ... ${localCovers.length - 10} more`);
console.log(`Invalid or placeholder cover URLs: ${invalidCoverUrls.length}`);
invalidCoverUrls.forEach(post => console.log(`  - ${relative(post.file)}: ${post.data.cover}`));
console.log(`Original covers missing cover_alt: ${missingCoverAlt.length}`);
missingCoverAlt.slice(0, 10).forEach(post => console.log(`  - ${relative(post.file)}`));
if (missingCoverAlt.length > 10) console.log(`  ... ${missingCoverAlt.length - 10} more`);
console.log(`Invalid cover_position values: ${invalidCoverPositions.length}`);
invalidCoverPositions.forEach(post => console.log(`  - ${relative(post.file)}: ${post.data.cover_position}`));
console.log(`Series order issues: ${seriesOrderIssues.length}`);
seriesOrderIssues.forEach(group => console.log(`  - ${group.name}: ${group.members.map(post => post.data.series_order || 'missing').join(', ')}`));
console.log(`Images over 2 MB: ${largeImages.length}`);
console.log(`Duplicate image groups: ${duplicateGroups.length}`);
duplicateGroups.slice(0, 5).forEach(files => console.log(`  - ${files.map(relative).join(' = ')}`));

// Historical body-image debt is reported for migration, while publication-contract
// violations in structured cover/series metadata fail the audit.
if (invalidCoverUrls.length || invalidCoverPositions.length || seriesOrderIssues.length) {
  process.exitCode = 1;
}
