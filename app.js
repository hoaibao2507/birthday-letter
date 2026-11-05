(() => {
'use strict';

/* =====================================================================
   Tiện ích & nội dung
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const CFG = window.LETTER;
const qs = new URLSearchParams(location.search);
const TO = (qs.get('to') || CFG.to).trim();
const FROM = (qs.get('from') || CFG.from).trim();
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sub = (s) => String(s).replace(/\{to\}/g, TO).replace(/\{from\}/g, FROM).replace(/\{date\}/g, CFG.date);

const HEART_D = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const HEART = new Path2D(HEART_D);

/* =====================================================================
   Bầu trời đêm (nền)
   ===================================================================== */
const Sky = (() => {
  const cv = $('#sky'), c = cv.getContext('2d');
  let W = 0, H = 0, stars = [], bokeh = [], shoots = [], last = 0, nextShoot = 2500, started = false;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = clamp(Math.round(W * H / 5200), 60, 190);
    stars = Array.from({ length: n }, () => ({ x: rnd(0, W), y: rnd(0, H * .85), r: rnd(.4, 1.5), ph: rnd(0, 6.28), sp: rnd(.6, 2.2) }));
    bokeh = Array.from({ length: 9 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(50, 120), vx: rnd(-.08, .08), vy: rnd(-.07, -.015), col: pick(['120,170,255', '255,150,190', '255,220,150']), a: rnd(.04, .09) }));
  }
  function shoot() { shoots.push({ x: rnd(.3, 1) * W, y: rnd(0, .3) * H, vx: -rnd(7, 11), vy: rnd(3.5, 6), life: 0 }); }
  function draw(ts, dt) {
    c.clearRect(0, 0, W, H);
    for (const b of bokeh) {
      b.x += b.vx * dt * .06; b.y += b.vy * dt * .06;
      if (b.y < -b.r) { b.y = H + b.r; b.x = rnd(0, W); }
      const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, `rgba(${b.col},${b.a})`); g.addColorStop(1, `rgba(${b.col},0)`);
      c.fillStyle = g; c.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    c.fillStyle = '#fff';
    for (const s of stars) {
      c.globalAlpha = .35 + .65 * Math.abs(Math.sin(ts / 1000 * s.sp + s.ph));
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.2832); c.fill();
    }
    c.globalAlpha = 1;
    nextShoot -= dt;
    if (nextShoot <= 0 && !reduce) { shoot(); nextShoot = rnd(5000, 10000); }
    for (let i = shoots.length - 1; i >= 0; i--) {
      const s = shoots[i]; s.x += s.vx; s.y += s.vy; s.life++;
      const a = 1 - s.life / 55;
      if (a <= 0) { shoots.splice(i, 1); continue; }
      const g = c.createLinearGradient(s.x, s.y, s.x - s.vx * 9, s.y - s.vy * 9);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.strokeStyle = g; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * 9, s.y - s.vy * 9); c.stroke();
    }
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    if (ts - last < 33) return;
    const dt = Math.min(100, ts - last); last = ts; draw(ts, dt);
  }
  function start() { if (started) return; started = true; resize(); addEventListener('resize', resize); requestAnimationFrame(frame); }
  return { start, shoot, shootMany(n) { for (let i = 0; i < n; i++) setTimeout(shoot, i * 450); } };
})();

/* =====================================================================
   Hiệu ứng hạt (pháo hoa, confetti, tim, trái tim lớn)
   ===================================================================== */
