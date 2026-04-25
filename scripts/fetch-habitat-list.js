const https = require('https');

https.get('https://pokopiadex.com/habitats', {headers:{'User-Agent':'Mozilla/5.0'}}, function(res) {
  var d=''; res.on('data',function(c){d+=c;}); res.on('end',function(){
    var regex = /href="\/habitats\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
    var m, habitats = [];
    while((m=regex.exec(d))!==null) {
      habitats.push({id: m[1], name: m[2]});
    }
    console.log('Total habitat links:', habitats.length);
    // deduplicate by id
    var seen = {};
    var unique = [];
    habitats.forEach(function(h) {
      if (!seen[h.id]) {
        seen[h.id] = true;
        unique.push(h);
      }
    });
    console.log('Unique habitats:', unique.length);
    unique.forEach(function(h) {
      console.log(h.id + ' = ' + h.name);
    });
  });
});