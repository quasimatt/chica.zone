// --- helpers (absolute URL + one-time cache bust for fresh deploys) ---
function toAbsolute(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
  return '/' + src.replace(/^\/+/, '');
}

function cacheBust(url) {
  const v = window.BUILD_VERSION || '1';
  return url + (url.includes('?') ? '&' : '?') + 'v=' + v;
}

// single source of truth (populated by comics.data.js)
const comics = (typeof window !== 'undefined' && window.CHICA_COMICS) ? window.CHICA_COMICS : {};
let currentPage = null;

// (legacy) unused function kept to avoid reference errors elsewhere
const pageLabel = document.getElementById('page-label');
function renderPage(n) {
  const data = comics[n];
  const imgEl = document.getElementById('comic-image');
  if (!data || !imgEl) return;
  imgEl.src = toAbsolute(data.image);
  const titleText = data?.title ? `Page ${n} — ${data.title}` : `Page ${n}`;
  if (pageLabel) pageLabel.textContent = titleText;
  document.title = `CHICA ZONE — ${data?.title || `Page ${n}`}`;
  let desc = document.querySelector('meta[name="description"]');
  if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
  desc.setAttribute('content', `${data?.title || ''} — ${data?.date || ''}`);
}

/***********************
 * 1) RANDOMIZED HEADER
 ***********************/
function colorizeHeaderOnce() {
  const target = document.getElementById("rainbow-text");
  if (!target || target.dataset.colored === "true") return;
  const palette = ["hotpink","skyblue","limegreen","gold","violet","tomato","orange","turquoise","orchid","lightcoral"];
  const original = target.dataset.originalText || target.textContent;
  target.dataset.originalText = original;
  const frag = document.createDocumentFragment();
  for (const ch of original) {
    const span = document.createElement("span");
    const isSpace = ch === " ";
    span.textContent = isSpace ? "\u00A0" : ch;
    if (!isSpace) span.style.color = palette[Math.floor(Math.random() * palette.length)];
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
  // if data is missing, fail clearly (prevents silent no-op)
  if (!comics || !Object.keys(comics).length) {
    console.error('[viewer] No comics loaded. Make sure /comics.data.js is included BEFORE this script.');
    const img = document.getElementById('comic-image');
    if (img) { img.src = createPlaceholderImage(); img.alt = 'No data loaded'; }
    return;
  }
  colorizeHeaderOnce();
  initializePage();
  preloadImages(); // start right away (doesn't race the active page)
});

function initializePage() {
  const path = window.location.pathname;
  const hash = window.location.hash;

  let pageNum = null;
  let shouldWriteHash = false;

  if (hash) {
    const m = hash.match(/#(?:page)?(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (pageExists(n)) { pageNum = n; shouldWriteHash = true; }
    }
  }
  if (!pageNum) {
    const m = path.match(/\/(?:page\/)?(\d+)\/?$/) || path.match(/\/(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (pageExists(n)) { pageNum = n; shouldWriteHash = true; }
    }
  }
  if (!pageNum) { pageNum = getLatestAvailablePage(); shouldWriteHash = false; }

  currentPage = pageNum;
  (function preloadHero() {
  const c = comics[pageNum];
  if (!c || !c.image) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = cacheBust(toAbsolute(c.image));
  document.head.appendChild(link);
})();

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
    return dt.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  } catch { return 'Unknown Date'; }
}

