(function () {
  const canvas = document.getElementById('site-background');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let tick = 0;
  let frame = null;
  let orbiters = [];
  let stars = [];
  let sensorPulses = [];

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function palette(dark) {
    return dark
      ? {
          space: 'rgba(9, 16, 22, 0.38)',
          earthA: 'rgba(39, 118, 142, 0.34)',
          earthB: 'rgba(21, 76, 92, 0.24)',
          limb: 'rgba(107, 211, 224, 0.42)',
          orbit: 'rgba(143, 209, 226, 0.18)',
          orbitStrong: 'rgba(143, 209, 226, 0.34)',
          debris: 'rgba(204, 221, 229, 0.46)',
          satellite: 'rgba(255, 198, 104, 0.72)',
          track: 'rgba(98, 198, 184, 0.45)',
          star: 'rgba(210, 226, 234, 0.18)'
        }
      : {
          space: 'rgba(218, 229, 232, 0.34)',
          earthA: 'rgba(112, 171, 184, 0.26)',
          earthB: 'rgba(70, 126, 142, 0.16)',
          limb: 'rgba(47, 125, 114, 0.27)',
          orbit: 'rgba(40, 72, 95, 0.12)',
          orbitStrong: 'rgba(40, 72, 95, 0.22)',
          debris: 'rgba(47, 77, 94, 0.34)',
          satellite: 'rgba(181, 94, 38, 0.54)',
          track: 'rgba(47, 125, 114, 0.32)',
          star: 'rgba(65, 86, 101, 0.12)'
        };
  }

  function earthGeometry() {
    const mobile = width < 720;
    const radius = Math.max(width, height) * (mobile ? 0.54 : 0.48);
    return {
      x: width * (mobile ? 0.72 : 0.83),
      y: height * (mobile ? 1.04 : 1.02),
      radius
    };
  }

  function makeStars() {
    const count = Math.max(42, Math.min(96, Math.floor((width * height) / 17000)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.45 + Math.random() * 1.15,
      phase: Math.random() * TAU,
      drift: 0.006 + Math.random() * 0.012
    }));
  }

  function makeOrbiters() {
    const mobile = width < 720;
    const bands = mobile
      ? [
          [0.62, 0.20, -0.45],
          [0.78, -0.13, -0.18],
          [0.96, 0.16, 0.12],
          [1.15, -0.10, 0.35]
        ]
      : [
          [0.58, 0.20, -0.52],
          [0.74, -0.15, -0.25],
          [0.90, 0.10, 0.02],
          [1.08, -0.18, 0.26],
          [1.28, 0.14, 0.46]
        ];

    orbiters = bands.flatMap(([scale, tilt, phase], bandIndex) => {
      const debrisCount = bandIndex === 0 ? 5 : 7;
      return Array.from({ length: debrisCount }, (_, i) => {
        const satellite = i === Math.floor(debrisCount / 2) && bandIndex % 2 === 0;
        return {
          bandIndex,
          scale,
          tilt,
          phase: phase + (i / debrisCount) * TAU + Math.random() * 0.25,
          speed: (satellite ? 0.0048 : 0.0028 + Math.random() * 0.0022) * (bandIndex % 2 ? -1 : 1),
          size: satellite ? 3.2 : 1.2 + Math.random() * 1.5,
          satellite,
          pulseOffset: Math.random() * 120
        };
      });
    });
  }

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    sensorPulses = [];
    makeStars();
    makeOrbiters();
  }

  function drawBackground(colors) {
    const wash = ctx.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, colors.space);
    wash.addColorStop(0.55, 'rgba(0,0,0,0)');
    wash.addColorStop(1, colors.space);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    stars.forEach((star) => {
      const alpha = 0.45 + Math.sin(tick * star.drift + star.phase) * 0.35;
      ctx.fillStyle = colors.star.replace(/[\d.]+\)$/u, `${Math.max(0.04, alpha * 0.2)})`);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, TAU);
      ctx.fill();
    });
  }

  function drawEarth(earth, colors) {
    const glow = ctx.createRadialGradient(
      earth.x - earth.radius * 0.28,
      earth.y - earth.radius * 0.42,
      earth.radius * 0.08,
      earth.x,
      earth.y,
      earth.radius
    );
    glow.addColorStop(0, colors.earthA);
    glow.addColorStop(0.62, colors.earthB);
    glow.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, earth.radius, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = colors.limb;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, earth.radius * 0.96, Math.PI * 1.06, Math.PI * 1.78);
    ctx.stroke();

    ctx.strokeStyle = colors.limb.replace(/[\d.]+\)$/u, '0.12)');
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      const y = earth.y - earth.radius * (0.58 - i * 0.18);
      ctx.beginPath();
      ctx.ellipse(earth.x, y, earth.radius * (0.52 + i * 0.08), earth.radius * 0.08, -0.18, Math.PI, TAU);
      ctx.stroke();
    }
  }

  function orbitPoint(earth, orbiter) {
    const base = earth.radius * orbiter.scale;
    const angle = orbiter.phase + tick * orbiter.speed;
    const rx = base;
    const ry = base * (0.28 + Math.abs(orbiter.tilt) * 0.42);
    const cos = Math.cos(orbiter.tilt);
    const sin = Math.sin(orbiter.tilt);
    const px = Math.cos(angle) * rx;
    const py = Math.sin(angle) * ry - earth.radius * 0.36;
    return {
      x: earth.x + px * cos - py * sin,
      y: earth.y + px * sin + py * cos,
      angle,
      front: Math.sin(angle) < 0.52
    };
  }

  function drawOrbits(earth, colors) {
    const drawn = new Set();
    orbiters.forEach((orbiter) => {
      if (drawn.has(orbiter.bandIndex)) return;
      drawn.add(orbiter.bandIndex);

      const base = earth.radius * orbiter.scale;
      const ry = base * (0.28 + Math.abs(orbiter.tilt) * 0.42);
      ctx.save();
      ctx.translate(earth.x, earth.y - earth.radius * 0.36);
      ctx.rotate(orbiter.tilt);
      ctx.strokeStyle = orbiter.bandIndex % 2 ? colors.orbit : colors.orbitStrong;
      ctx.lineWidth = orbiter.bandIndex % 2 ? 0.9 : 1.15;
      ctx.setLineDash(orbiter.bandIndex % 2 ? [7, 10] : [1, 0]);
      ctx.beginPath();
      ctx.ellipse(0, 0, base, ry, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    });
    ctx.setLineDash([]);
  }

  function drawSatellite(x, y, size, colors) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(tick * 0.018) * 0.35);
    ctx.strokeStyle = colors.satellite;
    ctx.fillStyle = colors.satellite;
    ctx.lineWidth = 1;
    ctx.fillRect(-size * 0.55, -size * 0.38, size * 1.1, size * 0.76);
    ctx.strokeRect(-size * 2.1, -size * 0.42, size * 1.1, size * 0.84);
    ctx.strokeRect(size, -size * 0.42, size * 1.1, size * 0.84);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.45);
    ctx.lineTo(0, size * 1.35);
    ctx.stroke();
    ctx.restore();
  }

  function drawOrbiters(earth, colors) {
    const sensor = {
      x: earth.x - earth.radius * 0.34,
      y: earth.y - earth.radius * 0.93
    };

    orbiters.forEach((orbiter) => {
      const point = orbitPoint(earth, orbiter);
      const visible = point.x > -40 && point.x < width + 40 && point.y > -40 && point.y < height + 40;
      if (!visible) return;

      const alpha = point.front ? 1 : 0.42;
      if (orbiter.satellite) {
        drawSatellite(point.x, point.y, orbiter.size, {
          ...colors,
          satellite: colors.satellite.replace(/[\d.]+\)$/u, `${alpha * 0.78})`)
        });
      } else {
        ctx.fillStyle = colors.debris.replace(/[\d.]+\)$/u, `${alpha * 0.55})`);
        ctx.beginPath();
        ctx.arc(point.x, point.y, orbiter.size, 0, TAU);
        ctx.fill();
      }

      if (orbiter.satellite && (tick + orbiter.pulseOffset) % 190 < 1) {
        sensorPulses.push({ x: point.x, y: point.y, born: tick, sensor });
      }
    });
  }

  function drawTracking(colors) {
    sensorPulses = sensorPulses.filter((pulse) => tick - pulse.born < 105);
    sensorPulses.forEach((pulse) => {
      const age = tick - pulse.born;
      const life = 1 - age / 105;
      const travel = Math.min(age / 36, 1);
      const x = pulse.sensor.x + (pulse.x - pulse.sensor.x) * travel;
      const y = pulse.sensor.y + (pulse.y - pulse.sensor.y) * travel;

      ctx.strokeStyle = colors.track.replace(/[\d.]+\)$/u, `${life * 0.38})`);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(pulse.sensor.x, pulse.sensor.y);
      ctx.quadraticCurveTo((pulse.sensor.x + pulse.x) / 2, pulse.y - 80, x, y);
      ctx.stroke();

      ctx.fillStyle = colors.track.replace(/[\d.]+\)$/u, `${life * 0.6})`);
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, TAU);
      ctx.fill();
    });
  }

  function draw() {
    const dark = isDark();
    const colors = palette(dark);
    const earth = earthGeometry();
    ctx.clearRect(0, 0, width, height);
    drawBackground(colors);
    drawOrbits(earth, colors);
    drawTracking(colors);
    drawOrbiters(earth, colors);
    drawEarth(earth, colors);
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
