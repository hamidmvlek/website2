(() => {
  'use strict';

  const IMG_W = 1068, IMG_H = 1473;
  // Matches the black pencil lines in the photo (~2px wide at native size).
  const LINE_W = 2.0 / IMG_W;
  const RED = [232, 34, 40];

  const stage = document.getElementById('stage');
  const frame = document.getElementById('frame');
  const canvas = document.getElementById('ink');
  const ctx = canvas.getContext('2d');
  const base = document.createElement('canvas');   // finished strokes
  const bctx = base.getContext('2d');

  const strokes = [];
  const active = new Map();
  let w = 0, h = 0, dpr = 1, grain = null;

  // Pencil grain: red pixels at uneven opacity so the stroke breaks up like graphite on paper.
  function makeGrain() {
    const g = document.createElement('canvas');
    g.width = g.height = 192;
    const gx = g.getContext('2d');
    const img = gx.createImageData(192, 192);
    for (let i = 0; i < img.data.length; i += 4) {
      const r = Math.random();
      const a = r < 0.2 ? 0.12 + r * 1.5 : 0.5 + Math.random() * 0.45;
      img.data[i] = RED[0]; img.data[i + 1] = RED[1]; img.data[i + 2] = RED[2];
      img.data[i + 3] = Math.round(Math.min(1, a) * 255);
    }
    gx.putImageData(img, 0, 0);
    return g;
  }
  const grainTile = makeGrain();

  function pen(c) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!grain || grain._ctx !== c) {
      grain = c.createPattern(grainTile, 'repeat');
      grain._ctx = c;
      if (grain.setTransform) grain.setTransform(new DOMMatrix().scale(1 / dpr));
    }
    c.strokeStyle = grain;
    c.fillStyle = grain;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.lineWidth = Math.max(1.3, LINE_W * w);
    c.shadowColor = `rgba(${RED[0]},${RED[1]},${RED[2]},0.35)`;
    c.shadowBlur = 0.8 * dpr;
  }

  function drawStroke(c, pts) {
    if (!pts.length) return;
    if (pts.length === 1) {
      c.beginPath();
      c.arc(pts[0][0] * w, pts[0][1] * h, c.lineWidth / 2, 0, Math.PI * 2);
      c.fill();
      return;
    }
    c.beginPath();
    c.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      c.quadraticCurveTo(pts[i][0] * w, pts[i][1] * h, mx * w, my * h);
    }
    const last = pts[pts.length - 1];
    c.lineTo(last[0] * w, last[1] * h);
    c.stroke();
  }

  function rebuildBase() {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, base.width, base.height);
    grain = null;
    pen(bctx);
    for (const s of strokes) drawStroke(bctx, s);
  }

  function redraw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 0;
    ctx.drawImage(base, 0, 0);
    if (active.size) {
      grain = null;
      pen(ctx);
      for (const s of active.values()) drawStroke(ctx, s);
    }
  }

  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; redraw(); }); };

  function layout() {
    const cs = getComputedStyle(stage);
    const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const scale = Math.min(availW / IMG_W, availH / IMG_H);
    w = Math.max(1, Math.floor(IMG_W * scale));
    h = Math.max(1, Math.floor(IMG_H * scale));
    frame.style.width = w + 'px';
    frame.style.height = h + 'px';
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = base.width = Math.round(w * dpr);
    canvas.height = base.height = Math.round(h * dpr);
    rebuildBase();
    redraw();
  }

  function toImage(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    active.set(e.pointerId, [toImage(e)]);
    schedule();
  });
  stage.addEventListener('pointermove', (e) => {
    const s = active.get(e.pointerId);
    if (!s) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (evs.length ? evs : [e])) s.push(toImage(ev));
    schedule();
  });
  const finish = (e) => {
    const s = active.get(e.pointerId);
    if (!s) return;
    active.delete(e.pointerId);
    strokes.push(s);
    grain = null;
    pen(bctx);
    drawStroke(bctx, s);
    schedule();
  };
  stage.addEventListener('pointerup', finish);
  stage.addEventListener('pointercancel', finish);

  // No zooming, scrolling, or context menus.
  const block = (e) => e.preventDefault();
  document.addEventListener('touchmove', block, { passive: false });
  document.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu', 'dragstart'].forEach((t) => document.addEventListener(t, block));
  window.addEventListener('wheel', block, { passive: false });
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) e.preventDefault();
    if ([' ', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) e.preventDefault();
  });

  window.addEventListener('resize', layout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 150));
  layout();
})();
