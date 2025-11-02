// --- CONFIGURATION ---
const GALLERIES_PATH = "Rygina/galleries/";
const MANIFEST_FILE = "galleries.json";

// --- DOM ELEMENTS ---
const galleryGrid = document.getElementById('gallery-grid');
const galleryModal = document.getElementById('gallery-modal');
const gallerySlider = document.getElementById('gallery-slider');
const galleryClose = document.getElementById('gallery-close');
const galleryPrev = document.getElementById('gallery-prev');
const galleryNext = document.getElementById('gallery-next');
const galleryCounter = document.getElementById('gallery-counter');

// --- GLOBAL STATE ---
let allGalleries = [];
let currentImages = [];
let currentImageIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

// --- 1. LOAD AND BUILD GALLERY PAGE ---

/**
 * Fetches the galleries.json manifest file.
 */
async function loadGalleryData() {
    try {
        const response = await fetch(MANIFEST_FILE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allGalleries = await response.json();
        // Once data is loaded, build the grid
        buildGalleryGrid();
    } catch (error) {
        console.error("Could not fetch gallery data:", error);
        if (galleryGrid) {
            galleryGrid.innerHTML = '<p class="text-red-500">Could not load galleries. Please check the manifest file.</p>';
        }
    }
}

/**
 * Creates the HTML for each gallery card and adds it to the grid.
 */
function buildGalleryGrid() {
    if (!galleryGrid) {
        return; // Exit if we're not on the gallery page
    }
    
    if (allGalleries.length === 0) {
        galleryGrid.innerHTML = '<p class="text-gray-600">No galleries found.</p>';
        return;
    }

    // Clear grid
    galleryGrid.innerHTML = '';

    allGalleries.forEach(gallery => {
        // Skip gallery if it has no title, id, or images
        if (!gallery.title || !gallery.id || !gallery.images || gallery.images.length === 0) {
            return;
        }

        const coverImage = gallery.images[0];
        const coverImagePath = `${GALLERIES_PATH}${gallery.id}/${coverImage}`;
        
        // Create the card element
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.setAttribute('data-gallery-id', gallery.id);
        
        card.innerHTML = `
            <img src="${coverImagePath}" alt="${gallery.title}" />
            <div class="gallery-card-overlay"></div>
            <h3 class="gallery-card-title">${gallery.title}</h3>
        `;

        // Add click listener to open the modal
        card.addEventListener('click', () => {
            openGallery(gallery.id);
        });

        galleryGrid.appendChild(card);
    });

    // Re-initialize Lucide icons if any were added dynamically
    if (window.lucide) {
        window.lucide.createIcons();
    }
}


// --- 2. GALLERY MODAL LOGIC ---

/**
 * Opens the modal and populates it with images for the selected gallery.
 */
function openGallery(galleryId) {
    const gallery = allGalleries.find(g => g.id === galleryId);
    if (!gallery || !gallery.images || gallery.images.length === 0) {
        console.warn(`Gallery with id "${galleryId}" not found or is empty.`);
        return;
    }

    currentImages = gallery.images;
    currentImageIndex = 0;
    
    // Clear old images
    gallerySlider.innerHTML = '';

    // Create and add new image slides
    currentImages.forEach((imageName, index) => {
        const imagePath = `${GALLERIES_PATH}${gallery.id}/${imageName}`;
        const slide = document.createElement('div');
        slide.className = 'gallery-image-container';
        slide.innerHTML = `<img src="${imagePath}" alt="${gallery.title} - Image ${index + 1}">`;
        gallerySlider.appendChild(slide);
    });

    // Show the first image
    showImage(0);

    // Show the modal
    galleryModal.classList.add('active');
    document.body.classList.add('modal-open'); // Prevent background scrolling
}

/**
 * Closes the gallery modal.
 */
function closeGallery() {
    galleryModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    // Clear images to save memory
    gallerySlider.innerHTML = '';
    currentImages = [];
}

/**
 * Navigates to the next image in the slider.
 */
function nextImage() {
    if (currentImageIndex < currentImages.length - 1) {
        showImage(currentImageIndex + 1);
    }
}

/**
 * Navigates to the previous image in the slider.
 */
function prevImage() {
    if (currentImageIndex > 0) {
        showImage(currentImageIndex - 1);
    }
}

/**
 * Displays a specific image by its index.
 */
function showImage(index) {
    if (index < 0 || index >= currentImages.length) {
        return;
    }
    
    currentImageIndex = index;

    // --- THIS IS THE FIX ---
    // Use proper backticks (`)
    gallerySlider.style.transform = `translateX(-${index * 100}%)`;

    // Update counter
    galleryCounter.textContent = `${index + 1} / ${currentImages.length}`;
    // --- END OF FIX ---

    // Update button visibility
    galleryPrev.classList.toggle('gallery-hidden', index === 0);
    galleryNext.classList.toggle('gallery-hidden', index === currentImages.length - 1);
}

// --- 3. EVENT HANDLERS ---

// Close button
galleryClose.addEventListener('click', closeGallery);

// Next/Prev buttons
galleryNext.addEventListener('click', nextImage);
galleryPrev.addEventListener('click', prevImage);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!galleryModal.classList.contains('active')) {
        return;
    }
    if (e.key === 'ArrowRight') {
        nextImage();
    } else if (e.key === 'ArrowLeft') {
        prevImage();
    } else if (e.key === 'Escape') {
        closeGallery();
    }
});

// Swipe gestures
gallerySlider.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchEndX = 0; // Reset
});

gallerySlider.addEventListener('touchmove', (e) => {
    touchEndX = e.touches[0].clientX;
});

gallerySlider.addEventListener('touchend', () => {
    if (touchEndX === 0) return; // No move
    
    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // Minimum pixels to count as swipe

    if (swipeDistance > minSwipeDistance) {
        // Swiped left
        nextImage();
    } else if (swipeDistance < -minSwipeDistance) {
        // Swiped right
        prevImage();
    }
    
    // Reset values
    touchStartX = 0;
    touchEndX = 0;
});

// --- INITIALIZATION ---
// Load everything when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    loadGalleryData();
    // Initialize Lucide icons on this page
    if (window.lucide) {
        window.lucide.createIcons();
    }
});