// PokopiaDex Visual & Functional Test Suite
// Run: node scripts/test-suite.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3457';
const DIR = 'C:/home/node/.openclaw/workspace/pokopia-dex';

let passed = 0;
let failed = 0;
const results = [];

async function fetchPage(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(BASE + urlPath, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function test(name, condition, detail) {
  if (condition) {
    passed++;
    results.push(`✅ ${name}`);
  } else {
    failed++;
    results.push(`❌ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function runTests() {
  console.log('=== PokopiaDex Test Suite ===\n');

  // 1. File existence
  console.log('--- File Existence ---');
  const htmlFiles = ['index.html','detail.html','habitats.html','habitat-detail.html','badges.html','settings.html'];
  htmlFiles.forEach(f => {
    test(`File exists: ${f}`, fs.existsSync(path.join(DIR, f)));
  });

  const assetFiles = ['app.js','styles.css','styles-badges.css','styles-settings.css','manifest.json','sw.js'];
  assetFiles.forEach(f => {
    test(`File exists: ${f}`, fs.existsSync(path.join(DIR, f)));
  });

  const dataFiles = ['data/pokemon.json','data/habitat-data.json','data/habitat-data.js'];
  dataFiles.forEach(f => {
    test(`File exists: ${f}`, fs.existsSync(path.join(DIR, f)));
  });

  const iconFiles = ['assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/icon-maskable-192.png','assets/icons/icon-maskable-512.png'];
  iconFiles.forEach(f => {
    test(`File exists: ${f}`, fs.existsSync(path.join(DIR, f)));
  });

  // 2. HTML pages load correctly
  console.log('\n--- Page Loading ---');
  for (const page of ['/', '/index.html', '/detail.html', '/habitats.html', '/habitat-detail.html', '/badges.html', '/settings.html']) {
    try {
      const res = await fetchPage(page);
      test(`Page loads: ${page}`, res.status === 200, `status: ${res.status}`);
    } catch (e) {
      test(`Page loads: ${page}`, false, e.message);
    }
  }

  // 3. PWA integration
  console.log('\n--- PWA Integration ---');
  for (const f of htmlFiles) {
    const content = fs.readFileSync(path.join(DIR, f), 'utf8');
    test(`${f}: has manifest link`, content.includes('manifest.json'));
    test(`${f}: has theme-color`, content.includes('theme-color'));
    test(`${f}: has apple-touch-icon`, content.includes('apple-touch-icon'));
    test(`${f}: has SW registration`, content.includes('serviceWorker'));
  }

  // 4. Tab bar links
  console.log('\n--- Tab Bar Links ---');
  for (const f of htmlFiles) {
    const content = fs.readFileSync(path.join(DIR, f), 'utf8');
    test(`${f}: tab→index.html`, content.includes('href="index.html"'));
    test(`${f}: tab→habitats.html`, content.includes('href="habitats.html"'));
    test(`${f}: tab→badges.html`, content.includes('href="badges.html"'));
    test(`${f}: tab→settings.html`, content.includes('href="settings.html"'));
  }

  // 5. Language buttons on all pages
  console.log('\n--- Language Switching ---');
  for (const f of htmlFiles) {
    const content = fs.readFileSync(path.join(DIR, f), 'utf8');
    test(`${f}: has 🇹🇼 button`, content.includes('data-lang="zh"'));
    test(`${f}: has 🇺🇸 button`, content.includes('data-lang="en"'));
    test(`${f}: has 🇪🇸 button`, content.includes('data-lang="es"'));
  }

  // 6. I18N completeness for each page
  console.log('\n--- I18N Completeness ---');
  const i18nRequired = {
    'index.html': ['search_placeholder', 'tab_dex', 'type_Fire', 'type_Water'],
    'detail.html': ['tab_dex', 'description', 'specialties', 'collect_btn'],
    'habitats.html': ['tab_habitats'],
    'badges.html': ['tab_badges'],
    'settings.html': ['settings_title', 'settings_lang', 'settings_clear']
  };

  for (const [f, keys] of Object.entries(i18nRequired)) {
    const content = fs.readFileSync(path.join(DIR, f), 'utf8');
    for (const key of keys) {
      test(`${f}: has I18N key "${key}"`, content.includes(`"${key}"`));
    }
  }

  // 7. Data integrity
  console.log('\n--- Data Integrity ---');
  const pokemonData = JSON.parse(fs.readFileSync(path.join(DIR, 'data/pokemon.json'), 'utf8'));
  test('Pokemon count = 303', pokemonData.length === 303, `actual: ${pokemonData.length}`);

  // Check all have required fields
  let missingNames = 0, missingTypes = 0, missingDescEn = 0, missingDescZh = 0, missingDescEs = 0;
  let missingSprite = 0;
  pokemonData.forEach(p => {
    if (!p.name || !p.name.zh || !p.name.en || !p.name.es) missingNames++;
    if (!p.types || p.types.length === 0) missingTypes++;
    if (!p.description || !p.description.en) missingDescEn++;
    if (!p.description || !p.description.zh) missingDescZh++;
    if (!p.description || !p.description.es) missingDescEs++;
    if (!p.sprite_url) missingSprite++;
  });
  test('All 303 have zh/en/es names', missingNames === 0, `${missingNames} missing`);
  test('All 303 have types', missingTypes === 0, `${missingTypes} missing`);
  test('All 303 have description.en', missingDescEn === 0, `${missingDescEn} missing`);
  test('All 303 have description.zh', missingDescZh === 0, `${missingDescZh} missing`);
  test('All 303 have description.es', missingDescEs === 0, `${missingDescEs} missing`);
  test('Most have sprite_url (< 15 missing OK)', missingSprite < 15, `${missingSprite} missing`);

  // Check IDs are sequential 1-303
  const ids = pokemonData.map(p => p.id).sort((a,b) => a-b);
  test('IDs sequential 1-303', ids[0] === 1 && ids[302] === 303, `range: ${ids[0]}-${ids[302]}`);

  // 8. Manifest content
  console.log('\n--- Manifest ---');
  const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
  test('Manifest has name', !!manifest.name);
  test('Manifest has short_name', !!manifest.short_name);
  test('Manifest theme_color', manifest.theme_color === '#FF8C42');
  test('Manifest has icons', manifest.icons && manifest.icons.length >= 2);
  test('Manifest display standalone', manifest.display === 'standalone');

  // 9. Service Worker content
  console.log('\n--- Service Worker ---');
  const sw = fs.readFileSync(path.join(DIR, 'sw.js'), 'utf8');
  test('SW has install handler', sw.includes('install'));
  test('SW has activate handler', sw.includes('activate'));
  test('SW has fetch handler', sw.includes('fetch'));
  test('SW caches app shell', sw.includes('APP_SHELL'));
  test('SW has data cache strategy', sw.includes('DATA_CACHE'));

  // 10. CSS files referenced in HTML
  console.log('\n--- CSS References ---');
  const cssRefs = {
    'index.html': ['styles.css'],
    'detail.html': ['styles.css'],
    'habitats.html': ['styles.css'],
    'habitat-detail.html': ['styles.css'],
    'badges.html': ['styles.css', 'styles-badges.css'],
    'settings.html': ['styles.css', 'styles-settings.css']
  };

  for (const [f, cssFiles] of Object.entries(cssRefs)) {
    const content = fs.readFileSync(path.join(DIR, f), 'utf8');
    cssFiles.forEach(css => {
      test(`${f} includes ${css}`, content.includes(css));
    });
  }

  // Summary
  console.log('\n=== Test Results ===');
  results.forEach(r => console.log(r));
  console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review details above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

runTests().catch(e => {
  console.error('Test suite error:', e);
  process.exit(1);
});