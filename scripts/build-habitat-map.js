const https = require('https');
const fs = require('fs');

// Fetch full PokopiaDex habitats page to get all slugs and names
function fetchHabitatList() {
  return new Promise(function(resolve, reject) {
    https.get('https://pokopiadex.com/habitats', {headers:{'User-Agent':'Mozilla/5.0'}}, function(res) {
      var d=''; res.on('data',function(c){d+=c;}); res.on('end',function(){ resolve(d); });
    }).on('error', reject);
  });
}

async function main() {
  // The habitat data from GameWith (212 entries)
  // GW id 1 = "緑の草むら" = PokopiaDex "Tall grass"
  // GW id 2 = "木かげの草むら" = PokopiaDex "Tree-shaded tall grass"
  // We need to map GameWith ids to PokopiaDex slugs
  
  // Based on the browser data, the order should match:
  // GW 1 -> tall-grass-001
  // GW 2 -> tree-shaded-tall-grass-002
  // GW 3 -> boulder-shaded-tall-grass-003
  // etc.
  
  // Let me build the mapping from the data we already have
  var gwData = [
    {id:"1",n:"緑の草むら",en:"Tall grass"},
    {id:"2",n:"木かげの草むら",en:"Tree-shaded tall grass"},
    {id:"3",n:"岩かげの草むら",en:"Boulder-shaded tall grass"},
    {id:"4",n:"うるおう草むら",en:"Hydrated tall grass"},
    {id:"5",n:"波打ちぎわの草むら",en:"Seaside tall grass"},
    {id:"6",n:"高台の草むら",en:"Elevated tall grass"},
    {id:"7",n:"照らされた草むら",en:"Illuminated tall grass"},
    {id:"8",n:"きれいな花畑",en:"Pretty flower bed"},
    {id:"9",n:"木かげの花畑",en:"Tree-shaded flower bed"},
    {id:"10",n:"うるおう花畑",en:"Hydrated flower bed"},
    {id:"11",n:"花いっぱいの景色",en:"Field of flowers"},
    {id:"12",n:"高台の花畑",en:"Elevated flower bed"},
    {id:"13",n:"花に囲まれたお墓",en:"Grave with flowers"},
    {id:"14",n:"フラワーガーデン",en:"Flower garden"},
    {id:"15",n:"フレッシュ野菜畑",en:"Fresh veggie field"},
    {id:"16",n:"あたたかな風に乗って",en:"Riding warm updrafts"},
    {id:"17",n:"キャンプセット",en:"Campsite"},
    {id:"18",n:"修行の滝",en:"Training waterfall"},
    {id:"19",n:"腹ペコダイニング",en:"Tantalizing dining set"},
    {id:"20",n:"ピクニックな食卓",en:"Picnic set"}
  ];
  
  // Map: GameWith id -> { slug, gwId, jaName, enName, gwImg }
  // The mapping is sequential: GW id N = PokopiaDex habitat with number N (padded to 3 digits)
  var mapping = {};
  
  // Generate slugs from the pattern we observed
  var slugPatterns = [
    'tall-grass','tree-shaded-tall-grass','boulder-shaded-tall-grass','hydrated-tall-grass',
    'seaside-tall-grass','elevated-tall-grass','illuminated-tall-grass','pretty-flower-bed',
    'tree-shaded-flower-bed','hydrated-flower-bed','field-of-flowers','elevated-flower-bed',
    'grave-with-flowers','flower-garden','fresh-veggie-field','riding-warm-updrafts',
    'campsite','training-waterfall','tantalizing-dining-set','picnic-set'
  ];
  
  for (var i = 0; i < gwData.length; i++) {
    var gw = gwData[i];
    var num = String(i + 1).padStart(3, '0');
    var slug = (slugPatterns[i] || 'habitat') + '-' + num;
    mapping[slug] = {
      gwId: parseInt(gw.id),
      gwImg: 'habitats/habitat_' + String(parseInt(gw.id)).padStart(3, '0') + '.png',
      jaName: gw.n,
      enName: gw.en
    };
  }
  
  console.log(JSON.stringify(mapping, null, 2));
}

main().catch(console.error);