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
      text: 'Mỗi đóa hoa trong khu vườn đêm nay tượng trưng cho một nụ cười rạng rỡ của cậu. Hôm nay nhớ cười thật nhiều nha! 🌹'
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
   * 4. GENERATING THE FULLSCREEN FLOWER GARDEN
   * ------------------------------------------------------------*/
  function initStars() {
    stars.length = 0;
    const count = 55;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: (i * 97.31 + 17) % 1,
        y: ((i * 43.19 + 7) % 1) * 0.62, // upper night sky
        radius: (i % 6 === 0) ? 2.0 : ((i % 2 === 0) ? 1.3 : 0.8),
        freq: 1.2 + (i % 7) * 0.4,
        phase: i * 1.7,
        cross: i % 8 === 0
      });
    }
  }

  function initFireflies(extraCount = 36) {
    for (let i = 0; i < extraCount; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: height * (0.2 + Math.random() * 0.75),
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
    const count = 22;
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
          // Row 0: Back horizon
          radius = 20 + Math.random() * 6;
          yRatio = 0.56 + Math.random() * 0.1;
        } else if (row === 1) {
          // Row 1: Mid layer
          radius = 30 + Math.random() * 8;
          yRatio = 0.67 + Math.random() * 0.1;
        } else {
          // Row 2: Foreground (lush, prominent)
          radius = 42 + Math.random() * 11;
          yRatio = 0.78 + Math.random() * 0.1;
        }

        const x = (i + 0.5) * step + (Math.random() - 0.5) * step * 0.55;
        const y = height * yRatio;
        const rootY = height + 10; // Rooted naturally at bottom of screen

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
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2.2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initStars();
    initFallingPetals();
    fireflies.length = 0;
    initFireflies(36);
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
   * 6. RENDERING: FULLSCREEN SKY, MOON, STARS, GRASS
   * ------------------------------------------------------------*/
  function drawSkyAndMoon(time) {
    // 1. Deep Fairytale Twilight Gradient across full screen
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0e0814');
    skyGrad.addColorStop(0.35, '#1b0e22');
    skyGrad.addColorStop(0.70, '#2d142b');
    skyGrad.addColorStop(1, '#0e1814');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Cosmic Rose Aura in the center of the garden
    const galaxyGlow = ctx.createRadialGradient(
      width * 0.5, height * 0.55, 30,
      width * 0.5, height * 0.55, width * 0.7
    );
    galaxyGlow.addColorStop(0, 'rgba(214, 96, 158, 0.16)');
    galaxyGlow.addColorStop(0.55, 'rgba(170, 70, 130, 0.06)');
    galaxyGlow.addColorStop(1, 'rgba(170, 70, 130, 0)');
    ctx.fillStyle = galaxyGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Gentle Crescent Moon with Glowing Halo
    const moonX = width * 0.85;
    const moonY = Math.max(70, height * 0.15);
    const moonR = Math.min(26, width * 0.04);

    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 3.8);
    moonGlow.addColorStop(0, 'rgba(255, 238, 210, 0.28)');
    moonGlow.addColorStop(0.5, 'rgba(255, 220, 240, 0.08)');
    moonGlow.addColorStop(1, 'rgba(255, 220, 240, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3.8, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = '#fff4e3';
    ctx.shadowColor = 'rgba(255, 245, 230, 0.8)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, TAU);
    ctx.fill();

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

      if (star.cross && twinkle > 0.75) {
        ctx.strokeStyle = `rgba(255, 235, 245, ${twinkle * 0.5})`;
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
    ctx.save();
    const bladeCount = Math.floor(width / 15);
    const wind = Math.sin(time * 1.2) * 8;

    for (let i = 0; i <= bladeCount; i++) {
      const bx = (i / bladeCount) * width;
      const bladeH = 34 + Math.sin(i * 1.7) * 16;
      const sway = Math.sin(time * 1.5 + i * 0.4) * 6 + wind * 0.4;

      ctx.beginPath();
      ctx.moveTo(bx - 3, height);
      ctx.quadraticCurveTo(bx + sway * 0.5, height - bladeH * 0.6, bx + sway, height - bladeH);
      ctx.quadraticCurveTo(bx + sway * 0.3, height - bladeH * 0.4, bx + 3, height);

      const grassGrad = ctx.createLinearGradient(bx, height, bx, height - bladeH);
      grassGrad.addColorStop(0, 'rgba(15, 28, 18, 0.95)');
      grassGrad.addColorStop(0.7, 'rgba(38, 62, 36, 0.68)');
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

    const headX = flower.x + wind * 35 + flower.offsetX;
    const headY = flower.y + flower.offsetY;

    drawStemAndLeaves(flower, wind, headX, headY, p);

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(wind * 0.7 + (flower.offsetX * 0.02));

    const hoverScale = 1 + flower.hover * 0.12;
    const currentScale = p * hoverScale;
    ctx.scale(currentScale, currentScale);

    const breath = 1 + Math.sin(time * 1.5 + flower.phase) * 0.012;
    ctx.scale(breath, breath);

    if (flower.hover > 0.05 || flower.index === selectedFlowerIndex) {
      const glowAlpha = flower.index === selectedFlowerIndex ? 0.45 : flower.hover * 0.35;
      const aura = ctx.createRadialGradient(0, 0, flower.radius * 0.4, 0, 0, flower.radius * 1.9);
      aura.addColorStop(0, `rgba(255, 215, 235, ${glowAlpha})`);
      aura.addColorStop(0.6, `rgba(241, 165, 193, ${glowAlpha * 0.4})`);
      aura.addColorStop(1, 'rgba(241, 165, 193, 0)');

      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, flower.radius * 1.9, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, flower.radius * 1.45, 0, TAU);
      ctx.strokeStyle = `rgba(255, 230, 245, ${glowAlpha * 1.5})`;
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
      f.alpha = pulse;

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

    // 1. Fullscreen Sky, Moon, Stars
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
   * 10. FLOATING WISH BUBBLE (BAY LÊN TỪ BÔNG HOA, KHÔNG CHE GIỮA MÀN HÌNH)
   * ------------------------------------------------------------*/
  function showFloatingWish(flower) {
    selectedFlowerIndex = flower.index;
    wishBadge.textContent = flower.badge;
    wishText.textContent = flower.note;

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
    playChime(880, 1.2);

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

  soundButton.addEventListener('click', toggleMusic);
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
      if (isAudioPlaying) {
        bgMusic.pause();
      }
    } else {
      lastTime = performance.now();
      animationId = requestAnimationFrame(drawScene);
      if (isAudioPlaying) {
        bgMusic.play().catch(() => {});
      }
    }
  });

  resizeCanvas();
  animationId = requestAnimationFrame(drawScene);
})();
