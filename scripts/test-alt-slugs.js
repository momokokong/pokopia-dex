#!/usr/bin/env node
// Try alternate slugs for the 2 remaining 404s
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

async function testSlug(slug) {
  try {
    var html = await fetchUrl('https://pokopiadex.com/pokedex/' + slug);
    return html.length > 1000;
  } catch (e) { return false; }
}

async function main() {
  // Shelos might be under "shellos" (with double l)
  // Toxtricity might have different form suffixes
  var slugs = [
    'shellos-059', 'shellos-west-sea-059', 'shellos-east-sea-059',
    'toxtricity-197', 'toxtricity-low-key-197'
  ];
  
  for (var i = 0; i < slugs.length; i++) {
    var ok = await testSlug(slugs[i]);
    console.log(slugs[i] + ': ' + (ok ? 'FOUND' : '404'));
    await new Promise(function(r) { setTimeout(r, 500); });
  }
}
main().catch(console.error);