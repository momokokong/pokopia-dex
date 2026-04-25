#!/usr/bin/env node
// PokopiaDex Full Scraper v3 - Clean implementation
const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'scraped_raw.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const args = process.argv.slice(2);
const START = parseInt(args.indexOf('--start') >= 0 ? args[args.indexOf('--start') + 1] : 1);
const END = parseInt(args.indexOf('--end') >= 0 ? args[args.indexOf('--end') + 1] : 300);
const DELAY = 900;

function fetchUrl(url, tries = 3) {
  return new Promise((resolve, reject) => {
    const doReq = (n) => {
      const req = https.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchUrl(res.headers.location || url, tries).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) { res.resume(); if (n > 0) { setTimeout(() => doReq(n-1), 1500); return; } return reject(new Error('HTTP ' + res.statusCode)); }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      });
      req.on('error', e => { if (n > 0) { setTimeout(() => doReq(n-1), 1500); return; } reject(e); });
      req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
    };
    doReq(tries);
  });
}

async function getTypesFromPokeAPI(pokedexNum) {
  try {
    const data = await fetchUrl(`https://pokeapi.co/api/v2/pokemon/${pokedexNum}`, 2);
    const json = JSON.parse(data);
    return (json.types || []).map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1));
  } catch { return []; }
}

function parsePage(html, slug, num) {
  const r = { slug, num, description_en: '', types: [], specialties: [], habitat_biomes: [], rarity: 'Common', rarity_stars: 1, ideal_habitat: '', favorites: [], loved_items: { furniture: [], food: [], misc: [] }, how_to_find: null, teaches: null };

  // 1. Description
  const descm = html.match(/meta name="description" content="([^"]+)"/);
  if (descm) r.description_en = descm[1];

  // 2. Specialties & Types
  const typeSet = new Set(['fire','water','grass','electric','normal','poison','flying','rock','ghost','dragon','ice','fighting','psychic','steel','dark','fairy','ground','bug']);
  const specLinks = [...html.matchAll(/href="\/specialties\/([^"]+)"/g)].map(m => m[1]);
  r.specialties = [...new Set(specLinks.filter(s => !typeSet.has(s)))].map(s => s.split('-').map((w,i) => i===0 ? w.charAt(0).toUpperCase()+w.slice(1) : w).join(' '));

  // 3. Ideal Habitat
  const idealm = html.match(/Ideal Habitat<\/div><div class="detail-tag-row"><span class="detail-tag">([^<]+)/);
  if (idealm) r.ideal_habitat = idealm[1];

  // 4. Habitat biomes
  for (const b of html.matchAll(/href="\/habitats\/([^"]+)"/g)) {
    const idm = b[1].match(/-(\d+)$/);
    if (idm) { const nameM = b[0].match(/aria-label="([^"]+)/); r.habitat_biomes.push({ id: parseInt(idm[1]), name: nameM ? nameM[1] : b[1] }); }
  }

  // 5. Rarity
  const w2fIdx = html.indexOf('Where to Find');
  const stars = (html.substring(w2fIdx, w2fIdx + 3000).match(/fill="#f0c040"/g) || []).length;
  r.rarity_stars = Math.max(1, stars);
  r.rarity = stars >= 3 ? 'Rare' : stars >= 2 ? 'Uncommon' : 'Common';

  // 6. Favorites
  const favLinks = [...html.matchAll(/href="\/pokedex\/favorites\/([^"]+)"/g)].map(m => m[1]);
  r.favorites = [...new Set(favLinks.filter(f => !typeSet.has(f)))].map(f => f.split('-').map((w,i) => i===0 ? w.charAt(0).toUpperCase()+w.slice(1) : w).join(' '));

  // 7. Loved items
  const lovedStart = html.indexOf('Loved Items by');
  const lovedEnd = html.indexOf('Great Roommates for');
  if (lovedStart >= 0) {
    const ls = html.substring(lovedStart, lovedEnd > 0 ? lovedEnd : lovedStart + 300000);
    const labels = ['Furniture','Food','Misc.','Decorations','Nature','Materials','Other','Buildings','Outdoor'];
    const ends = {};
    labels.forEach(l => { const i = ls.indexOf(l); if (i >= 0) ends[l] = i; });

    function between(startName) {
      const si = ls.indexOf(startName);
      if (si < 0) return '';
      let ei = ls.length;
      Object.entries(ends).forEach(([n, i]) => { if (i > si && i < ei) ei = i; });
      return ls.substring(si + startName.length + 14, ei);
    }

    const miscParts = ['Misc.','Decorations','Outdoor','Buildings','Nature','Materials','Other'].map(between).filter(Boolean);
    r.loved_items.furniture = [...new Set([...between('Furniture').matchAll(/aria-label="([^"]+)"[^>]*href="\/items\//g)].map(m=>m[1]))].slice(0,60);
    r.loved_items.food = [...new Set([...between('Food').matchAll(/aria-label="([^"]+)"[^>]*href="\/items\//g)].map(m=>m[1]))].slice(0,30);
    r.loved_items.misc = [...new Set(miscParts.flatMap(p => [...p.matchAll(/aria-label="([^"]+)"[^>]*href="\/items\//g)].map(m=>m[1])))].slice(0,80);
  }

  // 8. Teaches
  const teachM = html.match(/Teaches<\/div><div class="detail-tag-row"><a class="detail-tag" href="\/abilities\/([^>"]+)"/);
  if (teachM) r.teaches = teachM[1].charAt(0).toUpperCase() + teachM[1].slice(1);

  return r;
}

async function main() {
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, 'pokopiadex-list.json'), 'utf8'));
  const toDo = list.filter(p => p.num >= START && p.num <= END);
  let existing = [];
  if (fs.existsSync(OUTPUT_FILE)) existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  const doneNums = new Set(existing.map(r => r.num));
  const remaining = toDo.filter(p => !doneNums.has(p.num));
  console.log(`[Scraper] Total=${toDo.length} Done=${doneNums.size} Remaining=${remaining.length}`);

  for (let i = 0; i < remaining.length; i++) {
    const p = remaining[i];
    const slug = p.name + '-' + String(p.num).padStart(3,'0');
    process.stdout.write(`[${i+1}/${remaining.length}] #${p.num} ${p.name}... `);
    try {
      const html = await fetchUrl('https://pokopiadex.com/pokedex/' + slug);
      const data = parsePage(html, slug, p.num);
      const types = await getTypesFromPokeAPI(p.num);
      if (types.length) data.types = types;
      existing.push(data);
      process.stdout.write(`OK types=${data.types.join(',')} biomes=${data.habitat_biomes.length} favs=${data.favorites.length} teaches=${data.teaches||'-'}\n`);
    } catch(e) {
      process.stdout.write(`FAIL(${e.message})\n`);
      existing.push({ slug, num: p.num, error: e.message });
    }
    if ((i+1) % 10 === 0) { fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing)); console.log(`  >> Saved ${existing.length}`); }
    if (i < remaining.length - 1) await new Promise(r => setTimeout(r, DELAY));
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing));
  console.log(`Done! ${existing.length} -> ${OUTPUT_FILE}`);
}
main().catch(e => { console.error(e); process.exit(1); });