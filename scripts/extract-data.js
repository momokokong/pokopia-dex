const fs = require('fs');
const d = fs.readFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\test-combined.txt', 'utf8');

console.log('=== EXTRACTING POKEMON DATA ===');

// Find the pokemon detail section
const idx = d.indexOf('Bulbasaur');
console.log('Bulbasaur found at:', idx);

// Extract description - look for detail-description class
const descMatch = d.match(/detail-description.*?children\":\"(.*?)\"}/);
console.log('Description:', descMatch ? descMatch[1] : 'not found');

// Extract types from specialties links (using escaped quotes in payload)
const typeMatches = d.match(/specialties\/(.*?)(?:\")/g);
const types = typeMatches ? [...new Set(typeMatches.map(m => m.replace('specialties/','').replace('\"','')).filter(t => t && !t.includes('/') && t.length < 20))] : [];
console.log('Types:', types);

// Extract rarity
const rarityMatch = d.match(/\"(Common|Uncommon|Rare|Very Rare|Special)\"/);
console.log('Rarity:', rarityMatch ? rarityMatch[1] : 'not found');

// Extract biomes from habitat image filenames
const biomeMatches = d.match(/habitats\/habitat_ui\/(.*?)-\d+\.png/g);
const biomes = biomeMatches ? [...new Set(biomeMatches.map(m => m.replace('habitats/habitat_ui/','').replace(/-\d+\.png/,'').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())))] : [];
console.log('Biomes:', biomes);

// Extract ideal habitat
const idealMatch = d.match(/\\u0022\u0022,\\u0022(Bright|Humid|Warm|Dark|Cool|Cold)\\u0022/);
console.log('Ideal Habitat:', idealMatch ? idealMatch[1] : 'not found');

// Extract favorites from favorites links
const favMatches = d.match(/pokedex\/favorites\/(.*?)(?:\")/g);
const favorites = favMatches ? [...new Set(favMatches.map(m => m.replace('pokedex/favorites/','').replace('\"','').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())))] : [];
console.log('Favorites:', favorites);

// Extract specialties
const specMatches = d.match(/specialties\/(.*?)(?:\.png|\\\")/g);
const specialties = specMatches ? [...new Set(specMatches.map(m => m.replace('specialties/','').replace('.png','').replace('\\\"','')).filter(s => s && s.length < 20 && !s.includes('/')))] : [];
console.log('Specialties:', specialties);

// Look for "Loved Items" section
const lovedItems = d.indexOf('Loved Items');
console.log('Loved Items section at:', lovedItems);
if (lovedItems > -1) {
    console.log('Context:', d.substring(lovedItems, lovedItems+500));
}
