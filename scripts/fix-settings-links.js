const fs = require('fs');
const dir = 'C:/home/node/.openclaw/workspace/pokopia-dex/';
const files = ['index.html','detail.html','habitats.html','habitat-detail.html','badges.html'];
files.forEach(f => {
  const c = fs.readFileSync(dir + f, 'utf8');
  const u = c.replace(/data-tab="settings" href="#"/g, 'data-tab="settings" href="settings.html"');
  if (u !== c) {
    fs.writeFileSync(dir + f, u, 'utf8');
    console.log(f + ': updated');
  } else {
    console.log(f + ': no change');
  }
});