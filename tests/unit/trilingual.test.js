import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = path.resolve(__dirname, '../..');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const detailHtml = fs.readFileSync(path.join(ROOT_DIR, 'detail.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(ROOT_DIR, 'styles.css'), 'utf8');
const i18nCode = fs.readFileSync(path.join(ROOT_DIR, 'js/i18n.js'), 'utf8');
const storageCode = fs.readFileSync(path.join(ROOT_DIR, 'js/storage.js'), 'utf8');
const speechCode = fs.readFileSync(path.join(ROOT_DIR, 'js/speech.js'), 'utf8');
const badgesCode = fs.readFileSync(path.join(ROOT_DIR, 'js/badges-engine.js'), 'utf8');
const appCode = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf8');

const SAMPLE_POKEMON = [
  {
    id: 1,
    pokedex_number: 1,
    name: { zh: '妙蛙種子', en: 'Bulbasaur', es: 'Bulbasaur' },
    types: ['Grass', 'Poison'],
    rarity: 'Common',
    rarity_stars: 1,
    description: {
      zh: '背上有種子，會行光合作用。',
      en: 'A strange seed was planted on its back at birth.',
      es: 'Tiene una semilla en el lomo desde que nace.'
    },
    ideal_habitat: {
      zh: '溫暖',
      en: 'Warm',
      es: 'Cálido'
    },
    specialties: ['Grow'],
    favorites: ['Lots of nature'],
    habitat: {
      zone: 'Palette Town',
      time: 'All day',
      weather: 'All weather',
      biomes: [{ id: 1, name: { zh: '高草叢', en: 'Tall grass', es: 'Hierba alta' } }]
    },
    loved_items: {
      furniture: ['Bench'],
      food: ['Berry'],
      misc: []
    }
  }
];

function extractInlineMainScript(html) {
  const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  return matches.length > 0 ? matches[0][1] : '';
}

function runInlinePageScript(html) {
  const code = extractInlineMainScript(html);
  vm.runInThisContext(`(() => {\n${code}\n})();`);
}

describe('[TICK-006] Trilingual Simultaneous View & Sequential Speech Integration', () => {
  beforeAll(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_POKEMON
    });
    vm.runInThisContext(`(() => {\n${i18nCode}\n})();`);
    vm.runInThisContext(`(() => {\n${storageCode}\n})();`);
    vm.runInThisContext(`(() => {\n${speechCode}\n})();`);
    vm.runInThisContext(`(() => {\n${badgesCode}\n})();`);
    vm.runInThisContext(`(() => {\n${appCode}\n})();`);
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_POKEMON
    });
  });

  it('1. loads i18n.js, storage.js, and badges-engine.js before app.js in index.html', () => {
    const i18nPos = indexHtml.indexOf('<script src="js/i18n.js"></script>');
    const storagePos = indexHtml.indexOf('<script src="js/storage.js"></script>');
    const badgesPos = indexHtml.indexOf('<script src="js/badges-engine.js"></script>');
    const appPos = indexHtml.indexOf('<script src="app.js"></script>');

    expect(i18nPos).toBeGreaterThan(-1);
    expect(storagePos).toBeGreaterThan(-1);
    expect(badgesPos).toBeGreaterThan(-1);
    expect(appPos).toBeGreaterThan(-1);

    expect(i18nPos).toBeLessThan(appPos);
    expect(storagePos).toBeLessThan(appPos);
    expect(badgesPos).toBeLessThan(appPos);
  });

  it('2. loads i18n.js, storage.js, speech.js, and badges-engine.js before app.js in detail.html', () => {
    const i18nPos = detailHtml.indexOf('<script src="js/i18n.js"></script>');
    const storagePos = detailHtml.indexOf('<script src="js/storage.js"></script>');
    const speechPos = detailHtml.indexOf('<script src="js/speech.js"></script>');
    const badgesPos = detailHtml.indexOf('<script src="js/badges-engine.js"></script>');
    const appPos = detailHtml.indexOf('<script src="app.js"></script>');

    expect(i18nPos).toBeGreaterThan(-1);
    expect(storagePos).toBeGreaterThan(-1);
    expect(speechPos).toBeGreaterThan(-1);
    expect(badgesPos).toBeGreaterThan(-1);
    expect(appPos).toBeGreaterThan(-1);

    expect(i18nPos).toBeLessThan(appPos);
    expect(storagePos).toBeLessThan(appPos);
    expect(speechPos).toBeLessThan(appPos);
    expect(badgesPos).toBeLessThan(appPos);
  });

  it('3. replaces 🇸🇻 with 🇪🇸 in top-nav and voice buttons across index.html and detail.html', () => {
    expect(indexHtml).not.toContain('🇸🇻');
    expect(detailHtml).not.toContain('🇸🇻');

    const indexDoc = new DOMParser().parseFromString(indexHtml, 'text/html');
    const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');

    expect(indexDoc.querySelector('.top-nav__right .lang-btn[data-lang="es"]')?.textContent?.trim()).toBe('🇪🇸');
    expect(detailDoc.querySelector('.top-nav__right .lang-btn[data-lang="es"]')?.textContent?.trim()).toBe('🇪🇸');
  });

  it('4. includes all 5 bottom tab bar items in both index.html and detail.html with quiz between habitats and badges', () => {
    const indexDoc = new DOMParser().parseFromString(indexHtml, 'text/html');
    const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');

    const indexTabs = [...indexDoc.querySelectorAll('.tab-bar .tab-bar__item')].map(el => el.getAttribute('data-tab'));
    const detailTabs = [...detailDoc.querySelectorAll('.tab-bar .tab-bar__item')].map(el => el.getAttribute('data-tab'));

    expect(indexTabs).toEqual(['dex', 'habitats', 'quiz', 'badges', 'settings']);
    expect(detailTabs).toEqual(['dex', 'habitats', 'quiz', 'badges', 'settings']);

    const quizTab = detailDoc.querySelector('.tab-bar .tab-bar__item[data-tab="quiz"]');
    expect(quizTab?.getAttribute('href')).toBe('quiz.html');
    expect(quizTab?.querySelector('.tab-bar__icon')?.textContent?.trim()).toBe('🎮');
    expect(quizTab?.querySelector('.tab-bar__label')?.getAttribute('data-i18n')).toBe('tab_quiz');
  });

  it('5. renders #trilingualQuickBtn in .top-nav__right on both index.html and detail.html', () => {
    const indexDoc = new DOMParser().parseFromString(indexHtml, 'text/html');
    const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');

    const indexBtn = indexDoc.querySelector('.top-nav__right #trilingualQuickBtn');
    const detailBtn = detailDoc.querySelector('.top-nav__right #trilingualQuickBtn');

    expect(indexBtn).not.toBeNull();
    expect(indexBtn?.classList.contains('trilingual-toggle-btn')).toBe(true);
    expect(detailBtn).not.toBeNull();
    expect(detailBtn?.classList.contains('trilingual-toggle-btn')).toBe(true);
  });

  it('6. index.html renders .pokemon-card--trilingual with 🇹🇼, 🇺🇸, 🇪🇸 badges when trilingual mode is enabled and updates on trilingualchange', async () => {
    const indexDoc = new DOMParser().parseFromString(indexHtml, 'text/html');
    document.body.innerHTML = indexDoc.body.innerHTML;

    runInlinePageScript(indexHtml);
    await new Promise(r => setTimeout(r, 20));

    // Initially trilingual mode is false
    expect(window.POKOPIA_DEX.isTrilingualMode()).toBe(false);
    expect(document.querySelector('.pokemon-card--trilingual')).toBeNull();

    // Toggle via #trilingualQuickBtn / toggleTrilingualQuick
    const quickBtn = document.getElementById('trilingualQuickBtn');
    window.toggleTrilingualQuick();

    expect(window.POKOPIA_DEX.isTrilingualMode()).toBe(true);
    expect(quickBtn.classList.contains('active')).toBe(true);

    const card = document.querySelector('.pokemon-card--trilingual');
    expect(card).not.toBeNull();

    const badgesRow = card.querySelector('.trilingual-badges-row');
    expect(badgesRow).not.toBeNull();
    expect(badgesRow.textContent).toContain('🇹🇼 妙蛙種子');
    expect(badgesRow.textContent).toContain('🇺🇸 Bulbasaur');
    expect(badgesRow.textContent).toContain('🇪🇸 Bulbasaur');
  });

  it('7. index.html toggleCollectFromList calls POKOPIA_BADGES.checkAndNotifyNewBadges({ pokemonData: allPokemon })', async () => {
    const indexDoc = new DOMParser().parseFromString(indexHtml, 'text/html');
    document.body.innerHTML = indexDoc.body.innerHTML;

    const spy = vi.spyOn(window.POKOPIA_BADGES, 'checkAndNotifyNewBadges');
    runInlinePageScript(indexHtml);
    await new Promise(r => setTimeout(r, 20));

    const fakeEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    window.toggleCollectFromList(fakeEvent, 1);

    expect(spy).toHaveBeenCalledWith({ pokemonData: SAMPLE_POKEMON });
  });

  it('8. detail.html renders .trilingual-block for description and ideal habitat when trilingual mode is enabled', async () => {
    const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');
    document.body.innerHTML = detailDoc.body.innerHTML;

    window.history.replaceState({}, '', '/detail.html?id=1');
    window.POKOPIA_DEX.setTrilingualMode(true);

    runInlinePageScript(detailHtml);
    await new Promise(r => setTimeout(r, 20));

    const descBlock = document.querySelector('#descText.trilingual-block');
    expect(descBlock).not.toBeNull();
    expect(descBlock.querySelectorAll('.trilingual-block__row').length).toBe(3);
    expect(descBlock.textContent).toContain('🇹🇼');
    expect(descBlock.textContent).toContain('背上有種子，會行光合作用。');
    expect(descBlock.textContent).toContain('🇺🇸');
    expect(descBlock.textContent).toContain('A strange seed was planted on its back at birth.');
    expect(descBlock.textContent).toContain('🇪🇸');
    expect(descBlock.textContent).toContain('Tiene una semilla en el lomo desde que nace.');

    const habitatBlock = document.querySelector('#idealHabitatTrilingual.trilingual-block');
    expect(habitatBlock).not.toBeNull();
    expect(habitatBlock.querySelectorAll('.trilingual-block__row').length).toBe(3);
    expect(habitatBlock.textContent).toContain('溫暖');
    expect(habitatBlock.textContent).toContain('Warm');
    expect(habitatBlock.textContent).toContain('Cálido');
  });

  it('9. detail.html #playTrilingualBtn calls POKOPIA_SPEECH.playSequentialTrilingual and highlights active language badge via onLangStart', async () => {
    const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');
    document.body.innerHTML = detailDoc.body.innerHTML;

    window.history.replaceState({}, '', '/detail.html?id=1');
    window.POKOPIA_DEX.setTrilingualMode(true);

    runInlinePageScript(detailHtml);
    await new Promise(r => setTimeout(r, 20));

    let capturedOpts = null;
    vi.spyOn(window.POKOPIA_SPEECH, 'playSequentialTrilingual').mockImplementation(async (opts) => {
      capturedOpts = opts;
      if (opts.onLangStart) {
        opts.onLangStart('es');
      }
      return { completed: true, playedLangs: ['zh', 'en', 'es'] };
    });

    const playBtn = document.getElementById('playTrilingualBtn');
    expect(playBtn).not.toBeNull();
    await window.playTrilingualVoice();

    expect(capturedOpts).not.toBeNull();
    expect(capturedOpts.id).toBe(1);
    expect(capturedOpts.type).toBe('pokemon');
    expect(capturedOpts.langs).toEqual(['zh', 'en', 'es']);

    const esBadge = document.querySelector('.trilingual-badge[data-lang="es"]');
    expect(esBadge?.classList.contains('speaking')).toBe(true);
  });

  it('10. detail.html toggleCollect calls POKOPIA_BADGES.checkAndNotifyNewBadges()', async () => {
    const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');
    document.body.innerHTML = detailDoc.body.innerHTML;

    window.history.replaceState({}, '', '/detail.html?id=1');

    const spy = vi.spyOn(window.POKOPIA_BADGES, 'checkAndNotifyNewBadges');
    runInlinePageScript(detailHtml);
    await new Promise(r => setTimeout(r, 20));

    window.toggleCollect();
    expect(spy).toHaveBeenCalled();
  });

  it('11. styles.css defines responsive styles for .trilingual-toggle-btn, .pokemon-card--trilingual, .trilingual-badges-row, .trilingual-block, and #playTrilingualBtn', () => {
    expect(stylesCss).toContain('.trilingual-toggle-btn');
    expect(stylesCss).toContain('.pokemon-card--trilingual');
    expect(stylesCss).toContain('.trilingual-badges-row');
    expect(stylesCss).toContain('.trilingual-block');
    expect(stylesCss).toContain('#playTrilingualBtn');
    expect(stylesCss).toContain('@media (max-width: 400px)');
  });
});
