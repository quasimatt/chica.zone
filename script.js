/*********************************
 * 2) COMIC VIEWER CONFIG & STATE
 *********************************/
// Existing comics ONLY — navigation will be limited to these keys.
const comics = {
  1: { image: 'comics/changa1.png', date: '2025-10-01' },
  2: { image: 'comics/changa2.png', date: '2025-10-02' },
  3: { image: 'comics/changa3.png', date: '2025-10-03' },
  4: { image: 'comics/changa4.png', date: '2025-10-04' },
  5: { image: 'comics/changa5.png', date: '2025-10-05' }
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
          .doodle { fill:
