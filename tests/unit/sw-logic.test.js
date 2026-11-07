import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sw = require('../../sw.js');

describe('TICK-008: PWA Service Worker & Manifest Offline Optimization', () => {
  let mockCacheStore;

  beforeEach(() => {
    mockCacheStore = new Map();

    globalThis.caches = {
      open: vi.fn(async (cacheName) => {
        if (!mockCacheStore.has(cacheName)) {
          mockCacheStore.set(cacheName, new Map());
        }
        const store = mockCacheStore.get(cacheName);
        return {
          match: vi.fn(async (req) => {
            const key = typeof req === 'string' ? req : req.url;
            return store.get(key) || undefined;
          }),
          put: vi.fn(async (req, res) => {
            const key = typeof req === 'string' ? req : req.url;
            store.set(key, res);
          }),
          keys: vi.fn(async () => Array.from(store.keys())),
          delete: vi.fn(async (req) => {
            const key = typeof req === 'string' ? req : req.url;
            return store.delete(key);
          }),
          addAll: vi.fn(async (urls) => {
            urls.forEach((u) => store.set(u, new Response('cached')));
          })
        };
      }),
      keys: vi.fn(async () => Array.from(mockCacheStore.keys())),
      delete: vi.fn(async (name) => mockCacheStore.delete(name)),
      match: vi.fn(async (req) => {
        const key = typeof req === 'string' ? req : req.url;
        for (const store of mockCacheStore.values()) {
          if (store.has(key)) return store.get(key);
        }
        return undefined;
      })
    };
  });

  it('defines expected cache names and MAX_AUDIO_CACHE_ITEMS = 150', () => {
    expect(sw.CACHE_NAME).toBe('pokopia-dex-v3');
    expect(sw.DATA_CACHE).toBe('pokopia-data-v1');
    expect(sw.IMG_CACHE).toBe('pokopia-images-v1');
    expect(sw.AUDIO_CACHE).toBe('pokopia-audio-v1');
    expect(sw.MAX_AUDIO_CACHE_ITEMS).toBe(150);
  });

  it('includes quiz.html and all modular JS engines in APP_SHELL with relative paths', () => {
    const requiredAssets = [
      './index.html',
      './detail.html',
      './habitats.html',
      './habitat-detail.html',
      './badges.html',
      './quiz.html',
      './settings.html',
      './app.js',
      './js/i18n.js',
      './js/storage.js',
      './js/speech.js',
      './js/quiz-engine.js',
      './js/badges-engine.js',
      './scripts/quiz.js',
      './scripts/qrcode.min.js',
      './styles.css',
      './styles-badges.css',
      './styles-settings.css',
      './data/habitat-data.js',
      './manifest.json'
    ];

    requiredAssets.forEach((asset) => {
      expect(sw.APP_SHELL).toContain(asset);
    });
  });

  it('verifies every file in APP_SHELL (excluding "./") exists on disk', () => {
    sw.APP_SHELL.filter((p) => p !== './').forEach((relPath) => {
      const fullPath = path.resolve(process.cwd(), relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  it('identifies /output/karaoke/ and /output/habitat_karaoke/ paths via isAudioRoute', () => {
    expect(sw.isAudioRoute('/output/karaoke/001_zh.mp3')).toBe(true);
    expect(sw.isAudioRoute('/output/karaoke/001_zh.json')).toBe(true);
    expect(sw.isAudioRoute('/pokopia-dex/output/habitat_karaoke/01_es.mp3')).toBe(true);
    expect(sw.isAudioRoute('/data/pokemon.json')).toBe(false);
    expect(sw.isAudioRoute('/assets/sprites/001.png')).toBe(false);
  });

  it('evicts oldest entries in trimCache when cache exceeds maxItems (LRU)', async () => {
    const cache = await caches.open(sw.AUDIO_CACHE);
    await cache.put('/output/karaoke/001_zh.mp3', new Response('1'));
    await cache.put('/output/karaoke/001_en.mp3', new Response('2'));
    await cache.put('/output/karaoke/001_es.mp3', new Response('3'));
    await cache.put('/output/karaoke/002_zh.mp3', new Response('4'));
    await cache.put('/output/karaoke/002_en.mp3', new Response('5'));

    await sw.trimCache(sw.AUDIO_CACHE, 3);

    const remainingKeys = await cache.keys();
    expect(remainingKeys).toEqual([
      '/output/karaoke/001_es.mp3',
      '/output/karaoke/002_zh.mp3',
      '/output/karaoke/002_en.mp3'
    ]);
  });

  it('caches audio MP3/JSON into AUDIO_CACHE on network fetch and serves from cache on repeat request', async () => {
    const reqUrl = 'https://example.com/output/karaoke/025_zh.mp3';
    const mockNetworkResponse = new Response('mp3-binary-data', { status: 200 });
    globalThis.fetch = vi.fn().mockResolvedValueOnce(mockNetworkResponse);

    // First fetch -> hits network and stores in AUDIO_CACHE
    const res1 = await sw.handleAudioFetch({ url: reqUrl });
    expect(res1.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Second fetch -> served directly from AUDIO_CACHE without network call
    const res2 = await sw.handleAudioFetch({ url: reqUrl });
    expect(res2.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns immediate 404 offline JSON response when audio fetch fails offline so Web Speech fallback activates', async () => {
    const reqUrl = 'https://example.com/output/habitat_karaoke/005_es.mp3';
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('NetworkError when attempting to fetch resource'));

    const res = await sw.handleAudioFetch({ url: reqUrl });
    expect(res.status).toBe(404);
    expect(res.statusText).toBe('Offline Audio Unavailable');
    const body = await res.json();
    expect(body).toEqual({ offline: true });
  });

  it('has valid manifest.json with relative "./index.html" start_url, "./" scope, and required icons', () => {
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'manifest.json'), 'utf8');
    const manifest = JSON.parse(raw);

    expect(manifest.start_url).toBe('./index.html');
    expect(manifest.scope).toBe('./');
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);

    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });
});
