const fs = require('fs');

// Fix pokemon.json ID mismatch:
// - Toxtricity should be id=197 (PokopiaDex #197), not id=300
// - Mew should remain id=300 (PokopiaDex #300)
// - Need to insert Toxtricity at position 196 (index 196) and shift array

var pokemon = JSON.parse(fs.readFileSync('../data/pokemon.json', 'utf8'));

console.log('Before fix:');
console.log('  Total:', pokemon.length);
console.log('  Mew id:', pokemon.find(function(p) { return p.name.en === 'Mew'; }).id);
console.log('  Toxtricity id:', pokemon.find(function(p) { return p.name.en === 'Toxtricity'; }).id);

// Find Toxtricity and Mew
var toxIdx = pokemon.findIndex(function(p) { return p.name.en === 'Toxtricity'; });
var mewIdx = pokemon.findIndex(function(p) { return p.name.en === 'Mew'; });

console.log('  Toxtricity index:', toxIdx);
console.log('  Mew index:', mewIdx);

// Remove Toxtricity from current position
var toxtricity = pokemon.splice(toxIdx, 1)[0];

// Fix Mew's id to 300
pokemon.find(function(p) { return p.name.en === 'Mew'; }).id = 300;

// Insert Toxtricity at position 196 (index 196, which is id=197)
toxtricity.id = 197;
pokemon.splice(196, 0, toxtricity);

// Now reassign all ids to be sequential 1-303
for(var i=0; i<pokemon.length; i++) {
  pokemon[i].id = i + 1;
}

console.log('\nAfter fix:');
console.log('  Total:', pokemon.length);
console.log('  Mew id:', pokemon.find(function(p) { return p.name.en === 'Mew'; }).id);
console.log('  Toxtricity id:', pokemon.find(function(p) { return p.name.en === 'Toxtricity'; }).id);

// Verify no gaps
var ids = pokemon.map(function(p) { return p.id; }).sort(function(a,b){return a-b;});
var missing = [];
for(var i=1; i<=303; i++) {
  if(!ids.includes(i)) missing.push(i);
}
console.log('  Missing IDs:', missing.length === 0 ? 'None' : missing);

// Verify no duplicates
var counts = {};
ids.forEach(function(id) { counts[id] = (counts[id] || 0) + 1; });
var dups = Object.keys(counts).filter(function(k) { return counts[k] > 1; });
console.log('  Duplicate IDs:', dups.length > 0 ? dups : 'None');

// Verify sequential
var allSequential = true;
for(var i=0; i<pokemon.length; i++) {
  if(pokemon[i].id !== i+1) {
    console.log('  MISMATCH at index', i, ': expected', i+1, 'got', pokemon[i].id);
    allSequential = false;
    break;
  }
}
console.log('  All sequential:', allSequential);

// Save
fs.writeFileSync('../data/pokemon.json', JSON.stringify(pokemon, null, 2), 'utf8');
console.log('\nSaved pokemon.json');