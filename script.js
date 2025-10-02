// Comic data structure - simplified: page number, date, and image
const comics = {
    1: {
        image: 'comics/changa1.png', // Change to .png when you convert the PDF
        date: '2025-10-01' // Proper date format (change to actual date)
    }
    2: {
        image: 'comics/changa2.png',
        date: '2025-10-02'
    };

// Current page number
let currentPage = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    // Check if there's a page number in the URL path or hash
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    let pageNum = null;
    
    // Try to get page from hash first (#1, #page1, etc.)
    if (hash) {
        const hashMatch = hash.match(/#(?:page)?(\d+)$/);
        if (hashMatch) {
            pageNum = parseInt(hashMatch[1]);
        }
    }
    
    // Try to get page from path (/page/1, /1, etc.)
    if (!pageNum) {
        const pageMatch = path.match(/\/(?:page\/)?(\d+)\/?$/) || path.match(/\/(\d+)$/);
        if (pageMatch) {
            pageNum = parseInt(pageMatch[1]);
        }
    }
    
    // Default to page 1 if no page specified
    if (!pageNum || pageNum < 1) {
        pageNum = 1;
    }
    
    currentPage = pageNum;
    loadComic(currentPage);
    setupPagePicker();
}

function formatDateToDisplay(dateStr) {
    if (!dateStr) return 'Unknown Date';
    
    try {
        // Parse the date string and create a date in local timezone to avoid UTC offset issues
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JavaScript
            const day = parseInt(parts[2]);
            const date = new Date(year, month, day);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Unknown Date';
            }
            
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } else {
            // Fallback for other date formats
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return 'Unknown Date';
            }
            
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
            
            <!-- Background -->
            <rect class="horror-bg" width="100%" height="100%"/>
            
            <!-- Dashed border -->
            <rect class="horror-border" x="20" y="20" width="760" height="960"/>
            
            <!-- Floating doodles -->
            <text class="doodle" x="100" y="150" font-size="24" transform="rotate(-15 100 150)">★ MYSTERY ★</text>
            <text class="doodle" x="650" y="200" font-size="20" transform="rotate(20 650 200)">💀 SPOOKY 💀</text>
            <text class="doodle" x="150" y="800" font-size="18" transform="rotate(-10 150 800)">🎪 CHICA MOB 🎪</text>
            <text class="doodle" x="600" y="850" font-size="22" transform="rotate(25 600 850)">✨ SECRETS ✨</text>
            
            <!-- Main text -->
            <text class="horror-text" x="400" y="400" font-size="48">Page Coming Soon!</text>
            <text class="horror-subtitle" x="400" y="500" font-size="24">Convert your PDF to PNG and upload it</text>
            <text class="horror-subtitle" x="400" y="550" font-size="20">The mysteries await...</text>
            
            <!-- Page indicator -->
            <text class="horror-text" x="400" y="650" font-size="36">Page ${currentPage || '?'}</text>
        </svg>
    `)}`;
}

function loadComic(pageNum) {
    const comic = comics[pageNum];
    const pageNumberElement = document.getElementById('page-number');
    const dateElement = document.getElementById('comic-date');
    const imageElement = document.getElementById('comic-image');
    const titleElement = document.getElementById('comic-title');
    
    // Always update page number
    if (pageNumberElement) {
        pageNumberElement.textContent = pageNum;
    }
    
    if (comic) {
        // Comic exists in data
        if (titleElement) {
            titleElement.textContent = `Page ${pageNum}`;
        }
        
        if (dateElement) {
            dateElement.textContent = formatDateToDisplay(comic.date);
        }
        
        // Try to load the image
        const img = new Image();
        img.onload = function() {
            // Image loaded successfully
            imageElement.src = comic.image;
            imageElement.alt = `Page ${pageNum} of Chica Mob`;
        };
        img.onerror = function() {
            // Image failed to load, use placeholder
            console.warn(`Failed to load image: ${comic.image}`);
            imageElement.src = createPlaceholderImage();
            imageElement.alt = `Page ${pageNum} - Image not available`;
        };
        img.src = comic.image;
    } else {
        // Comic doesn't exist in data
        if (titleElement) {
            titleElement.textContent = `Page ${pageNum} - Coming Soon!`;
        }
        
        if (dateElement) {
            dateElement.textContent = 'Mystery Date';
        }
        
        imageElement.src = createPlaceholderImage();
        imageElement.alt = `Page ${pageNum} - Not available yet`;
    }
    
    updateNavigationButtons();
    updatePagePicker(pageNum);
    updateURL(pageNum);
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        const prevPage = getPreviousPage(currentPage);
        prevBtn.disabled = !prevPage;
        
        if (prevPage) {
            prevBtn.innerHTML = `← Previous (${prevPage})`;
        } else {
            prevBtn.innerHTML = '← Previous';
        }
    }
    
    if (nextBtn) {
        const nextPage = getNextPage(currentPage);
        nextBtn.disabled = !nextPage;
        
        if (nextPage) {
            nextBtn.innerHTML = `Next (${nextPage}) →`;
        } else {
            nextBtn.innerHTML = 'Next →';
        }
    }
}

