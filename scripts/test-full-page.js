const https = require('https');
const fs = require('fs');

const slug = process.argv[2] || 'bulbasaur-001';
const opts = {
  hostname: 'pokopiadex.com',
  path: '/pokedex/' + slug,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,*/*',
    'Accept-Encoding': 'identity'
  }
};

https.get(opts, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    fs.writeFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\full-page.html', data);
    console.log('Status:', res.statusCode, 'Length:', data.length);
    
    // Quick analysis
    const lovedIdx = data.indexOf('Loved Items');
    console.log('Loved Items at:', lovedIdx);
    
    // Extract all chunks
    const chunks = [];
    const re = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs;
    let m;
    while ((m = re.exec(data)) !== null) {
      chunks.push(m[1]);
    }
    console.log('RSC chunks:', chunks.length);
    
    // Combine all chunks
    const combined = chunks.join('').replace(/\\n/g, '\n').replace(/\\\"/g, '"').replace(/\\\\/g, '\\');
    console.log('Combined length:', combined.length);
    
    fs.writeFileSync('C:\\home\\node\\.openclaw\\workspace\\pokopia-dex\\scripts\\full-combined.txt', combined);
    console.log('Saved full combined payload');
  });
}).on('error', e => console.error(e));
