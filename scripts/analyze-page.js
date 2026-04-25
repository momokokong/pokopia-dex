const fs = require('fs');
const d = fs.readFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\test-page.html', 'utf8');

// Check for __NEXT_DATA__
const nd = d.match(/window\.__NEXT_DATA__\s*=\s*(\{.*?\});/s);
console.log('NEXT_DATA found:', nd ? 'yes, len=' + nd[1].length : 'no');

// Look for JSON in script tags  
const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let scripts = [];
let m;
while ((m = scriptRe.exec(d)) !== null) {
    scripts.push(m[1].substring(0, 500));
}
console.log('Scripts found:', scripts.length);

// Look for data in self.__next_f
const nextF = d.match(/self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs);
console.log('next_f chunks:', nextF ? nextF.length : 0);

// Search for key data fields
console.log('\n=== Searching for data patterns ===');
console.log('description:', d.includes('It carries a seed'));
console.log('Grow specialty:', d.includes('Grow'));
console.log('Tall grass:', d.includes('Tall grass'));
console.log('Bright:', d.includes('Bright'));
console.log('furniture:', d.includes('furniture'));
console.log('food:', d.includes('food'));

// Try to find structured JSON
const structMatches = d.match(/\{"slug":"bulbasaur-001"[\s\S]{0,5000}\}/g);
console.log('Struct matches:', structMatches ? structMatches.length : 0);
if (structMatches) {
    console.log(structMatches[0].substring(0, 2000));
}
