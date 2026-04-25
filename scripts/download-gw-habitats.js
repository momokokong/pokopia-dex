const https = require('https');
const fs = require('fs');
const path = require('path');

// GameWith habitat data from browser (full 212 entries)
const gwHabitats = [
  {id:"1",no:"1",n:"緑の草むら",img:"img/f36a76d3b8711e361306a422f4096040.png",aid:"547136"},
  {id:"2",no:"2",n:"木かげの草むら",img:"habitat_2.png",aid:"547147"},
  {id:"3",no:"3",n:"岩かげの草むら",img:"habitat_3.png",aid:"547152"},
  {id:"4",no:"4",n:"うるおう草むら",img:"habitat_4.png",aid:"547287"},
  {id:"5",no:"5",n:"波打ちぎわの草むら",img:"habitat_5.png",aid:"547212"},
  {id:"6",no:"6",n:"高台の草むら",img:"habitat_6.png",aid:"547389"},
  {id:"7",no:"7",n:"照らされた草むら",img:"habitat_7.png",aid:"547257"},
  {id:"8",no:"8",n:"きれいな花畑",img:"habitat_8.png",aid:"547140"},
  {id:"9",no:"9",n:"木かげの花畑",img:"habitat_9.png",aid:"547392"},
  {id:"10",no:"10",n:"うるおう花畑",img:"habitat_10.png",aid:"547361"}
];

// The full 212 entries would go here - for now just start downloading
const BASE_URL = 'https://img.gamewith.jp/article_tools/pocoapokemon/gacha/';
const OUT_DIR = 'C:/home/node/.openclaw/workspace/pokopia-dex/habitats';

async function downloadHabitat(num) {
  return new Promise(function(resolve) {
    var url = BASE_URL + 'habitat_' + num + '.png';
    https.get(url, function(res) {
      if (res.statusCode !== 200) {
        res.resume();
        resolve({num, ok: false, status: res.statusCode});
        return;
      }
      var data = [];
      res.on('data', function(c) { data.push(c); });
      res.on('end', function() {
        var buf = Buffer.concat(data);
        var filename = 'habitat_' + String(num).padStart(3, '0') + '.png';
        fs.writeFileSync(path.join(OUT_DIR, filename), buf);
        resolve({num, ok: true, size: buf.length});
      });
    }).on('error', function(e) {
      resolve({num, ok: false, error: e.message});
    });
  });
}

async function main() {
  var results = [];
  for (var i = 2; i <= 212; i++) {
    var result = await downloadHabitat(i);
    results.push(result);
    if (i % 50 === 0) console.log('Progress: ' + i + '/212');
  }
  
  var success = results.filter(function(r) { return r.ok; }).length;
  var failed = results.filter(function(r) { return !r.ok; });
  console.log('Done! Downloaded ' + success + ' images');
  if (failed.length > 0) {
    console.log('Failed:', failed.map(function(f) { return f.num + ':' + (f.status || f.error); }).join(', '));
  }
}

main().catch(console.error);