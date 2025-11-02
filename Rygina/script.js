// Initialize Lucide Icons
lucide.createIcons();

// --- 1. Mobile Menu Toggle Logic ---
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

function toggleMobileMenu() {
    mobileMenu.classList.toggle('hidden');
    const iconElement = mobileMenuButton.querySelector('svg');
    if (mobileMenu.classList.contains('hidden')) {
        iconElement.parentNode.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
    } else {
        iconElement.parentNode.innerHTML = '<i data-lucide="x" class="w-6 h-6"></i>';
    }
    lucide.createIcons();
}

function closeMobileMenu() {
    if (!mobileMenu.classList.contains('hidden')) {
        toggleMobileMenu();
    }
}

mobileMenuButton.addEventListener('click', toggleMobileMenu);

// --- 2. Scroll-based Fade-In Animation ---
const faders = document.querySelectorAll('.fade-in-section');
const appearOptions = {
    threshold: 0.2,
    rootMargin: "0px 0px -100px 0px"
};
const appearOnScroll = new IntersectionObserver(function (entries, appearOnScroll) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        }
        entry.target.classList.add('is-visible');
        appearOnScroll.unobserve(entry.target);
    });
}, appearOptions);

faders.forEach(fader => {
    if (fader.id === 'home') {
        fader.classList.add('is-visible'); // Make home visible by default
    } else {
        appearOnScroll.observe(fader);
    }
});

// --- 3. Smooth scrolling for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Offset for sticky header
                behavior: 'smooth'
            });
            // Close mobile menu if a link is clicked
            if (this.classList.contains('nav-link-mobile')) {
                closeMobileMenu();
            }
        }
    });
});

// --- 4. FIXED: Active Navigation Highlighting on Scroll ---
const sections = document.querySelectorAll('.main-section');
const navLinks = document.querySelectorAll('#desktop-nav .nav-link');
const mobileNavLinks = document.querySelectorAll('#mobile-menu .nav-link-mobile');

// New, more reliable observer options
const observerOptions = {
    root: null, // observes intersections in the viewport
    // This defines the "trigger zone":
    // -80px from top (for the header)
    // 0px from left/right
    // -40% from bottom (meaning the trigger zone stops 40% from the viewport bottom)
    rootMargin: '-80px 0px -40% 0px',
    threshold: 0 // Trigger as soon as *any part* of the section enters this zone
};

const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');

            // Remove 'active' from ALL links
            navLinks.forEach(link => link.classList.remove('active'));
            mobileNavLinks.forEach(link => link.classList.remove('active'));

            // Find the matching links
            const desktopLink = document.querySelector(`#desktop-nav .nav-link[href="#${id}"]`);
            const mobileLink = document.querySelector(`#mobile-menu .nav-link-mobile[href="#${id}"]`);

            // Add 'active' to the intersecting one
            if (desktopLink) desktopLink.classList.add('active');
            if (mobileLink) mobileLink.classList.add('active');
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});


/*
=========================================
=== SECTION 5: NEW GALLERY MODAL LOGIC ===
=========================================
*/

// --- CONFIGURATION ---
const GALLERIES_PATH = "Rygina/galleries/";
const MANIFEST_FILE = "galleries.json";

// --- DOM ELEMENTS ---
const galleryModal = document.getElementById('gallery-modal');
const gallerySlider = document.getElementById('gallery-slider');
const galleryClose = document.getElementById('gallery-close');
const galleryPrev = document.getElementById('gallery-prev');
const galleryNext = document.getElementById('gallery-next');
const galleryCounter = document.getElementById('gallery-counter');
// Note: galleryTriggers are fetched later, after data is loaded

// --- GLOBAL STATE ---
let allGalleries = [];
let currentImages = [];
let currentImageIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

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
        
        // Once data is loaded, find triggers and add listeners
        initializeGalleryTriggers();
    } catch (error) {
        console.error("Could not fetch gallery data:", error);
    }
}

/**
 * Finds all gallery triggers on the page and adds click listeners.
 */
function initializeGalleryTriggers() {
    const galleryTriggers = document.querySelectorAll('[data-gallery-id]');
    
    galleryTriggers.forEach(trigger => {
        const galleryId = trigger.getAttribute('data-gallery-id');
        // Check if this gallery actually exists in our loaded data
        const galleryExists = allGalleries.some(g => g.id === galleryId);
        
        if (galleryExists) {
            trigger.addEventListener('click', () => {
                openGallery(galleryId);
            });
        } else {
            // Optional: Log a warning if a trigger has no matching gallery
            console.warn(`A trigger for gallery "${galleryId}" was found, but this gallery does not exist in ${MANIFEST_FILE}.`);
        }
    });
}

/**
 * Opens the modal and populates it with images for the selected gallery.
 */
function openGallery(galleryId) {
    const gallery = allGalleries.find(g => g.id === galleryId);
    if (!gallery || !gallery.images || !gallery.images.length === 0) {
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
        // Add alt attribute for accessibility
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

    // Move the slider using CSS transform
    gallerySlider.style.transform = `translateX(-${index * 100}%)`;

    // Update counter
    galleryCounter.textContent = `${index + 1} / ${currentImages.length}`;

    // Update button visibility
    // Use gallery-hidden class from style.css
    galleryPrev.classList.toggle('gallery-hidden', index === 0);
    galleryNext.classList.toggle('gallery-hidden', index === currentImages.length - 1);
}

// --- 3. EVENT HANDLERS (for modal) ---
// We check if the elements exist first, in case this script is
// on a page without the modal (though portfolio.html has it)

if (galleryClose) {
    galleryClose.addEventListener('click', closeGallery);
}
if (galleryNext) {
    galleryNext.addEventListener('click', nextImage);
}
if (galleryPrev) {
    galleryPrev.addEventListener('click', prevImage);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!galleryModal || !galleryModal.classList.contains('active')) {
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
if (gallerySlider) {
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
}

// --- INITIALIZATION ---
// Load gallery data when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    loadGalleryData();
    // Re-run lucide icons just in case
    if (window.lucide) {
        window.lucide.createIcons();
    }
});