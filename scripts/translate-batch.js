const fs = require('fs');

// Batch translate Pokemon descriptions using available model
// We'll translate in chunks to avoid rate limits

var pokemon = JSON.parse(fs.readFileSync('../data/pokemon.json', 'utf8'));

// Find Pokemon that need translation
var needTranslation = pokemon.filter(function(p) {
  return p.description && p.description.en && (!p.description.zh || p.description.zh === '一個棲息地。');
});

console.log('Pokemon needing zh translation:', needTranslation.length);

// For now, create a simple script that will be run by a sub-agent with model access
// We'll write the translation logic but actual translation needs model API

var output = [];
needTranslation.slice(0, 50).forEach(function(p) {
  output.push({
    id: p.id,
    name: p.name.en,
    description_en: p.description.en
  });
});

fs.writeFileSync('../data/translation-batch-1.json', JSON.stringify(output, null, 2), 'utf8');
console.log('Saved batch 1 (50 Pokemon) to translation-batch-1.json');