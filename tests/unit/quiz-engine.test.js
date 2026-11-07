import { describe, it, expect, beforeEach } from 'vitest';
import quizModule from '../../js/quiz-engine.js';

const {
  QuizEngine,
  generateQuestion,
  getPokemonName,
  getPokemonDescription,
  getSpriteUrl,
  getAudioUrl
} = quizModule;

const SAMPLE_POKEMON = [
  {
    id: 1,
    pokopia_id: 1,
    pokedex_number: 1,
    name: { en: 'Bulbasaur', zh: '妙蛙種子', es: 'Bulbasaur' },
    description: {
      en: 'It carries a seed on its back right from birth.',
      zh: '從出生起背上就帶著一顆種子。',
      es: 'Lleva una semilla en su espalda desde que nace.'
    }
  },
  {
    id: 2,
    pokopia_id: 2,
    pokedex_number: 4,
    name: { en: 'Charmander', zh: '小火龍', es: 'Charmander' },
    description: {
      en: 'The flame on its tail shows the strength of its life-force.',
      zh: '尾巴上的火焰代表牠的生命力。',
      es: 'La llama de su cola indica su fuerza vital.'
    }
  },
  {
    id: 3,
    pokopia_id: 3,
    pokedex_number: 7,
    name: { en: 'Squirtle', zh: '傑尼龜', es: 'Squirtle' },
    description: {
      en: 'After birth, its back swells and hardens into a shell.',
      zh: '出生後背部會膨脹並硬化成堅硬的龜殼。',
      es: 'Tras nacer, su espalda se hincha y endurece formando un caparazón.'
    }
  },
  {
    id: 4,
    pokopia_id: 4,
    pokedex_number: 25,
    name: { en: 'Pikachu', zh: '皮卡丘', es: 'Pikachu' },
    description: {
      en: 'When it is angered, it immediately discharges the energy stored in the pouches in its cheeks.',
      zh: '生氣時會立刻把儲存在臉頰囊袋裡的電力放出來。',
      es: 'Cuando se enfada, descarga la energía que almacena en las bolsas de sus mejillas.'
    }
  },
  {
    id: 5,
    pokopia_id: 5,
    pokedex_number: 133,
    name: { en: 'Eevee', zh: '伊布', es: 'Eevee' },
    description: {
      en: 'Its genetic code is irregular. It may mutate if it is exposed to radiation from element stones.',
      zh: '基因組成很不穩定，容易受環境影響而改變型態。',
      es: 'Su código genético es irregular y puede mutar fácilmente.'
    }
  }
];

