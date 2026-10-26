'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..');
const albumFile = path.join(root, 'source', '_data', 'album.yml');
const curatedRoot = path.join(root, 'source', 'img', 'curated');
const apply = process.argv.includes('--apply');
const deleteUnreferenced = process.argv.includes('--delete-unreferenced');

function hash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function localPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/img/curated/')) return null;
  return path.join(root, 'source', value);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const collections = yaml.load(fs.readFileSync(albumFile, 'utf8')) || [];
const seenSources = new Set();
const seenImages = new Set();
const seenHashes = new Set();
const removedEntries = [];

for (const collection of collections) {
  const entries = Array.isArray(collection.album_list) ? collection.album_list : [];
  collection.album_list = entries.filter(entry => {
    const images = Array.isArray(entry.image) ? entry.image : [];
    const source = String(entry.source_page || '').trim().replace(/\/$/, '');
    const image = String(images[0] || '').trim();
    const file = localPath(image);
    const digest = file && fs.existsSync(file) ? hash(file) : String(entry.sha256 || '');
    const duplicate = (source && seenSources.has(source)) || (image && seenImages.has(image)) || (digest && seenHashes.has(digest));
    if (duplicate) {
      removedEntries.push({ collection: collection.name, image, source, digest });
      return false;
    }
    if (source) seenSources.add(source);
    if (image) seenImages.add(image);
    if (digest) {
      seenHashes.add(digest);
      entry.sha256 = digest;
    }
    return true;
  });
  const firstImage = collection.album_list[0] && collection.album_list[0].image && collection.album_list[0].image[0];
  if (firstImage) {
    collection.cover = firstImage;
    collection.top_background = firstImage;
  }
}

let nextYaml = yaml.dump(collections, {
  noRefs: true,
  noCompatMode: true,
  lineWidth: 140,
  quotingType: '"',
  forceQuotes: false,
});

const allImages = walk(curatedRoot).filter(file => /\.(?:jpe?g|png|webp|avif)$/i.test(file));
const filesByHash = new Map();
for (const file of allImages) {
  const digest = hash(file);
  if (!filesByHash.has(digest)) filesByHash.set(digest, []);
  filesByHash.get(digest).push(file);
}

const sourceFiles = walk(path.join(root, 'source')).filter(file => file !== albumFile && !file.startsWith(curatedRoot) && fs.statSync(file).size < 5 * 1024 * 1024);
const sourceText = sourceFiles.map(file => {
  try { return fs.readFileSync(file, 'utf8'); } catch (error) { return ''; }
}).join('\n') + '\n' + nextYaml;
const relativeUrl = file => '/' + path.relative(path.join(root, 'source'), file).split(path.sep).join('/');
const deletedFiles = [];
const deletedFileSet = new Set();
let reclaimedBytes = 0;

function scheduleDeletion(file) {
  const relative = path.relative(root, file);
  if (deletedFileSet.has(relative) || sourceText.includes(relativeUrl(file))) return;
  deletedFileSet.add(relative);
  deletedFiles.push(relative);
  reclaimedBytes += fs.statSync(file).size;
}

for (const files of filesByHash.values()) {
  if (files.length < 2) continue;
  const referenced = files.filter(file => sourceText.includes(relativeUrl(file)));
  const canonical = referenced[0] || files[0];
  for (const file of files) {
    if (file === canonical) continue;
    scheduleDeletion(file);
  }
}

for (const entry of removedEntries) {
  const file = localPath(entry.image);
  if (file && fs.existsSync(file)) scheduleDeletion(file);
}

if (apply) fs.writeFileSync(albumFile, nextYaml);
if (apply && deleteUnreferenced) deletedFiles.forEach(file => fs.unlinkSync(path.join(root, file)));

const result = {
  mode: apply ? 'apply' : 'check',
  collections: collections.length,
  entriesRemoved: removedEntries.length,
  entriesRemaining: collections.reduce((total, collection) => total + collection.album_list.length, 0),
  exactHashGroups: [...filesByHash.values()].filter(files => files.length > 1).length,
  unreferencedDuplicateFiles: deletedFiles.length,
  reclaimableBytes: reclaimedBytes,
  filesDeleted: apply && deleteUnreferenced ? deletedFiles.length : 0,
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
if (!apply && (result.entriesRemoved || result.unreferencedDuplicateFiles)) process.exitCode = 1;
