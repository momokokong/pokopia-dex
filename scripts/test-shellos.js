const https = require('https');
function fetchUrl(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, function(res) {
      var d=''; res.on('data',function(c){d+=c;}); res.on('end',function(){resolve(d);});
    }).on('error',reject);
  });
}
(async function() {
  var r = await fetchUrl('https://pokeapi.co/api/v2/pokemon/422');
  var j = JSON.parse(r);
  console.log('Shellos PokeAPI types:', j.types.map(function(t){return t.type.name;}));
  var r2 = await fetchUrl('https://pokopiadex.com/pokedex/shellos-west-sea-059');
  var desc = r2.match(/meta name="description" content="([^"]+)"/);
  console.log('Shellos PokopiaDex desc:', desc ? desc[1] : 'none');
})();