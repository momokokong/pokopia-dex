const fs = require('fs');
const d = fs.readFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\test-combined.txt', 'utf8');

const lovedIdx = d.indexOf('Loved Items');
if (lovedIdx === -1) {
    console.log('No Loved Items section');
    process.exit(1);
}

const section = d.substring(lovedIdx, lovedIdx + 20000);
fs.writeFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\test-loved-section.txt', section);

// Look for item names - they appear as children text in links
console.log('=== SEARCHING FOR ITEM NAMES ===');

// Pattern: aria-label="Item Name" in items links
const itemMatches = section.match(/aria-label=\"(.*?)\"/g);
if (itemMatches) {
    const items = itemMatches.map(m => m.replace('aria-label="', '').replace('"', ''));
    console.log('Items found:', items.length);
    console.log(items);
}

// Also look for href="/items/xxx" patterns
const hrefMatches = section.match(/href=\"\/items\/(.*?)\"/g);
if (hrefMatches) {
    const itemSlugs = [...new Set(hrefMatches.map(m => m.replace('href="/items/', '').replace('"', '')))];
    console.log('\nItem slugs:', itemSlugs.length);
    console.log(itemSlugs.map(s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())));
}

// Find category boundaries
console.log('\n=== CATEGORY BOUNDARIES ===');
const furnitureIdx = section.indexOf('Furniture');
const foodIdx = section.indexOf('Food');
const miscIdx = section.indexOf('Misc');
console.log('Furniture at:', furnitureIdx);
console.log('Food at:', foodIdx);
console.log('Misc at:', miscIdx);