const FX = (() => {
  const cv = $('#fx'), c = cv.getContext('2d');
  let W = 0, H = 0, raf = 0, last = 0;
  const P = [];
  const MAX = 850;
  const PALETTE = ['#ff7a9c', '#ffd166', '#7fd1ff', '#ffffff', '#c9a7ff', '#ff5c7a', '#9be7b5', '#f4a3bb'];
  const cloud = { on: false, pts: [], t0: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (cloud.on) buildCloud(true);
  }
  addEventListener('resize', resize); resize();

  function add(p) { if (P.length < MAX) P.push(p); kick(); }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  function heartPath(x, y, s, rot, color, a) {
    c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot); c.scale(s / 20, s / 20); c.translate(-12, -12.175);
    c.fillStyle = color; c.fill(HEART); c.restore();
  }
  function sparkleShape(x, y, r, color, a) {
    c.save(); c.globalAlpha = a; c.translate(x, y); c.fillStyle = color; c.beginPath();
    c.moveTo(0, -r); c.quadraticCurveTo(r * .14, -r * .14, r, 0); c.quadraticCurveTo(r * .14, r * .14, 0, r);
    c.quadraticCurveTo(-r * .14, r * .14, -r, 0); c.quadraticCurveTo(-r * .14, -r * .14, 0, -r); c.fill(); c.restore();
  }

  /* --- cập nhật + vẽ từng loại hạt --- */
  function step(p, d) {
    switch (p.t) {
      case 'confetti':
        p.vy += p.g * d; p.vx *= Math.pow(.992, d); p.x += p.vx * d; p.y += p.vy * d; p.rot += p.vr * d; p.fl += .18 * d; p.life -= d;
        return p.life > 0 && p.y < H + 40;
      case 'heart':
        p.y += p.vy * d; p.ph += .04 * d; p.x += Math.sin(p.ph) * p.sw * d; p.rot = Math.sin(p.ph) * .35; p.life -= d;
        return p.life > 0 && p.y > -40 && p.y < H + 60;
      case 'spark':
        p.vx *= Math.pow(p.fr, d); p.vy = p.vy * Math.pow(p.fr, d) + p.g * d; p.x += p.vx * d; p.y += p.vy * d; p.life -= d;
        return p.life > 0;
      case 'star':
        p.life -= d; return p.life > 0;
      case 'rocket':
        p.x += p.vx * d; p.y += p.vy * d; p.vy += .018 * d; p.life -= d;
        if (!reduce && Math.random() < .8) P.push({ t: 'spark', x: p.x, y: p.y, vx: rnd(-.2, .2), vy: rnd(0, .6), g: .01, fr: .95, r: 1.3, life: 22, max: 22, color: '#ffe9b0' });
        if (p.y <= p.ty || p.vy > -1.2) { burst(p.x, p.y, p.color); return false; }
        return true;
    }
    return false;
  }
  function draw(p) {
    switch (p.t) {
      case 'confetti':
        c.save(); c.globalAlpha = clamp(p.life / 28, 0, 1); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(Math.cos(p.fl), 1);
        c.fillStyle = p.color; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); break;
      case 'heart':
        heartPath(p.x, p.y, p.size, p.rot, p.color, clamp(Math.min(p.life / 30, (p.max - p.life) / 20), 0, 1) * p.alpha); break;
      case 'spark':
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(p.life / p.max, 0, 1);
        c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.2832); c.fill();
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; break;
      case 'star':
        sparkleShape(p.x, p.y, p.r * Math.sin(Math.PI * (1 - p.life / p.max)), p.color, .95); break;
      case 'rocket':
        c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(p.x, p.y, 2.2, 0, 6.2832); c.fill(); break;
    }
  }

  function tick(ts) {
    const d = Math.min(2.5, (ts - last) / 16.667 || 1); last = ts;
    c.clearRect(0, 0, W, H);
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      if (step(p, d)) draw(p); else { P.splice(i, 1); i--; }
    }
    if (cloud.on) drawCloud(ts);
    raf = (P.length || cloud.on) ? requestAnimationFrame(tick) : 0;
    if (!raf) c.clearRect(0, 0, W, H);
  }

  /* --- các hiệu ứng dựng sẵn --- */
  function burst(x, y, color) {
    const n = reduce ? 28 : 64, col = color || pick(PALETTE);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832 + rnd(-.05, .05), sp = rnd(1.4, 5.2) * (i % 2 ? 1 : .62);
      add({ t: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: .045, fr: .972, r: rnd(1.1, 2.4), life: rnd(55, 90), max: 90, color: i % 5 === 0 ? '#fff' : col });
    }
    for (let i = 0; i < 4; i++) add({ t: 'heart', x, y, vy: rnd(-.7, -.2), sw: .25, ph: rnd(0, 6), size: rnd(10, 16), color: '#ff7a9c', life: 70, max: 70, alpha: .9, rot: 0 });
    Snd.boom();
  }
  function rocket(x) {
    add({ t: 'rocket', x, y: H + 10, vx: rnd(-.4, .4), vy: -rnd(8.5, 10.5), ty: rnd(H * .12, H * .42), life: 200, color: pick(PALETTE) });
  }
  function fireworks(n = 4, gap = 420) { for (let i = 0; i < n; i++) setTimeout(() => rocket(rnd(.15, .85) * W), i * gap); }
  function confetti(x, y, n = 90, spread = 1) {
    n = reduce ? Math.round(n / 3) : n;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + rnd(-.9, .9) * spread, sp = rnd(5, 13);
      add({ t: 'confetti', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: .22, rot: rnd(0, 6), vr: rnd(-.3, .3), fl: rnd(0, 6), w: rnd(6, 11), h: rnd(4, 7), color: pick(PALETTE.concat(['#f0b43c', '#4b86c9'])), life: rnd(90, 150) });
    }
  }
  function confettiRain(ms = 2200) {
    const end = performance.now() + ms;
    (function loop() {
      if (performance.now() > end) return;
      for (let i = 0; i < 4; i++) add({ t: 'confetti', x: rnd(0, W), y: -10, vx: rnd(-1, 1), vy: rnd(1.5, 3), g: .02, rot: rnd(0, 6), vr: rnd(-.2, .2), fl: rnd(0, 6), w: rnd(6, 10), h: rnd(4, 7), color: pick(PALETTE.concat(['#f0b43c'])), life: 400 });
      setTimeout(loop, 90);
    })();
  }
  function hearts(x, y, n = 6, colors) {
    for (let i = 0; i < n; i++) add({ t: 'heart', x: x + rnd(-10, 10), y: y + rnd(-6, 6), vy: -rnd(1, 2.6), sw: rnd(.2, .7), ph: rnd(0, 6), size: rnd(10, 22), color: pick(colors || ['#ff5c7a', '#ff8fa3', '#f4a3bb', '#ffd1dc']), life: rnd(60, 100), max: 100, alpha: .95, rot: 0 });
  }
  function floatHearts(ms = 5000, colors) {
    if (reduce) { hearts(W / 2, H * .7, 6, colors); return; }
    const end = performance.now() + ms;
    (function loop() {
      if (performance.now() > end) return;
      add({ t: 'heart', x: rnd(0, W), y: H + 20, vy: -rnd(.9, 2.1), sw: rnd(.25, .8), ph: rnd(0, 6), size: rnd(12, 30), color: pick(colors || ['#ff5c7a', '#ff8fa3', '#f4a3bb', '#ffd1dc', '#fff']), life: 520, max: 520, alpha: .8, rot: 0 });
      setTimeout(loop, 170);
    })();
  }
  function heartRain(ms = 5000) {
    if (reduce) { hearts(W / 2, H * .3, 8); return; }
    const end = performance.now() + ms;
    (function loop() {
      if (performance.now() > end) return;
      add({ t: 'heart', x: rnd(0, W), y: -20, vy: rnd(1.4, 3), sw: rnd(.2, .6), ph: rnd(0, 6), size: rnd(12, 26), color: pick(['#ff5c7a', '#ff8fa3', '#f4a3bb', '#e0243b']), life: 420, max: 420, alpha: .85, rot: 0 });
      setTimeout(loop, 130);
    })();
  }
  function stars(n = 14, region) {
    const r = region || { x: 0, y: 0, w: W, h: H };
    for (let i = 0; i < n; i++) setTimeout(() => add({ t: 'star', x: r.x + rnd(0, r.w), y: r.y + rnd(0, r.h), r: rnd(8, 20), life: 50, max: 50, color: pick(['#fff', '#ffe9a8', '#cfe0ff']) }), i * 110);
  }
  function sparkle(x, y) {
    add({ t: 'star', x: x + rnd(-6, 6), y: y + rnd(-6, 6), r: rnd(5, 10), life: 28, max: 28, color: pick(['#fff', '#ffe9a8', '#ffc2d1']) });
  }

  /* --- trái tim khổng lồ ghép từ hạt --- */
  const sprites = {};
  function sprite(color) {
    if (sprites[color]) return sprites[color];
    const s = document.createElement('canvas'); s.width = s.height = 32;
    const g = s.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, color); gr.addColorStop(.35, color); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    return (sprites[color] = s);
  }
  function buildCloud(keepTime) {
    const n = (H < 620 ? 430 : 640) * (reduce ? .6 : 1);
    const cx = W / 2, cy = H * .33, k = Math.min(W * .9, H * .46) / 34;
    cloud.cx = cx; cloud.cy = cy;
    cloud.pts = Array.from({ length: Math.round(n) }, (_, i) => {
      const t = rnd(0, 6.2832), edge = i % 3 === 0, r = edge ? 1 : Math.sqrt(Math.random()) * .96;
      const hx = 16 * Math.pow(Math.sin(t), 3), hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      return {
        tx: cx + hx * r * k, ty: cy + hy * r * k, sx: rnd(0, W), sy: H + rnd(20, 260),
        dl: rnd(0, 1300), sz: edge ? rnd(5, 8) : rnd(4, 7), ph: rnd(0, 6.28),
        col: edge ? '#ff6f93' : (Math.random() < .5 ? '#e8325a' : '#ff5c82'),
      };
    });
    if (!keepTime) cloud.t0 = performance.now();
  }
  function startCloud() { buildCloud(false); cloud.on = true; kick(); }
  function drawCloud(ts) {
    const t = ts - cloud.t0, beat = 1 + .04 * Math.sin(ts / 300) + .02 * Math.sin(ts / 130);
    c.globalCompositeOperation = 'lighter';
    for (const p of cloud.pts) {
      const e = clamp((t - p.dl) / 1900, 0, 1), ee = 1 - Math.pow(1 - e, 3);
      let x = p.sx + (p.tx - p.sx) * ee, y = p.sy + (p.ty - p.sy) * ee;
      if (e >= 1) { x = cloud.cx + (p.tx - cloud.cx) * beat + Math.sin(ts / 700 + p.ph) * 1.4; y = cloud.cy + (p.ty - cloud.cy) * beat + Math.cos(ts / 800 + p.ph) * 1.4; }
      c.globalAlpha = (.38 + .3 * Math.sin(ts / 260 + p.ph)) * (.4 + .6 * ee);
      const s = p.sz * 2.2;
      c.drawImage(sprite(p.col), x - s / 2, y - s / 2, s, s);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  return { burst, fireworks, confetti, confettiRain, hearts, floatHearts, heartRain, stars, sparkle, startCloud, get W() { return W; }, get H() { return H; } };
})();

