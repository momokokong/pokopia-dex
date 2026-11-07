import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

const nativeApi = require('../../js/native.js');
const { buildWebDist } = require('../../scripts/build-web-dist.js');
const capConfig = require('../../capacitor.config.json');

describe('TICK-009: Pokopia Native Bridge (js/native.js) & Capacitor Build', () => {
  beforeEach(() => {
    nativeApi.resetBackPressState();
    document.body.innerHTML = '';
  });

  it('1. validates capacitor.config.json schema and Android configuration', () => {
    expect(capConfig.appId).toBe('com.pokopia.dex');
    expect(capConfig.appName).toBe('PokopiaDex');
    expect(capConfig.webDir).toBe('dist');
    expect(capConfig.bundledWebRuntime).toBe(false);
    expect(capConfig.server?.androidScheme).toBe('https');
    expect(capConfig.plugins?.SplashScreen).toBeDefined();
    expect(capConfig.plugins?.StatusBar).toBeDefined();
  });

  it('2. detects native Android platform via Capacitor.isNativePlatform() or Android WebView userAgent', () => {
    expect(
      nativeApi.isNativeAndroid({
        Capacitor: { isNativePlatform: () => true }
      })
    ).toBe(true);

    expect(
      nativeApi.isNativeAndroid({
        navigator: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36'
        }
      })
    ).toBe(true);

    expect(
      nativeApi.isNativeAndroid({
        Capacitor: { isNativePlatform: () => false },
        navigator: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15'
        }
      })
    ).toBe(false);
  });

  it('3. triggers navigator.vibrate patterns for hapticLight (15ms), hapticSuccess ([20,40,30]), and hapticError ([50,30,50])', () => {
    const vibrateMock = vi.fn();
    const env = { navigator: { vibrate: vibrateMock } };

    expect(nativeApi.hapticLight(env)).toBe(true);
    expect(vibrateMock).toHaveBeenLastCalledWith(15);

    expect(nativeApi.hapticSuccess(env)).toBe(true);
    expect(vibrateMock).toHaveBeenLastCalledWith([20, 40, 30]);

    expect(nativeApi.hapticError(env)).toBe(true);
    expect(vibrateMock).toHaveBeenLastCalledWith([50, 30, 50]);
  });

  it('4. prefers Capacitor.Plugins.Haptics when available and safely no-ops when vibration is unsupported', () => {
    const impactMock = vi.fn().mockResolvedValue(undefined);
    const notificationMock = vi.fn().mockResolvedValue(undefined);
    const capEnv = {
      Capacitor: {
        Plugins: {
          Haptics: {
            impact: impactMock,
            notification: notificationMock
          }
        }
      }
    };

    expect(nativeApi.hapticLight(capEnv)).toBe(true);
    expect(impactMock).toHaveBeenCalledWith({ style: 'LIGHT' });

    expect(nativeApi.hapticSuccess(capEnv)).toBe(true);
    expect(notificationMock).toHaveBeenCalledWith({ type: 'SUCCESS' });

    expect(nativeApi.hapticError(capEnv)).toBe(true);
    expect(notificationMock).toHaveBeenCalledWith({ type: 'ERROR' });

    // Unsupported environment: should not throw and should return false
    expect(() => nativeApi.hapticLight({ navigator: {} })).not.toThrow();
    expect(nativeApi.hapticLight({ navigator: {} })).toBe(false);
  });

  it('5. Priority 1 Back Navigation: closes open .type-drawer.open before navigating away', () => {
    document.body.innerHTML = `
      <div class="type-drawer-backdrop open"></div>
      <div class="type-drawer open"></div>
    `;

    const action = nativeApi.handleBackNavigation({
      document,
      location: { pathname: '/index.html' }
    });

    expect(action).toBe('closed-overlay');
    expect(document.querySelector('.type-drawer').classList.contains('open')).toBe(false);
    expect(document.querySelector('.type-drawer-backdrop').classList.contains('open')).toBe(false);
  });

  it('6. Priority 1 Back Navigation: closes .settings-modal.active and visible #feedback-overlay', () => {
    document.body.innerHTML = `
      <div class="settings-modal active"></div>
      <div id="feedback-overlay" class="visible" style="display: flex;"></div>
    `;

    // First back closes .settings-modal.active
    const first = nativeApi.handleBackNavigation({
      document,
      location: { pathname: '/quiz.html' }
    });
    expect(first).toBe('closed-overlay');
    expect(document.querySelector('.settings-modal').classList.contains('active')).toBe(false);

    // Second back closes #feedback-overlay
    const second = nativeApi.handleBackNavigation({
      document,
      location: { pathname: '/quiz.html' }
    });
    expect(second).toBe('closed-overlay');
    expect(document.getElementById('feedback-overlay').style.display).toBe('none');
  });

  it('7. Priority 2 Back Navigation: navigates back to index.html from all 6 subpages', () => {
    const subpages = [
      'detail.html',
      'habitat-detail.html',
      'quiz.html',
      'badges.html',
      'settings.html',
      'habitats.html'
    ];

    for (const page of subpages) {
      const loc = { pathname: `/${page}`, href: `http://localhost/${page}` };
      const result = nativeApi.handleBackNavigation({
        document,
        location: loc
      });
      expect(result).toBe('navigated-home');
      expect(loc.href).toBe('index.html');
    }
  });

  it('8. Priority 3 Back Navigation: double-tap within 2000ms on index.html exits app', () => {
    const exitAppMock = vi.fn();
    const toastMock = vi.fn();
    const cap = {
      Plugins: {
        App: { exitApp: exitAppMock }
      }
    };

    // 1st press at t=1000ms -> confirm-exit
    const first = nativeApi.handleBackNavigation({
      document,
      location: { pathname: '/index.html' },
      Capacitor: cap,
      now: 1000,
      onShowToast: toastMock
    });
    expect(first).toBe('confirm-exit');
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(exitAppMock).not.toHaveBeenCalled();

    // 2nd press after 2500ms (t=3500ms, expired window) -> confirm-exit again
    const expiredSecond = nativeApi.handleBackNavigation({
      document,
      location: { pathname: '/index.html' },
      Capacitor: cap,
      now: 3500,
      onShowToast: toastMock
    });
    expect(expiredSecond).toBe('confirm-exit');
    expect(exitAppMock).not.toHaveBeenCalled();

    // 3rd press within 2000ms (t=4200ms) -> exit-app
    const confirmedExit = nativeApi.handleBackNavigation({
      document,
      location: { pathname: '/index.html' },
      Capacitor: cap,
      now: 4200,
      onShowToast: toastMock
    });
    expect(confirmedExit).toBe('exit-app');
    expect(exitAppMock).toHaveBeenCalledTimes(1);
  });

  it('9. setupBackButton registers Capacitor App backButton listener', () => {
    let registeredCallback = null;
    const addListenerMock = vi.fn((event, cb) => {
      if (event === 'backButton') registeredCallback = cb;
    });

    const loc = { pathname: '/quiz.html', href: 'quiz.html' };
    const ok = nativeApi.setupBackButton({
      document,
      location: loc,
      Capacitor: {
        Plugins: {
          App: { addListener: addListenerMock }
        }
      }
    });

    expect(ok).toBe(true);
    expect(addListenerMock).toHaveBeenCalledWith('backButton', expect.any(Function));
    registeredCallback();
    expect(loc.href).toBe('index.html');
  });

  it('10. requests and releases Screen Wake Lock safely with fallback when unsupported', async () => {
    let released = false;
    const releaseMock = vi.fn(async () => {
      released = true;
    });
    const requestMock = vi.fn(async () => ({
      get released() {
        return released;
      },
      release: releaseMock,
      addEventListener: vi.fn()
    }));

    const acquired = await nativeApi.requestWakeLock({
      navigator: { wakeLock: { request: requestMock } }
    });
    expect(acquired).toBe(true);
    expect(requestMock).toHaveBeenCalledWith('screen');
    expect(nativeApi.isWakeLockActive()).toBe(true);

    const relResult = await nativeApi.releaseWakeLock();
    expect(relResult).toBe(true);
    expect(releaseMock).toHaveBeenCalledTimes(1);
    expect(nativeApi.isWakeLockActive()).toBe(false);

    // Unsupported or rejected WakeLock should resolve to false without throwing
    const unsupported = await nativeApi.requestWakeLock({ navigator: {} });
    expect(unsupported).toBe(false);
  });

  it('11. build-web-dist.js packages required web assets cleanly into target dist directory', () => {
    const tmpDist = fs.mkdtempSync(path.join(os.tmpdir(), 'pokopia-dist-test-'));
    try {
      const result = buildWebDist({
        rootDir: path.resolve(__dirname, '../..'),
        distDir: tmpDist,
        silent: true
      });

      expect(result.totalFiles).toBeGreaterThan(20);
      expect(fs.existsSync(path.join(tmpDist, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'detail.html'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'quiz.html'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'styles.css'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'app.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'manifest.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'sw.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'js/native.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'scripts/quiz.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'scripts/qrcode.min.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'data/pokemon.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'data/habitat-data.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDist, 'data/habitat-data.json'))).toBe(true);
    } finally {
      fs.rmSync(tmpDist, { recursive: true, force: true });
    }
  });
});
