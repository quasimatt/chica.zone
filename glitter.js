// /glitter.js
(() => {
  // Respect users who prefer reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // --- CONFIG ----------------------------------------------------
  // Choose colors: 'random' (classic) | 'palette' (uses COLORS) | any CSS color string (e.g., '#f0f' or 'red')
  const COLOUR_MODE = 'palette';
  const COLORS = ['#ff4d9d', '#ffd166', '#06d6a0', '#8ecae6', '#9b5de5']; // title palette
  const SPARKLES = 50;     // pool size
  const TICK_MS  = 40;     // ~25fps (classic cadence)
  // ---------------------------------------------------------------

  let x = 400, ox = 400;
  let y = 300, oy = 300;
  let swide = window.innerWidth || 800;
  let shigh = window.innerHeight || 600;
  let sleft = window.pageXOffset || 0;
  let sdown = window.pageYOffset || 0;

  const tiny = new Array(SPARKLES);
  const star = new Array(SPARKLES);
  const starv = new Array(SPARKLES).fill(0);
  const starx = new Array(SPARKLES);
  const stary = new Array(SPARKLES);
  const tinyx = new Array(SPARKLES);
  const tinyy = new Array(SPARKLES);
  const tinyv = new Array(SPARKLES).fill(0);

  function newColour() {
    if (COLOUR_MODE === 'random') {
      // bright-ish random like the original
      const c = [255, Math.floor(Math.random()*256), Math.floor(Math.random()*(256 - Math.random()*128))];
      c.sort(() => 0.5 - Math.random());
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    } else if (COLOUR_MODE === 'palette') {
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    } else {
      return COLOUR_MODE; // treat as fixed CSS color
    }
  }

  function createDiv(height, width) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.height = height + 'px';
    div.style.width = width + 'px';
    div.style.overflow = 'hidden';
    div.style.zIndex = '999';
    return div;
  }

  function set_width() {
    swide = Math.max(
      document.documentElement?.clientWidth || 0,
      window.innerWidth || 0,
      document.body?.clientWidth || 0,
      800
    );
    shigh = Math.max(
      document.documentElement?.clientHeight || 0,
      window.innerHeight || 0,
      document.body?.clientHeight || 0,
      600
    );
  }

  function set_scroll() {
    sdown = window.pageYOffset ||
            document.documentElement?.scrollTop ||
            document.body?.scrollTop || 0;
    sleft = window.pageXOffset ||
            document.documentElement?.scrollLeft ||
            document.body?.scrollLeft || 0;
  }

  function update_star(i) {
    if (--starv[i] === 25) star[i].style.clip = 'rect(1px, 4px, 4px, 1px)';
    if (starv[i]) {
      stary[i] += 1 + Math.random() * 3;
      starx[i] += (i % 5 - 2) / 5;
      if (stary[i] < shigh + sdown) {
        star[i].style.top = stary[i] + 'px';
        star[i].style.left = starx[i] + 'px';
      } else {
        star[i].style.visibility = 'hidden';
        starv[i] = 0;
        return;
      }
    } else {
      tinyv[i] = 50;
      tiny[i].style.top = (tinyy[i] = stary[i]) + 'px';
      tiny[i].style.left = (tinyx[i] = starx[i]) + 'px';
      tiny[i].style.width = '2px';
      tiny[i].style.height = '2px';
      tiny[i].style.backgroundColor = star[i].firstChild.style.backgroundColor;
      star[i].style.visibility = 'hidden';
      tiny[i].style.visibility = 'visible';
    }
  }

  function update_tiny(i) {
    if (--tinyv[i] === 25) {
      tiny[i].style.width = '1px';
      tiny[i].style.height = '1px';
    }
    if (tinyv[i]) {
      tinyy[i] += 1 + Math.random() * 3;
      tinyx[i] += (i % 5 - 2) / 5;
      if (tinyy[i] < shigh + sdown) {
        tiny[i].style.top = tinyy[i] + 'px';
        tiny[i].style.left = tinyx[i] + 'px';
      } else {
        tiny[i].style.visibility = 'hidden';
        tinyv[i] = 0;
        return;
      }
    } else {
      tiny[i].style.visibility = 'hidden';
    }
  }

  function sparkle() {
    if (Math.abs(x - ox) > 1 || Math.abs(y - oy) > 1) {
      ox = x; oy = y;
      for (let c = 0; c < SPARKLES; c++) {
        if (!starv[c]) {
          star[c].style.left = (starx[c] = x) + 'px';
          star[c].style.top = (stary[c] = y + 1) + 'px';
          star[c].style.clip = 'rect(0px, 5px, 5px, 0px)';
          const col = newColour();
          star[c].firstChild.style.backgroundColor = col;
          star[c].lastChild.style.backgroundColor  = col;
          star[c].style.visibility = 'visible';
          starv[c] = 50;
          break;
        }
      }
    }
    for (let c = 0; c < SPARKLES; c++) {
      if (starv[c]) update_star(c);
      if (tinyv[c]) update_tiny(c);
    }
    setTimeout(sparkle, TICK_MS);
  }

  // Setup once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById) return;

    for (let i = 0; i < SPARKLES; i++) {
      // tiny
      const t = createDiv(3, 3);
      t.style.visibility = 'hidden';
      document.body.appendChild(tiny[i] = t);
      // star (5x5 with cross bars)
      const s = createDiv(5, 5);
      s.style.backgroundColor = 'transparent';
      s.style.visibility = 'hidden';
      const h = createDiv(1, 5);
      const v = createDiv(5, 1);
      h.style.top = '2px';  h.style.left = '0px';
      v.style.top = '0px';  v.style.left = '2px';
      s.appendChild(h);
      s.appendChild(v);
      document.body.appendChild(star[i] = s);
    }

    set_width();
    sparkle();
  }, { once: true });

  // Event listeners (don’t clobber your other handlers)
  document.addEventListener('mousemove', (e) => { x = e.pageX; y = e.pageY; }, { passive: true });
  window.addEventListener('scroll', set_scroll, { passive: true });
  window.addEventListener('resize', set_width, { passive: true });
})();
