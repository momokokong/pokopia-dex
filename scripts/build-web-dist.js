#!/usr/bin/env node
/**
 * PokopiaDex Web Distribution Builder for Capacitor Android Packaging
 * Cleanly copies all required static web assets into `dist/` without temporary/scraper bloat.
 */

const fs = require('fs');
const path = require('path');

const ROOT_HTML_FILES = [
  'index.html',
  'detail.html',
  'habitats.html',
  'habitat-detail.html',
  'quiz.html',
  'badges.html',
  'settings.html'
];

const ROOT_CSS_FILES = [
  'styles.css',
  'styles-badges.css',
  'styles-settings.css'
];

const ROOT_ASSET_FILES = [
  'app.js',
  'manifest.json',
  'sw.js'
];

const SELECTIVE_FILES = [
  'scripts/quiz.js',
  'scripts/qrcode.min.js',
  'data/pokemon.json',
  'data/habitat-data.js',
  'data/habitat-data.json',
  'data/habitat-images.js'
];

const FULL_DIRECTORIES = [
  'js',
  'assets'
];

function copyFileSafe(srcPath, destPath) {
  if (!fs.existsSync(srcPath)) {
    return false;
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  return true;
}

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    return 0;
  }
  fs.mkdirSync(destDir, { recursive: true });
  let count = 0;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      count += 1;
    }
  }
  return count;
}

function buildWebDist(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const distDir = options.distDir || path.join(rootDir, 'dist');
  const silent = Boolean(options.silent);

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  const copiedFiles = [];

  // Copy all root *.html and *.css plus explicit list
  const rootEntries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (!entry.isFile()) continue;
    if (entry.name.endsWith('.html') || entry.name.endsWith('.css') || ROOT_ASSET_FILES.includes(entry.name)) {
      const src = path.join(rootDir, entry.name);
      const dest = path.join(distDir, entry.name);
      if (copyFileSafe(src, dest)) {
        copiedFiles.push(entry.name);
      }
    }
  }

  // Ensure explicit root files if not already copied
  for (const file of [...ROOT_HTML_FILES, ...ROOT_CSS_FILES, ...ROOT_ASSET_FILES]) {
    if (!copiedFiles.includes(file)) {
      if (copyFileSafe(path.join(rootDir, file), path.join(distDir, file))) {
        copiedFiles.push(file);
      }
    }
  }

  // Copy selective files from scripts/ and data/
  for (const relPath of SELECTIVE_FILES) {
    if (copyFileSafe(path.join(rootDir, relPath), path.join(distDir, relPath))) {
      copiedFiles.push(relPath);
    }
  }

  // Copy full directories (js/, assets/)
  let dirFileCount = 0;
  for (const dirName of FULL_DIRECTORIES) {
    dirFileCount += copyDirRecursive(path.join(rootDir, dirName), path.join(distDir, dirName));
  }

  if (!silent) {
    console.log(`[build-web-dist] Cleanly packaged ${copiedFiles.length} core files + ${dirFileCount} directory assets into ${distDir}`);
  }

  return {
    distDir,
    copiedFiles,
    dirFileCount,
    totalFiles: copiedFiles.length + dirFileCount
  };
}

if (require.main === module) {
  buildWebDist();
}

module.exports = {
  buildWebDist,
  ROOT_HTML_FILES,
  ROOT_CSS_FILES,
  ROOT_ASSET_FILES,
  SELECTIVE_FILES,
  FULL_DIRECTORIES
};
