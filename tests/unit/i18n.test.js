import { describe, it, expect, beforeEach, vi } from 'vitest';
import POKOPIA_I18N from '../../js/i18n.js';

describe('POKOPIA_I18N - Centralized i18n Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('1. defaults to "en" when localStorage has no language saved', () => {
    expect(POKOPIA_I18N.getLang()).toBe('en');
  });

  it('2. setLang("zh") and setLang("es") persist to localStorage and dispatch langchange event', () => {
    const handler = vi.fn();
    document.addEventListener('langchange', handler);

    const resZh = POKOPIA_I18N.setLang('zh');
    expect(resZh).toBe('zh');
    expect(localStorage.getItem('pokopia-lang')).toBe('zh');
    expect(POKOPIA_I18N.getLang()).toBe('zh');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ lang: 'zh' });

    const resEs = POKOPIA_I18N.setLang('es');
    expect(resEs).toBe('es');
    expect(localStorage.getItem('pokopia-lang')).toBe('es');
    expect(POKOPIA_I18N.getLang()).toBe('es');
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[1][0].detail).toEqual({ lang: 'es' });

    document.removeEventListener('langchange', handler);
  });

  it('3. falls back to "en" when an invalid language code is passed to setLang or stored in localStorage', () => {
    const res = POKOPIA_I18N.setLang('fr');
    expect(res).toBe('en');
    expect(POKOPIA_I18N.getLang()).toBe('en');

    localStorage.setItem('pokopia-lang', 'invalid_lang');
    expect(POKOPIA_I18N.getLang()).toBe('en');
  });

  it('4. translates bottom tab bar labels (including tab_quiz) and trilingual_toggle across zh, en, es', () => {
    expect(POKOPIA_I18N.t('tab_quiz', 'zh')).toBe('猜謎挑戰');
    expect(POKOPIA_I18N.t('tab_quiz', 'en')).toBe('Quiz');
    expect(POKOPIA_I18N.t('tab_quiz', 'es')).toBe('Desafío');

    expect(POKOPIA_I18N.t('trilingual_toggle', 'zh')).toBe('🌐 三語');
    expect(POKOPIA_I18N.t('trilingual_toggle', 'en')).toBe('🌐 3-Lang');
    expect(POKOPIA_I18N.t('trilingual_toggle', 'es')).toBe('🌐 3-Idiomas');

    expect(POKOPIA_I18N.t('tab_dex', 'zh')).toBe('圖鑑');
    expect(POKOPIA_I18N.t('tab_habitats', 'es')).toBe('Hábitats');
    expect(POKOPIA_I18N.t('tab_badges', 'en')).toBe('Badges');
    expect(POKOPIA_I18N.t('tab_settings', 'zh')).toBe('設定');
  });

  it('5. includes all 18 Pokémon types and all 13 badges (including quiz_master) in zh, en, es', () => {
    expect(POKOPIA_I18N.POKEMON_TYPES).toHaveLength(18);
    for (const tp of POKOPIA_I18N.POKEMON_TYPES) {
      const key = 'type_' + tp.key;
      expect(POKOPIA_I18N.t(key, 'zh')).toContain(tp.zh);
      expect(POKOPIA_I18N.t(key, 'en')).toContain(tp.en);
      expect(POKOPIA_I18N.t(key, 'es')).toContain(tp.es);
    }

    const badgeIds = [
      'collector', 'explorer', 'veteran', 'master', 'legend',
      'completionist', 'ultimate', 'god', 'type_specialist',
      'habitat_hunter', 'night_owl', 'early_bird', 'quiz_master'
    ];
    for (const bId of badgeIds) {
      for (const lang of ['zh', 'en', 'es']) {
        expect(POKOPIA_I18N.t(bId, lang)).not.toBe(bId);
        expect(POKOPIA_I18N.t(bId + '_desc', lang)).not.toBe(bId + '_desc');
      }
    }

    expect(POKOPIA_I18N.t('quiz_master', 'zh')).toBe('猜謎大師');
    expect(POKOPIA_I18N.t('quiz_master', 'en')).toBe('Quiz Master');
    expect(POKOPIA_I18N.t('quiz_master', 'es')).toBe('Maestro del Quiz');
  });

  it('6. t(key) falls back to English when a key is missing in current language, or returns key if completely unknown', () => {
    POKOPIA_I18N.DICT.en.only_in_english_key = 'English Fallback Value';
    POKOPIA_I18N.setLang('zh');
    expect(POKOPIA_I18N.t('only_in_english_key')).toBe('English Fallback Value');
    delete POKOPIA_I18N.DICT.en.only_in_english_key;

    expect(POKOPIA_I18N.t('non_existent_key_xyz')).toBe('non_existent_key_xyz');
  });

  it('7. applyI18nToDOM updates [data-i18n], [data-i18n-placeholder], and [data-i18n-title] elements', () => {
    document.body.innerHTML = `
      <div>
        <span id="lbl" data-i18n="tab_quiz"></span>
        <input id="inp" data-i18n-placeholder="search_placeholder" />
        <button id="btn" data-i18n-title="trilingual_toggle"></button>
      </div>
    `;

    POKOPIA_I18N.setLang('zh');
    POKOPIA_I18N.applyI18nToDOM(document);

    expect(document.getElementById('lbl').textContent).toBe('猜謎挑戰');
    expect(document.getElementById('inp').placeholder).toBe('搜尋寶可夢...');
    expect(document.getElementById('btn').title).toBe('🌐 三語');
    expect(document.getElementById('btn').getAttribute('aria-label')).toBe('🌐 三語');

    POKOPIA_I18N.setLang('es');
    POKOPIA_I18N.applyI18nToDOM();

    expect(document.getElementById('lbl').textContent).toBe('Desafío');
    expect(document.getElementById('inp').placeholder).toBe('Buscar Pokémon...');
    expect(document.getElementById('btn').title).toBe('🌐 3-Idiomas');
    expect(document.getElementById('btn').getAttribute('aria-label')).toBe('🌐 3-Idiomas');
  });
});
