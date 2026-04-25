const https = require('https');
const fs = require('fs');

// GameWith habitat data extracted from browser
const gwHabitats = [
  {id:1,no:"1",n:"緑の草むら",img:"img/f36a76d3b8711e361306a422f4096040.png",aid:"547136"},
  {id:2,no:"2",n:"木かげの草むら",img:"habitat_2.png",aid:"547147"},
  {id:3,no:"3",n:"岩かげの草むら",img:"habitat_3.png",aid:"547152"},
  {id:4,no:"4",n:"うるおう草むら",img:"habitat_4.png",aid:"547287"},
  {id:5,no:"5",n:"波打ちぎわの草むら",img:"habitat_5.png",aid:"547212"},
  {id:6,no:"6",n:"高台の草むら",img:"habitat_6.png",aid:"547389"},
  {id:7,no:"7",n:"照らされた草むら",img:"habitat_7.png",aid:"547257"},
  {id:8,no:"8",n:"きれいな花畑",img:"habitat_8.png",aid:"547140"},
  {id:9,no:"9",n:"木かげの花畑",img:"habitat_9.png",aid:"547392"},
  {id:10,no:"10",n:"うるおう花畑",img:"habitat_10.png",aid:"547361"}
];

// PokopiaDex habitat slugs (from browser)
const pdexSlugs = [
  'tall-grass-001','tree-shaded-tall-grass-002','boulder-shaded-tall-grass-003',
  'hydrated-tall-grass-004','seaside-tall-grass-005','elevated-tall-grass-006',
  'illuminated-tall-grass-007'
];

// Test: GameWith habitat_2 should match PokopiaDex tree-shaded-tall-grass-002
// GameWith id 1 (緑の草むら) = PokopiaDex tall-grass-001
// GameWith id 2 (木かげの草むら) = PokopiaDex tree-shaded-tall-grass-002

console.log('GameWith habitat_1 = Tall grass = PokopiaDex tall-grass-001');
console.log('GameWith habitat_2 = Tree-shaded tall grass = PokopiaDex tree-shaded-tall-grass-002');

// The mapping is simple: GameWith id N corresponds to PokopiaDex habitat with number N
// But GameWith id 1 has a hash-based image name, not habitat_1.png
// And habitat numbering is: GW 1=001, GW 2=002, etc.

// Save the full mapping
const fullData = `1|tall-grass-001|緑の草むら|みどりのくさむら|habitat_1.png|547136
2|tree-shaded-tall-grass-002|木かげの草むら|こかげのくさむら|habitat_2.png|547147
3|boulder-shaded-tall-grass-003|岩かげの草むら|いわかげのくさむら|habitat_3.png|547152
4|hydrated-tall-grass-004|うるおう草むら|うるおうくさむら|habitat_4.png|547287
5|seaside-tall-grass-005|波打ちぎわの草むら|なみうちぎわのくさむら|habitat_5.png|547212
6|elevated-tall-grass-006|高台の草むら|たかだいのくさむら|habitat_6.png|547389
7|illuminated-tall-grass-007|照らされた草むら|てらされたくさむら|habitat_7.png|547257
8|pretty-flower-bed-008|きれいな花畑|きれいなはなばたけ|habitat_8.png|547140`;

fs.writeFileSync('../data/habitat-mapping.tsv', fullData, 'utf8');
console.log('Saved test mapping file');