/* =====================================================================
   Âm thanh: hộp nhạc "Happy Birthday" tổng hợp bằng WebAudio
   ===================================================================== */
const Snd = (() => {
  let ctx = null, master = null, wet = null, on = true;
  const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
  const SONG = [
    [N.G4, .75], [N.G4, .25], [N.A4, 1], [N.G4, 1], [N.C5, 1], [N.B4, 2],
    [N.G4, .75], [N.G4, .25], [N.A4, 1], [N.G4, 1], [N.D5, 1], [N.C5, 2],
    [N.G4, .75], [N.G4, .25], [N.G5, 1], [N.E5, 1], [N.C5, 1], [N.B4, 1], [N.A4, 2],
    [N.F5, .75], [N.F5, .25], [N.E5, 1], [N.C5, 1], [N.D5, 1], [N.C5, 2.5],
  ];
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? .7 : 0;
    const conv = ctx.createConvolver(), len = ctx.sampleRate * 1.8, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    conv.buffer = buf; wet = ctx.createGain(); wet.gain.value = .35;
    master.connect(ctx.destination); master.connect(conv); conv.connect(wet); wet.connect(ctx.destination);
  }
  function note(f, t, dur = 1.3, vol = .2, type = 'sine') {
    if (!ctx) return;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    g.connect(master);
    for (const [m, v, ty] of [[1, 1, type], [2, .28, 'sine'], [4, .08, 'sine']]) {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = ty; o.frequency.value = f * m; og.gain.value = v;
      o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .05);
    }
  }
  function song(vol = .2) {
    if (!ctx) return 0;
    const beat = .47; let t = ctx.currentTime + .05;
    for (const [f, d] of SONG) { note(f, t, 1.4, vol); t += d * beat; }
    return (t - ctx.currentTime) * 1000;
  }
  function chime() {
    if (!ctx) return; const t = ctx.currentTime;
    note(1318.5, t, .9, .07); note(1760, t + .09, 1, .06); note(2093, t + .18, 1.1, .045);
  }
  function pop() {
    if (!ctx) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(900, t + .09);
    g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .14);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + .16);
  }
  function noise(dur, freq, vol, type = 'lowpass') {
    if (!ctx) return; const t = ctx.currentTime, n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; f.type = type; f.frequency.value = freq; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const puff = () => noise(.5, 700, .35);
  const boom = () => { noise(.7, 160, .5); setTimeout(() => noise(.35, 5200, .06, 'highpass'), 120); };
  function toggle() {
    on = !on; if (master) master.gain.setTargetAtTime(on ? .7 : 0, ctx.currentTime, .05); return on;
  }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
  return { init, song, chime, pop, puff, boom, toggle, get on() { return on; } };
})();

