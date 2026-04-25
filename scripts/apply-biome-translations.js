const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const pokemonPath = path.join(dataDir, 'pokemon.json');
const translationsPath = path.join(dataDir, 'biome-translations.json');

// Read files
const pokemon = JSON.parse(fs.readFileSync(pokemonPath, 'utf-8'));
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'));

// Build lookup map: id -> { zh, es }
const translationMap = new Map();
for (const t of translations) {
  translationMap.set(t.id, { zh: t.zh, es: t.es });
}

console.log(`Loaded ${translationMap.size} biome translations`);

// Apply translations
let updatedCount = 0;
let skippedCount = 0;

for (const poke of pokemon) {
  if (!poke.habitat || !poke.habitat.biomes) continue;
  for (const biome of poke.habitat.biomes) {
    const t = translationMap.get(biome.id);
    if (t) {
      biome.name.zh = t.zh;
      biome.name.es = t.es;
      updatedCount++;
    } else {
      skippedCount++;
      console.warn(`No translation for biome id=${biome.id} en="${biome.name?.en}"`);
    }
  }
}

// Write back
fs.writeFileSync(pokemonPath, JSON.stringify(pokemon, null, 2), 'utf-8');

console.log(`\nDone!`);
console.log(`  Biomes updated: ${updatedCount}`);
console.log(`  Biomes skipped (no translation): ${skippedCount}`);