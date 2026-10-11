/* =========================================================
   GỬI CHỊ TRÂM — script.js  (cinematic + iPhone optimized)
   ========================================================= */
(function () {
  'use strict';

  /* =======================================================
     CONFIG
     ======================================================= */
  const CONFIG = {
    pageTitle: 'uhhh Hello chị ;-;',

    opening: {
      name: 'Chị ơi ờm....,',
      sub: 'em mún nói là..ờm..',
      hint: 'Cuộn xuống'
    },

    journey: [
      'thoi nói đại lunn'
    ],

    bloomLine: 'e có, tình cảm v chị á ;-; ',

    quiet: [
      'cái bình hoa',
      'ko bt chị có thích nó khum -_- '
    ],

    confession: [
      'Chị Trâm,',
      'Em thích chị. Em chỉ muốn chị biết điều đó thôi.',
      'e thích chị nhiều lắm >.<'
    ],

    ending: {
      thanks: 'vậy thôi e nói hết gòi é',
      button: 'Xem lại'
    },

    scrollWeights: [1, 2.4, 3.2, 1.6, 3, 1.6]
  };

  /* =======================================================
     TIỆN ÍCH
     ======================================================= */
  const clamp = (x, a, b) => { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return x < a ? a : x > b ? b : x; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const mod = (a, n) => ((a % n) + n) % n;
  const $ = (id) => document.getElementById(id);

  function stops(x, arr) {
    if (x <= arr[0][0]) return arr[0][1];
    for (let i = 1; i < arr.length; i++) {
      if (x <= arr[i][0]) {
        const a = arr[i - 1], b = arr[i];
        return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
      }
    }
    return arr[arr.length - 1][1];
  }

  function hexRGB(h) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* =======================================================
     THAM CHIẾU DOM
     ======================================================= */
  const docEl = document.documentElement;
  const scrollEl = $('scroll');
  const stage = $('stage');
  const canvas = $('petals');
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  const sceneEls = [$('s0'), $('s1'), $('s2'), $('s3'), $('s4'), $('s5')];
  const E = {
    openText: $('openText'), sprig: $('sprig'), hint: $('hint'),
    s1cam: $('s1cam'), j0: $('j0'), j1: $('j1'), b1: $('b1'), b2: $('b2'), b3: $('b3'),
    roseWrap: $('roseWrap'), stem: $('stem'), leafR: $('leafR'), leafL: $('leafL'),
    recept: $('recept'), petalsG: $('petalsG'), glow: $('bloomGlow'), bLine: $('bLine'),
    s3cam: $('s3cam'), q0: $('q0'), q1: $('q1'),
    confBox: $('confBox'), c0: $('c0'), c1: $('c1'), c2: $('c2'), c3: $('c3'), rule: $('rule'),
    fall: $('fall'), thanks: $('thanks'), restart: $('restart'),
    lbTop: $('lbTop'), lbBot: $('lbBot'),
    leak1: $('leak1'), leak2: $('leak2')
  };

  /* =======================================================
     NỘI DUNG
     ======================================================= */
  function renderText() {
    document.title = CONFIG.pageTitle;
    $('oName').textContent = CONFIG.opening.name;
    $('oSub').textContent = CONFIG.opening.sub;
    $('hintText').textContent = CONFIG.opening.hint;
    CONFIG.journey.forEach(function (t, i) { const el = $('j' + i); if (el) el.textContent = t; });
    E.bLine.textContent = CONFIG.bloomLine;
    CONFIG.quiet.forEach(function (t, i) { const el = $('q' + i); if (el) el.textContent = t; });
    CONFIG.confession.forEach(function (t, i) { const el = $('c' + i); if (el) el.textContent = t; });
    E.thanks.textContent = CONFIG.ending.thanks;
    E.restart.textContent = CONFIG.ending.button;
  }

  /* =======================================================
     REDUCED MOTION
     ======================================================= */
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let REDUCED = !!(mq && mq.matches);

  function onMotionChange() {
    REDUCED = !!(mq && mq.matches);
    docEl.classList.toggle('reduced', REDUCED);
    lastBloom = -1;
    snap = true;
    resize(true);
  }
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', onMotionChange);
    else if (mq.addListener) mq.addListener(onMotionChange);
  }

  /* =======================================================
     CHIA CẢNH THEO TIẾN ĐỘ CUỘN
     ======================================================= */
  const WSUM = CONFIG.scrollWeights.reduce(function (a, b) { return a + b; }, 0);
  const B = [0];
  CONFIG.scrollWeights.forEach(function (w) { B.push(B[B.length - 1] + w / WSUM); });
  B[B.length - 1] = 1;

  (function setPageHeight() {
    let unit = 'vh';
    try { if (window.CSS && CSS.supports && CSS.supports('height', '1svh')) unit = 'svh'; } catch (e) {}
    scrollEl.style.height = ((WSUM + 1) * 100) + unit;
  })();

  /* ----- Bảng màu nền theo g ----- */
  const BG_STOPS = [
    [0,    '#fdf1ec', '#f7dcd9'],
    [1,    '#fbe9e4', '#f0c8cd'],
    [2,    '#f4d2d6', '#e0a0ad'],
    [2.6,  '#f7dccd', '#e7a8a0'],
    [3,    '#efc5c6', '#c98698'],
    [3.25, '#8a4560', '#a65a74'],
    [3.7,  '#5a2a3d', '#7a3d55'],
    [3.97, '#5a2a3d', '#7a3d55'],
    [4.12, '#fff4ee', '#f9e3de'],
    [5,    '#fff4ee', '#f9e3de'],
    [6,    '#fbe3df', '#f2c9cd']
  ].map(function (s) { return [s[0], hexRGB(s[1]), hexRGB(s[2])]; });

  function bgAt(g) {
    let i = 1;
    while (i < BG_STOPS.length - 1 && g > BG_STOPS[i][0]) i++;
    const a = BG_STOPS[i - 1], b = BG_STOPS[i];
    const t = clamp((g - a[0]) / (b[0] - a[0]));
    const mix = function (x, y) {
      return 'rgb(' + Math.round(lerp(x[0], y[0], t)) + ',' + Math.round(lerp(x[1], y[1], t)) + ',' + Math.round(lerp(x[2], y[2], t)) + ')';
    };
    return [mix(a[1], b[1]), mix(a[2], b[2])];
  }

  const DENS   = [[0, .10], [.6, .14], [1, .30], [1.35, .9], [1.8, .95], [2, .55], [2.5, .28], [3, .22], [3.4, .10], [4, .05], [4.2, .07], [5, .05], [5.4, .02], [6, 0]];
  const TSCALE = [[0, .7], [1, 1], [1.6, 1.5], [2, 1], [3, .6], [3.5, .3], [4, .2], [6, .2]];
  const MOTE   = [[0, 0], [2.2, 0], [2.6, .7], [3, 1], [3.7, .9], [3.95, 0], [6, 0]];

  /* =======================================================
     CÁNH HOA TRÊN CANVAS
     ======================================================= */
  const SPRITE_COLORS = [
    ['#fcdde1', '#ec9fb0'],
    ['#efb0bc', '#c4627b'],
    ['#e08a9e', '#a53b57'],
    ['#fff3ea', '#f4c7c6']
  ];

  function makeSprite(top, base) {
    const S = 160, c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    const k = S / 150;
    x.translate(S / 2, S * 0.93);
    x.scale(k, k);
    x.beginPath();
    x.moveTo(0, 0);
    x.bezierCurveTo(-58, -14, -74, -78, -40, -116);
    x.bezierCurveTo(-20, -138, 20, -138, 40, -116);
    x.bezierCurveTo(74, -78, 58, -14, 0, 0);
    x.closePath();
    const g = x.createLinearGradient(0, -138, 0, 0);
    g.addColorStop(0, top); g.addColorStop(1, base);
    x.fillStyle = g; x.fill();
    x.strokeStyle = 'rgba(255,244,240,.35)'; x.lineWidth = 1.2; x.stroke();
    const h = x.createLinearGradient(0, -120, 0, -20);
    h.addColorStop(0, 'rgba(255,255,255,.28)'); h.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = h; x.beginPath(); x.ellipse(0, -70, 16, 48, 0, 0, Math.PI * 2); x.fill();
    return c;
  }

  function makeGlowSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,232,176,1)');
    g.addColorStop(.35, 'rgba(255,214,140,.55)');
    g.addColorStop(1, 'rgba(255,214,140,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return c;
  }

  const petals = [];
  const motes = [];
  let sprites = [], moteSprite = null;
  const MARG = 100;
  let W = 0, H = 0, dpr = 1, psScale = 1;
  let IS_SMALL = false;

  function buildPetals() {
    petals.length = 0; motes.length = 0;
    if (!ctx) return;
    sprites = SPRITE_COLORS.map(function (c) { return makeSprite(c[0], c[1]); });
    moteSprite = makeGlowSprite();

    IS_SMALL = Math.min(window.innerWidth, window.innerHeight) < 600;
    const counts = IS_SMALL ? [8, 7, 3] : [18, 16, 8];
    const rnd = mulberry32(20240214);
    const LAYERS = [
      { size: [13, 20], alpha: .5,  par: .28, spd: [9, 16],  amp: [10, 28], pick: [3, 0] },
      { size: [22, 34], alpha: .72, par: .62, spd: [16, 26], amp: [18, 40], pick: [0, 1, 3] },
      { size: [42, 66], alpha: .8,  par: 1.3, spd: [26, 42], amp: [26, 60], pick: [1, 2, 0] }
    ];
    const between = function (r) { return lerp(r[0], r[1], rnd()); };

    LAYERS.forEach(function (L, li) {
      for (let i = 0; i < counts[li]; i++) {
        petals.push({
          x0: rnd(), y0: rnd(),
          size: between(L.size), alpha: L.alpha, par: L.par,
          spd: between(L.spd), amp: between(L.amp),
          freq: lerp(.35, .8, rnd()), ph: rnd() * Math.PI * 2,
          r0: rnd() * Math.PI * 2, rs: (rnd() - .5) * .7,
          flip: lerp(.5, 1.3, rnd()),
          sprite: sprites[L.pick[Math.floor(rnd() * L.pick.length)]],
          rank: 0
        });
      }
    });
    const order = petals.map(function (_, i) { return i; });
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    order.forEach(function (idx, r) { petals[idx].rank = r / order.length; });

    const mc = IS_SMALL ? 8 : 16;
    for (let i = 0; i < mc; i++) {
      motes.push({
        x0: rnd(), y0: rnd(), size: lerp(7, 15, rnd()),
        rise: lerp(6, 16, rnd()), tw: lerp(.8, 2, rnd()), ph: rnd() * Math.PI * 2
      });
    }
  }

  function drawPetals(sy, g, T, forcedDens) {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dens = forcedDens !== undefined ? forcedDens : stops(g, DENS);
    const mv = forcedDens !== undefined ? 0 : stops(g, MOTE);
    if (dens <= 0.002 && mv <= 0.002) return;

    const Hc = H + 2 * MARG;
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      const vis = smooth((dens - p.rank) * 12);
      if (vis < 0.01) continue;
      const s = p.size * psScale;
      const y = mod(p.y0 * Hc + T * p.spd * psScale - sy * p.par, Hc) - MARG;
      const ph = T * p.freq + p.ph;
      const x = p.x0 * W + Math.sin(ph) * p.amp * psScale + Math.sin(sy * 0.0016 + p.ph) * 28 * p.par;
      const rot = p.r0 + T * p.rs + Math.sin(ph) * 0.45;
      let sx = Math.cos(T * p.flip + p.ph * 2);
      sx = sx >= 0 ? Math.max(sx, .3) : Math.min(sx, -.3);

      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, 1);

      /* motion blur nhẹ cho lớp gần — chỉ trên desktop, mobile bỏ để nhẹ GPU */
      if (!IS_SMALL && p.par > 0.9) {
        ctx.globalAlpha = p.alpha * vis * 0.28;
        ctx.drawImage(p.sprite, -s / 2, -s / 2 - s * 0.10, s, s);
        ctx.globalAlpha = p.alpha * vis * 0.18;
        ctx.drawImage(p.sprite, -s / 2, -s / 2 - s * 0.20, s, s);
      }
      ctx.globalAlpha = p.alpha * vis;
      ctx.drawImage(p.sprite, -s / 2, -s / 2, s, s);
      ctx.restore();
    }

    if (mv > 0.002) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const tw = Math.sin(T * m.tw + m.ph);
        const a = mv * (.25 + .75 * tw * tw) * .9;
        const s = m.size * psScale;
        const y = mod(m.y0 * Hc - T * m.rise - sy * .18, Hc) - MARG;
        const x = m.x0 * W + Math.sin(T * .3 + m.ph) * 14;
        ctx.globalAlpha = a;
        ctx.drawImage(moteSprite, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  /* =======================================================
     HOA HỒNG SVG
     ======================================================= */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const PETAL_D = 'M0 0 C-58 -14 -74 -78 -40 -116 C-20 -138 20 -138 40 -116 C74 -78 58 -14 0 0Z';
  const BLOOM_X = 200, BLOOM_Y = 312;

  const RINGS = [
    { grad: 'gRing0', sc: [.74, 1.0],  angles: [-98, -66, -34, -2, 30, 62, 94], aClosed: .16, start: 0 },
    { grad: 'gRing1', sc: [.58, .8],   angles: [-64, -32, 0, 32, 64],           aClosed: .20, start: .14 },
    { grad: 'gRing2', sc: [.46, .6],   angles: [-42, -14, 14, 42],              aClosed: .22, start: .28 },
    { grad: 'gRing3', sc: [.34, .4],   angles: [-16, 6, 26],                    aClosed: .30, start: .40 }
  ];
  const roseParts = [];

  function buildRose() {
    RINGS.forEach(function (ring, ri) {
      const list = ring.angles.map(function (a, j) { return { a: a, j: j }; });
      list.sort(function (x, y) { return Math.abs(y.a) - Math.abs(x.a); });
      list.forEach(function (it) {
        const el = document.createElementNS(SVGNS, 'path');
        el.setAttribute('d', PETAL_D);
        el.setAttribute('fill', 'url(#' + ring.grad + ')');
        el.setAttribute('stroke', 'rgba(255,244,240,.35)');
        el.setAttribute('stroke-width', '.9');
        el.setAttribute('stroke-linejoin', 'round');
        E.petalsG.appendChild(el);
        const jitter = 0.94 + (((it.j * 37 + ri * 13) % 10) / 10) * 0.12;
        roseParts.push({
          el: el, a: it.a, ac: ring.aClosed,
          sc0: ring.sc[0] * jitter, sc1: ring.sc[1] * jitter,
          st: ring.start + (it.j / ring.angles.length) * 0.12
        });
      });
      if (ri === 2) {
        const sh = document.createElementNS(SVGNS, 'ellipse');
        sh.setAttribute('cx', BLOOM_X); sh.setAttribute('cy', BLOOM_Y - 40);
        sh.setAttribute('rx', 26); sh.setAttribute('ry', 22);
        sh.setAttribute('fill', '#7d2540'); sh.setAttribute('opacity', '.28');
        E.petalsG.appendChild(sh);
      }
    });
  }

  let lastBloom = -1;
  function setBloom(bp) {
    if (Math.abs(bp - lastBloom) < 0.0004) return;
    lastBloom = bp;
    for (let i = 0; i < roseParts.length; i++) {
      const r = roseParts[i];
      const q = smooth(seg(bp, r.st, r.st + 0.42));
      const ang = lerp(r.a * r.ac, r.a, q);
      const s = lerp(r.sc0, r.sc1, q);
      const sy = s * lerp(.88, 1, q);
      r.el.setAttribute('transform', 'translate(' + BLOOM_X + ' ' + BLOOM_Y + ') rotate(' + ang.toFixed(2) + ') scale(' + s.toFixed(3) + ' ' + sy.toFixed(3) + ')');
    }
  }

  /* =======================================================
     CẬP NHẬT CẢNH
     ======================================================= */
  function reveal(el, v, rise) {
    if (REDUCED) { el.style.opacity = v > 0.5 ? 1 : 0; el.style.transform = ''; return; }
    el.style.opacity = v;
    el.style.transform = 'translate3d(0,' + ((1 - v) * (rise === undefined ? 14 : rise)).toFixed(2) + 'px,0)';
  }

  function setScene(i, o) {
    const el = sceneEls[i];
    if (o <= 0.003) { el.style.opacity = 0; el.style.visibility = 'hidden'; }
    else { el.style.opacity = o; el.style.visibility = 'visible'; }
  }

  let g = 0;
  let lastBg = '';

  function update(u, T) {
    const M = REDUCED ? 0 : 1;
    const ps = [];
    g = 0;
    for (let i = 0; i < 6; i++) {
      const p = clamp((u - B[i]) / (B[i + 1] - B[i]));
      ps.push(p); g += p;
    }

    /* ----- Nền ----- */
    const bg = bgAt(g);
    const key = bg[0] + bg[1];
    if (key !== lastBg) {
      lastBg = key;
      stage.style.setProperty('--bg1', bg[0]);
      stage.style.setProperty('--bg2', bg[1]);
    }

    /* ----- Letterbox (transform scaleY, KHÔNG đụng height) ----- */
    if (E.lbTop && E.lbBot) {
      const lbOpen = smooth(seg(ps[0], 0.02, 0.22)) * (1 - smooth(seg(ps[0], 0.55, 0.90)));
      const lbEnd  = smooth(seg(ps[5], 0.00, 0.20));
      const lbScale = Math.max(lbOpen, lbEnd);
      E.lbTop.style.transform = 'translateZ(0) scaleY(' + lbScale.toFixed(4) + ')';
      E.lbBot.style.transform = 'translateZ(0) scaleY(' + lbScale.toFixed(4) + ')';
    }

    /* ----- Lens leak ----- */
    if (E.leak1 && E.leak2) {
      const l1 = smooth(seg(g, 1.2, 2.0)) * (1 - smooth(seg(g, 3.0, 3.5)));
      const l2 = smooth(seg(g, 2.3, 2.9)) * (1 - smooth(seg(g, 3.5, 4.0)));
      E.leak1.style.opacity = (l1 * 0.8 * M).toFixed(3);
      E.leak2.style.opacity = (l2 * 0.7 * M).toFixed(3);
      if (!REDUCED) {
        E.leak1.style.transform = 'translate3d(' + (Math.sin(T * 0.25) * 22).toFixed(1) + 'px,' + (Math.cos(T * 0.18) * 22).toFixed(1) + 'px,0)';
        E.leak2.style.transform = 'translate3d(' + (Math.cos(T * 0.22) * 24).toFixed(1) + 'px,' + (Math.sin(T * 0.15) * 24).toFixed(1) + 'px,0)';
      }
    }

    /* ---- 1. OPENING ---- */
    {
      const p = ps[0];
      const o = 1 - smooth(seg(p, .78, 1));
      setScene(0, o);
      if (o > 0.003) {
        E.openText.style.transform = 'translate3d(0,' + (-p * 60 * M).toFixed(1) + 'px,0) scale(' + (1 + p * .05 * M).toFixed(4) + ')';
        E.sprig.style.transform = 'translate3d(' + (p * 40 * M).toFixed(1) + 'px,' + (-p * 90 * M).toFixed(1) + 'px,0) rotate(' + (p * 4 * M).toFixed(2) + 'deg)';
        E.hint.style.opacity = 1 - seg(p, 0, .12);
      }
    }

    /* ---- 2. PETAL JOURNEY (chỉ còn 1 câu) ---- */
    {
      const p = ps[1];
      const o = smooth(seg(p, 0, .1)) * (1 - smooth(seg(p, .9, 1)));
      setScene(1, o);
      if (o > 0.003) {
        E.s1cam.style.transform =
          'scale(' + (1 + .08 * p * M).toFixed(4) + ') rotate(' + (p * 0.8 * M).toFixed(3) + 'deg)';
        E.b1.style.transform = 'translate3d(' + (p * 40 * M).toFixed(1) + 'px,' + (-p * 220 * M).toFixed(1) + 'px,0)';
        E.b2.style.transform = 'translate3d(' + (-p * 60 * M).toFixed(1) + 'px,' + (-p * 340 * M).toFixed(1) + 'px,0)';
        E.b3.style.transform = 'translate3d(' + (p * 80 * M).toFixed(1) + 'px,' + (-p * 460 * M).toFixed(1) + 'px,0)';
        reveal(E.j0, smooth(seg(p, .22, .48)));
      }
    }

    /* ---- 3. BLOOM ---- */
    {
      const p = ps[2];
      const o = smooth(seg(p, 0, .08)) * (1 - smooth(seg(p, .92, 1)));
      setScene(2, o);
      if (o > 0.003) {
        const sp = smooth(p);
        const sc = (1 - (1 - sp) * .14 + seg(p, .85, 1) * .04);
        E.roseWrap.style.transform = REDUCED ? '' :
          'translate3d(0,' + ((1 - sp) * 28).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ') rotate(' + ((1 - sp) * 1.5).toFixed(2) + 'deg)';

        const stemP = REDUCED ? 1 : easeOut(seg(p, 0, .24));
        E.stem.style.strokeDashoffset = (1 - stemP).toFixed(4);
        E.stem.style.opacity = stemP > 0.001 ? 1 : 0;

        const l1 = REDUCED ? 1 : easeOut(seg(p, .20, .40));
        const l2 = REDUCED ? 1 : easeOut(seg(p, .27, .47));
        E.leafR.setAttribute('transform', 'translate(204 470) scale(' + Math.max(.001, l1 * 1.3).toFixed(3) + ') rotate(-38)');
        E.leafL.setAttribute('transform', 'translate(198 548) scale(' + (-Math.max(.001, l2 * 1.3)).toFixed(3) + ' ' + Math.max(.001, l2 * 1.3).toFixed(3) + ') rotate(-38)');
        E.recept.style.opacity = REDUCED ? 1 : seg(p, .2, .32);

        setBloom(REDUCED ? 1 : seg(p, .30, .88));

        const gl = REDUCED ? .85 : smooth(seg(p, .45, .95));
        E.glow.style.opacity = (gl * .95).toFixed(3);
        E.glow.style.transform = 'translate(-50%,-50%) scale(' + (.7 + .5 * gl).toFixed(3) + ')';

        reveal(E.bLine, smooth(seg(p, .84, .95)));
      }
    }

    /* ---- 4. QUIET MOMENT ---- */
    {
      const p = ps[3];
      const o = smooth(seg(p, 0, .1)) * (1 - smooth(seg(p, .8, 1)));
      setScene(3, o);
      if (o > 0.003) {
        E.s3cam.style.transform =
          'scale(' + (1 + .04 * p * M).toFixed(4) + ') rotate(' + (-p * 0.4 * M).toFixed(3) + 'deg)';
        reveal(E.q0, smooth(seg(p, .28, .42)));
        reveal(E.q1, smooth(seg(p, .48, .62)));
      }
    }

    /* ---- 5. CONFESSION ---- */
    {
      const p = ps[4];
      const o = smooth(seg(p, .02, .12)) * (1 - smooth(seg(p, .96, 1)));
      setScene(4, o);
      if (o > 0.003) {
        E.confBox.style.transform = 'translate3d(0,' + (-p * 20 * M).toFixed(1) + 'px,0)';
        reveal(E.c0, smooth(seg(p, .10, .22)));
        reveal(E.c1, smooth(seg(p, .24, .40)));
        reveal(E.c2, smooth(seg(p, .46, .62)));
        reveal(E.c3, smooth(seg(p, .68, .84)));
        const r = smooth(seg(p, .84, .95));
        E.rule.style.opacity = r;
        E.rule.style.transform = 'scaleX(' + (REDUCED ? 1 : r).toFixed(3) + ')';
      }
    }

    /* ---- 6. ENDING ---- */
    {
      const p = ps[5];
      const o = smooth(seg(p, 0, .08));
      setScene(5, o);
      if (o > 0.003) {
        const t = REDUCED ? 1 : seg(p, .08, .70);
        const te = smooth(t) * .4 + t * .6;
        const y = lerp(-H * .12, H * .74, te);
        const x = Math.sin(t * 6.5) * W * .08 * (REDUCED ? 0 : 1);
        const rot = (-20 + t * 220) * (REDUCED ? 0 : 1);
        let sx = Math.cos(t * 9);
        sx = REDUCED ? 1 : (sx >= 0 ? Math.max(sx, .28) : Math.min(sx, -.28));
        E.fall.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg) scale(' + sx.toFixed(3) + ',1)';
        E.fall.style.opacity = REDUCED ? .4 : (1 - .65 * smooth(seg(p, .6, .85))).toFixed(3);

        reveal(E.thanks, smooth(seg(p, .45, .60)));
        const bv = smooth(seg(p, .70, .82));
        reveal(E.restart, bv);
        E.restart.style.pointerEvents = bv > .6 ? 'auto' : 'none';
        E.restart.tabIndex = bv > .6 ? 0 : -1;
      }
    }
  }

  /* =======================================================
     VÒNG LẶP CHÍNH
     ======================================================= */
  let raf = 0, last = 0, T = 0;
  let us = 0, lastU = -1, snap = true;
  let maxScroll = 1;
  let pageVisible = true;

  const readScroll = function () { return window.pageYOffset || docEl.scrollTop || 0; };
  function request() { if (!raf) raf = requestAnimationFrame(frame); }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now;

    const target = clamp(readScroll() / maxScroll);
    if (snap || REDUCED) { us = target; snap = false; }
    else {
      us += (target - us) * (1 - Math.exp(-dt * 10));
      if (Math.abs(target - us) < 2e-5) us = target;
    }

    if (us !== lastU) { lastU = us; update(us, T); }

    if (!REDUCED) {
      T += dt * stops(g, TSCALE);
      drawPetals(us * maxScroll, g, T);
    }

    if (!REDUCED && pageVisible && !document.hidden) request();
    else if (us !== target) request();
    else last = 0;
  }

  /* =======================================================
     RESIZE
     ======================================================= */
  function resize(force) {
    const w = window.innerWidth, h = window.innerHeight;
    maxScroll = Math.max(1, docEl.scrollHeight - h);
    const d = Math.min(window.devicePixelRatio || 1, 2);
    if (force === true || w !== W || Math.abs(h - H) > 150 || d !== dpr) {
      W = w; H = h; dpr = d;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = H + 'px';
      psScale = clamp(Math.min(W, H) / 720, .62, 1.15);
      const nowSmall = Math.min(W, H) < 600;
      if (nowSmall !== IS_SMALL) buildPetals();   // đổi thiết bị → dựng lại bố cục cánh hoa
      if (REDUCED) drawPetals(0, 0, 0, .26);
      else drawPetals(us * maxScroll, g, T);
    }
    lastU = -1;
    request();
  }

  /* =======================================================
     KHỞI TẠO
     ======================================================= */
  function init() {
    docEl.classList.toggle('reduced', REDUCED);
    renderText();
    buildRose();
    buildPetals();
    resize(true);

    let rt = 0;
    window.addEventListener('resize', function () {
      if (rt) return;
      rt = requestAnimationFrame(function () { rt = 0; resize(); });
    }, { passive: true });
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('orientationchange', function () { setTimeout(function () { resize(true); }, 250); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = 0; request(); } });

    if ('IntersectionObserver' in window) {
      try {
        new IntersectionObserver(function (entries) {
          pageVisible = entries[0].isIntersecting;
          if (pageVisible) { last = 0; request(); }
        }).observe(scrollEl);
      } catch (e) { pageVisible = true; }
    }

    E.restart.addEventListener('click', function () {
      stage.classList.add('fading');
      setTimeout(function () {
        window.scrollTo(0, 0);
        snap = true; lastU = -1; lastBloom = -1;
        ['oName', 'oSub'].forEach(function (id) {
          const el = $(id);
          el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
        });
        request();
        requestAnimationFrame(function () { stage.classList.remove('fading'); });
      }, REDUCED ? 0 : 600);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
