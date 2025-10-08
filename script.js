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
  8: { image: 'comics/changa8.png', date: '2025-10-08' }
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

