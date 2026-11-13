/* =============================================================
   GUNS.LOL CLONE — effets : fonds animés, curseur, typewriter, tilt
   ============================================================= */
window.G = window.G || {};

(function () {
  'use strict';

  const EFFECTS = {
    stars: { name: 'Étoiles', premium: false },
    aurora: { name: 'Aurore', premium: false },
    plasma: { name: 'Plasma', premium: false },
    grid: { name: 'Grille', premium: false },
    snow: { name: 'Neige', premium: false },
    rain: { name: 'Pluie', premium: false },
    firefly: { name: 'Lucioles', premium: true },
    dither: { name: 'Trame', premium: true },
    none: { name: 'Aucun', premium: false }
  };

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function particles(layer, kind, count) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = kind;
      p.style.left = Math.random() * 100 + '%';
      if (kind === 'snow') {
        p.style.top = (-10 - Math.random() * 20) + 'vh';
        p.style.animationDuration = (6 + Math.random() * 8) + 's';
        p.style.animationDelay = (-Math.random() * 12) + 's';
        p.style.opacity = 0.3 + Math.random() * 0.6;
        p.style.transform = 'scale(' + (0.5 + Math.random()) + ')';
      } else if (kind === 'rain') {
        p.style.top = (-10 - Math.random() * 20) + 'vh';
        p.style.animationDuration = (0.6 + Math.random() * 0.8) + 's';
        p.style.animationDelay = (-Math.random() * 2) + 's';
        p.style.opacity = 0.2 + Math.random() * 0.5;
      } else {
        p.style.top = (10 + Math.random() * 80) + '%';
        p.style.left = (Math.random() * 100) + '%';
        p.style.animationDuration = (2.5 + Math.random() * 4) + 's';
        p.style.animationDelay = (-Math.random() * 5) + 's';
      }
      layer.appendChild(p);
    }
  }

  /**
   * Applique un effet de fond dans un conteneur.
   * @param {HTMLElement} layer
   * @param {string} type
   */
  function apply(layer, type) {
    if (!layer) return;
    clear(layer);
    layer.className = 'fx';
    switch (type) {
      case 'stars': layer.classList.add('fx-stars'); break;
      case 'aurora': layer.classList.add('fx-aurora'); break;
      case 'plasma': layer.classList.add('fx-plasma'); break;
      case 'grid': layer.classList.add('fx-grid'); break;
      case 'dither': layer.classList.add('fx-dither'); break;
      case 'snow': particles(layer, 'snow', 70); break;
      case 'rain': particles(layer, 'rain', 90); break;
      case 'firefly': particles(layer, 'firefly', 26); break;
      default: break;
    }
  }

  /* ---------- typewriter ---------- */
  function typewriter(el, text, opts) {
    if (!el) return;
    opts = opts || {};
    const lines = String(text || '').split('\n');
    if (!opts.loop) { el.textContent = text; return; }
    let li = 0, ci = 0, erasing = false;
    el.style.minHeight = (lines.length * 1.5) + 'em';
    (function step() {
      const line = lines[li];
      ci += erasing ? -1 : 1;
      el.textContent = line.slice(0, ci);
      let delay = erasing ? 35 : 55;
      if (!erasing && ci === line.length) {
        erasing = true; delay = 1400;
        if (li === lines.length - 1) setTimeout(() => { li = 0; erasing = false; }, 2200);
        else li++;
      } else if (erasing && ci === 0) {
        erasing = false; delay = 320;
      }
      setTimeout(step, delay);
    })();
  }

  /* ---------- tilt 3D ---------- */
  function tilt(el, max) {
    if (!el) return;
    const m = max || 7;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = 'perspective(800px) rotateY(' + (x * m) + 'deg) rotateX(' + (-y * m) + 'deg)';
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  }

  /* ---------- curseur personnalisé ---------- */
  let cursorEl = null;
  function cursor(kind) {
    if (cursorEl) { cursorEl.remove(); cursorEl = null; }
    if (!kind || kind === 'default') { document.body.style.cursor = ''; return; }
    document.body.style.cursor = 'none';
    cursorEl = G.util.cursorSvg(kind);
    if (!cursorEl) { document.body.style.cursor = ''; return; }
    document.body.appendChild(cursorEl);
    const node = cursorEl.lastChild;
    let x = 0, y = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      x += (tx - x) * .22; y += (ty - y) * .22;
      node.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- animation de compteur ---------- */
  function countUp(el, to, dur) {
    if (!el) return;
    const from = parseInt(el.dataset.from || '0', 10) || 0;
    const t0 = performance.now();
    const d = dur || 1200;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / d);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = G.util.compact(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(tick);
      else el.dataset.from = to;
    })(t0);
  }

  /* ---------- fond guns (motif d'armes discret) ---------- */
  function gunPattern() {
    const gun = (x, y, r, s, o) =>
      '<svg viewBox="0 0 240 90" width="' + (240 * s) + '" height="' + (90 * s) + '" style="position:absolute;left:' + x + 'px;top:' + y + 'px;transform:rotate(' + r + 'deg);opacity:' + o + '">' +
      '<path fill="#fff" d="M8 37 L30 33 L49 39 L49 52 L28 56 L8 51 Z M46 33 L118 31 L123 53 L46 55 Z M118 33 L157 35 L157 50 L118 50 Z M156 39 L228 41 L228 47 L156 47 Z M95 52 C95 67 103 81 116 85 L129 79 C118 70 112 60 112 50 Z M60 52 L74 51 L79 75 L66 78 Z M97 22 L104 22 L106 33 L95 33 Z"/></svg>';
    let out = '';
    const spots = [[40, 60, -18, 1.4, .9], [420, 30, 14, 1.9, .6], [860, 90, -8, 1.6, .7], [300, 210, 25, 2.2, .45], [1000, 250, -22, 2, .5], [620, 300, 12, 1.7, .35]];
    spots.forEach(s => { out += gun(s[0], s[1], s[2], s[3], s[4]); });
    return out;
  }

  G.effects = { apply, typewriter, tilt, cursor, countUp, gunPattern, EFFECTS };
})();
