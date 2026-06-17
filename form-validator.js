/**
 * Frontend Form Validation & UX Utilities
 * Provides client-side form validation and user experience enhancements
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} {valid: boolean, message: string}
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) {
    return { valid: false, message: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {object} {valid: boolean, message: string}
 */
function validatePhone(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleaned = phone.replace(/\D/g, '');
  if (!phone.trim()) {
    return { valid: false, message: 'Phone number is required' };
  }
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, message: 'Please enter a valid 10-digit phone number' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} {valid: boolean, message: string, strength: string}
 */
function validatePassword(password) {
  const errors = [];
  
  if (!password) {
    return { valid: false, message: 'Password is required', strength: 'none' };
  }
  if (password.length < 6) {
    errors.push('at least 6 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('a number');
  }
  
  if (errors.length > 0) {
    const message = `Password must contain ${errors.join(', ')}`;
    const strength = password.length >= 8 && !/[A-Z]/.test(password) === false ? 'medium' : 'weak';
    return { valid: false, message, strength };
  }
  
  return { 
    valid: true, 
    message: 'Strong password', 
    strength: 'strong'
  };
}

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of field for error message
 * @returns {object} {valid: boolean, message: string}
 */
function validateRequired(value, fieldName) {
  if (!value || !value.trim()) {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true, message: '' };
}

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Field name for error message
 * @returns {object} {valid: boolean, message: string}
 */
function validateNumberRange(value, min, max, fieldName) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} must be a number` };
  }
  if (num < min || num > max) {
    return { valid: false, message: `${fieldName} must be between ${min} and ${max}` };
  }
  return { valid: true, message: '' };
}

/**
 * Validate form and return all errors
 * @param {HTMLFormElement} form - Form element to validate
 * @param {object} validators - Object with field names as keys and validation functions as values
 * @returns {object} {valid: boolean, errors: object}
 */
function validateForm(form, validators) {
  const errors = {};
  let isValid = true;
  
  for (const [fieldName, validator] of Object.entries(validators)) {
    const field = form.elements[fieldName];
    if (!field) continue;
    
    const result = validator(field.value);
    if (!result.valid) {
      errors[fieldName] = result.message;
      isValid = false;
      // Add error class to field
      field.classList.add('error');
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.classList.remove('error');
      field.setAttribute('aria-invalid', 'false');
    }
  }
  
  return { valid: isValid, errors };
}

/**
 * Show form error message
 * @param {HTMLElement} field - Input field element
 * @param {string} message - Error message to display
 */
function showFieldError(field, message) {
  field.classList.add('error');
  field.setAttribute('aria-invalid', 'true');
  
  let errorElement = field.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains('error-message')) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    field.parentNode.insertBefore(errorElement, field.nextSibling);
  }
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

/**
 * Clear field errors
 * @param {HTMLElement} field - Input field element
 */
function clearFieldError(field) {
  field.classList.remove('error');
  field.setAttribute('aria-invalid', 'false');
  
  const errorElement = field.nextElementSibling;
  if (errorElement && errorElement.classList.contains('error-message')) {
    errorElement.style.display = 'none';
  }
}

/**
 * Clear all form errors
 * @param {HTMLFormElement} form - Form element
 */
function clearFormErrors(form) {
  const errorElements = form.querySelectorAll('.error-message');
  errorElements.forEach(el => el.style.display = 'none');
  
  const errorFields = form.querySelectorAll('.error');
  errorFields.forEach(field => {
    field.classList.remove('error');
    field.setAttribute('aria-invalid', 'false');
  });
}

/**
 * Show success message
 * @param {HTMLElement} container - Container element
 * @param {string} message - Success message
 * @param {number} duration - Duration to show message (ms)
 */
function showSuccess(container, message, duration = 3000) {
  const successElement = document.createElement('div');
  successElement.className = 'success-message';
  successElement.setAttribute('role', 'status');
  successElement.setAttribute('aria-live', 'polite');
  successElement.textContent = message;
  
  container.appendChild(successElement);
  
  setTimeout(() => {
    successElement.remove();
  }, duration);
}

/**
 * Show error message
 * @param {HTMLElement} container - Container element
 * @param {string} message - Error message
 * @param {number} duration - Duration to show message (ms)
 */
function showError(container, message, duration = 5000) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-alert';
  errorElement.setAttribute('role', 'alert');
  errorElement.setAttribute('aria-live', 'assertive');
  errorElement.textContent = message;
  
  container.appendChild(errorElement);
  
  setTimeout(() => {
    errorElement.remove();
  }, duration);
}

/**
 * Enable/disable form fields
 * @param {HTMLFormElement} form - Form element
 * @param {boolean} enabled - True to enable, false to disable
 */
function setFormEnabled(form, enabled) {
  const fields = form.querySelectorAll('input, textarea, select, button');
  fields.forEach(field => {
    field.disabled = !enabled;
  });
}

/**
 * Reset form and clear errors
 * @param {HTMLFormElement} form - Form element
 */
function resetForm(form) {
  form.reset();
  clearFormErrors(form);
}

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword,
  validateRequired,
  validateNumberRange,
  validateForm,
  showFieldError,
  clearFieldError,
  clearFormErrors,
  showSuccess,
  showError,
  setFormEnabled,
  resetForm
};

// Export for browser use
if (typeof window !== 'undefined') {
  window.FormValidator = {
    validateEmail,
    validatePhone,
    validatePassword,
    validateRequired,
    validateNumberRange,
    validateForm,
    showFieldError,
    clearFieldError,
    clearFormErrors,
    showSuccess,
    showError,
    setFormEnabled,
    resetForm
  };
}