function getPreviousPage(pageNum) {
    // Always allow going to previous page number, even if comic doesn't exist
    return pageNum > 1 ? pageNum - 1 : null;
}

function getNextPage(pageNum) {
    // Allow going to next page up to a reasonable limit
    const maxAvailablePage = Math.max(...Object.keys(comics).map(p => parseInt(p)));
    const maxPage = Math.max(maxAvailablePage + 10, pageNum + 1); // Allow some future pages
    return pageNum < maxPage ? pageNum + 1 : null;
}

function getLatestAvailablePage() {
    const availablePages = Object.keys(comics).map(p => parseInt(p)).sort((a, b) => b - a);
    return availablePages.length > 0 ? availablePages[0] : 1;
}

function navigateComic(direction) {
    let newPage;
    
    if (direction === 'prev') {
        newPage = getPreviousPage(currentPage);
    } else if (direction === 'next') {
        newPage = getNextPage(currentPage);
    }
    
    if (newPage) {
        currentPage = newPage;
        loadComic(currentPage);
    }
}

function goToLatest() {
    const latestPage = getLatestAvailablePage();
    currentPage = latestPage;
    loadComic(currentPage);
}

function goToPage(pageValue) {
    if (!pageValue) return;
    
    const pageNum = parseInt(pageValue);
    if (pageNum > 0) {
        currentPage = pageNum;
        loadComic(currentPage);
    }
}

function updateURL(pageNum) {
    // Update URL hash for better compatibility with hosting services
    const newHash = `#${pageNum}`;
    if (window.location.hash !== newHash) {
        window.location.hash = newHash;
    }
}

function setupPagePicker() {
    const pageInput = document.getElementById('page-input');
    
    if (pageInput) {
        // Set reasonable limits
        pageInput.min = 1;
        pageInput.max = 999; // Allow for future expansion
        pageInput.placeholder = 'Page #';
    }
}

function updatePagePicker(pageNum) {
    const pageInput = document.getElementById('page-input');
    if (pageInput) {
        pageInput.value = pageNum;
    }
}

// Handle hash changes (browser back/forward)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash;
    const hashMatch = hash.match(/#(\d+)$/);
    
    if (hashMatch) {
        const pageNum = parseInt(hashMatch[1]);
        if (pageNum !== currentPage && pageNum > 0) {
            currentPage = pageNum;
            loadComic(currentPage);
        }
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    // Only handle if not typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    
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

// Utility function to add new pages easily
function addPage(pageNum, imagePath, date) {
    comics[pageNum] = {
        image: imagePath,
        date: date
    };
    console.log(`Added page ${pageNum}: ${imagePath} (${date})`);
    
    // Refresh if we're currently viewing this page
    if (currentPage === pageNum) {
        loadComic(currentPage);
    }
}

// Preload images for better performance
function preloadImages() {
    Object.values(comics).forEach(comic => {
        const img = new Image();
        img.src = comic.image;
    });
}

// Preload images after initial load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(preloadImages, 1000);
});
