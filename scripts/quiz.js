/**
 * Pokopia Quiz UI Controller (scripts/quiz.js)
 * Connects quiz.html DOM to js/quiz-engine.js (POKOPIA_QUIZ_ENGINE) and app.js (POKOPIA_DEX).
 */

const QUIZ_I18N = {
  zh: {
    quiz_title: '🎮 猜謎挑戰',
    mode_all: '🎲 全部隨機',
    mode_a: '🖼️ 看圖猜名',
    mode_b: '📖 看圖猜敘述',
    mode_c: '🔍 看名猜圖',
    mode_d: '💬 看敘述猜名',
    mode_e: '🔊 聽音辨怪',
    label_q_lang: '題目語言：',
    label_opt_lang: '選項語言：',
    lang_random: '🎲 隨機',
    score_label: '分數',
    btn_speak: '發音',
    btn_speak_answer: '聽發音',
    btn_listen_mystery: '🔊 點擊播放神祕寶可夢發音',
    progress_fmt: (cur, total) => `第 ${cur} / ${total} 題`,
    correct_title: '太棒了！答對了！',
    wrong_title: '沒關係，再接再厲！',
    correct_ans_label: '正確答案：',
    points_earned: (pts, combo) => `+${pts} 分 (🔥 Combo x${combo})`,
    next_btn: '下一題 ➔',
    play_again_btn: '再玩一次 ➔',
    game_over_title: '挑戰完成！',
    summary_stats: (score, correct, total, accuracy, maxCombo) =>
      `總分：<strong>${score}</strong> 分<br>答對：<strong>${correct} / ${total}</strong> (${accuracy}%)<br>最高連擊：<strong>🔥 Combo x${maxCombo}</strong>`,
    badge_unlocked_msg: '🎓 恭喜達成「猜謎大師 (Quiz Master)」徽章條件！',
    load_error: '資料載入失敗，請刷新頁面 🦐💦',
    tab_dex: '圖鑑',
    tab_habitats: '棲息地',
    tab_quiz: '猜謎挑戰',
    tab_badges: '徽章',
    tab_settings: '設定'
  },
  en: {
    quiz_title: '🎮 Quiz Challenge',
    mode_all: '🎲 All Modes',
    mode_a: '🖼️ Pic ➔ Name',
    mode_b: '📖 Pic ➔ Desc',
    mode_c: '🔍 Name ➔ Pic',
    mode_d: '💬 Desc ➔ Name',
    mode_e: '🔊 Audio ➔ Name',
    label_q_lang: 'Prompt:',
    label_opt_lang: 'Options:',
    lang_random: '🎲 Random',
    score_label: 'Score',
    btn_speak: 'Speak',
    btn_speak_answer: 'Pronounce',
    btn_listen_mystery: '🔊 Play Mystery Pokémon Voice',
    progress_fmt: (cur, total) => `Question ${cur} / ${total}`,
    correct_title: 'Awesome! Correct!',
    wrong_title: 'Nice try! Keep going!',
    correct_ans_label: 'Correct Answer: ',
    points_earned: (pts, combo) => `+${pts} pts (🔥 Combo x${combo})`,
    next_btn: 'Next ➔',
    play_again_btn: 'Play Again ➔',
    game_over_title: 'Challenge Complete!',
    summary_stats: (score, correct, total, accuracy, maxCombo) =>
      `Total Score: <strong>${score}</strong><br>Correct: <strong>${correct} / ${total}</strong> (${accuracy}%)<br>Max Combo: <strong>🔥 Combo x${maxCombo}</strong>`,
    badge_unlocked_msg: '🎓 Quiz Master Badge Unlocked!',
    load_error: 'Failed to load Pokémon data. Please refresh.',
    tab_dex: 'Pokédex',
    tab_habitats: 'Habitats',
    tab_quiz: 'Quiz',
    tab_badges: 'Badges',
    tab_settings: 'Settings'
  },
  es: {
    quiz_title: '🎮 Desafío Quiz',
    mode_all: '🎲 Todos',
    mode_a: '🖼️ Foto ➔ Nombre',
    mode_b: '📖 Foto ➔ Desc',
    mode_c: '🔍 Nombre ➔ Foto',
    mode_d: '💬 Desc ➔ Nombre',
    mode_e: '🔊 Audio ➔ Nombre',
    label_q_lang: 'Pregunta:',
    label_opt_lang: 'Opciones:',
    lang_random: '🎲 Aleatorio',
    score_label: 'Puntos',
    btn_speak: 'Audio',
    btn_speak_answer: 'Escuchar',
    btn_listen_mystery: '🔊 Escuchar voz misteriosa',
    progress_fmt: (cur, total) => `Pregunta ${cur} / ${total}`,
    correct_title: '¡Excelente! ¡Correcto!',
    wrong_title: '¡Buen intento! ¡Sigue así!',
    correct_ans_label: 'Respuesta correcta: ',
    points_earned: (pts, combo) => `+${pts} pts (🔥 Combo x${combo})`,
    next_btn: 'Siguiente ➔',
    play_again_btn: 'Jugar de nuevo ➔',
    game_over_title: '¡Desafío completado!',
    summary_stats: (score, correct, total, accuracy, maxCombo) =>
      `Puntaje: <strong>${score}</strong><br>Aciertos: <strong>${correct} / ${total}</strong> (${accuracy}%)<br>Combo Máx: <strong>🔥 Combo x${maxCombo}</strong>`,
    badge_unlocked_msg: '🎓 ¡Insignia Maestro del Quiz desbloqueada!',
    load_error: 'Error al cargar datos. Por favor recarga.',
    tab_dex: 'Pokédex',
    tab_habitats: 'Hábitats',
    tab_quiz: 'Quiz',
    tab_badges: 'Insignias',
    tab_settings: 'Ajustes'
  }
};

