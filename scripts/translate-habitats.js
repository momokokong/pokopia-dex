#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const habitatPath = path.join(REPO_ROOT, 'data/habitat-data.json');

const habitatData = JSON.parse(fs.readFileSync(habitatPath, 'utf8'));
const ids = Object.keys(habitatData).map(Number).sort((a, b) => a - b);

// Collect habitats needing zh or es
const toTranslate = [];
ids.forEach(id => {
  const h = habitatData[id];
  const name = h.name || {};
  if (!name.zh || !name.es) {
    toTranslate.push({ id, en: name.en, needZh: !name.zh, needEs: !name.es });
  }
});

console.log('Habitats needing translation:', toTranslate.length);

// Build a batch translation prompt for Ollama
const enNames = toTranslate.map(t => `[${t.id}] ${t.en}`).join('\n');

const prompt = `Translate these 200 habitat/location names from English to Chinese (Traditional, zh-TW) and Spanish (es-MX).

Each name is a short descriptive location phrase from a Pokemon game. Keep translations natural and kid-friendly (target audience: 5-7 year old children).

Input format: [ID] English name
Output format: JSON object with IDs as keys, each containing {zh, es}

Example:
Input:
[1] Tall Grass
[4] Rocky Tall Grass

Output:
{
  "1": {"zh": "高草叢", "es": "Hierba alta"},
  "4": {"zh": "岩石高草叢", "es": "Hierba alta rocosa"}
}

Now translate all 200 names. Output ONLY the JSON object, no other text:

${enNames}`;

const promptPath = path.join(REPO_ROOT, 'output', 'habitat-translation-prompt.txt');
fs.writeFileSync(promptPath, prompt, 'utf8');
console.log('Prompt written to', promptPath);
console.log('');
console.log('First 20 names to translate:');
toTranslate.slice(0, 20).forEach(t => console.log('  [' + t.id + '] ' + t.en));
console.log('  ... (' + toTranslate.length + ' total)');
