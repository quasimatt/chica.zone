/*********************************
 * 2) COMIC VIEWER CONFIG & STATE
 *********************************/
// Existing comics ONLY — navigation will be limited to these keys.
const comics = {
  1: { image: 'comics/changa1.png', date: '2025-10-01' },
  2: { image: 'comics/changa2.png', date: '2025-10-02' },
  3: { image: 'comics/changa3.png', date: '2025-10-03' },
  4: { image: 'comics/changa4.png', date: '2025-10-04' },
  5: { image: 'comics/changa5.png', date: '2025-10-05' },
  6: { image: 'comics/changa6.png', date: '2025-10-06' },
  7: { image: 'comics/changa7.png', date: '2025-10-07' },
  8: { image: 'comics/changa8.png', date: '2025-10-08' },
  9: { image: 'comics/changa9.png', date: '2025-10-09' }
};

let currentPage = null;

/***********************
 * 1) RANDOMIZED HEADER
 ***********************/
function colorizeHeaderOnce() {
  const target = document.getElementById("rainbow-text");
  if (!target) return;
  if (target.dataset.colored === "true") return;

  const palette = [
    "hotpink", "skyblue", "limegreen", "gold", "violet",
    "tomato", "orange", "turquoise", "orchid", "lightcoral"
  ];

  const original = target.dataset.originalText || target.textContent;
  target.dataset.originalText = original;

  const frag = document.createDocumentFragment();
  for (const ch of original) {
    const span = document.createElement("span");
    const isSpace = ch === " ";
    span.textContent = isSpace ? "\u00A0" : ch; // preserve spacing
    if (!isSpace) {
      span.style.color = palette[Math.floor(Math.random() * palette.length)];
    }
    frag.appendChild(span);
  }

  target.textContent = "";
  target.appendChild(frag);
  target.dataset.colored = "true";
}

/**************************
 * 3) INITIAL PAGE LOADING
 **************************/
document.addEventListener('DOMContentLoaded', function () {
  colorizeHeaderOnce();
  initializePage();
  setTimeout(preloadImages, 1000);
});

function initializePage() {
  const path = window.location.pathname;
  const hash = window.location.hash;

  let pageNum = null;
  let shouldWriteHash = false; // keep homepage clean unless a page was explicitly asked

  // Prefer hash (#5 or #page5)
  if (hash) {
    const m = hash.match(/#(?:page)?(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (pageExists(n)) {
        pageNum = n;
        shouldWriteHash = true; // maintain hash if it was explicitly set
      }
    }
  }

  // Or a path like /page/5 or /5
  if (!pageNum) {
    const m = path.match(/\/(?:page\/)?(\d+)\/?$/) || path.match(/\/(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (pageExists(n)) {
        pageNum = n;
        shouldWriteHash = true;
      }
    }
  }

  // Default: load the latest existing page BUT DO NOT write hash on homepage
  if (!pageNum) {
    pageNum = getLatestAvailablePage();
    shouldWriteHash = false;
  }

  currentPage = pageNum;
  loadComic(currentPage, { updateHash: shouldWriteHash });
  setupPagePicker();
}

/************************
 * 4) DATE / PLACEHOLDER
 ************************/
function formatDateToDisplay(dateStr) {
  if (!dateStr) return 'Unknown Date';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime())) return 'Unknown Date';
    return dt.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    return 'Unknown Date';
  }
}

