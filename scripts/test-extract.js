const fs = require('fs');

// Read the HTML we already fetched
const html = fs.readFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\test-page.html', 'utf8');

// Extract chunks
const chunks = [];
const re = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs;
let m;
while ((m = re.exec(html)) !== null) {
    chunks.push(m[1]);
}

const combined = chunks.join('')
    .replace(/\\n/g, '\n')
    .replace(/\\\"/g, '"')
    .replace(/\\\\/g, '\\');

console.log('Combined length:', combined.length);

// Look for specific patterns
console.log('\n=== RARITY ===');
const r1 = html.match(/title=\"(Common|Uncommon|Rare|Very Rare|Special)\"/);
console.log('HTML title:', r1 ? r1[1] : 'not found');

console.log('\n=== TYPES from specialties ===');
const typeMatches = combined.match(/specialties\/(.*?)(?:\")/g);
if (typeMatches) {
    const types = [...new Set(typeMatches.map(t => t.replace('specialties/', '').replace('"', '')).filter(t => t && !t.includes('/') && t.length < 20))];
    console.log(types);
}

console.log('\n=== IDEAL HABITAT ===');
// Look for the pattern after specialty tags
const idealContext = combined.substring(combined.indexOf('Bright') - 200, combined.indexOf('Bright') + 200);
console.log(idealContext);

console.log('\n=== LOVED ITEMS ===');
const lovedIdx = combined.indexOf('Loved Items');
if (lovedIdx > -1) {
    const section = combined.substring(lovedIdx, lovedIdx + 8000);
    console.log(section.substring(0, 1000));
}

console.log('\n=== BIOMES ===');
const biomeMatches = combined.match(/habitats\/habitat_ui\/(.*?)-\d+\.png/g);
if (biomeMatches) {
    const biomes = [...new Set(biomeMatches.map(b => 
        b.replace('habitats/habitat_ui/', '').replace(/-\d+\.png/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ))];
    console.log(biomes);
}
