#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'scraped_raw.json');

function fetchUrl(url, tries) {
  tries = tries || 3;
  return new Promise(function(resolve, reject) {
    function doReq(n) {
      var req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function(res) {
        if (res.statusCode === 301 || res.statusCode === 302) { fetchUrl(res.headers.location, tries).then(resolve).catch(reject); return; }
        if (res.statusCode !== 200) { res.resume(); if (n > 0) { setTimeout(function() { doReq(n-1); }, 1500); return; } reject(new Error('HTTP ' + res.statusCode)); return; }
        var data = ''; res.on('data', function(c) { data += c; }); res.on('end', function() { resolve(data); });
      });
      req.on('error', function(e) { if (n > 0) { setTimeout(function() { doReq(n-1); }, 1500); return; } reject(e); });
      req.setTimeout(20000, function() { req.destroy(); reject(new Error('Timeout')); });
    }
    doReq(tries);
  });
}

async function getTypesFromPokeAPI(id) {
  try {
    var data = await fetchUrl('https://pokeapi.co/api/v2/pokemon/' + id, 2);
    var json = JSON.parse(data);
    return (json.types || []).map(function(t) { return t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1); });
  } catch (e) { return []; }
}

function parsePage(html, slug, num) {
  var r = { slug: slug, num: num, description_en: '', types: [], specialties: [], habitat_biomes: [], rarity: 'Common', rarity_stars: 1, ideal_habitat: '', favorites: [], loved_items: { furniture: [], food: [], misc: [] }, how_to_find: null, teaches: null };
  var descm = html.match(/meta name="description" content="([^"]+)"/);
  if (descm) r.description_en = descm[1];
  var typeSet = new Set(['fire','water','grass','electric','normal','poison','flying','rock','ghost','dragon','ice','fighting','psychic','steel','dark','fairy','ground','bug']);
  var specLinks = []; var m; var re1 = /href="\/specialties\/([^"]+)"/g;
  while ((m = re1.exec(html)) !== null) specLinks.push(m[1]);
  r.specialties = []; var seenSpec = {};
  for (var i = 0; i < specLinks.length; i++) { var s = specLinks[i]; if (!typeSet.has(s) && !seenSpec[s]) { seenSpec[s] = true; r.specialties.push(s.split('-').map(function(w, idx) { return idx === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w; }).join(' ')); } }
  var idealm = html.match(/Ideal Habitat<\/div><div class="detail-tag-row"><span class="detail-tag">([^<]+)/);
  if (idealm) r.ideal_habitat = idealm[1];
  var re2 = /href="\/habitats\/([^"]+)"/g;
  while ((m = re2.exec(html)) !== null) { var idm = m[1].match(/-(\d+)$/); if (idm) { var nameM = m[0].match(/aria-label="([^"]+)/); r.habitat_biomes.push({ id: parseInt(idm[1]), name: nameM ? nameM[1] : m[1] }); } }
  var w2fIdx = html.indexOf('Where to Find');
  var stars = (html.substring(w2fIdx, w2fIdx + 3000).match(/fill="#f0c040"/g) || []).length;
  r.rarity_stars = Math.max(1, stars); r.rarity = stars >= 3 ? 'Rare' : stars >= 2 ? 'Uncommon' : 'Common';
  var favLinks = []; var re3 = /href="\/pokedex\/favorites\/([^"]+)"/g;
  while ((m = re3.exec(html)) !== null) favLinks.push(m[1]);
  r.favorites = []; var seenFav = {};
  for (var i = 0; i < favLinks.length; i++) { var f = favLinks[i]; if (!typeSet.has(f) && !seenFav[f]) { seenFav[f] = true; r.favorites.push(f.split('-').map(function(w, idx) { return idx === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w; }).join(' ')); } }
  var lovedStart = html.indexOf('Loved Items by');
  var lovedEnd = html.indexOf('Great Roommates for');
  if (lovedStart >= 0) {
    var ls = html.substring(lovedStart, lovedEnd > 0 ? lovedEnd : lovedStart + 300000);
    var re4 = /aria-label="([^"]+)"[^>]*href="\/items\//g;
    var furnChunk = ls.substring(ls.indexOf('Furniture'), ls.indexOf('Food') > 0 ? ls.indexOf('Food') : ls.length);
    var foodChunk = ls.substring(ls.indexOf('Food'), ls.indexOf('Misc.') > 0 ? ls.indexOf('Misc.') : ls.length);
    var furnItems = []; var itemM; re4.lastIndex = 0;
    while ((itemM = re4.exec(furnChunk)) !== null) { if (furnItems.indexOf(itemM[1]) < 0) furnItems.push(itemM[1]); }
    r.loved_items.furniture = furnItems.slice(0, 60);
    var foodItems = []; re4.lastIndex = 0;
    while ((itemM = re4.exec(foodChunk)) !== null) { if (foodItems.indexOf(itemM[1]) < 0) foodItems.push(itemM[1]); }
    r.loved_items.food = foodItems.slice(0, 30);
  }
  var teachM = html.match(/Teaches<\/div><div class="detail-tag-row"><a class="detail-tag" href="\/abilities\/([^>"]+)"/);
  if (teachM) r.teaches = teachM[1].charAt(0).toUpperCase() + teachM[1].slice(1);
  return r;
}

async function main() {
  // Fix shellos with correct slug
  var fixes = [
    { num: 59, slug: 'shellos-west-sea-059', pokeapi_id: 422 }
  ];

  var existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  console.log('Loaded ' + existing.length + ' entries');

  for (var i = 0; i < fixes.length; i++) {
    var fix = fixes[i];
    process.stdout.write('#' + fix.num + ' ' + fix.slug + '... ');
    try {
      var html = await fetchUrl('https://pokopiadex.com/pokedex/' + fix.slug);
      var data = parsePage(html, fix.slug, fix.num);
      var types = await getTypesFromPokeAPI(fix.pokeapi_id);
      if (types.length) data.types = types;
      var idx = -1;
      for (var j = 0; j < existing.length; j++) { if (existing[j].num === fix.num) { idx = j; break; } }
      if (idx >= 0) { existing[idx] = data; process.stdout.write('REPLACED OK types=' + data.types.join(',') + '\n'); }
      else { existing.push(data); process.stdout.write('ADDED OK\n'); }
    } catch(e) { process.stdout.write('FAIL(' + e.message + ')\n'); }
    await new Promise(function(r) { setTimeout(r, 900); });
  }

  // For toxtricity - just update with PokeAPI data without PokopiaDex page
  var idx = -1;
  for (var j = 0; j < existing.length; j++) { if (existing[j].num === 197) { idx = j; break; } }
  if (idx >= 0) {
    var types = await getTypesFromPokeAPI(849);
    existing[idx].types = types;
    existing[idx].description_en = existing[idx].description_en || 'Toxtricity';
    console.log('#197 toxtricity patched with PokeAPI types: ' + types.join(','));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing));
  var ok = existing.filter(function(x) { return !x.error; });
  console.log('\nResult: ' + ok.length + ' successful / ' + existing.length + ' total');
}
main().catch(console.error);