describe('Pokopia QuizEngine & Question Generator (TICK-004)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. correctly reads singular name and description fields from pokemon.json format (and supports legacy fallback)', () => {
    expect(getPokemonName(SAMPLE_POKEMON[0], 'zh')).toBe('妙蛙種子');
    expect(getPokemonName(SAMPLE_POKEMON[1], 'en')).toBe('Charmander');
    expect(getPokemonDescription(SAMPLE_POKEMON[2], 'es')).toContain('caparazón');

    const legacyPoke = {
      id: 99,
      names: { zh: '百變怪', en: 'Ditto' },
      descriptions: { zh: '能夠重組全身的細胞。', en: 'It can reconstitute its cellular structure.' }
    };
    expect(getPokemonName(legacyPoke, 'zh')).toBe('百變怪');
    expect(getPokemonDescription(legacyPoke, 'en')).toContain('cellular structure');
  });

  it('2. uses pokedex_number || id for spriteUrl and padded pokopia_id for audioUrl', () => {
    // SAMPLE_POKEMON[3] has id: 4, pokedex_number: 25
    expect(getSpriteUrl(SAMPLE_POKEMON[3])).toBe('assets/sprites/25.png');
    expect(getAudioUrl(SAMPLE_POKEMON[3], 'zh')).toBe('/output/karaoke/004/zh/name.mp3');
  });

  it('3. generates valid Mode A (Image -> Name) questions with 3 unique options', () => {
    const q = generateQuestion(SAMPLE_POKEMON, {
      mode: 'A',
      questionLang: 'zh',
      optionsLang: 'zh'
    });
    expect(q.mode).toBe('A');
    expect(q.spriteUrl).toBe(`assets/sprites/${q.target.pokedex_number || q.target.id}.png`);
    expect(q.correctAnswer).toBe(q.target.name.zh);
    expect(q.options).toHaveLength(3);
    expect(new Set(q.options).size).toBe(3);
    expect(q.options).toContain(q.correctAnswer);
  });

  it('4. generates valid Mode B (Image -> Description) questions with 3 unique descriptions', () => {
    const q = generateQuestion(SAMPLE_POKEMON, {
      mode: 'B',
      questionLang: 'en',
      optionsLang: 'en'
    });
    expect(q.mode).toBe('B');
    expect(q.correctAnswer).toBe(q.target.description.en);
    expect(q.options).toHaveLength(3);
    expect(new Set(q.options).size).toBe(3);
    expect(q.options).toContain(q.correctAnswer);
  });

  it('5. generates valid Mode C (Name -> Image) questions with 3 distinct Pokemon sprite IDs', () => {
    const q = generateQuestion(SAMPLE_POKEMON, {
      mode: 'C',
      questionLang: 'es',
      optionsLang: 'es'
    });
    expect(q.mode).toBe('C');
    expect(q.promptText).toContain(q.target.name.es);
    expect(q.correctAnswer).toBe(q.target.pokedex_number || q.target.id);
    expect(q.options).toHaveLength(3);
    expect(new Set(q.options).size).toBe(3);
    expect(q.options).toContain(q.correctAnswer);
    expect(q.optionItems.every((item) => item.spriteUrl.startsWith('assets/sprites/'))).toBe(true);
  });

  it('6. generates valid Mode D (Description -> Name) questions', () => {
    const q = generateQuestion(SAMPLE_POKEMON, {
      mode: 'D',
      questionLang: 'zh',
      optionsLang: 'en'
    });
    expect(q.mode).toBe('D');
    expect(q.promptText).toContain(q.target.description.zh);
    expect(q.correctAnswer).toBe(q.target.name.en);
    expect(q.options).toHaveLength(3);
    expect(new Set(q.options).size).toBe(3);
    expect(q.options).toContain(q.correctAnswer);
  });

  it('7. generates valid Mode E (Audio -> Name) questions with karaoke audioUrl', () => {
    const q = generateQuestion(SAMPLE_POKEMON, {
      mode: 'E',
      questionLang: 'es',
      optionsLang: 'zh'
    });
    expect(q.mode).toBe('E');
    const paddedId = String(q.target.pokopia_id || q.target.id).padStart(3, '0');
    expect(q.audioUrl).toBe(`/output/karaoke/${paddedId}/es/name.mp3`);
    expect(q.correctAnswer).toBe(q.target.name.zh);
    expect(q.options).toHaveLength(3);
    expect(new Set(q.options).size).toBe(3);
    expect(q.options).toContain(q.correctAnswer);
  });

  it('8. Mode ALL randomly selects across modes A, B, C, D, E without duplicate options', () => {
    const seenModes = new Set();
    for (let i = 0; i < 60; i++) {
      const q = generateQuestion(SAMPLE_POKEMON, {
        mode: 'ALL',
        questionLang: 'random',
        optionsLang: 'random'
      });
      seenModes.add(q.mode);
      expect(['A', 'B', 'C', 'D', 'E']).toContain(q.mode);
      expect(['zh', 'en', 'es']).toContain(q.questionLang);
      expect(['zh', 'en', 'es']).toContain(q.optionsLang);
      expect(new Set(q.options).size).toBe(3);
      expect(q.options).toContain(q.correctAnswer);
    }
    expect(seenModes.size).toBeGreaterThanOrEqual(4);
  });

  it('9. progresses through all 10 questions (1/10 to 10/10) without skipping Question 1 (index 0)', () => {
    const engine = new QuizEngine(SAMPLE_POKEMON, { totalQuestions: 10, mode: 'A' });
    const q1 = engine.startNewGame();

    expect(q1).not.toBeNull();
    expect(engine.currentQuestionIndex).toBe(0);
    expect(engine.getQuestionNumber()).toBe(1);
    expect(engine.isFinished).toBe(false);

    const visitedQuestionNumbers = [engine.getQuestionNumber()];

    for (let step = 1; step < 10; step++) {
      engine.submitAnswer(engine.currentQuestion.correctAnswer);
      const nextQ = engine.nextQuestion();
      expect(nextQ).not.toBeNull();
      expect(engine.currentQuestionIndex).toBe(step);
      expect(engine.getQuestionNumber()).toBe(step + 1);
      visitedQuestionNumbers.push(engine.getQuestionNumber());
    }

    // Answer the 10th question (index 9)
    engine.submitAnswer(engine.currentQuestion.correctAnswer);
    const afterLast = engine.nextQuestion();

    expect(afterLast).toBeNull();
    expect(engine.isFinished).toBe(true);
    expect(visitedQuestionNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('10. calculates Combo bonus math accurately (+100, +125, +150, ...) and resets combo to 0 on wrong answer', () => {
    const engine = new QuizEngine(SAMPLE_POKEMON, { totalQuestions: 5, mode: 'A' });
    engine.startNewGame();

    // Q1: Correct -> combo 1, +100 pts (total 100)
    const r1 = engine.submitAnswer(engine.currentQuestion.correctAnswer);
    expect(r1.isCorrect).toBe(true);
    expect(r1.combo).toBe(1);
    expect(r1.pointsEarned).toBe(100);
    expect(r1.score).toBe(100);

    // Q2: Correct -> combo 2, +125 pts (total 225)
    engine.nextQuestion();
    const r2 = engine.submitAnswer(engine.currentQuestion.correctAnswer);
    expect(r2.isCorrect).toBe(true);
    expect(r2.combo).toBe(2);
    expect(r2.pointsEarned).toBe(125);
    expect(r2.score).toBe(225);

    // Q3: Correct -> combo 3, +150 pts (total 375)
    engine.nextQuestion();
    const r3 = engine.submitAnswer(engine.currentQuestion.correctAnswer);
    expect(r3.isCorrect).toBe(true);
    expect(r3.combo).toBe(3);
    expect(r3.pointsEarned).toBe(150);
    expect(r3.score).toBe(375);

    // Q4: Wrong -> combo resets to 0, +0 pts (total 375), maxCombo remains 3
    engine.nextQuestion();
    const r4 = engine.submitAnswer('__WRONG_ANSWER__');
    expect(r4.isCorrect).toBe(false);
    expect(r4.combo).toBe(0);
    expect(r4.maxCombo).toBe(3);
    expect(r4.pointsEarned).toBe(0);
    expect(r4.score).toBe(375);

    // Q5: Correct -> combo 1 again, +100 pts (total 475), maxCombo still 3
    engine.nextQuestion();
    const r5 = engine.submitAnswer(engine.currentQuestion.correctAnswer);
    expect(r5.isCorrect).toBe(true);
    expect(r5.combo).toBe(1);
    expect(r5.maxCombo).toBe(3);
    expect(r5.pointsEarned).toBe(100);
    expect(r5.score).toBe(475);
  });

  it('11. persists quiz completion stats to localStorage (pokopia-quiz-stats and pokopia-stats)', () => {
    const engine = new QuizEngine(SAMPLE_POKEMON, { totalQuestions: 5, mode: 'A' });
    engine.startNewGame();

    for (let i = 0; i < 5; i++) {
      engine.submitAnswer(engine.currentQuestion.correctAnswer);
      engine.nextQuestion();
    }

    expect(engine.isFinished).toBe(true);

    const quizStats = JSON.parse(localStorage.getItem('pokopia-quiz-stats'));
    const globalStats = JSON.parse(localStorage.getItem('pokopia-stats'));

    expect(quizStats).toBeTruthy();
    expect(quizStats.gamesPlayed).toBe(1);
    expect(quizStats.maxCombo).toBe(5);
    expect(quizStats.bestCorrectCount).toBe(5);
    expect(quizStats.highScore).toBe(100 + 125 + 150 + 175 + 200);
    expect(quizStats.quizMasterUnlocked).toBe(true);

    expect(globalStats).toBeTruthy();
    expect(globalStats.quizMaxCombo).toBe(5);
    expect(globalStats.maxCombo).toBe(5);
    expect(globalStats.quizBestCorrect).toBe(5);
    expect(globalStats.quizMasterUnlocked).toBe(true);
  });

  it('12. prevents duplicate submissions on the same question before nextQuestion() is called', () => {
    const engine = new QuizEngine(SAMPLE_POKEMON, { totalQuestions: 10, mode: 'A' });
    engine.startNewGame();

    const firstAttempt = engine.submitAnswer(engine.currentQuestion.correctAnswer);
    expect(firstAttempt.pointsEarned).toBe(100);
    expect(engine.score).toBe(100);

    // Calling submitAnswer again on the same question should not add points or increment combo
    const duplicateAttempt = engine.submitAnswer(engine.currentQuestion.correctAnswer);
    expect(duplicateAttempt.pointsEarned).toBe(0);
    expect(engine.score).toBe(100);
    expect(engine.combo).toBe(1);
  });
});
