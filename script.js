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
// lets us ignore stale loads if user clicks quickly
let _navSeq = 0;

function schedulePrefetch(urls = []) {
  urls.forEach(u => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = u;
    document.head.appendChild(link);
  });
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
async function loadComic(pageNum, opts = { updateHash: true }) {
  if (!pageExists(pageNum)) { console.warn("Attempted to load non-existing page:", pageNum); return; }

  const comic = comics[pageNum] || {};
  const imageElement = document.getElementById('comic-image');
  const titleElement = document.getElementById('comic-title');
  const dateElement  = document.getElementById('comic-date');

  // bump token so older decodes won't update UI
  const mySeq = ++_navSeq;

  // 1) Update lightweight UI immediately
  if (titleElement) titleElement.textContent = comic.title || '';
  if (dateElement)  dateElement.textContent  = formatDateToDisplay(comic.date);

  document.title = `CHICA ZONE — ${comic.title || `Page ${pageNum}`}`;
  let desc = document.querySelector('meta[name="description"]');
  if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
  desc.setAttribute('content', `${comic.title || `Page ${pageNum}`} — ${comic.date || ''}`);

  // 2) Paint a tiny placeholder *now* so the page feels responsive
  if (imageElement) {
    imageElement.setAttribute('fetchpriority','high');
    imageElement.decoding = 'async';
    imageElement.loading  = 'eager';
    imageElement.alt = comic.title ? `${comic.title} — Chica Mob` : `Page ${pageNum} — Chica Mob`;
    imageElement.src = createPlaceholderImage();
  }

  // Prepare URL (keep your cache-bust)
  const src = cacheBust(toAbsolute(comic.image));

  // 3) Decode the target image off-thread, then swap in atomically
  try {
    const probe = new Image();
    probe.decoding = 'async';
    probe.loading  = 'eager';

    const decoded = new Promise((resolve, reject) => {
      probe.onload = resolve;
      probe.onerror = reject;
    });
    probe.src = src;

    if (probe.decode) {
      await probe.decode().catch(() => decoded);
    } else {
      await decoded;
    }

    // If user clicked again meanwhile, bail
    if (mySeq !== _navSeq) return;

    requestAnimationFrame(() => {
      if (imageElement) {
        imageElement.src = src;
        imageElement.alt = comic.title ? `${comic.title} — Chica Mob` : `Page ${pageNum} — Chica Mob`;
      }
    });
  } catch (e) {
    if (mySeq !== _navSeq) return;
    console.warn('[viewer] image failed, showing placeholder:', src);
    if (imageElement) {
      imageElement.src = createPlaceholderImage();
      imageElement.alt = `${comic.title || `Page ${pageNum}`} - Image not available`;
    }
  }

  // 4) Prefetch neighbors at low priority so arrow nav feels instant
  const prev = getPreviousPage(pageNum);
  const next = getNextPage(pageNum);
  const prefetchUrls = [prev, next]
    .filter(Boolean)
    .map(n => comics[n])
    .filter(c => c && c.image)
    .map(c => cacheBust(toAbsolute(c.image)));
  schedulePrefetch(prefetchUrls);

  updateNavigationButtons();
  updatePagePicker(pageNum);
  if (opts.updateHash) updateURL(pageNum);
}

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