/* =====================================================================
   Bóng bay
   ===================================================================== */
function balloonSVG(col) {
  return `<svg viewBox="0 0 60 120"><path d="M30 2C8 2 2 24 8 42c6 18 16 28 22 32 6-4 16-14 22-32C58 24 52 2 30 2z" fill="${col}"/>
<path d="M30 74l-5 8h10z" fill="${col}" style="filter:brightness(.8)"/><ellipse cx="19" cy="22" rx="5" ry="9" fill="#fff" opacity=".38" transform="rotate(20 19 22)"/>
<path d="M30 82q-7 9 0 18t0 18" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.4"/></svg>`;
}
function balloons(n = 8) {
  if (reduce) return;
  const root = $('#balloons'), cols = ['#ff7a9c', '#7fb2f5', '#ffd166', '#f4a3bb', '#9be7b5', '#c9a7ff', '#e0243b', '#fff0d6'];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div'); el.className = 'balloon';
    el.style.cssText = `left:${rnd(2, 88)}%;--s:${rnd(46, 78).toFixed(0)}px;--d:${rnd(10, 16).toFixed(1)}s;--dl:${(i * rnd(.25, .6)).toFixed(2)}s;--sw:${rnd(2.4, 4).toFixed(1)}s`;
    el.innerHTML = `<div>${balloonSVG(pick(cols))}</div>`;
    root.appendChild(el);
    el.addEventListener('animationend', (e) => { if (e.animationName === 'rise') el.remove(); });
  }
}

