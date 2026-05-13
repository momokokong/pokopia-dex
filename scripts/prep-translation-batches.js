#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Translation: write prompt to file, user runs through OpenClaw
// Or we can manually build translations here.

const REPO_ROOT = path.resolve(__dirname, '..');
const habitatPath = path.join(REPO_ROOT, 'data/habitat-data.json');
const data = JSON.parse(fs.readFileSync(habitatPath, 'utf8'));

// Split into batches of 25 for manual translation via LLM
const ids = Object.keys(data).map(Number).sort((a, b) => a - b);
const batches = [];
let current = [];
for (const id of ids) {
  const name = data[id].name || {};
  if (!name.zh || !name.es) {
    current.push({ id, en: name.en });
    if (current.length >= 25) {
      batches.push(current);
      current = [];
    }
  }
}
if (current.length > 0) batches.push(current);

console.log(`Total batches: ${batches.length}`);
console.log(`Remaining: ${current.length > 0 ? current.length : 0} in last batch`);

// Write batch prompts
const outDir = path.join(REPO_ROOT, 'output', 'translation-batches');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

batches.forEach((batch, idx) => {
  const lines = [];
  lines.push(`Translate these Pokemon habitat/location names from English to Chinese (Traditional, zh-TW) AND Spanish (es-MX). Keep kid-friendly (5-7 year olds). Output ONLY a JSON object with IDs as keys:`);
  lines.push('');
  batch.forEach(h => {
    lines.push(`[${h.id}] ${h.en}`);
  });
  lines.push('');
  lines.push('{');
  batch.forEach((h, i) => {
    const comma = i < batch.length - 1 ? ',' : '';
    lines.push(`  "${h.id}": {"zh": "...", "es": "..."}${comma}`);
  });
  lines.push('}');
  
  fs.writeFileSync(path.join(outDir, `batch-${String(idx+1).padStart(2,'0')}.txt`), lines.join('\n'), 'utf8');
});

console.log(`Wrote ${batches.length} batch files to ${outDir}`);
