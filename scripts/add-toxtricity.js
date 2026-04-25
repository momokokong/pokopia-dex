const https = require('https');
const fs = require('fs');

function fetchUrl(url, tries) {
  tries = tries || 3;
  return new Promise(function(resolve, reject) {
    function doReq(n) {
      var req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function(res) {
        if (res.statusCode !== 200) { res.resume(); if (n > 0) { setTimeout(function() { doReq(n-1); }, 1000); return; } reject(new Error('HTTP ' + res.statusCode)); return; }
        var data = ''; res.on('data', function(c) { data += c; }); res.on('end', function() { resolve(data); });
      });
      req.on('error', function(e) { if (n > 0) { setTimeout(function() { doReq(n-1); }, 1000); return; } reject(e); });
      req.setTimeout(20000, function() { req.destroy(); reject(new Error('Timeout')); });
    }
    doReq(tries);
  });
}

function extractField(html, startMarker, endMarker) {
  var start = html.indexOf(startMarker);
  if (start === -1) return '';
  start += startMarker.length;
  var end = html.indexOf(endMarker, start);
  if (end === -1) return '';
  return html.substring(start, end).trim();
}

async function scrapeToxtricity() {
  var slug = 'toxtricity-amped-form-197';
  var url = 'https://pokopiadex.com/pokedex/' + slug;
  
  console.log('Fetching:', url);
  var html = await fetchUrl(url);
  console.log('HTML length:', html.length);
  
  // Description from meta
  var descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  var description = descMatch ? descMatch[1] : '';
  console.log('Description:', description.substring(0, 120));
  
  // Types from PokeAPI (#849)
  var pdata = await fetchUrl('https://pokeapi.co/api/v2/pokemon/849');
  var pj = JSON.parse(pdata);
  var types = pj.types.map(function(t) { return t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1); });
  console.log('Types:', types);
  
  // Ideal habitat
  var idealHabitat = extractField(html, 'Ideal Habitat</div><div class="detail-tag-row"><span class="detail-tag">', '</span>');
  console.log('Ideal Habitat:', idealHabitat);
  
  // Favorites
  var favSection = html.indexOf('href="/pokedex/favorites/');
  var favorites = [];
  if (favSection > -1) {
    var favRegex = /href="\/pokedex\/favorites\/[^"]*"[^>]*>([^<]*)<\/a>/g;
    var match;
    while ((match = favRegex.exec(html)) !== null) {
      if (favorites.indexOf(match[1]) === -1) favorites.push(match[1]);
    }
  }
  console.log('Favorites:', favorites);
  
  // Biomes
  var biomeRegex = /href="\/habitats\/([^"]*)" aria-label="([^"]*)"/g;
  var biomes = [];
  var bmatch;
  while ((bmatch = biomeRegex.exec(html)) !== null) {
    biomes.push({ slug: bmatch[1], name: bmatch[2] });
  }
  console.log('Biomes:', biomes.map(function(b) { return b.name; }));
  
  // Rarity stars
  var whereSection = html.indexOf('Where to Find');
  var rarityStars = 1;
  if (whereSection > -1) {
    var subHtml = html.substring(whereSection, whereSection + 3000);
    var starCount = (subHtml.match(/fill="#f0c040"/g) || []).length;
    rarityStars = Math.max(1, starCount);
  }
  console.log('Rarity stars:', rarityStars);
  
  // Loved items
  var lovedItemsMatch = html.indexOf('Loved Items by');
  var lovedItems = [];
  if (lovedItemsMatch > -1) {
    var lovedHtml = html.substring(lovedItemsMatch, lovedItemsMatch + 5000);
    var itemRegex = /<span class="detail-tag">([^<]+)<\/span>/g;
    var imatch;
    while ((imatch = itemRegex.exec(lovedHtml)) !== null) {
      lovedItems.push(imatch[1]);
    }
  }
  console.log('Loved items:', lovedItems.slice(0, 10));
  
  // Specialties/Teaches
  var teachesMatch = html.indexOf('Teaches</div>');
  var specialties = [];
  if (teachesMatch > -1) {
    var teachHtml = html.substring(teachesMatch, teachesMatch + 2000);
    var teachRegex = /href="\/abilities\/[^"]*">([^<]+)<\/a>/g;
    var tmatch;
    while ((tmatch = teachRegex.exec(teachHtml)) !== null) {
      specialties.push(tmatch[1]);
    }
  }
  console.log('Teaches:', specialties);
  
  // Zone
  var zone = '';
  var zoneMatch = html.match(/class="detail-tag"[^>]*>\s*<a[^>]*href="\/zones\/[^"]*"[^>]*>([^<]+)<\/a>/);
  if (zoneMatch) zone = zoneMatch[1];
  console.log('Zone:', zone);
  
  // Now build the entry and add to pokemon.json
  var pokemon = JSON.parse(fs.readFileSync('./pokopia-dex/data/pokemon.json', 'utf8'));
  
  // Get zh/es names from PokeAPI species
  var sdata = await fetchUrl('https://pokeapi.co/api/v2/pokemon-species/849');
  var sj = JSON.parse(sdata);
  var nameZh = '', nameEs = '';
  sj.names.forEach(function(n) {
    if (n.language.name === 'zh-hant') nameZh = n.name;
    if (n.language.name === 'zh-hans' && !nameZh) nameZh = n.name;
    if (n.language.name === 'es') nameEs = n.name;
    if (n.language.name === 'en' && n.name === 'Toxtricity') {} // already known
  });
  console.log('Chinese name:', nameZh, 'Spanish name:', nameEs);
  
  var newEntry = {
    id: pokemon.length + 1,
    pokopia_id: 197,
    pokedex_number: 849,
    name: { en: 'Toxtricity', zh: nameZh || '毒電耐者', es: nameEs || 'Toxtricity' },
    types: types,
    description: { en: description, zh: '', es: '' },
    habitat: {
      biomes: biomes.map(function(b) { return { id: b.slug, name: { en: b.name } }; }),
      zone: zone
    },
    ideal_habitat: { en: idealHabitat, zh: '', es: '' },
    favorites: favorites,
    loved_items: lovedItems,
    specialties: specialties,
    rarity: rarityStars >= 3 ? 'Rare' : rarityStars === 2 ? 'Uncommon' : 'Common',
    rarity_stars: rarityStars,
    sprite_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/849.png'
  };
  
  pokemon.push(newEntry);
  fs.writeFileSync('./pokopia-dex/data/pokemon.json', JSON.stringify(pokemon, null, 2));
  console.log('\nAdded Toxtricity! Total Pokemon:', pokemon.length);
}

scrapeToxtricity().catch(console.error);