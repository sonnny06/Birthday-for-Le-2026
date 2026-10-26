/**
 * Seamless Navigation & Persistent Audio Controller
 * Giữ nhạc nền phát liên tục không bị ngắt quãng khi chuyển trang
 */
(() => {
  'use strict';

  // 1. Singleton Global Audio Instance
  if (!window.__bgMusic) {
    window.__bgMusic = new Audio('assets/JK.mp3');
    window.__bgMusic.loop = true;
    window.__bgMusic.volume = 0.85;
  }

  const bgMusic = window.__bgMusic;

  // 2. Synchronize all music toggle buttons across pages
  function syncMusicButtons() {
    const isPlaying = !bgMusic.paused;
    const buttons = document.querySelectorAll('#sound-toggle, .garden-sound-button, .music-toggle-btn');
    buttons.forEach(btn => {
      btn.setAttribute('aria-pressed', String(isPlaying));
      btn.textContent = isPlaying ? '♫ Tắt nhạc nền' : '♫ Bật nhạc nền';
      if (isPlaying) {
        btn.classList.add('playing');
        btn.setAttribute('title', 'Đang phát nhạc · Chạm để tắt nhạc');
      } else {
        btn.classList.remove('playing');
        btn.setAttribute('title', 'Đang tắt nhạc · Chạm để bật nhạc');
      }
    });

    sessionStorage.setItem('birthday_bgm_state', isPlaying ? 'playing' : 'paused');
    sessionStorage.setItem('birthday_bgm_time', String(bgMusic.currentTime));
  }

  let isTogglingAudio = false;
  function toggleMusic(e) {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    if (isTogglingAudio) return;
    isTogglingAudio = true;
    setTimeout(() => { isTogglingAudio = false; }, 220);

    if (bgMusic.paused) {
      sessionStorage.setItem('birthday_bgm_user_muted', 'false');
      const playPromise = bgMusic.play();
      if (playPromise) {
        playPromise.then(() => {
          syncMusicButtons();
        }).catch(err => {
          console.log('Audio playback waiting for gesture:', err);
          syncMusicButtons();
        });
      } else {
        syncMusicButtons();
      }
    } else {
      sessionStorage.setItem('birthday_bgm_user_muted', 'true');
      bgMusic.pause();
      syncMusicButtons();
    }
  }

  function ensureMusicPlayingOnGesture() {
    const userMuted = sessionStorage.getItem('birthday_bgm_user_muted') === 'true';
    if (!userMuted && bgMusic.paused) {
      const p = bgMusic.play();
      if (p) {
        p.then(() => syncMusicButtons()).catch(() => {});
      }
    }
  }

  window.toggleGlobalMusic = toggleMusic;
  window.syncGlobalMusicButtons = syncMusicButtons;
  window.ensureMusicPlayingOnGesture = ensureMusicPlayingOnGesture;

  // Listen to native audio events so state is always 100% synchronized
  bgMusic.addEventListener('play', syncMusicButtons);
  bgMusic.addEventListener('pause', syncMusicButtons);

  // Restore music if active from session
  const savedState = sessionStorage.getItem('birthday_bgm_state');
  const savedTime = parseFloat(sessionStorage.getItem('birthday_bgm_time') || '0');

  if (savedState === 'playing') {
    if (bgMusic.paused) {
      if (savedTime && Math.abs(bgMusic.currentTime - savedTime) > 2) {
        try { bgMusic.currentTime = savedTime; } catch (e) {}
      }
      const playPromise = bgMusic.play();
      if (playPromise) {
        playPromise.then(() => syncMusicButtons()).catch(() => {
          const resumeOnTouch = () => {
            bgMusic.play().then(() => syncMusicButtons()).catch(() => {});
            document.removeEventListener('click', resumeOnTouch);
            document.removeEventListener('touchstart', resumeOnTouch);
          };
          document.addEventListener('click', resumeOnTouch, { once: true });
          document.addEventListener('touchstart', resumeOnTouch, { once: true });
        });
      }
    } else {
      syncMusicButtons();
    }
  }

  // Save progress periodically and before unload
  bgMusic.addEventListener('timeupdate', () => {
    sessionStorage.setItem('birthday_bgm_time', String(bgMusic.currentTime));
  });

  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('birthday_bgm_state', bgMusic.paused ? 'paused' : 'playing');
    sessionStorage.setItem('birthday_bgm_time', String(bgMusic.currentTime));
  });

  // Attach click listeners to music buttons
  function bindMusicButtons() {
    document.querySelectorAll('#sound-toggle, .garden-sound-button, .music-toggle-btn').forEach(btn => {
      btn.removeEventListener('click', toggleMusic);
      btn.addEventListener('click', toggleMusic);
    });
    syncMusicButtons();
  }

  // 3. Seamless SPA Page Transition Router (Không reload trang, nhạc không ngắt)
  let isNavigating = false;

  async function loadPage(url, push = true) {
    if (isNavigating) return;
    isNavigating = true;

    try {
      // Auto-start music on navigation gesture if user hasn't muted it
      ensureMusicPlayingOnGesture();

      // 1. Notify active page to clean up loops (canvas, mic, timers)
      document.dispatchEvent(new CustomEvent('page:before-exit'));

      // 2. Smooth subtle fade-out
      document.body.style.transition = 'opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.style.opacity = '0';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error loading page: ' + response.statusText);
      const htmlText = await response.text();

      const parser = new DOMParser();
      const newDoc = parser.parseFromString(htmlText, 'text/html');

      // 3. Update document title & body styling
      document.title = newDoc.title;
      document.body.className = newDoc.body.className;

      // 4. Synchronize Head Styles and Stylesheets
      document.head.querySelectorAll('[data-seamless-head]').forEach(el => el.remove());

      const existingLinks = new Set(
        Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
          .map(l => l.getAttribute('href'))
          .filter(Boolean)
      );

      newDoc.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
        if (el.tagName === 'LINK') {
          const href = el.getAttribute('href');
          if (href && existingLinks.has(href)) {
            return;
          }
        }
        const clone = el.cloneNode(true);
        clone.setAttribute('data-seamless-head', 'true');
        document.head.appendChild(clone);
      });

      // 5. Extract script tags from incoming head & body
      const existingScriptSrcs = new Set(
        Array.from(document.querySelectorAll('script[src]'))
          .map(s => s.getAttribute('src'))
          .filter(Boolean)
      );

      const scripts = Array.from(newDoc.querySelectorAll('script'));
      scripts.forEach(s => s.remove());

      // 6. Replace DOM content
      document.body.innerHTML = newDoc.body.innerHTML;

      // 7. Re-execute scripts sequentially
      for (const oldScript of scripts) {
        const src = oldScript.getAttribute('src');
        if (src && src.includes('seamless.js')) {
          continue; // Keep the active seamless router running
        }

        // Skip re-loading global libraries like GSAP or Tailwind if already loaded
        if (src && (src.includes('gsap') || src.includes('tailwindcss')) && existingScriptSrcs.has(src)) {
          continue;
        }

        const newScript = document.createElement('script');
        if (src) {
          newScript.src = src;
          newScript.async = false;
          await new Promise(resolve => {
            newScript.onload = resolve;
            newScript.onerror = resolve;
            document.body.appendChild(newScript);
          });
        } else {
          newScript.textContent = oldScript.textContent;
          document.body.appendChild(newScript);
        }
      }

      // 8. Re-bind music buttons & link handlers
      bindMusicButtons();
      bindInternalLinks();

      if (push) {
        history.pushState({ url }, newDoc.title, url);
      }

      window.scrollTo(0, 0);

      // 9. Smooth fade-in
      requestAnimationFrame(() => {
        document.body.style.opacity = '1';
        setTimeout(() => {
          document.body.style.transition = '';
          isNavigating = false;
        }, 240);
      });

    } catch (err) {
      console.warn('Seamless navigation fallback to native reload:', err);
      isNavigating = false;
      window.location.href = url;
    }
  }

  window.navigateSeamless = loadPage;

  function bindInternalLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (
        href.startsWith('#') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('//') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) return;
      if (!href.endsWith('.html') && !href.includes('.html')) return;

      link.removeEventListener('click', handleLinkClick);
      link.addEventListener('click', handleLinkClick);
    });
  }

  function handleLinkClick(e) {
    const link = e.currentTarget;
    const href = link.getAttribute('href');
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    loadPage(href, true);
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    loadPage(currentPage, false);
  });

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    bindMusicButtons();
    bindInternalLinks();
  });

  bindMusicButtons();
  bindInternalLinks();
})();
