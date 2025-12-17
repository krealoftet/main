/**
 * Clay Workshop Main JavaScript
 * Handles navigation, form validation, and interactive elements
 */

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
  initNavigation();
  initHeaderScroll();
  initFormValidation();
  initSmoothScrolling();
  initImageLazyLoading();
  initGalleryCarousel();
});

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
 * Initialize form validation
 */
function initFormValidation() {
  const contactForm = document.querySelector('.contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const formData = new FormData(contactForm);
      const formFields = ['name', 'email', 'message'];
      let isValid = true;

      // Clear previous errors
      formFields.forEach(field => {
        const errorElement = document.getElementById(`${field}-error`);
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.classList.remove('form-error--visible');
        }
      });

      // Validate each field
      formFields.forEach(field => {
        const input = contactForm.querySelector(`[name="${field}"]`);
        const value = formData.get(field);
        const errorElement = document.getElementById(`${field}-error`);

        if (!value || value.trim() === '') {
          showFieldError(errorElement, `${capitalizeFirst(field)} is required.`);
          isValid = false;
        } else if (field === 'email' && !isValidEmail(value)) {
          showFieldError(errorElement, 'Please enter a valid email address.');
          isValid = false;
        }
      });

      if (isValid) {
        // Here you would typically send the form data to a server
        showSuccessMessage();
        contactForm.reset();
      }
    });
  }
}

/**
 * Show field error message
 * @param {HTMLElement} errorElement 
 * @param {string} message 
 */
function showFieldError(errorElement, message) {
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('form-error--visible');
  }
}

/**
 * Show success message after form submission
 */
function showSuccessMessage() {
  // Create temporary success message
  const successDiv = document.createElement('div');
  successDiv.className = 'form-success';
  successDiv.textContent = 'Thank you! Your message has been sent successfully.';
  successDiv.style.cssText = `
    background: var(--state-success);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-weight: 500;
  `;

  const form = document.querySelector('.contact-form');
  form.insertBefore(successDiv, form.firstChild);

  // Remove after 5 seconds
  setTimeout(() => {
    successDiv.remove();
  }, 5000);
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Capitalize first letter
 * @param {string} str 
 * @returns {string}
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

