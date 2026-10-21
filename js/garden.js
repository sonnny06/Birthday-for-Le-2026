
(() => {
  'use strict';

  const canvas = document.getElementById('garden-canvas');

  if (!canvas || !window.GardenBotany) {
    console.error('Garden canvas or GardenBotany was not found.');
    return;
  }

  const ctx = canvas.getContext('2d');
  const messageBox = document.getElementById('garden-message');
  const messageText = document.getElementById('message-text');
  const closeButton = document.getElementById('close-message');
  const soundButton = document.getElementById('sound-toggle');

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  const notes = [
    'Mong rằng tuổi mới của cậu sẽ có thật nhiều niềm vui và những điều dịu dàng. 🌷',
    'Cảm ơn cậu vì đã xuất hiện và khiến thế giới này trở nên đặc biệt hơn một chút. ♡',
    'Nếu hôm nay có một điều ước, mình mong cậu luôn được yêu thương và hạnh phúc. 🌹',
    'Bông hoa này dành cho cậu, người xứng đáng nhận được những điều đẹp đẽ nhất.'
  ];

  let width = 0;
  let height = 0;
  let animationId = 0;
  let lastTime = 0;
  let windTime = 0;
  let selectedFlower = -1;
  let audioContext = null;

  const flowers = [];

  const palettes = [
    'sweetBlush',
    'pastelPink',
    'creamPeach',
    'pearlVintage',
    'berryRomance'
  ];

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function createFlowers() {
    flowers.length = 0;

    const count = Math.max(
      7,
      Math.min(15, Math.floor(width / 42))
    );

    for (let i = 0; i < count; i++) {
      const depth = i / Math.max(1, count - 1);
      const radius = random(19, 31) * (0.75 + depth * 0.45);

      const sprite = GardenBotany.createRealisticRoseSprite({
        radius,
        paletteKey: palettes[i % palettes.length],
        variety: 'garden',
        tiltX: random(-0.3, 0.3),
        tiltY: random(-0.2, 0.2),
        seed: i * 37 + 11,
        hasDewdrop: i % 3 === 0
      });

      flowers.push({
        x: ((i + 0.5) / count) * width + random(-12, 12),
        y: height * random(0.47, 0.76),
        radius,
        stemHeight: random(65, 135),
        phase: random(0, Math.PI * 2),
        speed: random(0.6, 1.1),
        sway: random(0.025, 0.075),
        sprite,
        note: notes[i % notes.length],
        scale: 0,
        targetScale: 1,
        index: i
      });
    }
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    width = rect.width;
    height = rect.height;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createFlowers();
    drawScene(0);
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    gradient.addColorStop(0, '#211529');
    gradient.addColorStop(0.55, '#30203a');
    gradient.addColorStop(1, '#14221f');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(
      width / 2, height * 0.38, 5,
      width / 2, height * 0.38, width * 0.7
    );

    glow.addColorStop(0, 'rgba(219, 123, 172, 0.15)');
    glow.addColorStop(1, 'rgba(219, 123, 172, 0)');

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 230, 245, 0.65)';

    for (let i = 0; i < 28; i++) {
      const x = (i * 97.3) % width;
      const y = (i * 61.7) % (height * 0.62);
      const radius = i % 4 === 0 ? 1.5 : 0.7;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawStem(flower, sway) {
    const baseX = flower.x;
    const baseY = flower.y + flower.radius * 0.55;
    const bottomY = baseY + flower.stemHeight;

    ctx.save();

    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, flower.radius * 0.075);
    ctx.strokeStyle = '#547553';

    ctx.beginPath();
    ctx.moveTo(baseX, bottomY);
    ctx.bezierCurveTo(
      baseX - sway * 12,
      baseY + flower.stemHeight * 0.7,
      baseX + sway * 9,
      baseY + flower.stemHeight * 0.3,
      baseX + sway * 5,
      baseY
    );
    ctx.stroke();

    GardenBotany.drawBotanicalLeaf(
      ctx,
      baseX - 1,
      baseY + flower.stemHeight * 0.52,
      -0.45 + sway,
      flower.radius * 1.25,
      flower.radius * 0.3
    );

    GardenBotany.drawBotanicalLeaf(
      ctx,
      baseX + 1,
      baseY + flower.stemHeight * 0.72,
      Math.PI + 0.4 + sway,
      flower.radius * 1.05,
      flower.radius * 0.28
    );

    ctx.restore();
  }

  function drawFlower(flower, time) {
    const sway = reducedMotion.matches
      ? 0
      : Math.sin(time * flower.speed + flower.phase) * flower.sway;

    const centerX = flower.x + sway * 20;
    const centerY = flower.y;

    drawStem(flower, sway);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(sway * 0.4);

    const scale = flower.scale;
    const size = flower.sprite.logicalSize;
    const offset = size / 2;

    ctx.globalAlpha = Math.min(1, scale);

    ctx.drawImage(
      flower.sprite.baseCanvas,
      -offset, -offset, size, size
    );

    for (const petalLayer of flower.sprite.whorlCanvases) {
      ctx.drawImage(
        petalLayer,
        -offset, -offset, size, size
      );
    }

    if (flower.index === selectedFlower) {
      ctx.beginPath();
      ctx.arc(0, 0, flower.radius * 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 220, 238, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawScene(time) {
    drawBackground();

    flowers
      .slice()
      .sort((a, b) => a.y - b.y)
      .forEach(flower => drawFlower(flower, time));
  }

  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;

    const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    windTime += delta;

    flowers.forEach(flower => {
      flower.scale +=
        (flower.targetScale - flower.scale) *
        Math.min(1, delta * 3);
    });

    drawScene(windTime);

    animationId = requestAnimationFrame(animate);
  }

  function showNote(flower) {
    selectedFlower = flower.index;
    messageText.textContent = flower.note;
    messageBox.hidden = false;

    playSound(660);
    drawScene(windTime);
  }

  function hideNote() {
    messageBox.hidden = true;
    selectedFlower = -1;
    drawScene(windTime);
  }

  function handlePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let nearest = null;
    let nearestDistance = Infinity;

    flowers.forEach(flower => {
      const sway = reducedMotion.matches
        ? 0
        : Math.sin(windTime * flower.speed + flower.phase) *
          flower.sway;

      const dx = x - (flower.x + sway * 20);
      const dy = y - flower.y;
      const distance = Math.hypot(dx, dy);
      const hitRadius = flower.radius * 1.6 + 12;

      if (distance < hitRadius && distance < nearestDistance) {
        nearest = flower;
        nearestDistance = distance;
      }
    });

    if (nearest) {
      showNote(nearest);
    }
  }

  function playSound(frequency = 520) {
    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(
      frequency,
      audioContext.currentTime
    );

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.045,
      audioContext.currentTime + 0.02
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.22
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.23);
  }

  function toggleSound() {
    const enabled = soundButton.getAttribute('aria-pressed') !== 'true';

    soundButton.setAttribute('aria-pressed', String(enabled));
    soundButton.textContent = enabled ? '♫ Âm thanh bật' : '♫ Bật nhạc';

    if (enabled) {
      playSound(520);
    } else if (audioContext) {
      audioContext.suspend();
    }
  }

  canvas.addEventListener('click', handlePointer);
  closeButton.addEventListener('click', hideNote);
  soundButton.addEventListener('click', toggleSound);

  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();

  if (!reducedMotion.matches) {
    animationId = requestAnimationFrame(animate);
  }

  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(animationId);

    if (audioContext) {
      audioContext.close();
    }
  });
})();

