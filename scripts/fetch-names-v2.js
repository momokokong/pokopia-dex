#!/usr/bin/env node
// Fetch trilingual names from PokeAPI pokemon-species for all Pokemon
// Uses pokemon-species endpoint which has zh-Hant names
const https = require('https');
const fs = require('fs');
const path = require('path');

const POKEMON_FILE = path.join(__dirname, '..', 'data', 'pokemon.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'pokeapi_species_cache.json');

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

async function getSpeciesNames(speciesId) {
  try {
    var data = await fetchUrl('https://pokeapi.co/api/v2/pokemon-species/' + speciesId);
    var json = JSON.parse(data);
    var names = { en: '', zh: '', es: '' };
    json.names.forEach(function(n) {
      if (n.language.name === 'zh-hant') names.zh = n.name;
      if (n.language.name === 'zh-hans' && !names.zh) names.zh = n.name;
      if (n.language.name === 'en') names.en = n.name;
      if (n.language.name === 'es') names.es = n.name;
    });
    return { id: json.id, names: names };
  } catch (e) { return null; }
}

async function main() {
  var pokemon = JSON.parse(fs.readFileSync(POKEMON_FILE, 'utf8'));
  var needNames = pokemon.filter(function(p) { return !p.name.zh; });
  console.log('Pokemon needing zh names: ' + needNames.length);

  // Load cache
  var cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  }

  var done = 0;
  var failed = 0;

  for (var i = 0; i < needNames.length; i++) {
    var p = needNames[i];
    var enName = p.name.en;

    // Use pokedex_number if we have it, or try to look up by English name
    var speciesId = p.pokedex_number;
    if (!speciesId) {
      // Try to find the PokeAPI ID from the existing name cache
      var nameCache = {};
      try { nameCache = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'pokeapi_names_cache.json'), 'utf8')); } catch(e) {}
      if (nameCache[enName] && nameCache[enName].pokedex_number) {
        speciesId = nameCache[enName].pokedex_number;
        p.pokedex_number = speciesId;
      }
    }

    if (!speciesId) {
      // Skip - we don't know the PokeAPI species ID for this one yet
      failed++;
      continue;
    }

    // Check cache first
    if (cache[speciesId]) {
      var c = cache[speciesId];
      if (c.zh) p.name.zh = c.zh;
      if (c.es) p.name.es = c.es;
      continue;
    }

    var result = await getSpeciesNames(speciesId);
    if (result && result.names.zh) {
      cache[speciesId] = result.names;
      p.name.zh = result.names.zh;
      if (result.names.es) p.name.es = result.names.es;
      done++;
    } else {
      failed++;
      console.log('  No zh name for species ' + speciesId + ' (' + enName + ')');
    }

    if (done % 20 === 0 && done > 0) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
      fs.writeFileSync(POKEMON_FILE, JSON.stringify(pokemon, null, 2));
      console.log('  Progress: ' + done + ' fetched');
    }

    await new Promise(function(r) { setTimeout(r, 150); });
  }

  // Save final
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  fs.writeFileSync(POKEMON_FILE, JSON.stringify(pokemon, null, 2));

  var withZh = pokemon.filter(function(p) { return p.name.zh; }).length;
  var withEs = pokemon.filter(function(p) { return p.name.es; }).length;
  var withPokedex = pokemon.filter(function(p) { return p.pokedex_number; }).length;
  console.log('\nDone! Fetched: ' + done + ', Failed: ' + failed);
  console.log('Total with zh: ' + withZh + ', with es: ' + withEs + ', with pokedex_number: ' + withPokedex);
}

main().catch(console.error);