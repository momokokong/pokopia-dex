// Add manifest link and SW registration to all HTML files
const fs = require('fs');
const dir = 'C:/home/node/.openclaw/workspace/pokopia-dex/';
const files = ['index.html', 'detail.html', 'habitats.html', 'habitat-detail.html', 'badges.html', 'settings.html'];

const manifestLink = '  <link rel="manifest" href="manifest.json">';
const metaTheme = '  <meta name="theme-color" content="#FF8C42">';
const appleTouch = '  <link rel="apple-touch-icon" href="assets/icons/icon-192.png">';

const swScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
          console.log('SW registered:', reg.scope);
        }).catch(err => {
          console.log('SW registration failed:', err);
        });
      });
    }
  </script>`;

files.forEach(f => {
  const path = dir + f;
  let html = fs.readFileSync(path, 'utf8');
  let changed = false;

  // Add manifest link (before closing </head> or after existing <link>)
  if (!html.includes('manifest.json')) {
    html = html.replace('</head>', manifestLink + '\n' + metaTheme + '\n' + appleTouch + '\n</head>');
    changed = true;
  }

  // Add SW registration (before </body>)
  if (!html.includes('serviceWorker')) {
    html = html.replace('</body>', swScript + '\n</body>');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path, html, 'utf8');
    console.log(f + ': updated');
  } else {
    console.log(f + ': already has PWA');
  }
});