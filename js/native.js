/* Pokopia Pokédex - Capacitor Android & Native Bridge Engine */

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.POKOPIA_NATIVE = api;
  }
  if (root && typeof root === 'object') {
    root.POKOPIA_NATIVE = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  const SUBPAGES = [
    'detail.html',
    'habitat-detail.html',
    'quiz.html',
    'badges.html',
    'settings.html',
    'habitats.html'
  ];

  const EXIT_CONFIRM_WINDOW_MS = 2000;
  let lastBackPressTime = 0;
  let wakeLockSentinel = null;
  let backListenerRegistered = false;

  function getWin(env) {
    if (env && env.window) return env.window;
    if (typeof window !== 'undefined') return window;
    return {};
  }

  function getNav(env) {
    if (env && env.navigator) return env.navigator;
    const win = getWin(env);
    if (win && win.navigator) return win.navigator;
    if (typeof navigator !== 'undefined') return navigator;
    return {};
  }

  function getDoc(env) {
    if (env && env.document) return env.document;
    const win = getWin(env);
    if (win && win.document) return win.document;
    if (typeof document !== 'undefined') return document;
    return null;
  }

  /**
   * Detects whether the app is running inside a Capacitor Android container or Android WebView.
   */
  function isNativeAndroid(env) {
    try {
      const win = getWin(env);
      const nav = getNav(env);
      const cap = (env && env.Capacitor) || win.Capacitor;

      if (cap) {
        if (typeof cap.getPlatform === 'function' && cap.getPlatform() === 'android') {
          return true;
        }
        if (typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
          return true;
        }
        if (cap.isNative === true || cap.platform === 'android') {
          return true;
        }
      }

      const ua = String((nav && nav.userAgent) || '');
      if (/Android/i.test(ua) && (/; wv\)|Capacitor|Version\/\d+\.\d+\s+Chrome/i.test(ua))) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  function triggerVibrate(pattern, capacitorAction, env) {
    try {
      const win = getWin(env);
      const nav = getNav(env);
      const cap = (env && env.Capacitor) || win.Capacitor;
      const haptics = cap && cap.Plugins && cap.Plugins.Haptics;

      if (haptics) {
        const res = capacitorAction(haptics);
        if (res && typeof res.catch === 'function') {
          res.catch(function () {});
        }
        return true;
      }

      if (nav && typeof nav.vibrate === 'function') {
        nav.vibrate(pattern);
        return true;
      }
    } catch (_) {
      // Safe no-op on unsupported desktop/iOS browsers
    }
    return false;
  }

  /**
   * Light haptic tap (15ms) - used for button taps, filter toggles, or card selections.
   */
  function hapticLight(env) {
    return triggerVibrate(
      15,
      function (haptics) {
        if (typeof haptics.impact === 'function') {
          return haptics.impact({ style: 'LIGHT' });
        }
        if (typeof haptics.vibrate === 'function') {
          return haptics.vibrate({ duration: 15 });
        }
      },
      env
    );
  }

  /**
   * Success haptic pattern ([20, 40, 30]) - used when collecting Pokémon, answering quiz rightly, or unlocking badges.
   */
  function hapticSuccess(env) {
    return triggerVibrate(
      [20, 40, 30],
      function (haptics) {
        if (typeof haptics.notification === 'function') {
          return haptics.notification({ type: 'SUCCESS' });
        }
        if (typeof haptics.vibrate === 'function') {
          return haptics.vibrate({ duration: 45 });
        }
      },
      env
    );
  }

  /**
   * Error haptic pattern ([50, 30, 50]) - used on wrong quiz answer or invalid progress code.
   */
  function hapticError(env) {
    return triggerVibrate(
      [50, 30, 50],
      function (haptics) {
        if (typeof haptics.notification === 'function') {
          return haptics.notification({ type: 'ERROR' });
        }
        if (typeof haptics.vibrate === 'function') {
          return haptics.vibrate({ duration: 80 });
        }
      },
      env
    );
  }

  function isElementVisible(el) {
    if (!el) return false;
    if (el.classList && (el.classList.contains('hidden') || el.classList.contains('d-none'))) {
      return false;
    }
    if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) {
      return false;
    }
    if (el.hasAttribute && el.hasAttribute('hidden')) {
      return false;
    }
    if (el.classList && (el.classList.contains('active') || el.classList.contains('open') || el.classList.contains('show') || el.classList.contains('visible'))) {
      return true;
    }
    if (el.style && (el.style.display === 'flex' || el.style.display === 'block' || el.style.display === 'grid')) {
      return true;
    }
    return false;
  }

  function showExitToast(doc, message) {
    if (!doc || typeof doc.createElement !== 'function' || !doc.body) return;
    let toast = doc.getElementById('pokopia-exit-toast');
    if (!toast) {
      toast = doc.createElement('div');
      toast.id = 'pokopia-exit-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = [
        'position:fixed',
        'bottom:84px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(15,23,42,0.92)',
        'color:#fff',
        'padding:10px 20px',
        'border-radius:999px',
        'font-size:14px',
        'font-weight:600',
        'z-index:99999',
        'box-shadow:0 4px 16px rgba(0,0,0,0.35)',
        'pointer-events:none',
        'transition:opacity 0.2s ease'
      ].join(';');
      doc.body.appendChild(toast);
    }
    toast.textContent = message || '再按一次返回鍵離開 Pokopia 圖鑑 / Press back again to exit';
    toast.style.opacity = '1';
  }

  /**
   * Resets internal double-back exit timer (useful for tests).
   */
  function resetBackPressState() {
    lastBackPressTime = 0;
  }

  /**
   * Handles Android Hardware Back Button press with 3-tier priority routing:
   * 1. Close open drawer (`.type-drawer.open`) or modal (`.settings-modal.active` / visible `#feedback-overlay`) -> returns `'closed-overlay'`
   * 2. Navigate from any subpage (`detail.html`, `habitat-detail.html`, `quiz.html`, `badges.html`, `settings.html`, `habitats.html`) to `index.html` -> returns `'navigated-home'`
   * 3. On `index.html`, first press within 2000ms shows exit hint and returns `'confirm-exit'`; second press within 2000ms exits app and returns `'exit-app'`.
   */
  function handleBackNavigation(env) {
    const opts = env || {};
    const win = getWin(opts);
    const doc = getDoc(opts);
    const cap = opts.Capacitor || win.Capacitor;
    const now = typeof opts.now === 'number' ? opts.now : Date.now();

    // Priority 1: Close open drawer or modal overlay
    if (doc && typeof doc.querySelector === 'function') {
      const openDrawer = doc.querySelector('.type-drawer.open');
      if (openDrawer) {
        openDrawer.classList.remove('open');
        const backdrop = doc.querySelector('.type-drawer-backdrop.open, .drawer-backdrop.open, #drawerBackdrop.open');
        if (backdrop && backdrop.classList) {
          backdrop.classList.remove('open');
        }
        return 'closed-overlay';
      }

      const activeModal = doc.querySelector('.settings-modal.active, .modal-overlay.active, .qr-modal.active');
      if (activeModal) {
        activeModal.classList.remove('active');
        return 'closed-overlay';
      }

      const feedbackOverlay = typeof doc.getElementById === 'function'
        ? doc.getElementById('feedback-overlay')
        : doc.querySelector('#feedback-overlay');
      if (feedbackOverlay && isElementVisible(feedbackOverlay)) {
        if (feedbackOverlay.classList) {
          feedbackOverlay.classList.remove('active', 'open', 'visible', 'show');
          feedbackOverlay.classList.add('hidden');
        }
        if (feedbackOverlay.style) {
          feedbackOverlay.style.display = 'none';
        }
        return 'closed-overlay';
      }
    }

    // Priority 2: Subpage -> navigate back to index.html
    const loc = opts.location || (win && win.location) || { pathname: '/index.html', href: 'index.html' };
    const rawPath = String(loc.pathname || loc.href || '');
    const matchedSubpage = SUBPAGES.find(function (page) {
      return rawPath.endsWith('/' + page) || rawPath === page || rawPath.includes(page);
    });

    if (matchedSubpage) {
      if (typeof opts.onNavigate === 'function') {
        opts.onNavigate('index.html');
      } else if (loc && typeof loc.assign === 'function') {
        loc.assign('index.html');
      } else if (loc) {
        loc.href = 'index.html';
      }
      return 'navigated-home';
    }

    // Priority 3: On index.html -> double-press within 2000ms to exit
    if (lastBackPressTime > 0 && now - lastBackPressTime < EXIT_CONFIRM_WINDOW_MS) {
      lastBackPressTime = 0;
      try {
        if (cap && cap.Plugins && cap.Plugins.App && typeof cap.Plugins.App.exitApp === 'function') {
          cap.Plugins.App.exitApp();
        }
      } catch (_) {}
      return 'exit-app';
    }

    lastBackPressTime = now;
    if (typeof opts.onShowToast === 'function') {
      opts.onShowToast('再按一次返回鍵離開 Pokopia 圖鑑');
    } else {
      showExitToast(doc, '再按一次返回鍵離開 Pokopia 圖鑑');
    }
    return 'confirm-exit';
  }

  /**
   * Registers the Capacitor App backButton listener and custom DOM `ionBackButton` / `backbutton` fallback.
   */
  function setupBackButton(env) {
    try {
      const win = getWin(env);
      const doc = getDoc(env);
      const cap = (env && env.Capacitor) || win.Capacitor;

      if (cap && cap.Plugins && cap.Plugins.App && typeof cap.Plugins.App.addListener === 'function') {
        cap.Plugins.App.addListener('backButton', function () {
          handleBackNavigation(env);
        });
        backListenerRegistered = true;
        return true;
      }

      if (doc && typeof doc.addEventListener === 'function' && !backListenerRegistered) {
        doc.addEventListener('backbutton', function (e) {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          handleBackNavigation(env);
        });
        backListenerRegistered = true;
        return true;
      }
    } catch (_) {}
    return false;
  }

  /**
   * Requests a Screen Wake Lock (`navigator.wakeLock.request('screen')`) so tablets don't dim
   * during karaoke playback or quiz sessions. Safely catches errors if unsupported.
   */
  async function requestWakeLock(env) {
    try {
      const nav = getNav(env);
      if (!nav || !nav.wakeLock || typeof nav.wakeLock.request !== 'function') {
        return false;
      }
      if (wakeLockSentinel && !wakeLockSentinel.released) {
        return true;
      }
      wakeLockSentinel = await nav.wakeLock.request('screen');
      if (wakeLockSentinel && typeof wakeLockSentinel.addEventListener === 'function') {
        wakeLockSentinel.addEventListener('release', function () {
          wakeLockSentinel = null;
        });
      }
      return true;
    } catch (_) {
      wakeLockSentinel = null;
      return false;
    }
  }

  /**
   * Releases any active Screen Wake Lock safely without throwing.
   */
  async function releaseWakeLock() {
    try {
      if (wakeLockSentinel && typeof wakeLockSentinel.release === 'function') {
        await wakeLockSentinel.release();
      }
      wakeLockSentinel = null;
      return true;
    } catch (_) {
      wakeLockSentinel = null;
      return false;
    }
  }

  function isWakeLockActive() {
    return Boolean(wakeLockSentinel && !wakeLockSentinel.released);
  }

  return {
    SUBPAGES: SUBPAGES,
    EXIT_CONFIRM_WINDOW_MS: EXIT_CONFIRM_WINDOW_MS,
    isNativeAndroid: isNativeAndroid,
    hapticLight: hapticLight,
    hapticSuccess: hapticSuccess,
    hapticError: hapticError,
    handleBackNavigation: handleBackNavigation,
    resetBackPressState: resetBackPressState,
    setupBackButton: setupBackButton,
    requestWakeLock: requestWakeLock,
    releaseWakeLock: releaseWakeLock,
    isWakeLockActive: isWakeLockActive
  };
});
