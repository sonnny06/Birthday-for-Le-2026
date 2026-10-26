(() => {
  'use strict';

  const canvas = document.getElementById('garden-canvas');
  if (!canvas || !window.GardenBotany) {
    console.error('Garden canvas or GardenBotany was not found.');
    return;
  }

  const ctx = canvas.getContext('2d');
  const wishBubble = document.getElementById('floating-wish');
  const wishBadge = document.getElementById('wish-badge');
  const wishText = document.getElementById('wish-text');
  const closeWishButton = document.getElementById('close-wish');
  const soundButton = document.getElementById('sound-toggle');
  const replayButton = document.getElementById('replay-bloom');
  const firefliesButton = document.getElementById('fireflies-toggle');
  const wishCounterBadge = document.getElementById('wish-counter-badge');
  const discoveredNotes = new Set();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const easeOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
  const easeOutBack = t => {
    const c1 = 1.45;
    const c3 = c1 + 1;
    const p = clamp(t) - 1;
    return 1 + c3 * Math.pow(p, 3) + c1 * Math.pow(p, 2);
  };

  /* -------------------------------------------------------------
   * 1. 12 HEARTFELT BIRTHDAY NOTES & WISHES
   * ------------------------------------------------------------*/
  const BIRTHDAY_NOTES = [
    {
      badge: '✧ ĐIỀU ƯỚC SINH NHẬT #1 ✧',
      text: 'Yayyyy, chúc mừng sinh nhật cục cưng nhé !'
    },
    {
      badge: '✧ LỜI NHẮN TỪ KHU VƯỜN #2 ✧',
      text: 'Ô này là để cho em biết tình cảm tui còn nhiều thứ khó nói ♡'
    },
    {
      badge: '✧ ĐIỀU ƯỚC SINH NHẬT #3 ✧',
      text: 'Tuổi mới chúc em sẽ luôn năng lượng và vui vẻ mỗi ngày!🌟'
    },
    {
      badge: '✧ ĐÓA HOA TƯƠI ĐẸP #4 ✧',
      text: 'Mỗi đóa hoa trong khu vườn đêm nay tượng trưng cho một nụ cười rạng rỡ của em. Hôm nay nhớ cười thật nhiều nha! 🌹'
    },
    {
      badge: '✧ ĐIỀU ƯỚC SINH NHẬT #5 ✧',
      text: 'Chúc cô sớm gặp được cục cưng JK sớm nhé✨'
    },
    {
      badge: '✧ LỜI NHẮN TỪ KHU VƯỜN #6 ✧',
      text: 'Tuổi mới chúc em một đời an yên, tâm hồn lúc nào cũng phơi phới như mùa xuân và ngập tràn hạnh phúc giản đơn! 🌸'
    },
    {
      badge: '✧ ĐÓA HỒNG KIÊU HÃNH #7 ✧',
      text: 'mấy đóa hoa này sao mà xinh được bằng Phương Lê này chứ nhỉ🌺'
    },
    {
      badge: '✧ ĐIỀU ƯỚC SINH NHẬT #8 ✧',
      text: 'hãy luôn ngọt ngào như những miếng bánh kem sắp tới của em nhé 🎂'
    },
    {
      badge: '✧ LỜI NHẮN TỪ KHU VƯỜN #9 ✧',
      text: 'Chúc mừng em đã bước sang tuổi mới,cộng đồng u30 rất vui được đón chào em 🌷'
    },
    {
      badge: '✧ ĐIỀU ƯỚC SINH NHẬT #10 ✧',
      text: 'Sang tuổi mới,mạnh mẽ kiên cường và quyết thắng, không để con rắn nào cắn mình 💐'
    },
    {
      badge: '✧ ĐIỀU ƯỚC BÍ MẬT #11 ✧',
      text: 'Gọi em là 27/10/2006 vì nụ cười của em đẹp như ngày hôm đó 🌠'
    },
    {
      badge: '✧ HAPPY BIRTHDAY #12 ✧',
      text: 'Tuổi mới,thi đâu đỗ đó🎉'
    }
  ];

  /* -------------------------------------------------------------
   * 2. BACKGROUND MUSIC & CRYSTAL CHIME AUDIO
   * ------------------------------------------------------------*/
  function toggleMusic() {
    if (window.toggleGlobalMusic) {
      window.toggleGlobalMusic();
    }
  }

  // Crystal Chime Sound Effects
  let chimeContext = null;
  function playChime(freq = 659.25, dur = 1.4) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!chimeContext) chimeContext = new AudioCtx();
      if (chimeContext.state === 'suspended') chimeContext.resume();

      const t = chimeContext.currentTime;
      const osc = chimeContext.createOscillator();
      const gain = chimeContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(gain);
      gain.connect(chimeContext.destination);

      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {}
  }

  function playChimeArpeggio(baseFreq = 587.33) {
    playChime(baseFreq, 1.2);
    setTimeout(() => playChime(baseFreq * 1.5, 1.5), 80);
  }

  /* -------------------------------------------------------------
   * 3. SCENE STATE & ASSETS
   * ------------------------------------------------------------*/
  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationId = 0;
  let lastTime = 0;
  let sceneTime = 0;
  let bloomStartTime = 0;
  let selectedFlowerIndex = -1;

  let pointerX = -9999;
  let pointerY = -9999;
  let isPointerInside = false;

  const flowers = [];
  const fireflies = [];
  const fallingPetals = [];
  const sparkles = [];
  const stars = [];
  const skyLanterns = [];
  const butterflies = [];
  const shootingStars = [];
  const babyBreathClusters = [];
  const glowingMushrooms = [];

  const PALETTE_KEYS = [
    'sweetBlush',
    'pastelPink',
    'creamPeach',
    'pearlVintage',
    'berryRomance',
    'paleGreen',
    'skyBlue',
    'pearlWhite'
  ];

  const spriteCache = new Map();
  const fireflySprites = {};

  let cachedSkyGrad = null;
  let cachedNebulaGrad = null;
  let cachedGalaxyGlow = null;
  let cachedGrassGrad = null;
  let cachedGrassGradH = 0;
  let cachedPetalGrad = null;
  let cachedStemGrad = null;

  function getFireflySprite(hue) {
    if (fireflySprites[hue]) return fireflySprites[hue];
    const sCanvas = document.createElement('canvas');
    const sz = 36;
    sCanvas.width = sz;
    sCanvas.height = sz;
    const sCtx = sCanvas.getContext('2d');
    const half = sz / 2;

    const glow = sCtx.createRadialGradient(half, half, 0, half, half, half);
    if (hue === 'gold') {
      glow.addColorStop(0, 'rgba(255, 238, 140, 1)');
      glow.addColorStop(0.35, 'rgba(255, 195, 110, 0.55)');
      glow.addColorStop(1, 'rgba(255, 195, 110, 0)');
    } else if (hue === 'pink') {
      glow.addColorStop(0, 'rgba(255, 210, 235, 1)');
      glow.addColorStop(0.35, 'rgba(241, 145, 185, 0.55)');
      glow.addColorStop(1, 'rgba(241, 145, 185, 0)');
    } else {
      glow.addColorStop(0, 'rgba(180, 255, 215, 1)');
      glow.addColorStop(0.35, 'rgba(110, 225, 175, 0.55)');
      glow.addColorStop(1, 'rgba(110, 225, 175, 0)');
    }
    sCtx.fillStyle = glow;
    sCtx.beginPath();
    sCtx.arc(half, half, half, 0, TAU);
    sCtx.fill();

    sCtx.fillStyle = '#ffffff';
    sCtx.beginPath();
    sCtx.arc(half, half, 2.2, 0, TAU);
    sCtx.fill();

    fireflySprites[hue] = sCanvas;
    return sCanvas;
  }

  function getPetalGrad() {
    if (!cachedPetalGrad) {
      cachedPetalGrad = ctx.createLinearGradient(0, -14, 0, 14);
      cachedPetalGrad.addColorStop(0, '#fff4f8');
      cachedPetalGrad.addColorStop(0.5, '#f4a5c3');
      cachedPetalGrad.addColorStop(1, '#d8658d');
    }
    return cachedPetalGrad;
  }

  function getRoseSprite(paletteKey, variety, radius) {
    const key = `${paletteKey}_${variety}_${Math.round(radius)}`;
    if (spriteCache.has(key)) return spriteCache.get(key);

    const sprite = GardenBotany.createRealisticRoseSprite({
      radius,
      paletteKey,
      variety,
      tiltX: (Math.random() - 0.5) * 0.4,
      tiltY: (Math.random() - 0.5) * 0.3,
      seed: Math.floor(Math.random() * 10000),
      hasDewdrop: Math.random() < 0.45
    });

    spriteCache.set(key, sprite);
    return sprite;
  }

  function getBudSprite(paletteKey) {
    const key = `bud_${paletteKey}`;
    if (spriteCache.has(key)) return spriteCache.get(key);

    const bud = GardenBotany.createRoseBudSprite({ paletteKey });
    spriteCache.set(key, bud);
    return bud;
  }

  /* -------------------------------------------------------------
   * 4. GENERATING THE FULLSCREEN ENCHANTED GARDEN & SKY ELEMENTS
   * ------------------------------------------------------------*/
  function initStars() {
    stars.length = 0;
    const count = 85;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: (i * 97.31 + 17) % 1,
        y: ((i * 43.19 + 7) % 1) * 0.64,
        radius: (i % 7 === 0) ? 2.2 : ((i % 2 === 0) ? 1.4 : 0.9),
        freq: 1.2 + (i % 7) * 0.4,
        phase: i * 1.7,
        cross: i % 6 === 0
      });
    }
  }

  function initSkyLanterns(count = 9) {
    for (let i = 0; i < count; i++) {
      skyLanterns.push({
        x: width * (0.08 + Math.random() * 0.84),
        y: height * (0.14 + Math.random() * 0.48),
        size: 8 + Math.random() * 7,
        speedY: 5 + Math.random() * 8,
        swayAmp: 8 + Math.random() * 12,
        phase: Math.random() * TAU
      });
    }
  }

  function initButterflies() {
    butterflies.length = 0;
    const colors = [
      { top: '#ffd875', bot: '#ffaa42' },
      { top: '#f2c7ce', bot: '#dca2ae' },
      { top: '#fff4b8', bot: '#f4a5c3' },
      { top: '#c4f0de', bot: '#85d6b5' }
    ];
    for (let i = 0; i < 7; i++) {
      const col = colors[i % colors.length];
      butterflies.push({
        x: width * (0.1 + Math.random() * 0.8),
        y: height * (0.42 + Math.random() * 0.36),
        vx: (Math.random() < 0.5 ? 1 : -1) * (18 + Math.random() * 22),
        vy: (Math.random() - 0.5) * 10,
        size: 6.5 + Math.random() * 3.5,
        flapSpeed: 9 + Math.random() * 5,
        phase: Math.random() * TAU,
        topColor: col.top,
        botColor: col.bot
      });
    }
  }

  function initGardenUndergrowth() {
    babyBreathClusters.length = 0;
    glowingMushrooms.length = 0;

    // Tiny white & gold baby's breath floral sprays between the roses
    const clusterCount = Math.max(18, Math.floor(width / 52));
    for (let i = 0; i < clusterCount; i++) {
      const cx = (i + 0.5) * (width / clusterCount) + (Math.random() - 0.5) * 28;
      const cy = height * (0.64 + Math.random() * 0.28);
      const florets = [];
      const fCount = 5 + Math.floor(Math.random() * 5);
      for (let k = 0; k < fCount; k++) {
        florets.push({
          dx: (Math.random() - 0.5) * 34,
          dy: -Math.random() * 28,
          r: 2.0 + Math.random() * 1.8,
          isGold: k % 3 === 0
        });
      }
      babyBreathClusters.push({
        x: cx,
        y: cy,
        phase: Math.random() * TAU,
        florets
      });
    }

    // Glowing fairytale mushrooms along the foreground garden floor
    const mushCount = Math.max(8, Math.floor(width / 135));
    for (let i = 0; i < mushCount; i++) {
      glowingMushrooms.push({
        x: width * (0.06 + (i / mushCount) * 0.88) + (Math.random() - 0.5) * 35,
        y: height * (0.87 + Math.random() * 0.09),
        scale: 0.75 + Math.random() * 0.5,
        hue: i % 2 === 0 ? 'gold' : 'aqua',
        phase: Math.random() * TAU
      });
    }
  }

  function initFireflies(extraCount = 42) {
    for (let i = 0; i < extraCount; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: height * (0.18 + Math.random() * 0.78),
        vx: (Math.random() - 0.5) * 20,
        vy: -8 - Math.random() * 22,
        radius: 1.8 + Math.random() * 2.4,
        phase: Math.random() * TAU,
        pulseSpeed: 1.5 + Math.random() * 2.5,
        hue: Math.random() < 0.65 ? 'gold' : (Math.random() < 0.5 ? 'pink' : 'emerald'),
        alpha: 0
      });
    }
  }

  function initFallingPetals() {
    fallingPetals.length = 0;
    const count = 26;
    for (let i = 0; i < count; i++) {
      fallingPetals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 3.5 + Math.random() * 4.5,
        speedY: 20 + Math.random() * 28,
        speedX: 10 + Math.random() * 20,
        flutterSpeed: 1.8 + Math.random() * 2.5,
        flutterPhase: Math.random() * TAU,
        rotation: Math.random() * TAU,
        rotSpeed: (Math.random() - 0.5) * 1.5
      });
    }
  }

  function createGardenFlowers() {
    flowers.length = 0;

    // Fullscreen scaling: distribute flowers smoothly across the entire width
    const rowCounts = [
      Math.max(9, Math.min(16, Math.floor(width / 68))),  // Row 0: Distant background
      Math.max(11, Math.min(18, Math.floor(width / 58))), // Row 1: Lush midground
      Math.max(8, Math.min(14, Math.floor(width / 78)))   // Row 2: Prominent foreground
    ];

    let flowerGlobalIndex = 0;

    rowCounts.forEach((count, row) => {
      const step = width / count;

      for (let i = 0; i < count; i++) {
        const isBud = row === 0 ? (i % 3 === 0) : (row === 1 && i % 5 === 0);
        const paletteKey = PALETTE_KEYS[(i * 3 + row * 2) % PALETTE_KEYS.length];
        const variety = row === 2 ? (i % 2 === 0 ? 'peony' : 'classic') : 'garden';

        let radius = 0;
        let yRatio = 0;

        if (row === 0) {
          // Row 0: Back horizon (lowered slightly so upper sky & title cartouche breathe clearly)
          radius = 21 + Math.random() * 6;
          yRatio = 0.58 + Math.random() * 0.08;
        } else if (row === 1) {
          // Row 1: Mid layer
          radius = 31 + Math.random() * 8;
          yRatio = 0.68 + Math.random() * 0.09;
        } else {
          // Row 2: Foreground (lush, prominent)
          radius = 42 + Math.random() * 11;
          yRatio = 0.79 + Math.random() * 0.09;
        }

        const x = (i + 0.5) * step + (Math.random() - 0.5) * step * 0.55;
        const y = height * yRatio;
        const rootY = height + 10;

        const noteObj = BIRTHDAY_NOTES[flowerGlobalIndex % BIRTHDAY_NOTES.length];
        const distFromCenter = Math.abs(x - width * 0.5) / (width * 0.5);
        const bloomDelay = 0.15 + distFromCenter * 1.4 + (2 - row) * 0.35 + Math.random() * 0.35;

        let sprite = null;
        if (isBud) {
          sprite = getBudSprite(paletteKey);
        } else {
          sprite = getRoseSprite(paletteKey, variety, radius);
        }

        flowers.push({
          index: flowerGlobalIndex,
          row,
          x,
          y,
          rootY,
          radius,
          paletteKey,
          variety,
          isBud,
          sprite,
          bend: (Math.random() - 0.5) * 55,
          phase: Math.random() * TAU,
          swayAmp: 0.035 + (2 - row) * 0.02 + Math.random() * 0.02,
          speed: 0.8 + Math.random() * 0.5,
          bloomDelay,
          bloomProgress: reducedMotion.matches ? 1 : 0,
          hover: 0,
          offsetX: 0,
          offsetY: 0,
          note: noteObj.text,
          badge: noteObj.badge
        });

        flowerGlobalIndex++;
      }
    });

    flowers.sort((a, b) => a.row - b.row || a.y - b.y);
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    // Cap DPR at 1.5 to eliminate heavy GPU fill-rate latency on high-res displays
    dpr = Math.min(window.devicePixelRatio || 1, width > 1400 ? 1.25 : 1.5);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Invalidate cached gradients on window resize
    cachedSkyGrad = null;
    cachedNebulaGrad = null;
    cachedGalaxyGlow = null;
    cachedGrassGrad = null;
    cachedPetalGrad = null;
    cachedStemGrad = null;

    initStars();
    initFallingPetals();
    skyLanterns.length = 0;
    initSkyLanterns(9);
    initButterflies();
    initGardenUndergrowth();
    fireflies.length = 0;
    initFireflies(34);
    createGardenFlowers();

    bloomStartTime = performance.now();
  }

  /* -------------------------------------------------------------
   * 5. PARTICLES: SPARKLES & BURSTS ON TOUCH
   * ------------------------------------------------------------*/
  function spawnFlowerSparkles(x, y, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU;
      const speed = 35 + Math.random() * 85;
      sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        radius: 1.5 + Math.random() * 2.8,
        color: Math.random() < 0.6 ? '#ffe4ae' : '#ffb8d4',
        alpha: 1,
        life: 0.8 + Math.random() * 0.5,
        age: 0
      });
    }
  }

  /* -------------------------------------------------------------
   * 6. RENDERING: FULLSCREEN SKY, MOON, STARS, 3D PAPERCUT HILLS
   * ------------------------------------------------------------*/
  function drawSkyAndMoon(time) {
    // 1. Deep Midnight Indigo Twilight Sky (Cached gradient)
    if (!cachedSkyGrad) {
      cachedSkyGrad = ctx.createLinearGradient(0, 0, 0, height);
      cachedSkyGrad.addColorStop(0, '#100920');
      cachedSkyGrad.addColorStop(0.32, '#1a122e');
      cachedSkyGrad.addColorStop(0.68, '#2d1c44');
      cachedSkyGrad.addColorStop(1, '#1e112a');
    }
    ctx.fillStyle = cachedSkyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Dreamy Diagonal Milky Way / Starlight Nebula Ribbon
    ctx.save();
    ctx.translate(width * 0.5, height * 0.25);
    ctx.rotate(-0.22);
    if (!cachedNebulaGrad) {
      cachedNebulaGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, width * 0.55);
      cachedNebulaGrad.addColorStop(0, 'rgba(242, 199, 206, 0.14)');
      cachedNebulaGrad.addColorStop(0.45, 'rgba(155, 105, 195, 0.08)');
      cachedNebulaGrad.addColorStop(1, 'rgba(45, 28, 68, 0)');
    }
    ctx.fillStyle = cachedNebulaGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.6, height * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Cosmic Rose Aura in the center of the shadowbox
    if (!cachedGalaxyGlow) {
      cachedGalaxyGlow = ctx.createRadialGradient(
        width * 0.5, height * 0.52, 30,
        width * 0.5, height * 0.52, width * 0.65
      );
      cachedGalaxyGlow.addColorStop(0, 'rgba(220, 162, 174, 0.16)');
      cachedGalaxyGlow.addColorStop(0.55, 'rgba(184, 107, 126, 0.07)');
      cachedGalaxyGlow.addColorStop(1, 'rgba(184, 107, 126, 0)');
    }
    ctx.fillStyle = cachedGalaxyGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Twinkling Stars (drawn in upper sky before hills)
    stars.forEach(star => {
      const sx = star.x * width;
      const sy = star.y * height;
      const twinkle = reducedMotion.matches
        ? 0.7
        : 0.35 + 0.65 * Math.pow(Math.sin(time * star.freq + star.phase), 2);

      ctx.save();
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = '#fff6ea';

      ctx.beginPath();
      ctx.arc(sx, sy, star.radius, 0, TAU);
      ctx.fill();

      if (star.cross && twinkle > 0.72) {
        ctx.strokeStyle = `rgba(255, 235, 215, ${twinkle * 0.55})`;
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(sx - 5, sy); ctx.lineTo(sx + 5, sy);
        ctx.moveTo(sx, sy - 5); ctx.lineTo(sx, sy + 5);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 4. Clean 3D Layered Paper Crescent Moon with Concentric Paper Halo Rings (NO destination-out hole!)
    const px = isPointerInside ? ((pointerX / (width || 1)) - 0.5) * 18 : 0;
    const py = isPointerInside ? ((pointerY / (height || 1)) - 0.5) * 10 : 0;

    const moonX = width * 0.85 - px * 0.25;
    const moonY = Math.max(92, height * 0.17) - py * 0.2;
    const moonR = Math.min(30, Math.max(20, width * 0.032));

    // Concentric Paper Halo Discs
    ctx.save();
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 4.2);
    moonGlow.addColorStop(0, 'rgba(255, 230, 150, 0.34)');
    moonGlow.addColorStop(0.45, 'rgba(255, 195, 110, 0.12)');
    moonGlow.addColorStop(1, 'rgba(255, 170, 66, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 4.2, 0, TAU);
    ctx.fill();

    // Subtle paper ring cutouts around the moon
    ctx.strokeStyle = 'rgba(255, 244, 184, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 1.65, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.35, 0, TAU);
    ctx.stroke();

    // True Geometric Crescent Path (outer arc + inner concave arc)
    ctx.fillStyle = '#fff4b8';
    ctx.shadowColor = 'rgba(255, 216, 117, 0.9)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, -Math.PI * 0.72, Math.PI * 0.48, false);
    ctx.bezierCurveTo(
      moonX + moonR * 0.35, moonY + moonR * 0.35,
      moonX - moonR * 0.15, moonY - moonR * 0.45,
      moonX + Math.cos(-Math.PI * 0.72) * moonR,
      moonY + Math.sin(-Math.PI * 0.72) * moonR
    );
    ctx.closePath();
    ctx.fill();

    // Dangling Star Charm hanging from the upper tip of the crescent moon
    const tipX = moonX + Math.cos(-Math.PI * 0.72) * moonR;
    const tipY = moonY + Math.sin(-Math.PI * 0.72) * moonR;
    const charmSway = Math.sin(time * 1.8) * 2.5;
    ctx.strokeStyle = 'rgba(255, 244, 184, 0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX + charmSway, tipY + 22);
    ctx.stroke();

    ctx.fillStyle = '#ffd875';
    ctx.beginPath();
    ctx.arc(tipX + charmSway, tipY + 24, 2.5, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Soft Layered Paper Clouds near the moon & horizon
    drawPaperCloud(moonX - moonR * 1.4 + Math.sin(time * 0.3) * 8, moonY + moonR * 0.75, moonR * 1.2, 'rgba(61, 35, 74, 0.68)');
    drawPaperCloud(width * 0.18 + Math.cos(time * 0.25) * 10, height * 0.22, moonR * 1.35, 'rgba(45, 28, 68, 0.55)');

    // 5. 3D Layered Papercut Mountain Dunes (Crisp Paper Contours - Zero GPU blur lag)
    ctx.save();
    // Layer 1: Distant Mauve Silhouette Ridge
    ctx.fillStyle = '#2d1c44';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.56 + py * 0.3);
    ctx.bezierCurveTo(
      width * 0.25 + px * 0.4, height * 0.50 + py * 0.3,
      width * 0.55 + px * 0.4, height * 0.60 + py * 0.3,
      width, height * 0.51 + py * 0.3
    );
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();
    ctx.strokeStyle = 'rgba(12, 6, 22, 0.42)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Distant Right Ridge: Fairytale Paper Castle / Spire Silhouette
    const casX = width * 0.82 + px * 0.45;
    const casY = height * 0.535 + py * 0.3;
    drawPaperCastleSilhouette(casX, casY, time);

    // Distant Left Ridge: Storybook Cottage + Cypress Trees
    const cotX = width * 0.18 + px * 0.45;
    const cotY = height * 0.535 + py * 0.3;
    drawPaperCottageSilhouette(cotX, cotY, time);

    // Layer 2: Mid-ground Plum Hill Ridge
    ctx.fillStyle = '#3d234a';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.67 + py * 0.6);
    ctx.bezierCurveTo(
      width * 0.35 + px * 0.8, height * 0.60 + py * 0.6,
      width * 0.7 + px * 0.8, height * 0.70 + py * 0.6,
      width, height * 0.62 + py * 0.6
    );
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 4, 18, 0.52)';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Mid-ground Left Ridge: Romantic Paper Gazebo (Vọng Lâu Cổ Tích) with Glowing Lantern
    const gazX = width * 0.11 + px * 0.75;
    const gazY = height * 0.645 + py * 0.6;
    drawPaperGazeboSilhouette(gazX, gazY, time);

    // Mid-ground Right Ridge: Layered Paper Blossom Tree & Cypress Silhouettes
    drawPaperTreeSilhouette(width * 0.89 + px * 0.75, height * 0.635 + py * 0.6, 44, '#331c40');
    drawPaperTreeSilhouette(width * 0.93 + px * 0.75, height * 0.65 + py * 0.6, 32, '#2a1536');

    // Layer 3: Foreground Velvety Paper Terrace
    ctx.fillStyle = '#25152e';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.81);
    ctx.bezierCurveTo(width * 0.45 + px * 1.1, height * 0.76, width * 0.8 + px * 1.1, height * 0.83, width, height * 0.78);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();
    ctx.strokeStyle = 'rgba(8, 3, 14, 0.62)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  function drawPaperCloud(cx, cy, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.52, Math.PI, TAU);
    ctx.arc(cx + size * 0.45, cy - size * 0.12, size * 0.62, Math.PI, TAU);
    ctx.arc(cx + size * 0.95, cy + size * 0.04, size * 0.45, Math.PI, TAU);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPaperCottageSilhouette(cotX, cotY, time) {
    ctx.save();
    ctx.fillStyle = '#241438';
    ctx.fillRect(cotX - 18, cotY - 18, 36, 22);
    // Steep Storybook Roof
    ctx.fillStyle = '#351e4d';
    ctx.beginPath();
    ctx.moveTo(cotX - 24, cotY - 16);
    ctx.lineTo(cotX, cotY - 38);
    ctx.lineTo(cotX + 24, cotY - 16);
    ctx.closePath();
    ctx.fill();
    // Warm Glowing Paper Windows
    const winPulse = 0.75 + 0.25 * Math.sin(time * 2.2);
    ctx.fillStyle = `rgba(255, 216, 117, ${winPulse})`;
    ctx.fillRect(cotX - 9, cotY - 12, 6, 8);
    ctx.fillRect(cotX + 3, cotY - 12, 6, 8);
    ctx.restore();

    drawPaperTreeSilhouette(cotX - 34, cotY + 2, 30, '#231336');
    drawPaperTreeSilhouette(cotX + 32, cotY + 4, 24, '#2a173f');
  }

  function drawPaperCastleSilhouette(cx, cy, time) {
    ctx.save();
    ctx.fillStyle = '#231336';
    // Central Keep & Side Turrets
    ctx.fillRect(cx - 22, cy - 28, 44, 32);
    ctx.fillRect(cx - 10, cy - 48, 20, 48);
    ctx.fillRect(cx - 28, cy - 36, 10, 38);
    ctx.fillRect(cx + 18, cy - 36, 10, 38);

    // Conical Paper Spires
    ctx.fillStyle = '#351e4d';
    // Center tall spire
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy - 48);
    ctx.lineTo(cx, cy - 76);
    ctx.lineTo(cx + 13, cy - 48);
    ctx.closePath();
    ctx.fill();
    // Left spire
    ctx.beginPath();
    ctx.moveTo(cx - 31, cy - 36);
    ctx.lineTo(cx - 23, cy - 56);
    ctx.lineTo(cx - 15, cy - 36);
    ctx.closePath();
    ctx.fill();
    // Right spire
    ctx.beginPath();
    ctx.moveTo(cx + 15, cy - 36);
    ctx.lineTo(cx + 23, cy - 56);
    ctx.lineTo(cx + 31, cy - 36);
    ctx.closePath();
    ctx.fill();

    // Glowing Arched Castle Windows
    const pulse = 0.75 + 0.25 * Math.sin(time * 1.9 + 1);
    ctx.fillStyle = `rgba(255, 224, 130, ${pulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy - 34, 3.5, Math.PI, 0);
    ctx.lineTo(cx + 3.5, cy - 26);
    ctx.lineTo(cx - 3.5, cy - 26);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(cx - 24.5, cy - 28, 3, 6);
    ctx.fillRect(cx + 21.5, cy - 28, 3, 6);
    ctx.restore();
  }

  function drawPaperGazeboSilhouette(gx, gy, time) {
    ctx.save();
    ctx.fillStyle = '#2c1738';
    // Base platform
    ctx.fillRect(gx - 22, gy - 4, 44, 6);
    // Delicate pillars
    ctx.fillRect(gx - 16, gy - 26, 3, 22);
    ctx.fillRect(gx - 6, gy - 26, 2.5, 22);
    ctx.fillRect(gx + 3.5, gy - 26, 2.5, 22);
    ctx.fillRect(gx + 13, gy - 26, 3, 22);

    // Curved Pagoda/Cupola Dome
    ctx.fillStyle = '#472857';
    ctx.beginPath();
    ctx.moveTo(gx - 26, gy - 25);
    ctx.quadraticCurveTo(gx, gy - 46, gx + 26, gy - 25);
    ctx.closePath();
    ctx.fill();

    // Finial spire
    ctx.beginPath();
    ctx.moveTo(gx - 2, gy - 35);
    ctx.lineTo(gx, gy - 45);
    ctx.lineTo(gx + 2, gy - 35);
    ctx.fill();

    // Warm Hanging Lantern inside Gazebo
    const glow = 0.7 + 0.3 * Math.sin(time * 2.6);
    ctx.fillStyle = `rgba(255, 220, 125, ${glow})`;
    ctx.beginPath();
    ctx.arc(gx, gy - 18, 3.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPaperTreeSilhouette(tx, ty, h, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tx, ty - h);
    ctx.bezierCurveTo(tx + h * 0.28, ty - h * 0.6, tx + h * 0.24, ty - h * 0.2, tx, ty);
    ctx.bezierCurveTo(tx - h * 0.24, ty - h * 0.2, tx - h * 0.28, ty - h * 0.6, tx, ty - h);
    ctx.fill();
    ctx.restore();
  }

  // Floating Warm Amber Sky Lanterns (Đèn Trời Ước Nguyện)
  function updateAndDrawSkyLanterns(delta, time) {
    ctx.save();
    skyLanterns.forEach(l => {
      if (!reducedMotion.matches) {
        l.y -= l.speedY * delta;
        l.x += Math.sin(time * l.swaySpeed + l.phase) * 0.008 * delta;
        if (l.y < 0.04) {
          l.y = 0.52;
          l.x = 0.08 + Math.random() * 0.84;
        }
      }

      const lx = l.x * width + Math.sin(time * l.swaySpeed + l.phase) * 8;
      const ly = l.y * height;
      const s = l.size;
      const swayRot = Math.sin(time * l.swaySpeed + l.phase) * 0.08;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(swayRot);

      // Soft warm radial aura
      const aura = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 2.6);
      aura.addColorStop(0, 'rgba(255, 220, 125, 0.38)');
      aura.addColorStop(0.5, 'rgba(255, 160, 75, 0.12)');
      aura.addColorStop(1, 'rgba(255, 160, 75, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, s * 2.6, 0, TAU);
      ctx.fill();

      // Paper Lantern Body
      const bodyGrad = ctx.createLinearGradient(0, -s, 0, s);
      bodyGrad.addColorStop(0, '#ffae52');
      bodyGrad.addColorStop(0.55, '#ffd875');
      bodyGrad.addColorStop(1, '#fff6cc');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.75);
      ctx.quadraticCurveTo(0, -s * 1.05, s * 0.55, -s * 0.75);
      ctx.lineTo(s * 0.42, s * 0.75);
      ctx.quadraticCurveTo(0, s * 0.9, -s * 0.42, s * 0.75);
      ctx.closePath();
      ctx.fill();

      // Inner bright core flame
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, s * 0.25, s * 0.22, 0, TAU);
      ctx.fill();

      ctx.restore();
    });
    ctx.restore();
  }

  // Occasional Golden Shooting Stars in the upper night sky
  function updateAndDrawShootingStars(delta, time) {
    if (reducedMotion.matches) return;
    if (shootingStars.length < 1 && Math.random() < 0.008) {
      shootingStars.push({
        x: width * (0.15 + Math.random() * 0.55),
        y: height * (0.06 + Math.random() * 0.18),
        vx: 260 + Math.random() * 120,
        vy: 90 + Math.random() * 55,
        age: 0,
        life: 0.75 + Math.random() * 0.35
      });
    }

    if (!shootingStars.length) return;
    ctx.save();
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const st = shootingStars[i];
      st.age += delta;
      if (st.age >= st.life) {
        shootingStars.splice(i, 1);
        continue;
      }
      st.x += st.vx * delta;
      st.y += st.vy * delta;

      const prog = st.age / st.life;
      const alpha = Math.sin(prog * Math.PI);
      const tailX = st.x - st.vx * 0.16;
      const tailY = st.y - st.vy * 0.16;

      const grad = ctx.createLinearGradient(st.x, st.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 248, 215, ${alpha})`);
      grad.addColorStop(0.4, `rgba(255, 216, 117, ${alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(255, 216, 117, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 240, ${alpha})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // Lush Paper Rose-Bush Mounds, Baby's Breath Sprays & Bioluminescent Mushrooms
  function drawGardenUndergrowth(time) {
    ctx.save();

    // 1. Layered Scalloped Paper Bush Silhouettes behind the flower stems
    const bushRows = [
      { y: height * 0.83, color: '#1b2d22', edge: 'rgba(8, 4, 16, 0.45)', r: 34, count: 12 },
      { y: height * 0.90, color: '#15251b', edge: 'rgba(8, 4, 16, 0.52)', r: 42, count: 10 },
      { y: height * 0.96, color: '#0f1c14', edge: 'rgba(8, 4, 16, 0.60)', r: 48, count: 8 }
    ];
    bushRows.forEach((row, rIdx) => {
      ctx.fillStyle = row.color;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, row.y);
      for (let i = 0; i <= row.count; i++) {
        const bx = (i / row.count) * width;
        const humY = row.y - Math.abs(Math.sin(i * 1.9 + rIdx)) * row.r * 0.55;
        ctx.arc(bx, humY, row.r, Math.PI, TAU);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = row.edge;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });

    // 2. Baby's Breath (Hoa Sao / Hoa Baby Trắng Lấp Lánh) Sprays (Batched stems)
    babyBreathClusters.forEach(c => {
      const sway = Math.sin(time * 1.4 + c.phase) * 5;
      ctx.save();
      ctx.strokeStyle = 'rgba(72, 108, 70, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      c.florets.forEach(fl => {
        const fx = c.x + fl.dx + sway * (1 - fl.dy / 35);
        const fy = c.y + fl.dy;
        ctx.moveTo(c.x, c.y + 12);
        ctx.quadraticCurveTo(c.x + fl.dx * 0.5, c.y, fx, fy);
      });
      ctx.stroke();

      c.florets.forEach(fl => {
        const fx = c.x + fl.dx + sway * (1 - fl.dy / 35);
        const fy = c.y + fl.dy;
        const pulse = 0.65 + 0.35 * Math.sin(time * 2.5 + fl.phase);
        ctx.fillStyle = fl.isGold
          ? `rgba(255, 232, 155, ${pulse})`
          : `rgba(255, 245, 250, ${pulse * 0.9})`;
        ctx.beginPath();
        ctx.arc(fx, fy, fl.r, 0, TAU);
        ctx.fill();
      });
      ctx.restore();
    });

    // 3. Bioluminescent Fairytale Paper Mushrooms along the garden floor
    glowingMushrooms.forEach(m => {
      const sway = Math.sin(time * 1.6 + m.phase) * 1.5;
      const mx = m.x + sway;
      const my = m.y;
      const s = m.scale;

      ctx.save();
      // Soft ground glow
      ctx.fillStyle = m.hue === 'gold' ? 'rgba(255, 224, 130, 0.28)' : 'rgba(150, 245, 225, 0.25)';
      ctx.beginPath();
      ctx.arc(mx, my - 8 * s, 18 * s, 0, TAU);
      ctx.fill();

      // Slender curved paper stem
      ctx.strokeStyle = '#f3e5d8';
      ctx.lineWidth = 2.6 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, my + 6 * s);
      ctx.quadraticCurveTo(m.x - 2 * s, my - 2 * s, mx, my - 10 * s);
      ctx.stroke();

      // Glowing Paper Cap
      ctx.fillStyle = m.hue === 'gold' ? '#ffd875' : '#9ef5e1';
      ctx.beginPath();
      ctx.arc(mx, my - 9 * s, 8 * s, Math.PI, TAU);
      ctx.closePath();
      ctx.fill();

      // Tiny white paper spots on cap
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mx - 3 * s, my - 12 * s, 1.1 * s, 0, TAU);
      ctx.arc(mx + 2.5 * s, my - 13 * s, 1.3 * s, 0, TAU);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  // Fluttering 3D Origami / Paper Butterflies
  function updateAndDrawButterflies(delta, time) {
    ctx.save();
    butterflies.forEach(b => {
      if (!reducedMotion.matches) {
        b.x += b.vx * delta;
        b.y += b.vy * delta + Math.sin(time * 2.2 + b.phase) * 14 * delta;

        if (b.x < -40) b.x = width + 30;
        if (b.x > width + 40) b.x = -30;
        if (b.y < height * 0.35) b.vy = Math.abs(b.vy);
        if (b.y > height * 0.88) b.vy = -Math.abs(b.vy);
      }

      const flap = Math.abs(Math.sin(time * b.wingSpeed + b.phase));
      const dir = b.vx >= 0 ? 1 : -1;
      const s = b.size;

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(dir * 0.18 + Math.sin(time * 2 + b.phase) * 0.1);
      ctx.scale(dir, 1);

      // Upper Wing
      ctx.fillStyle = b.hue === 'gold' ? '#ffe596' : '#f7cad6';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.9, -s * (1.2 * flap + 0.2), s * 0.8, -s * (1.1 * flap + 0.2), s * 0.2, 0);
      ctx.fill();

      // Lower Wing
      ctx.fillStyle = b.hue === 'gold' ? '#ffd066' : '#e59fb2';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.7, s * (0.9 * flap + 0.15), s * 0.5, s * (0.8 * flap + 0.15), 0, 0);
      ctx.fill();

      ctx.restore();
    });
    ctx.restore();
  }

  // Glowing Dotted Thread Paths connecting flowers across the pop-up map
  function drawPaperStorybookPaths() {
    if (flowers.length < 2) return;
    ctx.save();
    ctx.setLineDash([4, 8]);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(255, 216, 117, 0.38)';

    const pathFlowers = [...flowers].sort((a, b) => a.index - b.index);

    ctx.beginPath();
    for (let i = 0; i < pathFlowers.length; i++) {
      const fx = pathFlowers[i].x;
      const fy = pathFlowers[i].y + pathFlowers[i].radius * 0.4;
      if (i === 0) {
        ctx.moveTo(fx, fy);
      } else {
        const prev = pathFlowers[i - 1];
        const pfx = prev.x;
        const pfy = prev.y + prev.radius * 0.4;
        const cx = (pfx + fx) / 2;
        const cy = Math.max(pfy, fy) + 24;
        ctx.quadraticCurveTo(cx, cy, fx, fy);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawGardenGroundFoliage(time) {
    ctx.save();
    const bladeCount = Math.min(68, Math.floor(width / 22));
    const wind = Math.sin(time * 1.2) * 8;

    if (!cachedGrassGrad || cachedGrassGradH !== height) {
      cachedGrassGrad = ctx.createLinearGradient(0, height, 0, height - 58);
      cachedGrassGrad.addColorStop(0, 'rgba(15, 28, 18, 0.95)');
      cachedGrassGrad.addColorStop(0.7, 'rgba(38, 62, 36, 0.68)');
      cachedGrassGrad.addColorStop(1, 'rgba(68, 102, 64, 0.25)');
      cachedGrassGradH = height;
    }

    ctx.fillStyle = cachedGrassGrad;
    ctx.beginPath();
    for (let i = 0; i <= bladeCount; i++) {
      const bx = (i / bladeCount) * width;
      const bladeH = 34 + Math.sin(i * 1.7) * 16;
      const sway = Math.sin(time * 1.5 + i * 0.4) * 6 + wind * 0.4;

      ctx.moveTo(bx - 3, height);
      ctx.quadraticCurveTo(bx + sway * 0.5, height - bladeH * 0.6, bx + sway, height - bladeH);
      ctx.quadraticCurveTo(bx + sway * 0.3, height - bladeH * 0.4, bx + 3, height);
    }
    ctx.fill();
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 7. RENDERING: FLOWERS, STEMS, LEAVES & HOVER GLOW
   * ------------------------------------------------------------*/
  function drawStemAndLeaves(flower, sway, headX, headY, p) {
    const baseX = flower.x + flower.bend * 0.35;
    const rootY = flower.rootY;

    const c1x = flower.x - flower.bend * 0.2 + sway * 8;
    const c1y = rootY - (rootY - headY) * 0.45;
    const c2x = headX + sway * 4;
    const c2y = headY + (rootY - headY) * 0.25;

    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.4 + p * 0.6);

    const stemGrad = ctx.createLinearGradient(baseX, rootY, headX, headY);
    stemGrad.addColorStop(0, '#243c26');
    stemGrad.addColorStop(0.5, '#4f724a');
    stemGrad.addColorStop(1, '#3b5a38');

    ctx.strokeStyle = stemGrad;
    ctx.lineWidth = Math.max(1.8, flower.radius * 0.08);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(baseX, rootY);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, headX, headY);
    ctx.stroke();

    if (p > 0.2) {
      const leafTValues = [0.38, 0.65];
      leafTValues.forEach((t, idx) => {
        const u = 1 - t;
        const lx = u ** 3 * baseX + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t ** 3 * headX;
        const ly = u ** 3 * rootY + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t ** 3 * headY;

        const leafLen = flower.radius * (0.85 + idx * 0.2) * p;
        const leafAngle = (idx === 0 ? -0.45 : Math.PI + 0.42) + sway * 0.8;

        GardenBotany.drawBotanicalLeaf(
          ctx,
          lx,
          ly,
          leafAngle,
          leafLen,
          leafLen * 0.32
        );
      });
    }

    ctx.restore();
  }

  function drawSingleFlower(flower, time, elapsed) {
    if (!reducedMotion.matches) {
      if (elapsed >= flower.bloomDelay) {
        const t = (elapsed - flower.bloomDelay) / 1.7;
        flower.bloomProgress = clamp(t);
      } else {
        flower.bloomProgress = 0;
      }
    } else {
      flower.bloomProgress = 1;
    }

    if (flower.bloomProgress <= 0) return;

    const p = easeOutBack(flower.bloomProgress);

    const wind = reducedMotion.matches
      ? 0
      : Math.sin(time * flower.speed + flower.phase + flower.x * 0.01) * flower.swayAmp;

    const dx = flower.x - pointerX;
    const dy = flower.y - pointerY;
    const dist = Math.hypot(dx, dy);
    const hitRadius = flower.radius * 2.2 + 15;
    const isNearby = isPointerInside && dist < hitRadius;

    const targetHover = isNearby ? clamp(1 - dist / hitRadius) : 0;
    flower.hover += (targetHover - flower.hover) * 0.15;

    const repulseDist = flower.radius * 0.22 * flower.hover;
    flower.offsetX += ((dx / (dist || 1)) * repulseDist - flower.offsetX) * 0.15;
    flower.offsetY += ((dy / (dist || 1)) * repulseDist - flower.offsetY) * 0.15;

    const hoverLift = flower.hover * 10;
    const headX = flower.x + wind * 35 + flower.offsetX;
    const headY = flower.y + flower.offsetY - hoverLift;

    // 3D Pop-Up Paper Cast Shadow on ground beneath lifted flower
    if (flower.hover > 0.04) {
      ctx.save();
      const shadowW = flower.radius * (1.15 - flower.hover * 0.15);
      const shadowH = flower.radius * 0.32;
      const sY = flower.y + flower.radius * 0.45 + hoverLift * 0.35;
      const groundShadow = ctx.createRadialGradient(flower.x, sY, 0, flower.x, sY, shadowW);
      groundShadow.addColorStop(0, `rgba(10, 5, 20, ${0.45 + flower.hover * 0.25})`);
      groundShadow.addColorStop(1, 'rgba(10, 5, 20, 0)');
      ctx.fillStyle = groundShadow;
      ctx.beginPath();
      ctx.ellipse(flower.x, sY, shadowW, shadowH, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    drawStemAndLeaves(flower, wind, headX, headY, p);

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(wind * 0.7 + (flower.offsetX * 0.02));

    const hoverScale = 1 + flower.hover * 0.12;
    const currentScale = p * hoverScale;
    ctx.scale(currentScale, currentScale);

    const breath = 1 + Math.sin(time * 1.5 + flower.phase) * 0.012;
    ctx.scale(breath, breath);

    const isDiscovered = discoveredNotes.has(flower.index % BIRTHDAY_NOTES.length);
    if (flower.hover > 0.05 || flower.index === selectedFlowerIndex || isDiscovered) {
      const glowAlpha = flower.index === selectedFlowerIndex
        ? 0.48
        : Math.max(flower.hover * 0.38, isDiscovered ? 0.22 : 0);
      const aura = ctx.createRadialGradient(0, 0, flower.radius * 0.4, 0, 0, flower.radius * 1.9);
      aura.addColorStop(0, isDiscovered ? `rgba(255, 226, 145, ${glowAlpha})` : `rgba(255, 215, 235, ${glowAlpha})`);
      aura.addColorStop(0.6, `rgba(241, 165, 193, ${glowAlpha * 0.4})`);
      aura.addColorStop(1, 'rgba(241, 165, 193, 0)');

      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, flower.radius * 1.9, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, flower.radius * 1.45, 0, TAU);
      ctx.strokeStyle = isDiscovered
        ? `rgba(255, 216, 117, ${glowAlpha * 1.4})`
        : `rgba(255, 230, 245, ${glowAlpha * 1.5})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    if (flower.isBud) {
      const bud = flower.sprite;
      const size = bud.logicalSize * (flower.radius / bud.radius);
      ctx.drawImage(bud.canvas, -size / 2, -size / 2, size, size);
    } else {
      const rose = flower.sprite;
      const size = rose.logicalSize * (flower.radius / rose.radius);
      const half = size / 2;

      ctx.drawImage(rose.baseCanvas, -half, -half, size, size);

      if (p >= 0.99) {
        for (let l = 0; l < rose.whorlCanvases.length; l++) {
          ctx.drawImage(rose.whorlCanvases[l], -half, -half, size, size);
        }
      } else {
        const whorlDelays = [0, 0.12, 0.25, 0.38];
        const twistAngles = [0.4, -0.6, 0.8, -1.1];

        for (let l = 0; l < rose.whorlCanvases.length; l++) {
          const lOpen = easeOutCubic((flower.bloomProgress - whorlDelays[l]) / (1 - whorlDelays[l]));
          if (lOpen <= 0) continue;

          ctx.save();
          ctx.rotate((1 - lOpen) * twistAngles[l]);
          const layerScale = 0.5 + lOpen * 0.5;
          ctx.scale(layerScale, layerScale);
          ctx.drawImage(rose.whorlCanvases[l], -half, -half, size, size);
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 8. RENDERING: FIREFLIES, PETALS & SPARKLES
   * ------------------------------------------------------------*/
  function updateAndDrawFireflies(delta, time) {
    ctx.save();

    fireflies.forEach(f => {
      f.x += f.vx * delta + Math.sin(time * 1.2 + f.phase) * 12 * delta;
      f.y += f.vy * delta + Math.cos(time * 0.9 + f.phase) * 10 * delta;

      if (f.x < -30) f.x = width + 20;
      if (f.x > width + 30) f.x = -20;
      if (f.y < -30) {
        f.y = height + 10;
        f.x = Math.random() * width;
      }
      if (f.y > height + 40) f.y = 0;

      if (isPointerInside) {
        const dx = f.x - pointerX;
        const dy = f.y - pointerY;
        const d = Math.hypot(dx, dy);
        if (d < 75 && d > 0) {
          f.x += (dx / d) * (75 - d) * 0.1;
          f.y += (dy / d) * (75 - d) * 0.1;
        }
      }

      const pulse = reducedMotion.matches ? 0.75 : 0.35 + 0.65 * Math.pow(Math.sin(time * f.pulseSpeed + f.phase), 2);
      ctx.globalAlpha = pulse;

      // Ultra-fast blit from pre-rendered sprite canvas (zero gradient GC overhead)
      const sprite = getFireflySprite(f.hue);
      const drawSize = f.radius * 7.5;
      ctx.drawImage(sprite, f.x - drawSize * 0.5, f.y - drawSize * 0.5, drawSize, drawSize);
    });

    ctx.restore();
  }

  function updateAndDrawFallingPetals(delta, time) {
    ctx.save();

    fallingPetals.forEach(p => {
      p.y += p.speedY * delta;
      p.x += (p.speedX + Math.sin(time * p.flutterSpeed + p.flutterPhase) * 15) * delta;
      p.rotation += p.rotSpeed * delta;

      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
      }
      if (p.x > width + 20) p.x = -20;

      const flutterCos = Math.cos(time * p.flutterSpeed + p.flutterPhase);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(0.55 + Math.abs(flutterCos) * 0.45, 1);

      ctx.fillStyle = getPetalGrad();
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 1.25, -p.size * 0.9, p.size * 0.85, p.size * 0.8, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.9, p.size * 0.2, -p.size * 0.65, -p.size * 0.85, 0, -p.size);
      ctx.fill();

      ctx.restore();
    });

    ctx.restore();
  }

  function updateAndDrawSparkles(delta) {
    if (!sparkles.length) return;

    ctx.save();
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.age += delta;
      if (s.age >= s.life) {
        sparkles.splice(i, 1);
        continue;
      }

      s.x += s.vx * delta;
      s.y += s.vy * delta;
      s.vy += 35 * delta;
      s.vx *= 0.98;

      const progress = s.age / s.life;
      const alpha = (1 - progress);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * (1 - progress * 0.5), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 9. MAIN ANIMATION LOOP
   * ------------------------------------------------------------*/
  function drawScene(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (!reducedMotion.matches) {
      sceneTime += delta;
    }

    const elapsedFromBloom = (timestamp - bloomStartTime) / 1000;

    ctx.clearRect(0, 0, width, height);

    // 1. Fullscreen Sky, Moon, Stars, Castle, Gazebo & Layered Paper Hills
    drawSkyAndMoon(sceneTime);

    // 2. Floating Warm Sky Lanterns & Shooting Stars in Upper Sky
    updateAndDrawSkyLanterns(delta, sceneTime);
    updateAndDrawShootingStars(delta, sceneTime);

    // 3. Lush Paper Rose-Bush Mounds, Baby's Breath Sprays & Bioluminescent Mushrooms
    drawGardenUndergrowth(sceneTime);

    // 4. Glowing Dotted Paper Thread Paths
    drawPaperStorybookPaths();

    // 5. Flowers by depth row with 3D paper lift
    flowers.forEach(f => {
      drawSingleFlower(f, sceneTime, elapsedFromBloom);
    });

    // 6. Ground grass & foliage silhouettes
    drawGardenGroundFoliage(sceneTime);

    // 7. Fluttering 3D Origami / Paper Butterflies
    updateAndDrawButterflies(delta, sceneTime);

    // 8. Falling rose petals
    if (!reducedMotion.matches) {
      updateAndDrawFallingPetals(delta, sceneTime);
    }

    // 9. Fireflies
    updateAndDrawFireflies(delta, sceneTime);

    // 10. Interactive sparkle bursts
    updateAndDrawSparkles(delta);

    animationId = requestAnimationFrame(drawScene);
  }

  /* -------------------------------------------------------------
   * 10. FLOATING WISH BUBBLE (BAY LÊN TỪ BÔNG HOA, KHÔNG CHE GIỮA MÀN HÌNH)
   * ------------------------------------------------------------*/
  function showFloatingWish(flower) {
    selectedFlowerIndex = flower.index;
    wishBadge.textContent = flower.badge;
    wishText.textContent = flower.note;

    const noteIdx = flower.index % BIRTHDAY_NOTES.length;
    discoveredNotes.add(noteIdx);
    if (wishCounterBadge) {
      wishCounterBadge.textContent = `🌷 Đã mở: ${discoveredNotes.size} / ${BIRTHDAY_NOTES.length}`;
      if (discoveredNotes.size === BIRTHDAY_NOTES.length) {
        wishCounterBadge.textContent = `✨ Đã mở trọn bộ 12 / 12 điều ước!`;
      }
    }

    if (window.ensureMusicPlayingOnGesture) {
      window.ensureMusicPlayingOnGesture();
    }

    const flowerScreenX = flower.x + flower.offsetX;
    const flowerScreenY = flower.y + flower.offsetY;

    // Width of card is around 320-340px
    const cardWidth = Math.min(340, window.innerWidth - 32);
    const halfW = cardWidth / 2;

    // Clamp X so it stays comfortably inside screen margins
    const clampedX = Math.max(halfW + 16, Math.min(window.innerWidth - halfW - 16, flowerScreenX));

    // Dynamic caret position pointing right at flower
    const caretOffset = ((flowerScreenX - (clampedX - halfW)) / cardWidth) * 100;
    const caretClamped = Math.max(14, Math.min(86, caretOffset));
    wishBubble.style.setProperty('--caret-left', `${caretClamped}%`);

    // Target Y: slightly above the flower head
    const targetY = flowerScreenY - flower.radius - 24;
    // If flower is too high up, place bubble below flower
    const finalY = (targetY < 180) ? (flowerScreenY + flower.radius + 36) : targetY;

    wishBubble.style.left = `${clampedX}px`;
    wishBubble.style.top = `${finalY}px`;

    wishBubble.hidden = false;
    wishBubble.classList.remove('animate-in');
    void wishBubble.offsetWidth; // force reflow for smooth rise-up animation
    wishBubble.classList.add('animate-in');

    // Chime & Sparkles right from this flower
    playChimeArpeggio(587.33);
    spawnFlowerSparkles(flowerScreenX, flowerScreenY - flower.radius * 0.4, 25);
  }

  function hideFloatingWish() {
    wishBubble.hidden = true;
    selectedFlowerIndex = -1;
  }

  function handleCanvasClick(event) {
    const x = event.clientX;
    const y = event.clientY;

    let closestFlower = null;
    let minDistance = Infinity;

    for (let i = flowers.length - 1; i >= 0; i--) {
      const f = flowers[i];
      if (f.bloomProgress <= 0.1) continue;

      const dx = x - (f.x + f.offsetX);
      const dy = y - (f.y + f.offsetY);
      const dist = Math.hypot(dx, dy);
      const hitRadius = f.radius * 1.6 + 18;

      if (dist < hitRadius && dist < minDistance) {
        closestFlower = f;
        minDistance = dist;
      }
    }

    if (closestFlower) {
      showFloatingWish(closestFlower);
    } else {
      hideFloatingWish();
    }
  }

  function handlePointerMove(event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    isPointerInside = true;
  }

  function handlePointerLeave() {
    isPointerInside = false;
    pointerX = -9999;
    pointerY = -9999;
  }

  function replayBloom() {
    bloomStartTime = performance.now();
    flowers.forEach(f => {
      f.bloomProgress = 0;
    });
    hideFloatingWish();
    playChimeArpeggio(523.25);
  }

  function addMoreFireflies() {
    initFireflies(16);
    initSkyLanterns(3);
    playChime(880, 1.2);

    // Also launch a golden shooting star on demand
    shootingStars.push({
      x: width * (0.18 + Math.random() * 0.45),
      y: height * (0.08 + Math.random() * 0.14),
      vx: 290 + Math.random() * 100,
      vy: 95 + Math.random() * 45,
      age: 0,
      life: 0.9
    });

    for (let i = 0; i < 14; i++) {
      spawnFlowerSparkles(Math.random() * width, height * (0.3 + Math.random() * 0.4), 3);
    }
  }

  /* -------------------------------------------------------------
   * 11. EVENT LISTENERS SETUP
   * ------------------------------------------------------------*/
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerleave', handlePointerLeave);

  closeWishButton.addEventListener('click', (e) => {
    e.stopPropagation();
    hideFloatingWish();
  });

  // Sound toggle is handled exclusively by seamless.js to prevent double toggling
  replayButton.addEventListener('click', replayBloom);
  firefliesButton.addEventListener('click', addMoreFireflies);

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !wishBubble.hidden) {
      hideFloatingWish();
    }
  });

  window.addEventListener('resize', resizeCanvas);

  document.addEventListener('page:before-exit', () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resizeCanvas);
  }, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      lastTime = performance.now();
      animationId = requestAnimationFrame(drawScene);
    }
  });

  resizeCanvas();
  animationId = requestAnimationFrame(drawScene);
})();
