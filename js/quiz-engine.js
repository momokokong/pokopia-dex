/**
 * Pokopia Quiz Engine (js/quiz-engine.js)
 * Pure, testable quiz state machine & question generator supporting:
 * - Modes: 'ALL' (random across A/B/C/D/E), 'A' (Image -> Name), 'B' (Image -> Description),
 *          'C' (Name -> Image), 'D' (Description -> Name), 'E' (Audio -> Name)
 * - Configurable questionLang ('zh'|'en'|'es'|'random') and optionsLang ('zh'|'en'|'es'|'random')
 * - Combo & Scoring math: +100 base + (combo - 1) * 25 bonus
 * - Persistence to localStorage ('pokopia-quiz-stats' and 'pokopia-stats')
 */

(function (root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = exported;
  }
  if (typeof root !== 'undefined') {
    root.POKOPIA_QUIZ_ENGINE = exported;
    root.QuizEngine = exported.QuizEngine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const VALID_MODES = ['A', 'B', 'C', 'D', 'E'];
  const VALID_LANGS = ['zh', 'en', 'es'];

  const LANG_LABELS = {
    zh: '中文',
    en: 'English',
    es: 'Español'
  };

  const PROMPT_TEMPLATES = {
    A: {
      zh: (optLangLabel) => `這是誰？ (${optLangLabel})`,
      en: (optLangLabel) => `Who's that Pokémon? (${optLangLabel})`,
      es: (optLangLabel) => `¿Quién es este Pokémon? (${optLangLabel})`
    },
    B: {
      zh: (optLangLabel) => `這是什麼描述？ (${optLangLabel})`,
      en: (optLangLabel) => `Which description matches this Pokémon? (${optLangLabel})`,
      es: (optLangLabel) => `¿Qué descripción corresponde a este Pokémon? (${optLangLabel})`
    },
    C: {
      zh: (name, qLangLabel) => `誰是「${name}」？ (${qLangLabel})`,
      en: (name, qLangLabel) => `Which one is "${name}"? (${qLangLabel})`,
      es: (name, qLangLabel) => `¿Cuál es "${name}"? (${qLangLabel})`
    },
    D: {
      zh: (desc, qLangLabel) => `誰是「${desc}」？ (${qLangLabel})`,
      en: (desc, qLangLabel) => `Who matches: "${desc}"? (${qLangLabel})`,
      es: (desc, qLangLabel) => `¿Quién coincide con: "${desc}"? (${qLangLabel})`
    },
    E: {
      zh: (qLangLabel, optLangLabel) => `🔊 仔細聽發音，這是哪隻寶可夢？ (${qLangLabel} ➔ ${optLangLabel})`,
      en: (qLangLabel, optLangLabel) => `🔊 Listen closely! Who is this Pokémon? (${qLangLabel} ➔ ${optLangLabel})`,
      es: (qLangLabel, optLangLabel) => `🔊 ¡Escucha con atención! ¿Qué Pokémon es? (${qLangLabel} ➔ ${optLangLabel})`
    }
  };

  function resolveLang(langConfig, rng = Math.random) {
    if (VALID_LANGS.includes(langConfig)) {
      return langConfig;
    }
    return VALID_LANGS[Math.floor(rng() * VALID_LANGS.length)];
  }

  function resolveMode(modeConfig, rng = Math.random) {
    if (VALID_MODES.includes(modeConfig)) {
      return modeConfig;
    }
    return VALID_MODES[Math.floor(rng() * VALID_MODES.length)];
  }

  function getPokemonName(pokemon, lang = 'en') {
    if (!pokemon) return '';
    const nameObj = pokemon.name || pokemon.names || {};
    return nameObj[lang] || nameObj.en || nameObj.zh || nameObj.es || '';
  }

  function getPokemonDescription(pokemon, lang = 'en') {
    if (!pokemon) return '';
    const descObj = pokemon.description || pokemon.descriptions || {};
    return descObj[lang] || descObj.en || descObj.zh || descObj.es || '';
  }

  function getPokemonNumber(pokemon) {
    if (!pokemon) return 1;
    return pokemon.pokedex_number || pokemon.id || pokemon.pokopia_id || 1;
  }

  function getSpriteUrl(pokemon) {
    const num = getPokemonNumber(pokemon);
    return `assets/sprites/${num}.png`;
  }

  function getAudioUrl(pokemon, lang = 'en') {
    const rawId = pokemon ? (pokemon.pokopia_id || pokemon.id || pokemon.pokedex_number || 1) : 1;
    const paddedId = String(rawId).padStart(3, '0');
    return `/output/karaoke/${paddedId}/${lang}/name.mp3`;
  }

  function shuffleArray(items, rng = Math.random) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /**
   * Generates a structured quiz question from pokemonList.
   * @param {Array} pokemonList - Array of pokemon objects from data/pokemon.json
   * @param {Object} config - { mode, questionLang, optionsLang, uiLang, rng, optionCount }
   */
  function generateQuestion(pokemonList, config = {}) {
    if (!Array.isArray(pokemonList) || pokemonList.length < 3) {
      throw new Error('pokemonList must contain at least 3 Pokémon');
    }

    const rng = typeof config.rng === 'function' ? config.rng : Math.random;
    const mode = resolveMode(config.mode || 'ALL', rng);
    const questionLang = resolveLang(config.questionLang || 'random', rng);
    const optionsLang = resolveLang(config.optionsLang || 'random', rng);
    const uiLang = VALID_LANGS.includes(config.uiLang) ? config.uiLang : 'zh';
    const optionCount = Math.min(config.optionCount || 3, pokemonList.length);

    // Pick 1 target Pokemon
    const targetIndex = Math.floor(rng() * pokemonList.length);
    const target = pokemonList[targetIndex];

    const getOptionValue = (poke) => {
      if (mode === 'B') {
        return getPokemonDescription(poke, optionsLang);
      }
      if (mode === 'C') {
        return getPokemonNumber(poke);
      }
      // Modes A, D, E all use Pokemon name in optionsLang
      return getPokemonName(poke, optionsLang);
    };

    const correctAnswer = getOptionValue(target);
    const selectedPokemons = [target];
    const usedIds = new Set([getPokemonNumber(target)]);
    const usedValues = new Set([correctAnswer]);

    // Pick distinct distractors ensuring unique option values
    const candidateIndices = shuffleArray(
      pokemonList.map((_, idx) => idx).filter((idx) => idx !== targetIndex),
      rng
    );

    for (const idx of candidateIndices) {
      if (selectedPokemons.length >= optionCount) break;
      const candidate = pokemonList[idx];
      const candidateNum = getPokemonNumber(candidate);
      const candidateVal = getOptionValue(candidate);
      if (!usedIds.has(candidateNum) && !usedValues.has(candidateVal) && candidateVal !== '') {
        usedIds.add(candidateNum);
        usedValues.add(candidateVal);
        selectedPokemons.push(candidate);
      }
    }

    // Fallback if dataset has duplicate values in small test fixtures
    if (selectedPokemons.length < optionCount) {
      for (const idx of candidateIndices) {
        if (selectedPokemons.length >= optionCount) break;
        const candidate = pokemonList[idx];
        const candidateVal = getOptionValue(candidate);
        if (!usedValues.has(candidateVal)) {
          usedValues.add(candidateVal);
          selectedPokemons.push(candidate);
        }
      }
    }

    const shuffledPokemons = shuffleArray(selectedPokemons, rng);
    const options = shuffledPokemons.map((p) => getOptionValue(p));
    const optionItems = shuffledPokemons.map((p) => ({
      value: getOptionValue(p),
      label: mode === 'C' ? getPokemonName(p, optionsLang) : String(getOptionValue(p)),
      spriteUrl: getSpriteUrl(p),
      pokemon: p
    }));

    const spriteUrl = getSpriteUrl(target);
    const audioUrl = getAudioUrl(target, questionLang);

    const qLangLabel = LANG_LABELS[questionLang] || questionLang;
    const optLangLabel = LANG_LABELS[optionsLang] || optionsLang;
    const templates = PROMPT_TEMPLATES[mode] || PROMPT_TEMPLATES.A;
    const templateFn = templates[uiLang] || templates.zh;

    let promptText = '';
    if (mode === 'A' || mode === 'B') {
      promptText = templateFn(optLangLabel);
    } else if (mode === 'C') {
      promptText = templateFn(getPokemonName(target, questionLang), qLangLabel);
    } else if (mode === 'D') {
      promptText = templateFn(getPokemonDescription(target, questionLang), qLangLabel);
    } else if (mode === 'E') {
      promptText = templateFn(qLangLabel, optLangLabel);
    }

    return {
      mode,
      target,
      questionLang,
      optionsLang,
      promptText,
      audioUrl,
      spriteUrl,
      correctAnswer,
      options,
      optionItems
    };
  }

  class QuizEngine {
    constructor(pokemonList = [], options = {}) {
      this.pokemonData = Array.isArray(pokemonList) ? pokemonList : [];
      this.totalQuestions = options.totalQuestions || 10;
      this.mode = options.mode || 'ALL';
      this.questionLang = options.questionLang || 'random';
      this.optionsLang = options.optionsLang || 'random';
      this.uiLang = options.uiLang || 'zh';
      this.rng = typeof options.rng === 'function' ? options.rng : Math.random;

      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.correctCount = 0;
      this.currentQuestionIndex = 0;
      this.currentQuestion = null;
      this.gameActive = false;
      this.isFinished = false;
      this.answeredCurrent = false;
    }

    setPokemonData(pokemonList) {
      this.pokemonData = Array.isArray(pokemonList) ? pokemonList : [];
    }

    setConfig(config = {}) {
      if (config.mode !== undefined) this.mode = config.mode;
      if (config.questionLang !== undefined) this.questionLang = config.questionLang;
      if (config.optionsLang !== undefined) this.optionsLang = config.optionsLang;
      if (config.uiLang !== undefined) this.uiLang = config.uiLang;
      if (config.totalQuestions !== undefined) this.totalQuestions = config.totalQuestions;
    }

    startNewGame(config = {}) {
      this.setConfig(config);
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.correctCount = 0;
      this.currentQuestionIndex = 0;
      this.isFinished = false;
      this.answeredCurrent = false;
      this.gameActive = true;

      if (this.pokemonData.length >= 3) {
        this.currentQuestion = this.generateQuestion();
      } else {
        this.currentQuestion = null;
      }
      return this.currentQuestion;
    }

    generateQuestion(pokemonList = this.pokemonData, config = {}) {
      const mergedConfig = {
        mode: config.mode || this.mode,
        questionLang: config.questionLang || this.questionLang,
        optionsLang: config.optionsLang || this.optionsLang,
        uiLang: config.uiLang || this.uiLang,
        rng: config.rng || this.rng
      };
      this.currentQuestion = generateQuestion(pokemonList, mergedConfig);
      return this.currentQuestion;
    }

    getQuestionNumber() {
      return Math.min(this.currentQuestionIndex + 1, this.totalQuestions);
    }

    submitAnswer(selectedValue) {
      if (!this.currentQuestion || this.isFinished || this.answeredCurrent) {
        return {
          isCorrect: false,
          pointsEarned: 0,
          score: this.score,
          combo: this.combo,
          maxCombo: this.maxCombo,
          correctCount: this.correctCount,
          correctAnswer: this.currentQuestion ? this.currentQuestion.correctAnswer : null,
          questionIndex: this.currentQuestionIndex,
          questionNumber: this.getQuestionNumber(),
          totalQuestions: this.totalQuestions
        };
      }

      this.answeredCurrent = true;
      this.gameActive = false;

      const isCorrect = selectedValue === this.currentQuestion.correctAnswer;
      let pointsEarned = 0;

      if (isCorrect) {
        this.combo += 1;
        this.correctCount += 1;
        if (this.combo > this.maxCombo) {
          this.maxCombo = this.combo;
        }
        pointsEarned = 100 + (this.combo - 1) * 25;
        this.score += pointsEarned;
      } else {
        this.combo = 0;
        pointsEarned = 0;
      }

      return {
        isCorrect,
        pointsEarned,
        score: this.score,
        combo: this.combo,
        maxCombo: this.maxCombo,
        correctCount: this.correctCount,
        correctAnswer: this.currentQuestion.correctAnswer,
        questionIndex: this.currentQuestionIndex,
        questionNumber: this.getQuestionNumber(),
        totalQuestions: this.totalQuestions
      };
    }

    nextQuestion() {
      if (this.isFinished) {
        return null;
      }

      this.currentQuestionIndex += 1;
      if (this.currentQuestionIndex >= this.totalQuestions) {
        this.endGame();
        return null;
      }

      this.answeredCurrent = false;
      this.gameActive = true;
      if (this.pokemonData.length >= 3) {
        this.currentQuestion = this.generateQuestion();
      }
      return this.currentQuestion;
    }

    endGame() {
      this.gameActive = false;
      this.isFinished = true;
      return this.saveStats();
    }

    saveStats() {
      const accuracy = this.totalQuestions > 0
        ? Math.round((this.correctCount / this.totalQuestions) * 100)
        : 0;
      const unlockedQuizMaster = this.correctCount >= 8 || this.maxCombo >= 5;

      const summary = {
        score: this.score,
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        accuracy,
        maxCombo: this.maxCombo,
        quizMasterUnlocked: unlockedQuizMaster,
        timestamp: Date.now()
      };

      try {
        if (typeof localStorage !== 'undefined') {
          let prevQuizStats = {};
          try {
            prevQuizStats = JSON.parse(localStorage.getItem('pokopia-quiz-stats') || '{}') || {};
          } catch (_) {
            prevQuizStats = {};
          }

          const updatedQuizStats = {
            gamesPlayed: (prevQuizStats.gamesPlayed || 0) + 1,
            highScore: Math.max(prevQuizStats.highScore || 0, this.score),
            maxCombo: Math.max(prevQuizStats.maxCombo || 0, this.maxCombo),
            bestCorrectCount: Math.max(prevQuizStats.bestCorrectCount || 0, this.correctCount),
            totalCorrect: (prevQuizStats.totalCorrect || 0) + this.correctCount,
            totalQuestions: (prevQuizStats.totalQuestions || 0) + this.totalQuestions,
            lastScore: this.score,
            lastCorrectCount: this.correctCount,
            lastMaxCombo: this.maxCombo,
            quizMasterUnlocked: Boolean(prevQuizStats.quizMasterUnlocked || unlockedQuizMaster)
          };
          localStorage.setItem('pokopia-quiz-stats', JSON.stringify(updatedQuizStats));

          let prevStats = {};
          try {
            prevStats = JSON.parse(localStorage.getItem('pokopia-stats') || '{}') || {};
          } catch (_) {
            prevStats = {};
          }

          const updatedStats = {
            ...prevStats,
            quizGamesPlayed: (prevStats.quizGamesPlayed || 0) + 1,
            quizHighScore: Math.max(prevStats.quizHighScore || 0, this.score),
            quizMaxCombo: Math.max(prevStats.quizMaxCombo || 0, this.maxCombo),
            maxCombo: Math.max(prevStats.maxCombo || 0, this.maxCombo),
            quizBestScore: Math.max(prevStats.quizBestScore || 0, this.correctCount),
            quizBestCorrect: Math.max(prevStats.quizBestCorrect || 0, this.correctCount),
            bestQuizCorrect: Math.max(prevStats.bestQuizCorrect || 0, this.correctCount),
            lastQuizScore: this.score,
            lastQuizCorrect: this.correctCount,
            quizMasterUnlocked: Boolean(prevStats.quizMasterUnlocked || unlockedQuizMaster)
          };
          localStorage.setItem('pokopia-stats', JSON.stringify(updatedStats));
        }
      } catch (_) {
        // Ignore storage errors in restricted environments
      }

      return summary;
    }
  }

  QuizEngine.generateQuestion = generateQuestion;
  QuizEngine.getPokemonName = getPokemonName;
  QuizEngine.getPokemonDescription = getPokemonDescription;
  QuizEngine.getSpriteUrl = getSpriteUrl;
  QuizEngine.getAudioUrl = getAudioUrl;

  return {
    QuizEngine,
    generateQuestion,
    getPokemonName,
    getPokemonDescription,
    getSpriteUrl,
    getAudioUrl,
    VALID_MODES,
    VALID_LANGS
  };
});
