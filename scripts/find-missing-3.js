const https = require('https');
const fs = require('fs');

https.get('https://pokopiadex.com/pokedex', {headers:{'User-Agent':'Mozilla/5.0'}}, function(res) {
  var d=''; res.on('data',function(c){d+=c;}); res.on('end',function(){
    var regex = /href="\/pokedex\/([^"]+)"/g;
    var matches = [];
    var m;
    while((m=regex.exec(d))!==null) { matches.push(m[1]); }
    
    var pokemonLinks = matches.filter(function(s) { return s.match(/^[a-z-]+-\d+$/i); });
    var uniqueSlugs = [...new Set(pokemonLinks)];
    
    // Group by PokopiaDex number
    var byNumber = {};
    uniqueSlugs.forEach(function(slug) {
      var parts = slug.match(/^(.+)-(\d+)$/);
      if (parts) {
        var num = parseInt(parts[2]);
        if (!byNumber[num]) byNumber[num] = [];
        byNumber[num].push(slug);
      }
    });
    
    // Now load our data and find exactly what's missing
    var ourPokemon = JSON.parse(fs.readFileSync('../data/pokemon.json', 'utf8'));
    
    console.log('=== COMPLETE COMPARISON ===');
    console.log('PokopiaDex unique slugs:', uniqueSlugs.length);
    console.log('PokopiaDex unique numbers:', Object.keys(byNumber).length);
    console.log('Our pokemon count:', ourPokemon.length);
    console.log('');
    
    // Check each variant group
    console.log('=== VARIANT GROUPS (multiple slugs per number) ===');
    Object.keys(byNumber).sort(function(a,b){return parseInt(a)-parseInt(b);}).forEach(function(num) {
      if (byNumber[num].length > 1) {
        var ourEntry = ourPokemon.find(function(p){return p.pokopia_id === parseInt(num);});
        var ourSlug = ourEntry ? (ourEntry.slug || 'unknown') : 'NOT IN DATA';
        console.log('#' + num + ': PokopiaDex=' + byNumber[num].join(', ') + ' | Ours=' + ourSlug + ' (' + (ourEntry ? ourEntry.name.en : 'MISSING') + ')');
      }
    });
    
    // Find slugs not in our data at all
    var ourSlugs = new Set(ourPokemon.map(function(p) {
      // reconstruct slug from name
      var name = p.name.en.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      return name + '-' + String(p.pokopia_id).padStart(3, '0');
    }));
    
    var missingSlugs = uniqueSlugs.filter(function(slug) { return !ourSlugs.has(slug); });
    console.log('\n=== SLUGS IN POKOPIADEX BUT NOT MATCHABLE IN OUR DATA (' + missingSlugs.length + ') ===');
    // Show only the ones that are truly missing (not just slug format differences)
    missingSlugs.forEach(function(slug) {
      var num = parseInt(slug.match(/-(\d+)$/)[1]);
      var ourEntry = ourPokemon.find(function(p){return p.pokopia_id === num;});
      if (ourEntry) {
        console.log(slug + ' -> we have #' + num + ' as ' + ourEntry.name.en);
      } else {
        console.log(slug + ' -> NOT IN OUR DATA');
      }
    });
  });
});