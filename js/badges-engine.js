/* ============================================
   PokopiaDex - Badges & Achievements Engine
   Defines 13 badges, evaluates unlock criteria,
   persists unlocked badges, and shows celebratory toast + sound.
   ============================================ */

const POKOPIA_BADGES = (() => {
  const UNLOCKED_STORAGE_KEY = 'pokopia-unlocked-badges';
  const COLLECTED_STORAGE_KEY = 'pokopia-collected';
  const STATS_STORAGE_KEY = 'pokopia-stats';
  const QUIZ_STATS_STORAGE_KEY = 'pokopia-quiz-stats';

  const BADGES = [
    // Collection Count Badges (8)
    {
      id: 'collector',
      category: 'collection',
      threshold: 10,
      emoji: '🥉',
      color: '#CD7F32',
      name: {
        zh: '初級收藏家',
        en: 'Junior Collector',
        es: 'Coleccionista Junior'
      },
      desc: {
        zh: '收集 10 隻寶可夢',
        en: 'Collect 10 Pokémon',
        es: 'Recoge 10 Pokémon'
      }
    },
    {
      id: 'explorer',
      category: 'collection',
      threshold: 30,
      emoji: '🧭',
      color: '#4A90D9',
      name: {
        zh: '探險家',
        en: 'Explorer',
        es: 'Explorador'
      },
      desc: {
        zh: '收集 30 隻寶可夢',
        en: 'Collect 30 Pokémon',
        es: 'Recoge 30 Pokémon'
      }
    },
    {
      id: 'veteran',
      category: 'collection',
      threshold: 60,
      emoji: '🛡️',
      color: '#7B68EE',
      name: {
        zh: '老練訓練師',
        en: 'Veteran Trainer',
        es: 'Entrenador Veterano'
      },
      desc: {
        zh: '收集 60 隻寶可夢',
        en: 'Collect 60 Pokémon',
        es: 'Recoge 60 Pokémon'
      }
    },
    {
      id: 'master',
      category: 'collection',
      threshold: 100,
      emoji: '⭐',
      color: '#FFD700',
      name: {
        zh: '寶可夢大師',
        en: 'Pokémon Master',
        es: 'Maestro Pokémon'
      },
      desc: {
        zh: '收集 100 隻寶可夢',
        en: 'Collect 100 Pokémon',
        es: 'Recoge 100 Pokémon'
      }
    },
    {
      id: 'legend',
      category: 'collection',
      threshold: 150,
      emoji: '👑',
      color: '#FF6B35',
      name: {
        zh: '傳說訓練師',
        en: 'Legendary Trainer',
        es: 'Entrenador Legendario'
      },
      desc: {
        zh: '收集 150 隻寶可夢',
        en: 'Collect 150 Pokémon',
        es: 'Recoge 150 Pokémon'
      }
    },
    {
      id: 'completionist',
      category: 'collection',
      threshold: 200,
      emoji: '💎',
      color: '#00CED1',
      name: {
        zh: '完美主義者',
        en: 'Completionist',
        es: 'Perfeccionista'
      },
      desc: {
        zh: '收集 200 隻寶可夢',
        en: 'Collect 200 Pokémon',
        es: 'Recoge 200 Pokémon'
      }
    },
    {
      id: 'ultimate',
      category: 'collection',
      threshold: 250,
      emoji: '🏆',
      color: '#FF1493',
      name: {
        zh: '究極收藏家',
        en: 'Ultimate Collector',
        es: 'Coleccionista Supremo'
      },
      desc: {
        zh: '收集 250 隻寶可夢',
        en: 'Collect 250 Pokémon',
        es: 'Recoge 250 Pokémon'
      }
    },
    {
      id: 'god',
      category: 'collection',
      threshold: 303,
      emoji: '🌟',
      color: '#FFD700',
      name: {
        zh: '寶可夢之神',
        en: 'Pokémon God',
        es: 'Dios Pokémon'
      },
      desc: {
        zh: '收集所有 303 隻寶可夢',
        en: 'Collect all 303 Pokémon',
        es: 'Recoge todos los 303 Pokémon'
      }
    },
    // Special Achievement Badges (5)
    {
      id: 'type_specialist',
      category: 'special',
      threshold: 10,
      emoji: '🔥',
      color: '#FF6B6B',
      name: {
        zh: '屬性專家',
        en: 'Type Specialist',
        es: 'Especialista de Tipo'
      },
      desc: {
        zh: '收集 10 隻同屬性寶可夢',
        en: 'Collect 10 same-type Pokémon',
        es: 'Recoge 10 Pokémon del mismo tipo'
      }
    },
    {
      id: 'habitat_hunter',
      category: 'special',
      threshold: 50,
      emoji: '🏝️',
      color: '#6BCB77',
      name: {
        zh: '棲息地獵人',
        en: 'Habitat Hunter',
        es: 'Cazador de Hábitats'
      },
      desc: {
        zh: '解鎖 50 個棲息地',
        en: 'Unlock 50 habitats',
        es: 'Desbloquea 50 hábitats'
      }
    },
    {
      id: 'night_owl',
      category: 'special',
      threshold: 1,
      emoji: '🦉',
      color: '#5C6BC0',
      name: {
        zh: '夜貓子',
        en: 'Night Owl',
        es: 'Noctámbulo'
      },
      desc: {
        zh: '在深夜使用圖鑑',
        en: 'Use Pokédex at night',
        es: 'Usa el Pokédex de noche'
      }
    },
    {
      id: 'early_bird',
      category: 'special',
      threshold: 1,
      emoji: '🐦',
      color: '#FFB74D',
      name: {
        zh: '早起的鳥兒',
        en: 'Early Bird',
        es: 'Madrugador'
      },
      desc: {
        zh: '在早晨使用圖鑑',
        en: 'Use Pokédex in the morning',
        es: 'Usa el Pokédex por la mañana'
      }
    },
    {
      id: 'quiz_master',
      category: 'special',
      threshold: 1,
      emoji: '🎓',
      color: '#AB47BC',
      name: {
        zh: '猜謎大師',
        en: 'Quiz Master',
        es: 'Maestro del Quiz'
      },
      desc: {
        zh: '猜謎挑戰單場答對 8 題或達成 5 連擊',
        en: 'Score 8+ correct or 5+ combo in Quiz',
        es: 'Logra 8+ aciertos o combo de 5+ en el Quiz'
      }
    }
  ];

  function safeReadJSON(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function getUnlockedBadgeIds() {
    const arr = safeReadJSON(UNLOCKED_STORAGE_KEY, []);
    if (!Array.isArray(arr)) return [];
    return Array.from(new Set(arr.filter(id => typeof id === 'string' && id.trim().length > 0)));
  }

  function saveUnlockedBadgeIds(ids) {
    if (!Array.isArray(ids)) return [];
    const unique = Array.from(new Set(ids.filter(id => typeof id === 'string' && id.trim().length > 0)));
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(unique));
      }
    } catch (e) {
      // Ignore quota / storage errors
    }
    return unique;
  }

  function computeMaxSameTypeCount(collectedSet, pokemonData) {
    if (!Array.isArray(pokemonData) || pokemonData.length === 0 || collectedSet.size === 0) {
      return 0;
    }
    const typeCounts = {};
    for (const poke of pokemonData) {
      if (!poke) continue;
      const pokeId = Number(poke.id !== undefined ? poke.id : poke.pokopia_id);
      if (!collectedSet.has(pokeId)) continue;
      if (Array.isArray(poke.types)) {
        const uniqueTypes = new Set(poke.types.filter(Boolean));
        for (const t of uniqueTypes) {
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        }
      }
    }
    const counts = Object.values(typeCounts);
    return counts.length > 0 ? Math.max(...counts) : 0;
  }

  function computeHabitatProgress(collectedSet, pokemonData, stats) {
    let visitedCount = 0;
    if (stats && Array.isArray(stats.visitedHabitats)) {
      visitedCount = new Set(stats.visitedHabitats).size;
    } else if (stats && typeof stats.visitedHabitatsCount === 'number') {
      visitedCount = stats.visitedHabitatsCount;
    }

    const coveredBiomes = new Set();
    if (Array.isArray(pokemonData) && collectedSet.size > 0) {
      for (const poke of pokemonData) {
        if (!poke) continue;
        const pokeId = Number(poke.id !== undefined ? poke.id : poke.pokopia_id);
        if (!collectedSet.has(pokeId)) continue;
        const biomes = poke.habitat && Array.isArray(poke.habitat.biomes)
          ? poke.habitat.biomes
          : (Array.isArray(poke.biomes) ? poke.biomes : []);
        for (const b of biomes) {
          if (b && (b.id !== undefined || (b.name && b.name.en))) {
            coveredBiomes.add(b.id !== undefined ? String(b.id) : b.name.en);
          } else if (typeof b === 'string' || typeof b === 'number') {
            coveredBiomes.add(String(b));
          }
        }
      }
    }

    return Math.max(visitedCount, coveredBiomes.size);
  }

  function evaluateAllBadges(options = {}) {
    const rawCollected = options.collectedIds !== undefined
      ? options.collectedIds
      : safeReadJSON(COLLECTED_STORAGE_KEY, []);
    const collectedArr = Array.isArray(rawCollected) ? rawCollected : [];
    const collectedSet = new Set(
      collectedArr
        .map(id => Number(id))
        .filter(n => Number.isFinite(n) && n > 0)
    );
    const collectedCount = collectedSet.size;

    const pokemonData = Array.isArray(options.pokemonData) ? options.pokemonData : [];
    const stats = (options.stats && typeof options.stats === 'object')
      ? options.stats
      : safeReadJSON(STATS_STORAGE_KEY, {});
    const quizStats = (options.quizStats && typeof options.quizStats === 'object')
      ? options.quizStats
      : safeReadJSON(QUIZ_STATS_STORAGE_KEY, {});
    const currentHour = (typeof options.currentHour === 'number' && !Number.isNaN(options.currentHour))
      ? options.currentHour
      : new Date().getHours();
    const previouslyUnlocked = Array.isArray(options.previouslyUnlockedIds)
      ? new Set(options.previouslyUnlockedIds)
      : new Set(getUnlockedBadgeIds());

    const maxTypeCount = computeMaxSameTypeCount(collectedSet, pokemonData);
    const habitatCount = computeHabitatProgress(collectedSet, pokemonData, stats);

    const isNightHour = currentHour >= 21 || (currentHour >= 0 && currentHour < 5);
    const isEarlyMorningHour = currentHour >= 5 && currentHour < 9;

    const maxCombo = Math.max(
      Number(quizStats.maxCombo) || 0,
      Number(stats.quizMaxCombo) || 0,
      Number(stats.maxCombo) || 0
    );
    const bestCorrect = Math.max(
      Number(quizStats.bestCorrect) || 0,
      Number(quizStats.bestScore) <= 10 ? (Number(quizStats.bestScore) || 0) : 0,
      Number(stats.quizBestCorrect) || 0,
      Number(stats.quizBestScore) <= 10 ? (Number(stats.quizBestScore) || 0) : 0
    );
    const isQuizMaster = maxCombo >= 5 || bestCorrect >= 8 || Boolean(stats.quizMasterUnlocked);

    return BADGES.map(badge => {
      let current = 0;
      let unlocked = false;

      if (badge.category === 'collection') {
        current = collectedCount;
        unlocked = current >= badge.threshold || previouslyUnlocked.has(badge.id);
      } else if (badge.id === 'type_specialist') {
        current = maxTypeCount;
        unlocked = current >= badge.threshold || previouslyUnlocked.has(badge.id);
      } else if (badge.id === 'habitat_hunter') {
        current = habitatCount;
        unlocked = current >= badge.threshold || previouslyUnlocked.has(badge.id);
      } else if (badge.id === 'night_owl') {
        unlocked = isNightHour || Boolean(stats.nightOwlUnlocked) || previouslyUnlocked.has(badge.id);
        current = unlocked ? 1 : 0;
      } else if (badge.id === 'early_bird') {
        unlocked = isEarlyMorningHour || Boolean(stats.earlyBirdUnlocked) || previouslyUnlocked.has(badge.id);
        current = unlocked ? 1 : 0;
      } else if (badge.id === 'quiz_master') {
        unlocked = isQuizMaster || previouslyUnlocked.has(badge.id);
        current = unlocked ? 1 : 0;
      }

      const progressPercent = unlocked
        ? 100
        : Math.min(100, Math.round((Math.min(current, badge.threshold) / badge.threshold) * 100));

      return {
        id: badge.id,
        category: badge.category,
        emoji: badge.emoji,
        color: badge.color,
        name: badge.name,
        desc: badge.desc,
        unlocked,
        current,
        threshold: badge.threshold,
        target: badge.threshold,
        progress: progressPercent,
        progressPercent
      };
    });
  }

  function playBadgeFanfare() {
    try {
      const AudioCtx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
      if (!AudioCtx) return false;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime || 0;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.12, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.35);
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function renderUnlockToast(newlyUnlocked, lang) {
    if (typeof document === 'undefined' || !document.body || !Array.isArray(newlyUnlocked) || newlyUnlocked.length === 0) {
      return null;
    }

    const currentLang = lang || (typeof localStorage !== 'undefined' && localStorage.getItem('pokopia-lang')) || 'zh';
    const headerMap = {
      zh: '🎉 解鎖新徽章！',
      en: '🎉 New Badge Unlocked!',
      es: '🎉 ¡Nueva Medalla Desbloqueada!'
    };

    const existing = document.querySelector('.badge-unlock-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'badge-unlock-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const names = newlyUnlocked
      .map(b => `${b.emoji} ${(b.name && (b.name[currentLang] || b.name.en)) || b.id}`)
      .join(' · ');

    toast.innerHTML = `
      <div class="badge-unlock-toast__title">${headerMap[currentLang] || headerMap.en}</div>
      <div class="badge-unlock-toast__items">${names}</div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('badge-unlock-toast--hide');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 400);
    }, 4000);

    return toast;
  }

  function checkAndNotifyNewBadges(options = {}) {
    const storedIds = getUnlockedBadgeIds();
    const initialSet = new Set(
      Array.isArray(options.previouslyUnlockedIds)
        ? [...storedIds, ...options.previouslyUnlockedIds]
        : storedIds
    );

    const evaluated = evaluateAllBadges({
      ...options,
      previouslyUnlockedIds: Array.from(initialSet)
    });

    const newlyUnlocked = evaluated.filter(b => b.unlocked && !initialSet.has(b.id));

    if (newlyUnlocked.length > 0) {
      const updatedIds = [
        ...Array.from(initialSet),
        ...newlyUnlocked.map(b => b.id)
      ];
      saveUnlockedBadgeIds(updatedIds);
      if (!options.silent) {
        playBadgeFanfare();
        renderUnlockToast(newlyUnlocked, options.lang);
      }
    }

    return newlyUnlocked;
  }

  return {
    BADGES,
    UNLOCKED_STORAGE_KEY,
    getUnlockedBadgeIds,
    saveUnlockedBadgeIds,
    evaluateAllBadges,
    checkAndNotifyNewBadges,
    playBadgeFanfare,
    renderUnlockToast
  };
})();

if (typeof window !== 'undefined') {
  window.POKOPIA_BADGES = POKOPIA_BADGES;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = POKOPIA_BADGES;
}
