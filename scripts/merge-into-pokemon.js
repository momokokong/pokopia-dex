#!/usr/bin/env node
// Merge scraped_raw.json into pokemon.json, preserving existing zh/es translations
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SCRAPED_FILE = path.join(DATA_DIR, 'scraped_raw.json');
const POKEMON_FILE = path.join(DATA_DIR, 'pokemon.json');
const OUTPUT_FILE = POKEMON_FILE;

// PokeAPI name data cache
const POKEAPI_NAMES = {
  1: { zh: '妙蛙種子', en: 'Bulbasaur', es: 'Bulbasaur' },
  2: { zh: '妙蛙草', en: 'Ivysaur', es: 'Ivysaur' },
  3: { zh: '妙蛙花', en: 'Venusaur', es: 'Venusaur' },
  4: { zh: '小火龍', en: 'Charmander', es: 'Charmander' },
  5: { zh: '火恐龍', en: 'Charmeleon', es: 'Charmeleon' },
  6: { zh: '噴火龍', en: 'Charizard', es: 'Charizard' },
  7: { zh: '傑尼龜', en: 'Squirtle', es: 'Squirtle' },
  8: { zh: '卡咪龜', en: 'Wartortle', es: 'Wartortle' },
  9: { zh: '水箭龜', en: 'Blastoise', es: 'Blastoise' },
  10: { zh: '波波', en: 'Pidgey', es: 'Pidgey' },
  // Add more as needed - for now we rely on scraped name from slug
};

function main() {
  var scraped = JSON.parse(fs.readFileSync(SCRAPED_FILE, 'utf8'));
  var existing = JSON.parse(fs.readFileSync(POKEMON_FILE, 'utf8'));

  // Build lookup by pokopia_id (num in scraped = pokopia_id)
  var existingMap = {};
  existing.forEach(function(p) {
    existingMap[p.pokopia_id || p.id] = p;
  });

  var newPokemon = [];
  var updated = 0;
  var added = 0;

  scraped.forEach(function(s) {
    if (s.error) return; // Skip failed entries

    var existing = existingMap[s.num];

    // Derive English name from slug (e.g. "bulbasaur-001" -> "Bulbasaur")
    var nameEn = s.slug.replace(/-\d+$/, '').split('-').map(function(w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');

    // Build biome names from scraped data
    var biomes = (s.habitat_biomes || []).map(function(b) {
      var biomeNameEn = b.name;
      // Try to make it more readable
      if (biomeNameEn && biomeNameEn.match(/-\d+$/)) {
        biomeNameEn = biomeNameEn.replace(/-\d+$/, '').split('-').map(function(w) {
          return w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ');
      }
      return {
        id: b.id,
        name: { en: biomeNameEn }
      };
    });

    var entry = {
      id: s.num,  // pokopia_id doubles as id for now
      pokopia_id: s.num,
      pokedex_number: null, // Will be filled from PokeAPI mapping later
      name: {
        en: nameEn
      },
      description: {
        en: (s.description_en || '').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/').replace(/&amp;/g, '&')
      },
      types: s.types || [],
      rarity: s.rarity || 'Common',
      rarity_stars: s.rarity_stars || 1,
      habitat: {
        zone: '',
        biomes: biomes,
        time: 'All day',
        weather: 'All weather'
      },
      specialties: s.specialties || [],
      ideal_habitat: { en: s.ideal_habitat || '' },
      favorites: s.favorites || [],
      loved_items: s.loved_items || { furniture: [], food: [], misc: [] },
      teaches: s.teaches || null
    };

    if (existing) {
      // Merge: preserve existing zh/es translations
      if (existing.name && existing.name.zh) entry.name.zh = existing.name.zh;
      if (existing.name && existing.name.es) entry.name.es = existing.name.es;
      if (existing.description && existing.description.zh) entry.description.zh = existing.description.zh;
      if (existing.description && existing.description.es) entry.description.es = existing.description.es;
      if (existing.pokedex_number) entry.pokedex_number = existing.pokedex_number;
      if (existing.ideal_habitat && existing.ideal_habitat.zh) entry.ideal_habitat.zh = existing.ideal_habitat.zh;
      if (existing.ideal_habitat && existing.ideal_habitat.es) entry.ideal_habitat.es = existing.ideal_habitat.es;

      // Preserve biome zh/es names if they exist
      if (existing.habitat && existing.habitat.biomes) {
        existing.habitat.biomes.forEach(function(eb) {
          var nb = entry.habitat.biomes.find(function(b) { return b.id === eb.id; });
          if (nb && eb.name) {
            if (eb.name.zh) nb.name.zh = eb.name.zh;
            if (eb.name.es) nb.name.es = eb.name.es;
          }
        });
      }

      // Preserve collected state
      if (existing.collected) entry.collected = true;

      updated++;
    } else {
      added++;
    }

    newPokemon.push(entry);
  });

  // Sort by pokopia_id
  newPokemon.sort(function(a, b) { return a.pokopia_id - b.pokopia_id; });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newPokemon, null, 2));
  console.log('Merged! Updated: ' + updated + ', Added: ' + added + ', Total: ' + newPokemon.length);
  console.log('Output: ' + OUTPUT_FILE);
}

main();