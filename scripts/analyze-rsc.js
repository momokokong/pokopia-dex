const fs = require('fs');
const d = fs.readFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\test-page.html', 'utf8');

const chunks = [];
const re = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs;
let m;
while ((m = re.exec(d)) !== null) {
    chunks.push(m[1]);
}

console.log('Chunks:', chunks.length);
const combined = chunks.join('').replace(/\\\\n/g, '\n').replace(/\\\\\"/g, '"').replace(/\\\\\\/g, '\\');
console.log('Combined len:', combined.length);

// Search for pokemon data
const pm = combined.match(/slug.*?bulbasaur.*?name.*?[\s\S]{0,200}/i);
if (pm) {
    console.log('Found pokemon data:', pm[0].substring(0, 500));
} else {
    console.log('No structured data found in RSC payload');
}

// Save combined for analysis
fs.writeFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\test-combined.txt', combined.substring(0, 50000));
console.log('Saved combined payload');
