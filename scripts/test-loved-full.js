const fs = require('fs');
const d = fs.readFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\full-combined.txt', 'utf8');

const lovedIdx = d.indexOf('Loved Items');
console.log('Loved Items at:', lovedIdx);

// The Loved Items section is truncated in RSC, but let's see what we have
const section = d.substring(lovedIdx);
console.log('Section length:', section.length);

// Look for furniture/food/misc labels
const furnIdx = section.indexOf('Furniture');
const foodIdx = section.indexOf('Food');
const miscIdx = section.indexOf('Misc');
console.log('Furniture at:', furnIdx);
console.log('Food at:', foodIdx);
console.log('Misc at:', miscIdx);

// Extract all aria-label items (these are item names)
const itemMatches = section.match(/aria-label=\"(.*?)\"/g);
if (itemMatches) {
    const items = [...new Set(itemMatches.map(m => m.replace('aria-label="', '').replace('"', '')))];
    console.log('\nAll items found:', items.length);
    console.log(items);
}

// Also look for href="/items/" to categorize
const hrefMatches = section.match(/href=\"\/items\/(.*?)\"/g);
if (hrefMatches) {
    const slugs = [...new Set(hrefMatches.map(m => m.replace('href="/items/', '').replace('"', '')))];
    console.log('\nItem slugs:', slugs.length);
    console.log(slugs.map(s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())));
}

// Extract item names from children spans (the displayed text)
const nameMatches = section.match(/children\":\"(.*?)\",\"\$undefined\"/g);
if (nameMatches) {
    const names = [...new Set(nameMatches.map(m => m.replace('children":"', '').replace('","$undefined"', '')))].filter(n => n.length > 2);
    console.log('\nNames from children:', names.length);
    console.log(names);
}