/* =====================================================================
   Dựng nội dung các trang
   ===================================================================== */
function lineHTML(text) {
  const s = esc(sub(text)); let wi = 0;
  const wordify = (seg) => seg.split(/(\s+)/).map((t) => {
    if (t === '' || /^\s+$/.test(t)) return t;
    const cls = t.includes('♥') ? 'w hrt' : 'w';
    return `<span class="${cls}" style="--w:${wi++}">${t}</span>`;
  }).join('');
  const html = s.split(/(\*[^*]+\*)/).map((seg) => (seg.length > 2 && seg.startsWith('*') && seg.endsWith('*')) ? `<mark>${wordify(seg.slice(1, -1))}</mark>` : wordify(seg)).join('');
  return { html, n: wi };
}
const mkLine = (t, cls = 'rv') => { const { html, n } = lineHTML(t); return `<p class="ln ${cls}" data-n="${n}">${html}</p>`; };
const mkRow = (t) => { const { html, n } = lineHTML(t); return `<p class="ln rs rv" data-n="${n}"><span class="txt">${html}</span></p>`; };

function bigHTML() {
  let c = 0;
  return ['Happy', 'Birthday'].map((w) => `<span class="row">${[...w].map((ch) => `<span class="ch" style="--c:${c++}">${ch}</span>`).join('')}</span>`).join('');
}
function cakeSVG() {
  const candles = [100, 130, 160];
  return `<svg class="cake-svg" viewBox="0 0 260 250" aria-label="Bánh sinh nhật">
<defs>
  <path id="hp" d="${HEART_D}"/>
  <pattern id="cs" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff"/><rect width="4" height="8" fill="#7fb2e8"/></pattern>
  <radialGradient id="gl"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>
  <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#ff8a3c"/></linearGradient>
</defs>
<ellipse cx="130" cy="228" rx="122" ry="14" fill="#cfd9ea"/><ellipse cx="130" cy="222" rx="122" ry="14" fill="#eef3fb"/>
<rect x="28" y="146" width="204" height="74" rx="14" fill="#f6b5c9"/>
<rect x="28" y="196" width="204" height="10" fill="#f09ab5" opacity=".55"/>
<rect x="28" y="146" width="204" height="16" rx="8" fill="#fff"/>
${[46, 78, 110, 142, 174, 206].map((x) => `<circle cx="${x}" cy="162" r="9" fill="#fff"/>`).join('')}
${[56, 96, 134, 172, 208].map((x, i) => `<use href="#hp" transform="translate(${x - 6} ${186 + (i % 2) * 8}) scale(.5)" fill="#e0516e"/>`).join('')}
<rect x="62" y="96" width="136" height="54" rx="11" fill="#fff1da"/>
<rect x="62" y="96" width="136" height="14" rx="7" fill="#9ec5ee"/>
${[76, 100, 124, 148, 172, 188].map((x) => `<circle cx="${x}" cy="110" r="7" fill="#9ec5ee"/>`).join('')}
${[88, 130, 172].map((x) => `<use href="#hp" transform="translate(${x - 6} 126) scale(.5)" fill="#d62839"/>`).join('')}
${candles.map((x) => `<rect x="${x - 4}" y="62" width="8" height="36" rx="2" fill="url(#cs)"/><rect x="${x - .8}" y="55" width="1.6" height="8" fill="#5b4636"/>`).join('')}
${candles.map((x, i) => `<g transform="translate(${x} 54)">
  <circle class="glow" id="gl${i}" r="20" cy="-8" fill="url(#gl)"/>
  <g class="flame" id="fl${i}"><path d="M0-22C9-10 8 2 0 4-8 2-9-10 0-22z" fill="url(#fl)"/><path d="M0-12C4-6 4 0 0 2-4 0-4-6 0-12z" fill="#fff6c8"/></g></g>`).join('')}
</svg>`;
}

