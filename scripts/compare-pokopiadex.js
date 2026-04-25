const https = require('https');
https.get('https://pokopiadex.com/pokedex', {headers:{'User-Agent':'Mozilla/5.0'}}, function(res) {
  var d=''; res.on('data',function(c){d+=c;}); res.on('end',function(){
    var regex = /href="\/pokedex\/([^"]+)"/g;
    var matches = [];
    var m;
    while((m=regex.exec(d))!==null) { matches.push(m[1]); }
    
    // Filter to only pokemon entries (name-number pattern)
    var pokemonLinks = matches.filter(function(s) { return s.match(/^[a-z-]+-\d+$/i); });
    var uniquePokemon = [...new Set(pokemonLinks)];
    
    // Load our list
    var ourList = require('../scripts/pokopiadex-list.json');
    var ourSlugs = new Set(ourList.map(function(x) { return x.slug; }));
    
    // Find what's on PokopiaDex but not in our list
    var missing = uniquePokemon.filter(function(s) { return !ourSlugs.has(s); });
    console.log('In PokopiaDex but NOT in our list (' + missing.length + '):');
    missing.forEach(function(s) { console.log('  ' + s); });
    
    // Find what's in our list but not on PokopiaDex
    var pokopiadexSet = new Set(uniquePokemon);
    var extra = ourList.filter(function(x) { return !pokopiadexSet.has(x.slug); });
    console.log('\nIn our list but NOT on PokopiaDex (' + extra.length + '):');
    extra.forEach(function(x) { console.log('  ' + x.slug); });
    
    console.log('\nPokopiaDex unique pokemon links:', uniquePokemon.length);
    console.log('Our list:', ourList.length);
  });
});