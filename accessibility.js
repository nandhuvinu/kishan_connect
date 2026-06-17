/**
 * Accessibility & Mobile Utilities
 * Enhances user experience for all devices and abilities
 */

/**
 * Initialize accessibility features
 * Call this on page load
 */
function initializeAccessibility() {
  // Skip link functionality
  setupSkipLink();
  
  // Keyboard navigation
  setupKeyboardNavigation();
  
  // ARIA live regions
  setupLiveRegions();
  
  // Mobile menu
  setupMobileMenu();
  
  console.log('✅ Accessibility features initialized');
}

/**
 * Setup skip to main content link
 */
function setupSkipLink() {
  const skipLink = document.querySelector('.skip-link');
  if (!skipLink) return;
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Tab key handling
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
    
    // Escape key to close modals/menus
    if (e.key === 'Escape') {
      closeOpenModals();
      closeMobileMenu();
    }
    
    // Enter/Space on buttons
    if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') {
      e.preventDefault();
      e.target.click();
    }
  });
  
  // Remove keyboard-nav class on mouse usage
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
}

/**
 * Setup ARIA live regions for dynamic content
 */
function setupLiveRegions() {
  // Create live region for announcements if it doesn't exist
  let liveRegion = document.querySelector('[role="status"]');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  
  // Create alert region for urgent announcements
  let alertRegion = document.querySelector('[role="alert"]');
  if (!alertRegion) {
    alertRegion = document.createElement('div');
    alertRegion.setAttribute('role', 'alert');
    alertRegion.setAttribute('aria-live', 'assertive');
    alertRegion.setAttribute('aria-atomic', 'true');
    alertRegion.className = 'sr-only';
    document.body.appendChild(alertRegion);
  }
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {boolean} isUrgent - If true, uses alert region (urgent)
 */
function announceToScreenReader(message, isUrgent = false) {
  const regionRole = isUrgent ? 'alert' : 'status';
  const region = document.querySelector(`[role="${regionRole}"].sr-only`);
  
  if (region) {
    region.textContent = message;
  }
}

/**
 * Setup mobile menu
 */
function setupMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('nav');
  
  if (!hamburger || !menu) return;
  
  hamburger.addEventListener('click', () => {
    const isOpen = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', !isOpen);
    menu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', !isOpen);
    announceToScreenReader(isOpen ? 'Menu closed' : 'Menu opened');
  });
  
  // Close menu when clicking menu items
  const menuItems = menu.querySelectorAll('a');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menu.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

/**
 * Close all open modals
 */
function closeOpenModals() {
  const modals = document.querySelectorAll('[role="dialog"]');
  modals.forEach(modal => {
    if (modal.getAttribute('aria-hidden') === 'false') {
      closeModal(modal);
    }
  });
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
  const menu = document.querySelector('nav');
  const hamburger = document.querySelector('.hamburger');
  
  if (menu) {
    menu.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
  }
  
  if (hamburger) {
    hamburger.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Open modal dialog
 * @param {HTMLElement} modalElement - Modal element to open
 */
function openModal(modalElement) {
  modalElement.setAttribute('aria-hidden', 'false');
  modalElement.style.display = 'block';
  
  // Focus first focusable element
  const firstFocusable = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) {
    firstFocusable.focus();
  }
  
  // Trap focus within modal
  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  modalElement.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
  
  announceToScreenReader(`Modal opened: ${modalElement.getAttribute('aria-label') || 'Dialog'}`);
}

/**
 * Close modal dialog
 * @param {HTMLElement} modalElement - Modal element to close
 */
function closeModal(modalElement) {
  modalElement.setAttribute('aria-hidden', 'true');
  modalElement.style.display = 'none';
  announceToScreenReader('Modal closed');
}

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if reduced motion preference set
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers dark mode
 * @returns {boolean} True if dark mode preference set
 */
function prefersDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Check if user prefers high contrast
 * @returns {boolean} True if high contrast preference set
 */
function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Set up responsive breakpoint listener
 * @param {string} breakpoint - Breakpoint name (sm, md, lg, xl)
 * @param {function} callback - Callback function
 */
function onBreakpoint(breakpoint, callback) {
  const breakpoints = {
    sm: '(max-width: 640px)',
    md: '(max-width: 768px)',
    lg: '(max-width: 1024px)',
    xl: '(min-width: 1280px)'
  };
  
  const media = window.matchMedia(breakpoints[breakpoint]);
  media.addListener(callback);
  callback(media); // Call immediately
}

/**
 * Get viewport dimensions
 * @returns {object} Viewport width and height
 */
function getViewport() {
  return {
    width: Math.max(document.documentElement.clientWidth, window.innerWidth),
    height: Math.max(document.documentElement.clientHeight, window.innerHeight)
  };
}

/**
 * Disable animations if user prefers reduced motion
 */
function respectMotionPreferences() {
  if (prefersReducedMotion()) {
    document.documentElement.style.setProperty('--transition', 'all 0.01ms ease');
    document.documentElement.style.setProperty('--transition-bounce', 'all 0.01ms ease');
  }
}

/**
 * Apply dark mode if user prefers it
 */
function applyDarkModePreference() {
  if (prefersDarkMode()) {
    document.documentElement.style.setProperty('--bg-color', '#1a1a1a');
    document.documentElement.style.setProperty('--text-color', '#ffffff');
  }
}

/**
 * Set data attributes for accessibility testing
 * @param {HTMLElement} element - Element to set attributes on
 * @param {string} testId - Test ID value
 */
function setTestId(element, testId) {
  element.setAttribute('data-testid', testId);
}

// Export for use
if (typeof window !== 'undefined') {
  window.AccessibilityUtils = {
    initializeAccessibility,
    announceToScreenReader,
    openModal,
    closeModal,
    isMobileDevice,
    prefersReducedMotion,
    prefersDarkMode,
    prefersHighContrast,
    onBreakpoint,
    getViewport,
    respectMotionPreferences,
    applyDarkModePreference,
    setTestId
  };
}

module.exports = {
  initializeAccessibility,
  announceToScreenReader,
  openModal,
  closeModal,
  isMobileDevice,
  prefersReducedMotion,
  prefersDarkMode,
  prefersHighContrast,
  onBreakpoint,
  getViewport,
  respectMotionPreferences,
  applyDarkModePreference,
  setTestId
};
