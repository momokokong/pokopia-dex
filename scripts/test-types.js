const fs = require('fs');
const d = fs.readFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\full-combined.txt', 'utf8');

// Find all specialty links
const specMatches = d.match(/specialties\/(.*?)(?:\"|\?)/g);
if (specMatches) {
    const specs = [...new Set(specMatches.map(s => s.replace('specialties/', '').replace(/["?]/g, '')).filter(s => s && s.length < 20 && !s.includes('/')))];
    console.log('Specialties:', specs);
}

// Find type info - look for the Type section
const typeIdx = d.indexOf('Type');
console.log('\nType section at:', typeIdx);
if (typeIdx > -1) {
    console.log('Context:', d.substring(typeIdx, typeIdx + 500));
}

// Look for type names near the pokemon name
const pkmnIdx = d.indexOf('Bulbasaur');
console.log('\nBulbasaur at:', pkmnIdx);
const section = d.substring(pkmnIdx, pkmnIdx + 2000);

// Search for common type names
const types = ['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
for (const t of types) {
    const idx = section.indexOf(t);
    if (idx > -1) {
        console.log(`Found ${t} at position ${idx} in section`);
    }
}
