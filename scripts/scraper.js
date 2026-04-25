#!/usr/bin/env node
// PokopiaDex Scraper - Batch fetch all 300 Pokémon from pokopiadex.com
// Usage: node scraper.js [--start N] [--end N] [--batch N] [--delay ms]
const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const LIST_FILE = path.join(__dirname, 'pokopiadex-list.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'pokemon_scraped.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'scrape_progress.json');

// Ensure dirs exist
[DATA_DIR, RAW_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Parse args
const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf('--" + name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
}
const START = parseInt(getArg("start", "1"));
const END = parseInt(getArg("end", "300"));
const DELAY = parseInt(getArg("delay", "800")); // ms between requests
const BATCH = parseInt(getArg("batch", "10")); // save every N pokemon

// Load list
const list = JSON.parse(fs.readFileSync(LIST_FILE, 'utf8'));

// Load progress if exists
let progress = { completed: [], lastSaved: 0 };
if (fs.existsSync(PROGRESS_FILE)) {
  progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
}

// HTTP fetch with retry
function fetchUrl(url, retries = 3) {
  return new Promise((resolve, reject) => {
    function attempt(n) {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          if (loc) { attempt(loc.startsWith('http') ? 0 : -1); return fetchUrl(loc, n); }
        }
        if (res.statusCode !== 200) {
          res.resume();
          if (n > 0) { setTimeout(() => attempt(n - 1), 2000); return; }
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', err => {
        if (n > 0) { setTimeout(() => attempt(n - 1), 2000); return; }
        reject(err);
      });
    }
    attempt(retries);
  });
}

