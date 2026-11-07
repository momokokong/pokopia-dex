/* Pokopia Pokédex - Storage & Persistence Engine */

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.POKOPIA_STORAGE = api;
  }
  if (root && typeof root === 'object') {
    root.POKOPIA_STORAGE = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  const KEYS = {
    COLLECTED: 'pokopia-collected',
    LANG: 'pokopia-lang',
    TRILINGUAL: 'pokopia-trilingual',
    SPEECH_RATE: 'pokopia-speech-rate',
    STATS: 'pokopia-stats'
  };

  function safeGetJSON(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined || raw === '') return fallback;
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function safeSetJSON(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Ignore storage quota / security errors
    }
  }

  // ---- Collection Methods ----

  function getCollectedIds() {
    const data = safeGetJSON(KEYS.COLLECTED, []);
    if (!Array.isArray(data)) return [];
    const seen = new Set();
    const clean = [];
    for (const item of data) {
      const num = Number(item);
      if (Number.isInteger(num) && num > 0 && !seen.has(num)) {
        seen.add(num);
        clean.push(num);
      }
    }
    return clean;
  }

  function isCollected(id) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) return false;
    return getCollectedIds().includes(numId);
  }

  function setCollected(id) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) return getCollectedIds();
    const collected = getCollectedIds();
    if (!collected.includes(numId)) {
      collected.push(numId);
      safeSetJSON(KEYS.COLLECTED, collected);
    }
    return collected;
  }

  function setUncollected(id) {
    const numId = Number(id);
    const collected = getCollectedIds().filter(item => item !== numId);
    safeSetJSON(KEYS.COLLECTED, collected);
    return collected;
  }

  function toggleCollected(id) {
    if (isCollected(id)) {
      setUncollected(id);
      return false;
    } else {
      setCollected(id);
      return true;
    }
  }

  // ---- Trilingual Mode ----

  function isTrilingualMode() {
    try {
      if (typeof localStorage === 'undefined') return false;
      return localStorage.getItem(KEYS.TRILINGUAL) === 'true';
    } catch {
      return false;
    }
  }

  function setTrilingualMode(bool) {
    const enabled = Boolean(bool);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEYS.TRILINGUAL, enabled ? 'true' : 'false');
      }
    } catch {
      // Ignore storage errors
    }
    if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') {
      document.dispatchEvent(new CustomEvent('trilingualchange', { detail: { enabled } }));
    }
    return enabled;
  }

  // ---- Speech Rate ----

  function getSpeechRate() {
    try {
      if (typeof localStorage === 'undefined') return 1.0;
      const raw = localStorage.getItem(KEYS.SPEECH_RATE);
      const num = parseFloat(raw);
      return num === 0.8 || num === 1.0 ? num : 1.0;
    } catch {
      return 1.0;
    }
  }

  function setSpeechRate(rate) {
    const num = Number(rate);
    const validRate = num === 0.8 || num === 1.0 ? num : 1.0;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEYS.SPEECH_RATE, String(validRate));
      }
    } catch {
      // Ignore storage errors
    }
    return validRate;
  }

  // ---- Stats Tracking ----

  function createDefaultStats() {
    return {
      visitedHabIds: [],
      quiz: {
        highScore: 0,
        maxCombo: 0,
        gamesPlayed: 0,
        bestCorrect: 0
      },
      activeHours: []
    };
  }

  function normalizeStats(raw) {
    const def = createDefaultStats();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return def;

    const visitedHabIds = Array.isArray(raw.visitedHabIds)
      ? [...new Set(raw.visitedHabIds.filter(x => x !== null && x !== undefined))]
      : [];

    const rawQuiz = raw.quiz && typeof raw.quiz === 'object' ? raw.quiz : {};
    const quiz = {
      highScore: Number.isFinite(Number(rawQuiz.highScore)) ? Math.max(0, Number(rawQuiz.highScore)) : 0,
      maxCombo: Number.isFinite(Number(rawQuiz.maxCombo)) ? Math.max(0, Number(rawQuiz.maxCombo)) : 0,
      gamesPlayed: Number.isFinite(Number(rawQuiz.gamesPlayed)) ? Math.max(0, Number(rawQuiz.gamesPlayed)) : 0,
      bestCorrect: Number.isFinite(Number(rawQuiz.bestCorrect)) ? Math.max(0, Number(rawQuiz.bestCorrect)) : 0
    };

    const activeHours = Array.isArray(raw.activeHours)
      ? [...new Set(raw.activeHours.map(Number).filter(h => Number.isInteger(h) && h >= 0 && h <= 23))]
      : [];

    return {
      visitedHabIds,
      quiz,
      activeHours
    };
  }

  function getStats() {
    const raw = safeGetJSON(KEYS.STATS, null);
    return normalizeStats(raw);
  }

  function recordHabitatVisit(habitatId) {
    if (habitatId === null || habitatId === undefined || habitatId === '') return getStats();
    const stats = getStats();
    const normId = Number.isInteger(Number(habitatId)) ? Number(habitatId) : habitatId;
    if (!stats.visitedHabIds.includes(normId)) {
      stats.visitedHabIds.push(normId);
      safeSetJSON(KEYS.STATS, stats);
    }
    return stats;
  }

  function recordQuizResult(result = {}) {
    const stats = getStats();
    const score = Number.isFinite(Number(result.score)) ? Math.max(0, Number(result.score)) : 0;
    const maxCombo = Number.isFinite(Number(result.maxCombo)) ? Math.max(0, Number(result.maxCombo)) : 0;
    const correct = Number.isFinite(Number(result.correct)) ? Math.max(0, Number(result.correct)) : 0;

    stats.quiz.gamesPlayed += 1;
    if (score > stats.quiz.highScore) {
      stats.quiz.highScore = score;
    }
    if (maxCombo > stats.quiz.maxCombo) {
      stats.quiz.maxCombo = maxCombo;
    }
    if (correct > stats.quiz.bestCorrect) {
      stats.quiz.bestCorrect = correct;
    }
    safeSetJSON(KEYS.STATS, stats);
    return stats;
  }

  function recordActiveHour(hour) {
    const h = hour !== undefined ? Number(hour) : new Date().getHours();
    if (!Number.isInteger(h) || h < 0 || h > 23) return getStats();
    const stats = getStats();
    if (!stats.activeHours.includes(h)) {
      stats.activeHours.push(h);
      safeSetJSON(KEYS.STATS, stats);
    }
    return stats;
  }

  // ---- Base64URL Helpers ----

  function toBase64Url(jsonStr) {
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(b64UrlStr) {
    let base64 = b64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return decodeURIComponent(escape(atob(base64)));
  }

  // ---- Progress Code Sync (v1 & v2) ----

  function encodeProgressCode(version = 2) {
    const collected = getCollectedIds();
    const lang = (typeof localStorage !== 'undefined' && localStorage.getItem(KEYS.LANG)) || 'en';
    const trilingual = isTrilingualMode();
    const stats = getStats();

    if (version === 1) {
      const payloadV1 = { v: 1, c: collected, l: lang, t: trilingual };
      return 'POKOPIA:v1:' + toBase64Url(JSON.stringify(payloadV1));
    }

    const payloadV2 = {
      v: 2,
      c: collected,
      l: lang,
      t: trilingual,
      s: stats
    };
    return 'POKOPIA:v2:' + toBase64Url(JSON.stringify(payloadV2));
  }

  function decodeProgressCode(codeStr) {
    if (!codeStr || typeof codeStr !== 'string') {
      return { ok: false, error: 'Empty or non-string progress code' };
    }
    const trimmed = codeStr.trim();
    if (!trimmed.startsWith('POKOPIA:')) {
      return { ok: false, error: 'Invalid prefix: must start with POKOPIA:' };
    }

    let encodedPart = '';
    let explicitVersion = null;

    if (trimmed.startsWith('POKOPIA:v2:')) {
      explicitVersion = 2;
      encodedPart = trimmed.slice('POKOPIA:v2:'.length);
    } else if (trimmed.startsWith('POKOPIA:v1:')) {
      explicitVersion = 1;
      encodedPart = trimmed.slice('POKOPIA:v1:'.length);
    } else {
      encodedPart = trimmed.slice('POKOPIA:'.length);
    }

    if (!encodedPart) {
      return { ok: false, error: 'Empty payload in progress code' };
    }

    try {
      const jsonStr = fromBase64Url(encodedPart);
      const payload = JSON.parse(jsonStr);

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { ok: false, error: 'Invalid payload object' };
      }

      const version = explicitVersion || payload.v || 1;
      const rawCollected = Array.isArray(payload.c)
        ? payload.c
        : Array.isArray(payload.collected)
          ? payload.collected
          : null;

      if (!Array.isArray(rawCollected)) {
        return { ok: false, error: 'Missing or invalid collected array in payload' };
      }

      const collected = [...new Set(
        rawCollected
          .map(Number)
          .filter(n => Number.isInteger(n) && n > 0)
      )];

      const validLangs = ['zh', 'en', 'es'];
      const rawLang = payload.l || payload.lang || 'en';
      const lang = validLangs.includes(rawLang) ? rawLang : 'en';

      const trilingual = Boolean(
        typeof payload.t === 'boolean' ? payload.t : payload.trilingual
      );

      const stats = normalizeStats(payload.s || payload.stats);

      const data = {
        version,
        collected,
        lang,
        trilingual,
        stats,
        // Keep short aliases for backward compatibility with settings.html
        v: version,
        c: collected,
        l: lang,
        t: trilingual,
        s: stats
      };

      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: 'Failed to decode or parse progress code: ' + (e && e.message ? e.message : 'invalid format') };
    }
  }

  return {
    KEYS,
    getCollectedIds,
    isCollected,
    setCollected,
    setUncollected,
    toggleCollected,
    isTrilingualMode,
    setTrilingualMode,
    getSpeechRate,
    setSpeechRate,
    getStats,
    recordHabitatVisit,
    recordQuizResult,
    recordActiveHour,
    encodeProgressCode,
    decodeProgressCode
  };
});
