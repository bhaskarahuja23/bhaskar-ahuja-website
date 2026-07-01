(function () {
  const canvas = document.getElementById('site-background');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2;
  let width = 0;
  let height = 0;
  let frame = null;
  let tick = 0;
  let stars = [];
  let debris = [];
  let largeObjects = [];

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function colors(dark) {
    return dark
      ? {
          spaceTop: 'rgba(2, 8, 14, 0.74)',
          spaceBottom: 'rgba(5, 17, 25, 0.44)',
          earthCore: 'rgba(44, 175, 190, 0.86)',
          earthSea: 'rgba(16, 106, 136, 0.58)',
          earthLand: 'rgba(87, 207, 182, 0.56)',
          atmosphere: 'rgba(84, 206, 232, 0.72)',
          orbit: 'rgba(120, 217, 230, 0.34)',
          orbitSoft: 'rgba(120, 217, 230, 0.16)',
          debris: 'rgba(191, 225, 238, 0.72)',
          debrisDim: 'rgba(140, 177, 194, 0.38)',
          red: 'rgba(255, 74, 68, 0.82)',
          yellow: 'rgba(255, 218, 80, 0.82)',
          green: 'rgba(98, 224, 184, 0.76)',
          object: 'rgba(207, 221, 226, 0.78)',
          solar: 'rgba(68, 146, 190, 0.74)',
          glow: 'rgba(58, 210, 220, 0.2)'
        }
      : {
          spaceTop: 'rgba(214, 230, 235, 0.52)',
          spaceBottom: 'rgba(241, 238, 230, 0.26)',
          earthCore: 'rgba(56, 143, 166, 0.48)',
          earthSea: 'rgba(55, 122, 154, 0.32)',
          earthLand: 'rgba(47, 125, 114, 0.34)',
          atmosphere: 'rgba(38, 123, 146, 0.42)',
          orbit: 'rgba(39, 78, 103, 0.24)',
          orbitSoft: 'rgba(39, 78, 103, 0.11)',
          debris: 'rgba(39, 69, 88, 0.48)',
          debrisDim: 'rgba(77, 103, 116, 0.24)',
          red: 'rgba(181, 50, 42, 0.68)',
          yellow: 'rgba(180, 126, 24, 0.68)',
          green: 'rgba(35, 126, 110, 0.58)',
          object: 'rgba(63, 78, 86, 0.54)',
          solar: 'rgba(42, 93, 128, 0.5)',
          glow: 'rgba(47, 125, 114, 0.14)'
        };
  }

  function earth() {
    const small = width < 720;
    return {
      x: width * (small ? 0.68 : 0.62),
      y: height * (small ? 0.42 : 0.45),
      r: Math.min(width, height) * (small ? 0.17 : 0.14)
    };
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const starCount = Math.max(80, Math.min(180, Math.floor((width * height) / 9000)));
    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: rand(0.45, 1.3),
      phase: Math.random() * TAU,
      twinkle: rand(0.004, 0.012)
    }));

    const debrisCount = Math.max(width < 720 ? 430 : 900, Math.min(width < 720 ? 720 : 1500, Math.floor((width * height) / 950)));
    debris = Array.from({ length: debrisCount }, (_, index) => {
      const band = Math.random();
      const colored = Math.random() > 0.965;
      return {
        x: Math.random() * width,
        band,
        offset: rand(-1, 1),
        depth: Math.random(),
        speed: rand(0.04, 0.18) * (Math.random() > 0.5 ? 1 : -1),
        size: rand(0.45, 1.65) * (band > 0.78 ? 1.35 : 1),
        phase: Math.random() * TAU,
        color: colored ? (index % 3 === 0 ? 'red' : index % 3 === 1 ? 'yellow' : 'green') : ''
      };
    });

    largeObjects = Array.from({ length: width < 720 ? 7 : 13 }, (_, index) => ({
      x: Math.random() * width,
      band: Math.random(),
      offset: rand(-1, 1),
      speed: rand(0.035, 0.09) * (index % 2 ? -1 : 1),
      size: rand(4, 9),
      spin: rand(-0.012, 0.014),
      angle: Math.random() * TAU,
      type: index % 3
    }));
  }

  function beltY(x, band, offset) {
    const diagonal = (x / Math.max(width, 1) - 0.5) * height * 0.2;
    const center = height * 0.48 + diagonal;
    const spread = height * (width < 720 ? 0.25 : 0.34);
    return center + (band - 0.5) * spread + offset * height * 0.035;
  }

  function drawSpace(c) {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, c.spaceTop);
    bg.addColorStop(0.52, 'rgba(0,0,0,0)');
    bg.addColorStop(1, c.spaceBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    stars.forEach((star) => {
      const alpha = 0.35 + Math.sin(tick * star.twinkle + star.phase) * 0.25;
      ctx.fillStyle = c.debrisDim.replace(/[\d.]+\)$/u, `${Math.max(0.06, alpha * 0.38)})`);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, TAU);
      ctx.fill();
    });
  }

  function drawEarth(c, e) {
    const halo = ctx.createRadialGradient(e.x, e.y, e.r * 0.95, e.x, e.y, e.r * 2.2);
    halo.addColorStop(0, c.glow);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * 2.2, 0, TAU);
    ctx.fill();

    const sphere = ctx.createRadialGradient(e.x - e.r * 0.34, e.y - e.r * 0.38, e.r * 0.1, e.x, e.y, e.r);
    sphere.addColorStop(0, c.earthCore);
    sphere.addColorStop(0.64, c.earthSea);
    sphere.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.fillStyle = sphere;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * 0.98, 0, TAU);
    ctx.clip();
    ctx.fillStyle = c.earthLand;
    const drift = Math.sin(tick * 0.002) * e.r * 0.08;
    [
      [-0.38, -0.2, 0.24, 0.15, -0.2],
      [-0.12, 0.1, 0.18, 0.24, 0.35],
      [0.22, -0.24, 0.2, 0.16, 0.18],
      [0.35, 0.12, 0.14, 0.22, -0.28],
      [-0.02, -0.35, 0.12, 0.08, 0.08]
    ].forEach(([x, y, rx, ry, rot]) => {
      ctx.beginPath();
      ctx.ellipse(e.x + x * e.r + drift, e.y + y * e.r, rx * e.r, ry * e.r, rot, 0, TAU);
      ctx.fill();
    });
    ctx.restore();

    ctx.strokeStyle = c.atmosphere;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * 1.02, 0, TAU);
    ctx.stroke();
  }

  function drawOrbitShells(c, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    [-0.32, -0.14, 0.08, 0.27].forEach((tilt, index) => {
      ctx.rotate(tilt);
      ctx.strokeStyle = index % 2 ? c.orbitSoft : c.orbit;
      ctx.lineWidth = index % 2 ? 1 : 1.35;
      ctx.setLineDash(index % 2 ? [8, 12] : []);
      ctx.beginPath();
      ctx.ellipse(0, 0, e.r * (2.4 + index * 0.55), e.r * (0.56 + index * 0.14), 0, 0, TAU);
      ctx.stroke();
      ctx.rotate(-tilt);
    });
    ctx.restore();
    ctx.setLineDash([]);
  }

  function drawDebris(c, e) {
    debris.forEach((point) => {
      point.x += point.speed;
      if (point.x < -20) point.x = width + 20;
      if (point.x > width + 20) point.x = -20;
      const y = beltY(point.x, point.band, point.offset) + Math.sin(tick * 0.004 + point.phase) * 5;
      const dx = point.x - e.x;
      const dy = y - e.y;
      const nearEarth = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (e.r * 3.2));
      const alpha = 0.26 + point.depth * 0.52 + nearEarth * 0.18;
      const fill = point.color ? c[point.color] : (point.depth > 0.58 ? c.debris : c.debrisDim);
      ctx.fillStyle = fill.replace(/[\d.]+\)$/u, `${Math.min(0.88, alpha)})`);
      ctx.beginPath();
      ctx.arc(point.x, y, point.size, 0, TAU);
      ctx.fill();
    });
  }

  function drawLargeObject(c, object) {
    const y = beltY(object.x, object.band, object.offset);
    object.x += object.speed;
    object.angle += object.spin;
    if (object.x < -60) object.x = width + 60;
    if (object.x > width + 60) object.x = -60;

    ctx.save();
    ctx.translate(object.x, y);
    ctx.rotate(object.angle);
    ctx.strokeStyle = c.object;
    ctx.fillStyle = c.object;
    ctx.lineWidth = 1;
    if (object.type === 0) {
      ctx.fillRect(-object.size * 0.45, -object.size * 0.35, object.size * 0.9, object.size * 0.7);
      ctx.strokeStyle = c.solar;
      ctx.strokeRect(-object.size * 2.1, -object.size * 0.45, object.size * 1.2, object.size * 0.9);
      ctx.strokeRect(object.size * 0.9, -object.size * 0.45, object.size * 1.2, object.size * 0.9);
    } else if (object.type === 1) {
      ctx.beginPath();
      ctx.moveTo(-object.size, -object.size * 0.6);
      ctx.lineTo(object.size * 0.9, -object.size * 0.2);
      ctx.lineTo(object.size * 0.45, object.size * 0.85);
      ctx.lineTo(-object.size * 0.75, object.size * 0.5);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, object.size * 0.7, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-object.size * 1.3, 0);
      ctx.lineTo(object.size * 1.3, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTracking(c, e) {
    const sweep = (tick * 0.006) % TAU;
    ctx.strokeStyle = c.green.replace(/[\d.]+\)$/u, '0.28)');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * 1.72, sweep - 0.5, sweep + 0.28);
    ctx.stroke();

    ctx.strokeStyle = c.green.replace(/[\d.]+\)$/u, '0.2)');
    ctx.beginPath();
    ctx.moveTo(e.x - e.r * 0.1, e.y + e.r * 0.75);
    ctx.quadraticCurveTo(e.x + e.r * 1.2, e.y - e.r * 1.15, e.x + e.r * 2.6, e.y - e.r * 0.55);
    ctx.stroke();
  }

  function draw() {
    const c = colors(isDark());
    const e = earth();
    ctx.clearRect(0, 0, width, height);
    drawSpace(c);
    drawOrbitShells(c, e);
    drawDebris(c, e);
    largeObjects.forEach((object) => drawLargeObject(c, object));
    drawEarth(c, e);
    drawTracking(c, e);
    tick += 1;
    frame = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    resize();
    draw();
  });
})();