// Extract PokopiaDex data from page HTML/markdown
function parsePokopiaData(html, slug, pokopiaNum) {
  const result = {
    pokopia_id: pokopiaNum,
    slug: slug,
    description_en: '',
    types: [],
    specialties: [],
    habitat_biomes: [],
    rarity: '',
    ideal_habitat: '',
    favorites: [],
    loved_items: { furniture: [], food: [], misc: [] },
    abilities_taught: [],
    how_to_find: null
  };

  // Extract description - look for the first paragraph after the species name
  // Pattern: The description is usually after the specialties links
  const descMatch = html.match(/(?:specialties\/[^\n]*\n?)*\n([A-Z][^\n]+\.\n)/);
  if (descMatch) {
    result.description_en = descMatch[1].trim();
  }

  // Try alternative: description is after the specialties line, before "Where to Find"
  const altDesc = html.match(/(?:\/specialties\/[^\n]+\n*)+\n*([A-Z][^\n]+(?:\n[^\n]+)*?)\n+\d+'/);
  if (altDesc && !result.description_en) {
    result.description_en = altDesc[1].trim();
  }

  // Extract types from specialty URLs
  const typePatterns = {
    'Fire': /fire/i, 'Water': /water/i, 'Grass': /grass/i, 'Electric': /electric/i,
    'Normal': /normal/i, 'Poison': /poison/i, 'Flying': /flying/i, 'Rock': /rock/i,
    'Ghost': /ghost/i, 'Dragon': /dragon/i, 'Ice': /ice/i, 'Fighting': /fighting/i,
    'Psychic': /psychic/i, 'Steel': /steel/i, 'Dark': /dark/i, 'Fairy': /fairy/i,
    'Ground': /ground/i, 'Bug': /bug/i
  };

  // Extract specialties from /specialties/ URLs
  const specMatches = html.matchAll(/\/specialties\/([a-z-]+)/g);
  for (const m of specMatches) {
    const spec = m[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (!result.specialties.includes(spec)) {
      result.specialties.push(spec);
    }
  }

  // Extract biomes from "Where to Find" section
  // Pattern: #NNN\n\n### Biome Name\n\nRarity
  const biomeMatches = html.matchAll(/#(\d+)\n+###\s+([^\n]+)/g);
  for (const m of biomeMatches) {
    const biomeId = parseInt(m[1]);
    const biomeName = m[2].trim();
    // Get rarity after biome name
    const afterBiome = html.substring(m.index + m[0].length, m.index + m[0].length + 200);
    const rarityMatch = afterBiome.match(/^(Common|Rare|Uncommon|Very Rare|Special)/m);
    const rarity = rarityMatch ? rarityMatch[1] : 'Common';
    
    result.habitat_biomes.push({
      id: biomeId,
      name: biomeName,
      rarity: rarity
    });
  }

  // Extract "Ideal Habitat"
  const idealMatch = html.match(/Ideal Habitat\s+([A-Za-z]+)/);
  if (idealMatch) {
    result.ideal_habitat = idealMatch[1];
  }

  // Extract favorites from "Favorites" section
  const favSection = html.match(/Favorites\s+([\s\S]*?)(?:\n##|$)/);
  if (favSection) {
    const favText = favSection[1];
    const favItems = favText.match(/[A-Za-z][A-Za-z ]+/g);
    if (favItems) {
      result.favorites = favItems.map(f => f.trim()).filter(f => f.length > 2 && f.length < 40);
    }
  }

  // Extract loved items
  const lovedSection = html.match(/Loved Items[\s\S]*?(?:\n## Great Roommates|$)/);
  if (lovedSection) {
    const lovedText = lovedSection[0];
    // Parse furniture items
    const furnMatch = lovedText.match(/Furniture\s+([\s\S]*?)(?:Food|Misc\.|Misc|$)/);
    if (furnMatch) {
      const items = furnMatch[1].match(/^[A-Za-z][A-Za-z0-9 '&!-]+/gm);
      if (items) result.loved_items.furniture = items.map(i => i.trim()).filter(i => i.length > 2);
    }
    // Parse food items  
    const foodMatch = lovedText.match(/Food\s+([\s\S]*?)(?:Materials|Other|Buildings|Nature|Misc\.|$)/);
    if (foodMatch) {
      const items = foodMatch[1].match(/^[A-Za-z][A-Za-z0-9 '&!-]+/gm);
      if (items) result.loved_items.food = items.map(i => i.trim()).filter(i => i.length > 2);
    }
  }

  // Extract how_to_find for special Pokémon
  const howMatch = html.match(/how_to_find|How to Find[\s:]+([^\n]+)/i);
  if (howMatch) {
    result.how_to_find = howMatch[1].trim();
  }

  return result;
}

// Simple markdown-based parser using web_fetch readable output
function parseFromText(text, slug, pokopiaNum) {
  const result = {
    pokopia_id: pokopiaNum,
    slug: slug,
    description_en: '',
    types: [],
    specialties: [],
    habitat_biomes: [],
    rarity: 'Common',
    ideal_habitat: '',
    favorites: [],
    loved_items: { furniture: [], food: [], misc: [] },
    abilities_taught: [],
    how_to_find: null
  };

  // Description: first real sentence after specialty links
  // In the readability output, specialties appear as paths like /specialties/water
  // Then the description sentence follows
  
  // Find the description - it's the English prose after specialty URLs
  const lines = text.split('\n');
  let foundSpec = false;
  let descLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('/specialties/')) {
      foundSpec = true;
      continue;
    }
    if (foundSpec && lines[i].trim().length > 20 && /^[A-Z]/.test(lines[i].trim())) {
      // This looks like the description
      descLines.push(lines[i].trim());
      if (lines[i].includes('.')) break;
    }
    if (foundSpec && descLines.length > 0 && !lines[i].trim()) break;
  }
  result.description_en = descLines.join(' ').trim();

  // Specialties from /specialties/ URLs
  const specMatches = [...text.matchAll(/\/specialties\/([a-z-]+)/g)];
  for (const m of specMatches) {
    const spec = m[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (!result.specialties.includes(spec)) result.specialties.push(spec);
  }

  // Biomes from "Where to Find" section - pattern: #NNN then ### Name
  const biomePattern = /#(\d+)\s+###\s+([^\n]+)/g;
  let bm;
  while ((bm = biomePattern.exec(text)) !== null) {
    result.habitat_biomes.push({
      id: parseInt(bm[1]),
      name: bm[2].trim()
    });
  }

  // Rarity - look for Common/Rare/Uncommon after biome names
  const rarityPattern = /\n(Common|Rare|Uncommon|Very Rare|Special)\s*\n/g;
  const rarities = [...text.matchAll(rarityPattern)].map(m => m[1]);
  if (rarities.length > 0) result.rarity = rarities[0]; // use first rarity

  // Ideal Habitat
  const idealMatch = text.match(/Ideal Habitat\s*\n?\s*(Humid|Bright|Warm|Dark|Cool|Cold)/i);
  if (idealMatch) result.ideal_habitat = idealMatch[1];

  // Favorites
  const favSection = text.match(/Favorites\s*\n([\s\S]*?)(?:\n## |Loved Items|$)/);
  if (favSection) {
    result.favorites = favSection[1]
      .split(/[,\n]/)
      .map(f => f.trim())
      .filter(f => f.length > 2 && f.length < 40 && /^[A-Z]/.test(f));
  }

  // How to find (special Pokémon)
  const howSection = text.match(/How to Find[\s\S]*?\n([^\n]+)/i);
  if (howSection) result.how_to_find = howSection[1].trim();

  return result;
}

// Main
async function main() {
  const filtered = list.filter(p => p.num >= START && p.num <= END);
  const toProcess = filtered.filter(p => !progress.completed.includes(p.num));
  
  console.log(`Total in range: ${filtered.length}, Already done: ${filtered.length - toProcess.length}, To process: ${toProcess.length}`);
  
  let results = [];
  // Load existing results if any
  if (fs.existsSync(OUTPUT_FILE)) {
    results = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  }

  let count = 0;
  for (const pokemon of toProcess) {
    const url = `https://pokopiadex.com/pokedex/${pokemon.slug}`;
    console.log(`[${count + 1}/${toProcess.length}] Fetching #${pokemon.num} ${pokemon.name}...`);
    
    try {
      const html = await fetchUrl(url);
      
      // Save raw HTML for debugging
      fs.writeFileSync(path.join(RAW_DIR, `${pokemon.num}.html`), html);
      
      // Parse
      const data = parseFromText(html, pokemon.slug, pokemon.num);
      data.name_en = pokemon.name;
      data.pokopiadex_num = pokemon.num;
      
      results.push(data);
      progress.completed.push(pokemon.num);
      count++;
      
      // Save progress periodically
      if (count % BATCH === 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
        console.log(`  → Saved progress (${progress.completed.length} done)`);
      }
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      progress.completed.push(pokemon.num); // skip on failure
    }
    
    // Rate limiting
    if (count < toProcess.length) {
      await new Promise(r => setTimeout(r, DELAY));
    }
  }
  
  // Final save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
  console.log(`\nDone! ${progress.completed.length} Pokémon scraped. Results in ${OUTPUT_FILE}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });