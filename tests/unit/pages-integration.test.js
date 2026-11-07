import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const ROOT_DIR = path.resolve(__dirname, '../..');
const habitatsHtml = fs.readFileSync(path.join(ROOT_DIR, 'habitats.html'), 'utf-8');
const habitatDetailHtml = fs.readFileSync(path.join(ROOT_DIR, 'habitat-detail.html'), 'utf-8');
const settingsHtml = fs.readFileSync(path.join(ROOT_DIR, 'settings.html'), 'utf-8');

const storageApi = require('../../js/storage.js');
const i18nApi = require('../../js/i18n.js');
const badgesApi = require('../../js/badges-engine.js');
const appDex = require('../../app.js');

describe('Pages Integration & Navigation Consistency (TICK-007)', () => {
  beforeEach(() => {
    localStorage.clear();
    if (typeof window !== 'undefined') {
      window.POKOPIA_STORAGE = storageApi;
      window.POKOPIA_I18N = i18nApi;
      window.POKOPIA_BADGES = badgesApi;
      window.POKOPIA_DEX = appDex;
    }
  });

  it('1. habitats.html contains all 5 bottom tab items (dex, habitats, quiz, badges, settings), script tags, aria-labels, and 🇪🇸 flag', () => {
    const dom = new JSDOM(habitatsHtml);
    const doc = dom.window.document;

    const tabs = Array.from(doc.querySelectorAll('.tab-bar .tab-bar__item')).map(el => el.getAttribute('data-tab'));
    expect(tabs).toEqual(['dex', 'habitats', 'quiz', 'badges', 'settings']);

    const quizTab = doc.querySelector('.tab-bar__item[data-tab="quiz"]');
    expect(quizTab).not.toBeNull();
    expect(quizTab.getAttribute('href')).toBe('quiz.html');

    const scripts = Array.from(doc.querySelectorAll('script[src]')).map(el => el.getAttribute('src'));
    expect(scripts).toContain('js/i18n.js');
    expect(scripts).toContain('js/storage.js');
    expect(scripts).toContain('js/badges-engine.js');
    expect(scripts).toContain('app.js');
    expect(scripts.indexOf('js/i18n.js')).toBeLessThan(scripts.indexOf('app.js'));
    expect(scripts.indexOf('js/storage.js')).toBeLessThan(scripts.indexOf('app.js'));

    const langBtns = Array.from(doc.querySelectorAll('.lang-btn'));
    expect(langBtns.length).toBe(3);
    langBtns.forEach(btn => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
    expect(habitatsHtml).toContain('🇪🇸');
    expect(habitatsHtml).toContain('tab_quiz');
  });

  it('2. habitat-detail.html contains all 5 bottom tab items, script tags (i18n, storage, speech, badges-engine), aria-labels, and 🇪🇸 flag', () => {
    const dom = new JSDOM(habitatDetailHtml);
    const doc = dom.window.document;

    const tabs = Array.from(doc.querySelectorAll('.tab-bar .tab-bar__item')).map(el => el.getAttribute('data-tab'));
    expect(tabs).toEqual(['dex', 'habitats', 'quiz', 'badges', 'settings']);

    const scripts = Array.from(doc.querySelectorAll('script[src]')).map(el => el.getAttribute('src'));
    expect(scripts).toContain('js/i18n.js');
    expect(scripts).toContain('js/storage.js');
    expect(scripts).toContain('js/speech.js');
    expect(scripts).toContain('js/badges-engine.js');
    expect(scripts).toContain('app.js');
    expect(scripts.indexOf('js/i18n.js')).toBeLessThan(scripts.indexOf('app.js'));
    expect(scripts.indexOf('js/storage.js')).toBeLessThan(scripts.indexOf('app.js'));
    expect(scripts.indexOf('js/speech.js')).toBeLessThan(scripts.indexOf('app.js'));
    expect(scripts.indexOf('js/badges-engine.js')).toBeLessThan(scripts.indexOf('app.js'));

    const langBtns = Array.from(doc.querySelectorAll('.lang-btn'));
    expect(langBtns.length).toBe(3);
    langBtns.forEach(btn => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
    expect(habitatDetailHtml).toContain('🇪🇸');
    expect(habitatDetailHtml).toContain('tab_quiz');
  });

  it('3. settings.html contains all 5 bottom tab items, script tags (i18n, storage, badges-engine), aria-labels, and 🇪🇸 flag', () => {
    const dom = new JSDOM(settingsHtml);
    const doc = dom.window.document;

    const tabs = Array.from(doc.querySelectorAll('.tab-bar .tab-bar__item')).map(el => el.getAttribute('data-tab'));
    expect(tabs).toEqual(['dex', 'habitats', 'quiz', 'badges', 'settings']);

    const scripts = Array.from(doc.querySelectorAll('script[src]')).map(el => el.getAttribute('src'));
    expect(scripts).toContain('js/i18n.js');
    expect(scripts).toContain('js/storage.js');
    expect(scripts).toContain('js/badges-engine.js');
    expect(scripts).toContain('app.js');
    expect(scripts.indexOf('js/i18n.js')).toBeLessThan(scripts.indexOf('app.js'));
    expect(scripts.indexOf('js/storage.js')).toBeLessThan(scripts.indexOf('app.js'));

    const langBtns = Array.from(doc.querySelectorAll('.lang-btn'));
    expect(langBtns.length).toBe(3);
    langBtns.forEach(btn => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
    expect(settingsHtml).toContain('🇪🇸');
    expect(settingsHtml).toContain('tab_quiz');
  });

  it('4. habitat-detail.html records habitat visits via POKOPIA_DEX.recordHabitatVisit and triggers badge check', () => {
    expect(habitatDetailHtml).toContain('POKOPIA_DEX.recordHabitatVisit(habitat.id)');
    expect(habitatDetailHtml).toContain('POKOPIA_BADGES.checkAndNotifyNewBadges()');

    // Verify functional integration of recordHabitatVisit with storage
    const statsBefore = appDex.getStats();
    expect(statsBefore.visitedHabIds).toEqual([]);

    appDex.recordHabitatVisit(1);
    appDex.recordHabitatVisit(5);
    appDex.recordHabitatVisit(1); // duplicate should be deduplicated

    const statsAfter = appDex.getStats();
    expect(statsAfter.visitedHabIds).toEqual([1, 5]);
  });

  it('5. habitat-detail.html displays all 3 language names (zh, en, es) when Trilingual Mode is enabled', () => {
    expect(habitatDetailHtml).toContain('POKOPIA_DEX.isTrilingualMode()');
    expect(habitatDetailHtml).toContain('[h.name.zh, h.name.en, h.name.es]');

    appDex.setTrilingualMode(true);
    expect(appDex.isTrilingualMode()).toBe(true);
  });

  it('6. settings.html binds #trilingualToggle to POKOPIA_DEX.isTrilingualMode() and POKOPIA_DEX.setTrilingualMode()', () => {
    const dom = new JSDOM(settingsHtml);
    const doc = dom.window.document;
    const toggle = doc.getElementById('trilingualToggle');
    expect(toggle).not.toBeNull();
    expect(settingsHtml).toContain('POKOPIA_DEX.isTrilingualMode()');
    expect(settingsHtml).toContain('POKOPIA_DEX.setTrilingualMode(');

    let eventFired = false;
    let eventDetail = null;
    document.addEventListener('trilingualchange', (e) => {
      eventFired = true;
      eventDetail = e.detail;
    }, { once: true });

    appDex.setTrilingualMode(true);
    expect(localStorage.getItem('pokopia-trilingual')).toBe('true');
    expect(appDex.isTrilingualMode()).toBe(true);
    expect(eventFired).toBe(true);
    expect(eventDetail).toEqual({ enabled: true });
  });

  it('7. settings.html includes Speech Rate setting row and wires getSpeechRate / setSpeechRate (0.8x and 1.0x)', () => {
    const dom = new JSDOM(settingsHtml);
    const doc = dom.window.document;
    const speechRateToggle = doc.getElementById('speechRateToggle');
    expect(speechRateToggle).not.toBeNull();
    expect(settingsHtml).toContain('POKOPIA_DEX.getSpeechRate()');
    expect(settingsHtml).toContain('POKOPIA_DEX.setSpeechRate(');
    expect(settingsHtml).toContain('0.8x 慢速跟讀');

    expect(appDex.getSpeechRate()).toBe(1.0);
    appDex.setSpeechRate(0.8);
    expect(appDex.getSpeechRate()).toBe(0.8);
    expect(localStorage.getItem('pokopia-speech-rate')).toBe('0.8');

    appDex.setSpeechRate(1.0);
    expect(appDex.getSpeechRate()).toBe(1.0);
  });

  it('8. settings.html progress code sync encodes and decodes collected Pokémon, language, trilingual mode, and visited habitats', () => {
    expect(settingsHtml).toContain('encodeProgress');
    expect(settingsHtml).toContain('decodeProgress');
    expect(settingsHtml).toContain('POKOPIA_DEX.encodeProgressCode');
    expect(settingsHtml).toContain('POKOPIA_DEX.decodeProgressCode');

    appDex.setCollected(1);
    appDex.setCollected(25);
    appDex.setLang('es');
    appDex.setTrilingualMode(true);
    appDex.recordHabitatVisit(12);

    const code = appDex.encodeProgressCode(2);
    expect(code.startsWith('POKOPIA:v2:')).toBe(true);

    localStorage.clear();
    const decoded = appDex.decodeProgressCode(code);
    expect(decoded.ok).toBe(true);
    expect(decoded.data.c).toEqual([1, 25]);
    expect(decoded.data.l).toBe('es');
    expect(decoded.data.t).toBe(true);
    expect(decoded.data.s.visitedHabIds).toEqual([12]);
  });
});