class PokopiaQuiz {
  constructor() {
    const EngineClass =
      (window.POKOPIA_QUIZ_ENGINE && window.POKOPIA_QUIZ_ENGINE.QuizEngine) ||
      window.QuizEngine;

    this.uiLang =
      (window.POKOPIA_DEX && window.POKOPIA_DEX.getLang()) ||
      localStorage.getItem('pokopia-lang') ||
      'zh';

    this.engine = new EngineClass([], {
      totalQuestions: 10,
      mode: 'ALL',
      questionLang: 'random',
      optionsLang: 'random',
      uiLang: this.uiLang
    });

    this.pokemonData = [];
    this.activeAudio = null;

    this.init();
  }

  get score() {
    return this.engine.score;
  }

  get combo() {
    return this.engine.combo;
  }

  get maxCombo() {
    return this.engine.maxCombo;
  }

  get currentQuestionIndex() {
    return this.engine.currentQuestionIndex;
  }

  get totalQuestions() {
    return this.engine.totalQuestions;
  }

  get currentQuestion() {
    return this.engine.currentQuestion;
  }

  t(key) {
    const dict = QUIZ_I18N[this.uiLang] || QUIZ_I18N.zh;
    return dict[key] !== undefined ? dict[key] : QUIZ_I18N.zh[key];
  }

