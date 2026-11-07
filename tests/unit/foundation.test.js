import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TICK-001: Project Foundation & Data Integrity Smoke Test', () => {
  it('has valid pokemon.json with 303 entries and trilingual names/descriptions', () => {
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'data/pokemon.json'), 'utf8');
    const data = JSON.parse(raw);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(303);
    data.forEach((p) => {
      expect(p.id).toBeDefined();
      expect(p.name.zh).toBeTruthy();
      expect(p.name.en).toBeTruthy();
      expect(p.name.es).toBeTruthy();
      expect(p.description.zh).toBeTruthy();
      expect(p.description.en).toBeTruthy();
      expect(p.description.es).toBeTruthy();
    });
  });

  it('has cleaned up redundant backup and log files', () => {
    expect(fs.existsSync(path.resolve(process.cwd(), 'data/pokemon.json.bak'))).toBe(false);
    expect(fs.existsSync(path.resolve(process.cwd(), 'data/scrape.log'))).toBe(false);
    expect(fs.existsSync(path.resolve(process.cwd(), 'scripts/ngrok.zip'))).toBe(false);
    expect(fs.existsSync(path.resolve(process.cwd(), 'tunnel_new.pid'))).toBe(false);
  });
});