function createPlaceholderImage() {
  const svg = `
    <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <rect x="20" y="20" width="760" height="960" fill="none" stroke="#eeeeee" stroke-width="2"/>
      <text x="50%" y="48%" text-anchor="middle" font-family="Love Ya Like A Sister, cursive" font-size="20" fill="#444">sometimes it takes a while for pages to load:/</text>
      <text x="50%" y="56%" text-anchor="middle" font-family="Love Ya Like A Sister, cursive" font-size="18" fill="#777">your changa will appear soon</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/***********************
 * 5) COMIC RENDERING
 ***********************/
function loadComic(pageNum, opts = { updateHash: true }) {
  if (!pageExists(pageNum)) { console.warn("Attempted to load non-existing page:", pageNum); return; }

  const comic = comics[pageNum] || {};
  const imageElement = document.getElementById('comic-image');
  const titleElement = document.getElementById('comic-title');
  const dateElement  = document.getElementById('comic-date');

  if (titleElement) titleElement.textContent = comic.title || '';
  if (dateElement)  dateElement.textContent  = formatDateToDisplay(comic.date);

  document.title = `CHICA ZONE — ${comic.title || `Page ${pageNum}`}`;
  let desc = document.querySelector('meta[name="description"]');
  if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
  desc.setAttribute('content', `${comic.title || `Page ${pageNum}`} — ${comic.date || ''}`);
  // hint browser about likely next/prev
(function preloadNeighbors() {
  const prev = getPreviousPage(pageNum);
  const next = getNextPage(pageNum);
  const seen = new Set(); // avoid dup hints
  [prev, next].forEach(n => {
    if (!n || seen.has(n)) return;
    seen.add(n);
    const c = comics[n];
    if (!c || !c.image) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';         // low-priority
    link.as  = 'image';
    link.href = cacheBust(toAbsolute(c.image));
    document.head.appendChild(link);
  });
})();
// hint browser about likely next/prev
(function preloadNeighbors() {
  const prev = getPreviousPage(pageNum);
  const next = getNextPage(pageNum);
  const seen = new Set(); // avoid dup hints
  [prev, next].forEach(n => {
    if (!n || seen.has(n)) return;
    seen.add(n);
    const c = comics[n];
    if (!c || !c.image) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';         // low-priority
    link.as  = 'image';
    link.href = cacheBust(toAbsolute(c.image));
    document.head.appendChild(link);
  });
})();

  if (imageElement) {
    const src = cacheBust(toAbsolute(comic.image));
    imageElement.setAttribute('fetchpriority','high');
    imageElement.decoding = 'async';
    imageElement.loading  = 'eager';
    imageElement.alt = comic.title ? `${comic.title} — Chica Mob` : `Page ${pageNum} — Chica Mob`;
    imageElement.onerror = function () {
      console.warn(`[viewer] Failed to load: ${src}`);
      imageElement.src = createPlaceholderImage();
      imageElement.alt = `${comic.title || `Page ${pageNum}`} - Image not available`;
    };
    imageElement.src = src; // direct set (no preloader race)
  }

  updateNavigationButtons();
  updatePagePicker(pageNum);
  if (opts.updateHash) updateURL(pageNum);
}

/*************************
 * 6) NAV / URL / PICKERS
 *************************/
function getExistingPagesSorted() {
  return Object.keys(comics)
    .map(n => parseInt(n, 10))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}
function pageExists(n) { return Object.prototype.hasOwnProperty.call(comics, n); }

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
  return pages.length ? Math.max(...pages) : 1;
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
  if (pageExists(latest)) { currentPage = latest; loadComic(currentPage, { updateHash: true }); }
}
function goToPage(pageValue) {
  if (!pageValue) return;
  const pageNum = parseInt(pageValue, 10);
  if (pageExists(pageNum)) { currentPage = pageNum; loadComic(currentPage, { updateHash: true }); }
  else { console.warn("Page does not exist:", pageNum); }
}
function navigateComic(direction) {
  let newPage = null;
  if (direction === 'prev') newPage = getPreviousPage(currentPage);
  if (direction === 'next') newPage = getNextPage(currentPage);
  if (newPage && pageExists(newPage)) { currentPage = newPage; loadComic(currentPage, { updateHash: true }); }
}
function updateURL(pageNum) {
  const newHash = `#${pageNum}`;
  if (window.location.hash !== newHash) window.location.hash = newHash;
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
  const m = window.location.hash.match(/#(\d+)$/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (pageExists(n) && n !== currentPage) { currentPage = n; loadComic(currentPage, { updateHash: true }); }
  }
});
document.addEventListener('keydown', function (event) {
  const t = event.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') { event.preventDefault(); navigateComic('prev'); }
  else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') { event.preventDefault(); navigateComic('next'); }
  else if (event.key === 'Home') { event.preventDefault(); const first = getExistingPagesSorted()[0] || 1; currentPage = first; loadComic(currentPage, { updateHash: true }); }
  else if (event.key === 'End')  { event.preventDefault(); goToLatest(); }
});

/********************
 * 8) IMAGE PRELOAD
 ********************/
function addPage(pageNum, imagePath, date) {
  comics[pageNum] = { image: imagePath, date };
  console.log(`Added page ${pageNum}: ${imagePath} (${date})`);
  if (currentPage === pageNum) loadComic(currentPage, { updateHash: true });
}

// newest → oldest, skip current, use the SAME url builder as main (avoids double downloads)
function preloadImages() {
  const pages = getExistingPagesSorted().sort((a, b) => b - a);
  for (const n of pages) {
    if (n === currentPage) continue;
    const c = comics[n];
    if (!c || !c.image) continue;
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'lazy';
    img.src = cacheBust(toAbsolute(c.image));
  }
}

// Allow Node scripts to import comics without breaking the browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { comics };
}




