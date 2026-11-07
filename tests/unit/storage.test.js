import { describe, it, expect, beforeEach, vi } from 'vitest';
import POKOPIA_STORAGE from '../../js/storage.js';
import POKOPIA_I18N from '../../js/i18n.js';
import POKOPIA_DEX from '../../app.js';

describe('POKOPIA_STORAGE & POKOPIA_DEX - Persistence & Sync Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. safely handles corrupted JSON in localStorage without throwing', () => {
    localStorage.setItem('pokopia-collected', '{bad-json-string');
    localStorage.setItem('pokopia-stats', 'not_json_at_all');

    expect(() => POKOPIA_STORAGE.getCollectedIds()).not.toThrow();
    expect(POKOPIA_STORAGE.getCollectedIds()).toEqual([]);
    expect(POKOPIA_STORAGE.isCollected(1)).toBe(false);

    expect(() => POKOPIA_STORAGE.getStats()).not.toThrow();
    expect(POKOPIA_STORAGE.getStats()).toEqual({
      visitedHabIds: [],
      quiz: { highScore: 0, maxCombo: 0, gamesPlayed: 0, bestCorrect: 0 },
      activeHours: []
    });
  });

  it('2. manages collection IDs without duplicates (setCollected, setUncollected, toggleCollected)', () => {
    expect(POKOPIA_STORAGE.getCollectedIds()).toEqual([]);

    POKOPIA_STORAGE.setCollected(1);
    POKOPIA_STORAGE.setCollected(1); // duplicate
    POKOPIA_STORAGE.setCollected(25);
    expect(POKOPIA_STORAGE.getCollectedIds()).toEqual([1, 25]);
    expect(POKOPIA_STORAGE.isCollected(1)).toBe(true);
    expect(POKOPIA_STORAGE.isCollected(99)).toBe(false);

    POKOPIA_STORAGE.setUncollected(1);
    expect(POKOPIA_STORAGE.isCollected(1)).toBe(false);
    expect(POKOPIA_STORAGE.getCollectedIds()).toEqual([25]);

    const toggledOn = POKOPIA_STORAGE.toggleCollected(133);
    expect(toggledOn).toBe(true);
    expect(POKOPIA_STORAGE.isCollected(133)).toBe(true);

    const toggledOff = POKOPIA_STORAGE.toggleCollected(133);
    expect(toggledOff).toBe(false);
    expect(POKOPIA_STORAGE.isCollected(133)).toBe(false);
  });

  it('3. manages trilingual mode and dispatches trilingualchange event', () => {
    const handler = vi.fn();
    document.addEventListener('trilingualchange', handler);

    expect(POKOPIA_STORAGE.isTrilingualMode()).toBe(false);

    POKOPIA_STORAGE.setTrilingualMode(true);
    expect(POKOPIA_STORAGE.isTrilingualMode()).toBe(true);
    expect(localStorage.getItem('pokopia-trilingual')).toBe('true');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ enabled: true });

    POKOPIA_STORAGE.setTrilingualMode(false);
    expect(POKOPIA_STORAGE.isTrilingualMode()).toBe(false);
    expect(localStorage.getItem('pokopia-trilingual')).toBe('false');

    document.removeEventListener('trilingualchange', handler);
  });

  it('4. validates speech rate (0.8 or 1.0, defaults to 1.0)', () => {
    expect(POKOPIA_STORAGE.getSpeechRate()).toBe(1.0);

    POKOPIA_STORAGE.setSpeechRate(0.8);
    expect(POKOPIA_STORAGE.getSpeechRate()).toBe(0.8);
    expect(localStorage.getItem('pokopia-speech-rate')).toBe('0.8');

    POKOPIA_STORAGE.setSpeechRate(2.5); // invalid rate -> fallback 1.0
    expect(POKOPIA_STORAGE.getSpeechRate()).toBe(1.0);
  });

  it('5. tracks habitat visits, quiz results, and active hours in stats', () => {
    POKOPIA_STORAGE.recordHabitatVisit(5);
    POKOPIA_STORAGE.recordHabitatVisit(5); // duplicate
    POKOPIA_STORAGE.recordHabitatVisit(12);

    POKOPIA_STORAGE.recordQuizResult({ score: 650, maxCombo: 4, correct: 6, total: 10 });
    POKOPIA_STORAGE.recordQuizResult({ score: 900, maxCombo: 7, correct: 9, total: 10 });
    POKOPIA_STORAGE.recordQuizResult({ score: 400, maxCombo: 2, correct: 4, total: 10 });

    POKOPIA_STORAGE.recordActiveHour(23);
    POKOPIA_STORAGE.recordActiveHour(23);
    POKOPIA_STORAGE.recordActiveHour(7);

    const stats = POKOPIA_STORAGE.getStats();
    expect(stats.visitedHabIds).toEqual([5, 12]);
    expect(stats.quiz.gamesPlayed).toBe(3);
    expect(stats.quiz.highScore).toBe(900);
    expect(stats.quiz.maxCombo).toBe(7);
    expect(stats.quiz.bestCorrect).toBe(9);
    expect(stats.activeHours).toEqual([23, 7]);
  });

  it('6. encodes and decodes POKOPIA:v2: progress codes preserving collected IDs, trilingual mode, and stats', () => {
    POKOPIA_I18N.setLang('zh');
    POKOPIA_STORAGE.setCollected(1);
    POKOPIA_STORAGE.setCollected(4);
    POKOPIA_STORAGE.setCollected(7);
    POKOPIA_STORAGE.setTrilingualMode(true);
    POKOPIA_STORAGE.recordHabitatVisit(3);
    POKOPIA_STORAGE.recordQuizResult({ score: 850, maxCombo: 6, correct: 8, total: 10 });

    const codeV2 = POKOPIA_STORAGE.encodeProgressCode();
    expect(codeV2.startsWith('POKOPIA:v2:')).toBe(true);

    const decoded = POKOPIA_STORAGE.decodeProgressCode(codeV2);
    expect(decoded.ok).toBe(true);
    expect(decoded.data.version).toBe(2);
    expect(decoded.data.collected).toEqual([1, 4, 7]);
    expect(decoded.data.lang).toBe('zh');
    expect(decoded.data.trilingual).toBe(true);
    expect(decoded.data.stats.visitedHabIds).toEqual([3]);
    expect(decoded.data.stats.quiz.highScore).toBe(850);
    expect(decoded.data.stats.quiz.maxCombo).toBe(6);
  });

  it('7. decodes legacy POKOPIA:v1: and POKOPIA:<base64> progress codes seamlessly', () => {
    const codeV1 = POKOPIA_STORAGE.encodeProgressCode(1);
    expect(codeV1.startsWith('POKOPIA:v1:')).toBe(true);

    const resV1 = POKOPIA_STORAGE.decodeProgressCode(codeV1);
    expect(resV1.ok).toBe(true);
    expect(resV1.data.version).toBe(1);

    // Also test legacy settings.html format: POKOPIA:<base64url> without v1: prefix
    const legacyPayload = { v: 1, c: [10, 20, 30], l: 'es', t: true };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(legacyPayload))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const legacyCode = 'POKOPIA:' + b64;

    const resLegacy = POKOPIA_STORAGE.decodeProgressCode(legacyCode);
    expect(resLegacy.ok).toBe(true);
    expect(resLegacy.data.collected).toEqual([10, 20, 30]);
    expect(resLegacy.data.lang).toBe('es');
    expect(resLegacy.data.trilingual).toBe(true);
  });

  it('8. returns clear error object on invalid progress codes', () => {
    expect(POKOPIA_STORAGE.decodeProgressCode('')).toEqual({
      ok: false,
      error: expect.stringContaining('Empty')
    });
    expect(POKOPIA_STORAGE.decodeProgressCode('INVALID:12345')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid prefix')
    });
    expect(POKOPIA_STORAGE.decodeProgressCode('POKOPIA:v2:!!!not_base64!!!').ok).toBe(false);
  });

  it('9. POKOPIA_DEX delegates to POKOPIA_I18N and POKOPIA_STORAGE cleanly with 100% backward compatibility', () => {
    POKOPIA_DEX.setLang('es');
    expect(POKOPIA_DEX.getLang()).toBe('es');
    expect(POKOPIA_DEX.currentLang).toBe('es');
    expect(POKOPIA_DEX.t('tab_quiz')).toBe('Desafío');

    POKOPIA_DEX.setCollected(150);
    expect(POKOPIA_DEX.isCollected(150)).toBe(true);
    expect(POKOPIA_DEX.getCollectedIds()).toEqual([150]);

    POKOPIA_DEX.setTrilingualMode(true);
    expect(POKOPIA_DEX.isTrilingualMode()).toBe(true);

    POKOPIA_DEX.setUncollected(150);
    expect(POKOPIA_DEX.isCollected(150)).toBe(false);
  });
});