function createPlaceholderImage() {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .horror-bg { fill: #2d1b69; }
          .horror-border { fill: none; stroke: #ff4457; stroke-width: 8; stroke-dasharray: 20,10; }
          .horror-text { fill: #00dddd; font-family: 'Creepster', cursive; text-anchor: middle; }
          .horror-subtitle { fill: #fd79a8; font-family: 'Griffy', cursive; text-anchor: middle; }
          .doodle { fill: #55efc4; opacity: 0.3; }
        </style>
      </defs>

      <rect class="horror-bg" width="100%" height="100%"/>
      <rect class="horror-border" x="20" y="20" width="760" height="960"/>

      <text class="doodle" x="100" y="150" font-size="24" transform="rotate(-15 100 150)">★ MYSTERY ★</text>
      <text class="doodle" x="650" y="200" font-size="20" transform="rotate(20 650 200)">💀 SPOOKY 💀</text>
      <text class="doodle" x="150" y="800" font-size="18" transform="rotate(-10 150 800)">🎪 CHICA MOB 🎪</text>
      <text class="doodle" x="600" y="850" font-size="22" transform="rotate(25 600 850)">✨ SECRETS ✨</text>

      <text class="horror-text" x="400" y="400" font-size="48">Page Coming Soon!</text>
      <text class="horror-subtitle" x="400" y="500" font-size="24">Convert your PDF to PNG and upload it</text>
      <text class="horror-subtitle" x="400" y="550" font-size="20">The mysteries await...</text>

      <text class="horror-text" x="400" y="650" font-size="36">Page ${currentPage || '?'}</text>
    </svg>
  `)}`;
}

/***********************
 * 5) COMIC RENDERING
 ***********************/
function loadComic(pageNum, opts = { updateHash: true }) {
  if (!pageExists(pageNum)) {
    console.warn("Attempted to load non-existing page:", pageNum);
    return;
  }

  const comic = comics[pageNum];
  const pageNumberElement = document.getElementById('page-number');
  const dateElement = document.getElementById('comic-date');
  const imageElement = document.getElementById('comic-image');
  const titleElement = document.getElementById('comic-title');

  if (pageNumberElement) pageNumberElement.textContent = pageNum;
  if (titleElement) titleElement.textContent = `Page ${pageNum}`;
  if (dateElement) dateElement.textContent = formatDateToDisplay(comic.date);

  const img = new Image();
  img.onload = function () {
    if (imageElement) {
      imageElement.src = comic.image;
      imageElement.alt = `Page ${pageNum} of Chica Mob`;
    }
  };
  img.onerror = function () {
    console.warn(`Failed to load image: ${comic.image}`);
    if (imageElement) {
      imageElement.src = createPlaceholderImage();
      imageElement.alt = `Page ${pageNum} - Image not available`;
    }
  };
  img.src = comic.image;

  updateNavigationButtons();
  updatePagePicker(pageNum);

  if (opts.updateHash) updateURL(pageNum);
}

/*************************
 * 6) NAV / URL / PICKERS
 *************************/
// Only use existing page numbers
function getExistingPagesSorted() {
  return Object.keys(comics).map(n => parseInt(n, 10)).sort((a, b) => a - b);
}
function pageExists(n) {
  return Object.prototype.hasOwnProperty.call(comics, n);
}

function getPreviousPage(pageNum) {
  const pages = getExistingPagesSorted();
  const idx = pages.indexOf(pageNum);
  return (idx > 0) ? pages[idx - 1] : null;
}
function getNextPage(pageNum) {
  const pages = getExistingPagesSorted();
  const idx = pages.indexOf(pageNum);
  return (idx >= 0 && idx < pages.length - 1) ? pages[idx + 1] : null;
}
function getLatestAvailablePage() {
  const pages = getExistingPagesSorted();
  return pages.length ? pages[pages.length - 1] : 1;
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  if (prevBtn) {
    const prevPage = getPreviousPage(currentPage);
    prevBtn.disabled = !prevPage;
    prevBtn.innerHTML = prevPage ? `← Previous Page (${prevPage})` : '← Previous Page';
  }
  if (nextBtn) {
    const nextPage = getNextPage(currentPage);
    nextBtn.disabled = !nextPage;
    nextBtn.innerHTML = nextPage ? `Next Page (${nextPage}) →` : 'Next Page →';
  }
}

function goToLatest() {
  const latest = getLatestAvailablePage();
  if (pageExists(latest)) {
    currentPage = latest;
    loadComic(currentPage, { updateHash: true });
  }
}

function goToPage(pageValue) {
  if (!pageValue) return;
  const pageNum = parseInt(pageValue, 10);
  if (pageExists(pageNum)) {
    currentPage = pageNum;
    loadComic(currentPage, { updateHash: true });
  } else {
    console.warn("Page does not exist:", pageNum);
  }
}

function navigateComic(direction) {
  let newPage = null;
  if (direction === 'prev') newPage = getPreviousPage(currentPage);
  if (direction === 'next') newPage = getNextPage(currentPage);
  if (newPage && pageExists(newPage)) {
    currentPage = newPage;
    loadComic(currentPage, { updateHash: true });
  }
}

function updateURL(pageNum) {
  const newHash = `#${pageNum}`;
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }
}

function setupPagePicker() {
  const pageInput = document.getElementById('page-input');
  if (pageInput) {
    const pages = getExistingPagesSorted();
    pageInput.min = pages.length ? pages[0] : 1;
    pageInput.max = pages.length ? pages[pages.length - 1] : 1;
    pageInput.placeholder = 'Page #';
  }
}
function updatePagePicker(pageNum) {
  const pageInput = document.getElementById('page-input');
  if (pageInput) pageInput.value = pageNum;
}

/**********************
 * 7) EVENT LISTENERS
 **********************/
window.addEventListener('hashchange', function () {
  const hash = window.location.hash;
  const m = hash.match(/#(\d+)$/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (pageExists(n) && n !== currentPage) {
      currentPage = n;
      loadComic(currentPage, { updateHash: true });
    }
  }
});

document.addEventListener('keydown', function (event) {
  const t = event.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
    event.preventDefault();
    navigateComic('prev');
  } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
    event.preventDefault();
    navigateComic('next');
  } else if (event.key === 'Home') {
    event.preventDefault();
    const first = getExistingPagesSorted()[0] || 1;
    currentPage = first;
    loadComic(currentPage, { updateHash: true });
  } else if (event.key === 'End') {
    event.preventDefault();
    goToLatest();
  }
});

/********************
 * 8) IMAGE PRELOAD
 ********************/
function addPage(pageNum, imagePath, date) {
  comics[pageNum] = { image: imagePath, date };
  console.log(`Added page ${pageNum}: ${imagePath} (${date})`);
  if (currentPage === pageNum) loadComic(currentPage, { updateHash: true });
}

function preloadImages() {
  Object.values(comics).forEach(comic => {
    const img = new Image();
    img.src = comic.image;
  });
}

<script>
/*!
 * Tinkerbell Magic Sparkle (modernized)
 * Original (c) 2005–2013 mf2fm web-design — http://www.mf2fm.com/rv
 * This version refactored for modern browsers & accessibility.
 */
(() => {
  // ----- Config -----
  // "random" or any valid CSS color (e.g. "#f0f", "red", "rgb(255,0,128)")
  const colour  = "random";
  const sparkles = 50; // number of particles in pool

  // Respect reduced motion or touch-only environments (optional: toggle below)
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

  // create a container so elements never block clicks and stay on top
  const layer = document.createElement('div');
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '9999',
  });
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(layer));

  // ----- Helpers -----
  function newColour() {
    // similar to original: bright-ish RGB with a shuffle
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
    // modern scroll values
    sdown = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    sleft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
  }

  function setSize() {
    // viewport size
    swide = document.documentElement.clientWidth || window.innerWidth || document.body.clientWidth || 800;
    shigh = document.documentElement.clientHeight || window.innerHeight || document.body.clientHeight || 600;
  }

  // ----- Build pool -----
  function setup() {
    for (let i = 0; i < sparkles; i++) {
      // tiny
      const t = createDiv(3, 3);
      t.style.visibility = 'hidden';
      t.style.backgroundColor = 'transparent';
      layer.appendChild(tiny[i] = t);
      // star
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
    animate(); // kick off RAF loop
  }

  // ----- Animation -----
  function animate() {
    // spawn if moved
    if (Math.abs(x - ox) > 1 || Math.abs(y - oy) > 1) {
      ox = x; oy = y;
      // find a free star slot
      for (let c = 0; c < sparkles; c++) if (!starv[c]) {
        star[c].style.left = (starx[c] = x) + 'px';
        star[c].style.top  = (stary[c] = y + 1) + 'px';
        star[c].style.clip = 'rect(0px,5px,5px,0px)';
        const cval = (colour === 'random') ? newColour() : colour;
        star[c].firstChild.style.backgroundColor = cval;
        star[c].lastChild.style.backgroundColor  = cval;
        star[c].style.visibility = 'visible';
        starv[c] = 50;
        break;
      }
    }

    // update particles
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

  // ----- Events -----
  function onPointerMove(e) {
    x = e.clientX + sleft;
    y = e.clientY + sdown;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('mousemove', onPointerMove, { passive: true }); // fallback

  window.addEventListener('scroll', setScroll, { passive: true });
  window.addEventListener('resize', setSize);

  // kick off when DOM is ready (layer must exist)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
</script>


