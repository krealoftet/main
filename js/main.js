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
  initContactForm();
  checkFormSuccess();
  
  // Non-critical: Defer to improve TTI
  requestIdleCallback(() => {
    initImageLazyLoading();
  }, { timeout: 2000 });
  
  // Carousel: Initialize only when visible (IntersectionObserver)
  initCarouselOnVisible();
});

// Polyfill for requestIdleCallback
window.requestIdleCallback = window.requestIdleCallback || function(cb) {
  return setTimeout(cb, 1);
};

/**
 * Initialize sidebar navigation
 */
function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navSidebar = document.querySelector('.nav-sidebar');
  const navOverlay = document.querySelector('.nav-overlay');

  if (!navToggle || !navSidebar || !navOverlay) return;

  function openSidebar() {
    navToggle.setAttribute('aria-expanded', 'true');
    navSidebar.classList.add('nav-sidebar--open');
    navOverlay.classList.add('nav-overlay--visible');
    navOverlay.removeAttribute('aria-hidden');
    document.body.classList.add('nav-open');
  }

  function closeSidebar() {
    navToggle.setAttribute('aria-expanded', 'false');
    navSidebar.classList.remove('nav-sidebar--open');
    navOverlay.classList.remove('nav-overlay--visible');
    navOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-open');
    navToggle.focus();
  }

  navToggle.addEventListener('click', function() {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeSidebar() : openSidebar();
  });

  navOverlay.addEventListener('click', closeSidebar);

  // Close on any nav link click
  navSidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeSidebar);
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      closeSidebar();
    }
  });

  // Sub-menu toggles
  navSidebar.querySelectorAll('.nav-sidebar__sub-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      const sub = document.getElementById(toggle.getAttribute('aria-controls'));
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      if (sub) sub.classList.toggle('nav-sidebar__sub--open', !isExpanded);
    });
  });

  // Auto-expand sub-menu when current page is a sub-item
  navSidebar.querySelectorAll('.nav-sidebar__sub a[aria-current="page"]').forEach(function(link) {
    const sub = link.closest('.nav-sidebar__sub');
    if (!sub) return;
    const toggle = navSidebar.querySelector('[aria-controls="' + sub.id + '"]');
    sub.classList.add('nav-sidebar__sub--open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  });
}

/**
 * Initialize header scroll behavior
 * Adds solid background when scrolling past hero
 */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  // Pages without a hero always show the solid header
  if (!document.querySelector('.hero')) {
    header.classList.add('header--scrolled');
    return;
  }

  const scrollThreshold = 100;

  function updateHeader() {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const RATE_LIMIT_KEY   = 'krealoftet_form_submissions';
const RATE_LIMIT_MAX   = 3;   // max submissions allowed…
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // …within this rolling window (1 hour)

/**
 * Returns { allowed: bool, minutesLeft: number }
 * Records the current attempt if allowed.
 */
function checkRateLimit() {
  const now = Date.now();
  let timestamps = [];

  try {
    timestamps = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
  } catch (_) {
    timestamps = [];
  }

  // Keep only timestamps within the rolling window
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    // Oldest submission determines when window reopens
    const oldestTs = Math.min(...timestamps);
    const minutesLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestTs)) / 60000);
    return { allowed: false, minutesLeft };
  }

  // Record this submission
  timestamps.push(now);
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));
  } catch (_) { /* storage full – fail open */ }

  return { allowed: true, minutesLeft: 0 };
}

const ANLEDNING_ALIASES = {
  hyggetid: 'hyggetid',
  foedselsdag: 'foedselsdag',
  'fødselsdag': 'foedselsdag',
  'boerne-teenage': 'boerne-teenage',
  'boerne-og-teenagefoedselsdag': 'boerne-teenage',
  barsel: 'barsel',
  'barsels-og-moedregrupper': 'barsel',
  polterabend: 'polterabend',
  firma: 'firma',
  'kollegaer-firma': 'firma',
  andet: 'andet'
};