/* =====================================================================
   Luồng chính
   ===================================================================== */
const steps = CFG.pages;
const el = {
  intro: $('#intro'), env: $('#env'), envLetter: $('#envLetter'), seal: $('#seal'), paper: $('#paper'),
  pages: $('#pages'), next: $('#next'), dots: $('#dots'), finale: $('#finale'), sound: $('#sound'),
};
$('#envTo').textContent = `Gửi ${TO}`;
$('#pmDate').textContent = CFG.date;
document.title = `Gửi ${TO} một bức thư 💌`;
steps.forEach((_, i) => { if (steps[i].type !== 'finale') el.dots.appendChild(document.createElement('i')); });

let cur = -1, opened = false, token = 0, busy = false, cakeBlown = false;

function buildPage(step) {
  const pg = document.createElement('section'); pg.className = `pg pg-${step.type}`;
  let h = '<div class="pg-in">';
  if (step.type === 'greet') {
    h += `<p class="kick rv" data-n="3">${esc(sub(step.kicker || ''))}</p><h1 class="big rv" data-n="8" aria-label="Happy Birthday">${bigHTML()}</h1>`;
    h += step.lines.map((l) => mkLine(l)).join('');
  } else if (step.type === 'cake') {
    h += `<h2 class="hd rv" data-n="3">${esc(sub(step.title))}</h2>${step.lines.map((l) => mkLine(l)).join('')}`;
    h += `<div class="cake-wrap rv" data-n="4" id="cakeWrap" role="button" tabindex="0" aria-label="Thổi nến">${cakeSVG()}</div>`;
    h += `<p class="cake-hint rv" data-n="3" id="cakeHint">Chạm vào bánh để thổi nến <b>♥</b></p>`;
    h += `<div class="cake-after">${step.after.map((l) => mkLine(l, 'rvl')).join('')}</div>`;
  } else if (step.type === 'list') {
    h += `<h2 class="hd rv" data-n="3">${esc(sub(step.title))}</h2>${step.lines.map(mkRow).join('')}`;
  } else {
    h += `<h2 class="hd rv" data-n="3">${esc(sub(step.title))}</h2>${step.lines.map((l) => mkLine(l)).join('')}`;
  }
  pg.innerHTML = h + '</div>';
  return pg;
}

function onShown(item) {
  const r = item.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  if (item.classList.contains('rs')) { FX.stars(2, { x: r.left, y: r.top - 6, w: 30, h: r.height }); FX.hearts(r.left + 8, r.top + r.height / 2, 2, ['#ff5c7a']); }
  if (item.classList.contains('big')) FX.stars(5, { x: r.left, y: r.top, w: r.width, h: r.height });
}

