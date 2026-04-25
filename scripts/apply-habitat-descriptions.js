const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// Read files
const habitatData = JSON.parse(fs.readFileSync(path.join(dataDir, 'habitat-data.json'), 'utf8'));
const descriptions = JSON.parse(fs.readFileSync(path.join(dataDir, 'habitat-descriptions.json'), 'utf8'));

let count = 0;

for (const [id, desc] of Object.entries(descriptions)) {
  if (habitatData[id]) {
    if (!habitatData[id].description) {
      habitatData[id].description = {};
    }
    habitatData[id].description.zh = desc.zh;
    habitatData[id].description.en = desc.en;
    habitatData[id].description.es = desc.es;
    count++;
  } else {
    console.warn(`Warning: habitat ID ${id} not found in habitat-data.json`);
  }
}

// Write back habitat-data.json
fs.writeFileSync(path.join(dataDir, 'habitat-data.json'), JSON.stringify(habitatData, null, 2), 'utf8');
console.log(`Updated ${count} habitats in habitat-data.json`);

// Regenerate habitat-data.js
const jsContent = `const HABITAT_DATA = ${JSON.stringify(habitatData, null, 2)};\n`;
fs.writeFileSync(path.join(dataDir, 'habitat-data.js'), jsContent, 'utf8');
console.log('Regenerated habitat-data.js');