const fs = require('fs');

// Build dynamic habitat data from pokemon.json
var pokemon = JSON.parse(fs.readFileSync('../data/pokemon.json', 'utf8'));

// Extract unique biomes and group Pokemon by biome
var biomeMap = {};

pokemon.forEach(function(p) {
  if (p.habitat && p.habitat.biomes) {
    p.habitat.biomes.forEach(function(biome) {
      var id = biome.id;
      if (!biomeMap[id]) {
        biomeMap[id] = {
          id: id,
          name: biome.name || { en: 'Biome ' + id },
          description: biome.description || {
            zh: '一個棲息地。',
            en: 'A habitat.',
            es: 'Un hábitat.'
          },
          image: biome.image || null,
          requirements: [{ item: { zh: '材料', en: 'Material', es: 'Material' }, count: 1 }],
          pokemon: []
        };
      }
      
      biomeMap[id].pokemon.push({
        id: p.id,
        pokedex_number: p.pokedex_number,
        name: p.name,
        rarity: biome.rarity || p.rarity || 'Common',
        zone: biome.zone || p.habitat.zone || ''
      });
    });
  }
});

// Sort Pokemon by rarity within each biome
var rarityOrder = { 'Very Rare': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
Object.keys(biomeMap).forEach(function(id) {
  biomeMap[id].pokemon.sort(function(a, b) {
    return (rarityOrder[a.rarity] || 4) - (rarityOrder[b.rarity] || 4);
  });
});

console.log('Built ' + Object.keys(biomeMap).length + ' habitats');

// Save as a JS module
var jsContent = 'const HABITAT_DATA = ' + JSON.stringify(biomeMap, null, 2) + ';\n';
fs.writeFileSync('../data/habitat-data.js', jsContent, 'utf8');
console.log('Saved habitat-data.js');

// Also save as JSON
fs.writeFileSync('../data/habitat-data.json', JSON.stringify(biomeMap, null, 2), 'utf8');
console.log('Saved habitat-data.json');