async function reveal(root, sel) {
  const my = ++token;
  const items = [...root.querySelectorAll(sel)];
  for (const it of items) {
    if (my !== token) return false;
    it.classList.add('on'); onShown(it);
    await sleep((+it.dataset.n || 3) * 68 + (it.classList.contains('big') ? 900 : 420));
  }
  return my === token;
}
function skipReveal(root, sel, cls = 'skip') {
  token++; root.classList.add(cls);
  root.querySelectorAll(sel).forEach((i) => i.classList.add('on'));
}

function runEffect(name) {
  const w = innerWidth, h = innerHeight;
  switch (name) {
    case 'confetti': FX.confetti(w * .2, h * .85, 70, .9); FX.confetti(w * .8, h * .85, 70, .9); balloons(7); break;
    case 'sparkles': FX.stars(10); break;
    case 'hearts': FX.floatHearts(5200); break;
    case 'stars': FX.stars(14); Sky.shootMany(2); break;
    case 'shooting': Sky.shootMany(5); FX.stars(10); break;
    case 'heartRain': FX.heartRain(6000); break;
  }
}

function setDots(i) {
  [...el.dots.children].forEach((d, k) => { d.className = k < i ? 'done' : (k === i ? 'on' : ''); });
}
function nextLabel(i) {
  const n = steps[i + 1];
  return n && n.type === 'finale' ? 'Còn một điều nữa <span>♥</span>' : 'Tiếp <span>›</span>';
}

async function enter(i) {
  if (busy) return; busy = true;
  cur = i; const step = steps[i];
  if (step.type === 'finale') { busy = false; return finale(step); }
  el.next.classList.remove('show'); el.next.innerHTML = nextLabel(i);
  setDots(i);
  const old = el.pages.querySelector('.pg.active');
  const pg = buildPage(step); el.pages.appendChild(pg);
  if (old) { old.classList.add('out'); old.classList.remove('active'); setTimeout(() => old.remove(), 600); }
  requestAnimationFrame(() => requestAnimationFrame(() => pg.classList.add('active')));
  if (i > 0) Snd.chime();
  runEffect(step.effect);
  busy = false;
  await sleep(480);
  if (cur !== i) return;
  const ok = await reveal(pg, '.rv');
  if (!ok) return;
  afterReveal(step, pg);
}

function afterReveal(step, pg) {
  if (step.type === 'cake') { bindCake(pg, step); return; }
  el.next.classList.add('show');
}

function bindCake(pg, step) {
  const wrap = $('#cakeWrap', pg);
  cakeBlown = false;
  const blow = async () => {
    if (cakeBlown) return; cakeBlown = true;
    Snd.init(); Snd.puff();
    $('#cakeHint', pg).style.visibility = 'hidden';
    const xs = [100, 130, 160];
    for (let k = 0; k < 3; k++) {
      await sleep(190);
      $('#fl' + k, pg).classList.add('out'); $('#gl' + k, pg).classList.add('out');
      for (let s = 0; s < 3; s++) {
        const sm = document.createElement('i'); sm.className = 'smoke';
        sm.style.left = (xs[k] / 260 * 100) + '%'; sm.style.top = (50 / 250 * 100) + '%'; sm.style.setProperty('--dx', rnd(-14, 14).toFixed(0) + 'px'); sm.style.animationDelay = (s * .18) + 's';
        wrap.appendChild(sm); setTimeout(() => sm.remove(), 2200);
      }
    }
    await sleep(700);
    FX.fireworks(3, 380); FX.confetti(innerWidth / 2, innerHeight * .6, 80, 1.4); FX.stars(10);
    await sleep(500);
    await reveal($('.cake-after', pg), '.rvl');
    el.next.classList.add('show');
  };
  wrap.addEventListener('click', blow);
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); blow(); } });
}

