const https = require('https');
const fs = require('fs');

// Fetch PokopiaDex habitats page
function fetchUrl(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, function(res) {
      var d=''; res.on('data',function(c){d+=c;}); res.on('end',function(){ resolve(d); });
    }).on('error', reject);
  });
}

async function main() {
  // The habitats page on PokopiaDex is dynamically loaded
  // But we know the pattern from the browser data we already collected
  
  // Let me try to fetch the habitat list from PokopiaDex
  try {
    var html = await fetchUrl('https://pokopiadex.com/habitats');
    console.log('Fetched PokopiaDex habitats page, length: ' + html.length);
    
    // Look for habitat links
    var links = [];
    var regex = /href=\"\/habitats\/([^\"]+)\"[^\u003e]*\u003e([^\u003c]+)\u003c\/a\u003e/g;
    var m;
    while((m = regex.exec(html)) !== null) {
      links.push({slug: m[1], name: m[2].trim()});
    }
    
    // Deduplicate
    var seen = {};
    var unique = [];
    links.forEach(function(l) {
      if (!seen[l.slug]) {
        seen[l.slug] = true;
        unique.push(l);
      }
    });
    
    console.log('Found ' + unique.length + ' unique habitats');
    unique.forEach(function(h, i) {
      console.log((i+1) + '. ' + h.slug + ' = ' + h.name);
    });
  } catch(e) {
    console.log('Error: ' + e.message);
  }
}

main().catch(console.error);