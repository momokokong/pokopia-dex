const fs = require('fs');
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function parsePage(html, slug, num) {
  const r = {
    slug, num,
    description_en: '',
    types: [],
    specialties: [],
    habitat_biomes: [],
    rarity: 'Common',
    rarity_stars: 1,
    ideal_habitat: '',
    favorites: [],
    loved_items: { furniture: [], food: [], misc: [] },
    how_to_find: null,
    teaches: null
  };

  // 1. Description
  const descm = html.match(/meta name="description" content="([^"]+)"/);
  if (descm) r.description_en = descm[1];

  // 2. Types from specialty links
  const typeSet = new Set(['fire','water','grass','electric','normal','poison','flying','rock','ghost','dragon','ice','fighting','psychic','steel','dark','fairy','ground','bug']);
  const specLinks = [...html.matchAll(/href="\/specialties\/([^"]+)"/g)].map(m => m[1]);
  r.types = [...new Set(specLinks.filter(s => typeSet.has(s)))].map(s => s.split('-').map((w,i) => i===0 ? w.charAt(0).toUpperCase()+w.slice(1) : w).join(' '));
  r.specialties = [...new Set(specLinks.filter(s => !typeSet.has(s)))].map(s => s.split('-').map((w,i) => i===0 ? w.charAt(0).toUpperCase()+w.slice(1) : w).join(' '));

  // 3. Ideal Habitat
  const idealm = html.match(/Ideal Habitat<\/div><div class="detail-tag-row"><span class="detail-tag">([^<]+)/);
  if (idealm) r.ideal_habitat = idealm[1];

  // 4. Habitat biomes
  const biomeLinks = [...html.matchAll(/href="\/habitats\/([^"]+)"/g)];
  for (const b of biomeLinks) {
    const idm = b[1].match(/-(\d+)$/);
    if (idm) {
      const nameM = b[0].match(/aria-label="([^"]+)/);
      r.habitat_biomes.push({ id: parseInt(idm[1]), name: nameM ? nameM[1] : b[1] });
    }
  }

  // 5. Rarity (stars in Where to Find section)
  const w2fIdx = html.indexOf('Where to Find');
  const w2fChunk = html.substring(w2fIdx, w2fIdx + 3000);
  const stars = (w2fChunk.match(/fill="#f0c040"/g) || []).length;
  r.rarity_stars = Math.max(1, stars);
  r.rarity = stars >= 3 ? 'Rare' : stars >= 2 ? 'Uncommon' : 'Common';

  // 6. Favorites
  const favLinks = [...html.matchAll(/href="\/pokedex\/favorites\/([^"]+)"/g)].map(m => m[1]);
  r.favorites = [...new Set(favLinks.filter(f => !typeSet.has(f)))].map(f => f.split('-').map((w,i) => i===0 ? w.charAt(0).toUpperCase()+w.slice(1) : w).join(' '));

  // 7. Loved items - parse the ENTIRE loved items section
  // The Loved Items section goes from "Loved Items by X" to "Great Roommates for X"
  const lovedStart = html.indexOf('Loved Items by');
  const lovedEnd = html.indexOf('Great Roommates for');
  if (lovedStart >= 0) {
    const lovedSection = html.substring(lovedStart, lovedEnd > 0 ? lovedEnd : lovedStart + 300000);

    // Find each section label and parse items until the next section label
    const sectionNames = ['Furniture', 'Food', 'Misc.', 'Decorations', 'Nature', 'Materials', 'Other', 'Buildings', 'Outdoor'];
    const sectionEnds = {};
    for (const name of sectionNames) {
      const idx = lovedSection.indexOf(name);
      if (idx >= 0) {
        sectionEnds[name] = idx;
      }
    }

    function extractItemsBetween(startName, endName) {
      const startIdx = lovedSection.indexOf(startName);
      if (startIdx < 0) return [];
      const searchFrom = startIdx + startName.length + 14; // skip '>' + label + '</div>'
      // Find the next section name
      let endIdx = lovedSection.length;
      for (const [name, idx] of Object.entries(sectionEnds)) {
        if (idx > startIdx && (endIdx === lovedSection.length || idx < endIdx)) {
          endIdx = idx;
        }
      }
      const chunk = lovedSection.substring(searchFrom, endIdx);
      const items = [...new Set([...chunk.matchAll(/aria-label="([^"]+)"[^>]*href="\/items\//g)].map(m => m[1]))];
      return items;
    }

    r.loved_items.furniture = extractItemsBetween('Furniture', 'Food').slice(0, 60);
    r.loved_items.food = extractItemsBetween('Food', 'Misc.').slice(0, 30);
    r.loved_items.misc = [
      ...extractItemsBetween('Misc.', 'Decorations'),
      ...extractItemsBetween('Decorations', 'Nature'),
      ...extractItemsBetween('Outdoor', 'Buildings'),
      ...extractItemsBetween('Buildings', 'Nature'),
      ...extractItemsBetween('Nature', 'Materials'),
      ...extractItemsBetween('Materials', 'Other')
    ].slice(0, 80);
  }

  // 8. Teaches (ability)
  const teachIdx = html.indexOf('Teaches</div>');
  if (teachIdx > 0) {
    const chunk = html.substring(teachIdx, teachIdx + 500);
    const abM = chunk.match(/aria-label="([^"]+)"/);
    if (abM) r.teaches = abM[1];
  }

  return r;
}

(async () => {
  const html = await fetchUrl('https://pokopiadex.com/pokedex/bulbasaur-001');
  const data = parsePage(html, 'bulbasaur-001', 1);
  console.log(JSON.stringify(data, null, 2));
})().catch(console.error);
