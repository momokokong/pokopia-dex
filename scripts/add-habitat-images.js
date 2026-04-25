const fs = require('fs');

// Read current pokemon.json
var pokemon = JSON.parse(fs.readFileSync('../data/pokemon.json', 'utf8'));

// Read habitat image mapping
var habitatMap = JSON.parse(fs.readFileSync('../data/habitat-image-map.json', 'utf8'));

// Add image field to each habitat in pokemon data
var updatedCount = 0;

pokemon.forEach(function(p) {
  if (p.habitat && p.habitat.biomes) {
    p.habitat.biomes.forEach(function(biome) {
      if (biome.id) {
        // Find the matching habitat in the map
        var slug = Object.keys(habitatMap).find(function(key) {
          return habitatMap[key].gwId === biome.id;
        });
        if (slug) {
          biome.image = habitatMap[slug].img;
          updatedCount++;
        }
      }
    });
  }
});

// Save updated pokemon.json
fs.writeFileSync('../data/pokemon.json', JSON.stringify(pokemon, null, 2), 'utf8');
console.log('Updated ' + updatedCount + ' habitat biome entries with images');

// Also create a flat mapping for use in JS
var jsMap = {};
Object.keys(habitatMap).forEach(function(slug) {
  jsMap[habitatMap[slug].gwId] = habitatMap[slug].img;
});

var jsContent = '// Auto-generated habitat image mapping\\n' +
  '// Usage: HABITAT_IMAGES[biomeId] = \"habitats/habitat_XXX.png\"\\n' +
  'const HABITAT_IMAGES = ' + JSON.stringify(jsMap, null, 2) + ';\\n';

fs.writeFileSync('../data/habitat-images.js', jsContent, 'utf8');
console.log('Saved habitat-images.js');