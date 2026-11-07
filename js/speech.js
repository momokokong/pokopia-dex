/**
 * PokopiaDex Speech & Karaoke Engine (TICK-003)
 * Handles playback speed rate persistence, HTML5 Audio + Karaoke word highlighting,
 * automatic offline fallback to Web Speech API (speechSynthesis), and sequential
 * trilingual playback (zh -> en -> es).
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.POKOPIA_SPEECH = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function (root) {
  'use strict';

  const RATE_STORAGE_KEY = 'pokopia-speech-rate';
  const SUPPORTED_RATES = [0.8, 1.0];
  const DEFAULT_RATE = 1.0;

  const BCP47_MAP = {
    zh: 'zh-TW',
    en: 'en-US',
    es: 'es-ES'
  };

  let _activeAudio = null;
  let _activeTimer = null;
  let _activeRaf = null;
  let _sequenceToken = 0;
  let _sequenceTimeout = null;
  let _activeResolve = null;

  /**
   * Normalize playback rate to 0.8 or 1.0
   * @param {number|string} rate
   * @returns {number}
   */
  function normalizeRate(rate) {
    const num = Number(rate);
    if (Math.abs(num - 0.8) < 0.001) return 0.8;
    if (Math.abs(num - 1.0) < 0.001) return 1.0;
    return DEFAULT_RATE;
  }

  /**
   * Get current speech playback rate (0.8 or 1.0)
   * @returns {number}
   */
  function getRate() {
    try {
      if (root && root.localStorage) {
        const saved = root.localStorage.getItem(RATE_STORAGE_KEY);
        if (saved !== null) {
          return normalizeRate(saved);
        }
      }
    } catch (_) {
      // Ignore storage access errors
    }
    return DEFAULT_RATE;
  }

  /**
   * Set speech playback rate (0.8 or 1.0) and persist to localStorage
   * @param {number|string} rate
   * @returns {number} The applied normalized rate
   */
  function setRate(rate) {
    const validRate = normalizeRate(rate);
    try {
      if (root && root.localStorage) {
        root.localStorage.setItem(RATE_STORAGE_KEY, String(validRate));
      }
    } catch (_) {
      // Ignore storage errors
    }
    if (_activeAudio) {
      try {
        _activeAudio.playbackRate = validRate;
      } catch (_) {}
    }
    return validRate;
  }

  /**
   * Toggle between 1.0x and 0.8x playback rate
   * @returns {number} The new playback rate
   */
  function toggleRate() {
    const next = getRate() === 1.0 ? 0.8 : 1.0;
    return setRate(next);
  }

  /**
   * Map short language code ('zh' | 'en' | 'es') to BCP-47 language tag
   * @param {string} lang
   * @returns {string}
   */
  function getBcp47Lang(lang) {
    if (!lang || typeof lang !== 'string') return BCP47_MAP.en;
    const key = lang.toLowerCase().trim();
    if (BCP47_MAP[key]) return BCP47_MAP[key];
    if (key.startsWith('zh')) return 'zh-TW';
    if (key.startsWith('en')) return 'en-US';
    if (key.startsWith('es')) return 'es-ES';
    return BCP47_MAP.en;
  }

  /**
   * Clear any running karaoke highlight timers / RAF
   */
  function _clearHighlightLoop() {
    if (_activeTimer !== null) {
      clearInterval(_activeTimer);
      _activeTimer = null;
    }
    if (_activeRaf !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(_activeRaf);
      _activeRaf = null;
    }
  }

  /**
   * Stop any active Audio playback, karaoke timers, Web Speech synthesis,
   * and sequential trilingual playback.
   */
  function stop() {
    _sequenceToken += 1;

    if (_sequenceTimeout !== null) {
      clearTimeout(_sequenceTimeout);
      _sequenceTimeout = null;
    }

    _clearHighlightLoop();

    if (_activeAudio) {
      const audioToStop = _activeAudio;
      _activeAudio = null;
      try {
        audioToStop.pause();
        audioToStop.currentTime = 0;
      } catch (_) {}
    }

    if (root && root.speechSynthesis && typeof root.speechSynthesis.cancel === 'function') {
      try {
        root.speechSynthesis.cancel();
      } catch (_) {}
    }

    if (_activeResolve) {
      const resolve = _activeResolve;
      _activeResolve = null;
      resolve({ stopped: true });
    }
  }

  /**
   * Play text using browser Web Speech API (window.speechSynthesis)
   * @param {string} text
   * @param {string} [lang='en']
   * @param {number} [rate]
   * @param {object} [callbacks]
   * @returns {Promise<{fallback: boolean, lang: string, rate: number}>}
   */
  function playWebSpeech(text, lang = 'en', rate, callbacks = {}) {
    const { onStart, onEnd, onError, onBoundary } = callbacks || {};
    const effectiveRate = rate !== undefined && rate !== null ? normalizeRate(rate) : getRate();
    const bcp47 = getBcp47Lang(lang);

    if (
      !text ||
      !root ||
      !root.speechSynthesis ||
      typeof root.SpeechSynthesisUtterance !== 'function'
    ) {
      if (typeof onEnd === 'function') onEnd();
      return Promise.resolve({ fallback: true, skipped: true, lang: bcp47, rate: effectiveRate });
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        if (_activeResolve === finish) {
          _activeResolve = null;
        }
        resolve(result);
      };

      _activeResolve = finish;

      try {
        if (typeof root.speechSynthesis.cancel === 'function') {
          root.speechSynthesis.cancel();
        }
      } catch (_) {}

      const utterance = new root.SpeechSynthesisUtterance(String(text));
      utterance.lang = bcp47;
      utterance.rate = effectiveRate;
      utterance.pitch = 1.1;

      if (typeof onStart === 'function') {
        utterance.onstart = () => onStart(utterance);
      }
      if (typeof onBoundary === 'function') {
        utterance.onboundary = (ev) => onBoundary(ev);
      }

      utterance.onend = () => {
        if (typeof onEnd === 'function') onEnd();
        finish({ fallback: true, lang: bcp47, rate: effectiveRate });
      };

      utterance.onerror = (err) => {
        if (typeof onError === 'function') onError(err);
        if (typeof onEnd === 'function') onEnd();
        finish({ fallback: true, error: err, lang: bcp47, rate: effectiveRate });
      };

      try {
        root.speechSynthesis.speak(utterance);
      } catch (err) {
        if (typeof onError === 'function') onError(err);
        if (typeof onEnd === 'function') onEnd();
        finish({ fallback: true, error: err, lang: bcp47, rate: effectiveRate });
      }
    });
  }

  /**
   * Render word spans inside a DOM container for karaoke highlighting
   * @param {string} text
   * @param {Array<{text: string, startMs: number, durationMs: number}>} words
   * @param {HTMLElement} containerEl
   * @returns {NodeListOf<Element>|Array}
   */
  function renderKaraokeWords(text, words, containerEl) {
    if (!containerEl) return [];
    if (!Array.isArray(words) || words.length === 0) {
      containerEl.textContent = text || '';
      return [];
    }

    const sourceText = text || words.map((w) => w.text).join(' ');
    let html = '';
    let textIdx = 0;

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const wText = String(w.text || '');
      const startMs = Number(w.startMs) || 0;
      const endMs = startMs + (Number(w.durationMs) || 0);
      const foundIdx = sourceText.indexOf(wText, textIdx);

      if (foundIdx !== -1) {
        if (foundIdx > textIdx) {
          const skipped = sourceText.slice(textIdx, foundIdx);
          html += `<span class="karaoke-word karaoke-word--static">${skipped}</span>`;
        }
        html += `<span class="karaoke-word" data-word-idx="${i}" data-start="${startMs}" data-end="${endMs}">${wText}</span>`;
        textIdx = foundIdx + wText.length;
      } else {
        html += `<span class="karaoke-word" data-word-idx="${i}" data-start="${startMs}" data-end="${endMs}">${wText}</span>`;
      }
    }

    if (textIdx < sourceText.length) {
      html += `<span class="karaoke-word karaoke-word--static">${sourceText.slice(textIdx)}</span>`;
    }

    containerEl.innerHTML = html;
    return containerEl.querySelectorAll('.karaoke-word[data-start]');
  }

  /**
   * Play pre-generated MP3 audio with optional JSON word-timing karaoke highlight,
   * automatically falling back to Web Speech API if MP3 loading or playback fails.
   *
   * @param {object} options
   * @param {string} [options.audioUrl]
   * @param {string} [options.timingUrl]
   * @param {HTMLElement} [options.containerEl]
   * @param {string} [options.fallbackText]
   * @param {string} [options.lang='en']
   * @param {number} [options.rate]
   * @param {Function} [options.onWordHighlight]
   * @param {Function} [options.onEnd]
   * @param {Function} [options.onError]
   * @returns {Promise<object>}
   */
  async function playKaraoke(options = {}) {
    const {
      audioUrl,
      timingUrl,
      containerEl,
      fallbackText = '',
      lang = 'en',
      rate,
      onWordHighlight,
      onEnd,
      onError
    } = options;

    // Stop any previous active audio or speech without invalidating an active sequence caller
    _clearHighlightLoop();
    if (_activeAudio) {
      try {
        _activeAudio.pause();
        _activeAudio.currentTime = 0;
      } catch (_) {}
      _activeAudio = null;
    }
    if (root && root.speechSynthesis && typeof root.speechSynthesis.cancel === 'function') {
      try {
        root.speechSynthesis.cancel();
      } catch (_) {}
    }

    const effectiveRate = rate !== undefined && rate !== null ? normalizeRate(rate) : getRate();

    // Fetch optional timing JSON if provided
    let words = null;
    if (timingUrl && typeof root.fetch === 'function') {
      try {
        const resp = await root.fetch(timingUrl);
        if (resp && resp.ok) {
          words = await resp.json();
        }
      } catch (_) {
        words = null;
      }
    }

    if (!audioUrl || typeof root.Audio !== 'function') {
      return playWebSpeech(fallbackText, lang, effectiveRate, { onEnd, onError });
    }

    let spans = [];
    if (containerEl && words) {
      spans = renderKaraokeWords(fallbackText, words, containerEl);
    }

    return new Promise((resolve) => {
      let settled = false;
      let fallbackTriggered = false;

      const cleanupAndResolve = (result) => {
        if (settled) return;
        settled = true;
        _clearHighlightLoop();
        if (_activeResolve === cleanupAndResolve) {
          _activeResolve = null;
        }
        resolve(result);
      };

      _activeResolve = cleanupAndResolve;

      const triggerFallback = (err) => {
        if (fallbackTriggered || settled) return;
        fallbackTriggered = true;
        _clearHighlightLoop();
        if (_activeAudio === audio) {
          _activeAudio = null;
        }
        if (typeof onError === 'function') {
          onError(err);
        }
        playWebSpeech(fallbackText, lang, effectiveRate, { onEnd }).then((res) => {
          cleanupAndResolve(res);
        });
      };

      let audio;
      try {
        audio = new root.Audio(audioUrl);
      } catch (err) {
        triggerFallback(err);
        return;
      }

      _activeAudio = audio;
      audio.playbackRate = effectiveRate;

      const updateHighlight = () => {
        if (!_activeAudio || _activeAudio !== audio || !Array.isArray(words)) return;
        const nowMs = (Number(audio.currentTime) || 0) * 1000;
        for (let i = 0; i < words.length; i++) {
          const w = words[i];
          const start = Number(w.startMs) || 0;
          const end = start + (Number(w.durationMs) || 0);
          const isActive = nowMs >= start && nowMs < end;
          const isDone = nowMs >= end;
          if (spans && spans[i] && spans[i].classList) {
            spans[i].classList.toggle('karaoke-active', isActive);
            spans[i].classList.toggle('karaoke-done', isDone);
          }
          if (isActive && typeof onWordHighlight === 'function') {
            onWordHighlight(w, i, words);
          }
        }
      };

      if (Array.isArray(words) && words.length > 0) {
        _activeTimer = setInterval(updateHighlight, 50);
        if (typeof audio.addEventListener === 'function') {
          audio.addEventListener('timeupdate', updateHighlight);
        }
      }

      const handleEnded = () => {
        if (fallbackTriggered || settled) return;
        _clearHighlightLoop();
        if (_activeAudio === audio) {
          _activeAudio = null;
        }
        if (containerEl && fallbackText) {
          containerEl.textContent = fallbackText;
        }
        if (typeof onEnd === 'function') {
          onEnd();
        }
        cleanupAndResolve({ fallback: false, lang: getBcp47Lang(lang), rate: effectiveRate });
      };

      const handleError = (err) => {
        triggerFallback(err || new Error('Audio playback error'));
      };

      if (typeof audio.addEventListener === 'function') {
        audio.addEventListener('ended', handleEnded, { once: true });
        audio.addEventListener('error', handleError, { once: true });
      } else {
        audio.onended = handleEnded;
        audio.onerror = handleError;
      }

      try {
        const playResult = audio.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch((err) => {
            triggerFallback(err);
          });
        }
      } catch (err) {
        triggerFallback(err);
      }
    });
  }

  /**
   * Build default trilingual items when given id/type/langs
   */
  function _buildDefaultItems({ id, type = 'pokemon', langs = ['zh', 'en', 'es'], texts = {} }) {
    const paddedId = String(id || 1).padStart(3, '0');
    const baseFolder = type === 'habitat' ? 'output/habitat_karaoke' : 'output/karaoke';
    return langs.map((lang) => ({
      lang,
      audioUrl: `${baseFolder}/${paddedId}/${lang}/audio_${lang}.mp3`,
      timingUrl: `${baseFolder}/${paddedId}/${lang}/karaoke_${lang}.json`,
      fallbackText: texts[lang] || texts.en || `${type} ${id}`
    }));
  }

  /**
   * Sequentially play multiple language items (e.g., zh -> en -> es) one after another.
   * Can be aborted at any point via stop().
   *
   * @param {object} options
   * @param {Array<{lang: string, audioUrl?: string, timingUrl?: string, fallbackText?: string}>} [options.items]
   * @param {number|string} [options.id]
   * @param {string} [options.type='pokemon']
   * @param {Array<string>} [options.langs=['zh', 'en', 'es']]
   * @param {object} [options.texts]
   * @param {number} [options.intervalMs=350]
   * @param {number} [options.rate]
   * @param {Function} [options.onLangStart]
   * @param {Function} [options.onLangEnd]
   * @param {Function} [options.onComplete]
   * @returns {Promise<{completed: boolean, playedLangs: Array<string>}>}
   */
  async function playSequentialTrilingual(options = {}) {
    const {
      items: providedItems,
      id,
      type = 'pokemon',
      langs = ['zh', 'en', 'es'],
      texts = {},
      intervalMs = 350,
      rate,
      onLangStart,
      onLangEnd,
      onComplete
    } = options;

    stop();
    const myToken = _sequenceToken;

    const sequenceItems =
      Array.isArray(providedItems) && providedItems.length > 0
        ? providedItems
        : _buildDefaultItems({ id, type, langs, texts });

    const playedLangs = [];

    for (let i = 0; i < sequenceItems.length; i++) {
      if (myToken !== _sequenceToken) {
        return { completed: false, playedLangs };
      }

      const item = sequenceItems[i];
      if (typeof onLangStart === 'function') {
        onLangStart(item.lang, i, item);
      }

      await playKaraoke({
        audioUrl: item.audioUrl,
        timingUrl: item.timingUrl,
        containerEl: item.containerEl,
        fallbackText: item.fallbackText || item.text || '',
        lang: item.lang,
        rate,
        onWordHighlight: item.onWordHighlight
      });

      if (myToken !== _sequenceToken) {
        return { completed: false, playedLangs };
      }

      playedLangs.push(item.lang);

      if (typeof onLangEnd === 'function') {
        onLangEnd(item.lang, i, item);
      }

      if (i < sequenceItems.length - 1 && intervalMs > 0) {
        const survivedWait = await new Promise((resolve) => {
          _sequenceTimeout = setTimeout(() => {
            _sequenceTimeout = null;
            resolve(myToken === _sequenceToken);
          }, intervalMs);
        });
        if (!survivedWait || myToken !== _sequenceToken) {
          return { completed: false, playedLangs };
        }
      }
    }

    if (myToken === _sequenceToken) {
      if (typeof onComplete === 'function') {
        onComplete(playedLangs);
      }
      return { completed: true, playedLangs };
    }

    return { completed: false, playedLangs };
  }

  return {
    RATE_STORAGE_KEY,
    SUPPORTED_RATES,
    BCP47_MAP,
    getRate,
    setRate,
    toggleRate,
    getBcp47Lang,
    playWebSpeech,
    renderKaraokeWords,
    playKaraoke,
    playSequentialTrilingual,
    stop
  };
});
