/**
 * Seamless Navigation & Persistent Audio Controller
 * Giữ nhạc nền phát liên tục không bị gián đoạn xuyên suốt tất cả các trang
 */
(() => {
  'use strict';

  // 1. Singleton Global Audio Instance
  if (!window.__bgMusic) {
    window.__bgMusic = new Audio('assets/bg-music.mp3');
    window.__bgMusic.loop = true;
    window.__bgMusic.volume = 0.85;
  }

  const bgMusic = window.__bgMusic;

  // 2. Synchronize all music toggle buttons across pages
  function syncMusicButtons() {
    const isPlaying = !bgMusic.paused;
    const buttons = document.querySelectorAll('#sound-toggle, .music-toggle-btn');
    buttons.forEach(btn => {
      btn.setAttribute('aria-pressed', String(isPlaying));
      btn.textContent = isPlaying ? '♫ Đang phát nhạc ♡' : '♫ Nhạc nền';
      if (isPlaying) {
        btn.classList.add('playing');
      } else {
        btn.classList.remove('playing');
      }
    });

    sessionStorage.setItem('birthday_bgm_state', isPlaying ? 'playing' : 'paused');
    sessionStorage.setItem('birthday_bgm_time', String(bgMusic.currentTime));
  }

  function toggleMusic() {
    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        syncMusicButtons();
      }).catch(err => {
        console.log('Audio playback waiting for gesture:', err);
      });
    } else {
      bgMusic.pause();
      syncMusicButtons();
    }
  }

  window.toggleGlobalMusic = toggleMusic;
  window.syncGlobalMusicButtons = syncMusicButtons;

  // Restore music if active
  const savedState = sessionStorage.getItem('birthday_bgm_state');
  const savedTime = parseFloat(sessionStorage.getItem('birthday_bgm_time') || '0');

  if (savedState === 'playing') {
    if (bgMusic.paused) {
      if (savedTime && Math.abs(bgMusic.currentTime - savedTime) > 2) {
        bgMusic.currentTime = savedTime;
      }
      const playPromise = bgMusic.play();
      if (playPromise) {
        playPromise.then(() => syncMusicButtons()).catch(() => {
          // If browser policy blocks autoplay on initial visit, resume on first user touch
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
    document.querySelectorAll('#sound-toggle, .music-toggle-btn').forEach(btn => {
      btn.removeEventListener('click', toggleMusic);
      btn.addEventListener('click', toggleMusic);
    });
    syncMusicButtons();
  }

  // 3. Seamless SPA Page Transition Router (Không load lại trang, nhạc không bị ngắt)
  let isNavigating = false;

  async function loadPage(url, push = true) {
    if (isNavigating) return;
    isNavigating = true;

    try {
      // Notify active page to clean up loops (canvas, mic, timers)
      document.dispatchEvent(new CustomEvent('page:before-exit'));

      // Smooth subtle fade-out
      document.body.style.transition = 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.style.opacity = '0';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error loading page');
      const htmlText = await response.text();

      const parser = new DOMParser();
      const newDoc = parser.parseFromString(htmlText, 'text/html');

      // Update title and body styling
      document.title = newDoc.title;
      document.body.className = newDoc.body.className;

      // Extract script tags
      const scripts = Array.from(newDoc.querySelectorAll('script'));
      scripts.forEach(s => s.remove());

      // Replace DOM content
      document.body.innerHTML = newDoc.body.innerHTML;

      // Re-execute scripts sequentially
      for (const oldScript of scripts) {
        if (oldScript.src && oldScript.src.includes('seamless.js')) {
          continue; // Keep the active seamless router running
        }

        const newScript = document.createElement('script');
        if (oldScript.src) {
          newScript.src = oldScript.src;
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

      // Re-bind music buttons & link handlers
      bindMusicButtons();
      bindInternalLinks();

      if (push) {
        history.pushState({ url }, newDoc.title, url);
      }

      window.scrollTo(0, 0);

      // Smooth fade-in
      requestAnimationFrame(() => {
        document.body.style.opacity = '1';
        setTimeout(() => {
          document.body.style.transition = '';
          isNavigating = false;
        }, 250);
      });

    } catch (err) {
      console.warn('Seamless navigation fallback to native reload:', err);
      // Fallback to normal navigation if fetch fails (e.g. file:// protocol restriction)
      isNavigating = false;
      window.location.href = url;
    }
  }

  function bindInternalLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
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
  window.addEventListener('popstate', e => {
    loadPage(window.location.pathname.split('/').pop() || 'index.html', false);
  });

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    bindMusicButtons();
    bindInternalLinks();
  });

  bindMusicButtons();
  bindInternalLinks();
})();
