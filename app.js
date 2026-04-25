/* Pokopia Pokédex - Shared JavaScript */

const POKOPIA_DEX = (() => {
  let pokemonData = [];
  let currentLang = localStorage.getItem('pokopia-lang') || 'en';

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
    currentLang = lang;
    localStorage.setItem('pokopia-lang', lang);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  function getLang() {
    return currentLang;
  }

  function getName(pokemon, lang) {
    lang = lang || currentLang;
    return pokemon.name[lang] || pokemon.name.en;
  }

  function getDescription(pokemon, lang) {
    lang = lang || currentLang;
    return pokemon.description[lang] || pokemon.description.en;
  }

  function getBiomeName(biome, lang) {
    lang = lang || currentLang;
    return biome.name[lang] || biome.name.en;
  }

  function getIdealHabitat(pokemon, lang) {
    lang = lang || currentLang;
    return pokemon.ideal_habitat[lang] || pokemon.ideal_habitat.en;
  }

  function isCollected(pokemonId) {
    const collected = JSON.parse(localStorage.getItem('pokopia-collected') || '[]');
    return collected.includes(pokemonId);
  }

  function setCollected(pokemonId) {
    const collected = JSON.parse(localStorage.getItem('pokopia-collected') || '[]');
    if (!collected.includes(pokemonId)) {
      collected.push(pokemonId);
      localStorage.setItem('pokopia-collected', JSON.stringify(collected));
    }
  }

  function setUncollected(pokemonId) {
    let collected = JSON.parse(localStorage.getItem('pokopia-collected') || '[]');
    collected = collected.filter(id => id !== pokemonId);
    localStorage.setItem('pokopia-collected', JSON.stringify(collected));
  }

  function getStars(stars) {
    return '⭐'.repeat(stars);
  }

  function getStarsText(rarity, lang) {
    lang = lang || currentLang;
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

  function getStars(count) {
    return '⭐'.repeat(Math.max(1, count || 1));
  }

  function getFavEmoji(fav) {
    return FAV_EMOJI[fav] || '❤️';
  }

  function renderLangButtons() {
    const btns = document.querySelectorAll('.lang-btn');
    btns.forEach(btn => {
      const lang = btn.dataset.lang;
      if (lang === currentLang) {
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
    loadData, setLang, getLang, getName, getDescription,
    getBiomeName, getIdealHabitat, isCollected, setCollected,
    setUncollected, getStars, getStarsText, getTypeEmoji,
    getFavEmoji, renderLangButtons, renderTabBar, TYPE_EMOJI,
    FAV_EMOJI, BIOME_EMOJI, get currentLang() { return currentLang; }
  };
})();