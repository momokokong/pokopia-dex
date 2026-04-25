const https = require('https');
https.get('https://pokopiadex.com/pokedex', {headers:{'User-Agent':'Mozilla/5.0'}}, function(res) {
  var d=''; res.on('data',function(c){d+=c;}); res.on('end',function(){
    var regex = /href="\/pokedex\/([^"]+)"/g;
    var matches = [];
    var m;
    while((m=regex.exec(d))!==null) { matches.push(m[1]); }
    console.log('Total pokedex links found:', matches.length);
    // Filter out non-pokemon links (like /pokedex/favorites, /pokedex/specialties etc)
    var pokemon = matches.filter(function(s) {
      return s.indexOf('/') === -1 || s.match(/^[a-z]+-\d+$/i);
    });
    // Actually just show all unique
    var unique = [...new Set(matches)];
    console.log('Unique links:', unique.length);
    console.log('Sample links:', unique.slice(0, 20).join(', '));
    console.log('Last 20 links:', unique.slice(-20).join(', '));
    
    // Check for links that look like pokemon entries (name-number pattern)
    var pokemonLinks = matches.filter(function(s) { return s.match(/^[a-z-]+-\d+$/i); });
    var uniquePokemon = [...new Set(pokemonLinks)];
    console.log('\nPokemon entry links:', uniquePokemon.length);
    console.log('Sample:', uniquePokemon.slice(0, 10).join(', '));
  });
});