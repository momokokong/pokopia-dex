#!/usr/bin/env node
// Fetch trilingual names from PokeAPI for all Pokemon missing zh/es names
const https = require('https');
const fs = require('fs');
const path = require('path');

const POKEMON_FILE = path.join(__dirname, '..', 'data', 'pokemon.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'pokeapi_names_cache.json');

function fetchUrl(url, tries) {
  tries = tries || 3;
  return new Promise(function(resolve, reject) {
    function doReq(n) {
      var req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function(res) {
        if (res.statusCode !== 200) { res.resume(); if (n > 0) { setTimeout(function() { doReq(n-1); }, 1000); return; } reject(new Error('HTTP ' + res.statusCode)); return; }
        var data = ''; res.on('data', function(c) { data += c; }); res.on('end', function() { resolve(data); });
      });
      req.on('error', function(e) { if (n > 0) { setTimeout(function() { doReq(n-1); }, 1000); return; } reject(e); });
      req.setTimeout(15000, function() { req.destroy(); reject(new Error('Timeout')); });
    }
    doReq(tries);
  });
}

// We need the PokeAPI pokedex_number (National Dex number) for each Pokemon
// PokopiaDex IDs don't match - but we can get it from PokeAPI pokemon-species
// For Gen 1-9 Pokemon, the PokopiaDex list order IS the National Dex order for most
// Let's build a mapping from PokopiaDex num -> PokeAPI species ID

async function getSpeciesData(speciesId) {
  try {
    var data = await fetchUrl('https://pokeapi.co/api/v2/pokemon-species/' + speciesId);
    var json = JSON.parse(data);
    var names = {};
    json.names.forEach(function(n) {
      if (n.language.name === 'zh-Hant') names.zh = n.name;
      else if (n.language.name === 'zh-Hant') names.zh = n.name;
      else if (n.language.name === 'en') names.en = n.name;
      else if (n.language.name === 'es') names.es = n.name;
    });
    // Also try zh-Hans if zh-Hant not available
    if (!names.zh) {
      json.names.forEach(function(n) {
        if (n.language.name === 'zh-Hans' && !names.zh) names.zh = n.name;
      });
    }
    return { id: speciesId, names: names, pokedex_number: json.id };
  } catch (e) { return null; }
}

// Read the PokopiaDex list to get name->pokedex mapping
var listFile = path.join(__dirname, 'pokopiadex-list.json');
var pokopiadexList = JSON.parse(fs.readFileSync(listFile, 'utf8'));

// Build name -> pokopiadex num mapping
var nameToNum = {};
pokopiadexList.forEach(function(p) { nameToNum[p.name] = p.num; });

async function main() {
  var pokemon = JSON.parse(fs.readFileSync(POKEMON_FILE, 'utf8'));
  var needNames = pokemon.filter(function(p) { return !p.name.zh; });
  console.log('Pokemon needing zh names: ' + needNames.length);

  // Load cache
  var cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  }

  // For each Pokemon without zh name, look up PokeAPI by english name
  // We need to find the PokeAPI species ID
  var done = 0;
  var failed = 0;

  for (var i = 0; i < needNames.length; i++) {
    var p = needNames[i];
    var enName = p.name.en;

    // Skip if already in cache
    if (cache[enName]) {
      if (cache[enName].zh) { p.name.zh = cache[enName].zh; }
      if (cache[enName].es) { p.name.es = cache[enName].es; }
      if (cache[enName].pokedex_number) { p.pokedex_number = cache[enName].pokedex_number; }
      continue;
    }

    // Search PokeAPI by name to get the species ID
    try {
      var searchData = await fetchUrl('https://pokeapi.co/api/v2/pokemon/' + enName.toLowerCase().replace(/ /g, '-'));
      var searchJson = JSON.parse(searchData);
      var speciesId = searchJson.id;
      var speciesData = await getSpeciesData(speciesId);

      if (speciesData) {
        cache[enName] = speciesData.names;
        cache[enName].pokedex_number = speciesData.pokedex_number;
        if (speciesData.names.zh) p.name.zh = speciesData.names.zh;
        if (speciesData.names.es) p.name.es = speciesData.names.es;
        p.pokedex_number = speciesData.pokedex_number;
        done++;
        if (done % 20 === 0) {
          fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
          fs.writeFileSync(POKEMON_FILE, JSON.stringify(pokemon, null, 2));
          console.log('  Saved progress: ' + done + ' names fetched');
        }
      }
    } catch (e) {
      failed++;
      if (failed <= 10) console.log('  FAIL: ' + enName + ' - ' + e.message);
    }

    // Rate limit: 200ms between PokeAPI requests (generous limit is 100/min)
    await new Promise(function(r) { setTimeout(r, 250); });
  }

  // Save final results
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  fs.writeFileSync(POKEMON_FILE, JSON.stringify(pokemon, null, 2));

  var withZh = pokemon.filter(function(p) { return p.name.zh; }).length;
  var withEs = pokemon.filter(function(p) { return p.name.es; }).length;
  console.log('\nDone! Fetched: ' + done + ', Failed: ' + failed);
  console.log('Total with zh: ' + withZh + ', with es: ' + withEs);
}

main().catch(console.error);