// Comic data structure - organized by page number
const comics = {
    1: {
        image: 'comics/page001.png',
        date: '100125'
    },
    // Add more pages as you create them
};

// Current page number
let currentPage = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    // Check if there's a page number in the URL path
    const path = window.location.pathname;
    const pageMatch = path.match(/\/page\/(\d+)$/) || path.match(/\/(\d+)$/);
    
    if (pageMatch) {
        currentPage = parseInt(pageMatch[1]);
        loadComic(currentPage);
    } else {
        // Default to the latest available page
        const latestPage = getLatestAvailablePage();
        currentPage = latestPage || 1;
        
        // Update URL without page reload
        updateURL(currentPage);
        loadComic(currentPage);
    }
    
    // Set up page picker
    setupPagePicker();
}

function formatDateToDisplay(dateStr) {
    if (!dateStr) return 'Unknown Date';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function loadComic(pageNum) {
    const comic = comics[pageNum];
    const titleElement = document.getElementById('comic-title');
    const pageNumberElement = document.getElementById('page-number');
    const dateElement = document.getElementById('comic-date');
    const imageElement = document.getElementById('comic-image');
    
    if (comic) {
        titleElement.textContent = comic.title;
        pageNumberElement.textContent = pageNum;
        dateElement.textContent = formatDateToDisplay(comic.date);
        imageElement.src = comic.image;
        imageElement.alt = comic.alt;
        
        // Handle image load error
        imageElement.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjEwMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzJkMWI2OSIgc3Ryb2tlPSIjZmY0NDU3IiBzdHJva2Utd2lkdGg9IjMiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjQ1JSIgZm9udC1mYW1pbHk9IkNyZWVwc3RlciwgY3Vyc2l2ZSIgZm9udC1zaXplPSIzNiIgZmlsbD0iIzAwZGRkZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGFnZSBDb21pbmcgU29vbiE8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJTcGVjaWFsIEVsaXRlLCBtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZjQ0NTciIHRleHQtYW5jaG9yPSJtaWRkbGUiPnRoZSBteXN0ZXJpZXMgYXdhaXQuLi48L3RleHQ+Cjwvc3ZnPg==';
            this.alt = 'Page not available yet';
        };
    } else {
        titleElement.textContent = 'Page Coming Soon!';
        pageNumberElement.textContent = pageNum;
        dateElement.textContent = 'Mystery Date';
        imageElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjEwMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzJkMWI2OSIgc3Ryb2tlPSIjZmY0NDU3IiBzdHJva2Utd2lkdGg9IjMiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjQ1JSIgZm9udC1mYW1pbHk9IkNyZWVwc3RlciwgY3Vyc2l2ZSIgZm9udC1zaXplPSIzNiIgZmlsbD0iIzAwZGRkZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGFnZSBDb21pbmcgU29vbiE8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJTcGVjaWFsIEVsaXRlLCBtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZjQ0NTciIHRleHQtYW5jaG9yPSJtaWRkbGUiPnRoZSBteXN0ZXJpZXMgYXdhaXQuLi48L3RleHQ+Cjwvc3ZnPg==';
        imageElement.alt = 'Page not available yet';
    }
    
    updateNavigationButtons();
    updatePagePicker(pageNum);
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    const prevPage = getPreviousPage(currentPage);
    const nextPage = getNextPage(currentPage);
    
    prevBtn.disabled = !prevPage;
    nextBtn.disabled = !nextPage;
}

function getPreviousPage(pageNum) {
    const availablePages = Object.keys(comics).map(p => parseInt(p)).sort((a, b) => a - b);
    const currentIndex = availablePages.indexOf(pageNum);
    
    if (currentIndex > 0) {
        return availablePages[currentIndex - 1];
    }
    
    // If current page is not in comics, find the latest page before it
    for (let i = availablePages.length - 1; i >= 0; i--) {
        if (availablePages[i] < pageNum) {
            return availablePages[i];
        }
    }
    
    return null;
}

function getNextPage(pageNum) {
    const availablePages = Object.keys(comics).map(p => parseInt(p)).sort((a, b) => a - b);
    const currentIndex = availablePages.indexOf(pageNum);
    
    if (currentIndex >= 0 && currentIndex < availablePages.length - 1) {
        return availablePages[currentIndex + 1];
    }
    
    // If current page is not in comics, find the earliest page after it
    for (let i = 0; i < availablePages.length; i++) {
        if (availablePages[i] > pageNum) {
            return availablePages[i];
        }
    }
    
    return null;
}

function getLatestAvailablePage() {
    const availablePages = Object.keys(comics).map(p => parseInt(p)).sort((a, b) => a - b);
    return availablePages[availablePages.length - 1];
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
        updateURL(currentPage);
        loadComic(currentPage);
    }
}

function goToLatest() {
    const latestPage = getLatestAvailablePage();
    currentPage = latestPage || 1;
    updateURL(currentPage);
    loadComic(currentPage);
}

function goToPage(pageValue) {
    if (!pageValue) return;
    
    const pageNum = parseInt(pageValue);
    if (pageNum > 0) {
        currentPage = pageNum;
        updateURL(currentPage);
        loadComic(currentPage);
    }
}

function updateURL(pageNum) {
    const newURL = `/page/${pageNum}`;
    window.history.pushState({ page: pageNum }, '', newURL);
}

function setupPagePicker() {
    const pageInput = document.getElementById('page-input');
    
    // Set max page to the highest available page
    const availablePages = Object.keys(comics).map(p => parseInt(p));
    if (availablePages.length > 0) {
        const maxPage = Math.max(...availablePages);
        pageInput.max = maxPage;
    }
    
    // Set min page to 1
    pageInput.min = 1;
}

function updatePagePicker(pageNum) {
    const pageInput = document.getElementById('page-input');
    pageInput.value = pageNum;
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.page) {
        currentPage = event.state.page;
        loadComic(currentPage);
    } else {
        initializePage();
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft') {
        navigateComic('prev');
    } else if (event.key === 'ArrowRight') {
        navigateComic('next');
    }
});

// Add a function to easily add new pages (for development)
function addPage(pageNum, title, imagePath, altText, date) {
    comics[pageNum] = {
        title: title,
        image: imagePath,
        alt: altText,
        date: date
    };
    console.log(`Added page ${pageNum}: ${title}`);
}
