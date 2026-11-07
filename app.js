/* Pokopia Pokédex - Shared JavaScript */

const POKOPIA_DEX = (() => {
  let pokemonData = [];
  const SUPPORTED_LANGS = ['zh', 'en', 'es'];

  function readSavedLang() {
    if (typeof window !== 'undefined' && window.POKOPIA_I18N) {
      return window.POKOPIA_I18N.getLang();
    }
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pokopia-lang') : null;
      return SUPPORTED_LANGS.includes(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  }

  let currentLang = readSavedLang();

  // Type emoji map
  const TYPE_EMOJI = {
    Fire: '🔥', Water: '💧', Grass: '🌿', Electric: '⚡',
    Normal: '⭐', Poison: '☠️', Flying: '🕊️', Rock: '🪨',
    Ghost: '👻', Dragon: '🐉', Ice: '❄️', Fighting: '🥊',
    Psychic: '🔮', Steel: '🛡️', Dark: '🌑', Fairy: '🧚',
    Ground: '🏜️', Bug: '🐛'
  };

  // Favorite category emoji
  const FAV_EMOJI = {
    'Lots of nature': '🌿', 'Soft stuff': '🧸', 'Cute stuff': '💖',
    'Lots of water': '💧', 'Group activities': '🎉', 'Sweet flavors': '🍬',
    'Lots of fire': '🔥', 'Wooden stuff': '🪵', 'Hard stuff': '🪨',
    'Exercise': '💪', 'Spicy flavors': '🌶️', 'Stone stuff': '🪨',
    'Letters and words': '📝', 'Pretty flowers': '🌸', 'Gatherings': '👥',
    'Watching stuff': '👀', 'Ocean vibes': '🌊', 'Luxury': '✨',
    'Shiny stuff': '💎', 'Glass stuff': '🔮', 'Dry flavors': '🫘'
  };

  // Habitat biome emoji
  const BIOME_EMOJI = {
    'Tall grass': '🌾', 'Bench with greenery': '🪑🌿',
    'Pretty flower bed': '🌸', 'Picnic set': '🧺'
  };

  async function loadData() {
    if (pokemonData.length > 0) return pokemonData;
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch('data/pokemon.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        pokemonData = await res.json();
        return pokemonData;
      } catch (e) {
        lastErr = e;
        if (attempt < 2) await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
      }
    }
    throw lastErr;
  }

  function setLang(lang) {
    if (typeof window !== 'undefined' && window.POKOPIA_I18N) {
      currentLang = window.POKOPIA_I18N.setLang(lang);
      return currentLang;
    }
    const validLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';
    currentLang = validLang;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pokopia-lang', validLang);
      }
    } catch {
      // Ignore storage errors
    }
    if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') {
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: validLang } }));
    }
    return validLang;
  }

  function getLang() {
    if (typeof window !== 'undefined' && window.POKOPIA_I18N) {
      currentLang = window.POKOPIA_I18N.getLang();
      return currentLang;
    }
    currentLang = readSavedLang();
    return currentLang;
  }

  function t(key, lang) {
    if (typeof window !== 'undefined' && window.POKOPIA_I18N) {
      return window.POKOPIA_I18N.t(key, lang);
    }
    return key;
  }

  function applyI18nToDOM(root) {
    if (typeof window !== 'undefined' && window.POKOPIA_I18N) {
      return window.POKOPIA_I18N.applyI18nToDOM(root);
    }
  }

  function getName(pokemon, lang) {
    lang = lang || getLang();
    return pokemon.name[lang] || pokemon.name.en;
  }

  function getDescription(pokemon, lang) {
    lang = lang || getLang();
    return pokemon.description[lang] || pokemon.description.en;
  }

  function getBiomeName(biome, lang) {
    lang = lang || getLang();
    return biome.name[lang] || biome.name.en;
  }

  function getIdealHabitat(pokemon, lang) {
    lang = lang || getLang();
    return pokemon.ideal_habitat[lang] || pokemon.ideal_habitat.en;
  }

  function getCollectedIds() {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.getCollectedIds();
    }
    try {
      const parsed = JSON.parse(localStorage.getItem('pokopia-collected') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function isCollected(pokemonId) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.isCollected(pokemonId);
    }
    return getCollectedIds().includes(Number(pokemonId));
  }

  function setCollected(pokemonId) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.setCollected(pokemonId);
    }
    const numId = Number(pokemonId);
    const collected = getCollectedIds();
    if (!collected.includes(numId)) {
      collected.push(numId);
      try {
        localStorage.setItem('pokopia-collected', JSON.stringify(collected));
      } catch {
        // Ignore
      }
    }
    return collected;
  }

  function setUncollected(pokemonId) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.setUncollected(pokemonId);
    }
    const numId = Number(pokemonId);
    const collected = getCollectedIds().filter(id => id !== numId);
    try {
      localStorage.setItem('pokopia-collected', JSON.stringify(collected));
    } catch {
      // Ignore
    }
    return collected;
  }

  function toggleCollected(pokemonId) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.toggleCollected(pokemonId);
    }
    if (isCollected(pokemonId)) {
      setUncollected(pokemonId);
      return false;
    } else {
      setCollected(pokemonId);
      return true;
    }
  }

  function isTrilingualMode() {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.isTrilingualMode();
    }
    try {
      return localStorage.getItem('pokopia-trilingual') === 'true';
    } catch {
      return false;
    }
  }

  function setTrilingualMode(bool) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.setTrilingualMode(bool);
    }
    const enabled = Boolean(bool);
    try {
      localStorage.setItem('pokopia-trilingual', enabled ? 'true' : 'false');
    } catch {
      // Ignore
    }
    if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') {
      document.dispatchEvent(new CustomEvent('trilingualchange', { detail: { enabled } }));
    }
    return enabled;
  }

  function getSpeechRate() {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.getSpeechRate();
    }
    try {
      const num = parseFloat(localStorage.getItem('pokopia-speech-rate'));
      return num === 0.8 || num === 1.0 ? num : 1.0;
    } catch {
      return 1.0;
    }
  }

  function setSpeechRate(rate) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.setSpeechRate(rate);
    }
    const num = Number(rate);
    const valid = num === 0.8 || num === 1.0 ? num : 1.0;
    try {
      localStorage.setItem('pokopia-speech-rate', String(valid));
    } catch {
      // Ignore
    }
    return valid;
  }

  function getStats() {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.getStats();
    }
    return { visitedHabIds: [], quiz: { highScore: 0, maxCombo: 0, gamesPlayed: 0, bestCorrect: 0 }, activeHours: [] };
  }

  function recordHabitatVisit(habitatId) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.recordHabitatVisit(habitatId);
    }
    return getStats();
  }

  function recordQuizResult(result) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.recordQuizResult(result);
    }
    return getStats();
  }

  function recordActiveHour(hour) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.recordActiveHour(hour);
    }
    return getStats();
  }

  function encodeProgressCode(version) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.encodeProgressCode(version);
    }
    return '';
  }

  function decodeProgressCode(codeStr) {
    if (typeof window !== 'undefined' && window.POKOPIA_STORAGE) {
      return window.POKOPIA_STORAGE.decodeProgressCode(codeStr);
    }
    return { ok: false, error: 'Storage engine not loaded' };
  }

  function getStars(count) {
    return '⭐'.repeat(Math.max(1, count || 1));
  }

  function getStarsText(rarity, lang) {
    lang = lang || getLang();
    const map = {
      Common: { zh: '常見', en: 'Common', es: 'Común' },
      Uncommon: { zh: '較稀有', en: 'Uncommon', es: 'Poco común' },
      Rare: { zh: '稀有', en: 'Rare', es: 'Raro' }
    };
    return (map[rarity] || map.Common)[lang] || (map[rarity] || map.Common).en;
  }

  function getTypeEmoji(type) {
    return TYPE_EMOJI[type] || '⭐';
  }

  function getFavEmoji(fav) {
    return FAV_EMOJI[fav] || '❤️';
  }

  function renderLangButtons() {
    const activeLang = getLang();
    const btns = document.querySelectorAll('.lang-btn');
    btns.forEach(btn => {
      const lang = btn.dataset.lang;
      if (lang === activeLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
      btn.addEventListener('click', () => setLang(lang));
    });

    document.addEventListener('langchange', (e) => {
      document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === e.detail.lang);
      });
    });
  }

  function renderTabBar(activeTab) {
    const tabs = document.querySelectorAll('.tab-bar__item');
    tabs.forEach(tab => {
      const tabName = tab.dataset.tab;
      tab.classList.toggle('active', tabName === activeTab);
    });
  }

  return {
    loadData, setLang, getLang, t, applyI18nToDOM,
    getName, getDescription, getBiomeName, getIdealHabitat,
    getCollectedIds, isCollected, setCollected, setUncollected, toggleCollected,
    isTrilingualMode, setTrilingualMode, getSpeechRate, setSpeechRate,
    getStats, recordHabitatVisit, recordQuizResult, recordActiveHour,
    encodeProgressCode, decodeProgressCode,
    getStars, getStarsText, getTypeEmoji, getFavEmoji,
    renderLangButtons, renderTabBar,
    TYPE_EMOJI, FAV_EMOJI, BIOME_EMOJI,
    get currentLang() { return getLang(); }
  };
})();

if (typeof window !== 'undefined') {
  window.POKOPIA_DEX = POKOPIA_DEX;
}
if (typeof module === 'object' && module.exports) {
  module.exports = POKOPIA_DEX;
}