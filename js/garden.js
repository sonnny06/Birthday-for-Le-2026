(() => {
  'use strict';

  const canvas = document.getElementById('garden-canvas');
  if (!canvas || !window.GardenBotany) {
    console.error('Garden canvas or GardenBotany was not found.');
    return;
  }

  const ctx = canvas.getContext('2d');
  const messageBox = document.getElementById('garden-message');
  const messageBadge = document.getElementById('message-badge');
  const messageText = document.getElementById('message-text');
  const closeButton = document.getElementById('close-message');
  const soundButton = document.getElementById('sound-toggle');
  const replayButton = document.getElementById('replay-bloom');
  const firefliesButton = document.getElementById('fireflies-toggle');

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
      text: 'Mong tuổi mới mang đến cho cậu thật nhiều niềm vui, sự dịu dàng và những bình yên trong từng khoảnh khắc nhỏ bé mỗi ngày. 🌷'
    },
    {
      badge: '✧ LỜI NHẮN TỪ KHU VƯỜN #2 ✧',
      text: 'Cảm ơn cậu vì đã xuất hiện và khiến thế giới xung quanh trở nên ngọt ngào, ấm áp và đặc biệt hơn rất nhiều. ♡'
    },
    {
      badge: '✧ ĐIỀU ƯỚC SINH NHẬT #3 ✧',
      text: 'Chúc cho mọi ước mơ trong lòng cậu, dù là nhỏ bé nhất, đều sẽ từng bước đơm hoa kết trái thật rực rỡ nhé! 🌟'
    },
    {
      badge: '✧ ĐÓA HOA TƯƠI ĐẸP #4 ✧',
      text: 'Mỗi bông hoa trong khu vườn đêm nay tượng trưng cho một nụ cười rạng rỡ của cậu. Hôm nay nhớ cười thật nhiều nha! 🌹'
    },
    {
      badge: '✧ ĐIỀU ƯỚC SINH NHẬT #5 ✧',
      text: 'Mong cậu luôn có đủ tự tin để theo đuổi những điều mình yêu thích, và luôn được yêu thương, trân trọng một cách trọn vẹn nhất. ✨'
    },
    {
      badge: '✧ LỜI NHẮN TỪ KHU VƯỜN #6 ✧',
      text: 'Tuổi mới chúc cậu một đời an yên, tâm hồn lúc nào cũng phơi phới như mùa xuân và ngập tràn hạnh phúc giản đơn! 🌸'
    },
    {
      badge: '✧ ĐÓA HỒNG KIÊU HÃNH #7 ✧',
      text: 'Cậu như đóa hoa hồng này vậy – vừa dịu dàng, vừa kiên cường và luôn tỏa ra một ánh sáng rất riêng. Cứ tự tin tỏa sáng nhé! 🌺'
    },
    {
      badge: '✧ ĐIỀU ƯỚC SINH NHẬT #8 ✧',
      text: 'Chúc cậu một sinh nhật ngập tràn lời chúc tốt lành, bánh ngọt thơm lừng và một năm mới tràn đầy may mắn! 🎂'
    },
    {
      badge: '✧ LỜI NHẮN TỪ KHU VƯỜN #9 ✧',
      text: 'Mong mỗi sớm mai thức dậy, cậu đều tìm thấy một lý do thật đáng yêu để mỉm cười và thấy yêu đời hơn. ☀️'
    },
    {
      badge: '✧ ĐIỀU ƯỚC SINH NHẬT #10 ✧',
      text: 'Dù ngoài kia có bộn bề thế nào, hãy luôn nhớ rằng cậu xứng đáng được nhận những điều ngọt ngào nhất trần đời! 💐'
    },
    {
      badge: '✧ ĐIỀU ƯỚC BÍ MẬT #11 ✧',
      text: 'Bông hoa này giữ hộ cậu một điều ước sinh nhật. Bây giờ hãy nhắm mắt lại 3 giây và ước một điều thật đẹp nhé... 🌠'
    },
    {
      badge: '✧ HAPPY BIRTHDAY #12 ✧',
      text: 'Chúc mừng sinh nhật cậu! Chúc cho nụ cười của cậu sẽ mãi rực rỡ và tỏa hương như cả khu vườn đêm nay. 🎉'
    }
  ];

  /* -------------------------------------------------------------
   * 2. CRYSTAL MUSIC BOX SYNTHESIZER (WEB AUDIO API)
   * ------------------------------------------------------------*/
  let audioContext = null;
  let isMusicPlaying = false;
  let musicTimer = null;
  let currentNoteIndex = 0;

  // Happy Birthday melody in C major / F major (sweet high register)
  const HAPPY_BIRTHDAY_MELODY = [
    { freq: 392.00, dur: 0.32, delay: 0.42 }, // G4
    { freq: 392.00, dur: 0.32, delay: 0.42 }, // G4
    { freq: 440.00, dur: 0.65, delay: 0.78 }, // A4
    { freq: 392.00, dur: 0.65, delay: 0.78 }, // G4
    { freq: 523.25, dur: 0.65, delay: 0.78 }, // C5
    { freq: 493.88, dur: 1.10, delay: 1.35 }, // B4

    { freq: 392.00, dur: 0.32, delay: 0.42 }, // G4
    { freq: 392.00, dur: 0.32, delay: 0.42 }, // G4
    { freq: 440.00, dur: 0.65, delay: 0.78 }, // A4
    { freq: 392.00, dur: 0.65, delay: 0.78 }, // G4
    { freq: 587.33, dur: 0.65, delay: 0.78 }, // D5
    { freq: 523.25, dur: 1.10, delay: 1.35 }, // C5

    { freq: 392.00, dur: 0.32, delay: 0.42 }, // G4
    { freq: 392.00, dur: 0.32, delay: 0.42 }, // G4
    { freq: 783.99, dur: 0.65, delay: 0.78 }, // G5
    { freq: 659.25, dur: 0.65, delay: 0.78 }, // E5
    { freq: 523.25, dur: 0.65, delay: 0.78 }, // C5
    { freq: 493.88, dur: 0.65, delay: 0.78 }, // B4
    { freq: 440.00, dur: 1.10, delay: 1.35 }, // A4

    { freq: 698.46, dur: 0.32, delay: 0.42 }, // F5
    { freq: 698.46, dur: 0.32, delay: 0.42 }, // F5
    { freq: 659.25, dur: 0.65, delay: 0.78 }, // E5
    { freq: 523.25, dur: 0.65, delay: 0.78 }, // C5
    { freq: 587.33, dur: 0.65, delay: 0.78 }, // D5
    { freq: 523.25, dur: 1.40, delay: 1.95 }  // C5 (pause before loop)
  ];

  function getAudioContext() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  }

  function playMusicBoxTine(freq, duration = 1.2, volume = 0.22) {
    const actx = getAudioContext();
    if (!actx) return;

    const t = actx.currentTime;

    // Fundamental chime tone
    const osc1 = actx.createOscillator();
    const gain1 = actx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);

    gain1.gain.setValueAtTime(0.0001, t);
    gain1.gain.linearRampToValueAtTime(volume, t + 0.006);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc1.connect(gain1);
    gain1.connect(actx.destination);
    osc1.start(t);
    osc1.stop(t + duration);

    // Overtone (2.0x octave harmonic for crystal music-box sheen)
    const osc2 = actx.createOscillator();
    const gain2 = actx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t);

    gain2.gain.setValueAtTime(0.0001, t);
    gain2.gain.linearRampToValueAtTime(volume * 0.38, t + 0.004);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.55);

    osc2.connect(gain2);
    gain2.connect(actx.destination);
    osc2.start(t);
    osc2.stop(t + duration * 0.55);
  }

  function playChimeArpeggio(baseFreq = 587.33) {
    playMusicBoxTine(baseFreq, 1.3, 0.24);
    setTimeout(() => {
      playMusicBoxTine(baseFreq * 1.5, 1.5, 0.18);
    }, 70);
  }

  function playNextMelodyStep() {
    if (!isMusicPlaying) return;

    const step = HAPPY_BIRTHDAY_MELODY[currentNoteIndex];
    playMusicBoxTine(step.freq, step.dur, 0.2);

    currentNoteIndex = (currentNoteIndex + 1) % HAPPY_BIRTHDAY_MELODY.length;
    musicTimer = setTimeout(playNextMelodyStep, step.delay * 1000);
  }

  function toggleMusic() {
    isMusicPlaying = !isMusicPlaying;
    soundButton.setAttribute('aria-pressed', String(isMusicPlaying));
    soundButton.textContent = isMusicPlaying ? '♫ Đang phát nhạc...' : '♫ Nhạc sinh nhật';

    if (isMusicPlaying) {
      getAudioContext();
      currentNoteIndex = 0;
      clearTimeout(musicTimer);
      playNextMelodyStep();
    } else {
      clearTimeout(musicTimer);
    }
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

  // Pre-cached sprite dictionary for buttery-smooth 60fps rendering
  const spriteCache = new Map();

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
      hasDewdrop: Math.random() < 0.4
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
   * 4. GENERATING THE FLOWER GARDEN (3 DEPTH LAYERS)
   * ------------------------------------------------------------*/
  function initStars() {
    stars.length = 0;
    const count = 48;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: (i * 97.31 + 17) % 1,
        y: ((i * 43.19 + 7) % 1) * 0.65, // upper sky
        radius: (i % 5 === 0) ? 1.8 : ((i % 2 === 0) ? 1.2 : 0.7),
        freq: 1.2 + (i % 7) * 0.4,
        phase: i * 1.7,
        cross: i % 8 === 0
      });
    }
  }

  function initFireflies(extraCount = 32) {
    for (let i = 0; i < extraCount; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: height * (0.25 + Math.random() * 0.7),
        vx: (Math.random() - 0.5) * 22,
        vy: -10 - Math.random() * 25,
        radius: 1.8 + Math.random() * 2.2,
        phase: Math.random() * TAU,
        pulseSpeed: 1.5 + Math.random() * 2.5,
        hue: Math.random() < 0.65 ? 'gold' : (Math.random() < 0.5 ? 'pink' : 'emerald'),
        alpha: 0
      });
    }
  }

  function initFallingPetals() {
    fallingPetals.length = 0;
    const count = 20;
    for (let i = 0; i < count; i++) {
      fallingPetals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 3.5 + Math.random() * 4.5,
        speedY: 20 + Math.random() * 30,
        speedX: 10 + Math.random() * 22,
        flutterSpeed: 1.8 + Math.random() * 2.5,
        flutterPhase: Math.random() * TAU,
        rotation: Math.random() * TAU,
        rotSpeed: (Math.random() - 0.5) * 1.5
      });
    }
  }

  function createGardenFlowers() {
    flowers.length = 0;

    // Distribute 30-36 flowers across 3 depth rows
    const rowCounts = [
      Math.max(8, Math.min(14, Math.floor(width / 75))),  // Row 0: Background
      Math.max(10, Math.min(16, Math.floor(width / 62))), // Row 1: Midground
      Math.max(7, Math.min(12, Math.floor(width / 85)))   // Row 2: Foreground
    ];

    let flowerGlobalIndex = 0;

    rowCounts.forEach((count, row) => {
      const step = width / count;

      for (let i = 0; i < count; i++) {
        const isBud = row === 0 ? (i % 3 === 0) : (row === 1 && i % 5 === 0);
        const paletteKey = PALETTE_KEYS[(i * 3 + row * 2) % PALETTE_KEYS.length];
        const variety = row === 2 ? (i % 2 === 0 ? 'peony' : 'classic') : 'garden';

        // Staggered sizing and heights by depth
        let radius = 0;
        let yRatio = 0;
        let stemLen = 0;

        if (row === 0) {
          // Distant back layer
          radius = 19 + Math.random() * 6;
          yRatio = 0.44 + Math.random() * 0.12;
          stemLen = height * (0.24 + Math.random() * 0.12);
        } else if (row === 1) {
          // Midground lush layer
          radius = 29 + Math.random() * 8;
          yRatio = 0.56 + Math.random() * 0.12;
          stemLen = height * (0.32 + Math.random() * 0.14);
        } else {
          // Foreground hero layer
          radius = 40 + Math.random() * 10;
          yRatio = 0.68 + Math.random() * 0.12;
          stemLen = height * (0.38 + Math.random() * 0.16);
        }

        const x = (i + 0.5) * step + (Math.random() - 0.5) * step * 0.55;
        const y = height * yRatio;

        const noteObj = BIRTHDAY_NOTES[flowerGlobalIndex % BIRTHDAY_NOTES.length];

        // Stagger bloom delay: ripples gracefully from center outward and from back to front
        const distFromCenter = Math.abs(x - width * 0.5) / (width * 0.5);
        const bloomDelay = 0.15 + distFromCenter * 1.5 + (2 - row) * 0.35 + Math.random() * 0.35;

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
          rootY: Math.min(height + 15, y + stemLen),
          radius,
          paletteKey,
          variety,
          isBud,
          sprite,
          bend: (Math.random() - 0.5) * 55,
          phase: Math.random() * TAU,
          swayAmp: 0.035 + (2 - row) * 0.02 + Math.random() * 0.025,
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

    // Sort by depth (row, then y) so closer flowers always draw on top
    flowers.sort((a, b) => a.row - b.row || a.y - b.y);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2.2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initStars();
    initFallingPetals();
    fireflies.length = 0;
    initFireflies(34);
    createGardenFlowers();

    bloomStartTime = performance.now();
  }

  /* -------------------------------------------------------------
   * 5. PARTICLES: SPARKLES & BURSTS ON TOUCH
   * ------------------------------------------------------------*/
  function spawnFlowerSparkles(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU;
      const speed = 35 + Math.random() * 85;
      sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        radius: 1.5 + Math.random() * 2.5,
        color: Math.random() < 0.6 ? '#ffe4ae' : '#ffb8d4',
        alpha: 1,
        life: 0.8 + Math.random() * 0.5,
        age: 0
      });
    }
  }

  /* -------------------------------------------------------------
   * 6. RENDERING: BACKGROUND, SKY, MOON, STARS, GRASS
   * ------------------------------------------------------------*/
  function drawSkyAndMoon(time) {
    // 1. Deep Fairytale Twilight Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#110b17');
    skyGrad.addColorStop(0.38, '#1e1126');
    skyGrad.addColorStop(0.72, '#2f152d');
    skyGrad.addColorStop(1, '#0f1a16');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Cosmic Rose Aura in the center of the garden
    const galaxyGlow = ctx.createRadialGradient(
      width * 0.5, height * 0.58, 20,
      width * 0.5, height * 0.58, width * 0.65
    );
    galaxyGlow.addColorStop(0, 'rgba(214, 96, 158, 0.18)');
    galaxyGlow.addColorStop(0.55, 'rgba(170, 70, 130, 0.08)');
    galaxyGlow.addColorStop(1, 'rgba(170, 70, 130, 0)');
    ctx.fillStyle = galaxyGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Gentle Crescent Moon with Glowing Halo
    const moonX = width * 0.82;
    const moonY = height * 0.16;
    const moonR = Math.min(26, width * 0.045);

    // Moon outer glow
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 3.8);
    moonGlow.addColorStop(0, 'rgba(255, 238, 210, 0.28)');
    moonGlow.addColorStop(0.5, 'rgba(255, 220, 240, 0.08)');
    moonGlow.addColorStop(1, 'rgba(255, 220, 240, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3.8, 0, TAU);
    ctx.fill();

    // Crescent moon shape
    ctx.save();
    ctx.fillStyle = '#fff4e3';
    ctx.shadowColor = 'rgba(255, 245, 230, 0.8)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, TAU);
    ctx.fill();

    // Subtract inner circle to form crescent
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(moonX - moonR * 0.45, moonY - moonR * 0.25, moonR * 0.92, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 4. Twinkling Stars
    stars.forEach(star => {
      const sx = star.x * width;
      const sy = star.y * height;
      const twinkle = reducedMotion.matches
        ? 0.7
        : 0.35 + 0.65 * Math.pow(Math.sin(time * star.freq + star.phase), 2);

      ctx.save();
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = '#fff5fa';

      ctx.beginPath();
      ctx.arc(sx, sy, star.radius, 0, TAU);
      ctx.fill();

      // Subtle 4-point cross shine on prominent stars
      if (star.cross && twinkle > 0.75) {
        ctx.strokeStyle = 'rgba(255, 235, 245, ' + (twinkle * 0.5) + ')';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy); ctx.lineTo(sx + 4, sy);
        ctx.moveTo(sx, sy - 4); ctx.lineTo(sx, sy + 4);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawGardenGroundFoliage(time) {
    // Elegant silhouettes of wild grass and ground foliage at the base
    ctx.save();
    const bladeCount = Math.floor(width / 18);
    const wind = Math.sin(time * 1.2) * 8;

    for (let i = 0; i <= bladeCount; i++) {
      const bx = (i / bladeCount) * width;
      const bladeH = 28 + Math.sin(i * 1.7) * 14;
      const sway = Math.sin(time * 1.5 + i * 0.4) * 6 + wind * 0.4;

      ctx.beginPath();
      ctx.moveTo(bx - 3, height);
      ctx.quadraticCurveTo(bx + sway * 0.5, height - bladeH * 0.6, bx + sway, height - bladeH);
      ctx.quadraticCurveTo(bx + sway * 0.3, height - bladeH * 0.4, bx + 3, height);

      const grassGrad = ctx.createLinearGradient(bx, height, bx, height - bladeH);
      grassGrad.addColorStop(0, 'rgba(15, 28, 18, 0.92)');
      grassGrad.addColorStop(0.7, 'rgba(38, 62, 36, 0.65)');
      grassGrad.addColorStop(1, 'rgba(68, 102, 64, 0.25)');

      ctx.fillStyle = grassGrad;
      ctx.fill();
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 7. RENDERING: FLOWERS, STEMS, LEAVES & HOVER GLOW
   * ------------------------------------------------------------*/
  function drawStemAndLeaves(flower, sway, headX, headY, p) {
    const baseX = flower.x + flower.bend * 0.35;
    const rootY = flower.rootY;

    // Control points for a graceful organic stem curve
    const c1x = flower.x - flower.bend * 0.2 + sway * 8;
    const c1y = rootY - (rootY - headY) * 0.45;
    const c2x = headX + sway * 4;
    const c2y = headY + (rootY - headY) * 0.25;

    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.4 + p * 0.6);

    // Stem stroke with gradient
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

    // Attached leaves moving naturally on the stem (at parametric t = 0.38 & t = 0.65)
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
    // 1. Calculate blooming progress
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

    // 2. Breeze and stem sway
    const wind = reducedMotion.matches
      ? 0
      : Math.sin(time * flower.speed + flower.phase + flower.x * 0.01) * flower.swayAmp;

    // 3. Mouse hover proximity physics
    const dx = flower.x - pointerX;
    const dy = flower.y - pointerY;
    const dist = Math.hypot(dx, dy);
    const hitRadius = flower.radius * 2.2 + 15;
    const isNearby = isPointerInside && dist < hitRadius;

    const targetHover = isNearby ? clamp(1 - dist / hitRadius) : 0;
    flower.hover += (targetHover - flower.hover) * 0.15;

    // Gentle repulsion when mouse is near
    const repulseDist = flower.radius * 0.22 * flower.hover;
    flower.offsetX += ((dx / (dist || 1)) * repulseDist - flower.offsetX) * 0.15;
    flower.offsetY += ((dy / (dist || 1)) * repulseDist - flower.offsetY) * 0.15;

    const headX = flower.x + wind * 35 + flower.offsetX;
    const headY = flower.y + flower.offsetY;

    // 4. Draw stem & leaves
    drawStemAndLeaves(flower, wind, headX, headY, p);

    // 5. Draw flower sprite
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(wind * 0.7 + (flower.offsetX * 0.02));

    const hoverScale = 1 + flower.hover * 0.12;
    const currentScale = p * hoverScale;
    ctx.scale(currentScale, currentScale);

    // Subtle breathing pulsing
    const breath = 1 + Math.sin(time * 1.5 + flower.phase) * 0.012;
    ctx.scale(breath, breath);

    // A. Soft luminous aura when hovered or selected
    if (flower.hover > 0.05 || flower.index === selectedFlowerIndex) {
      const glowAlpha = flower.index === selectedFlowerIndex ? 0.45 : flower.hover * 0.35;
      const aura = ctx.createRadialGradient(0, 0, flower.radius * 0.4, 0, 0, flower.radius * 1.9);
      aura.addColorStop(0, 'rgba(255, 215, 235, ' + glowAlpha + ')');
      aura.addColorStop(0.6, 'rgba(241, 165, 193, ' + (glowAlpha * 0.4) + ')');
      aura.addColorStop(1, 'rgba(241, 165, 193, 0)');

      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, flower.radius * 1.9, 0, TAU);
      ctx.fill();

      // Delicate golden ring
      ctx.beginPath();
      ctx.arc(0, 0, flower.radius * 1.45, 0, TAU);
      ctx.strokeStyle = 'rgba(255, 230, 245, ' + (glowAlpha * 1.5) + ')';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // B. Draw bud or full rose layers
    if (flower.isBud) {
      const bud = flower.sprite;
      const size = bud.logicalSize * (flower.radius / bud.radius);
      ctx.drawImage(bud.canvas, -size / 2, -size / 2, size, size);
    } else {
      const rose = flower.sprite;
      const size = rose.logicalSize * (flower.radius / rose.radius);
      const half = size / 2;

      // Base calyx & ambient drop shadow
      ctx.drawImage(rose.baseCanvas, -half, -half, size, size);

      // Concentric petal whorls (unfurl progressively during bloom)
      if (p >= 0.99) {
        // Fully bloomed: draw all layers crisp and fast
        for (let l = 0; l < rose.whorlCanvases.length; l++) {
          ctx.drawImage(rose.whorlCanvases[l], -half, -half, size, size);
        }
      } else {
        // Dynamic unfolding rotation during opening
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
      // Gentle sinusoidal drifting
      f.x += f.vx * delta + Math.sin(time * 1.2 + f.phase) * 12 * delta;
      f.y += f.vy * delta + Math.cos(time * 0.9 + f.phase) * 10 * delta;

      // Wrap around screen edges
      if (f.x < -30) f.x = width + 20;
      if (f.x > width + 30) f.x = -20;
      if (f.y < -30) {
        f.y = height + 10;
        f.x = Math.random() * width;
      }
      if (f.y > height + 40) f.y = 0;

      // Repulsion from pointer
      if (isPointerInside) {
        const dx = f.x - pointerX;
        const dy = f.y - pointerY;
        const d = Math.hypot(dx, dy);
        if (d < 75 && d > 0) {
          f.x += (dx / d) * (75 - d) * 0.1;
          f.y += (dy / d) * (75 - d) * 0.1;
        }
      }

      // Smooth pulsing glow
      const pulse = reducedMotion.matches ? 0.75 : 0.35 + 0.65 * Math.pow(Math.sin(time * f.pulseSpeed + f.phase), 2);
      f.alpha = pulse;

      // Draw glowing sphere
      const r = f.radius;
      const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 4.2);

      if (f.hue === 'gold') {
        glow.addColorStop(0, `rgba(255, 238, 140, ${pulse})`);
        glow.addColorStop(0.35, `rgba(255, 195, 110, ${pulse * 0.5})`);
        glow.addColorStop(1, 'rgba(255, 195, 110, 0)');
      } else if (f.hue === 'pink') {
        glow.addColorStop(0, `rgba(255, 210, 235, ${pulse})`);
        glow.addColorStop(0.35, `rgba(241, 145, 185, ${pulse * 0.5})`);
        glow.addColorStop(1, 'rgba(241, 145, 185, 0)');
      } else {
        glow.addColorStop(0, `rgba(180, 255, 215, ${pulse})`);
        glow.addColorStop(0.35, `rgba(110, 225, 175, ${pulse * 0.5})`);
        glow.addColorStop(1, 'rgba(110, 225, 175, 0)');
      }

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r * 4.2, 0, TAU);
      ctx.fill();

      // Sharp bright core
      ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.95})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r * 0.85, 0, TAU);
      ctx.fill();
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

      const petalGrad = ctx.createLinearGradient(0, -p.size, 0, p.size);
      petalGrad.addColorStop(0, '#fff4f8');
      petalGrad.addColorStop(0.5, '#f4a5c3');
      petalGrad.addColorStop(1, '#d8658d');

      ctx.fillStyle = petalGrad;
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
      s.vy += 35 * delta; // gentle gravity
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

    // 1. Sky, Moon, Stars
    drawSkyAndMoon(sceneTime);

    // 2. Flowers by depth row
    flowers.forEach(f => {
      drawSingleFlower(f, sceneTime, elapsedFromBloom);
    });

    // 3. Ground grass & foliage silhouettes
    drawGardenGroundFoliage(sceneTime);

    // 4. Falling rose petals
    if (!reducedMotion.matches) {
      updateAndDrawFallingPetals(delta, sceneTime);
    }

    // 5. Fireflies
    updateAndDrawFireflies(delta, sceneTime);

    // 6. Interactive sparkle bursts
    updateAndDrawSparkles(delta);

    animationId = requestAnimationFrame(drawScene);
  }

  /* -------------------------------------------------------------
   * 10. INTERACTION: CLICK, TOUCH, HOVER & MODAL
   * ------------------------------------------------------------*/
  function showNote(flower) {
    selectedFlowerIndex = flower.index;
    messageBadge.textContent = flower.badge;
    messageText.textContent = flower.note;
    messageBox.hidden = false;

    // Harmonious musical chime
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const pickedFreq = baseFreqs[flower.index % baseFreqs.length];
    playChimeArpeggio(pickedFreq);

    // Spawn celebratory sparkles
    spawnFlowerSparkles(flower.x, flower.y - flower.radius * 0.4, 20);
  }

  function hideNote() {
    messageBox.hidden = true;
    selectedFlowerIndex = -1;
  }

  function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let closestFlower = null;
    let minDistance = Infinity;

    // Prioritize foreground flowers first (reverse order)
    for (let i = flowers.length - 1; i >= 0; i--) {
      const f = flowers[i];
      if (f.bloomProgress <= 0.1) continue;

      const dx = x - (f.x + f.offsetX);
      const dy = y - (f.y + f.offsetY);
      const dist = Math.hypot(dx, dy);
      const hitRadius = f.radius * 1.5 + 16;

      if (dist < hitRadius && dist < minDistance) {
        closestFlower = f;
        minDistance = dist;
      }
    }

    if (closestFlower) {
      showNote(closestFlower);
    }
  }

  function handlePointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
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
    hideNote();
    playChimeArpeggio(523.25);
  }

  function addMoreFireflies() {
    initFireflies(16);
    playMusicBoxTine(880, 1.2, 0.2);

    // Spawn gentle sparkles around the top of the canvas
    for (let i = 0; i < 12; i++) {
      spawnFlowerSparkles(Math.random() * width, height * (0.3 + Math.random() * 0.4), 3);
    }
  }

  /* -------------------------------------------------------------
   * 11. EVENT LISTENERS SETUP
   * ------------------------------------------------------------*/
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerleave', handlePointerLeave);

  closeButton.addEventListener('click', hideNote);
  soundButton.addEventListener('click', toggleMusic);
  replayButton.addEventListener('click', replayBloom);
  firefliesButton.addEventListener('click', addMoreFireflies);

  // Keyboard accessibility
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !messageBox.hidden) {
      hideNote();
    }
  });

  window.addEventListener('resize', resizeCanvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
      if (isMusicPlaying) {
        clearTimeout(musicTimer);
      }
    } else {
      lastTime = performance.now();
      animationId = requestAnimationFrame(drawScene);
      if (isMusicPlaying) {
        playNextMelodyStep();
      }
    }
  });

  // Start initialization
  resizeCanvas();
  animationId = requestAnimationFrame(drawScene);
})();
