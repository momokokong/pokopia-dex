const https = require('https');

// Get all habitat slugs from the browser data
var habitatSlugs = [
'tall-grass-001','tree-shaded-tall-grass-002','boulder-shaded-tall-grass-003','hydrated-tall-grass-004','seaside-tall-grass-005',
'elevated-tall-grass-006','illuminated-tall-grass-007','pretty-flower-bed-008','tree-shaded-flower-bed-009','hydrated-flower-bed-010',
'field-of-flowers-011','elevated-flower-bed-012','grave-with-flowers-013','flower-garden-014','fresh-veggie-field-015'
];

async function checkHabitatImage(slug) {
  return new Promise(function(resolve) {
    // PokopiaDex habitat page might contain the actual image URL
    var url = 'https://pokopiadex.com/assets/habitats/' + slug;
    https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, function(res) {
      var d=''; res.on('data',function(c){d+=c;}); res.on('end',function(){
        // Look for the habitat_ui image for THIS habitat
        var searchStr = slug + '.png';
        var idx = d.indexOf(searchStr);
        if (idx > -1) {
          // Find the full image path
          var start = Math.max(0, idx - 100);
          var context = d.substring(start, idx + slug.length + 10);
          // Extract the /images/assets/habitats/habitat_ui/... path
          var imgMatch = context.match(/\/images\/habitats\/habitat_ui\/[^"'\s?&]+/);
          if (imgMatch) {
            resolve(slug + ' => ' + imgMatch[0]);
            return;
          }
        }
        // Try direct URL pattern
        var directUrl = '/images/assets/habitats/habitat_ui/' + slug + '.png';
        if (d.indexOf(directUrl) > -1) {
          resolve(slug + ' => ' + directUrl);
          return;
        }
        resolve(slug + ' => NOT FOUND');
      });
    }).on('error', function() { resolve(slug + ' => ERROR'); });
  });
}

async function main() {
  // First, check a few habitat pages to see image URL pattern
  for (var i = 0; i < Math.min(5, habitatSlugs.length); i++) {
    var result = await checkHabitatImage(habitatSlugs[i]);
    console.log(result);
    await new Promise(function(r) { setTimeout(r, 500); });
  }
}

main().catch(console.error);