import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import speechEngine from '../../js/speech.js';

describe('POKOPIA_SPEECH Engine (TICK-003)', () => {
  let audioInstances = [];
  let spokenUtterances = [];
  let shouldAudioPlayReject = false;
  let shouldAudioEmitError = false;
  let autoEndAudioMs = 15;

  class MockAudio {
    constructor(src) {
      this.src = src;
      this.playbackRate = 1.0;
      this.currentTime = 0;
      this.paused = true;
      this._listeners = {};
      audioInstances.push(this);
    }

    addEventListener(event, cb) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(cb);
    }

    emit(event, payload) {
      const list = this._listeners[event] || [];
      list.forEach((cb) => cb(payload));
      if (event === 'ended' && typeof this.onended === 'function') this.onended(payload);
      if (event === 'error' && typeof this.onerror === 'function') this.onerror(payload);
    }

    play() {
      this.paused = false;
      if (shouldAudioPlayReject) {
        return Promise.reject(new Error('NotAllowedError or 404'));
      }
      if (shouldAudioEmitError) {
        setTimeout(() => {
          if (!this.paused) {
            this.emit('error', new Error('NetworkError loading MP3'));
          }
        }, 5);
        return Promise.resolve();
      }
      if (autoEndAudioMs >= 0) {
        setTimeout(() => {
          if (!this.paused) {
            this.emit('ended');
          }
        }, autoEndAudioMs);
      }
      return Promise.resolve();
    }

    pause() {
      this.paused = true;
    }
  }

  class MockSpeechSynthesisUtterance {
    constructor(text) {
      this.text = text;
      this.lang = '';
      this.rate = 1.0;
      this.pitch = 1.0;
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
      this.onboundary = null;
    }
  }

  beforeEach(() => {
    localStorage.clear();
    audioInstances = [];
    spokenUtterances = [];
    shouldAudioPlayReject = false;
    shouldAudioEmitError = false;
    autoEndAudioMs = 15;

    globalThis.Audio = MockAudio;
    globalThis.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    globalThis.speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn((utterance) => {
        spokenUtterances.push(utterance);
        setTimeout(() => {
          if (typeof utterance.onstart === 'function') utterance.onstart();
          if (typeof utterance.onend === 'function') utterance.onend();
        }, 10);
      })
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false
    });
  });

  afterEach(() => {
    speechEngine.stop();
    vi.restoreAllMocks();
  });

  it('1. attaches POKOPIA_SPEECH to globalThis/window and exports expected methods', () => {
    expect(window.POKOPIA_SPEECH).toBeDefined();
    expect(typeof speechEngine.getRate).toBe('function');
    expect(typeof speechEngine.setRate).toBe('function');
    expect(typeof speechEngine.getBcp47Lang).toBe('function');
    expect(typeof speechEngine.playWebSpeech).toBe('function');
    expect(typeof speechEngine.playKaraoke).toBe('function');
    expect(typeof speechEngine.playSequentialTrilingual).toBe('function');
    expect(typeof speechEngine.stop).toBe('function');
  });

  it('2. defaults playback rate to 1.0 and persists 0.8 and 1.0 in localStorage', () => {
    expect(speechEngine.getRate()).toBe(1.0);

    const r1 = speechEngine.setRate(0.8);
    expect(r1).toBe(0.8);
    expect(localStorage.getItem('pokopia-speech-rate')).toBe('0.8');
    expect(speechEngine.getRate()).toBe(0.8);

    const r2 = speechEngine.setRate(1.0);
    expect(r2).toBe(1.0);
    expect(localStorage.getItem('pokopia-speech-rate')).toBe('1');
    expect(speechEngine.getRate()).toBe(1.0);
  });

  it('3. normalizes invalid rate values back to 1.0 and supports toggleRate()', () => {
    expect(speechEngine.setRate(2.5)).toBe(1.0);
    expect(speechEngine.setRate('invalid')).toBe(1.0);
    expect(speechEngine.getRate()).toBe(1.0);

    expect(speechEngine.toggleRate()).toBe(0.8);
    expect(speechEngine.getRate()).toBe(0.8);
    expect(speechEngine.toggleRate()).toBe(1.0);
    expect(speechEngine.getRate()).toBe(1.0);
  });

  it('4. maps language codes zh, en, es to BCP-47 tags zh-TW, en-US, es-ES', () => {
    expect(speechEngine.getBcp47Lang('zh')).toBe('zh-TW');
    expect(speechEngine.getBcp47Lang('en')).toBe('en-US');
    expect(speechEngine.getBcp47Lang('es')).toBe('es-ES');
    expect(speechEngine.getBcp47Lang('unknown')).toBe('en-US');
    expect(speechEngine.getBcp47Lang(null)).toBe('en-US');
  });

  it('5. plays MP3 via Audio with configured rate (0.8 vs 1.0) and triggers onEnd', async () => {
    speechEngine.setRate(0.8);
    const onEnd = vi.fn();

    const res = await speechEngine.playKaraoke({
      audioUrl: 'output/karaoke/001/zh/audio_zh.mp3',
      fallbackText: '妙蛙種子',
      lang: 'zh',
      onEnd
    });

    expect(audioInstances.length).toBe(1);
    expect(audioInstances[0].src).toBe('output/karaoke/001/zh/audio_zh.mp3');
    expect(audioInstances[0].playbackRate).toBe(0.8);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(res.fallback).toBe(false);
    expect(res.rate).toBe(0.8);
  });

  it('6. fetches timingUrl JSON and highlights words in containerEl during playback', async () => {
    const words = [
      { text: 'Bulbasaur', startMs: 0, durationMs: 200 },
      { text: 'likes', startMs: 200, durationMs: 200 },
      { text: 'sunlight.', startMs: 400, durationMs: 300 }
    ];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => words
    });

    const container = document.createElement('div');
    const highlighted = [];
    autoEndAudioMs = -1; // manual control

    const promise = speechEngine.playKaraoke({
      audioUrl: 'output/karaoke/001/en/audio_en.mp3',
      timingUrl: 'output/karaoke/001/en/karaoke_en.json',
      containerEl: container,
      fallbackText: 'Bulbasaur likes sunlight.',
      lang: 'en',
      rate: 1.0,
      onWordHighlight: (word, idx) => highlighted.push({ word: word.text, idx })
    });

    // Wait for async fetch to resolve and Audio to be created
    await new Promise((r) => setTimeout(r, 10));
    expect(audioInstances.length).toBe(1);

    const spans = container.querySelectorAll('.karaoke-word[data-start]');
    expect(spans.length).toBe(3);

    // Simulate audio progressing to 250ms (second word active, first word done)
    audioInstances[0].currentTime = 0.25;
    audioInstances[0].emit('timeupdate');

    expect(spans[0].classList.contains('karaoke-done')).toBe(true);
    expect(spans[1].classList.contains('karaoke-active')).toBe(true);
    expect(highlighted.some((h) => h.word === 'likes' && h.idx === 1)).toBe(true);

    // Finish audio
    audioInstances[0].emit('ended');
    await promise;
    expect(container.textContent).toBe('Bulbasaur likes sunlight.');
  });

  it('7. automatically falls back to speechSynthesis when audio.play() rejects', async () => {
    shouldAudioPlayReject = true;
    speechEngine.setRate(0.8);
    const onEnd = vi.fn();

    const result = await speechEngine.playKaraoke({
      audioUrl: 'output/karaoke/999/es/audio_es.mp3',
      fallbackText: 'Bulbasaur en español',
      lang: 'es',
      onEnd
    });

    expect(result.fallback).toBe(true);
    expect(spokenUtterances.length).toBe(1);
    expect(spokenUtterances[0].text).toBe('Bulbasaur en español');
    expect(spokenUtterances[0].lang).toBe('es-ES');
    expect(spokenUtterances[0].rate).toBe(0.8);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('8. automatically falls back to speechSynthesis when Audio emits an error event (404 / offline)', async () => {
    shouldAudioEmitError = true;
    const onEnd = vi.fn();
    const onError = vi.fn();

    const result = await speechEngine.playKaraoke({
      audioUrl: 'output/karaoke/404/zh/audio_zh.mp3',
      fallbackText: '皮卡丘',
      lang: 'zh',
      rate: 1.0,
      onEnd,
      onError
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.fallback).toBe(true);
    expect(spokenUtterances.length).toBe(1);
    expect(spokenUtterances[0].text).toBe('皮卡丘');
    expect(spokenUtterances[0].lang).toBe('zh-TW');
    expect(spokenUtterances[0].rate).toBe(1.0);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('9. resolves gracefully when speechSynthesis is unavailable in environment', async () => {
    delete globalThis.speechSynthesis;
    const onEnd = vi.fn();

    const res = await speechEngine.playWebSpeech('Hello world', 'en', 1.0, { onEnd });
    expect(res.skipped).toBe(true);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('10. plays sequential trilingual items in strict order zh -> en -> es and invokes callbacks', async () => {
    const startOrder = [];
    const endOrder = [];
    const onComplete = vi.fn();

    const items = [
      { lang: 'zh', audioUrl: 'zh.mp3', fallbackText: '妙蛙種子' },
      { lang: 'en', audioUrl: 'en.mp3', fallbackText: 'Bulbasaur' },
      { lang: 'es', audioUrl: 'es.mp3', fallbackText: 'Bulbasaur ES' }
    ];

    const res = await speechEngine.playSequentialTrilingual({
      items,
      intervalMs: 10,
      onLangStart: (lang) => startOrder.push(lang),
      onLangEnd: (lang) => endOrder.push(lang),
      onComplete
    });

    expect(res.completed).toBe(true);
    expect(res.playedLangs).toEqual(['zh', 'en', 'es']);
    expect(startOrder).toEqual(['zh', 'en', 'es']);
    expect(endOrder).toEqual(['zh', 'en', 'es']);
    expect(audioInstances.map((a) => a.src)).toEqual(['zh.mp3', 'en.mp3', 'es.mp3']);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('11. cancels sequential trilingual playback mid-sequence when stop() is called', async () => {
    autoEndAudioMs = 20;
    const startOrder = [];
    const onComplete = vi.fn();

    const items = [
      { lang: 'zh', audioUrl: 'zh.mp3', fallbackText: '妙蛙種子' },
      { lang: 'en', audioUrl: 'en.mp3', fallbackText: 'Bulbasaur' },
      { lang: 'es', audioUrl: 'es.mp3', fallbackText: 'Bulbasaur ES' }
    ];

    const seqPromise = speechEngine.playSequentialTrilingual({
      items,
      intervalMs: 40,
      onLangStart: (lang) => {
        startOrder.push(lang);
        if (lang === 'en') {
          // Stop mid-sequence while 'en' is playing
          setTimeout(() => speechEngine.stop(), 5);
        }
      },
      onComplete
    });

    const res = await seqPromise;
    expect(res.completed).toBe(false);
    expect(startOrder).toEqual(['zh', 'en']);
    expect(startOrder).not.toContain('es');
    expect(onComplete).not.toHaveBeenCalled();
    expect(globalThis.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('12. updates active Audio playbackRate dynamically when setRate() is called during playback', async () => {
    autoEndAudioMs = -1;
    speechEngine.setRate(1.0);

    const playPromise = speechEngine.playKaraoke({
      audioUrl: 'output/karaoke/001/en/audio_en.mp3',
      fallbackText: 'Bulbasaur',
      lang: 'en'
    });

    await new Promise((r) => setTimeout(r, 5));
    expect(audioInstances[0].playbackRate).toBe(1.0);

    speechEngine.setRate(0.8);
    expect(audioInstances[0].playbackRate).toBe(0.8);

    audioInstances[0].emit('ended');
    await playPromise;
  });
});
