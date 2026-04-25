const https = require('https');

// Try to find the actual URL for the hash-based image
// GameWith might use a different base URL for hash images

function testUrl(url) {
  return new Promise(function(resolve) {
    https.get(url, function(res) {
      res.resume();
      resolve({url: url.split('/').pop(), status: res.statusCode});
    }).on('error', function(e) {
      resolve({url: url.split('/').pop(), status: 'ERROR'});
    });
  });
}

async function main() {
  var hash = 'f36a76d3b8711e361306a422f4096040';
  var urls = [
    'https://img.gamewith.jp/article_tools/pocoapokemon/gacha/img/' + hash + '.png',
    'https://img.gamewith.jp/article_tools/pocoapokemon/img/' + hash + '.png',
    'https://img.gamewith.jp/img/' + hash + '.png',
    'https://gamewith.jp/img/' + hash + '.png',
    'https://gamewith.jp/article_tools/pocoapokemon/gacha/img/' + hash + '.png',
    'https://img.gamewith.jp/assets/img/article_tools/pocoapokemon/gacha/img/' + hash + '.png',
    'https://img.gamewith.jp/article_tools/pocoapokemon/' + hash + '.png'
  ];
  
  for (var i = 0; i < urls.length; i++) {
    var result = await testUrl(urls[i]);
    console.log(result.url + ': ' + result.status);
  }
}

main().catch(console.error);