const DANISH_MONTHS_SHORT = [
  'jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.',
  'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'
];

function todayISODate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parseISODate(iso) {
  if (!iso) return null;
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDateDot(iso) {
  const date = parseISODate(iso);
  if (!date) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

function formatDateShortDa(iso) {
  const date = parseISODate(iso);
  if (!date) return '';
  return `${date.getDate()}. ${DANISH_MONTHS_SHORT[date.getMonth()]}`;
}

function getAnledningParam() {
  const fromSearch = new URLSearchParams(window.location.search).get('anledning');
  if (fromSearch) return fromSearch;
  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex !== -1) {
    return new URLSearchParams(hash.slice(queryIndex)).get('anledning');
  }
  return null;
}

/**
 * Initialize contact form for Web3Forms
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  document.documentElement.classList.add('js-enabled');
  const submitBtn = form.querySelector('button[type="submit"]');
  const emailInput = form.querySelector('#email');
  const replyToInput = form.querySelector('[name="replyto"]');
  const subjectInput = form.querySelector('#booking-subject');
  const datesField = form.querySelector('#onskede-datoer');
  const steps = Array.from(form.querySelectorAll('.booking-step'));
  const nextBtn = form.querySelector('#booking-next');
  const nextDateBtn = form.querySelector('#booking-next-date');
  const backBtn = form.querySelector('#booking-back');
  const backContactBtn = form.querySelector('#booking-back-contact');
  const editBtn = form.querySelector('#booking-edit');
  const addDateBtn = form.querySelector('#booking-add-date');
  const antalSelect = form.querySelector('#antal');
  const morningInput = form.querySelector('[name="Tidspunkt pa dagen"][value="Formiddag"]');
  const weekdayHint = form.querySelector('#formiddag-weekday-hint');
  const helpWidgets = Array.from(form.querySelectorAll('.booking-help'));
  const dateInputs = () => Array.from(form.querySelectorAll('.js-booking-date'));
  const syncDateInputDisplay = input => {
    input.closest('.booking-date-input')?.classList.toggle('has-value', Boolean(input.value));
  };

  form.setAttribute('novalidate', '');

  const minDate = todayISODate();
  dateInputs().forEach(input => {
    input.setAttribute('min', minDate);
    syncDateInputDisplay(input);
    input.addEventListener('change', () => {
      syncDateInputDisplay(input);
      updateFormiddagAvailability();
      updateDateDuplicateError();
    });
  });

  const anledningParam = getAnledningParam();
  if (anledningParam) {
    const slug = ANLEDNING_ALIASES[anledningParam.toLowerCase()];
    const match = form.querySelector(`[name="Anledning"][data-anledning="${slug}"]`);
    if (match) match.checked = true;
  }

  function currentStep() {
    const active = form.querySelector('.booking-step.is-active');
    return active ? Number(active.dataset.step) : 1;
  }

  function goToStep(step) {
    steps.forEach(panel => {
      panel.classList.toggle('is-active', Number(panel.dataset.step) === step);
    });
    if (step === 3) updateSummary();

    const focusTargets = {
      1: 'booking-step-1-focus',
      2: 'datoer-label',
      3: 'name'
    };
    const focusTarget = document.getElementById(focusTargets[step]);
    if (!focusTarget) return;
    const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
    const top = focusTarget.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    focusTarget.focus({ preventScroll: true });
  }

  helpWidgets.forEach(helpWidget => {
    const helpButton = helpWidget.querySelector('.booking-help__trigger');
    const tooltip = helpWidget.querySelector('.booking-help__tooltip');
    if (!helpButton || !tooltip) return;

    const setTooltipOpen = isOpen => {
      helpWidget.classList.toggle('is-open', isOpen);
      helpButton.setAttribute('aria-expanded', String(isOpen));
      tooltip.setAttribute('aria-hidden', String(!isOpen));
    };

    helpButton.addEventListener('click', () => setTooltipOpen(true));
    helpButton.addEventListener('focus', () => setTooltipOpen(true));
    helpButton.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        setTooltipOpen(false);
        helpButton.blur();
      }
    });
    helpWidget.addEventListener('focusout', event => {
      if (!helpWidget.contains(event.relatedTarget)) setTooltipOpen(false);
    });
    document.addEventListener('click', event => {
      if (!helpWidget.contains(event.target)) setTooltipOpen(false);
    });
  });

  function selectedAnledning() {
    return form.querySelector('[name="Anledning"]:checked');
  }

  function filledDates() {
    return dateInputs()
      .map(input => input.value)
      .filter(Boolean);
  }

  function updateFormiddagAvailability() {
    const dates = filledDates().map(value => parseISODate(value)).filter(Boolean);
    const hasWeekday = dates.some(date => date.getDay() >= 1 && date.getDay() <= 5);
    const hasWeekend = dates.some(date => date.getDay() === 0 || date.getDay() === 6);
    const morningUnavailable = hasWeekday && !hasWeekend;

    if (morningInput) {
      morningInput.disabled = morningUnavailable;
      if (morningUnavailable && morningInput.checked) morningInput.checked = false;
    }
    if (weekdayHint) {
      weekdayHint.hidden = !hasWeekday;
      weekdayHint.textContent = hasWeekday && hasWeekend
        ? 'I kan vælge formiddag sammen med weekenddatoer, selvom nogle datoer ligger på en hverdag. Skriv det gerne i noterne, så finder vi en løsning.'
        : 'Formiddag kan ikke vælges, når alle datoer ligger på hverdage. Vælg gerne en weekenddato.';
    }
  }

  updateFormiddagAvailability();

  function updateSummary() {
    const summary = document.getElementById('booking-summary-text');
    if (!summary) return;
    const anledning = selectedAnledning()?.value || '';
    const antal = antalSelect?.value || '';
    const dates = filledDates();
    const dateText = dates.map(formatDateShortDa).join(' eller ');
    const timeOfDay = form.querySelector('[name="Tidspunkt pa dagen"]:checked')?.value || '';
    const people = antal === 'Flere end 8' ? 'flere end 8 personer' : `${antal} personer`;
    summary.textContent = [anledning, people, dateText, timeOfDay].filter(Boolean).join(' · ');
  }

  function setFieldError(id, message, controlOverride = null) {
    const errorEl = document.getElementById(id);
    if (!errorEl) return;
    errorEl.textContent = message || '';
    errorEl.classList.toggle('form-error--visible', Boolean(message));
    const field = id.replace(/-error$/, '');
    const control = controlOverride || form.querySelector(`#${field}`) ||
      (field === 'datoer' ? form.querySelector('#dato-1') : null) ||
      form.querySelector(`[name="${field === 'anledning' ? 'Anledning' : ''}"]`);
    if (control) {
      if (message) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
    }
  }

  function clearFieldErrors() {
    form.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('form-error--visible');
    });
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  }

  function validateStep1() {
    clearFieldErrors();
    let firstInvalid = null;

    if (!selectedAnledning()) {
      setFieldError('anledning-error', 'Vælg venligst en anledning');
      firstInvalid = form.querySelector('[name="Anledning"]');
    }

    if (!antalSelect.value) {
      setFieldError('antal-error', 'Vælg venligst antal deltagere');
      firstInvalid = firstInvalid || antalSelect;
    }

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function validateStep2() {
    clearFieldErrors();
    let firstInvalid = null;
    const dates = filledDates();
    const pastDate = dateInputs().find(input => input.value && input.value < minDate);
    const duplicateDateInput = findDuplicateDateInput();

    if (!dates.length) {
      setFieldError('datoer-error', 'Tilføj mindst én dato');
      firstInvalid = form.querySelector('.js-booking-date-row.is-visible .js-booking-date') || addDateBtn;
    } else if (duplicateDateInput) {
      setFieldError('datoer-error', 'Denne dato er allerede valgt. Vælg en anden dato.', duplicateDateInput);
      firstInvalid = duplicateDateInput;
    } else if (pastDate) {
      setFieldError('datoer-error', 'Vælg en dato fra i dag eller senere');
      firstInvalid = pastDate;
    }

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function findDuplicateDateInput() {
    const seenDates = new Set();
    return dateInputs().find(input => {
      if (!input.value) return false;
      if (seenDates.has(input.value)) return true;
      seenDates.add(input.value);
      return false;
    });
  }

  function updateDateDuplicateError() {
    const duplicateDateInput = findDuplicateDateInput();
    const error = document.getElementById('datoer-error');
    const duplicateMessage = 'Denne dato er allerede valgt. Vælg en anden dato.';

    if (duplicateDateInput) {
      setFieldError('datoer-error', duplicateMessage, duplicateDateInput);
    } else if (error.textContent === duplicateMessage) {
      setFieldError('datoer-error', '');
      dateInputs().forEach(input => input.removeAttribute('aria-invalid'));
    }
  }

  function validateStep3() {
    clearFieldErrors();
    const nameInput = form.querySelector('#name');
    let firstInvalid = null;

    if (!nameInput.value.trim()) {
      setFieldError('name-error', 'Skriv venligst jeres navn');
      firstInvalid = nameInput;
    }

    const email = emailInput.value.trim();
    if (!email) {
      setFieldError('email-error', 'Skriv venligst jeres e-mail');
      firstInvalid = firstInvalid || emailInput;
    } else if (!emailInput.checkValidity()) {
      setFieldError('email-error', 'Skriv en gyldig e-mailadresse');
      firstInvalid = firstInvalid || emailInput;
    }

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function visibleDateRows() {
    return Array.from(form.querySelectorAll('.js-booking-date-row')).filter(row =>
      row.classList.contains('is-visible')
    );
  }

  function syncDateRows() {
    const rows = Array.from(form.querySelectorAll('.js-booking-date-row'));
    rows.forEach(row => {
      const filled = Boolean(row.querySelector('.js-booking-date')?.value);
      const visible = row.classList.contains('is-visible') || filled;
      row.classList.toggle('is-visible', visible);
    });
    const canRemove = visibleDateRows().length > 1;
    rows.forEach(row => {
      const removeBtn = row.querySelector('[data-remove-date]');
      if (removeBtn) removeBtn.hidden = !row.classList.contains('is-visible') || !canRemove;
      row.classList.toggle('has-remove-date', row.classList.contains('is-visible') && canRemove);
    });
    rows
      .filter(row => row.classList.contains('is-visible'))
      .concat(rows.filter(row => !row.classList.contains('is-visible')))
      .forEach(row => form.querySelector('#booking-dates').appendChild(row));
    visibleDateRows().forEach((row, index) => {
      const dateNumber = index + 1;
      const input = row.querySelector('.js-booking-date');
      const label = row.querySelector('label');
      const removeBtn = row.querySelector('[data-remove-date]');
      if (input) input.name = `Dato ${dateNumber}`;
      if (label) label.textContent = `Ønsket dato ${dateNumber}`;
      if (removeBtn) removeBtn.setAttribute('aria-label', `Fjern dato ${dateNumber}`);
    });
    const canAdd = visibleDateRows().length < rows.length;
    if (addDateBtn) addDateBtn.hidden = !canAdd;
  }

  if (addDateBtn) {
    addDateBtn.addEventListener('click', () => {
      const rows = Array.from(form.querySelectorAll('.js-booking-date-row'));
      const next = rows.find(row => !row.classList.contains('is-visible'));
      if (!next) return;
      next.classList.add('is-visible');
      const removeBtn = next.querySelector('[data-remove-date]');
      if (removeBtn) removeBtn.hidden = false;
      next.querySelector('.js-booking-date')?.focus();
      syncDateRows();
    });
  }

  form.querySelectorAll('[data-remove-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.booking-date-row');
      const input = row?.querySelector('.js-booking-date');
      if (input) {
        input.value = '';
        syncDateInputDisplay(input);
      }
      row?.classList.remove('is-visible');
      syncDateRows();
      updateFormiddagAvailability();
      updateDateDuplicateError();
    });
  });

  syncDateRows();

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateStep1()) goToStep(2);
    });
  }

  if (nextDateBtn) {
    nextDateBtn.addEventListener('click', () => {
      if (validateStep2()) goToStep(3);
    });
  }

  function backToStep1() {
    goToStep(1);
  }

  function backToStep2() {
    goToStep(2);
  }

  if (backBtn) backBtn.addEventListener('click', backToStep1);
  if (backContactBtn) backContactBtn.addEventListener('click', backToStep2);
  if (editBtn) editBtn.addEventListener('click', backToStep2);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (currentStep() === 1) {
      if (validateStep1()) goToStep(2);
      return;
    }

    if (currentStep() === 2) {
      if (validateStep2()) goToStep(3);
      return;
    }

    if (!validateStep1()) {
      goToStep(1);
      return;
    }
    if (!validateStep2()) {
      goToStep(2);
      return;
    }
    if (!validateStep3()) return;

    // ── Rate limit check ──────────────────────────────────────────────────────
    const { allowed, minutesLeft } = checkRateLimit();
    if (!allowed) {
      showErrorMessage(
        `I har sendt for mange forespørgsler på kort tid. Prøv igen om ${minutesLeft} minut${minutesLeft === 1 ? '' : 'ter'}.`
      );
      return;
    }

    if (emailInput && replyToInput) {
      replyToInput.value = emailInput.value;
    }

    const dates = filledDates();
    const formattedDates = dates.map(formatDateDot);
    if (datesField) datesField.value = formattedDates.join(', ');

    const anledning = selectedAnledning()?.value || '';
    const antal = antalSelect?.value || '';
    const persLabel = antal === 'Flere end 8' ? '8+ pers.' : `${antal} pers.`;
    if (subjectInput) {
      subjectInput.value = `Booking-forespørgsel: ${anledning} · ${persLabel} · ${formattedDates.join(' / ')}`;
    }

    const formData = new FormData(form);
    formData.set('E-mail', emailInput.value.trim());
    formData.delete('email');
    formData.set('Onskede datoer', formattedDates.join(', '));
    if (!form.querySelector('#fleksibel')?.checked) {
      formData.set('Fleksibel med dato', 'Nej');
    }
    formData.delete('Dato 1');
    formData.delete('Dato 2');
    formData.delete('Dato 3');

    const originalHTML = submitBtn.innerHTML;

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

      if (response.ok && data.success) {
        showSuccessMessage();
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
  const success = document.getElementById('booking-success');
  if (!form || !success) return;

  removeFormMessages(form);
  form.hidden = true;
  success.hidden = false;
  form.closest('.contact-form-wrapper')?.classList.add('has-booking-success');

  const heading = success.querySelector('#booking-success-title') || success;
  const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
  const top = heading.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  heading.focus({ preventScroll: true });
}

/**
 * Show error message after form submission failure
 */
function showErrorMessage(message) {
  const form = document.getElementById('contact-form');
  if (!form) return;

  removeFormMessages(form);

  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-message form-error-banner';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.setAttribute('aria-live', 'assertive');
  const errorText = document.createElement('span');
  errorText.textContent = message;
  errorDiv.appendChild(errorText);

  const mount = form.querySelector('#booking-form-alert') || form;
  mount.prepend(errorDiv);

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
    
    // Use center alignment when there are more slides than visible
    // This centers the focused card when there's at least 1 card before and after
    const useCenter = slideCount > 3 || !allCardsFit;
    
    return {
      loop: false,
      align: useCenter ? 'center' : 'start',
      containScroll: 'trimSnaps',
      dragFree: false,
      skipSnaps: true,
      duration: 42,
      startIndex: 0
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

