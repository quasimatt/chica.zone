/*********************************
 * 2) COMIC VIEWER CONFIG & STATE
 *********************************/
// Comic data structure - simplified: page number, date, and image
const comics = {
  1: { image: 'comics/changa1.png', date: '2025-10-01' },
  2: { image: 'comics/changa2.png', date: '2025-10-02' },
  3: { image: 'comics/changa3.png', date: '2025-10-03' }
};

// Current page number
let currentPage = null;

/***********************
 * 1) RANDOMIZED HEADER
 ***********************/
function colorizeHeaderOnce() {
  const target = document.getElementById("rainbow-text");
  if (!target) {
    console.warn('[rainbow-text] No element found with id="rainbow-text".');
    return;
  }
  if (target.dataset.colored === "true") return;

  const palette = [
    "hotpink", "skyblue", "limegreen", "gold", "violet",
    "tomato", "orange", "turquoise", "orchid", "lightcoral"
  ];

  // Keep the original text once
  const original = target.dataset.originalText || target.textContent;
  target.dataset.originalText = original;

  const frag = document.createDocumentFragment();
  for (const ch of original) {
    const span = document.createElement("span");
    const isSpace = ch === " ";
    // preserve visible spacing
    span.textContent = isSpace ? "\u00A0" : ch;
    // only color non-space characters
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
  // Make sure the header is colored AFTER the DOM exists
  colorizeHeaderOnce();

  // Initialize the comic page and UI
  initializePage();

  // Preload images a moment later for snappier navigation
  setTimeout(preloadImages, 1000);
});

function initializePage() {
  // Check if there's a page number in the URL path or hash
  const path = window.location.pathname;
  const hash = window.location.hash;

  let pageNum = null;

  // Try to get page from hash first (#1, #page1, etc.)
  if (hash) {
    const hashMatch = hash.match(/#(?:page)?(\d+)$/);
    if (hashMatch) pageNum = parseInt(hashMatch[1], 10);
  }

  // Try to get page from path (/page/1, /1, etc.)
  if (!pageNum) {
    const pageMatch =
      path.match(/\/(?:page\/)?(\d+)\/?$/) ||
      path.match(/\/(\d+)$/);
    if (pageMatch) pageNum = parseInt(pageMatch[1], 10);
  }

  // Default to the most recent available page if no page specified
  if (!pageNum || pageNum < 1) {
    pageNum = getLatestAvailablePage();
  }

  currentPage = pageNum;
  loadComic(currentPage);
  setupPagePicker();
}

/************************
 * 4) DATE / PLACEHOLDER
 ************************/
function formatDateToDisplay(dateStr) {
  if (!dateStr) return 'Unknown Date';

  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (isNaN(date.getTime())) return 'Unknown Date';

      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Unknown Date';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown Date';
  }
}

function createPlaceholderImage() {
  // Create a horror-themed placeholder SVG
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
function loadComic(pageNum) {
  const comic = comics[pageNum];
  const pageNumberElement = document.getElementById('page-number');
  const dateElement = document.getElementById('comic-date');
  const imageElement = document.getElementById('comic-image');
  const titleElement = document.getElementById('comic-title');

  // Always update page number
  if (pageNumberElement) pageNumberElement.textContent = pageNum;

  if (comic) {
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
  } else {
    if (titleElement) titleElement.textContent = `Page ${pageNum} - Coming Soon!`;
    if (dateElement) dateElement.textContent = 'Mystery Date';
    if (imageElement) {
      imageElement.src = createPlaceholderImage();
      imageElement.alt = `Page ${pageNum} - Not available yet`;
    }
  }

  updateNavigationButtons();
  updatePagePicker(pageNum);
  updateURL(pageNum);
}

/*************************
 * 6) NAV / URL / PICKERS
 *************************/
function updateNavigationButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  if (prevBtn) {
    const prevPage = getPreviousPage(currentPage);
    prevBtn.disabled = !prevPage;
    prevBtn.innerHTML = prevPage ? `← Previous (${prevPage})` : '← Previous';
  }

  if (nextBtn) {
    const nextPage = getNextPage(currentPage);
    nextBtn.disabled = !nextPage;
    nextBtn.innerHTML = nextPage ? `Next (${nextPage}) →` : 'Next →';
  }
}

function getPreviousPage(pageNum) {
  return pageNum > 1 ? pageNum - 1 : null;
}

function getNextPage(pageNum) {
  const maxAvailablePage = Math.max(...Object.keys(comics).map(p => parseInt(p, 10)));
  const maxPage = Math.max(maxAvailablePage + 10, pageNum + 1); // allow some future pages
  return pageNum < maxPage ? pageNum + 1 : null;
}

function getLatestAvailablePage() {
  const availablePages = Object.keys(comics)
    .map(p => parseInt(p, 10))
    .sort((a, b) => b - a);
  return availablePages.length > 0 ? availablePages[0] : 1;
}

function navigateComic(direction) {
  let newPage = null;
  if (direction === 'prev') newPage = getPreviousPage(currentPage);
  if (direction === 'next') newPage = getNextPage(currentPage);
  if (newPage) {
    currentPage = newPage;
    loadComic(currentPage);
  }
}

function goToLatest() {
  currentPage = getLatestAvailablePage();
  loadComic(currentPage);
}

function goToPage(pageValue) {
  if (!pageValue) return;
  const pageNum = parseInt(pageValue, 10);
  if (pageNum > 0) {
    currentPage = pageNum;
    loadComic(currentPage);
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
    pageInput.min = 1;
    pageInput.max = 999;
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
  const hashMatch = hash.match(/#(\d+)$/);
  if (hashMatch) {
    const pageNum = parseInt(hashMatch[1], 10);
    if (pageNum !== currentPage && pageNum > 0) {
      currentPage = pageNum;
      loadComic(currentPage);
    }
  }
});

document.addEventListener('keydown', function (event) {
  // Only handle if not typing in an input
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
    currentPage = 1;
    loadComic(currentPage);
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
  if (currentPage === pageNum) loadComic(currentPage);
}

function preloadImages() {
  Object.values(comics).forEach(comic => {
    const img = new Image();
    img.src = comic.image;
  });
}

