/**
 * Utility functions for Kisan Connect
 * Includes helpers for validation, logging, and common operations
 */

const crypto = require('crypto');

/**
 * Get current ISO timestamp
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Hash password using SHA256 (Note: Consider upgrading to bcrypt for production)
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate unique ID using timestamp
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now().toString();
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
function isValidPhoneNumber(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Sanitize input to prevent injection attacks
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().slice(0, 500); // Limit to 500 chars
}

/**
 * Log message with timestamp and level
 * @param {string} level - Log level (INFO, ERROR, WARN, DEBUG)
 * @param {string} message - Message to log
 * @param {any} data - Additional data to log
 */
function log(level, message, data = '') {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}] [${level}] ${message}`, data);
}

/**
 * Validate required fields in an object
 * @param {object} obj - Object to validate
 * @param {array} requiredFields - Array of required field names
 * @returns {object} {valid: boolean, errors: array}
 */
function validateRequiredFields(obj, requiredFields) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
      errors.push(`${field} is required`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * API Response formatter
 * @param {number} status - HTTP status code
 * @param {any} data - Response data
 * @param {string} message - Response message
 * @returns {object} Formatted response
 */
function createResponse(status, data = null, message = '') {
  return {
    status,
    message: message || (status === 200 ? 'Success' : 'Error'),
    data,
    timestamp: getTimestamp()
  };
}

module.exports = {
  getTimestamp,
  hashPassword,
  generateId,
  isValidEmail,
  isValidPhoneNumber,
  sanitizeInput,
  log,
  validateRequiredFields,
  createResponse
};
