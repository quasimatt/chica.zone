/*!
 * Tinkerbell Magic Sparkle (modernized)
 * Original (c) 2005–2013 mf2fm web-design — http://www.mf2fm.com/rv
 * This version refactored for modern browsers & accessibility.
 */
(() => {
  // ----- Config -----
  const colour  = "random";  // or any CSS color, e.g. "#ffd166"
  const sparkles = 50;       // number of particles in pool

  // Respect reduced motion (leave enabled). To also disable on touch-only, add || isTouchOnly
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchOnly = matchMedia('(hover: none), (pointer: coarse)').matches;
  if (prefersReduced /*|| isTouchOnly*/) return;

  // ----- Internal state -----
  let x = 400, y = 300, ox = 400, oy = 300;
  let swide = 800, shigh = 600, sleft = 0, sdown = 0;

  const tiny = Array(sparkles);
  const star = Array(sparkles);
  const starv = Array(sparkles).fill(0);
  const starx = Array(sparkles).fill(0);
  const stary = Array(sparkles).fill(0);
  const tinyx = Array(sparkles).fill(0);
  const tinyy = Array(sparkles).fill(0);
  const tinyv = Array(sparkles).fill(0);

  // top-most, click-through layer
  const layer = document.createElement('div');
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '9999',
  });
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(layer));

  // Helpers
  function newColour() {
    const c = [255, Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
    c.sort(() => 0.5 - Math.random());
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }
  function createDiv(h, w) {
    const div = document.createElement('div');
    Object.assign(div.style, {
      position: 'absolute',
      height: `${h}px`,
      width: `${w}px`,
      overflow: 'hidden',
      pointerEvents: 'none',
    });
    return div;
  }
  function setScroll() {
    sdown = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    sleft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
  }
  function setSize() {
    swide = document.documentElement.clientWidth || window.innerWidth || document.body.clientWidth || 800;
    shigh = document.documentElement.clientHeight || window.innerHeight || document.body.clientHeight || 600;
  }

  // Build pool
  function setup() {
    for (let i = 0; i < sparkles; i++) {
      const t = createDiv(3, 3);
      t.style.visibility = 'hidden';
      t.style.backgroundColor = 'transparent';
      layer.appendChild(tiny[i] = t);

      const s = createDiv(5, 5);
      s.style.backgroundColor = 'transparent';
      s.style.visibility = 'hidden';
      const rlef = createDiv(1, 5);
      const rdow = createDiv(5, 1);
      rlef.style.top = '2px';
      rlef.style.left = '0px';
      rdow.style.top = '0px';
      rdow.style.left = '2px';
      s.appendChild(rlef);
      s.appendChild(rdow);
      layer.appendChild(star[i] = s);
    }
    setSize();
    setScroll();
    animate();
  }

  // Animation loop
  function animate() {
    if (Math.abs(x - ox) > 1 || Math.abs(y - oy) > 1) {
      ox = x; oy = y;
      for (let c = 0; c < sparkles; c++) if (!starv[c]) {
        star[c].style.left = (starx[c] = x) + 'px';
        star[c].style.top  = (stary[c] = y + 1) + 'px';
        star[c].style.clip = 'rect(0px,5px,5px,0px)';
        const cval = (colour === 'random') ? newColour() : colour;
        star[c].firstChild.style.backgroundColor = cval;
        star[c].lastChild .style.backgroundColor = cval;
        star[c].style.visibility = 'visible';
        starv[c] = 50;
        break;
      }
    }

    for (let c = 0; c < sparkles; c++) {
      if (starv[c]) updateStar(c);
      if (tinyv[c]) updateTiny(c);
    }
    requestAnimationFrame(animate);
  }

  function updateStar(i) {
    if (--starv[i] === 25) star[i].style.clip = 'rect(1px,4px,4px,1px)';
    if (starv[i]) {
      stary[i] += 1 + Math.random() * 3;
      starx[i] += (i % 5 - 2) / 5;
      if (stary[i] < shigh + sdown) {
        star[i].style.top  = stary[i] + 'px';
        star[i].style.left = starx[i] + 'px';
      } else {
        star[i].style.visibility = 'hidden';
        starv[i] = 0;
      }
    } else {
      tinyv[i] = 50;
      tiny[i].style.top  = (tinyy[i] = stary[i]) + 'px';
      tiny[i].style.left = (tinyx[i] = starx[i]) + 'px';
      tiny[i].style.width  = '2px';
      tiny[i].style.height = '2px';
      tiny[i].style.backgroundColor = star[i].firstChild.style.backgroundColor;
      star[i].style.visibility = 'hidden';
      tiny[i].style.visibility = 'visible';
    }
  }

  function updateTiny(i) {
    if (--tinyv[i] === 25) {
      tiny[i].style.width  = '1px';
      tiny[i].style.height = '1px';
    }
    if (tinyv[i]) {
      tinyy[i] += 1 + Math.random() * 3;
      tinyx[i] += (i % 5 - 2) / 5;
      if (tinyy[i] < shigh + sdown) {
        tiny[i].style.top  = tinyy[i] + 'px';
        tiny[i].style.left = tinyx[i] + 'px';
      } else {
        tiny[i].style.visibility = 'hidden';
        tinyv[i] = 0;
      }
    } else {
      tiny[i].style.visibility = 'hidden';
    }
  }

  // Events
  function onPointerMove(e) {
    x = e.clientX + sleft;
    y = e.clientY + sdown;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('mousemove', onPointerMove, { passive: true }); // fallback
  window.addEventListener('scroll', setScroll, { passive: true });
  window.addEventListener('resize', setSize);

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();