/* ---------- Mở thư ---------- */
async function openLetter() {
  if (opened) return; opened = true;
  Snd.init(); Snd.pop();
  el.sound.hidden = false; Snd.song(.2);
  const sr = el.seal.getBoundingClientRect();
  FX.hearts(sr.left + sr.width / 2, sr.top + sr.height / 2, 14);
  FX.stars(6, { x: sr.left - 40, y: sr.top - 40, w: sr.width + 80, h: sr.height + 80 });
  el.env.classList.add('open'); $('#tapHint').style.opacity = 0; $('.intro-top').style.opacity = 0;
  await sleep(1700);

  // FLIP: tờ thư nhỏ trong phong thư phóng to thành giấy thư
  const first = el.envLetter.getBoundingClientRect();
  el.paper.hidden = false; el.paper.style.visibility = 'hidden';
  const last = el.paper.getBoundingClientRect();
  el.paper.style.transition = 'none';
  el.paper.style.transform = `translate(${first.left - last.left}px,${first.top - last.top}px) scale(${first.width / last.width},${first.height / last.height})`;
  el.paper.style.visibility = 'visible'; el.envLetter.style.opacity = 0;
  void el.paper.offsetWidth;
  el.paper.style.transition = 'transform 1s cubic-bezier(.2,.85,.25,1)';
  el.paper.style.transform = 'none';
  el.env.style.transition = 'transform .9s ease-in, opacity .7s'; el.env.style.transform = 'translateY(46vh) scale(.85)'; el.env.style.opacity = 0;
  FX.confetti(innerWidth * .15, innerHeight * .9, 80, .8); FX.confetti(innerWidth * .85, innerHeight * .9, 80, .8);
  FX.fireworks(2, 500);
  await sleep(950);
  el.paper.classList.add('ready'); el.paper.style.transition = ''; el.paper.style.transform = '';
  el.intro.classList.add('gone');
  await sleep(700);
  enter(0);
}

/* ---------- Màn cuối ---------- */
async function finale(step) {
  el.next.classList.remove('show');
  Snd.chime();
  el.paper.classList.add('leave');
  await sleep(850);
  el.paper.hidden = true;
  $('#fBig').textContent = sub(step.big);
  $('#fLine').textContent = sub(step.lines[0] || '');
  $('#fSign').textContent = sub(step.sign || '');
  el.finale.hidden = false;
  FX.startCloud(); balloons(6);
  Snd.song(.22);
  await sleep(1400);
  el.finale.classList.add('show');
  FX.fireworks(5, 600); FX.confettiRain(2600);
  if (CFG.since) {
    const t = new Date(CFG.since + 'T00:00:00').getTime();
    if (!isNaN(t)) {
      const days = Math.max(0, Math.floor((Date.now() - t) / 864e5)), out = $('#fDays');
      out.hidden = false; let n = 0;
      const iv = setInterval(() => { n = Math.min(days, n + Math.max(1, Math.ceil(days / 60))); out.innerHTML = `Chúng mình đã bên nhau <b>${n}</b> ngày ♥`; if (n >= days) clearInterval(iv); }, 30);
    }
  }
  let rounds = 0;
  const loop = setInterval(() => { if (document.hidden) return; FX.fireworks(2, 700); Sky.shoot(); if (++rounds > 8) clearInterval(loop); }, 4200);
}

/* =====================================================================
   Sự kiện
   ===================================================================== */
el.env.addEventListener('click', openLetter);
el.env.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLetter(); } });
el.next.addEventListener('click', () => { Snd.init(); enter(cur + 1); });
$('#again').addEventListener('click', () => location.reload());
el.sound.addEventListener('click', () => { Snd.init(); el.sound.classList.toggle('muted', !Snd.toggle()); });
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' && el.next.classList.contains('show')) el.next.click(); });

// chạm vào giấy khi chữ đang hiện → hiện nhanh toàn bộ
el.paper.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button, .cake-wrap')) return;
  const pg = el.pages.querySelector('.pg.active'); if (!pg) return;
  const step = steps[cur];
  if (step && step.type === 'cake' && cakeBlown) { skipReveal($('.cake-after', pg), '.rvl', 'skipl'); el.next.classList.add('show'); return; }
  if (!el.next.classList.contains('show')) {
    skipReveal(pg, '.rv');
    afterReveal(step, pg);
  }
});
// chạm bất kỳ chỗ nào → tim bay; rê tay → lấp lánh
addEventListener('pointerdown', (e) => { if (!e.target.closest('button, .env, .cake-wrap')) FX.hearts(e.clientX, e.clientY, 5); });
let lastTrail = 0;
addEventListener('pointermove', (e) => { const now = performance.now(); if (now - lastTrail < 55) return; lastTrail = now; FX.sparkle(e.clientX, e.clientY); });

Sky.start();

// dùng cho kiểm thử: ?step=N nhảy thẳng tới trang N
window.__letter = { open: openLetter, go: (i) => { cur = i - 1; el.paper.hidden = false; el.paper.classList.add('ready'); el.intro.classList.add('gone'); return enter(i); } };
})();
