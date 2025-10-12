const pageLabel = document.getElementById('page-label');

function renderPage(n) {
  const data = comics[n];
  document.getElementById('comic-image').src = data.image;

  // build combined label: "Page 7 — Glitter Spill"
  const titleText = data.title ? `Page ${n} — ${data.title}` : `Page ${n}`;
  pageLabel.textContent = titleText;

  // update document <title> + meta description
  document.title = `CHICA ZONE — ${data.title || `Page ${n}`}`;
  let desc = document.querySelector('meta[name="description"]');
  if (!desc) {
    desc = document.createElement('meta');
    desc.name = 'description';
    document.head.appendChild(desc);
  }
  desc.setAttribute('content', `${data.title || ''} — ${data.date || ''}`);
}

/*********************************
 * 2) COMIC VIEWER CONFIG & STATE
 *********************************/
// Existing comics ONLY — navigation will be limited to these keys.
// Use data injected by comics.data.js
const comics = (typeof window !== 'undefined' && window.CHICA_COMICS) ? window.CHICA_COMICS : {};

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
  const svg = `
    <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <rect x="20" y="20" width="760" height="960" fill="none" stroke="#eeeeee" stroke-width="2"/>

      <!-- line 1 -->
      <text x="50%" y="48%" text-anchor="middle"
            font-family="Love Ya Like A Sister, cursive"
            font-size="20" fill="#444444">
        sometimes it takes a while for pages to load:/
      </text>

      <!-- line 2 -->
      <text x="50%" y="56%" text-anchor="middle"
            font-family="Love Ya Like A Sister, cursive"
            font-size="18" fill="#777777">
        your changa will appear soon
      </text>
    </svg>
  `;

  // Safe base64 encoding for any characters
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
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
  const imageElement = document.getElementById('comic-image');
  const titleElement = document.getElementById('comic-title');
  const dateElement  = document.getElementById('comic-date');

  // --- show title only, no page number ---
  if (titleElement) titleElement.textContent = comic.title || '';

  // --- date on its own smaller line ---
  if (dateElement) dateElement.textContent = formatDateToDisplay(comic.date);

  // --- update tab title + meta description ---
  document.title = `CHICA ZONE — ${comic.title || `Page ${pageNum}`}`;
  let desc = document.querySelector('meta[name="description"]');
  if (!desc) {
    desc = document.createElement('meta');
    desc.name = 'description';
    document.head.appendChild(desc);
  }
  desc.setAttribute('content', `${comic.title || `Page ${pageNum}`} — ${comic.date || ''}`);

  // --- load image with graceful fallback ---
  const img = new Image();
  img.onload = function () {
    if (imageElement) {
      imageElement.src = comic.image;
      imageElement.alt = comic.title ? `${comic.title} — Chica Mob` : `Page ${pageNum} — Chica Mob`;
    }
  };
  img.onerror = function () {
    console.warn(`Failed to load image: ${comic.image}`);
    if (imageElement) {
      imageElement.src = createPlaceholderImage();
      imageElement.alt = `${comic.title || `Page ${pageNum}`} - Image not available`;
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

// 1) Preload newest → oldest, and skip the current page
function preloadImages() {
  const pages = getExistingPagesSorted().sort((a, b) => b - a); // DESC
  for (const n of pages) {
    if (n === currentPage) continue; // don't compete with the one on screen
    const c = comics[n];
    if (!c || !c.image) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = c.image; // or toAbsolute(c.image)
  }
}

// 2) Start preloading immediately after we kick off the current image (no 1s delay)
document.addEventListener('DOMContentLoaded', function () {
  colorizeHeaderOnce();
  initializePage();
  preloadImages(); // remove the setTimeout
});


// Allow Node scripts to import comics without breaking the browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { comics };
}



