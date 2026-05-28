/**
 * Pokopia Quiz Mode Logic
 * 實作四種玩法 (A/B/C/D) 與三語隨機學習
 */

class PokopiaQuiz {
    constructor() {
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.totalQuestions = 10;
        this.pokemonData = [];
        this.currentQuestion = null;
        this.gameActive = false;

        // 語言定義
        this.langs = {
            zh: '中文',
            en: 'English',
            es: 'Español'
        };
        this.langCodes = ['zh', 'en', 'es'];

        this.init();
    }

    async init() {
        try {
            // 讀取寶可夢資料
            const response = await fetch('data/pokemon.json');
            this.pokemonData = await response.json();
            
            this.setupEventListeners();
            this.startNewGame();
        } catch (err) {
            console.error("Failed to load pokemon data:", err);
            document.getElementById('question-text').innerText = "資料載入失敗，請刷新頁面 🦐💦";
        }
    }

    setupEventListeners() {
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextQuestion();
        });
    }

    startNewGame() {
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.gameActive = true;
        this.updateScoreDisplay();
        this.nextQuestion();
    }

    updateScoreDisplay() {
        document.getElementById('current-score').innerText = this.score;
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.totalQuestions) {
            this.endGame();
            return;
        }

        document.getElementById('feedback-overlay').style.display = 'none';
        document.getElementById('progress-text').innerText = `第 ${this.currentQuestionIndex + 1} / ${this.totalQuestions} 題`;
        
        this.generateQuestion();
    }

    generateQuestion() {
        // 隨機選擇一個玩法 A, B, C, D
        const modes = ['A', 'B', 'C', 'D'];
        const mode = modes[Math.floor(Math.random() * modes.length)];
        
        // 隨機選擇一隻寶可夢
        const targetPoke = this.pokemonData[Math.floor(Math.random() * this.pokemonData.length)];
        
        // 隨機選擇題目語言 (中/英/西)
        const questionLang = this.langCodes[Math.floor(Math.random() * this.langCodes.length)];
        // 隨機選擇選項語言
        const optionsLang = this.langCodes[Math.floor(Math.random() * this.langCodes.length)];

        this.currentQuestion = {
            mode,
            target: targetPoke,
            questionLang,
            optionsLang,
            correctAnswer: ""
        };

        const qTextEl = document.getElementById('question-text');
        const qVisualEl = document.getElementById('question-visual');
        const optionsGrid = document.getElementById('options-grid');
        
        qVisualEl.innerHTML = '';
        optionsGrid.innerHTML = '';

        if (mode === 'A') {
            // A — 看圖猜名
            qTextEl.innerText = `這是誰？ (${this.langs[optionsLang]})`;
            qVisualEl.innerHTML = `<img src="assets/sprites/${targetPoke.id}.png" class="question-image pop">`;
            this.currentQuestion.correctAnswer = targetPoke.names[optionsLang];
            this.generateOptions('name', optionsLang);
        } 
        else if (mode === 'B') {
            // B — 看圖猜敘述
            qTextEl.innerText = `這是什麼描述？ (${this.langs[optionsLang]})`;
            qVisualEl.innerHTML = `<img src="assets/sprites/${targetPoke.id}.png" class="question-image pop">`;
            this.currentQuestion.correctAnswer = targetPoke.descriptions[optionsLang];
            this.generateOptions('desc', optionsLang);
        } 
        else if (mode === 'C') {
            // C — 看名猜圖
            qTextEl.innerText = `誰是 ${targetPoke.names[questionLang]}？ (${this.langs[questionLang]})`;
            this.currentQuestion.correctAnswer = targetPoke.id;
            this.generateOptions('image', null);
        } 
        else if (mode === 'D') {
            // D — 看敘述猜名
            qTextEl.innerText = `誰是「${targetPoke.descriptions[questionLang]}」？ (${this.langs[questionLang]})`;
            this.currentQuestion.correctAnswer = targetPoke.names[optionsLang];
            this.generateOptions('name', optionsLang);
        }

        this.renderOptions();
    }

    generateOptions(type, lang) {
        let options = [];
        const correctVal = this.currentQuestion.correctAnswer;

        if (type === 'name') {
            options.push(this.currentQuestion.target.names[lang]);
            while (options.length < 3) {
                const randomPoke = this.pokemonData[Math.floor(Math.random() * this.pokemonData.length)];
                const val = randomPoke.names[lang];
                if (!options.includes(val)) options.push(val);
            }
        } 
        else if (type === 'desc') {
            options.push(this.currentQuestion.target.descriptions[lang]);
            while (options.length < 3) {
                const randomPoke = this.pokemonData[Math.floor(Math.random() * this.pokemonData.length)];
                const val = randomPoke.descriptions[lang];
                if (!options.includes(val)) options.push(val);
            }
        } 
        else if (type === 'image') {
            options.push(this.currentQuestion.target.id);
            while (options.length < 3) {
                const randomPoke = this.pokemonData[Math.floor(Math.random() * this.pokemonData.length)];
                const val = randomPoke.id;
                if (!options.includes(val)) options.push(val);
            }
        }

        // 隨機打亂選項
        options.sort(() => Math.random() - 0.5);
        this.currentOptions = options;
    }

    renderOptions() {
        const optionsGrid = document.getElementById('options-grid');
        
        this.currentOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            
            if (this.currentQuestion.mode === 'C') {
                // C 模式是選圖片
                btn.innerHTML = `<img src="assets/sprites/${opt}.png" style="width:60px; height:60px; object-fit:contain;">`;
            } else {
                btn.innerText = opt;
            }
            
            btn.onclick = () => this.checkAnswer(opt);
            optionsGrid.appendChild(btn);
        });
    }

    checkAnswer(selected) {
        if (!this.gameActive) return;
        this.gameActive = false;

        const isCorrect = selected === this.currentQuestion.correctAnswer;
        const buttons = document.querySelectorAll('.option-btn');
        
        buttons.forEach(btn => {
            if (btn.innerText === this.currentQuestion.correctAnswer || (this.currentQuestion.mode === 'C' && btn.innerHTML.includes(this.currentQuestion.correctAnswer))) {
                btn.classList.add('correct');
            }
        });

        if (isCorrect) {
            this.score++;
            this.updateScoreDisplay();
            this.showFeedback(true);
        } else {
            this.showFeedback(false);
        }
    }

    showFeedback(isCorrect) {
        const overlay = document.getElementById('feedback-overlay');
        const emoji = document.getElementById('feedback-emoji');
        const text = document.getElementById('feedback-text');
        const correctAnsDisp = document.getElementById('correct-answer-display');
        
        overlay.style.display = 'flex';
        
        if (isCorrect) {
            emoji.innerText = '🌟';
            text.innerText = '太棒了！答對了！';
            correctAnsDisp.innerText = '';
        } else {
            emoji.innerText = '😅';
            text.innerText = '沒關係，再接再厲！';
            correctAnsDisp.innerText = `正確答案是：${this.currentQuestion.correctAnswer}`;
        }
    }

    endGame() {
        const overlay = document.getElementById('feedback-overlay');
        const emoji = document.getElementById('document-feedback-emoji'); // 這裡原本寫錯了，修正為 feedback-emoji
        const text = document.getElementById('feedback-text');
        
        // 修正 ID 選取
        const feedbackEmoji = document.getElementById('feedback-emoji');
        const feedbackText = document.getElementById('feedback-text');
        
        overlay.style.display = 'flex';
        feedbackEmoji.innerText = '🏆';
        feedbackText.innerHTML = `挑戰結束！<br>你的得分是：${this.score} / ${this.totalQuestions}`;
        
        document.getElementById('correct-answer-display').innerText = '恭喜你完成本次挑戰！🦐';
        document.getElementById('next-btn').innerText = '再玩一次 ➔';
        document.getElementById('next-btn').onclick = () => location.reload();
    }
}

// 啟動遊戲
const quiz = new PokopiaQuiz();
