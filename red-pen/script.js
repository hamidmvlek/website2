(() => {
  'use strict';

  const IMG_W = 1068;
  const IMG_H = 1473;
  // Same thickness as the black pen lines in the drawing (~2px at native size).
  const LINE_W = 1.8 / IMG_W;
  const RED = '#d0121b';

  const stage = document.getElementById('stage');
  const frame = document.getElementById('frame');
  const canvas = document.getElementById('ink');
  const ctx = canvas.getContext('2d');

  const strokes = [];          // finished strokes, points in 0..1 image space
  const active = new Map();    // pointerId -> stroke in progress
  let w = 0, h = 0, dpr = 1;

  function layout() {
    const cs = getComputedStyle(stage);
    const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const bw = Math.round(Math.max(4, Math.min(12, Math.min(availW, availH) * 0.012)));
    const innerW = availW - bw * 2;
    const innerH = availH - bw * 2;
    const scale = Math.min(innerW / IMG_W, innerH / IMG_H);
    w = Math.floor(IMG_W * scale);
    h = Math.floor(IMG_H * scale);
    frame.style.setProperty('--bw', bw + 'px');
    frame.style.width = (w + bw * 2) + 'px';
    frame.style.height = (h + bw * 2) + 'px';

    dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    redraw();
  }

  function setPen() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = RED;
    ctx.fillStyle = RED;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.25, LINE_W * w);
  }

  function drawStroke(pts) {
    if (!pts.length) return;
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0][0] * w, pts[0][1] * h, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0] * w, pts[i][1] * h, mx * w, my * h);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0] * w, last[1] * h);
    ctx.stroke();
  }

  function redraw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPen();
    for (const s of strokes) drawStroke(s);
    for (const s of active.values()) drawStroke(s);
  }

  let frameReq = 0;
  function scheduleRedraw() {
    if (!frameReq) frameReq = requestAnimationFrame(() => { frameReq = 0; redraw(); });
  }

  function toImage(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  }

  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    active.set(e.pointerId, [toImage(e)]);
    scheduleRedraw();
  }

  function onMove(e) {
    const s = active.get(e.pointerId);
    if (!s) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (evs.length ? evs : [e])) s.push(toImage(ev));
    scheduleRedraw();
  }

  function onUp(e) {
    const s = active.get(e.pointerId);
    if (!s) return;
    active.delete(e.pointerId);
    strokes.push(s);
    scheduleRedraw();
  }

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);

  // No zooming, scrolling or context menus.
  const block = (e) => e.preventDefault();
  document.addEventListener('touchmove', block, { passive: false });
  document.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', block);
  document.addEventListener('gesturechange', block);
  document.addEventListener('dblclick', block);
  document.addEventListener('contextmenu', block);
  document.addEventListener('dragstart', block);
  window.addEventListener('wheel', block, { passive: false });
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) e.preventDefault();
    if ([' ', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) e.preventDefault();
  });

  window.addEventListener('resize', layout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 150));
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', layout);
  layout();
})();
