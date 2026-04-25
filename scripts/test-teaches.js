const fs = require('fs');
const html = fs.readFileSync('C:/home/node/.openclaw/workspace/pokopia-dex/scripts/test-bulbasaur.html', 'utf8');
const teachM = html.match(/Teaches<\/div><div class="detail-tag-row"><a class="detail-tag" href="\/abilities\/([^"]+)"/);
console.log('href method:', teachM ? teachM[1] : 'NOT FOUND');
const ti = html.indexOf('Teaches</div>');
console.log('Teaches area:', html.substring(ti, ti + 400));
