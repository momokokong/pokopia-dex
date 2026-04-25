const https = require('https');
const fs = require('fs');

const slug = process.argv[2] || 'bulbasaur-1';
const opts = {
  hostname: 'pokopiadex.com',
  path: '/pokedex/' + slug,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
};

https.get(opts, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    // Find all RSC payload chunks
    const chunks = [];
    const re = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs;
    let m;
    while ((m = re.exec(d)) !== null) {
      chunks.push(m[1]);
    }
    
    // Combine and unescape
    const combined = chunks.join('');
    // Unescape the JSON-like string
    const unescaped = combined.replace(/\\n/g, '\n').replace(/\\\"/g, '"').replace(/\\\\/g, '\\');
    
    // Save raw for analysis
    fs.writeFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\test-raw.txt', unescaped);
    console.log('Saved. Length:', unescaped.length);
    console.log('First 5000 chars:');
    console.log(unescaped.substring(0, 5000));
  });
}).on('error', e => console.error(e));