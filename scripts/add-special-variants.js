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

async function scrapePokemon(slug, pokopiaId, pokedexNum, nameEn, nameZh, nameEs) {
  var url = 'https://pokopiadex.com/pokedex/' + slug;
  console.log('Fetching:', slug);
  
  var html = await fetchUrl(url);
  console.log('  HTML length:', html.length);
  
  // Description from meta
  var descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  var description = descMatch ? descMatch[1] : '';
  console.log('  Description:', description.substring(0, 80));
  
  // Types from PokeAPI
  var types = [];
  if (pokedexNum) {
    var pdata = await fetchUrl('https://pokeapi.co/api/v2/pokemon/' + pokedexNum);
    var pj = JSON.parse(pdata);
    types = pj.types.map(function(t) { return t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1); });
    console.log('  Types:', types);
  }
  
  // Ideal habitat
  var idealHabitat = extractField(html, 'Ideal Habitat</div><div class="detail-tag-row"><span class="detail-tag">', '</span>');
  console.log('  Ideal Habitat:', idealHabitat);
  
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
  console.log('  Favorites:', favorites);
  
  // Biomes
  var biomeRegex = /href="\/habitats\/([^"]*)" aria-label="([^"]*)"/g;
  var biomes = [];
  var bmatch;
  while ((bmatch = biomeRegex.exec(html)) !== null) {
    biomes.push({ id: bmatch[1], name: { en: bmatch[2] } });
  }
  console.log('  Biomes:', biomes.map(function(b) { return b.name.en; }));
  
  // Rarity
  var whereSection = html.indexOf('Where to Find');
  var rarityStars = 1;
  if (whereSection > -1) {
    var subHtml = html.substring(whereSection, whereSection + 3000);
    var starCount = (subHtml.match(/fill="#f0c040"/g) || []).length;
    rarityStars = Math.max(1, starCount);
  }
  console.log('  Rarity stars:', rarityStars);
  
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
  console.log('  Loved items:', lovedItems.slice(0, 5));
  
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
  console.log('  Teaches:', specialties);
  
  // Zone
  var zone = '';
  var zoneMatch = html.match(/class="detail-tag"[^>]*>\s*<a[^>]*href="\/zones\/[^"]*"[^>]*>([^<]+)<\/a>/);
  if (zoneMatch) zone = zoneMatch[1];
  
  // Chinese/Spanish names from PokeAPI
  var nameZhFinal = nameZh || '';
  var nameEsFinal = nameEs || '';
  if (pokedexNum && !nameZh) {
    try {
      var sdata = await fetchUrl('https://pokeapi.co/api/v2/pokemon-species/' + pokedexNum);
      var sj = JSON.parse(sdata);
      sj.names.forEach(function(n) {
        if (n.language.name === 'zh-hant') nameZhFinal = n.name;
        if (n.language.name === 'zh-hans' && !nameZhFinal) nameZhFinal = n.name;
        if (n.language.name === 'en' && n.name === nameEn) {} // skip
        if (n.language.name === 'es') nameEsFinal = n.name;
      });
    } catch(e) { console.log('  Warning: could not fetch species names'); }
  }
  console.log('  Name zh:', nameZhFinal, 'es:', nameEsFinal);
  
  return {
    id: 0, // will be set later
    pokopia_id: pokopiaId,
    pokedex_number: pokedexNum,
    name: { en: nameEn, zh: nameZhFinal, es: nameEsFinal },
    types: types,
    description: { en: description, zh: '', es: '' },
    habitat: {
      biomes: biomes,
      zone: zone
    },
    ideal_habitat: { en: idealHabitat, zh: '', es: '' },
    favorites: favorites,
    loved_items: lovedItems,
    specialties: specialties,
    rarity: rarityStars >= 3 ? 'Rare' : rarityStars === 2 ? 'Uncommon' : 'Common',
    rarity_stars: rarityStars,
    sprite_url: pokedexNum ? 'https://raw.githubusercontent.com/PokeAPI/assets/sprites/master/assets/sprites/pokemon/other/official-artwork/' + pokedexNum + '.png' : ''
  };
}

async function main() {
  var pokemon = JSON.parse(fs.readFileSync('../data/pokemon.json', 'utf8'));
  
  // The 3 special variant Pokemon
  var specialPokemon = [
    { slug: 'tangrowth-professor-041', pokopiaId: 41, pokedexNum: 465, nameEn: 'Tangrowth Professor', nameZh: '巨蔓草博士', nameEs: 'Tangrowth Profesor' },
    { slug: 'pikachu-pale-079', pokopiaId: 79, pokedexNum: 25, nameEn: 'Pikachu Pale', nameZh: '皮卡丘（淡色）', nameEs: 'Pikachu Pálido' },
    { slug: 'snorlax-mossy-108', pokopiaId: 108, pokedexNum: 143, nameEn: 'Snorlax Mossy', nameZh: '卡比獸（苔蘚）', nameEs: 'Snorlax Musgoso' }
  ];
  
  for (var i = 0; i < specialPokemon.length; i++) {
    var spec = specialPokemon[i];
    var entry = await scrapePokemon(spec.slug, spec.pokopiaId, spec.pokedexNum, spec.nameEn, spec.nameZh, spec.nameEs);
    entry.id = pokemon.length + 1;
    pokemon.push(entry);
    console.log('  Added:', entry.name.en, 'id:', entry.id);
    // Rate limit
    await new Promise(function(r) { setTimeout(r, 900); });
  }
  
  fs.writeFileSync('../data/pokemon.json', JSON.stringify(pokemon, null, 2));
  console.log('\nTotal Pokemon:', pokemon.length);
}

main().catch(console.error);