  async init() {
    try {
      if (window.POKOPIA_DEX) {
        window.POKOPIA_DEX.renderLangButtons();
        window.POKOPIA_DEX.renderTabBar('quiz');
      }
      this.applyTranslations();

      if (window.POKOPIA_DEX && typeof window.POKOPIA_DEX.loadData === 'function') {
        this.pokemonData = await window.POKOPIA_DEX.loadData();
      } else {
        const response = await fetch('data/pokemon.json');
        this.pokemonData = await response.json();
      }

      this.engine.setPokemonData(this.pokemonData);
      this.setupEventListeners();
      this.startNewGame();
    } catch (err) {
      console.error('Failed to load pokemon data:', err);
      const qText = document.getElementById('question-text');
      if (qText) qText.textContent = this.t('load_error');
    }
  }

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const val = this.t(key);
      if (typeof val === 'string') {
        el.textContent = val;
      }
    });
    this.updateStatusDisplay();
  }

  setupEventListeners() {
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.engine.isFinished) {
          this.startNewGame();
        } else {
          this.nextQuestion();
        }
      });
    }

    // Mode filter buttons
    document.querySelectorAll('.mode-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode || 'ALL';
        this.engine.setConfig({ mode });
        this.startNewGame();
      });
    });

    // Language filter selects
    const qLangSelect = document.getElementById('questionLangSelect');
    if (qLangSelect) {
      qLangSelect.addEventListener('change', (e) => {
        this.engine.setConfig({ questionLang: e.target.value });
        this.startNewGame();
      });
    }

    const optLangSelect = document.getElementById('optionsLangSelect');
    if (optLangSelect) {
      optLangSelect.addEventListener('change', (e) => {
        this.engine.setConfig({ optionsLang: e.target.value });
        this.startNewGame();
      });
    }

    // Audio buttons
    const qAudioBtn = document.getElementById('question-audio-btn');
    if (qAudioBtn) {
      qAudioBtn.addEventListener('click', () => this.playCurrentQuestionAudio());
    }

    const fbAudioBtn = document.getElementById('feedback-audio-btn');
    if (fbAudioBtn) {
      fbAudioBtn.addEventListener('click', () => this.playTargetAnswerAudio());
    }

    // Global UI language switch listener
    document.addEventListener('langchange', (e) => {
      this.uiLang = (e.detail && e.detail.lang) || 'zh';
      this.engine.setConfig({ uiLang: this.uiLang });
      this.applyTranslations();
      if (this.currentQuestion && !this.engine.isFinished) {
        this.renderCurrentQuestion();
      }
    });
  }

  startNewGame() {
    const overlay = document.getElementById('feedback-overlay');
    if (overlay) overlay.style.display = 'none';

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.textContent = this.t('next_btn');

    this.engine.startNewGame({ uiLang: this.uiLang });
    this.updateStatusDisplay();
    this.renderCurrentQuestion();
  }

  nextQuestion() {
    const overlay = document.getElementById('feedback-overlay');
    if (overlay) overlay.style.display = 'none';

    const nextQ = this.engine.nextQuestion();
    if (!nextQ || this.engine.isFinished) {
      this.endGame();
      return;
    }

    this.updateStatusDisplay();
    this.renderCurrentQuestion();
  }

  updateStatusDisplay() {
    const scoreEl = document.getElementById('current-score');
    if (scoreEl) scoreEl.textContent = String(this.engine.score);

    const comboCountEl = document.getElementById('combo-count');
    if (comboCountEl) comboCountEl.textContent = String(this.engine.combo);

    const comboBadgeEl = document.getElementById('combo-badge');
    if (comboBadgeEl) {
      comboBadgeEl.classList.toggle('combo-hot', this.engine.combo >= 2);
    }

    const progressEl = document.getElementById('progress-text');
    if (progressEl) {
      const fmt = this.t('progress_fmt');
      progressEl.textContent = fmt(this.engine.getQuestionNumber(), this.engine.totalQuestions);
    }
  }

  renderCurrentQuestion() {
    const q = this.engine.currentQuestion;
    if (!q) return;

    const qTextEl = document.getElementById('question-text');
    const qVisualEl = document.getElementById('question-visual');
    const optionsGrid = document.getElementById('options-grid');

    if (qTextEl) qTextEl.textContent = q.promptText;
    if (qVisualEl) qVisualEl.innerHTML = '';
    if (optionsGrid) {
      optionsGrid.innerHTML = '';
      optionsGrid.classList.toggle('options-grid--images', q.mode === 'C');
    }

    if (q.mode === 'A' || q.mode === 'B') {
      const img = document.createElement('img');
      img.src = q.spriteUrl;
      img.alt = 'Pokémon';
      img.className = 'question-image pop';
      qVisualEl.appendChild(img);
    } else if (q.mode === 'E') {
      const heroBtn = document.createElement('button');
      heroBtn.type = 'button';
      heroBtn.className = 'audio-play-btn audio-hero-btn pop';
      heroBtn.textContent = this.t('btn_listen_mystery');
      heroBtn.addEventListener('click', () => this.playCurrentQuestionAudio());
      qVisualEl.appendChild(heroBtn);
      // Auto-play audio in Mode E
      this.playCurrentQuestionAudio();
    }

    // Render options
    q.optionItems.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.dataset.value = String(item.value);

      if (q.mode === 'C') {
        const img = document.createElement('img');
        img.src = item.spriteUrl;
        img.alt = item.label || 'Pokémon option';
        btn.appendChild(img);
      } else {
        btn.textContent = String(item.value);
      }

      btn.addEventListener('click', () => this.checkAnswer(item.value, btn));
      optionsGrid.appendChild(btn);
    });
  }

  checkAnswer(selectedValue, clickedBtn) {
    if (!this.engine.gameActive || this.engine.answeredCurrent) return;

    const result = this.engine.submitAnswer(selectedValue);
    this.updateStatusDisplay();

    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.value === String(result.correctAnswer)) {
        btn.classList.add('correct');
      }
    });

    if (!result.isCorrect && clickedBtn) {
      clickedBtn.classList.add('wrong');
    }

    this.showFeedback(result);
  }

  showFeedback(result) {
    const overlay = document.getElementById('feedback-overlay');
    const emoji = document.getElementById('feedback-emoji');
    const text = document.getElementById('feedback-text');
    const correctAnsDisp = document.getElementById('correct-answer-display');
    const fbAudioBtn = document.getElementById('feedback-audio-btn');
    const nextBtn = document.getElementById('next-btn');

    if (fbAudioBtn) fbAudioBtn.style.display = 'inline-flex';
    if (nextBtn) nextBtn.textContent = this.t('next_btn');

    const q = this.engine.currentQuestion;
    const targetName = window.POKOPIA_QUIZ_ENGINE.getPokemonName(q.target, q.optionsLang);

    if (result.isCorrect) {
      emoji.textContent = '🌟';
      text.textContent = this.t('correct_title');
      const ptsMsg = this.t('points_earned')(result.pointsEarned, result.combo);
      correctAnsDisp.innerHTML = `<strong>${targetName}</strong><br><span style="color:#ff7043;font-weight:700">${ptsMsg}</span>`;
    } else {
      emoji.textContent = '😅';
      text.textContent = this.t('wrong_title');
      const answerLabel = q.mode === 'C' ? targetName : result.correctAnswer;
      correctAnsDisp.textContent = `${this.t('correct_ans_label')}${answerLabel}`;
    }

    overlay.style.display = 'flex';
  }

  endGame() {
    const summary = this.engine.endGame();
    const overlay = document.getElementById('feedback-overlay');
    const feedbackEmoji = document.getElementById('feedback-emoji');
    const feedbackText = document.getElementById('feedback-text');
    const correctAnsDisp = document.getElementById('correct-answer-display');
    const fbAudioBtn = document.getElementById('feedback-audio-btn');
    const nextBtn = document.getElementById('next-btn');

    if (fbAudioBtn) fbAudioBtn.style.display = 'none';

    feedbackEmoji.textContent = '🏆';
    feedbackText.textContent = this.t('game_over_title');

    let detailHtml = this.t('summary_stats')(
      summary.score,
      summary.correctCount,
      summary.totalQuestions,
      summary.accuracy,
      summary.maxCombo
    );

    if (summary.quizMasterUnlocked) {
      detailHtml += `<div style="margin-top:10px;padding:8px 12px;background:#fff8e1;border-radius:12px;color:#e65100;font-weight:700">${this.t('badge_unlocked_msg')}</div>`;
    }

    correctAnsDisp.innerHTML = detailHtml;
    nextBtn.textContent = this.t('play_again_btn');
    overlay.style.display = 'flex';
  }

  playCurrentQuestionAudio() {
    const q = this.engine.currentQuestion;
    if (!q) return;

    const lang = q.mode === 'C' || q.mode === 'D' || q.mode === 'E' ? q.questionLang : q.optionsLang;
    const text =
      q.mode === 'D'
        ? window.POKOPIA_QUIZ_ENGINE.getPokemonDescription(q.target, lang)
        : window.POKOPIA_QUIZ_ENGINE.getPokemonName(q.target, lang);

    this.playAudioWithFallback(q.audioUrl, text, lang);
  }

  playTargetAnswerAudio() {
    const q = this.engine.currentQuestion;
    if (!q) return;
    const lang = q.optionsLang;
    const text = window.POKOPIA_QUIZ_ENGINE.getPokemonName(q.target, lang);
    const audioUrl = window.POKOPIA_QUIZ_ENGINE.getAudioUrl(q.target, lang);
    this.playAudioWithFallback(audioUrl, text, lang);
  }

  playAudioWithFallback(audioUrl, fallbackText, lang) {
    if (window.POKOPIA_SPEECH && typeof window.POKOPIA_SPEECH.playKaraoke === 'function') {
      window.POKOPIA_SPEECH.playKaraoke({
        audioUrl,
        fallbackText,
        lang
      });
      return;
    }

    try {
      if (this.activeAudio) {
        this.activeAudio.pause();
        this.activeAudio = null;
      }
      if (typeof Audio !== 'undefined' && audioUrl) {
        const audio = new Audio(audioUrl);
        this.activeAudio = audio;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            this.speakViaWebSpeech(fallbackText, lang);
          });
          return;
        }
        return;
      }
    } catch (_) {
      // Fallback to Web Speech API
    }
    this.speakViaWebSpeech(fallbackText, lang);
  }

  speakViaWebSpeech(text, lang) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = { zh: 'zh-TW', en: 'en-US', es: 'es-ES' };
      utterance.lang = langMap[lang] || 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      // Ignore speech synthesis errors in headless environments
    }
  }
}

if (typeof window !== 'undefined') {
  window.PokopiaQuiz = PokopiaQuiz;
  window.quiz = new PokopiaQuiz();
}
