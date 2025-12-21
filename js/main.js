/**
 * Clay Workshop Main JavaScript
 * Handles navigation, form validation, and interactive elements
 */

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
  // Critical: Initialize immediately (above-the-fold interactions)
  initNavigation();
  initHeaderScroll();
  initSmoothScrolling();
  
  // Non-critical: Defer to improve TTI
  requestIdleCallback(() => {
    initContactForm();
    initImageLazyLoading();
    checkFormSuccess();
  }, { timeout: 2000 });
  
  // Carousel: Initialize only when visible (IntersectionObserver)
  initCarouselOnVisible();
});

// Polyfill for requestIdleCallback
window.requestIdleCallback = window.requestIdleCallback || function(cb) {
  return setTimeout(cb, 1);
};

/**
 * Initialize mobile navigation
 */
function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('nav-menu--open');
    });

    // Close menu when clicking on a link
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('nav-menu--open');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.navigation')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('nav-menu--open');
      }
    });
  }
}

/**
 * Initialize header scroll behavior
 * Adds solid background when scrolling past hero
 */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  
  if (!header) return;

  const scrollThreshold = 100; // pixels to scroll before adding background

  function updateHeader() {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }

  // Run on load
  updateHeader();

  // Run on scroll with passive listener for performance
  window.addEventListener('scroll', updateHeader, { passive: true });
}

/**
 * Initialize contact form for Web3Forms
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  const submitBtn = form.querySelector('button[type="submit"]');
  const emailInput = form.querySelector('[name="email"]');
  const replyToInput = form.querySelector('[name="replyto"]');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Update replyto with email value
    if (emailInput && replyToInput) {
      replyToInput.value = emailInput.value;
    }
    
    const formData = new FormData(form);
    
    // Store original button content
    const originalHTML = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = `
      <svg class="button-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="20" height="20">
        <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Sender...
    `;
    submitBtn.disabled = true;
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showSuccessMessage();
        form.reset();
      } else {
        showErrorMessage(data.message || 'Der opstod en fejl. Prøv igen.');
      }
    } catch (error) {
      showErrorMessage('Noget gik galt. Prøv venligst igen.');
    } finally {
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
    }
  });
}

/**
 * Check for form submission success via URL parameter (fallback)
 */
function checkFormSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('success') === 'true') {
    showSuccessMessage();
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, newUrl);
  }
}


/**
 * Show success message after form submission
 */
function showSuccessMessage() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  // Remove any existing messages
  removeFormMessages(form);
  
  // Create success message
  const successDiv = document.createElement('div');
  successDiv.className = 'form-message form-success';
  successDiv.setAttribute('role', 'alert');
  successDiv.setAttribute('aria-live', 'polite');
  successDiv.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
      <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
    </svg>
    <span>Tak for din besked! Vi vender tilbage hurtigst muligt.</span>
  `;
  successDiv.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--state-success);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-weight: 500;
  `;

  form.insertBefore(successDiv, form.firstChild);

  // Remove after 8 seconds
  setTimeout(() => {
    successDiv.remove();
  }, 8000);
}

/**
 * Show error message after form submission failure
 */
function showErrorMessage(message) {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  // Remove any existing messages
  removeFormMessages(form);
  
  // Create error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-message form-error';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.setAttribute('aria-live', 'assertive');
  errorDiv.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
      <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
    </svg>
    <span>${message}</span>
  `;
  errorDiv.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--state-warning);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-weight: 500;
  `;

  form.insertBefore(errorDiv, form.firstChild);

  // Remove after 8 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 8000);
}

/**
 * Remove existing form messages
 */
function removeFormMessages(form) {
  const existingMessages = form.querySelectorAll('.form-message');
  existingMessages.forEach(msg => msg.remove());
}


/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScrolling() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        event.preventDefault();
        
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Initialize lazy loading for images
 */
function initImageLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));
  }
}

/**
 * Initialize carousel only when it enters the viewport
 * Improves TTI by deferring non-critical JS
 */
function initCarouselOnVisible() {
  const emblaNode = document.querySelector('.gallery-carousel');
  if (!emblaNode) return;
  
  // Use IntersectionObserver to lazy-init the carousel
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initGalleryCarousel();
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '200px 0px', // Start loading 200px before visible
      threshold: 0
    });
    
    observer.observe(emblaNode);
  } else {
    // Fallback for older browsers
    initGalleryCarousel();
  }
}

/**
 * Initialize gallery carousel with Embla
 */
function initGalleryCarousel() {
  const emblaNode = document.querySelector('.gallery-carousel');
  if (!emblaNode || typeof EmblaCarousel === 'undefined') return;
  
  const viewportNode = emblaNode.querySelector('.embla__viewport');
  const dotsNode = emblaNode.querySelector('.embla__dots');
  const slides = viewportNode.querySelectorAll('.embla__slide');
  const slideCount = slides.length;
  
  // Desktop breakpoint where all 3 cards fit
  const desktopBreakpoint = 1100;
  
  let embla = null;
  
  // Get options based on viewport and slide count
  const getOptions = () => {
    const isDesktop = window.innerWidth >= desktopBreakpoint;
    const allCardsFit = isDesktop && slideCount <= 3;
    
    // Use center alignment when not all cards fit
    // But keep loop disabled to prevent glitching
    const useCenter = slideCount > 3 || !allCardsFit;
    
    return {
      loop: false,
      align: useCenter ? 'center' : 'start',
      containScroll: 'trimSnaps',
      dragFree: false,
      skipSnaps: false
    };
  };
  
  // Initialize carousel
  const initCarousel = () => {
    if (embla) embla.destroy();
    dotsNode.innerHTML = '';
    
    embla = EmblaCarousel(viewportNode, getOptions());
    
    // Generate dots
    const scrollSnaps = embla.scrollSnapList();
    
    scrollSnaps.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'embla__dot';
      dot.setAttribute('aria-label', `Gå til slide ${index + 1}`);
      dot.addEventListener('click', () => embla.scrollTo(index));
      dotsNode.appendChild(dot);
    });
    
    const dots = dotsNode.querySelectorAll('.embla__dot');
    
    // Update dots on select
    const updateDots = () => {
      const selectedIndex = embla.selectedScrollSnap();
      dots.forEach((dot, index) => {
        dot.classList.toggle('embla__dot--selected', index === selectedIndex);
      });
    };
    
    embla.on('select', updateDots);
    updateDots();
  };
  
  // Initialize
  initCarousel();
  
  // Reinitialize on resize when crossing breakpoint
  let resizeTimeout;
  let lastWidth = window.innerWidth;
  
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const crossedBreakpoint = 
        (lastWidth < desktopBreakpoint && window.innerWidth >= desktopBreakpoint) ||
        (lastWidth >= desktopBreakpoint && window.innerWidth < desktopBreakpoint);
      
      if (crossedBreakpoint) {
        initCarousel();
      }
      lastWidth = window.innerWidth;
    }, 150);
  });
}

