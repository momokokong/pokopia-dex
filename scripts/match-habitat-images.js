const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, function(res) {
      if (res.statusCode !== 200) { res.resume(); reject(new Error('HTTP ' + res.statusCode)); return; }
      var d=''; res.on('data',function(c){d+=c;}); res.on('end',function(){ resolve(d); });
    }).on('error', reject);
  });
}

async function main() {
  // Load the habitat list from PokopiaDex
  var habitatList = [
    {id:'tall-grass-001',name:'Tall grass'},
    {id:'tree-shaded-tall-grass-002',name:'Tree-shaded tall grass'},
    {id:'boulder-shaded-tall-grass-003',name:'Boulder-shaded tall grass'},
    {id:'hydrated-tall-grass-004',name:'Hydrated tall grass'},
    {id:'seaside-tall-grass-005',name:'Seaside tall grass'},
    {id:'elevated-tall-grass-006',name:'Elevated tall grass'},
    {id:'illuminated-tall-grass-007',name:'Illuminated tall grass'}
  ];
  
  // We know: habitat_2 = Tall grass (tall-grass-001)
  // The numbering seems offset by 1 (habitat_2 = 001, habitat_3 = 002, etc.)
  // Let's verify by checking PokopiaDex habitat pages for images
  
  // Try to find the image pattern on PokopiaDex habitat pages
  for (var i = 1; i <= 5; i++) {
    var num = String(i).padStart(3, '0');
    var slug = 'tall-grass-' + num;
    try {
      var html = await fetchUrl('https://pokopiadex.com/assets/habitats/' + slug);
      // Look for image references
      var imgRegex = /img[^>]*src="([^"]*(?:habitat|hab)[^"]*)"[^>]*>/gi;
      var bgRegex = /background-image:\s*url\(["']?([^"')]+)/gi;
      var m;
      while((m = bgRegex.exec(html)) !== null) {
        console.log(slug + ' bg: ' + m[1]);
      }
      // Also look for any img with pokopiadex
      var imgAllRegex = /src="([^"]+\.png[^"]*)"/gi;
      while((m = imgAllRegex.exec(html)) !== null) {
        if (m[1].indexOf('pokopiadex') > -1 || m[1].indexOf('habitat') > -1) {
          console.log(slug + ' img: ' + m[1].substring(0, 120));
        }
      }
      console.log(slug + ': HTML length ' + html.length);
    } catch(e) {
      console.log(slug + ': Error ' + e.message);
    }
    await new Promise(function(r) { setTimeout(r, 500); });
  }
}

main().catch(console.error);