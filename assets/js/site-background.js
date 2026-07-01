(function () {
  const canvas = document.getElementById('site-background');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let frame = null;
  let tick = 0;
  let network = [];
  let targets = [];
  let returns = [];

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function wrapAngle(angle) {
    const full = Math.PI * 2;
    return ((angle % full) + full) % full;
  }

  function angleDifference(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
  }

  function makeTargets() {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const radius = Math.min(width, height) * 0.42;
    const specs = [
      [0.17, 0.42, 0.92],
      [0.36, 0.62, 0.72],
      [0.58, 0.48, 0.82],
      [0.73, 0.70, 0.58],
      [0.84, 0.34, 0.66],
      [0.08, 0.72, 0.5]
    ];

    targets = specs.map(([turn, distance, strength], index) => {
      const angle = turn * Math.PI * 2;
      const range = radius * distance;
      return {
        id: index,
        angle,
        range,
        x: cx + Math.cos(angle) * range,
        y: cy + Math.sin(angle) * range,
        strength,
        lastHit: -1000
      };
    });
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(22, Math.min(48, Math.floor((width * height) / 34000)));
    network = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      r: 0.8 + Math.random() * 1
    }));
    returns = [];
    makeTargets();
  }

  function drawRadar(cx, cy, radius, dark) {
    const green = dark ? '72, 221, 143' : '31, 112, 86';
    const blue = dark ? '86, 172, 218' : '55, 88, 108';
    const sweep = wrapAngle(tick * 0.014 - Math.PI / 2);

    ctx.save();
    ctx.translate(cx, cy);

    const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    fade.addColorStop(0, `rgba(${green}, ${dark ? 0.035 : 0.026})`);
    fade.addColorStop(0.7, `rgba(${green}, ${dark ? 0.018 : 0.012})`);
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 1; i <= 5; i += 1) {
      ctx.strokeStyle = `rgba(${green}, ${dark ? 0.15 : 0.09})`;
      ctx.lineWidth = i === 5 ? 1.3 : 1;
      ctx.beginPath();
      ctx.arc(0, 0, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      ctx.strokeStyle = `rgba(${blue}, ${dark ? 0.11 : 0.065})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      ctx.stroke();
    }

    const beamWidth = 0.22;
    const beam = ctx.createConicGradient(sweep - beamWidth, 0, 0);
    beam.addColorStop(0, 'rgba(0,0,0,0)');
    beam.addColorStop(0.018, `rgba(${green}, ${dark ? 0.04 : 0.03})`);
    beam.addColorStop(0.045, `rgba(${green}, ${dark ? 0.28 : 0.16})`);
    beam.addColorStop(0.09, 'rgba(0,0,0,0)');
    beam.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(${green}, ${dark ? 0.52 : 0.35})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweep) * radius, Math.sin(sweep) * radius);
    ctx.stroke();

    targets.forEach((target) => {
      const diff = Math.abs(angleDifference(sweep, target.angle));
      if (diff < 0.018 && tick - target.lastHit > 18) {
        target.lastHit = tick;
        returns.push({
          x: target.x,
          y: target.y,
          angle: target.angle,
          range: target.range,
          strength: target.strength,
          born: tick
        });
      }
    });

    ctx.fillStyle = `rgba(${green}, ${dark ? 0.72 : 0.52})`;
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTargets(dark) {
    const green = dark ? '72, 221, 143' : '31, 112, 86';
    const warm = dark ? '255, 197, 94' : '181, 94, 38';

    targets.forEach((target) => {
      const age = tick - target.lastHit;
      const hit = Math.max(0, 1 - age / 46);
      const baseAlpha = dark ? 0.2 : 0.14;
      const radius = 2.2 + target.strength * 2.8 + hit * 7;

      ctx.strokeStyle = `rgba(${warm}, ${hit * 0.55})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius + 8 * hit, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(${hit > 0 ? warm : green}, ${baseAlpha + hit * 0.72})`;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawReturns(cx, cy, dark) {
    const warm = dark ? '255, 197, 94' : '181, 94, 38';
    const green = dark ? '72, 221, 143' : '31, 112, 86';
    returns = returns.filter((signal) => tick - signal.born < 80);

    returns.forEach((signal) => {
      const age = tick - signal.born;
      const life = 1 - age / 80;
      const travel = Math.sin(Math.min(age / 24, 1) * Math.PI);
      const echoRange = signal.range * (1 - 0.28 * travel);
      const x = cx + Math.cos(signal.angle) * echoRange;
      const y = cy + Math.sin(signal.angle) * echoRange;

      ctx.strokeStyle = `rgba(${warm}, ${life * 0.5 * signal.strength})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, signal.range + age * 0.55, signal.angle - 0.045, signal.angle + 0.045);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${green}, ${life * 0.34 * signal.strength})`;
      ctx.beginPath();
      ctx.moveTo(signal.x, signal.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    });
  }

  function drawNetwork(dark) {
    const dot = dark ? '180, 202, 214' : '79, 100, 115';
    const line = dark ? '143, 168, 182' : '79, 100, 115';

    network.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < -10) point.x = width + 10;
      if (point.x > width + 10) point.x = -10;
      if (point.y < -10) point.y = height + 10;
      if (point.y > height + 10) point.y = -10;
    });

    for (let i = 0; i < network.length; i += 1) {
      for (let j = i + 1; j < network.length; j += 1) {
        const a = network[i];
        const b = network[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 112) {
          ctx.strokeStyle = `rgba(${line}, ${(1 - distance / 112) * (dark ? 0.1 : 0.055)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    network.forEach((point) => {
      ctx.fillStyle = `rgba(${dot}, ${dark ? 0.15 : 0.08})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const dark = isDark();
    const cx = width * 0.5;
    const cy = height * 0.5;
    const radius = Math.min(width, height) * 0.42;
    drawRadar(cx, cy, radius, dark);
    drawReturns(cx, cy, dark);
    drawTargets(dark);
    drawNetwork(dark);
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
