const fs = require('fs');
const https = require('https');

// Load pokemon.json
var pokemon = JSON.parse(fs.readFileSync('./pokopia-dex/data/pokemon.json', 'utf8'));

// Load pokopiadex-list.json to get the slugs
var list = JSON.parse(fs.readFileSync('./pokopia-dex/scripts/pokopiadex-list.json', 'utf8'));

// Build lookup by num
var listMap = {};
list.forEach(function(p) { listMap[p.num] = p; });

// Function to download sprite
function downloadSprite(url, dest) {
  return new Promise(function(resolve, reject) {
    var file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function(res) {
      res.pipe(file);
      file.on('finish', function() { file.close(); resolve(); });
    }).on('error', function(e) { reject(e); });
  });
}

async function main() {
  // Check if sprite directory exists
  var spriteDir = './pokopia-dex/sprites';
  if (!fs.existsSync(spriteDir)) fs.mkdirSync(spriteDir, { recursive: true });

  var downloaded = 0;
  var existing = 0;

  for (var i = 0; i < pokemon.length; i++) {
    var p = pokemon[i];
    var pokedexNum = p.pokedex_number;
    if (!pokedexNum) continue;

    var spritePath = spriteDir + '/' + pokedexNum + '.png';
    if (fs.existsSync(spritePath)) { existing++; continue; }

    var url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + pokedexNum + '.png';
    try {
      await downloadSprite(url, spritePath);
      downloaded++;
      if (downloaded % 50 === 0) console.log('Downloaded ' + downloaded + ' sprites...');
    } catch(e) {
      console.log('Failed to download sprite for #' + pokedexNum + ' (' + p.name.en + ')');
    }
  }

  console.log('Done! Downloaded: ' + downloaded + ', Already existing: ' + existing);
}

main().catch(console.error);